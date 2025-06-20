/**
 * VIB3CODE HOME-MASTER ENHANCED INTEGRATION
 * 
 * Properly integrates the home-master system with enhanced 4D shaders
 * Each section gets FIXED geometry + parameters derived from home master
 */

console.log('🏠 VIB3CODE Home-Master Enhanced System loading...');
console.log('🔧 Script successfully parsed and executing...');

// Enhanced 4D visualizer with proper home-master integration
console.log('🎨 Creating VIB3EnhancedVisualizer class...');
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
                return mat4(c, 0.0, 0.0, -s, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, s, 0.0, 0.0, c);
            }
            
            mat4 rotateYW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, 0.0, -s, 0.0, 0.0, 1.0, 0.0, 0.0, s, 0.0, c);
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
                float precisionFlow = sin(p.x * 8.0 + u_time * 0.8) * cos(p.y * 8.0 + u_time * 0.6) * 0.2 + 0.8;
                return lattice * precisionFlow;
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
                
                // Enhanced color with vibrant gradients - BOOST VIBRANCY
                vec3 baseColor = vec3(0.05, 0.08, 0.15); // Brighter base
                vec3 latticeColor = u_baseColor * 2.5; // MASSIVE color boost
                
                // Rich gradient modulation like reference site - BOOST AMPLITUDE
                vec3 gradientMod = vec3(
                    1.0 + 1.5 * sin(u_time * 0.8 + length(p) * 3.0), // 3x amplitude
                    1.0 + 1.5 * sin(u_time * 1.1 + length(p) * 2.5), // 3x amplitude
                    1.0 + 1.5 * sin(u_time * 0.6 + length(p) * 3.5)  // 3x amplitude
                );
                
                latticeColor *= gradientMod;
                
                vec3 color = mix(baseColor, latticeColor, vec3(r, g, b));
                
                // Enhanced glow - MASSIVE BOOST
                color += u_baseColor * 0.8 * (0.6 + 0.4 * sin(u_time * 0.4)) * u_intensity;
                
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
        this.gl.uniform1f(this.uniforms.intensity, 2.5); // MASSIVE intensity boost
        
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
console.log('🏠 Creating VIB3HomeMasterIntegration class...');
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
        
        // Initialize visualizer with home config - BOOST VIBRANCY 
        const homeConfig = this.homeMasterSystem.getSectionConfig('home');
        
        // MASSIVELY BOOST all vibrancy parameters for WOAH factor
        if (homeConfig) {
            homeConfig.gridDensity = (homeConfig.gridDensity || 12) * 2.0; // Double density
            homeConfig.glitchIntensity = Math.max(0.8, (homeConfig.glitchIntensity || 0.3) * 3); // Triple glitch
            homeConfig.dimension = Math.max(3.8, homeConfig.dimension || 3.5); // Max 4D 
            homeConfig.morphFactor = Math.max(0.7, homeConfig.morphFactor || 0.5); // High morph
            homeConfig.rotationSpeed = (homeConfig.rotationSpeed || 0.5) * 2.5; // Much faster
            homeConfig.hue = homeConfig.hue || 0.83; // Vibrant magenta
            homeConfig.saturation = 1.0; // MAX saturation
            homeConfig.brightness = 1.0; // MAX brightness
        }
        
        this.currentVisualizer = new VIB3EnhancedVisualizer(this.mainCanvas, homeConfig);
        
        // SETUP MULTI-INSTANCE REACTIVE ECOSYSTEM
        this.setupMultiInstanceSystem();
        this.setupScrollReactivity();
        this.setupInteractiveReactivity();
    }
    
    setupMultiInstanceSystem() {
        console.log('🎭 Setting up multi-instance reactive ecosystem...');
        
        this.instances = {}; // Track all visualizer instances
        this.interactionInfluences = new Map(); // Track hover/touch influences
        
        // CREATE TEXT BACKGROUND VISUALIZERS (INVERSE PARAMETERS)
        this.createTextBackgroundVisualizers();
        
        // CREATE UI ELEMENT VISUALIZERS  
        this.createUIElementVisualizers();
        
        // CREATE PARTICLE OVERLAY SYSTEM
        this.createParticleOverlay();
        
        console.log('✅ Multi-instance reactive ecosystem ready');
    }
    
    createTextBackgroundVisualizers() {
        console.log('📝 Creating text background visualizers...');
        
        // Find all article cards and content blocks
        const contentElements = document.querySelectorAll('.content-item, .article-card, .feature-content');
        
        contentElements.forEach((element, index) => {
            // Create mini canvas for background
            const canvas = document.createElement('canvas');
            canvas.className = 'text-bg-visualizer';
            canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                opacity: 0.3;
                pointer-events: none;
                mix-blend-mode: overlay;
            `;
            
            // Make parent relative for positioning
            if (getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }
            
            element.appendChild(canvas);
            
            // Create INVERSE parameter config
            const baseConfig = this.homeMasterSystem.getSectionConfig(this.currentSection);
            const inverseConfig = this.createInverseConfig(baseConfig, index);
            
            // Create visualizer instance
            const visualizer = new VIB3EnhancedVisualizer(canvas, inverseConfig);
            this.instances[`text-bg-${index}`] = {
                visualizer,
                element,
                canvas,
                type: 'text-background',
                baseConfig: inverseConfig
            };
            
            // Setup hover reactivity for this element
            this.setupElementHoverReactivity(element, `text-bg-${index}`);
        });
        
        console.log(`📝 Created ${contentElements.length} text background visualizers`);
    }
    
    createInverseConfig(baseConfig, instanceIndex) {
        // Create config with INVERSE parameters for contrast
        const inverse = {...baseConfig};
        
        // Mathematical inverse relationships for visual contrast
        inverse.gridDensity = Math.max(5, 30 - (baseConfig.gridDensity || 12));
        inverse.morphFactor = 1.0 - (baseConfig.morphFactor || 0.5);
        inverse.glitchIntensity = Math.max(0.1, 0.8 - (baseConfig.glitchIntensity || 0.3));
        inverse.rotationSpeed = Math.max(0.1, 2.0 - (baseConfig.rotationSpeed || 0.5));
        inverse.dimension = Math.max(3.0, 7.0 - (baseConfig.dimension || 3.5));
        
        // Color shifting for variety
        const hueShift = (instanceIndex * 0.2) % 1.0;
        inverse.hue = ((baseConfig.hue || 0.5) + hueShift) % 1.0;
        
        // Ensure readability
        inverse.intensity = 0.4; // Lower intensity for backgrounds
        
        return inverse;
    }
    
    createUIElementVisualizers() {
        console.log('🔘 Creating UI element visualizers...');
        
        // Add mini-visualizers to navigation buttons
        const navButtons = document.querySelectorAll('[data-section]');
        
        navButtons.forEach((button, index) => {
            const targetSection = button.dataset.section;
            
            // Create tiny preview canvas
            const canvas = document.createElement('canvas');
            canvas.className = 'nav-preview-visualizer';
            canvas.width = 60;
            canvas.height = 60;
            canvas.style.cssText = `
                position: absolute;
                top: 50%;
                right: 5px;
                transform: translateY(-50%);
                width: 30px;
                height: 30px;
                opacity: 0.6;
                pointer-events: none;
                border-radius: 4px;
                transition: all 0.3s ease;
            `;
            
            // Make button relative for positioning
            if (getComputedStyle(button).position === 'static') {
                button.style.position = 'relative';
            }
            
            button.appendChild(canvas);
            
            // Create preview config for target section
            const previewConfig = this.homeMasterSystem.getSectionConfig(targetSection);
            if (previewConfig) {
                previewConfig.intensity = 0.8; // High intensity for preview
                previewConfig.gridDensity = (previewConfig.gridDensity || 12) * 0.7; // Scaled for small size
                
                const visualizer = new VIB3EnhancedVisualizer(canvas, previewConfig);
                this.instances[`nav-preview-${targetSection}`] = {
                    visualizer,
                    element: button,
                    canvas,
                    type: 'navigation-preview',
                    targetSection,
                    baseConfig: previewConfig
                };
            }
        });
        
        console.log(`🔘 Created ${navButtons.length} navigation preview visualizers`);
    }
    
    createParticleOverlay() {
        console.log('✨ Creating particle overlay system...');
        
        // Create particle canvas overlay
        this.particleCanvas = document.createElement('canvas');
        this.particleCanvas.id = 'particle-overlay';
        this.particleCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 3;
            pointer-events: none;
            mix-blend-mode: screen;
        `;
        document.body.appendChild(this.particleCanvas);
        
        this.particleSystem = new VIB3ParticleSystem(this.particleCanvas, this);
        this.instances['particle-overlay'] = {
            system: this.particleSystem,
            canvas: this.particleCanvas,
            type: 'particle-system'
        };
        
        console.log('✨ Particle overlay system ready');
    }
    
    setupElementHoverReactivity(element, instanceId) {
        const instance = this.instances[instanceId];
        if (!instance) return;
        
        let hoverInfluence = 0;
        let animationId = null;
        
        // Smooth hover transitions
        const updateHover = () => {
            if (instance.visualizer && instance.visualizer.sectionConfig) {
                const config = instance.visualizer.sectionConfig;
                const baseConfig = instance.baseConfig;
                
                // Blend between base and intensified parameters
                config.intensity = baseConfig.intensity + (hoverInfluence * 0.4);
                config.gridDensity = baseConfig.gridDensity + (hoverInfluence * 10);
                config.glitchIntensity = Math.min(1.0, baseConfig.glitchIntensity + (hoverInfluence * 0.3));
                config.rotationSpeed = baseConfig.rotationSpeed + (hoverInfluence * 1.0);
                
                // Update canvas opacity for visual feedback
                instance.canvas.style.opacity = 0.3 + (hoverInfluence * 0.4);
            }
            
            if (hoverInfluence > 0.01) {
                animationId = requestAnimationFrame(updateHover);
            }
        };
        
        element.addEventListener('mouseenter', () => {
            this.interactionInfluences.set(instanceId, 1.0);
            
            // Smooth transition to hover state
            const animateIn = () => {
                hoverInfluence = Math.min(1.0, hoverInfluence + 0.1);
                updateHover();
                if (hoverInfluence < 1.0) {
                    requestAnimationFrame(animateIn);
                }
            };
            animateIn();
        });
        
        element.addEventListener('mouseleave', () => {
            this.interactionInfluences.delete(instanceId);
            
            // Smooth transition out of hover state
            const animateOut = () => {
                hoverInfluence = Math.max(0, hoverInfluence - 0.05);
                updateHover();
                if (hoverInfluence > 0) {
                    requestAnimationFrame(animateOut);
                } else if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            };
            animateOut();
        });
    }
    
    setupInteractiveReactivity() {
        console.log('⚡ Setting up interactive reactivity system...');
        
        // Global mouse tracking for influence fields
        this.mousePosition = { x: 0, y: 0 };
        this.mouseVelocity = { x: 0, y: 0 };
        let lastMousePosition = { x: 0, y: 0 };
        
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX / window.innerWidth;
            this.mousePosition.y = e.clientY / window.innerHeight;
            
            this.mouseVelocity.x = e.clientX - lastMousePosition.x;
            this.mouseVelocity.y = e.clientY - lastMousePosition.y;
            lastMousePosition.x = e.clientX;
            lastMousePosition.y = e.clientY;
            
            // Apply mouse influence to particle system
            if (this.particleSystem) {
                this.particleSystem.updateMouseInfluence(this.mousePosition, this.mouseVelocity);
            }
        });
        
        // Touch support for mobile
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.mousePosition.x = touch.clientX / window.innerWidth;
                this.mousePosition.y = touch.clientY / window.innerHeight;
                
                if (this.particleSystem) {
                    this.particleSystem.updateMouseInfluence(this.mousePosition, { x: 0, y: 0 });
                }
            }
        });
        
        console.log('⚡ Interactive reactivity system ready');
    }
    
    setupScrollReactivity() {
        console.log('🌊 Setting up scroll reactivity for visualizer...');
        
        let lastScrollY = window.scrollY;
        let scrollVelocity = 0;
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            scrollVelocity = Math.abs(currentScrollY - lastScrollY);
            lastScrollY = currentScrollY;
            
            // Apply scroll effects to current visualizer
            if (this.currentVisualizer && this.currentVisualizer.sectionConfig) {
                const config = this.currentVisualizer.sectionConfig;
                const scrollParams = config.scrollParams || ['gridDensity', 'morphFactor'];
                const scrollSensitivity = config.scrollSensitivity || 1.0;
                const scrollDirection = config.scrollDirection || 1;
                
                // Modify parameters based on scroll velocity
                const scrollEffect = scrollVelocity * 0.05 * scrollSensitivity * scrollDirection;
                
                scrollParams.forEach(param => {
                    if (config[param] !== undefined) {
                        const baseValue = config[param];
                        const modified = baseValue + scrollEffect;
                        
                        // Apply with bounds checking
                        switch(param) {
                            case 'gridDensity':
                                config[param] = Math.max(5, Math.min(50, modified));
                                break;
                            case 'morphFactor':
                                config[param] = Math.max(0, Math.min(1, modified));
                                break;
                            case 'glitchIntensity':
                                config[param] = Math.max(0, Math.min(1, modified));
                                break;
                            case 'rotationSpeed':
                                config[param] = Math.max(0.1, Math.min(5, modified));
                                break;
                            case 'dimension':
                                config[param] = Math.max(3, Math.min(4, modified));
                                break;
                        }
                    }
                });
            }
            
            // Reset scroll velocity after a delay
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                scrollVelocity = 0;
                // Reset parameters to base values
                if (this.currentVisualizer) {
                    const baseConfig = this.homeMasterSystem.getSectionConfig(this.currentSection);
                    if (baseConfig) {
                        this.currentVisualizer.updateConfig(baseConfig);
                    }
                }
            }, 200);
        });
        
        console.log('✅ Scroll reactivity enabled');
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
            
            // COMPREHENSIVE DEBUG INTERFACE
            window.debugVIB3HomeMaster = {
                // Basic controls
                switchSection: (sectionId) => window.vib3HomeMasterIntegration.switchToSection(sectionId),
                randomizeHome: () => window.vib3HomeMasterIntegration.homeMasterSystem.randomizeHome(),
                getCurrentConfig: () => window.vib3HomeMasterIntegration.homeMasterSystem.getSectionConfig(
                    window.vib3HomeMasterIntegration.currentSection
                ),
                
                // PARAMETER DOCUMENTATION & LIVE MODIFICATION
                setParameter: (param, value) => {
                    const integration = window.vib3HomeMasterIntegration;
                    if (integration.currentVisualizer && integration.currentVisualizer.sectionConfig) {
                        integration.currentVisualizer.sectionConfig[param] = value;
                        console.log(`🎛️ Set ${param} = ${value}`);
                        integration.logCurrentParameters();
                    }
                },
                
                // Scroll reactivity controls
                setScrollReactivity: (params) => {
                    const integration = window.vib3HomeMasterIntegration;
                    integration.homeMasterSystem.setHomeScrollReactivity(params);
                    console.log(`🌊 Set scroll reactivity: ${params}`);
                },
                
                // Live parameter monitoring
                logCurrentParameters: () => {
                    const integration = window.vib3HomeMasterIntegration;
                    if (integration.currentVisualizer && integration.currentVisualizer.sectionConfig) {
                        const config = integration.currentVisualizer.sectionConfig;
                        console.log('🎛️ CURRENT VISUALIZER PARAMETERS:');
                        console.log(`   geometry: ${config.geometry} (${integration.currentSection})`);
                        console.log(`   gridDensity: ${config.gridDensity?.toFixed(2)} (affects pattern detail)`);
                        console.log(`   morphFactor: ${config.morphFactor?.toFixed(2)} (affects shape warping)`);
                        console.log(`   glitchIntensity: ${config.glitchIntensity?.toFixed(2)} (affects chromatic chaos)`);
                        console.log(`   rotationSpeed: ${config.rotationSpeed?.toFixed(2)} (affects rotation speed)`);
                        console.log(`   dimension: ${config.dimension?.toFixed(2)} (affects 4D effects)`);
                        console.log(`   hue: ${config.hue?.toFixed(2)} (affects color)`);
                        console.log(`   scrollParams: [${config.scrollParams?.join(', ')}] (scroll-reactive params)`);
                        console.log(`   scrollSensitivity: ${config.scrollSensitivity?.toFixed(2)} (scroll response strength)`);
                    }
                },
                
                // Parameter testing shortcuts
                maxChaos: () => {
                    window.debugVIB3HomeMaster.setParameter('gridDensity', 40);
                    window.debugVIB3HomeMaster.setParameter('glitchIntensity', 1.0);
                    window.debugVIB3HomeMaster.setParameter('morphFactor', 1.0);
                    window.debugVIB3HomeMaster.setParameter('rotationSpeed', 3.0);
                    window.debugVIB3HomeMaster.setParameter('dimension', 4.0);
                    console.log('🔥 MAX CHAOS MODE ACTIVATED');
                },
                
                minimal: () => {
                    window.debugVIB3HomeMaster.setParameter('gridDensity', 8);
                    window.debugVIB3HomeMaster.setParameter('glitchIntensity', 0.1);
                    window.debugVIB3HomeMaster.setParameter('morphFactor', 0.2);
                    window.debugVIB3HomeMaster.setParameter('rotationSpeed', 0.3);
                    window.debugVIB3HomeMaster.setParameter('dimension', 3.2);
                    console.log('🧘 MINIMAL MODE ACTIVATED');
                },
                
                // MULTI-INSTANCE CONTROLS
                listInstances: () => {
                    const integration = window.vib3HomeMasterIntegration;
                    console.log('🎭 MULTI-INSTANCE ECOSYSTEM STATUS:');
                    Object.keys(integration.instances).forEach(id => {
                        const instance = integration.instances[id];
                        console.log(`   ${id}: ${instance.type} - ${instance.targetSection || 'current'}`);
                    });
                    console.log(`   Total instances: ${Object.keys(integration.instances).length}`);
                },
                
                toggleParticles: () => {
                    const integration = window.vib3HomeMasterIntegration;
                    if (integration.particleSystem) {
                        const canvas = integration.particleCanvas;
                        const isVisible = canvas.style.display !== 'none';
                        canvas.style.display = isVisible ? 'none' : 'block';
                        console.log(`✨ Particles ${isVisible ? 'HIDDEN' : 'VISIBLE'}`);
                    }
                },
                
                intensifyHover: () => {
                    const integration = window.vib3HomeMasterIntegration;
                    console.log('🔥 Intensifying hover effects...');
                    Object.values(integration.instances).forEach(instance => {
                        if (instance.type === 'text-background' && instance.canvas) {
                            instance.canvas.style.opacity = '0.8';
                            instance.canvas.style.mixBlendMode = 'screen';
                        }
                    });
                },
                
                // GEOMETRIC LINE MODE
                enableLineMode: () => {
                    const integration = window.vib3HomeMasterIntegration;
                    if (integration.currentVisualizer) {
                        // Add wireframe rendering flag to current visualizer
                        integration.currentVisualizer.lineMode = true;
                        console.log('📐 GEOMETRIC LINE MODE ENABLED');
                        console.log('   Wireframe rendering with RGB chromatic separation');
                    }
                },
                
                // RGB GLITCH EFFECTS
                maxGlitch: () => {
                    window.debugVIB3HomeMaster.setParameter('glitchIntensity', 1.0);
                    const integration = window.vib3HomeMasterIntegration;
                    if (integration.particleSystem) {
                        console.log('🌈 MAX RGB GLITCH MODE - Particles + Shader');
                    }
                },
                
                // INTERACTIVE TESTING
                testInteractivity: () => {
                    console.log('🎮 INTERACTIVE TESTING MODE:');
                    console.log('   🖱️  Move mouse around to see particle attraction');
                    console.log('   📱 Hover over text content to see background visualizers');
                    console.log('   🔘 Hover over navigation buttons for section previews');
                    console.log('   📜 Scroll to trigger parameter changes');
                    console.log('   🌀 Click sections to see geometry transitions');
                }
            };
            
            // Add method to integration class
            window.vib3HomeMasterIntegration.logCurrentParameters = window.debugVIB3HomeMaster.logCurrentParameters;
            
            console.log('🎮 VIB3CODE VISUALIZER DEBUG INTERFACE:');
            console.log('');
            console.log('📊 PARAMETER MONITORING:');
            console.log('   debugVIB3HomeMaster.logCurrentParameters() - Show all current values');
            console.log('');
            console.log('🎛️ LIVE PARAMETER CONTROL:');
            console.log('   debugVIB3HomeMaster.setParameter("gridDensity", 25) - Pattern detail (5-50)');
            console.log('   debugVIB3HomeMaster.setParameter("glitchIntensity", 0.8) - Chromatic chaos (0-1)');
            console.log('   debugVIB3HomeMaster.setParameter("morphFactor", 0.7) - Shape warping (0-1)');
            console.log('   debugVIB3HomeMaster.setParameter("rotationSpeed", 2.0) - Rotation speed (0.1-5)');
            console.log('   debugVIB3HomeMaster.setParameter("dimension", 3.8) - 4D effects (3-4)');
            console.log('');
            console.log('🌊 SCROLL REACTIVITY:');
            console.log('   debugVIB3HomeMaster.setScrollReactivity("all-chaos") - All parameters react');
            console.log('   debugVIB3HomeMaster.setScrollReactivity("gridDensity + morphFactor") - Basic');
            console.log('   debugVIB3HomeMaster.setScrollReactivity("dimensional") - 4D effects');
            console.log('');
            console.log('🌀 SECTION SWITCHING:');
            console.log('   debugVIB3HomeMaster.switchSection("home") - Hypercube geometry');
            console.log('   debugVIB3HomeMaster.switchSection("articles") - Tetrahedron geometry');
            console.log('   debugVIB3HomeMaster.switchSection("videos") - Sphere geometry');
            console.log('   debugVIB3HomeMaster.switchSection("podcasts") - Torus geometry');
            console.log('   debugVIB3HomeMaster.switchSection("ema") - Wave geometry');
            console.log('');
            console.log('🔥 PRESET MODES:');
            console.log('   debugVIB3HomeMaster.maxChaos() - Maximum visual intensity');
            console.log('   debugVIB3HomeMaster.minimal() - Calm, minimal effects');
            console.log('   debugVIB3HomeMaster.randomizeHome() - Random new parameters');
            console.log('   debugVIB3HomeMaster.maxGlitch() - RGB chromatic chaos');
            console.log('');
            console.log('🎭 MULTI-INSTANCE CONTROLS:');
            console.log('   debugVIB3HomeMaster.listInstances() - Show all visualizer instances');
            console.log('   debugVIB3HomeMaster.toggleParticles() - Show/hide particle overlay');
            console.log('   debugVIB3HomeMaster.intensifyHover() - Boost hover effects');
            console.log('   debugVIB3HomeMaster.enableLineMode() - Geometric wireframe mode');
            console.log('');
            console.log('🎮 INTERACTIVE TESTING:');
            console.log('   debugVIB3HomeMaster.testInteractivity() - Show interaction guide');
            console.log('');
            console.log('💡 TIPS:');
            console.log('   🖱️  Move mouse to attract particles');
            console.log('   📱 Hover text content for background visualizers');
            console.log('   📜 Scroll to trigger parameter reactivity');
            console.log('   🔘 Hover nav buttons for section previews');
            
            // Auto-log current parameters
            setTimeout(() => {
                window.debugVIB3HomeMaster.logCurrentParameters();
            }, 2000);
            
        } else {
            console.log('⏳ Waiting for HomeBasedReactiveSystem...');
            setTimeout(waitForHomeMaster, 500);
        }
    };
    
    waitForHomeMaster();
});

// VIB3 PARTICLE SYSTEM - Reactive particles using same parameter space
class VIB3ParticleSystem {
    constructor(canvas, integration) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.integration = integration;
        this.particles = [];
        this.mouseInfluence = { x: 0.5, y: 0.5, velocity: { x: 0, y: 0 } };
        this.animationId = null;
        
        this.initializeParticles();
        this.resize();
        this.start();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    initializeParticles() {
        const config = this.integration.homeMasterSystem.getSectionConfig(this.integration.currentSection || 'home');
        const particleCount = Math.floor((config.gridDensity || 12) * 3); // Scale with grid density
        
        this.particles = [];
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle(config, i));
        }
    }
    
    createParticle(config, index) {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * (config.rotationSpeed || 0.5),
            vy: (Math.random() - 0.5) * (config.rotationSpeed || 0.5),
            size: Math.random() * 3 + 1,
            hue: ((config.hue || 0.5) + (index * 0.1)) % 1.0,
            life: 1.0,
            maxLife: 1.0,
            glitchPhase: Math.random() * Math.PI * 2,
            originalX: 0,
            originalY: 0
        };
    }
    
    updateMouseInfluence(mousePos, mouseVel) {
        this.mouseInfluence.x = mousePos.x;
        this.mouseInfluence.y = mousePos.y;
        this.mouseInfluence.velocity = mouseVel;
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    update() {
        const config = this.integration.homeMasterSystem.getSectionConfig(this.integration.currentSection || 'home');
        const time = performance.now() * 0.001;
        
        // Update particle count based on grid density
        const targetCount = Math.floor((config.gridDensity || 12) * 3);
        while (this.particles.length < targetCount) {
            this.particles.push(this.createParticle(config, this.particles.length));
        }
        while (this.particles.length > targetCount) {
            this.particles.pop();
        }
        
        this.particles.forEach((particle, index) => {
            // Store original position for geometric patterns
            if (particle.originalX === 0 && particle.originalY === 0) {
                particle.originalX = particle.x;
                particle.originalY = particle.y;
            }
            
            // Apply visualizer parameters to particle behavior
            const morphFactor = config.morphFactor || 0.5;
            const glitchIntensity = config.glitchIntensity || 0.3;
            const dimension = config.dimension || 3.5;
            
            // Geometric influence based on current section geometry
            this.applyGeometricForces(particle, config, time, index);
            
            // Mouse influence
            const mouseX = this.mouseInfluence.x * this.canvas.width;
            const mouseY = this.mouseInfluence.y * this.canvas.height;
            const dx = mouseX - particle.x;
            const dy = mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                const force = (150 - distance) / 150;
                particle.vx += (dx / distance) * force * 0.1;
                particle.vy += (dy / distance) * force * 0.1;
            }
            
            // Glitch effects
            if (glitchIntensity > 0.5) {
                particle.glitchPhase += 0.2;
                const glitchX = Math.sin(particle.glitchPhase) * glitchIntensity * 10;
                const glitchY = Math.cos(particle.glitchPhase * 1.3) * glitchIntensity * 10;
                particle.x += glitchX;
                particle.y += glitchY;
            }
            
            // 4D effects
            if (dimension > 3.5) {
                const w = Math.sin(time * 0.5 + index * 0.1) * (dimension - 3.5);
                particle.size = Math.max(0.5, particle.size * (1 + w * 0.2));
            }
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Morphing factor affects movement
            particle.vx *= (1 - morphFactor * 0.1);
            particle.vy *= (1 - morphFactor * 0.1);
            
            // Boundary wrapping
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Update color based on config
            particle.hue = ((config.hue || 0.5) + (index * 0.1) + time * 0.1) % 1.0;
        });
    }
    
    applyGeometricForces(particle, config, time, index) {
        const geometry = config.geometry;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        switch (geometry) {
            case 'hypercube':
                // Grid-based attraction
                const gridSize = 50 + (config.gridDensity || 12) * 3;
                const targetX = Math.round(particle.x / gridSize) * gridSize;
                const targetY = Math.round(particle.y / gridSize) * gridSize;
                particle.vx += (targetX - particle.x) * 0.01;
                particle.vy += (targetY - particle.y) * 0.01;
                break;
                
            case 'tetrahedron':
                // Triangular vertex attraction
                const angle = (index / this.particles.length) * Math.PI * 2;
                const radius = 100 + Math.sin(time + index) * 50;
                const triangleX = centerX + Math.cos(angle) * radius;
                const triangleY = centerY + Math.sin(angle) * radius;
                particle.vx += (triangleX - particle.x) * 0.02;
                particle.vy += (triangleY - particle.y) * 0.02;
                break;
                
            case 'sphere':
                // Radial forces
                const dx = particle.x - centerX;
                const dy = particle.y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const targetRadius = 150 + Math.sin(time * 0.5) * 50;
                if (distance > 0) {
                    const force = (targetRadius - distance) / distance * 0.01;
                    particle.vx += dx * force;
                    particle.vy += dy * force;
                }
                break;
                
            case 'torus':
                // Circular flow
                const torusAngle = Math.atan2(particle.y - centerY, particle.x - centerX);
                const flowSpeed = (config.rotationSpeed || 0.5) * 0.5;
                particle.vx += -Math.sin(torusAngle) * flowSpeed;
                particle.vy += Math.cos(torusAngle) * flowSpeed;
                break;
                
            case 'wave':
                // Wave pattern forces
                const waveX = Math.sin(particle.y * 0.01 + time) * 2;
                const waveY = Math.cos(particle.x * 0.01 + time) * 2;
                particle.vx += waveX * 0.1;
                particle.vy += waveY * 0.1;
                break;
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const config = this.integration.homeMasterSystem.getSectionConfig(this.integration.currentSection || 'home');
        
        this.particles.forEach(particle => {
            this.ctx.save();
            
            // RGB chromatic separation for glitch effects
            if ((config.glitchIntensity || 0) > 0.3) {
                const offset = (config.glitchIntensity || 0) * 3;
                
                // Red channel
                this.ctx.globalCompositeOperation = 'screen';
                this.ctx.fillStyle = `hsla(0, 100%, 50%, ${0.3 + particle.life * 0.4})`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x - offset, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Green channel  
                this.ctx.fillStyle = `hsla(120, 100%, 50%, ${0.3 + particle.life * 0.4})`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y - offset * 0.5, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Blue channel
                this.ctx.fillStyle = `hsla(240, 100%, 50%, ${0.3 + particle.life * 0.4})`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x + offset, particle.y + offset * 0.5, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.globalCompositeOperation = 'source-over';
            } else {
                // Normal rendering
                const hue = particle.hue * 360;
                const saturation = 80 + (config.morphFactor || 0.5) * 20;
                const lightness = 50 + (config.dimension || 3.5) * 10;
                
                this.ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.4 + particle.life * 0.4})`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    animate() {
        if (!this.animationId) return;
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    start() {
        if (this.animationId) return;
        this.animationId = true;
        this.animate();
    }
    
    stop() {
        if (this.animationId) {
            this.animationId = null;
        }
    }
}

console.log('✅ VIB3CODE Home-Master Enhanced Integration loaded');