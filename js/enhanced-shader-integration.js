/**
 * Enhanced Shader Integration for VIB3CODE Home-Master System
 * Enhances existing visualizer instances with vibrant shaders while preserving home-master logic
 */

console.log('🎨 VIB3CODE Enhanced Shader Integration loading...');

// Enhanced fragment shader source with vibrant effects
const ENHANCED_FRAGMENT_SHADER = `
    precision highp float;
    
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_baseColor;
    uniform float u_gridDensity;
    uniform float u_morphFactor;
    uniform float u_dimension;
    uniform float u_glitchIntensity;
    uniform float u_rotationSpeed;
    uniform float u_geometry;
    uniform float u_intensity;
    uniform float u_latticeStyle;
    uniform vec2 u_mouse;
    uniform float u_interactionIntensity;
    
    // 4D rotation matrices for enhanced dimensional effects
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
    
    // Enhanced geometry generators with vibrant spiral effects
    float hypercubeLattice(vec3 p, float gridSize, float style) {
        vec3 grid = fract(p * gridSize);
        vec3 edges = 1.0 - smoothstep(0.0, 0.03, abs(grid - 0.5));
        float lattice = max(max(edges.x, edges.y), edges.z);
        
        // Add spiral tunnel effects
        float spiral = sin(length(p) * 8.0 + u_time * 2.0) * 0.5 + 0.5;
        float tunnel = 1.0 / (1.0 + length(p) * 2.0);
        
        return lattice * (0.6 + 0.4 * spiral) * (0.8 + 0.2 * tunnel);
    }
    
    float tetrahedronLattice(vec3 p, float gridSize, float style) {
        vec3 q = fract(p * gridSize) - 0.5;
        float d1 = length(q);
        float d2 = length(q - vec3(0.5, 0.0, 0.0));
        float d3 = length(q - vec3(0.0, 0.5, 0.0));
        float d4 = length(q - vec3(0.0, 0.0, 0.5));
        float minDist = min(min(d1, d2), min(d3, d4));
        
        float lattice = 1.0 - smoothstep(0.0, 0.1, minDist);
        
        // Enhanced geometric precision with flowing effects
        float flow = sin(p.x * 6.0 + u_time) * cos(p.y * 6.0 + u_time * 0.7) * 0.3 + 0.7;
        return lattice * flow;
    }
    
    float sphereLattice(vec3 p, float gridSize, float style) {
        vec3 q = fract(p * gridSize) - 0.5;
        float r = length(q);
        float lattice = 1.0 - smoothstep(0.2, 0.5, r);
        
        // Infinite potential with radial gradients
        float radial = sin(r * 12.0 + u_time * 3.0) * 0.4 + 0.6;
        float pulse = 0.9 + 0.1 * sin(u_time * 2.0);
        
        return lattice * radial * pulse;
    }
    
    float torusLattice(vec3 p, float gridSize, float style) {
        vec3 q = fract(p * gridSize) - 0.5;
        float r1 = sqrt(q.x*q.x + q.y*q.y);
        float r2 = sqrt((r1 - 0.3)*(r1 - 0.3) + q.z*q.z);
        float lattice = 1.0 - smoothstep(0.0, 0.1, r2);
        
        // Flow patterns for content streams
        float angle = atan(q.y, q.x);
        float flow = sin(angle * 4.0 + u_time * 2.0) * 0.3 + 0.7;
        
        return lattice * flow;
    }
    
    float fractalLattice(vec3 p, float gridSize, float style) {
        vec3 q = p * gridSize;
        float scale = 1.0;
        float fractal = 0.0;
        for(int i = 0; i < 4; i++) {
            q = fract(q) - 0.5;
            fractal += abs(length(q)) / scale;
            scale *= 2.0;
            q *= 2.0;
        }
        float lattice = 1.0 - smoothstep(0.0, 1.0, fractal);
        
        // Recursive complexity visualization
        float complexity = sin(fractal * 4.0 + u_time) * 0.3 + 0.7;
        return lattice * complexity;
    }
    
    float waveLattice(vec3 p, float gridSize, float style) {
        vec3 q = p * gridSize;
        float wave = sin(q.x * 2.0) * sin(q.y * 2.0) * sin(q.z * 2.0 + u_time);
        float lattice = smoothstep(-0.5, 0.5, wave);
        
        // Probability space interference patterns
        float interference = sin(length(q) * 3.0 + u_time * 2.0) * 0.4 + 0.6;
        return lattice * interference;
    }
    
    float getGeometryValue(vec3 p, float gridSize, float geomType, float style) {
        if (geomType < 0.5) return hypercubeLattice(p, gridSize, style);
        else if (geomType < 1.5) return tetrahedronLattice(p, gridSize, style);
        else if (geomType < 2.5) return sphereLattice(p, gridSize, style);
        else if (geomType < 3.5) return torusLattice(p, gridSize, style);
        else if (geomType < 4.5) return fractalLattice(p, gridSize, style);
        else return waveLattice(p, gridSize, style);
    }
    
    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float aspectRatio = u_resolution.x / u_resolution.y;
        uv.x *= aspectRatio;
        
        vec2 center = vec2(0.5 * aspectRatio, 0.5);
        vec3 p = vec3(uv - center, 0.0);
        
        // Enhanced interaction-driven rotation
        float timeRotation = u_time * 0.2 * u_rotationSpeed * (1.0 + u_intensity);
        mat2 rotation = mat2(cos(timeRotation), -sin(timeRotation), sin(timeRotation), cos(timeRotation));
        p.xy = rotation * p.xy;
        p.z = sin(u_time * 0.1) * 0.5;
        
        // Apply 4D transformations for dimensional shifts
        if (u_dimension > 3.0) {
            float w = sin(length(p) * 3.0 + u_time * 0.3) * (u_dimension - 3.0) * (1.0 + u_intensity * 0.5);
            vec4 p4d = vec4(p, w);
            
            p4d = rotateXW(timeRotation * 0.31) * p4d;
            p4d = rotateYW(timeRotation * 0.27) * p4d;
            p4d = rotateZW(timeRotation * 0.23) * p4d;
            
            p = project4Dto3D(p4d);
        }
        
        // Dynamic grid density based on interaction
        float dynamicGridDensity = u_gridDensity * (1.0 + u_intensity * 0.3);
        
        // Get geometry value
        float lattice = getGeometryValue(p, dynamicGridDensity, u_geometry, u_latticeStyle);
        
        // Enhanced chromatic aberration glitch effects
        float glitchAmount = u_glitchIntensity * (0.1 + 0.1 * sin(u_time * 5.0)) * (1.0 + u_intensity);
        
        vec2 rOffset = vec2(glitchAmount, glitchAmount * 0.5);
        vec2 gOffset = vec2(-glitchAmount * 0.3, glitchAmount * 0.2);
        vec2 bOffset = vec2(glitchAmount * 0.1, -glitchAmount * 0.4);
        
        float r = getGeometryValue(vec3(p.xy + rOffset, p.z), dynamicGridDensity, u_geometry, u_latticeStyle);
        float g = getGeometryValue(vec3(p.xy + gOffset, p.z), dynamicGridDensity, u_geometry, u_latticeStyle);
        float b = getGeometryValue(vec3(p.xy + bOffset, p.z), dynamicGridDensity, u_geometry, u_latticeStyle);
        
        // Enhanced color mixing with vibrant gradients
        vec3 baseColor = vec3(0.02, 0.05, 0.1);
        vec3 latticeColor = u_baseColor * (0.8 + 0.2 * u_intensity);
        
        // Create rich gradients like reference site
        vec3 gradientMod = vec3(
            1.0 + 0.4 * sin(u_time + length(p) * 2.0),
            1.0 + 0.4 * sin(u_time * 1.3 + length(p) * 2.5),
            1.0 + 0.4 * sin(u_time * 0.7 + length(p) * 1.8)
        );
        
        latticeColor *= gradientMod;
        
        vec3 color = mix(baseColor, latticeColor, vec3(r, g, b));
        
        // Enhanced glow and vibrancy
        color += u_baseColor * 0.2 * (0.5 + 0.5 * sin(u_time * 0.5)) * u_intensity;
        
        // Enhanced tunnel/spiral effects for depth
        float depth = 1.0 + sin(length(p) * 10.0 + u_time * 3.0) * 0.3;
        color *= depth;
        
        // Enhanced vignette with interactive center
        float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - center));
        color *= vignette;
        
        // Enhanced alpha for better blending
        float alpha = (lattice * u_intensity * 0.85) + 0.15;
        
        gl_FragColor = vec4(color, alpha);
    }
`;

// Function to enhance existing visualizer instance with vibrant shaders
function enhanceInstanceWithVibrantShaders(instance) {
    if (!instance.gl || !instance.setupShaders) {
        console.warn(`⚠️ Instance ${instance.id} cannot be enhanced - missing WebGL context or setupShaders method`);
        return;
    }
    
    console.log(`🎨 Enhancing ${instance.id} with vibrant shaders...`);
    
    // Store original method
    const originalSetupShaders = instance.setupShaders.bind(instance);
    
    // Replace setupShaders with enhanced version
    instance.setupShaders = function() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Use enhanced fragment shader
        const fragmentShaderSource = ENHANCED_FRAGMENT_SHADER;
        
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(vertexShader, fragmentShader);
        
        // Setup geometry
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Get uniform locations (enhanced set)
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
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity'),
            latticeStyle: this.gl.getUniformLocation(this.program, 'u_latticeStyle'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            interactionIntensity: this.gl.getUniformLocation(this.program, 'u_interactionIntensity')
        };
        
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
        
        console.log(`✅ Enhanced shaders applied to ${this.id}`);
    };
    
    // Re-initialize shaders with enhanced version
    instance.setupShaders();
    
    // Enhance render method to use new uniforms
    const originalRender = instance.render ? instance.render.bind(instance) : null;
    if (originalRender) {
        instance.render = function() {
            if (!this.gl || !this.program) return;
            
            this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.useProgram(this.program);
            
            // Enable blending for multi-layer effects
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            
            // Setup vertex attributes
            this.gl.enableVertexAttribArray(this.positionAttributeLocation);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
            this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
            
            // Set enhanced uniforms
            this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
            this.gl.uniform1f(this.uniforms.time, this.time);
            this.gl.uniform2f(this.uniforms.mouse, 0.5, 0.5); // Default center
            this.gl.uniform3fv(this.uniforms.baseColor, this.currentComputedConfig.baseColor);
            this.gl.uniform1f(this.uniforms.gridDensity, this.currentComputedConfig.gridDensity);
            this.gl.uniform1f(this.uniforms.morphFactor, this.currentComputedConfig.morphFactor);
            this.gl.uniform1f(this.uniforms.dimension, this.currentComputedConfig.dimension);
            this.gl.uniform1f(this.uniforms.glitchIntensity, this.currentComputedConfig.glitchIntensity);
            this.gl.uniform1f(this.uniforms.rotationSpeed, this.currentComputedConfig.rotationSpeed);
            this.gl.uniform1f(this.uniforms.geometry, this.currentComputedConfig.geometry);
            this.gl.uniform1f(this.uniforms.intensity, this.currentComputedConfig.intensity);
            this.gl.uniform1f(this.uniforms.latticeStyle, this.currentComputedConfig.latticeStyle || 1.0);
            this.gl.uniform1f(this.uniforms.interactionIntensity, this.currentComputedConfig.intensity || 0.5);
            
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        };
    }
}

// Integration with home-master system
window.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 DOM loaded, waiting for home-master system...');
    
    // Wait for home-master system to initialize
    const waitForHomeMaster = () => {
        if (typeof window.visualizerManager !== 'undefined') {
            console.log('✅ Found home-master VisualizerManager, enhancing with vibrant shaders...');
            
            const manager = window.visualizerManager;
            
            // Enhance all existing instances
            Object.values(manager.instances).forEach(instance => {
                if (instance && instance.setupShaders) {
                    enhanceInstanceWithVibrantShaders(instance);
                }
            });
            
            console.log('🎨 Enhanced Shader Integration complete!');
            console.log('🔄 Home-master derivation logic preserved');
            console.log('✨ Vibrant spiral/tunnel effects added');
            console.log('🌈 Chromatic aberration and gradient effects active');
            
        } else {
            console.log('⏳ Waiting for home-master system...');
            setTimeout(waitForHomeMaster, 500);
        }
    };
    
    waitForHomeMaster();
});

console.log('✅ Enhanced Shader Integration loaded and ready');