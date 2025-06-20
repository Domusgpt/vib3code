/**
 * VIB3CODE HOME-MASTER ENHANCED INTEGRATION
 * 
 * Properly integrates the home-master system with enhanced 4D shaders
 * Each section gets FIXED geometry + parameters derived from home master
 */

console.log('🏠 VIB3CODE Home-Master Enhanced System loading...');

// Enhanced 4D visualizer with proper home-master integration
class VIB3EnhancedVisualizer {
    constructor(canvas, sectionConfig) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        this.sectionConfig = sectionConfig;
        this.time = 0;
        this.animationId = null;
        
        if (!this.gl) {
            console.error('❌ WebGL not supported, creating fallback 2D canvas');
            this.create2DFallback();
            return;
        }
        
        this.setupEnhancedShaders();
        this.resize();
        this.start();
    }
    
    setupEnhancedShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // ENHANCED 4D FRAGMENT SHADER with proper geometry mapping
        const fragmentShaderSource = `
            precision mediump float;
            
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
            
            // 4D rotation matrices for PROPER 4D polytopal math
            mat4 rotateXW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(
                    c, 0.0, 0.0, -s,
                    0.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, 1.0, 0.0,
                    s, 0.0, 0.0, c
                );
            }
            
            mat4 rotateYW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(
                    1.0, 0.0, 0.0, 0.0,
                    0.0, c, 0.0, -s,
                    0.0, 0.0, 1.0, 0.0,
                    0.0, s, 0.0, c
                );
            }
            
            vec3 project4Dto3D(vec4 p) {
                float w = 2.0 / (2.0 + p.w);
                return vec3(p.x * w, p.y * w, p.z * w);
            }
            
            // PROPER 4D POLYTOPAL GEOMETRIES with vibrant effects
            float hypercubeLattice(vec3 p, float gridSize) {
                // 4D hypercube edges projected to 3D with spiral effects
                vec3 grid = fract(p * gridSize);
                vec3 edges = 1.0 - smoothstep(0.0, 0.02, abs(grid - 0.5));
                float lattice = max(max(edges.x, edges.y), edges.z);
                
                // Hypercube-specific spiral tunnel
                float r = length(p);
                float spiral = sin(r * 8.0 + u_time * 2.0) * 0.4 + 0.6;
                float tunnel = 1.0 / (1.0 + r * 1.5);
                
                return lattice * spiral * (0.7 + 0.3 * tunnel);
            }
            
            float tetrahedronLattice(vec3 p, float gridSize) {
                // 4D simplex (tetrahedron) with technical precision
                vec3 q = fract(p * gridSize) - 0.5;
                float d1 = length(q);
                float d2 = length(q - vec3(0.5, 0.0, 0.0));
                float d3 = length(q - vec3(0.0, 0.5, 0.0));
                float d4 = length(q - vec3(0.0, 0.0, 0.5));
                float minDist = min(min(d1, d2), min(d3, d4));
                
                float lattice = 1.0 - smoothstep(0.0, 0.08, minDist);
                
                // Technical precision flow
                float precision = sin(p.x * 8.0 + u_time * 0.8) * cos(p.y * 8.0 + u_time * 0.6) * 0.2 + 0.8;
                return lattice * precision;
            }
            
            float sphereLattice(vec3 p, float gridSize) {
                // 4D sphere (infinite potential)
                vec3 q = fract(p * gridSize) - 0.5;
                float r = length(q);
                float lattice = 1.0 - smoothstep(0.15, 0.45, r);
                
                // Infinite potential radial waves
                float potential = sin(r * 15.0 + u_time * 4.0) * 0.3 + 0.7;
                float pulse = 0.8 + 0.2 * sin(u_time * 2.5);
                
                return lattice * potential * pulse;
            }
            
            float torusLattice(vec3 p, float gridSize) {
                // 4D torus (continuous flow)
                vec3 q = fract(p * gridSize) - 0.5;
                float r1 = sqrt(q.x*q.x + q.y*q.y);
                float r2 = sqrt((r1 - 0.25)*(r1 - 0.25) + q.z*q.z);
                float lattice = 1.0 - smoothstep(0.0, 0.08, r2);
                
                // Flow patterns
                float angle = atan(q.y, q.x);
                float flow = sin(angle * 6.0 + u_time * 3.0) * 0.25 + 0.75;
                
                return lattice * flow;
            }
            
            float waveLattice(vec3 p, float gridSize) {
                // 4D wave function (probability spaces)
                vec3 q = p * gridSize;
                float wave1 = sin(q.x * 2.5) * sin(q.y * 2.5) * sin(q.z * 2.5 + u_time * 1.5);
                float wave2 = cos(q.x * 1.8 + u_time) * cos(q.y * 1.8 + u_time * 0.7);
                float wave = (wave1 + wave2) * 0.5;
                float lattice = smoothstep(-0.3, 0.3, wave);
                
                // Probability interference
                float interference = sin(length(q) * 4.0 + u_time * 2.2) * 0.3 + 0.7;
                return lattice * interference;
            }
            
            float getGeometryValue(vec3 p, float gridSize, float geomType) {
                if (geomType < 0.5) return hypercubeLattice(p, gridSize);
                else if (geomType < 1.5) return tetrahedronLattice(p, gridSize);
                else if (geomType < 2.5) return sphereLattice(p, gridSize);
                else if (geomType < 3.5) return torusLattice(p, gridSize);
                else return waveLattice(p, gridSize);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                float aspectRatio = u_resolution.x / u_resolution.y;
                uv.x *= aspectRatio;
                
                vec2 center = vec2(0.5 * aspectRatio, 0.5);
                vec3 p = vec3(uv - center, 0.0);
                
                // 4D rotation with proper polytopal math
                float timeRotation = u_time * 0.15 * u_rotationSpeed;
                float cosRot = cos(timeRotation);
                float sinRot = sin(timeRotation);
                mat2 rotation = mat2(cosRot, -sinRot, sinRot, cosRot);
                p.xy = rotation * p.xy;
                p.z = sin(u_time * 0.08) * 0.3;
                
                // Apply 4D transformations
                if (u_dimension > 3.0) {
                    float w = sin(length(p) * 4.0 + u_time * 0.25) * (u_dimension - 3.0);
                    vec4 p4d = vec4(p, w);
                    
                    p4d = rotateXW(timeRotation * 0.4) * p4d;
                    p4d = rotateYW(timeRotation * 0.3) * p4d;
                    
                    p = project4Dto3D(p4d);
                }
                
                // Get geometry value with proper morphing
                float dynamicGridDensity = u_gridDensity * (0.8 + 0.2 * u_morphFactor);
                float lattice = getGeometryValue(p, dynamicGridDensity, u_geometry);
                
                // Enhanced chromatic aberration
                float glitchAmount = u_glitchIntensity * (0.08 + 0.05 * sin(u_time * 6.0));
                
                vec2 rOffset = vec2(glitchAmount, glitchAmount * 0.6);
                vec2 gOffset = vec2(-glitchAmount * 0.4, glitchAmount * 0.3);
                vec2 bOffset = vec2(glitchAmount * 0.2, -glitchAmount * 0.5);
                
                float r = getGeometryValue(vec3(p.xy + rOffset, p.z), dynamicGridDensity, u_geometry);
                float g = getGeometryValue(vec3(p.xy + gOffset, p.z), dynamicGridDensity, u_geometry);
                float b = getGeometryValue(vec3(p.xy + bOffset, p.z), dynamicGridDensity, u_geometry);
                
                // Enhanced color with vibrant gradients
                vec3 baseColor = vec3(0.01, 0.02, 0.05);
                vec3 latticeColor = u_baseColor;
                
                // Rich gradient modulation like reference site
                vec3 gradientMod = vec3(
                    1.0 + 0.5 * sin(u_time * 0.8 + length(p) * 3.0),
                    1.0 + 0.5 * sin(u_time * 1.1 + length(p) * 2.5),
                    1.0 + 0.5 * sin(u_time * 0.6 + length(p) * 3.5)
                );
                
                latticeColor *= gradientMod;
                
                vec3 color = mix(baseColor, latticeColor, vec3(r, g, b));
                
                // Enhanced glow
                color += u_baseColor * 0.15 * (0.6 + 0.4 * sin(u_time * 0.4)) * u_intensity;
                
                // Enhanced depth effects
                float depth = 1.0 + sin(length(p) * 12.0 + u_time * 4.0) * 0.25;
                color *= depth;
                
                // Vignette
                float vignette = 1.0 - smoothstep(0.2, 1.0, length(uv - center));
                color *= vignette;
                
                gl_FragColor = vec4(color, (lattice * u_intensity * 0.9) + 0.1);
            }
        `;
        
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(vertexShader, fragmentShader);
        
        // Setup geometry
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
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity')
        };
        
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const log = this.gl.getShaderInfoLog(shader);
            console.error('Enhanced 4D shader compile error:', log);
            console.error('Shader source:', source);
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
            console.error('Enhanced 4D program link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    // Map geometry names to numbers
    getGeometryNumber(geometryName) {
        const geometryMap = {
            'hypercube': 0,
            'tetrahedron': 1,
            'sphere': 2,
            'torus': 3,
            'wave': 4
        };
        return geometryMap[geometryName] || 0;
    }
    
    // Update visualizer with new section config
    updateConfig(sectionConfig) {
        this.sectionConfig = sectionConfig;
        console.log(`🎨 Updated visualizer config for ${sectionConfig.geometry}:`, sectionConfig);
    }
    
    resize() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    render() {
        if (this.fallbackMode) {
            this.render2DFallback();
            return;
        }
        
        if (!this.gl || !this.program || !this.sectionConfig) return;
        
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.program);
        
        // Enable blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        // Setup vertex attributes
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        // Set uniforms from section config
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform3f(this.uniforms.baseColor, 
            this.sectionConfig.hue || 1.0, 
            this.sectionConfig.saturation || 0.0, 
            this.sectionConfig.brightness || 1.0);
        this.gl.uniform1f(this.uniforms.gridDensity, this.sectionConfig.gridDensity || 12.0);
        this.gl.uniform1f(this.uniforms.morphFactor, this.sectionConfig.morphFactor || 0.5);
        this.gl.uniform1f(this.uniforms.dimension, this.sectionConfig.dimension || 3.5);
        this.gl.uniform1f(this.uniforms.glitchIntensity, this.sectionConfig.glitchIntensity || 0.3);
        this.gl.uniform1f(this.uniforms.rotationSpeed, this.sectionConfig.rotationSpeed || 0.5);
        this.gl.uniform1f(this.uniforms.geometry, this.getGeometryNumber(this.sectionConfig.geometry));
        this.gl.uniform1f(this.uniforms.intensity, 0.8);
        
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    
    animate() {
        if (!this.animationId) return;
        
        this.time += 0.016;
        this.render();
        this.resize(); // Handle window resize
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    start() {
        if (this.animationId) return;
        this.animationId = true;
        this.animate();
    }
    
    create2DFallback() {
        console.log('🎨 Creating 2D fallback visualizer...');
        this.ctx = this.canvas.getContext('2d');
        this.fallbackMode = true;
        this.start();
    }
    
    render2DFallback() {
        if (!this.ctx || !this.sectionConfig) return;
        
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        
        // Simple geometric patterns based on section
        this.ctx.strokeStyle = `hsl(${(this.sectionConfig.hue || 0.5) * 360}, 70%, 60%)`;
        this.ctx.lineWidth = 2;
        
        const centerX = width / 2;
        const centerY = height / 2;
        const time = this.time * 0.001;
        
        // Draw based on geometry type
        if (this.sectionConfig.geometry === 'hypercube') {
            // Rotating squares
            for (let i = 0; i < 5; i++) {
                this.ctx.save();
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(time * 0.5 + i * 0.2);
                const size = 50 + i * 30;
                this.ctx.strokeRect(-size/2, -size/2, size, size);
                this.ctx.restore();
            }
        } else if (this.sectionConfig.geometry === 'tetrahedron') {
            // Triangle patterns
            for (let i = 0; i < 3; i++) {
                this.ctx.save();
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(time * 0.3 + i * Math.PI * 2 / 3);
                this.ctx.beginPath();
                this.ctx.moveTo(0, -50 - i * 20);
                this.ctx.lineTo(-43 - i * 17, 25 + i * 10);
                this.ctx.lineTo(43 + i * 17, 25 + i * 10);
                this.ctx.closePath();
                this.ctx.stroke();
                this.ctx.restore();
            }
        } else {
            // Default circles
            for (let i = 0; i < 8; i++) {
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, 20 + i * 15, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }
    
    stop() {
        if (this.animationId) {
            this.animationId = null;
        }
    }
}

// Main integration system
class VIB3HomeMasterIntegration {
    constructor() {
        this.homeMasterSystem = new HomeBasedReactiveSystem();
        this.currentVisualizer = null;
        this.currentSection = 'home';
        this.mainCanvas = null;
        
        this.init();
    }
    
    init() {
        console.log('🏠 Initializing VIB3CODE Home-Master Enhanced System...');
        
        // Create main canvas for visualizer
        this.createMainCanvas();
        
        // Set up home-master system
        this.homeMasterSystem.onChange((allConfigs) => {
            this.updateVisualizerConfig(allConfigs);
        });
        
        // Set up section detection
        this.setupSectionDetection();
        
        // Load initial configuration
        this.homeMasterSystem.randomizeHome();
        
        console.log('✅ VIB3CODE Home-Master Enhanced System ready');
        console.log('🔄 Section-based geometry switching: home=hypercube, articles=tetrahedron, videos=sphere, podcasts=torus, ema=wave');
    }
    
    createMainCanvas() {
        // Create main background canvas
        this.mainCanvas = document.createElement('canvas');
        this.mainCanvas.id = 'vib3-home-master-canvas';
        this.mainCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1;
            pointer-events: none;
            background: transparent;
        `;
        document.body.insertBefore(this.mainCanvas, document.body.firstChild);
        
        // Initialize visualizer with home config
        const homeConfig = this.homeMasterSystem.getSectionConfig('home');
        this.currentVisualizer = new VIB3EnhancedVisualizer(this.mainCanvas, homeConfig);
    }
    
    setupSectionDetection() {
        // Listen for navigation clicks
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-section]');
            if (navLink) {
                const sectionId = navLink.dataset.section;
                if (sectionId && sectionId !== this.currentSection) {
                    this.switchToSection(sectionId);
                }
            }
        });
        
        // Also observe sections for scroll-based detection
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                    const sectionId = entry.target.id.replace('section-', '');
                    if (sectionId && sectionId !== this.currentSection) {
                        this.switchToSection(sectionId);
                    }
                }
            });
        }, { threshold: 0.6 });
        
        // Observe all sections
        document.querySelectorAll('[id^="section-"]').forEach(section => {
            observer.observe(section);
        });
    }
    
    switchToSection(sectionId) {
        console.log(`🔄 Home-Master switching to section: ${sectionId.toUpperCase()}`);
        this.currentSection = sectionId;
        
        // Get derived config from home-master system
        const sectionConfig = this.homeMasterSystem.getSectionConfig(sectionId);
        
        if (sectionConfig && this.currentVisualizer) {
            console.log(`🎨 Applying ${sectionConfig.geometry} geometry with derived parameters`);
            this.currentVisualizer.updateConfig(sectionConfig);
        }
    }
    
    updateVisualizerConfig(allConfigs) {
        if (this.currentVisualizer && allConfigs[this.currentSection]) {
            this.currentVisualizer.updateConfig(allConfigs[this.currentSection]);
        }
    }
}

// Initialize when DOM loads
window.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 DOM loaded, waiting for home-master system...');
    
    // Wait for home-master system to be available
    const waitForHomeMaster = () => {
        if (typeof HomeBasedReactiveSystem !== 'undefined') {
            console.log('✅ HomeBasedReactiveSystem found, initializing VIB3CODE integration...');
            
            window.vib3HomeMasterIntegration = new VIB3HomeMasterIntegration();
            
            // COMPATIBILITY: Create visualizerManager interface for existing router
            window.visualizerManager = {
                applyMasterStyle: (sectionKey) => {
                    console.log(`🔄 Router requesting section: ${sectionKey}`);
                    window.vib3HomeMasterIntegration.switchToSection(sectionKey);
                },
                getCurrentMasterStyleKey: () => window.vib3HomeMasterIntegration.currentSection,
                isInTransition: () => false // Simple implementation
            };
            
            // Expose for debugging
            window.debugVIB3HomeMaster = {
                switchSection: (sectionId) => window.vib3HomeMasterIntegration.switchToSection(sectionId),
                randomizeHome: () => window.vib3HomeMasterIntegration.homeMasterSystem.randomizeHome(),
                getCurrentConfig: () => window.vib3HomeMasterIntegration.homeMasterSystem.getSectionConfig(
                    window.vib3HomeMasterIntegration.currentSection
                )
            };
            
            console.log('🎮 Debug commands available:');
            console.log('   window.debugVIB3HomeMaster.switchSection("articles")');
            console.log('   window.debugVIB3HomeMaster.randomizeHome()');
            
        } else {
            console.log('⏳ Waiting for HomeBasedReactiveSystem...');
            setTimeout(waitForHomeMaster, 500);
        }
    };
    
    waitForHomeMaster();
});

console.log('✅ VIB3CODE Home-Master Enhanced Integration loaded');