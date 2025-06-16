// ==========================================================================
// SIMPLE WORKING VISUALIZER - Direct Port from GEN-RL-MillZ
// No over-engineering, just the exact working code adapted for VIB3CODE
// ==========================================================================

// Exact geometry classes from working GEN-RL-MillZ system
class HypercubeGeometry {
    getShaderCode() {
        return `
            float calculateLattice(vec3 p) {
                float dynamicGridDensity = max(0.1, u_gridDensity * (1.0 + u_audioBass * 0.7));
                float dynamicLineThickness = max(0.002, u_lineThickness * (1.0 - u_audioMid * 0.6));

                vec3 p_grid3D = fract(p * dynamicGridDensity * 0.5 + u_time * 0.01);
                vec3 dist3D = abs(p_grid3D - 0.5);
                float box3D = max(dist3D.x, max(dist3D.y, dist3D.z));
                float lattice3D = smoothstep(0.5, 0.5 - dynamicLineThickness, box3D);

                float finalLattice = lattice3D;
                float dim_factor = smoothstep(3.0, 4.5, u_dimension);

                if (dim_factor > 0.01) {
                    float w_coord = sin(p.x*1.4 - p.y*0.7 + p.z*1.5 + u_time * 0.25)
                                  * cos(length(p) * 1.1 - u_time * 0.35 + u_audioMid * 2.5)
                                  * dim_factor * (0.4 + u_morphFactor * 0.6 + u_audioHigh * 0.6);

                    vec4 p4d = vec4(p, w_coord);
                    float baseSpeed = u_rotationSpeed * 1.0;
                    float time_rot1 = u_time * 0.33 * baseSpeed + u_audioHigh * 0.25 + u_morphFactor * 0.45;
                    float time_rot2 = u_time * 0.28 * baseSpeed - u_audioMid * 0.28;
                    float time_rot3 = u_time * 0.25 * baseSpeed + u_audioBass * 0.35;
                    
                    p4d = rotXW(time_rot1) * rotYZ(time_rot2 * 1.1) * rotZW(time_rot3 * 0.9) * p4d;
                    p4d = rotYW(u_time * -0.22 * baseSpeed + u_morphFactor * 0.3) * p4d;

                    vec3 projectedP = project4Dto3D(p4d);
                    vec3 p_grid4D_proj = fract(projectedP * dynamicGridDensity * 0.5 + u_time * 0.015);
                    vec3 dist4D_proj = abs(p_grid4D_proj - 0.5);
                    float box4D_proj = max(dist4D_proj.x, max(dist4D_proj.y, dist4D_proj.z));
                    float lattice4D_proj = smoothstep(0.5, 0.5 - dynamicLineThickness, box4D_proj);
                    finalLattice = mix(lattice3D, lattice4D_proj, smoothstep(0.0, 1.0, u_morphFactor));
                }
                return pow(finalLattice, 1.0 / max(0.1, u_universeModifier));
            }
        `;
    }
}

// Simple geometry manager (exactly like working system)
class SimpleGeometryManager {
    constructor() {
        this.geometries = {};
        this._initGeometries();
    }
    
    _initGeometries() {
        this.registerGeometry('hypercube', new HypercubeGeometry());
    }
    
    registerGeometry(name, instance) {
        this.geometries[name.toLowerCase()] = instance;
    }
    
    getGeometry(name) {
        return this.geometries[name?.toLowerCase()] || this.geometries['hypercube'];
    }
}

// Simple projection (exactly like working system)
class SimplePerspectiveProjection {
    constructor(viewDistance = 2.5) {
        this.viewDistance = Math.max(0.1, viewDistance);
    }
    
    getShaderCode() {
        return `vec3 project4Dto3D(vec4 p) { 
            float baseDistance = ${this.viewDistance.toFixed(2)}; 
            float dynamicDistance = max(0.2, baseDistance * (1.0 + u_morphFactor * 0.4 - u_audioMid * 0.35)); 
            float denominator = dynamicDistance + p.w; 
            float w_factor = dynamicDistance / max(0.1, denominator); 
            return p.xyz * w_factor; 
        }`;
    }
}

class SimpleProjectionManager {
    constructor() {
        this.projections = {};
        this._initProjections();
    }
    
    _initProjections() {
        this.registerProjection('perspective', new SimplePerspectiveProjection());
    }
    
    registerProjection(name, instance) {
        this.projections[name.toLowerCase()] = instance;
    }
    
    getProjection(name) {
        return this.projections[name?.toLowerCase()] || this.projections['perspective'];
    }
}

// Simple shader manager (exactly like working system)
class SimpleShaderManager {
    constructor(gl, geometryManager, projectionManager) {
        this.gl = gl;
        this.geometryManager = geometryManager;
        this.projectionManager = projectionManager;
        this.programs = {};
        this.uniformLocations = {};
        this.attributeLocations = {};
        this.currentProgramName = null;
        this._initShaderTemplates();
    }

    _initShaderTemplates() {
        this.vertexShaderSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }`;

        this.fragmentShaderSource = `
            precision highp float;
            uniform vec2 u_resolution; uniform float u_time;
            uniform float u_dimension; uniform float u_morphFactor; uniform float u_rotationSpeed;
            uniform float u_universeModifier; uniform float u_patternIntensity; uniform float u_gridDensity;
            uniform float u_lineThickness; uniform float u_shellWidth; uniform float u_tetraThickness;
            uniform float u_audioBass; uniform float u_audioMid; uniform float u_audioHigh;
            uniform float u_glitchIntensity; uniform float u_colorShift;
            uniform vec3 u_primaryColor; uniform vec3 u_secondaryColor; uniform vec3 u_backgroundColor;
            varying vec2 v_uv;
            
            mat4 rotXW(float a){float c=cos(a),s=sin(a);return mat4(c,0,0,-s, 0,1,0,0, 0,0,1,0, s,0,0,c);} 
            mat4 rotYW(float a){float c=cos(a),s=sin(a);return mat4(1,0,0,0, 0,c,0,-s, 0,0,1,0, 0,s,0,c);} 
            mat4 rotZW(float a){float c=cos(a),s=sin(a);return mat4(1,0,0,0, 0,1,0,0, 0,0,c,-s, 0,0,s,c);} 
            mat4 rotXY(float a){float c=cos(a),s=sin(a);return mat4(c,-s,0,0, s,c,0,0, 0,0,1,0, 0,0,0,1);} 
            mat4 rotYZ(float a){float c=cos(a),s=sin(a);return mat4(1,0,0,0, 0,c,-s,0, 0,s,c,0, 0,0,0,1);} 
            mat4 rotXZ(float a){float c=cos(a),s=sin(a);return mat4(c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1);}
            
            vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);} 
            vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
            
            //__PROJECTION_CODE_INJECTION_POINT__
            //__GEOMETRY_CODE_INJECTION_POINT__
            
            void main() {
                vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0); 
                vec2 uv = (v_uv * 2.0 - 1.0) * aspect;
                vec3 rayOrigin = vec3(0.0, 0.0, -2.5); 
                vec3 rayDirection = normalize(vec3(uv, 1.0));
                float camRotY = u_time * 0.05 * u_rotationSpeed + u_audioMid * 0.1; 
                float camRotX = sin(u_time * 0.03 * u_rotationSpeed) * 0.15 + u_audioHigh * 0.1;
                mat4 camMat = rotXY(camRotX) * rotYZ(camRotY); 
                rayDirection = (camMat * vec4(rayDirection, 0.0)).xyz;
                vec3 p = rayDirection * 1.5; 
                float latticeValue = calculateLattice(p);
                vec3 color = mix(u_backgroundColor, u_primaryColor, latticeValue);
                color = mix(color, u_secondaryColor, smoothstep(0.2, 0.7, u_audioMid) * latticeValue * 0.6);
                if (abs(u_colorShift) > 0.01) { 
                    vec3 hsv = rgb2hsv(color); 
                    hsv.x = fract(hsv.x + u_colorShift * 0.5 + u_audioHigh * 0.1); 
                    color = hsv2rgb(hsv); 
                }
                color *= (0.8 + u_patternIntensity * 0.7);
                if (u_glitchIntensity > 0.001) {
                     float glitch = u_glitchIntensity * (0.5 + 0.5 * sin(u_time * 8.0 + p.y * 10.0));
                     vec2 offsetR = vec2(cos(u_time*25.), sin(u_time*18.+p.x*5.)) * glitch * 0.2 * aspect; 
                     vec2 offsetB = vec2(sin(u_time*19.+p.y*6.), cos(u_time*28.)) * glitch * 0.15 * aspect;
                     vec3 pR = normalize(vec3(uv + offsetR/aspect, 1.0)); 
                     pR = (camMat*vec4(pR,0.0)).xyz * 1.5; 
                     vec3 pB = normalize(vec3(uv + offsetB/aspect, 1.0)); 
                     pB = (camMat*vec4(pB,0.0)).xyz * 1.5;
                     float latticeR = calculateLattice(pR); 
                     float latticeB = calculateLattice(pB);
                     vec3 colorR = mix(u_backgroundColor, u_primaryColor, latticeR); 
                     colorR = mix(colorR, u_secondaryColor, smoothstep(0.2, 0.7, u_audioMid) * latticeR * 0.6);
                     vec3 colorB = mix(u_backgroundColor, u_primaryColor, latticeB); 
                     colorB = mix(colorB, u_secondaryColor, smoothstep(0.2, 0.7, u_audioMid) * latticeB * 0.6);
                     if (abs(u_colorShift) > 0.01) { 
                         vec3 hsvR=rgb2hsv(colorR); 
                         hsvR.x=fract(hsvR.x+u_colorShift*0.5+u_audioHigh*0.1); 
                         colorR=hsv2rgb(hsvR); 
                         vec3 hsvB=rgb2hsv(colorB); 
                         hsvB.x=fract(hsvB.x+u_colorShift*0.5+u_audioHigh*0.1); 
                         colorB=hsv2rgb(hsvB); 
                     }
                     color = vec3(colorR.r, color.g, colorB.b); 
                     color *= (0.8 + u_patternIntensity * 0.7);
                }
                color = pow(clamp(color, 0.0, 1.5), vec3(0.9));
                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    createDynamicProgram(programName, geometryTypeName, projectionMethodName) {
        const gl = this.gl;
        
        // Compile vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, this.vertexShaderSource);
        gl.compileShader(vertexShader);
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Simple vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
            return null;
        }

        // Get geometry and projection code
        const geom = this.geometryManager.getGeometry(geometryTypeName);
        const proj = this.projectionManager.getProjection(projectionMethodName);
        
        if (!geom || !proj) {
            console.error('Simple geometry or projection not found');
            return null;
        }

        // Inject code into fragment shader
        let fragmentSource = this.fragmentShaderSource;
        fragmentSource = fragmentSource.replace('//__PROJECTION_CODE_INJECTION_POINT__', proj.getShaderCode());
        fragmentSource = fragmentSource.replace('//__GEOMETRY_CODE_INJECTION_POINT__', geom.getShaderCode());

        // Compile fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Simple fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
            return null;
        }

        // Create and link program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Simple program linking error:', gl.getProgramInfoLog(program));
            return null;
        }

        this.programs[programName] = program;
        this.uniformLocations[programName] = {};
        this.attributeLocations[programName] = {};
        
        return program;
    }

    useProgram(programName) {
        const program = this.programs[programName];
        if (program) {
            this.gl.useProgram(program);
            this.currentProgramName = programName;
            return true;
        }
        return false;
    }

    getUniformLocation(name) {
        if (!this.currentProgramName) return null;
        
        const cache = this.uniformLocations[this.currentProgramName];
        if (cache.hasOwnProperty(name)) {
            return cache[name];
        }
        
        const loc = this.gl.getUniformLocation(this.programs[this.currentProgramName], name);
        cache[name] = loc;
        return loc;
    }

    getAttributeLocation(name) {
        if (!this.currentProgramName) return null;
        
        const cache = this.attributeLocations[this.currentProgramName];
        if (cache.hasOwnProperty(name)) {
            return cache[name];
        }
        
        const loc = this.gl.getAttribLocation(this.programs[this.currentProgramName], name);
        cache[name] = (loc === -1) ? null : loc;
        return cache[name];
    }
}

// Simple hypercube core (exactly like working system)
class SimpleHypercubeCore {
    constructor(canvas, shaderManager, options = {}) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        this.shaderManager = shaderManager;
        
        this.state = {
            startTime: 0,
            time: 0.0,
            resolution: [canvas.width, canvas.height],
            geometryType: 'hypercube',
            projectionMethod: 'perspective',
            dimensions: 4.0,
            morphFactor: 0.5,
            rotationSpeed: 0.2,
            universeModifier: 1.0,
            patternIntensity: 1.0,
            gridDensity: 8.0,
            lineThickness: 0.03,
            shellWidth: 0.025,
            tetraThickness: 0.035,
            glitchIntensity: 0.0,
            colorShift: 0.0,
            audioLevels: { bass: 0, mid: 0, high: 0 },
            colorScheme: {
                primary: [1.0, 0.3, 0.9],    // Hot pink
                secondary: [0.3, 1.0, 1.0],  // Cyan
                background: [0.1, 0.0, 0.3]  // Deep purple
            },
            isRendering: false,
            animationFrameId: null,
            ...options
        };

        this._initBuffers();
        this._updateShader();
    }

    _initBuffers() {
        const gl = this.gl;
        const positions = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
        
        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    _updateShader() {
        const program = this.shaderManager.createDynamicProgram(
            'simpleVib3',
            this.state.geometryType,
            this.state.projectionMethod
        );
        
        if (program) {
            this.shaderManager.useProgram('simpleVib3');
            this.aPositionLoc = this.shaderManager.getAttributeLocation('a_position');
        }
    }

    updateParameters(newParams) {
        Object.assign(this.state, newParams);
        
        if (newParams.geometryType || newParams.projectionMethod) {
            this._updateShader();
        }
    }

    _setUniforms() {
        const gl = this.gl;
        const s = this.state;
        
        const setUniform = (name, value) => {
            const loc = this.shaderManager.getUniformLocation(name);
            if (loc) {
                if (Array.isArray(value)) {
                    if (value.length === 2) gl.uniform2fv(loc, value);
                    else if (value.length === 3) gl.uniform3fv(loc, value);
                } else {
                    gl.uniform1f(loc, value);
                }
            }
        };

        setUniform('u_time', s.time);
        setUniform('u_resolution', s.resolution);
        setUniform('u_dimension', s.dimensions);
        setUniform('u_morphFactor', s.morphFactor);
        setUniform('u_rotationSpeed', s.rotationSpeed);
        setUniform('u_universeModifier', s.universeModifier);
        setUniform('u_patternIntensity', s.patternIntensity);
        setUniform('u_gridDensity', s.gridDensity);
        setUniform('u_lineThickness', s.lineThickness);
        setUniform('u_shellWidth', s.shellWidth);
        setUniform('u_tetraThickness', s.tetraThickness);
        setUniform('u_glitchIntensity', s.glitchIntensity);
        setUniform('u_colorShift', s.colorShift);
        setUniform('u_audioBass', s.audioLevels.bass);
        setUniform('u_audioMid', s.audioLevels.mid);
        setUniform('u_audioHigh', s.audioLevels.high);
        setUniform('u_primaryColor', s.colorScheme.primary);
        setUniform('u_secondaryColor', s.colorScheme.secondary);
        setUniform('u_backgroundColor', s.colorScheme.background);
    }

    _render(timestamp) {
        if (!this.state.isRendering) return;
        
        const gl = this.gl;
        if (!this.state.startTime) this.state.startTime = timestamp;
        
        this.state.time = (timestamp - this.state.startTime) * 0.001;
        
        // Handle canvas resize
        if (this.canvas.width !== this.canvas.clientWidth || this.canvas.height !== this.canvas.clientHeight) {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
            this.state.resolution = [this.canvas.width, this.canvas.height];
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        this._setUniforms();
        
        const bg = this.state.colorScheme.background;
        gl.clearColor(bg[0], bg[1], bg[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        if (this.quadBuffer && this.aPositionLoc !== null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
            gl.enableVertexAttribArray(this.aPositionLoc);
            gl.vertexAttribPointer(this.aPositionLoc, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        
        this.state.animationFrameId = requestAnimationFrame(this._render.bind(this));
    }

    start() {
        if (this.state.isRendering) return;
        this.state.isRendering = true;
        this.state.startTime = performance.now();
        this.state.animationFrameId = requestAnimationFrame(this._render.bind(this));
    }

    stop() {
        this.state.isRendering = false;
        if (this.state.animationFrameId) {
            cancelAnimationFrame(this.state.animationFrameId);
        }
    }

    dispose() {
        this.stop();
        if (this.gl && this.quadBuffer) {
            this.gl.deleteBuffer(this.quadBuffer);
        }
    }
}

// Main Simple Integration Class - EXACT copy of working GEN-RL-MillZ approach
class SimpleWorkingVisualizerIntegration {
    constructor() {
        this.canvas = null;
        this.core = null;
        this.geometryManager = null;
        this.projectionManager = null;
        this.shaderManager = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🚀 Initializing Simple Working Visualizer...');
            
            // Create canvas exactly like GEN-RL-MillZ
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'simple-working-canvas';
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 1;
                pointer-events: none;
                mix-blend-mode: screen;
                opacity: 0.7;
            `;
            
            // Insert before existing canvas container
            const canvasContainer = document.getElementById('canvas-container');
            if (canvasContainer) {
                canvasContainer.parentNode.insertBefore(this.canvas, canvasContainer);
            } else {
                document.body.appendChild(this.canvas);
            }

            // Get WebGL context exactly like GEN-RL-MillZ
            const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
            if (!gl) {
                console.warn('WebGL not supported for simple effects');
                return false;
            }

            // Set canvas size exactly like GEN-RL-MillZ
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            // Initialize managers exactly like GEN-RL-MillZ
            this.geometryManager = new SimpleGeometryManager();
            this.projectionManager = new SimpleProjectionManager();
            this.shaderManager = new SimpleShaderManager(gl, this.geometryManager, this.projectionManager);
            
            // Initialize core exactly like GEN-RL-MillZ with cereal deity colors
            this.core = new SimpleHypercubeCore(this.canvas, this.shaderManager, {
                geometryType: 'hypercube',
                projectionMethod: 'perspective',
                morphFactor: 0.6,
                rotationSpeed: 0.4,
                universeModifier: 1.3,
                gridDensity: 10.0,
                lineThickness: 0.02,
                glitchIntensity: 0.1,
                colorShift: 0.2,
                dimensions: 4.2,
                colorScheme: {
                    primary: [1.0, 0.3, 0.9],    // Hot pink 
                    secondary: [0.3, 1.0, 1.0],  // Cyan
                    background: [0.1, 0.0, 0.3]  // Deep purple
                }
            });

            this.isInitialized = true;
            this.startEffects();
            
            // Handle window resize exactly like GEN-RL-MillZ
            window.addEventListener('resize', () => {
                if (this.canvas) {
                    this.canvas.width = window.innerWidth;
                    this.canvas.height = window.innerHeight;
                }
            });
            
            console.log('✅ Simple Working Visualizer Integration ready');
            return true;
        } catch (error) {
            console.error('❌ Simple visualizer initialization failed:', error);
            return false;
        }
    }

    startEffects() {
        if (!this.isInitialized) return;
        
        this.core.start();
        
        // Simple parameter modulation exactly like GEN-RL-MillZ
        this.effectInterval = setInterval(() => {
            const time = performance.now() * 0.001;
            
            // Simple oscillations like GEN-RL-MillZ
            const spoonWave = Math.sin(time * 0.3);
            const milkWave = Math.cos(time * 0.4);
            const crunchWave = Math.sin(time * 0.7);
            
            const newParams = {
                morphFactor: 0.6 + 0.3 * spoonWave,
                rotationSpeed: 0.3 + 0.2 * milkWave,
                universeModifier: 1.2 + 0.4 * crunchWave,
                gridDensity: 10.0 + 5.0 * Math.sin(time * 0.5),
                glitchIntensity: Math.max(0, 0.15 + 0.1 * Math.sin(time * 0.8)),
                colorShift: 0.2 + 0.1 * Math.sin(time * 0.6),
                audioLevels: {
                    bass: 0.4 + 0.3 * Math.sin(time * 0.9),
                    mid: 0.5 + 0.3 * Math.cos(time * 1.1),
                    high: 0.3 + 0.2 * Math.sin(time * 1.3)
                }
            };
            
            this.core.updateParameters(newParams);
        }, 60);
    }

    dispose() {
        if (this.effectInterval) {
            clearInterval(this.effectInterval);
        }
        if (this.core) {
            this.core.dispose();
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.isInitialized = false;
    }
}

// Export the simple working system
window.SimpleWorkingVisualizerIntegration = SimpleWorkingVisualizerIntegration;

console.log('🎨 Simple Working Visualizer loaded - exact GEN-RL-MillZ copy!');