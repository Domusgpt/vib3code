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
                
                // ANIMATED GRID SYSTEM - Dynamic geometry evolution
                float pulseGrid = u_gridDensity * (0.6 + 0.8 * sin(u_time * 0.7 + length(p) * 2.0));
                float breathingGrid = u_gridDensity * (1.0 + 0.4 * u_morphFactor * sin(u_time * 1.2));
                float dynamicGridDensity = mix(pulseGrid, breathingGrid, u_morphFactor);
                
                // RGB MOIRÉ INTERFERENCE PATTERNS
                float moireFreq1 = 15.0 + 5.0 * sin(u_time * 0.3);
                float moireFreq2 = 18.0 + 3.0 * cos(u_time * 0.5);
                float moirePattern1 = sin(p.x * moireFreq1) * sin(p.y * moireFreq1);
                float moirePattern2 = cos(p.x * moireFreq2 + u_time) * cos(p.y * moireFreq2 + u_time * 0.8);
                float moireInterference = (moirePattern1 + moirePattern2) * 0.1 * u_glitchIntensity;
                
                // GEOMETRY-RESPONSIVE CHROMATIC SEPARATION
                float glitchBase = u_glitchIntensity * (0.15 + 0.1 * sin(u_time * 8.0));
                float geometryInfluence = 0.5 + 0.5 * sin(length(p) * 10.0 + u_time * 2.0);
                
                vec2 rOffset = vec2(glitchBase * (1.0 + moireInterference), glitchBase * 0.8 * geometryInfluence);
                vec2 gOffset = vec2(-glitchBase * 0.6 * geometryInfluence, glitchBase * (1.0 + moireInterference * 0.5));
                vec2 bOffset = vec2(glitchBase * 0.4 * (1.0 + moireInterference), -glitchBase * 0.9 * geometryInfluence);
                
                // Sample geometry with chromatic offsets + grid animation
                float r = getGeometryValue(vec3(p.xy + rOffset, p.z), dynamicGridDensity * 1.1, u_geometry);
                float g = getGeometryValue(vec3(p.xy + gOffset, p.z), dynamicGridDensity, u_geometry);
                float b = getGeometryValue(vec3(p.xy + bOffset, p.z), dynamicGridDensity * 0.9, u_geometry);
                
                // Add RGB-specific moiré interference
                r += moireInterference * 1.2;
                g += moireInterference * 0.7;
                b += moireInterference * 1.0;
                
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
        this.isTransitioning = false;
        
        this.init();
    }
    
    init() {
        console.log('🏠 Initializing VIB3CODE Home-Master Enhanced System...');
        
        // Load initial configuration FIRST (before creating visualizers)
        console.log('🎲 Initializing home master system parameters...');
        this.homeMasterSystem.randomizeHome();
        
        // Set up home-master system callbacks
        this.homeMasterSystem.onChange((allConfigs) => {
            this.updateVisualizerConfig(allConfigs);
        });
        
        // Create main canvas for visualizer (now config is ready)
        this.createMainCanvas();
        
        // CREATE COHESIVE NAVIGATION SYSTEM
        this.createGeometricNavigationSystem();
        
        // Set up section detection
        this.setupSectionDetection();
        
        console.log('✅ VIB3CODE Home-Master Enhanced System ready');
        console.log('🔄 Section-based geometry switching: home=hypercube, articles=tetrahedron, videos=sphere, podcasts=torus, ema=wave');
    }
    
    createGeometricNavigationSystem() {
        console.log('🎯 Creating cohesive geometric navigation system...');
        
        // Create navigation overlay that responds to visualizer
        this.createNavigationOverlay();
        
        // Setup interactive navigation elements
        this.setupInteractiveNavigation();
        
        // Create geometric transition indicators
        this.createGeometricIndicators();
        
        // Setup user interaction system
        this.setupUserInteractionSystem();
        
        console.log('✅ Cohesive navigation system ready');
    }
    
    createNavigationOverlay() {
        // Create floating navigation that follows geometric patterns
        this.navOverlay = document.createElement('div');
        this.navOverlay.id = 'geometric-nav-overlay';
        this.navOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 100;
            mix-blend-mode: screen;
        `;
        document.body.appendChild(this.navOverlay);
        
        // Create geometric navigation indicators
        this.createGeometricNavElements();
    }
    
    createGeometricNavElements() {
        const sections = ['home', 'articles', 'videos', 'podcasts', 'ema'];
        const geometries = ['hypercube', 'tetrahedron', 'sphere', 'torus', 'wave'];
        
        sections.forEach((section, index) => {
            const navElement = document.createElement('div');
            navElement.className = `geometric-nav-element nav-${section}`;
            navElement.dataset.section = section;
            navElement.dataset.geometry = geometries[index];
            
            // Position elements in geometric pattern
            const angle = (index / sections.length) * Math.PI * 2;
            const radius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
            const x = window.innerWidth / 2 + Math.cos(angle) * radius;
            const y = window.innerHeight / 2 + Math.sin(angle) * radius;
            
            navElement.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 60px;
                height: 60px;
                transform: translate(-50%, -50%);
                pointer-events: auto;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                backdrop-filter: blur(10px);
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                color: white;
                text-transform: uppercase;
                text-align: center;
                line-height: 1;
            `;
            
            navElement.innerHTML = section.charAt(0);
            
            // Add hover effects that sync with visualizer
            navElement.addEventListener('mouseenter', () => {
                this.previewGeometry(geometries[index]);
                navElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
                navElement.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.5)';
            });
            
            navElement.addEventListener('mouseleave', () => {
                this.stopGeometryPreview();
                navElement.style.transform = 'translate(-50%, -50%) scale(1)';
                navElement.style.boxShadow = 'none';
            });
            
            navElement.addEventListener('click', () => {
                this.switchToSection(section);
                this.animateNavSelection(navElement);
            });
            
            this.navOverlay.appendChild(navElement);
        });
    }
    
    previewGeometry(geometry) {
        // Temporarily boost parameters for geometry preview
        if (this.currentVisualizer && this.homeMasterSystem.currentHome) {
            const previewConfig = { ...this.homeMasterSystem.getSectionConfig(this.currentSection) };
            previewConfig.glitchIntensity = Math.min(1.0, previewConfig.glitchIntensity + 0.3);
            previewConfig.intensity = Math.min(2.0, previewConfig.intensity + 0.5);
            previewConfig.rotationSpeed = Math.min(3.0, previewConfig.rotationSpeed + 0.5);
            
            this.currentVisualizer.updateConfig(previewConfig);
        }
    }
    
    stopGeometryPreview() {
        // Return to normal parameters
        if (this.currentVisualizer && this.homeMasterSystem.currentHome) {
            const normalConfig = this.homeMasterSystem.getSectionConfig(this.currentSection);
            this.currentVisualizer.updateConfig(normalConfig);
        }
    }
    
    animateNavSelection(element) {
        // Create selection pulse effect
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'nav-pulse 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 10);
    }
    
    createGeometricIndicators() {
        // Create geometric status indicator
        this.geometricIndicator = document.createElement('div');
        this.geometricIndicator.id = 'geometric-status-indicator';
        this.geometricIndicator.style.cssText = `
            position: fixed;
            top: 30px;
            right: 30px;
            padding: 15px 25px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 25px;
            color: white;
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            font-weight: 600;
            z-index: 200;
            backdrop-filter: blur(10px);
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(this.geometricIndicator);
        
        // Add CSS animations for navigation
        this.addNavigationCSS();
        
        this.updateGeometricIndicator();
    }
    
    addNavigationCSS() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes nav-pulse {
                0% { transform: translate(-50%, -50%) scale(1.1); }
                50% { transform: translate(-50%, -50%) scale(1.4); box-shadow: 0 0 50px rgba(255, 255, 255, 0.8); }
                100% { transform: translate(-50%, -50%) scale(1.1); }
            }
            
            .geometric-nav-element:hover {
                animation: nav-hover 2s infinite ease-in-out;
            }
            
            @keyframes nav-hover {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.3) saturate(1.2); }
            }
            
            .geometric-nav-element.active {
                animation: nav-active 3s infinite ease-in-out;
            }
            
            @keyframes nav-active {
                0%, 100% { 
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
                    filter: brightness(1.1);
                }
                50% { 
                    box-shadow: 0 0 40px rgba(255, 255, 255, 0.8);
                    filter: brightness(1.3) hue-rotate(20deg);
                }
            }
            
            #geometric-status-indicator {
                animation: status-glow 4s infinite ease-in-out;
            }
            
            @keyframes status-glow {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.2) drop-shadow(0 0 10px currentColor); }
            }
        `;
        document.head.appendChild(style);
    }
    
    updateGeometricIndicator() {
        if (this.geometricIndicator) {
            const config = this.homeMasterSystem.getSectionConfig(this.currentSection);
            const geometry = config?.geometry || 'hypercube';
            this.geometricIndicator.textContent = `${geometry} mode`;
            
            // Update color based on geometry
            const colors = {
                hypercube: '#ff00ff',
                tetrahedron: '#00ffff', 
                sphere: '#ff3366',
                torus: '#00ff80',
                wave: '#8000ff'
            };
            this.geometricIndicator.style.borderColor = colors[geometry] || '#ffffff';
            this.geometricIndicator.style.color = colors[geometry] || '#ffffff';
        }
    }
    
    setupUserInteractionSystem() {
        // Global keyboard shortcuts for navigation
        document.addEventListener('keydown', (e) => {
            if (e.altKey || e.metaKey) return; // Don't interfere with browser shortcuts
            
            switch(e.key) {
                case '1': this.switchToSection('home'); break;
                case '2': this.switchToSection('articles'); break;
                case '3': this.switchToSection('videos'); break;
                case '4': this.switchToSection('podcasts'); break;
                case '5': this.switchToSection('ema'); break;
                case 'r': this.homeMasterSystem.randomizeHome(); break;
                case 'c': this.homeMasterSystem.setHomeScrollReactivity('all-chaos'); break;
                case 'm': this.homeMasterSystem.setHomeScrollReactivity('minimal'); break;
            }
        });
        
        // Global mouse gestures for parameter control
        let mouseStartY = 0;
        let isDragging = false;
        
        document.addEventListener('mousedown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                mouseStartY = e.clientY;
                isDragging = true;
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaY = (mouseStartY - e.clientY) / window.innerHeight;
                const currentConfig = this.homeMasterSystem.getSectionConfig(this.currentSection);
                
                if (currentConfig && this.currentVisualizer) {
                    // Adjust intensity based on vertical mouse movement
                    const newIntensity = Math.max(0.1, Math.min(2.0, currentConfig.intensity + deltaY * 2));
                    const adjustedConfig = { ...currentConfig, intensity: newIntensity };
                    this.currentVisualizer.updateConfig(adjustedConfig);
                }
                e.preventDefault();
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        console.log('🎮 User interaction system active:');
        console.log('   Keys 1-5: Navigate sections');
        console.log('   R: Randomize parameters');
        console.log('   C: Chaos mode');
        console.log('   M: Minimal mode');
        console.log('   Ctrl+Drag: Adjust intensity');
    }
    
    setupInteractiveNavigation() {
        // Enhanced navigation that responds to visualizer state
        const existingNav = document.querySelectorAll('nav a[data-section]');
        existingNav.forEach(navLink => {
            navLink.addEventListener('mouseenter', () => {
                const section = navLink.dataset.section;
                const geometry = this.homeMasterSystem.FIXED_GEOMETRIES[section];
                if (geometry) {
                    this.previewGeometry(geometry);
                }
            });
            
            navLink.addEventListener('mouseleave', () => {
                this.stopGeometryPreview();
            });
        });
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
        
        // TEMPORARILY DISABLE TO REDUCE WEBGL CONTEXT COUNT
        // CREATE TEXT BACKGROUND VISUALIZERS (INVERSE PARAMETERS)
        // this.createTextBackgroundVisualizers();
        
        // REDUCE UI ELEMENT VISUALIZERS (LIMIT TO PREVENT TOO MANY WEBGL CONTEXTS)
        // this.createUIElementVisualizers();
        
        // CREATE PARTICLE OVERLAY SYSTEM (2D CANVAS - NO WEBGL)
        this.createParticleOverlay();
        
        console.log('✅ Multi-instance reactive ecosystem ready (reduced for performance)');
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
        
        // Store previous section for transition
        const previousSection = this.currentSection;
        const previousGeometry = this.homeMasterSystem.getSectionConfig(previousSection)?.geometry || 'hypercube';
        
        // Set transition state
        this.isTransitioning = true;
        this.currentSection = sectionId;
        
        // Get derived config from home-master system
        const sectionConfig = this.homeMasterSystem.getSectionConfig(sectionId);
        const newGeometry = sectionConfig?.geometry || 'hypercube';
        
        if (sectionConfig && this.currentVisualizer) {
            console.log(`🎨 Transitioning from ${previousGeometry} → ${newGeometry}`);
            
            // Execute content portal animation
            this.executeContentPortalTransition(previousGeometry, newGeometry, sectionId);
            
            // Update visualizer with new geometry
            this.currentVisualizer.updateConfig(sectionConfig);
            
            // Update navigation system
            this.updateGeometricIndicator();
            this.updateNavigationState(sectionId);
        }
    }
    
    updateNavigationState(currentSection) {
        // Update geometric navigation elements
        const navElements = document.querySelectorAll('.geometric-nav-element');
        navElements.forEach(element => {
            if (element.dataset.section === currentSection) {
                element.style.background = 'rgba(255, 255, 255, 0.3)';
                element.style.borderWidth = '3px';
                element.style.transform = 'translate(-50%, -50%) scale(1.1)';
            } else {
                element.style.background = 'rgba(255, 255, 255, 0.1)';
                element.style.borderWidth = '2px';
                element.style.transform = 'translate(-50%, -50%) scale(1)';
            }
        });
    }
    
    executeContentPortalTransition(fromGeometry, toGeometry, targetSection) {
        console.log(`🌀 Portal transition: ${fromGeometry} → ${toGeometry}`);
        
        // Find content containers
        const allSections = document.querySelectorAll('[id^="section-"]');
        const targetContent = document.querySelector(`#section-${targetSection}`);
        const currentVisible = document.querySelector('.magazine-content [style*="block"], .magazine-content .active');
        
        // PHASE 1: Portal OUT animation (based on current geometry)
        this.animateContentPortalOut(currentVisible, fromGeometry).then(() => {
            
            // PHASE 2: Hide current content
            allSections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active', 'portal-in', 'portal-out');
            });
            
            // PHASE 3: Portal IN animation (based on target geometry)  
            if (targetContent) {
                targetContent.style.display = 'block';
                targetContent.classList.add('active');
                this.animateContentPortalIn(targetContent, toGeometry);
            }
            
            // Clear transition state
            setTimeout(() => {
                this.isTransitioning = false;
            }, 1000);
        });
    }
    
    animateContentPortalOut(element, geometry) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.classList.add('portal-out');
            
            // Apply geometry-specific exit animations
            switch (geometry) {
                case 'hypercube':
                    // Cubic grid dissolution
                    element.style.transform = 'scale(0.8) rotateX(45deg) rotateY(45deg)';
                    element.style.filter = 'blur(8px) brightness(0.3)';
                    element.style.clipPath = 'polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%)';
                    break;
                    
                case 'tetrahedron':
                    // Triangular collapse
                    element.style.transform = 'scale(0.1) rotate(120deg)';
                    element.style.filter = 'blur(12px) hue-rotate(60deg)';
                    element.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
                    break;
                    
                case 'sphere':
                    // Radial implosion
                    element.style.transform = 'scale(0.1)';
                    element.style.filter = 'blur(15px) contrast(2)';
                    element.style.borderRadius = '50%';
                    element.style.clipPath = 'circle(10% at center)';
                    break;
                    
                case 'torus':
                    // Spiral collapse
                    element.style.transform = 'scale(0.2) rotate(720deg)';
                    element.style.filter = 'blur(10px) saturate(3)';
                    element.style.clipPath = 'ellipse(20% 40% at center)';
                    break;
                    
                case 'wave':
                    // Wave dissolution
                    element.style.transform = 'scaleY(0.1) skewX(45deg)';
                    element.style.filter = 'blur(6px) brightness(0.4)';
                    element.style.clipPath = 'polygon(0% 50%, 25% 40%, 50% 60%, 75% 30%, 100% 50%, 100% 100%, 0% 100%)';
                    break;
                    
                default:
                    element.style.transform = 'scale(0.8)';
                    element.style.filter = 'blur(8px)';
            }
            
            element.style.opacity = '0';
            element.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            setTimeout(resolve, 600);
        });
    }
    
    animateContentPortalIn(element, geometry) {
        if (!element) return;
        
        element.classList.add('portal-in');
        
        // Start with exit state, then animate to normal
        switch (geometry) {
            case 'hypercube':
                // Cubic grid formation
                element.style.transform = 'scale(0.5) rotateX(90deg) rotateY(90deg)';
                element.style.filter = 'blur(15px) brightness(2)';
                element.style.clipPath = 'polygon(45% 45%, 55% 45%, 55% 55%, 45% 55%)';
                break;
                
            case 'tetrahedron':
                // Triangular emergence
                element.style.transform = 'scale(0.1) rotate(-120deg)';
                element.style.filter = 'blur(20px) hue-rotate(-60deg)';
                element.style.clipPath = 'polygon(50% 50%, 50% 50%, 50% 50%)';
                break;
                
            case 'sphere':
                // Radial expansion
                element.style.transform = 'scale(0.1)';
                element.style.filter = 'blur(25px) contrast(3)';
                element.style.borderRadius = '50%';
                element.style.clipPath = 'circle(0% at center)';
                break;
                
            case 'torus':
                // Spiral emergence
                element.style.transform = 'scale(0.1) rotate(-720deg)';
                element.style.filter = 'blur(20px) saturate(5)';
                element.style.clipPath = 'ellipse(5% 10% at center)';
                break;
                
            case 'wave':
                // Wave formation
                element.style.transform = 'scaleY(0.1) skewX(-45deg)';
                element.style.filter = 'blur(15px) brightness(2)';
                element.style.clipPath = 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)';
                break;
                
            default:
                element.style.transform = 'scale(0.5)';
                element.style.filter = 'blur(15px)';
        }
        
        element.style.opacity = '0';
        element.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        // Animate to normal state
        setTimeout(() => {
            element.style.transform = 'scale(1) rotate(0deg)';
            element.style.filter = 'blur(0px) brightness(1) hue-rotate(0deg) contrast(1) saturate(1)';
            element.style.opacity = '1';
            element.style.borderRadius = '';
            element.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
        }, 50);
        
        // Clean up classes after animation
        setTimeout(() => {
            element.classList.remove('portal-in', 'portal-out');
            element.style.transition = '';
        }, 800);
    }
    
    updateVisualizerConfig(allConfigs) {
        if (this.currentVisualizer && allConfigs[this.currentSection]) {
            this.currentVisualizer.updateConfig(allConfigs[this.currentSection]);
        }
    }
}

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
        // Safety check - ensure home master system is initialized
        if (!this.integration.homeMasterSystem.currentHome) {
            console.log('🔄 HomeMasterSystem not ready, initializing...');
            this.integration.homeMasterSystem.randomizeHome();
        }
        
        const config = this.integration.homeMasterSystem.getSectionConfig(this.integration.currentSection || 'home');
        if (!config) {
            console.error('❌ Failed to get section config for particle initialization');
            return;
        }
        
        const particleCount = Math.floor((config.gridDensity || 12) * 3); // Scale with grid density
        
        this.particles = [];
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle(config, i));
        }
        
        console.log(`✅ Initialized ${particleCount} particles for section: ${this.integration.currentSection}`);
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
        // Safety check - ensure configuration is available
        if (!this.integration.homeMasterSystem.currentHome) {
            return; // Skip update if system not ready
        }
        
        const config = this.integration.homeMasterSystem.getSectionConfig(this.integration.currentSection || 'home');
        if (!config) {
            return; // Skip update if config not available
        }
        
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
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Safety check - ensure configuration is available
        if (!this.integration.homeMasterSystem.currentHome) {
            return; // Skip render if system not ready
        }
        
        const config = this.integration.homeMasterSystem.getSectionConfig(this.integration.currentSection || 'home');
        if (!config) {
            return; // Skip render if config not available
        }
        
        this.particles.forEach(particle => {
            this.ctx.save();
            
            // Normal rendering
            const hue = particle.hue * 360;
            const saturation = 80 + (config.morphFactor || 0.5) * 20;
            const lightness = 50 + (config.dimension || 3.5) * 10;
            
            this.ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.4 + particle.life * 0.4})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
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

// CRITICAL INITIALIZATION CODE
console.log('🚀 Initializing VIB3CODE Home-Master Integration...');

// Check dependencies first
if (typeof HomeBasedReactiveSystem === 'undefined') {
    console.error('❌ HomeBasedReactiveSystem not found - check shared-reactive-core loading');
    window.vib3HomeMasterIntegration = false;
} else {
    // Create and store the main integration
    console.log('🔧 Creating VIB3HomeMasterIntegration...');
    try {
        window.vib3HomeMasterIntegration = new VIB3HomeMasterIntegration();
        console.log('✅ VIB3HomeMasterIntegration created successfully');
        console.log('🎯 Integration status:', !!window.vib3HomeMasterIntegration);
        
        // Compatibility interface for magazine router
        window.visualizerManager = {
            applyMasterStyle: function(section) {
                if (window.vib3HomeMasterIntegration) {
                    window.vib3HomeMasterIntegration.switchSection(section);
                }
            },
            getCurrentMasterStyleKey: function() {
                return window.vib3HomeMasterIntegration ? window.vib3HomeMasterIntegration.currentSection : 'home';
            },
            isInTransition: function() {
                return window.vib3HomeMasterIntegration ? window.vib3HomeMasterIntegration.isTransitioning : false;
            }
        };
        console.log('✅ Magazine router compatibility interface created');
        
    } catch (error) {
        console.error('❌ Failed to create VIB3HomeMasterIntegration:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        window.vib3HomeMasterIntegration = false;
    }
}

// Debug interface setup
console.log('🛠️ Setting up debug interface...');
window.debugVIB3HomeMaster = {
    status: () => {
        console.log('=== VIB3CODE DEBUG STATUS ===');
        console.log('HomeMasterIntegration:', !!window.vib3HomeMasterIntegration);
        console.log('VisualizerManager:', !!window.visualizerManager);
        if (window.vib3HomeMasterIntegration) {
            console.log('Current Section:', window.vib3HomeMasterIntegration.currentSection);
            console.log('Main Visualizer:', !!window.vib3HomeMasterIntegration.mainVisualizer);
            console.log('Particle System:', !!window.vib3HomeMasterIntegration.particleSystem);
        }
    },
    
    switchSection: (section) => {
        if (window.vib3HomeMasterIntegration) {
            window.vib3HomeMasterIntegration.switchSection(section);
            console.log(`Switched to section: ${section}`);
        }
    },
    
    randomizeHome: () => {
        if (window.vib3HomeMasterIntegration) {
            window.vib3HomeMasterIntegration.homeMasterSystem.randomizeHome();
            console.log('Home parameters randomized');
        }
    },
    
    setScrollReactivity: (mode) => {
        if (window.vib3HomeMasterIntegration) {
            window.vib3HomeMasterIntegration.homeMasterSystem.setHomeScrollReactivity(mode);
            console.log(`Scroll reactivity set to: ${mode}`);
        }
    },
    
    maxChaos: () => {
        if (window.vib3HomeMasterIntegration) {
            window.vib3HomeMasterIntegration.homeMasterSystem.setHomeScrollReactivity('all-chaos');
            console.log('🔥 MAXIMUM CHAOS MODE ACTIVATED');
        }
    },
    
    getConfig: () => {
        if (window.vib3HomeMasterIntegration) {
            return window.vib3HomeMasterIntegration.homeMasterSystem.getAllConfigurations();
        }
    }
};

console.log('🔥 VIB3CODE Enhanced System fully initialized!');
console.log('Type debugVIB3HomeMaster.status() to check system status');
console.log('Type debugVIB3HomeMaster.maxChaos() for maximum visual intensity');

// Signal readiness to index.html
window.vib3SystemReady = true;