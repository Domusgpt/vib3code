// ==========================================================================
// Enhanced HyperAV Integration for VIB3CODE - Combining PPPkernel Architecture
// with Working GEN-RL-MillZ Visualizer for Agentic Editorial Control
// ==========================================================================

// Core Geometry Management System (from PPPkernel architecture)
class GeometryManager {
    constructor() {
        this.geometries = {};
        this._initGeometries();
    }
    
    _initGeometries() {
        this.registerGeometry('hypercube', new HypercubeGeometry());
        this.registerGeometry('hypersphere', new HypersphereGeometry());
        this.registerGeometry('hypertetrahedron', new HypertetrahedronGeometry());
        this.registerGeometry('duocylinder', new DuocylinderGeometry());
        this.registerGeometry('editorial', new EditorialGeometry());
    }
    
    registerGeometry(name, instance) {
        this.geometries[name.toLowerCase()] = instance;
    }
    
    getGeometry(name) {
        return this.geometries[name?.toLowerCase()] || this.geometries['hypercube'];
    }
}

// Enhanced geometries with editorial-specific variants
class HypercubeGeometry {
    getShaderCode() {
        return `
            float calculateLattice(vec3 p) {
                float dynamicGridDensity = max(0.1, u_gridDensity * (1.0 + u_audioBass * 0.7 + u_dataChannel0 * 0.5));
                float dynamicLineThickness = max(0.002, u_lineThickness * (1.0 - u_audioMid * 0.6 + u_dataChannel1 * 0.3));

                vec3 p_grid3D = fract(p * dynamicGridDensity * 0.5 + u_time * 0.01);
                vec3 dist3D = abs(p_grid3D - 0.5);
                float box3D = max(dist3D.x, max(dist3D.y, dist3D.z));
                float lattice3D = smoothstep(0.5, 0.5 - dynamicLineThickness, box3D);

                float finalLattice = lattice3D;
                float dim_factor = smoothstep(3.0, 4.5, u_dimension);

                if (dim_factor > 0.01) {
                    float w_coord = sin(p.x*1.4 - p.y*0.7 + p.z*1.5 + u_time * 0.25)
                                  * cos(length(p) * 1.1 - u_time * 0.35 + u_audioMid * 2.5 + u_dataChannel2 * 3.0)
                                  * dim_factor * (0.4 + u_morphFactor * 0.6 + u_audioHigh * 0.6 + u_dataChannel3 * 0.4);

                    vec4 p4d = vec4(p, w_coord);
                    float baseSpeed = u_rotationSpeed * (1.0 + u_dataChannel4 * 0.5);
                    float time_rot1 = u_time * 0.33 * baseSpeed + u_audioHigh * 0.25 + u_morphFactor * 0.45;
                    float time_rot2 = u_time * 0.28 * baseSpeed - u_audioMid * 0.28 + u_dataChannel5 * 0.3;
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

class EditorialGeometry {
    getShaderCode() {
        return `
            float calculateLattice(vec3 p) {
                // Editorial grid pattern - sophisticated magazine-style layout
                float readingFlow = u_dataChannel0; // 0-1: how focused the reading experience
                float contentDepth = u_dataChannel1; // 0-1: complexity of current content
                float editorialMood = u_dataChannel2; // 0-1: calm to energetic
                
                float baseGrid = max(0.1, u_gridDensity * (0.8 + readingFlow * 0.4));
                float refinedThickness = max(0.001, u_lineThickness * (0.7 + contentDepth * 0.6));
                
                // Golden ratio grid for editorial elegance
                vec3 goldenP = p * baseGrid * 1.618;
                vec3 p_fract = fract(goldenP + u_time * 0.005 * editorialMood);
                vec3 gridDist = abs(p_fract - 0.5);
                
                // Create magazine-style columns
                float columnStructure = max(gridDist.x * 0.7, max(gridDist.y, gridDist.z * 1.2));
                float editorialGrid = smoothstep(0.5, 0.5 - refinedThickness, columnStructure);
                
                // Add subtle typographic rhythm
                float typeRhythm = sin(p.y * baseGrid * 8.0 + u_time * 0.1) * 0.1 * contentDepth;
                float focusArea = 1.0 - smoothstep(0.0, 2.0, length(p)) * (1.0 - readingFlow);
                
                return editorialGrid * focusArea + typeRhythm;
            }
        `;
    }
}

// Enhanced projection manager with editorial modes
class ProjectionManager {
    constructor() {
        this.projections = {};
        this._initProjections();
    }
    
    _initProjections() {
        this.registerProjection('perspective', new PerspectiveProjection());
        this.registerProjection('orthographic', new OrthographicProjection());
        this.registerProjection('stereographic', new StereographicProjection());
        this.registerProjection('editorial', new EditorialProjection());
    }
    
    registerProjection(name, instance) {
        this.projections[name.toLowerCase()] = instance;
    }
    
    getProjection(name) {
        return this.projections[name?.toLowerCase()] || this.projections['perspective'];
    }
}

class EditorialProjection {
    getShaderCode() {
        return `vec3 project4Dto3D(vec4 p) {
            float readabilityFocus = u_dataChannel6; // 0-1: how focused on readability
            float spatialContext = u_dataChannel7; // 0-1: how much spatial context to show
            
            float baseDistance = 2.5 + readabilityFocus * 1.0;
            float dynamicDistance = max(0.2, baseDistance * (1.0 + u_morphFactor * 0.3 - u_audioMid * 0.2));
            float denominator = dynamicDistance + p.w * (1.0 - spatialContext * 0.5);
            float w_factor = dynamicDistance / max(0.1, denominator);
            
            // Gentle editorial transformation for readability
            vec3 editorialP = p.xyz * w_factor;
            editorialP.y *= (1.0 + readabilityFocus * 0.2); // Slight vertical emphasis for reading
            
            return editorialP;
        }`;
    }
}

// Agentic Visualizer Controller (PPPkernel architecture)
class AgenticVisualizerController {
    constructor(hypercubeCore, config = {}) {
        this.core = hypercubeCore;
        this.editorialState = {
            currentSection: 'home',
            contentComplexity: 0.5,
            readingEngagement: 0.5,
            visualMood: 'sophisticated',
            userInteraction: 0.0
        };
        
        // Data mapping rules for editorial control
        this.mappingRules = {
            ubo: [
                { snapshotField: 'scrollProgress', uboChannelIndex: 0, defaultValue: 0.0 },
                { snapshotField: 'contentComplexity', uboChannelIndex: 1, defaultValue: 0.5 },
                { snapshotField: 'readingFocus', uboChannelIndex: 2, defaultValue: 0.5 },
                { snapshotField: 'editorialMood', uboChannelIndex: 3, defaultValue: 0.5 },
                { snapshotField: 'interactionIntensity', uboChannelIndex: 4, defaultValue: 0.0 },
                { snapshotField: 'visualComplexity', uboChannelIndex: 5, defaultValue: 0.7 },
                { snapshotField: 'spatialAwareness', uboChannelIndex: 6, defaultValue: 0.6 },
                { snapshotField: 'contextualDepth', uboChannelIndex: 7, defaultValue: 0.8 }
            ],
            direct: {
                'section_theme': { coreStateName: 'geometryType', defaultValue: 'hypercube' },
                'visual_intensity': { coreStateName: 'patternIntensity', defaultValue: 1.0 },
                'reading_speed': { coreStateName: 'rotationSpeed', defaultValue: 0.3 }
            }
        };
        
        this.initializeEditorialModes();
        console.log('🎨 Agentic Visualizer Controller initialized for VIB3CODE');
    }
    
    initializeEditorialModes() {
        this.editorialModes = {
            'home': {
                geometry: 'hypercube',
                projection: 'perspective',
                colorScheme: {
                    primary: [0.1, 0.8, 1.0],    // VIB3 cyan
                    secondary: [1.0, 0.2, 0.6],  // Editorial pink
                    background: [0.05, 0.05, 0.15] // Deep editorial
                },
                complexity: 0.8
            },
            'articles': {
                geometry: 'editorial',
                projection: 'editorial',
                colorScheme: {
                    primary: [0.9, 0.9, 0.9],    // Clean text
                    secondary: [0.3, 0.7, 1.0],  // Accent blue
                    background: [0.02, 0.02, 0.08] // Reading background
                },
                complexity: 0.4
            },
            'philosophy': {
                geometry: 'hypersphere',
                projection: 'stereographic',
                colorScheme: {
                    primary: [1.0, 0.8, 0.2],    // Golden wisdom
                    secondary: [0.8, 0.3, 1.0],  // Deep purple
                    background: [0.08, 0.05, 0.12] // Contemplative
                },
                complexity: 0.9
            },
            'technical': {
                geometry: 'hypertetrahedron',
                projection: 'orthographic',
                colorScheme: {
                    primary: [0.2, 1.0, 0.3],    // Matrix green
                    secondary: [1.0, 0.5, 0.0],  // Warning orange
                    background: [0.0, 0.05, 0.0]  // Terminal dark
                },
                complexity: 1.0
            }
        };
    }
    
    // API for agentic editorial control
    setEditorialContext(context) {
        const mode = this.editorialModes[context.section] || this.editorialModes['home'];
        
        this.core.updateParameters({
            geometryType: mode.geometry,
            projectionMethod: mode.projection,
            colorScheme: mode.colorScheme,
            patternIntensity: mode.complexity * (context.intensity || 1.0),
            morphFactor: 0.3 + (context.complexity || 0.5) * 0.4,
            rotationSpeed: 0.2 + (context.dynamism || 0.5) * 0.3
        });
        
        console.log(`🎨 Editorial context set to: ${context.section}`);
    }
    
    updateReadingMetrics(metrics) {
        const dataSnapshot = {
            scrollProgress: metrics.scrollProgress || 0.0,
            contentComplexity: metrics.contentComplexity || 0.5,
            readingFocus: metrics.timeOnPage / 1000 / 60, // minutes to 0-1
            editorialMood: metrics.engagement || 0.5,
            interactionIntensity: metrics.clicksPerMinute / 10, // normalize
            visualComplexity: metrics.contentType === 'technical' ? 1.0 : 0.7,
            spatialAwareness: metrics.windowWidth > 1200 ? 1.0 : 0.6,
            contextualDepth: metrics.depth || 0.8
        };
        
        this.updateData(dataSnapshot);
    }
    
    updateData(dataSnapshot) {
        // Map data to UBO channels for shader control
        const uboSize = 64;
        let uboDataArray = new Float32Array(uboSize).fill(0.0);
        
        this.mappingRules.ubo.forEach(rule => {
            let value = dataSnapshot[rule.snapshotField] || rule.defaultValue;
            
            // Apply editorial transformations
            if (rule.snapshotField === 'scrollProgress') {
                value = this.smoothScrollMapping(value);
            } else if (rule.snapshotField === 'contentComplexity') {
                value = this.complexityMapping(value);
            }
            
            if (rule.uboChannelIndex < uboSize) {
                uboDataArray[rule.uboChannelIndex] = parseFloat(value);
            }
        });
        
        this.core.updateParameters({ 
            dataChannels: uboDataArray,
            globalDataBuffer: uboDataArray 
        });
        
        // Update direct parameters
        const directParams = {};
        Object.keys(this.mappingRules.direct).forEach(field => {
            const rule = this.mappingRules.direct[field];
            if (dataSnapshot[field] !== undefined) {
                directParams[rule.coreStateName] = dataSnapshot[field];
            }
        });
        
        if (Object.keys(directParams).length > 0) {
            this.core.updateParameters(directParams);
        }
    }
    
    smoothScrollMapping(scrollProgress) {
        // Smooth scroll influence - less jarring for editorial
        return Math.sin(scrollProgress * Math.PI) * 0.7 + 0.3;
    }
    
    complexityMapping(complexity) {
        // Editorial complexity curve - favor readable ranges
        return Math.pow(complexity, 1.5) * 0.8 + 0.2;
    }
    
    // Quick presets for different editorial contexts
    applyEditorialPreset(presetName) {
        const presets = {
            'focused-reading': {
                geometryType: 'editorial',
                projectionMethod: 'editorial',
                patternIntensity: 0.3,
                rotationSpeed: 0.1,
                morphFactor: 0.2
            },
            'dynamic-showcase': {
                geometryType: 'hypercube',
                projectionMethod: 'perspective',
                patternIntensity: 1.2,
                rotationSpeed: 0.6,
                morphFactor: 0.8
            },
            'philosophical-depth': {
                geometryType: 'hypersphere',
                projectionMethod: 'stereographic',
                patternIntensity: 0.9,
                rotationSpeed: 0.3,
                morphFactor: 0.9
            },
            'technical-precision': {
                geometryType: 'hypertetrahedron',
                projectionMethod: 'orthographic',
                patternIntensity: 1.1,
                rotationSpeed: 0.4,
                morphFactor: 0.6
            }
        };
        
        const preset = presets[presetName];
        if (preset) {
            this.core.updateParameters(preset);
            console.log(`🎨 Applied editorial preset: ${presetName}`);
        }
    }
}

// Enhanced shader manager with data channel support
class EnhancedShaderManager {
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
            
            // Data channels for agentic control (PPPkernel architecture)
            uniform float u_dataChannel0; uniform float u_dataChannel1; uniform float u_dataChannel2; uniform float u_dataChannel3;
            uniform float u_dataChannel4; uniform float u_dataChannel5; uniform float u_dataChannel6; uniform float u_dataChannel7;
            uniform float u_dataChannel8; uniform float u_dataChannel9; uniform float u_dataChannel10; uniform float u_dataChannel11;
            uniform float u_dataChannel12; uniform float u_dataChannel13; uniform float u_dataChannel14; uniform float u_dataChannel15;
            
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
                
                // Data-driven camera movement
                float camRotY = u_time * 0.05 * u_rotationSpeed + u_audioMid * 0.1 + u_dataChannel0 * 0.2; 
                float camRotX = sin(u_time * 0.03 * u_rotationSpeed) * 0.15 + u_audioHigh * 0.1 + u_dataChannel1 * 0.1;
                mat4 camMat = rotXY(camRotX) * rotYZ(camRotY); 
                rayDirection = (camMat * vec4(rayDirection, 0.0)).xyz;
                
                vec3 p = rayDirection * (1.5 + u_dataChannel2 * 0.5); 
                float latticeValue = calculateLattice(p);
                
                // Data-driven color mixing
                vec3 color = mix(u_backgroundColor, u_primaryColor, latticeValue);
                color = mix(color, u_secondaryColor, smoothstep(0.2, 0.7, u_audioMid + u_dataChannel3 * 0.3) * latticeValue * 0.6);
                
                if (abs(u_colorShift) > 0.01) { 
                    vec3 hsv = rgb2hsv(color); 
                    hsv.x = fract(hsv.x + u_colorShift * 0.5 + u_audioHigh * 0.1 + u_dataChannel4 * 0.1); 
                    color = hsv2rgb(hsv); 
                }
                
                color *= (0.8 + u_patternIntensity * 0.7 + u_dataChannel5 * 0.3);
                
                // Editorial enhancement - soften for readability
                float editorialSoftness = u_dataChannel6; // Reading focus
                color = mix(color, color * 0.8 + vec3(0.1, 0.1, 0.15), editorialSoftness * 0.3);
                
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
            console.error('Enhanced vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
            return null;
        }

        // Get geometry and projection code
        const geom = this.geometryManager.getGeometry(geometryTypeName);
        const proj = this.projectionManager.getProjection(projectionMethodName);
        
        if (!geom || !proj) {
            console.error('Enhanced geometry or projection not found');
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
            console.error('Enhanced fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
            return null;
        }

        // Create and link program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Enhanced program linking error:', gl.getProgramInfoLog(program));
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

// Enhanced Hypercube Core with PPPkernel data channel support
class EnhancedHypercubeCore {
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
                primary: [0.1, 0.8, 1.0],
                secondary: [1.0, 0.2, 0.6],
                background: [0.05, 0.05, 0.15]
            },
            // PPPkernel data channels
            globalDataBuffer: new Float32Array(64).fill(0.0),
            dataChannels: new Float32Array(16).fill(0.0),
            isRendering: false,
            animationFrameId: null,
            ...options
        };

        this._initBuffers();
        this._updateShader();
        console.log('🔧 Enhanced HypercubeCore initialized with data channels');
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
            'vib3codeEnhanced',
            this.state.geometryType,
            this.state.projectionMethod
        );
        
        if (program) {
            this.shaderManager.useProgram('vib3codeEnhanced');
            this.aPositionLoc = this.shaderManager.getAttributeLocation('a_position');
        }
    }

    updateParameters(newParams) {
        Object.assign(this.state, newParams);
        
        // Handle data channel updates
        if (newParams.dataChannels) {
            this.state.dataChannels = new Float32Array(newParams.dataChannels);
        }
        
        if (newParams.globalDataBuffer) {
            this.state.globalDataBuffer = new Float32Array(newParams.globalDataBuffer);
        }
        
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

        // Standard uniforms
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
        
        // Data channel uniforms (PPPkernel architecture)
        for (let i = 0; i < 16; i++) {
            setUniform(`u_dataChannel${i}`, s.dataChannels[i] || 0.0);
        }
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

// Main Enhanced Integration Class
class VIB3CodeEnhancedVisualizerIntegration {
    constructor() {
        this.canvas = null;
        this.core = null;
        this.controller = null;
        this.geometryManager = null;
        this.projectionManager = null;
        this.shaderManager = null;
        this.isInitialized = false;
        
        // Editorial context tracking
        this.currentSection = 'home';
        this.readingMetrics = {
            scrollProgress: 0,
            timeOnPage: 0,
            engagement: 0.5,
            complexity: 0.5
        };
    }

    async init() {
        try {
            console.log('🚀 Initializing VIB3CODE Enhanced Visualizer...');
            
            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'vib3code-enhanced-canvas';
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 1;
                pointer-events: none;
                mix-blend-mode: overlay;
                opacity: 0.9;
            `;
            
            // Insert into DOM
            document.body.appendChild(this.canvas);

            // Get WebGL context
            const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
            if (!gl) {
                console.warn('WebGL not supported for enhanced effects');
                return false;
            }

            // Set canvas size
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            // Initialize enhanced system
            this.geometryManager = new GeometryManager();
            this.projectionManager = new ProjectionManager();
            this.shaderManager = new EnhancedShaderManager(gl, this.geometryManager, this.projectionManager);
            
            // Create enhanced core
            this.core = new EnhancedHypercubeCore(this.canvas, this.shaderManager, {
                geometryType: 'editorial',
                projectionMethod: 'editorial',
                colorScheme: {
                    primary: [0.1, 0.8, 1.0],
                    secondary: [1.0, 0.2, 0.6],
                    background: [0.05, 0.05, 0.15]
                }
            });

            // Create agentic controller
            this.controller = new AgenticVisualizerController(this.core);

            this.isInitialized = true;
            this.startSystem();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ VIB3CODE Enhanced Visualizer Integration ready');
            return true;
        } catch (error) {
            console.error('❌ Enhanced visualizer initialization failed:', error);
            return false;
        }
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.canvas) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
        });
        
        // Track reading metrics
        let startTime = Date.now();
        
        window.addEventListener('scroll', () => {
            const scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            this.readingMetrics.scrollProgress = Math.min(1, Math.max(0, scrollProgress));
            this.updateVisualizerData();
        });
        
        setInterval(() => {
            this.readingMetrics.timeOnPage = Date.now() - startTime;
            this.updateVisualizerData();
        }, 1000);
        
        // Track interactions
        let interactionCount = 0;
        ['click', 'keydown', 'mousemove'].forEach(event => {
            window.addEventListener(event, () => {
                interactionCount++;
                this.readingMetrics.engagement = Math.min(1, interactionCount / 100);
            });
        });
    }

    updateVisualizerData() {
        if (!this.controller) return;
        
        this.controller.updateReadingMetrics(this.readingMetrics);
    }

    startSystem() {
        if (!this.isInitialized) return;
        
        this.core.start();
        
        // Gentle editorial animation loop
        this.effectInterval = setInterval(() => {
            const time = performance.now() * 0.001;
            
            // Subtle editorial rhythms
            const readingRhythm = Math.sin(time * 0.2) * 0.1 + 0.9;
            const focusWave = Math.cos(time * 0.15) * 0.05 + 0.95;
            const complexityOscillation = Math.sin(time * 0.1) * 0.1 + 0.8;
            
            this.controller.updateData({
                editorial_rhythm: readingRhythm,
                focus_state: focusWave,
                content_complexity: complexityOscillation,
                reading_flow: this.readingMetrics.scrollProgress
            });
        }, 100);
    }

    // Public API for magazine system integration
    applySectionPreset(section) {
        if (!this.controller) return;
        
        this.currentSection = section;
        this.controller.setEditorialContext({
            section: section,
            intensity: 1.0,
            complexity: this.getSectionComplexity(section)
        });
    }

    getSectionComplexity(section) {
        const complexityMap = {
            'home': 0.7,
            'articles': 0.4,
            'videos': 0.6,
            'interactives': 0.9,
            'philosophy': 0.8,
            'technical': 1.0
        };
        return complexityMap[section] || 0.5;
    }

    setEditorialMood(mood) {
        if (!this.controller) return;
        
        this.controller.applyEditorialPreset(mood);
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

// Duocylinder geometry for additional variety
class DuocylinderGeometry {
    getShaderCode() {
        return `
            float calculateLattice(vec3 p) {
                float density = max(0.1, u_gridDensity * 0.6 * (1.0 + u_audioBass * 0.3 + u_dataChannel0 * 0.4));
                float thickness = max(0.002, u_lineThickness * (1.0 + u_audioMid * 0.8 + u_dataChannel1 * 0.5));
                
                // Duocylinder: x²+y² ≤ 1 and z²+w² ≤ 1
                vec2 xy = p.xy;
                float z_coord = p.z;
                float w_coord = sin(xy.x * 2.0 + xy.y * 1.5 + u_time * 0.3 + u_dataChannel2 * 2.0) 
                               * cos(length(xy) * 3.0 - u_time * 0.4 + u_audioHigh * 1.5)
                               * (0.3 + u_morphFactor * 0.4 + u_dataChannel3 * 0.3);
                
                vec4 p4d = vec4(xy, z_coord, w_coord);
                float time_rot = u_time * u_rotationSpeed * 0.7 + u_dataChannel4 * 0.5;
                p4d = rotXW(time_rot) * rotYZ(time_rot * 1.2) * p4d;
                
                vec3 projP = project4Dto3D(p4d);
                
                float xy_radius = length(projP.xy);
                float zw_radius = length(vec2(projP.z, w_coord));
                
                float cy1 = 1.0 - smoothstep(0.8, 0.8 + thickness, xy_radius);
                float cy2 = 1.0 - smoothstep(0.8, 0.8 + thickness, zw_radius);
                
                return max(cy1, cy2) * (0.7 + u_dataChannel5 * 0.6);
            }
        `;
    }
}

// Export enhanced system
window.VIB3CodeEnhancedVisualizerIntegration = VIB3CodeEnhancedVisualizerIntegration;

console.log('🎨 VIB3CODE Enhanced Visualizer loaded - PPPkernel + GEN-RL-MillZ fusion ready!');