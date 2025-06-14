// Simplified 4D Visualizer for VIB3CODE
// Fallback implementation for immediate functionality

class SimpleVisualizer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.animationId = null;
        this.time = 0;
        this.audioLevels = { bass: 0, mid: 0, high: 0 };
        
        this.init();
    }
    
    init() {
        console.log('🎨 Initializing Simple Visualizer...');
        
        this.canvas = document.getElementById('visualizer-canvas');
        if (!this.canvas) {
            console.warn('Canvas not found, creating fallback');
            return;
        }
        
        this.setupCanvas();
        this.setupAudio();
        this.start();
        
        console.log('✅ Simple Visualizer initialized');
    }
    
    setupCanvas() {
        this.resizeCanvas();
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Try WebGL first, fallback to 2D
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('webgl2');
        if (!this.gl) {
            this.ctx = this.canvas.getContext('2d');
            console.log('Using 2D Canvas fallback');
        } else {
            console.log('Using WebGL context');
            this.setupWebGL();
        }
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    setupWebGL() {
        const gl = this.gl;
        
        // Simple vertex shader
        const vsSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Fragment shader with 4D-inspired effects
        const fsSource = `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform float u_bass;
            uniform float u_mid;
            uniform float u_high;
            varying vec2 v_uv;
            
            // Simple 4D rotation matrices
            mat2 rot2D(float a) {
                float c = cos(a), s = sin(a);
                return mat2(c, -s, s, c);
            }
            
            float hypercubePattern(vec2 p, float t) {
                // Simulate 4D projection
                vec2 p1 = p * 3.0;
                vec2 p2 = p1 * rot2D(t * 0.1);
                
                // Grid pattern
                vec2 grid = abs(fract(p2) - 0.5);
                float lines = min(grid.x, grid.y);
                
                // 4D influence
                float w = sin(p.x * 2.0 + t * 0.2) * cos(p.y * 2.0 + t * 0.3);
                vec2 p3 = (p2 + w * 0.2) * rot2D(w * 0.5);
                vec2 grid2 = abs(fract(p3) - 0.5);
                float lines2 = min(grid2.x, grid2.y);
                
                return mix(lines, lines2, 0.6);
            }
            
            void main() {
                vec2 uv = (v_uv * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);
                
                float pattern = hypercubePattern(uv, u_time);
                
                // Audio reactive coloring
                vec3 color = vec3(0.0);
                
                // Base grid
                float grid = 1.0 - smoothstep(0.02, 0.1, pattern);
                
                // Audio reactive effects
                color.r = grid * (0.0 + u_high * 2.0);
                color.g = grid * (0.85 + u_mid * 0.5);
                color.b = grid * (1.0 + u_bass * 0.3);
                
                // Background gradient
                vec3 bg = mix(
                    vec3(0.04, 0.04, 0.06),
                    vec3(0.08, 0.02, 0.1),
                    length(uv) * 0.5
                );
                
                // Combine
                color = mix(bg, color, grid);
                
                // Audio glow
                float glow = u_bass * 0.3 + u_mid * 0.2 + u_high * 0.1;
                color += vec3(0.0, 0.2, 0.4) * glow;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        // Create shaders
        this.program = this.createShaderProgram(vsSource, fsSource);
        if (!this.program) {
            console.error('Failed to create shader program');
            return;
        }
        
        // Get attribute and uniform locations
        this.positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
        this.resolutionUniformLocation = gl.getUniformLocation(this.program, 'u_resolution');
        this.timeUniformLocation = gl.getUniformLocation(this.program, 'u_time');
        this.bassUniformLocation = gl.getUniformLocation(this.program, 'u_bass');
        this.midUniformLocation = gl.getUniformLocation(this.program, 'u_mid');
        this.highUniformLocation = gl.getUniformLocation(this.program, 'u_high');
        
        // Create buffer for fullscreen quad
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1, 1, 1
        ]), gl.STATIC_DRAW);
        
        gl.useProgram(this.program);
        gl.enableVertexAttribArray(this.positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    }
    
    createShaderProgram(vsSource, fsSource) {
        const gl = this.gl;
        
        const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);
        
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize shader program:', gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        
        return shaderProgram;
    }
    
    loadShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    setupAudio() {
        // Generate synthetic audio for demo
        this.generateSyntheticAudio();
    }
    
    generateSyntheticAudio() {
        const updateAudio = () => {
            const t = this.time * 0.001;
            
            // Generate audio levels
            this.audioLevels.bass = (Math.sin(t * 2) + Math.sin(t * 3.2)) * 0.25 + 0.5;
            this.audioLevels.mid = (Math.sin(t * 5) + Math.sin(t * 7.3)) * 0.2 + 0.3;
            this.audioLevels.high = (Math.sin(t * 15) + Math.sin(t * 23.7)) * 0.15 + 0.2;
            
            // Add randomness
            this.audioLevels.bass *= (0.8 + Math.random() * 0.4);
            this.audioLevels.mid *= (0.8 + Math.random() * 0.4);
            this.audioLevels.high *= (0.8 + Math.random() * 0.4);
            
            setTimeout(updateAudio, 50); // 20 FPS
        };
        
        updateAudio();
    }
    
    render() {
        if (!this.isRunning) return;
        
        this.time = performance.now();
        
        if (this.gl && this.program) {
            this.renderWebGL();
        } else if (this.ctx) {
            this.render2D();
        }
        
        this.animationId = requestAnimationFrame(() => this.render());
    }
    
    renderWebGL() {
        const gl = this.gl;
        
        gl.clearColor(0.04, 0.04, 0.06, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.program);
        
        // Set uniforms
        gl.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.timeUniformLocation, this.time * 0.001);
        gl.uniform1f(this.bassUniformLocation, this.audioLevels.bass);
        gl.uniform1f(this.midUniformLocation, this.audioLevels.mid);
        gl.uniform1f(this.highUniformLocation, this.audioLevels.high);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    render2D() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const t = this.time * 0.001;
        
        // Clear canvas
        ctx.fillStyle = `rgb(${Math.floor(10 + this.audioLevels.bass * 20)}, ${Math.floor(10 + this.audioLevels.mid * 15)}, ${Math.floor(15 + this.audioLevels.high * 25)})`;
        ctx.fillRect(0, 0, w, h);
        
        // Draw grid pattern
        ctx.strokeStyle = `rgba(0, ${Math.floor(150 + this.audioLevels.mid * 105)}, 255, 0.6)`;
        ctx.lineWidth = 1 + this.audioLevels.bass * 2;
        
        const gridSize = 50 + this.audioLevels.high * 30;
        const rotation = t * 0.1;
        
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(rotation);
        
        // Draw grid
        ctx.beginPath();
        for (let x = -w; x < w; x += gridSize) {
            ctx.moveTo(x, -h);
            ctx.lineTo(x, h);
        }
        for (let y = -h; y < h; y += gridSize) {
            ctx.moveTo(-w, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();
        
        // Draw 4D projection effect
        ctx.strokeStyle = `rgba(255, ${Math.floor(16 + this.audioLevels.bass * 100)}, 240, 0.4)`;
        ctx.lineWidth = 0.5;
        
        ctx.rotate(rotation * 0.5);
        ctx.scale(1 + this.audioLevels.mid * 0.3, 1 + this.audioLevels.high * 0.2);
        
        ctx.beginPath();
        for (let x = -w; x < w; x += gridSize * 1.5) {
            ctx.moveTo(x, -h);
            ctx.lineTo(x, h);
        }
        for (let y = -h; y < h; y += gridSize * 1.5) {
            ctx.moveTo(-w, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();
        
        ctx.restore();
        
        // Add glow effect
        const glow = this.audioLevels.bass * 50 + this.audioLevels.mid * 30;
        if (glow > 0) {
            ctx.shadowColor = 'rgba(0, 217, 255, 0.8)';
            ctx.shadowBlur = glow;
            ctx.fillStyle = 'rgba(0, 0, 0, 0)';
            ctx.fillRect(0, 0, 1, 1);
            ctx.shadowBlur = 0;
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        console.log('🎬 Starting Simple Visualizer');
        this.isRunning = true;
        this.render();
    }
    
    stop() {
        if (!this.isRunning) return;
        
        console.log('⏹️ Stopping Simple Visualizer');
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    destroy() {
        console.log('🔥 Destroying Simple Visualizer');
        this.stop();
        
        if (this.gl) {
            // Cleanup WebGL resources
            if (this.program) this.gl.deleteProgram(this.program);
            if (this.positionBuffer) this.gl.deleteBuffer(this.positionBuffer);
        }
    }
}

// Initialize visualizer
const simpleVisualizer = new SimpleVisualizer();

// Export for external control
window.SimpleVisualizer = simpleVisualizer;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    simpleVisualizer.destroy();
});