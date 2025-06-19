/**
 * WORKING 4D HYPERAV CORE - DIRECT FROM DEMO
 * 
 * This is the exact working ReactiveHyperAVCore from the vibrant demo
 * that we know works without shader compilation errors.
 */

class Working4DHyperAV {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        this.time = 0;
        this.animationId = null;
        this.currentTheme = 'hypercube';
        
        // Theme configurations from working demo
        this.themeConfigs = {
            hypercube: {
                baseColor: [1.0, 0.0, 1.0],
                gridDensity: 12.0,
                morphFactor: 0.5,
                dimension: 3.5,
                glitchIntensity: 0.3,
                rotationSpeed: 0.5,
                geometry: 0
            },
            tetrahedron: {
                baseColor: [0.0, 1.0, 1.0],
                gridDensity: 8.0,
                morphFactor: 0.3,
                dimension: 3.2,
                glitchIntensity: 0.1,
                rotationSpeed: 0.3,
                geometry: 1
            },
            sphere: {
                baseColor: [1.0, 1.0, 0.0],
                gridDensity: 15.0,
                morphFactor: 0.7,
                dimension: 3.8,
                glitchIntensity: 0.2,
                rotationSpeed: 0.4,
                geometry: 2
            },
            torus: {
                baseColor: [0.0, 1.0, 0.0],
                gridDensity: 10.0,
                morphFactor: 0.6,
                dimension: 3.3,
                glitchIntensity: 0.4,
                rotationSpeed: 0.6,
                geometry: 3
            },
            fractal: {
                baseColor: [0.5, 0.0, 1.0],
                gridDensity: 20.0,
                morphFactor: 0.9,
                dimension: 3.6,
                glitchIntensity: 0.6,
                rotationSpeed: 0.2,
                geometry: 5
            }
        };
        
        this.config = this.themeConfigs[this.currentTheme];
        
        // Interaction state
        this.interactionState = {
            type: 'idle',
            intensity: 0,
            mouseX: 0.5,
            mouseY: 0.5,
            scrollVelocity: 0
        };
        
        this.init();
    }
    
    init() {
        if (!this.gl) {
            console.error('WebGL not supported');
            return false;
        }
        
        this.setupShaders();
        this.setupInteraction();
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        return true;
    }
    
    setupShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // EXACT working fragment shader from demo
        const fragmentShaderSource = `
          precision highp float;
          
          uniform vec2 u_resolution;
          uniform float u_time;
          uniform vec2 u_mouse;
          uniform float u_morphFactor;
          uniform float u_glitchIntensity;
          uniform float u_rotationSpeed;
          uniform float u_dimension;
          uniform float u_gridDensity;
          uniform vec3 u_baseColor;
          uniform float u_interactionIntensity;
          uniform float u_geometry;
          
          // 4D rotation matrices
          mat4 rotateXW(float theta) {
            float c = cos(theta);
            float s = sin(theta);
            return mat4(c, 0, 0, -s, 0, 1, 0, 0, 0, 0, 1, 0, s, 0, 0, c);
          }
          
          mat4 rotateYW(float theta) {
            float c = cos(theta);
            float s = sin(theta);
            return mat4(1, 0, 0, 0, 0, c, 0, -s, 0, 0, 1, 0, 0, s, 0, c);
          }
          
          mat4 rotateZW(float theta) {
            float c = cos(theta);
            float s = sin(theta);
            return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, c, -s, 0, 0, s, c);
          }
          
          vec3 project4Dto3D(vec4 p) {
            float w = 2.0 / (2.0 + p.w);
            return vec3(p.x * w, p.y * w, p.z * w);
          }
          
          // Geometry generators
          float hypercubeLattice(vec3 p, float gridSize) {
            vec3 grid = fract(p * gridSize);
            vec3 edges = 1.0 - smoothstep(0.0, 0.03, abs(grid - 0.5));
            return max(max(edges.x, edges.y), edges.z);
          }
          
          float tetrahedronLattice(vec3 p, float gridSize) {
            vec3 q = fract(p * gridSize) - 0.5;
            float d1 = length(q);
            float d2 = length(q - vec3(0.5, 0.0, 0.0));
            float d3 = length(q - vec3(0.0, 0.5, 0.0));
            float d4 = length(q - vec3(0.0, 0.0, 0.5));
            return 1.0 - smoothstep(0.0, 0.1, min(min(d1, d2), min(d3, d4)));
          }
          
          float sphereLattice(vec3 p, float gridSize) {
            vec3 q = fract(p * gridSize) - 0.5;
            float r = length(q);
            return 1.0 - smoothstep(0.2, 0.5, r);
          }
          
          float torusLattice(vec3 p, float gridSize) {
            vec3 q = fract(p * gridSize) - 0.5;
            float r1 = sqrt(q.x*q.x + q.y*q.y);
            float r2 = sqrt((r1 - 0.3)*(r1 - 0.3) + q.z*q.z);
            return 1.0 - smoothstep(0.0, 0.1, r2);
          }
          
          float fractalLattice(vec3 p, float gridSize) {
            vec3 q = p * gridSize;
            float scale = 1.0;
            float fractal = 0.0;
            for(int i = 0; i < 4; i++) {
              q = fract(q) - 0.5;
              fractal += abs(length(q)) / scale;
              scale *= 2.0;
              q *= 2.0;
            }
            return 1.0 - smoothstep(0.0, 1.0, fractal);
          }
          
          float getGeometryValue(vec3 p, float gridSize, float geomType) {
            if (geomType < 0.5) return hypercubeLattice(p, gridSize);
            else if (geomType < 1.5) return tetrahedronLattice(p, gridSize);
            else if (geomType < 2.5) return sphereLattice(p, gridSize);
            else if (geomType < 3.5) return torusLattice(p, gridSize);
            else return fractalLattice(p, gridSize);
          }
          
          void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            float aspectRatio = u_resolution.x / u_resolution.y;
            uv.x *= aspectRatio;
            
            vec2 center = vec2(u_mouse.x * aspectRatio, u_mouse.y);
            vec3 p = vec3(uv - center, 0.0);
            
            // Interaction-driven rotation
            float timeRotation = u_time * 0.2 * u_rotationSpeed * (1.0 + u_interactionIntensity);
            mat2 rotation = mat2(cos(timeRotation), -sin(timeRotation), sin(timeRotation), cos(timeRotation));
            p.xy = rotation * p.xy;
            p.z = sin(u_time * 0.1) * 0.5;
            
            // Apply 4D transformations
            if (u_dimension > 3.0) {
              float w = sin(length(p) * 3.0 + u_time * 0.3) * (u_dimension - 3.0) * (1.0 + u_interactionIntensity * 0.5);
              vec4 p4d = vec4(p, w);
              
              p4d = rotateXW(timeRotation * 0.31) * p4d;
              p4d = rotateYW(timeRotation * 0.27) * p4d;
              p4d = rotateZW(timeRotation * 0.23) * p4d;
              
              p = project4Dto3D(p4d);
            }
            
            // Dynamic grid density
            float dynamicGridDensity = u_gridDensity * (1.0 + u_interactionIntensity * 0.3);
            
            // Get geometry value
            float lattice = getGeometryValue(p, dynamicGridDensity, u_geometry);
            
            // Glitch effects
            float glitchAmount = u_glitchIntensity * (0.1 + 0.1 * sin(u_time * 5.0)) * (1.0 + u_interactionIntensity);
            
            vec2 rOffset = vec2(glitchAmount, glitchAmount * 0.5);
            vec2 gOffset = vec2(-glitchAmount * 0.3, glitchAmount * 0.2);
            vec2 bOffset = vec2(glitchAmount * 0.1, -glitchAmount * 0.4);
            
            float r = getGeometryValue(vec3(p.xy + rOffset, p.z), dynamicGridDensity, u_geometry);
            float g = getGeometryValue(vec3(p.xy + gOffset, p.z), dynamicGridDensity, u_geometry);
            float b = getGeometryValue(vec3(p.xy + bOffset, p.z), dynamicGridDensity, u_geometry);
            
            // Colors
            vec3 baseColor = vec3(0.02, 0.05, 0.1);
            vec3 latticeColor = u_baseColor * (0.8 + 0.2 * u_interactionIntensity);
            
            vec3 color = mix(baseColor, latticeColor, vec3(r, g, b));
            
            // Interaction glow
            color += u_baseColor * 0.1 * (0.5 + 0.5 * sin(u_time * 0.5)) * u_interactionIntensity;
            
            // Vignette
            float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - vec2(center.x, center.y)));
            color *= vignette;
            
            gl_FragColor = vec4(color, 0.95);
          }
        `;
        
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        this.program = this.createProgram(vertexShader, fragmentShader);
        
        // Setup vertex buffer
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Get uniform locations
        this.uniforms = {
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            baseColor: this.gl.getUniformLocation(this.program, 'u_baseColor'),
            gridDensity: this.gl.getUniformLocation(this.program, 'u_gridDensity'),
            morphFactor: this.gl.getUniformLocation(this.program, 'u_morphFactor'),
            dimension: this.gl.getUniformLocation(this.program, 'u_dimension'),
            glitchIntensity: this.gl.getUniformLocation(this.program, 'u_glitchIntensity'),
            rotationSpeed: this.gl.getUniformLocation(this.program, 'u_rotationSpeed'),
            geometry: this.gl.getUniformLocation(this.program, 'u_geometry'),
            interactionIntensity: this.gl.getUniformLocation(this.program, 'u_interactionIntensity'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse')
        };
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    setupInteraction() {
        // Mouse tracking
        document.addEventListener('mousemove', (e) => {
            this.interactionState.mouseX = e.clientX / window.innerWidth;
            this.interactionState.mouseY = 1.0 - (e.clientY / window.innerHeight);
            this.interactionState.type = 'move';
            this.interactionState.intensity = 0.5;
        });
        
        // Scroll tracking
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            this.interactionState.scrollVelocity = Math.abs(currentScrollY - lastScrollY);
            this.interactionState.intensity = Math.min(this.interactionState.scrollVelocity * 0.01, 1.0);
            lastScrollY = currentScrollY;
            
            // Decay
            setTimeout(() => {
                this.interactionState.intensity *= 0.9;
            }, 100);
        });
    }
    
    switchToTheme(themeName, duration = 1000) {
        if (this.themeConfigs[themeName]) {
            this.currentTheme = themeName;
            this.config = this.themeConfigs[themeName];
            console.log(`🎨 Switched to theme: ${themeName}`);
        }
    }
    
    render() {
        this.time = performance.now() * 0.001;
        
        // Clear
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.02, 0.02, 0.08, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        this.gl.useProgram(this.program);
        
        // Set uniforms
        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform3fv(this.uniforms.baseColor, this.config.baseColor);
        this.gl.uniform1f(this.uniforms.gridDensity, this.config.gridDensity);
        this.gl.uniform1f(this.uniforms.morphFactor, this.config.morphFactor);
        this.gl.uniform1f(this.uniforms.dimension, this.config.dimension);
        this.gl.uniform1f(this.uniforms.glitchIntensity, this.config.glitchIntensity);
        this.gl.uniform1f(this.uniforms.rotationSpeed, this.config.rotationSpeed);
        this.gl.uniform1f(this.uniforms.geometry, this.config.geometry);
        this.gl.uniform1f(this.uniforms.interactionIntensity, this.interactionState.intensity);
        this.gl.uniform2f(this.uniforms.mouse, this.interactionState.mouseX, this.interactionState.mouseY);
        
        // Draw
        const positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        this.animationId = requestAnimationFrame(() => this.render());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    start() {
        if (!this.animationId) {
            this.render();
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Export for global use
window.Working4DHyperAV = Working4DHyperAV;