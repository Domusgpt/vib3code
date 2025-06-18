/* core/HypercubeCore.js - v1.4 */
import ShaderManager from './ShaderManager.js';

/*
 * CONCEPTUAL: Offline Rendering / Custom Frame Rate
 * To support rendering image sequences or operating without being tied to display refresh rate,
 * the following modifications could be considered:
 *
 * 1. Manual Frame Rendering Method:
 *    - Introduce a method like `renderSingleFrame(time, parameters)`:
 *      - This method would take a specific time and current parameters.
 *      - It would execute the core drawing logic (currently in `_drawFrameLogic` or similar).
 *      - It would *not* call `requestAnimationFrame`.
 *
 * 2. Offscreen Framebuffer (FBO):
 *    - Create and manage a WebGL Framebuffer Object (FBO).
 *    - Before drawing in `renderSingleFrame`, bind this FBO.
 *    - After drawing, unbind the FBO.
 *    - Implement a method like `getFrameData()` that uses `gl.readPixels()` to extract
 *      the rendered image from the FBO's texture attachment.
 *
 * 3. External Loop:
 *    - An external script would then call `renderSingleFrame` repeatedly with advancing
 *      time steps and collect data via `getFrameData` to save as an image sequence.
 *
 * 4. Headless GL (Advanced):
 *    - For running outside a browser, the WebGL context creation and canvas handling
 *      would need to be abstracted to use a headless GL library (e.g., in Node.js).
 *      This would be a more significant refactoring.
 *
 * The `_drawFrameLogic` method below is a first step towards isolating the core rendering commands.
 */

const DEFAULT_STATE = {
    startTime: 0, lastUpdateTime: 0, deltaTime: 0, time: 0.0, resolution: [0, 0],
    mouse: [0.5, 0.5],
    geometryType: 'hypercube', projectionMethod: 'perspective', dimensions: 4.0,
    morphFactor: 0.5, rotationSpeed: 0.2, universeModifier: 1.0, patternIntensity: 1.0,
    gridDensity: 8.0,
    gridDensity_lattice: 10.0,
    lineThickness: 0.03, shellWidth: 0.025, tetraThickness: 0.035,
    glitchIntensity: 0.0, colorShift: 0.0,
    isFullScreenEffect: 0,
    dataChannels: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    colorScheme: { primary: [1.0, 0.2, 0.8], secondary: [0.2, 1.0, 1.0], background: [0.05, 0.0, 0.2] },

    // New Projection Uniforms (Perspective)
    proj_perspective_baseDistance: 2.5,
    proj_perspective_morphFactorImpact: 0.4,
    proj_perspective_channelImpact: 0.35,
    proj_perspective_denomMin: 0.1,

    // New Projection Uniforms (Stereographic)
    proj_stereo_basePoleW: -1.5,
    proj_stereo_channelImpact: 0.4,
    proj_stereo_epsilon: 0.001,
    proj_stereo_singularityScale: 1000.0,
    proj_stereo_morphFactorImpact: 0.8,

    // New Geometry Uniforms (HypercubeGeometry)
    geom_hypercube_gridDensity_channel0Factor: 0.7,
    geom_hypercube_gridDensity_timeFactor: 0.01,
    geom_hypercube_lineThickness_channel1Factor: 0.6,
    geom_hypercube_wCoord_pCoeffs1: [1.4, -0.7, 1.5],
    geom_hypercube_wCoord_timeFactor1: 0.25,
    geom_hypercube_wCoord_pLengthFactor: 1.1,
    geom_hypercube_wCoord_timeFactor2: 0.35,
    geom_hypercube_wCoord_channel1Factor: 2.5,
    geom_hypercube_wCoord_coeffs2: [0.4, 0.6, 0.6],
    geom_hypercube_baseSpeedFactor: 1.0,
    geom_hypercube_rotXW_timeFactor: 0.33,
    geom_hypercube_rotXW_channel2Factor: 0.25,
    geom_hypercube_rotXW_morphFactor: 0.45,
    geom_hypercube_rotYZ_timeFactor: 0.28,
    geom_hypercube_rotYZ_channel1Factor: 0.28,
    geom_hypercube_rotYZ_morphFactor: 0.0,
    geom_hypercube_rotYZ_angleScale: 1.1,
    geom_hypercube_rotZW_timeFactor: 0.25,
    geom_hypercube_rotZW_channel0Factor: 0.35,
    geom_hypercube_rotZW_morphFactor: 0.0,
    geom_hypercube_rotZW_angleScale: 0.9,
    geom_hypercube_rotYW_timeFactor: -0.22,
    geom_hypercube_rotYW_morphFactor: 0.3,
    geom_hypercube_finalLattice_minUniverseMod: 0.1,

    // HypersphereGeometry Uniforms
    geom_hsphere_density_gridFactor: 0.7,
    geom_hsphere_density_channel0Factor: 0.5,
    geom_hsphere_shellWidth_channel1Factor: 1.5,
    geom_hsphere_phase_tauFactor: 6.28318,
    geom_hsphere_phase_rotSpeedFactor: 0.8,
    geom_hsphere_phase_channel2Factor: 3.0,
    geom_hsphere_wCoord_radiusFactor: 2.5,
    geom_hsphere_wCoord_timeFactorCos: 0.55,
    geom_hsphere_wCoord_pCoeffs: [1.0, 1.3, -0.7],
    geom_hsphere_wCoord_timeFactorSin: 0.2,
    geom_hsphere_wCoord_dimFactorOffset: 0.5,
    geom_hsphere_wCoord_morphFactor: 0.5,
    geom_hsphere_wCoord_channel1Factor: 0.5,
    geom_hsphere_baseSpeedFactor: 0.85,
    geom_hsphere_rotXW_timeFactor: 0.38,
    geom_hsphere_rotXW_channel2Factor: 0.2,
    geom_hsphere_rotXW_angleScale: 1.05, // Example, original was 1.05
    geom_hsphere_finalLattice_minUniverseMod: 0.1,

    // HypertetrahedronGeometry Uniforms
    geom_htetra_density_gridFactor: 0.65,
    geom_htetra_density_channel0Factor: 0.4,
    geom_htetra_thickness_channel1Factor: 0.7,
    geom_htetra_pMod3D_timeFactor: 0.005,
    geom_htetra_wCoord_pCoeffsCos: [1.8, -1.5, 1.2],
    geom_htetra_wCoord_timeFactorCos: 0.24,
    geom_htetra_wCoord_pLengthFactor: 1.4,
    geom_htetra_wCoord_timeFactorSin: 0.18,
    geom_htetra_wCoord_channel1Factor: 2.0,
    geom_htetra_wCoord_dimFactorOffset: 0.45,
    geom_htetra_wCoord_morphFactor: 0.55,
    geom_htetra_wCoord_channel2Factor: 0.4,
    geom_htetra_baseSpeedFactor: 1.15,
    geom_htetra_rotXW_timeFactor: 0.28,
    geom_htetra_rotXW_channel2Factor: 0.25,
    geom_htetra_rotXW_angleScale: 0.95, // Example, original was 0.95
    geom_htetra_pMod4D_timeFactor: 0.008,
    geom_htetra_finalLattice_minUniverseMod: 0.1,

    // DuocylinderGeometry Uniforms
    geom_duocyl_r1_base: 0.6,
    geom_duocyl_r1_morphFactor: 0.4,
    geom_duocyl_r2_base: 0.3,
    geom_duocyl_r2_channel0Factor: 0.3,
    geom_duocyl_shellWidth_channel1Factor: 0.7,
    geom_duocyl_fallback_pLengthFactor: 8.0,
    geom_duocyl_fallback_channel2Factor: 5.0,
    geom_duocyl_wCoord_len_pXY_Factor: 1.8,
    geom_duocyl_wCoord_timeFactorCos: 0.4,
    geom_duocyl_wCoord_pzFactor: 1.2,
    geom_duocyl_wCoord_pxFactor: 0.5,
    geom_duocyl_wCoord_timeFactorSin: 0.25,
    geom_duocyl_wCoord_dimFactorOffset: 0.5,
    geom_duocyl_wCoord_morphFactor: 0.3,
    geom_duocyl_wCoord_channel2Factor: 0.2,
    geom_duocyl_baseSpeedFactor: 0.9,
    geom_duocyl_rotXW_timeFactor: 0.30,
    geom_duocyl_rotXW_channel0Factor: 0.3,
    geom_duocyl_rotXW_angleScale: 1.0,
    geom_duocyl_finalLattice_minUniverseMod: 0.1,

    // FullScreenLatticeGeometry Uniforms (matches u_gridDensity_lattice for gridDensity)
    lattice_edgeLineWidth: 0.03,
    lattice_vertexSize: 0.05,
    lattice_distortP_pZ_factor: 2.0,
    lattice_distortP_morphCoeffs: [0.2, 0.2, 0.1],
    lattice_distortP_timeFactorScale: 0.2, // original: time * 0.2 * rotationSpeed
    lattice_wCoord_pLengthFactor: 3.0,
    lattice_wCoord_timeFactor: 0.3,
    lattice_wCoord_dimOffset: -3.0, // (dimension - 3.0)
    lattice_rotXW_timeFactor: 0.31, // These multiply (timeFactor * factor)
    lattice_rotYW_timeFactor: 0.27,
    lattice_rotZW_timeFactor: 0.23,
    lattice_glitch_baseFactor: 0.1,
    lattice_glitch_sinFactor: 5.0,
    lattice_glitch_rOffsetCoeffs: [1.0, 0.5], // Multiplied by glitchAmount
    lattice_glitch_gOffsetCoeffs: [-0.3, 0.2],
    lattice_glitch_bOffsetCoeffs: [0.1, -0.4],
    lattice_moire_densityFactor1: 1.01,
    lattice_moire_densityFactor2: 0.99,
    lattice_moire_blendFactor: 0.5,
    lattice_moire_mixCoeffs: [0.3, 0.4, 0.5],
    lattice_baseColor: [0.1, 0.2, 0.4],
    lattice_effectColor: [0.9, 0.8, 1.0],
    lattice_glow_color: [0.1, 0.2, 0.4],
    lattice_glow_timeFactor: 0.5,
    lattice_glow_amplitudeOffset: 0.5,
    lattice_glow_amplitudeFactor: 0.5,
    lattice_vignette_inner: 0.4,
    lattice_vignette_outer: 1.4,

    needsShaderUpdate: false, _dirtyUniforms: new Set(), isRendering: false, animationFrameId: null,
    shaderProgramName: 'maleficarumViz',
    callbacks: { onRender: null, onError: null }
};

class HypercubeCore {
    constructor(canvas, shaderManager, options = {}) {
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) throw new Error("Valid HTMLCanvasElement needed.");
        if (!shaderManager || !(shaderManager instanceof ShaderManager)) throw new Error("Valid ShaderManager needed.");
        this.canvas = canvas;
        let gl = canvas.getContext('webgl2');
        if (!gl) {
            console.warn('WebGL2 not available, falling back to WebGL1');
            gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        }
        this.gl = gl;
        this.isWebGL2 = !!(gl && gl.getParameter(gl.VERSION).includes('WebGL 2.0'));
        if (this.isWebGL2) console.log('WebGL2 Context Initialized');
        else console.log('WebGL1 Context Initialized');
        this.shaderManager = shaderManager; // ShaderManager might need gl, so assign after gl is set.
                                         // Or, modify ShaderManager to accept gl in its constructor.
                                         // For now, assuming ShaderManager gets gl from this instance or is updated.
        this.quadBuffer = null;
        this.aPositionLoc = -1;

        // Add new state properties for UBO
        this.globalDataUBO = null;
        this.globalDataBuffer = new Float32Array(64); // 64 floats
        this.uboBindingPoint = 0; // Example binding point

        // Initialize dataChannels carefully
        let initialDataChannels = [...DEFAULT_STATE.dataChannels];
        if (options.dataChannels && Array.isArray(options.dataChannels)) {
            for (let i = 0; i < Math.min(initialDataChannels.length, options.dataChannels.length); i++) {
                if (typeof options.dataChannels[i] === 'number') {
                    initialDataChannels[i] = options.dataChannels[i];
                }
            }
        } else if (options.dataChannels) {
            console.warn("HypercubeCore constructor: options.dataChannels was provided but not as an array. Using default dataChannels.");
        }


        // Initialize state with defaults, then override with options
        this.state = { ...DEFAULT_STATE };

        // Carefully merge options to ensure type consistency for nested objects like colorScheme
        // and to handle specific option mappings like projectionViewDistance.
        for (const key in options) {
            if (Object.hasOwnProperty.call(options, key)) {
                if (key === 'colorScheme' && typeof options[key] === 'object' && options[key] !== null) {
                    this.state.colorScheme = { ...DEFAULT_STATE.colorScheme, ...options[key] };
                } else if (key === 'callbacks' && typeof options[key] === 'object' && options[key] !== null) {
                    this.state.callbacks = { ...DEFAULT_STATE.callbacks, ...options[key] };
                } else if (key === 'dataChannels') {
                    // Already handled with initialDataChannels
                    this.state.dataChannels = initialDataChannels;
                } else if (key === 'projectionViewDistance' && typeof options[key] === 'number') {
                    this.state.proj_perspective_baseDistance = options[key];
                } else if (key === 'projectionPoleW' && typeof options[key] === 'number') {
                    this.state.proj_stereo_basePoleW = options[key];
                } else if (Object.hasOwnProperty.call(DEFAULT_STATE, key)) {
                    // Check if the type of option value matches the default state type (simple check)
                    if (typeof options[key] === typeof DEFAULT_STATE[key] || DEFAULT_STATE[key] === null ) {
                         // For arrays, ensure it's an array and elements have same type (more complex, simplified here)
                        if (Array.isArray(DEFAULT_STATE[key])) {
                            if (Array.isArray(options[key]) && options[key].length === DEFAULT_STATE[key].length) {
                                // Basic check, could be deeper for element types
                                this.state[key] = options[key];
                            } else {
                                console.warn(`Option '${key}' type mismatch (array length or type). Using default.`);
                            }
                        } else {
                            this.state[key] = options[key];
                        }
                    } else {
                        console.warn(`Option '${key}' type mismatch. Expected ${typeof DEFAULT_STATE[key]}, got ${typeof options[key]}. Using default.`);
                    }
                } else {
                    // console.warn(`Unknown option '${key}' provided to HypercubeCore.`);
                }
            }
        }
        this.state._dirtyUniforms = new Set();


        this.state.lineThickness = options.lineThickness ?? DEFAULT_STATE.lineThickness;
        this.state.shellWidth = options.shellWidth ?? DEFAULT_STATE.shellWidth;
        this.state.tetraThickness = options.tetraThickness ?? DEFAULT_STATE.tetraThickness;
        this._markAllUniformsDirty();
        if (options.geometryType) this.state.geometryType = options.geometryType;
        if (options.projectionMethod) this.state.projectionMethod = options.projectionMethod;
        if (options.shaderProgramName) this.state.shaderProgramName = options.shaderProgramName;
        try {
            this._setupWebGLState();
            this._initBuffers();
            this.state.needsShaderUpdate = true;
            this._updateShaderIfNeeded();
            this._initOrUpdateGlobalDataUBO(this.state.dataChannels); // Initialize UBO
        } catch (error) {
            console.error("HypercubeCore Init Error:", error);
            this.state.callbacks.onError?.(error);
        }
    }

    _markAllUniformsDirty() { this.state._dirtyUniforms = new Set(); for (const key in DEFAULT_STATE) { if (['_dirtyUniforms', 'isRendering', 'animationFrameId', 'callbacks', 'startTime', 'lastUpdateTime', 'deltaTime', 'needsShaderUpdate', 'geometryType', 'projectionMethod', 'shaderProgramName', 'dataChannels', 'isFullScreenEffect'].includes(key)) continue; this._markUniformDirty(key); } }
    _markUniformDirty(stateKey) {
        let uniformNames = [];
        switch (stateKey) {
            case 'time': uniformNames.push('u_time'); break;
            case 'resolution': uniformNames.push('u_resolution'); break;
            case 'mouse': uniformNames.push('u_mouse'); break; // Added mouse
            case 'dimensions': uniformNames.push('u_dimension'); break;
            case 'morphFactor': uniformNames.push('u_morphFactor'); break;
            case 'rotationSpeed': uniformNames.push('u_rotationSpeed'); break;
            case 'universeModifier': uniformNames.push('u_universeModifier'); break;
            case 'patternIntensity': uniformNames.push('u_patternIntensity'); break;
            case 'gridDensity': uniformNames.push('u_gridDensity'); break;
            case 'gridDensity_lattice': uniformNames.push('u_gridDensity_lattice'); break;
            case 'lineThickness': uniformNames.push('u_lineThickness'); break;
            case 'shellWidth': uniformNames.push('u_shellWidth'); break;
            case 'tetraThickness': uniformNames.push('u_tetraThickness'); break;
            case 'glitchIntensity': uniformNames.push('u_glitchIntensity'); break;
            case 'colorShift': uniformNames.push('u_colorShift'); break;
            case 'isFullScreenEffect': uniformNames.push('u_isFullScreenEffect'); break;

            // Projection (Perspective)
            case 'proj_perspective_baseDistance': uniformNames.push('u_proj_perspective_baseDistance'); break;
            case 'proj_perspective_morphFactorImpact': uniformNames.push('u_proj_perspective_morphFactorImpact'); break;
            case 'proj_perspective_channelImpact': uniformNames.push('u_proj_perspective_channelImpact'); break;
            case 'proj_perspective_denomMin': uniformNames.push('u_proj_perspective_denomMin'); break;

            // Projection (Stereographic)
            case 'proj_stereo_basePoleW': uniformNames.push('u_proj_stereo_basePoleW'); break;
            case 'proj_stereo_channelImpact': uniformNames.push('u_proj_stereo_channelImpact'); break;
            case 'proj_stereo_epsilon': uniformNames.push('u_proj_stereo_epsilon'); break;
            case 'proj_stereo_singularityScale': uniformNames.push('u_proj_stereo_singularityScale'); break;
            case 'proj_stereo_morphFactorImpact': uniformNames.push('u_proj_stereo_morphFactorImpact'); break;

            // Geometry (Hypercube)
            case 'geom_hypercube_gridDensity_channel0Factor': uniformNames.push('u_geom_hypercube_gridDensity_channel0Factor'); break;
            case 'geom_hypercube_gridDensity_timeFactor': uniformNames.push('u_geom_hypercube_gridDensity_timeFactor'); break;
            case 'geom_hypercube_lineThickness_channel1Factor': uniformNames.push('u_geom_hypercube_lineThickness_channel1Factor'); break;
            case 'geom_hypercube_wCoord_pCoeffs1': uniformNames.push('u_geom_hypercube_wCoord_pCoeffs1'); break;
            case 'geom_hypercube_wCoord_timeFactor1': uniformNames.push('u_geom_hypercube_wCoord_timeFactor1'); break;
            case 'geom_hypercube_wCoord_pLengthFactor': uniformNames.push('u_geom_hypercube_wCoord_pLengthFactor'); break;
            case 'geom_hypercube_wCoord_timeFactor2': uniformNames.push('u_geom_hypercube_wCoord_timeFactor2'); break;
            case 'geom_hypercube_wCoord_channel1Factor': uniformNames.push('u_geom_hypercube_wCoord_channel1Factor'); break;
            case 'geom_hypercube_wCoord_coeffs2': uniformNames.push('u_geom_hypercube_wCoord_coeffs2'); break;
            case 'geom_hypercube_baseSpeedFactor': uniformNames.push('u_geom_hypercube_baseSpeedFactor'); break;
            case 'geom_hypercube_rotXW_timeFactor': uniformNames.push('u_geom_hypercube_rotXW_timeFactor'); break;
            case 'geom_hypercube_rotXW_channel2Factor': uniformNames.push('u_geom_hypercube_rotXW_channel2Factor'); break;
            case 'geom_hypercube_rotXW_morphFactor': uniformNames.push('u_geom_hypercube_rotXW_morphFactor'); break;
            case 'geom_hypercube_rotYZ_timeFactor': uniformNames.push('u_geom_hypercube_rotYZ_timeFactor'); break;
            case 'geom_hypercube_rotYZ_channel1Factor': uniformNames.push('u_geom_hypercube_rotYZ_channel1Factor'); break;
            case 'geom_hypercube_rotYZ_morphFactor': uniformNames.push('u_geom_hypercube_rotYZ_morphFactor'); break;
            case 'geom_hypercube_rotYZ_angleScale': uniformNames.push('u_geom_hypercube_rotYZ_angleScale'); break;
            case 'geom_hypercube_rotZW_timeFactor': uniformNames.push('u_geom_hypercube_rotZW_timeFactor'); break;
            case 'geom_hypercube_rotZW_channel0Factor': uniformNames.push('u_geom_hypercube_rotZW_channel0Factor'); break;
            case 'geom_hypercube_rotZW_morphFactor': uniformNames.push('u_geom_hypercube_rotZW_morphFactor'); break;
            case 'geom_hypercube_rotZW_angleScale': uniformNames.push('u_geom_hypercube_rotZW_angleScale'); break;
            case 'geom_hypercube_rotYW_timeFactor': uniformNames.push('u_geom_hypercube_rotYW_timeFactor'); break;
            case 'geom_hypercube_rotYW_morphFactor': uniformNames.push('u_geom_hypercube_rotYW_morphFactor'); break;
            case 'geom_hypercube_finalLattice_minUniverseMod': uniformNames.push('u_geom_hypercube_finalLattice_minUniverseMod'); break;

            // Hypersphere
            case 'geom_hsphere_density_gridFactor': uniformNames.push('u_geom_hsphere_density_gridFactor'); break;
            case 'geom_hsphere_density_channel0Factor': uniformNames.push('u_geom_hsphere_density_channel0Factor'); break;
            case 'geom_hsphere_shellWidth_channel1Factor': uniformNames.push('u_geom_hsphere_shellWidth_channel1Factor'); break;
            case 'geom_hsphere_phase_tauFactor': uniformNames.push('u_geom_hsphere_phase_tauFactor'); break;
            case 'geom_hsphere_phase_rotSpeedFactor': uniformNames.push('u_geom_hsphere_phase_rotSpeedFactor'); break;
            case 'geom_hsphere_phase_channel2Factor': uniformNames.push('u_geom_hsphere_phase_channel2Factor'); break;
            case 'geom_hsphere_wCoord_radiusFactor': uniformNames.push('u_geom_hsphere_wCoord_radiusFactor'); break;
            case 'geom_hsphere_wCoord_timeFactorCos': uniformNames.push('u_geom_hsphere_wCoord_timeFactorCos'); break;
            case 'geom_hsphere_wCoord_pCoeffs': uniformNames.push('u_geom_hsphere_wCoord_pCoeffs'); break;
            case 'geom_hsphere_wCoord_timeFactorSin': uniformNames.push('u_geom_hsphere_wCoord_timeFactorSin'); break;
            case 'geom_hsphere_wCoord_dimFactorOffset': uniformNames.push('u_geom_hsphere_wCoord_dimFactorOffset'); break;
            case 'geom_hsphere_wCoord_morphFactor': uniformNames.push('u_geom_hsphere_wCoord_morphFactor'); break;
            case 'geom_hsphere_wCoord_channel1Factor': uniformNames.push('u_geom_hsphere_wCoord_channel1Factor'); break;
            case 'geom_hsphere_baseSpeedFactor': uniformNames.push('u_geom_hsphere_baseSpeedFactor'); break;
            case 'geom_hsphere_rotXW_timeFactor': uniformNames.push('u_geom_hsphere_rotXW_timeFactor'); break;
            case 'geom_hsphere_rotXW_channel2Factor': uniformNames.push('u_geom_hsphere_rotXW_channel2Factor'); break;
            case 'geom_hsphere_rotXW_angleScale': uniformNames.push('u_geom_hsphere_rotXW_angleScale'); break;
            case 'geom_hsphere_finalLattice_minUniverseMod': uniformNames.push('u_geom_hsphere_finalLattice_minUniverseMod'); break;

            // Hypertetrahedron
            case 'geom_htetra_density_gridFactor': uniformNames.push('u_geom_htetra_density_gridFactor'); break;
            case 'geom_htetra_density_channel0Factor': uniformNames.push('u_geom_htetra_density_channel0Factor'); break;
            case 'geom_htetra_thickness_channel1Factor': uniformNames.push('u_geom_htetra_thickness_channel1Factor'); break;
            case 'geom_htetra_pMod3D_timeFactor': uniformNames.push('u_geom_htetra_pMod3D_timeFactor'); break;
            case 'geom_htetra_wCoord_pCoeffsCos': uniformNames.push('u_geom_htetra_wCoord_pCoeffsCos'); break;
            case 'geom_htetra_wCoord_timeFactorCos': uniformNames.push('u_geom_htetra_wCoord_timeFactorCos'); break;
            case 'geom_htetra_wCoord_pLengthFactor': uniformNames.push('u_geom_htetra_wCoord_pLengthFactor'); break;
            case 'geom_htetra_wCoord_timeFactorSin': uniformNames.push('u_geom_htetra_wCoord_timeFactorSin'); break;
            case 'geom_htetra_wCoord_channel1Factor': uniformNames.push('u_geom_htetra_wCoord_channel1Factor'); break;
            case 'geom_htetra_wCoord_dimFactorOffset': uniformNames.push('u_geom_htetra_wCoord_dimFactorOffset'); break;
            case 'geom_htetra_wCoord_morphFactor': uniformNames.push('u_geom_htetra_wCoord_morphFactor'); break;
            case 'geom_htetra_wCoord_channel2Factor': uniformNames.push('u_geom_htetra_wCoord_channel2Factor'); break;
            case 'geom_htetra_baseSpeedFactor': uniformNames.push('u_geom_htetra_baseSpeedFactor'); break;
            case 'geom_htetra_rotXW_timeFactor': uniformNames.push('u_geom_htetra_rotXW_timeFactor'); break;
            case 'geom_htetra_rotXW_channel2Factor': uniformNames.push('u_geom_htetra_rotXW_channel2Factor'); break;
            case 'geom_htetra_rotXW_angleScale': uniformNames.push('u_geom_htetra_rotXW_angleScale'); break;
            case 'geom_htetra_pMod4D_timeFactor': uniformNames.push('u_geom_htetra_pMod4D_timeFactor'); break;
            case 'geom_htetra_finalLattice_minUniverseMod': uniformNames.push('u_geom_htetra_finalLattice_minUniverseMod'); break;

            // Duocylinder
            case 'geom_duocyl_r1_base': uniformNames.push('u_geom_duocyl_r1_base'); break;
            case 'geom_duocyl_r1_morphFactor': uniformNames.push('u_geom_duocyl_r1_morphFactor'); break;
            case 'geom_duocyl_r2_base': uniformNames.push('u_geom_duocyl_r2_base'); break;
            case 'geom_duocyl_r2_channel0Factor': uniformNames.push('u_geom_duocyl_r2_channel0Factor'); break;
            case 'geom_duocyl_shellWidth_channel1Factor': uniformNames.push('u_geom_duocyl_shellWidth_channel1Factor'); break;
            case 'geom_duocyl_fallback_pLengthFactor': uniformNames.push('u_geom_duocyl_fallback_pLengthFactor'); break;
            case 'geom_duocyl_fallback_channel2Factor': uniformNames.push('u_geom_duocyl_fallback_channel2Factor'); break;
            case 'geom_duocyl_wCoord_len_pXY_Factor': uniformNames.push('u_geom_duocyl_wCoord_len_pXY_Factor'); break;
            case 'geom_duocyl_wCoord_timeFactorCos': uniformNames.push('u_geom_duocyl_wCoord_timeFactorCos'); break;
            case 'geom_duocyl_wCoord_pzFactor': uniformNames.push('u_geom_duocyl_wCoord_pzFactor'); break;
            case 'geom_duocyl_wCoord_pxFactor': uniformNames.push('u_geom_duocyl_wCoord_pxFactor'); break;
            case 'geom_duocyl_wCoord_timeFactorSin': uniformNames.push('u_geom_duocyl_wCoord_timeFactorSin'); break;
            case 'geom_duocyl_wCoord_dimFactorOffset': uniformNames.push('u_geom_duocyl_wCoord_dimFactorOffset'); break;
            case 'geom_duocyl_wCoord_morphFactor': uniformNames.push('u_geom_duocyl_wCoord_morphFactor'); break;
            case 'geom_duocyl_wCoord_channel2Factor': uniformNames.push('u_geom_duocyl_wCoord_channel2Factor'); break;
            case 'geom_duocyl_baseSpeedFactor': uniformNames.push('u_geom_duocyl_baseSpeedFactor'); break;
            case 'geom_duocyl_rotXW_timeFactor': uniformNames.push('u_geom_duocyl_rotXW_timeFactor'); break;
            case 'geom_duocyl_rotXW_channel0Factor': uniformNames.push('u_geom_duocyl_rotXW_channel0Factor'); break;
            case 'geom_duocyl_rotXW_angleScale': uniformNames.push('u_geom_duocyl_rotXW_angleScale'); break;
            case 'geom_duocyl_finalLattice_minUniverseMod': uniformNames.push('u_geom_duocyl_finalLattice_minUniverseMod'); break;

            // FullScreenLattice
            case 'lattice_edgeLineWidth': uniformNames.push('u_lattice_edgeLineWidth'); break;
            case 'lattice_vertexSize': uniformNames.push('u_lattice_vertexSize'); break;
            case 'lattice_distortP_pZ_factor': uniformNames.push('u_lattice_distortP_pZ_factor'); break;
            case 'lattice_distortP_morphCoeffs': uniformNames.push('u_lattice_distortP_morphCoeffs'); break;
            case 'lattice_distortP_timeFactorScale': uniformNames.push('u_lattice_distortP_timeFactorScale'); break;
            case 'lattice_wCoord_pLengthFactor': uniformNames.push('u_lattice_wCoord_pLengthFactor'); break;
            case 'lattice_wCoord_timeFactor': uniformNames.push('u_lattice_wCoord_timeFactor'); break;
            case 'lattice_wCoord_dimOffset': uniformNames.push('u_lattice_wCoord_dimOffset'); break;
            case 'lattice_rotXW_timeFactor': uniformNames.push('u_lattice_rotXW_timeFactor'); break;
            case 'lattice_rotYW_timeFactor': uniformNames.push('u_lattice_rotYW_timeFactor'); break;
            case 'lattice_rotZW_timeFactor': uniformNames.push('u_lattice_rotZW_timeFactor'); break;
            case 'lattice_glitch_baseFactor': uniformNames.push('u_lattice_glitch_baseFactor'); break;
            case 'lattice_glitch_sinFactor': uniformNames.push('u_lattice_glitch_sinFactor'); break;
            case 'lattice_glitch_rOffsetCoeffs': uniformNames.push('u_lattice_glitch_rOffsetCoeffs'); break;
            case 'lattice_glitch_gOffsetCoeffs': uniformNames.push('u_lattice_glitch_gOffsetCoeffs'); break;
            case 'lattice_glitch_bOffsetCoeffs': uniformNames.push('u_lattice_glitch_bOffsetCoeffs'); break;
            case 'lattice_moire_densityFactor1': uniformNames.push('u_lattice_moire_densityFactor1'); break;
            case 'lattice_moire_densityFactor2': uniformNames.push('u_lattice_moire_densityFactor2'); break;
            case 'lattice_moire_blendFactor': uniformNames.push('u_lattice_moire_blendFactor'); break;
            case 'lattice_moire_mixCoeffs': uniformNames.push('u_lattice_moire_mixCoeffs'); break;
            case 'lattice_baseColor': uniformNames.push('u_lattice_baseColor'); break;
            case 'lattice_effectColor': uniformNames.push('u_lattice_effectColor'); break;
            case 'lattice_glow_color': uniformNames.push('u_lattice_glow_color'); break;
            case 'lattice_glow_timeFactor': uniformNames.push('u_lattice_glow_timeFactor'); break;
            case 'lattice_glow_amplitudeOffset': uniformNames.push('u_lattice_glow_amplitudeOffset'); break;
            case 'lattice_glow_amplitudeFactor': uniformNames.push('u_lattice_glow_amplitudeFactor'); break;
            case 'lattice_vignette_inner': uniformNames.push('u_lattice_vignette_inner'); break;
            case 'lattice_vignette_outer': uniformNames.push('u_lattice_vignette_outer'); break;

            case 'colorScheme': uniformNames.push('u_primaryColor', 'u_secondaryColor', 'u_backgroundColor'); break;
            default: break;
        }
        uniformNames.forEach(name => this.state._dirtyUniforms.add(name));
    }
    _setupWebGLState() { const gl = this.gl; const bg = this.state.colorScheme.background; gl.clearColor(bg[0], bg[1], bg[2], 1.0); gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }
    _initBuffers() { const gl = this.gl; const pos = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]); this.quadBuffer = gl.createBuffer(); if (!this.quadBuffer) throw new Error("Buffer creation failed."); gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER, null); }

    _initOrUpdateGlobalDataUBO(dataArray) {
        if (!this.isWebGL2) return;
        if (dataArray && dataArray.length <= this.globalDataBuffer.length) {
            this.globalDataBuffer.set(dataArray);
        } else if (dataArray) {
            console.warn('Provided dataArray too large for UBO, truncating.');
            this.globalDataBuffer.set(dataArray.slice(0, this.globalDataBuffer.length));
        }
        // If UBO doesn't exist, create it
        if (!this.globalDataUBO) {
            this.globalDataUBO = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.globalDataUBO);
            this.gl.bufferData(this.gl.UNIFORM_BUFFER, this.globalDataBuffer.byteLength, this.gl.DYNAMIC_DRAW); // Allocate
            this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
            // Bind the UBO to the global binding point
            this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, this.uboBindingPoint, this.globalDataUBO);
            console.log('GlobalDataBlock UBO initialized.');
        }
        // Update UBO data
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.globalDataUBO);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, this.globalDataBuffer);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
    }

    _updateShaderIfNeeded() {
        if (!this.state.needsShaderUpdate) return true;
        const progName = this.state.shaderProgramName, geomName = this.state.geometryType, projName = this.state.projectionMethod;
        console.log(`Updating shader '${progName}' (G:${geomName}, P:${projName})`);
        const program = this.shaderManager.createDynamicProgram(progName, geomName, projName);
        if (!program) {
            console.error(`Shader update failed.`);
            this.state.callbacks.onError?.(new Error(`Shader update failed`));
            this.stop();
            return false;
        }
        this.state.needsShaderUpdate = false;
        this.shaderManager.useProgram(progName); // Ensures the program is current

        // Set u_isFullScreenEffect based on geometry type
        if (this.state.geometryType === 'fullscreenlattice') {
            this.state.isFullScreenEffect = 1;
        } else {
            this.state.isFullScreenEffect = 0;
        }
        // Mark it dirty so it's set before the first frame after a shader change
        this._markUniformDirty('isFullScreenEffect');


        if (this.isWebGL2) {
            const blockIndex = this.gl.getUniformBlockIndex(program, 'GlobalDataBlock');
            if (blockIndex !== this.gl.INVALID_INDEX && blockIndex !== undefined) { // Check for undefined as some impl might return it
                this.gl.uniformBlockBinding(program, blockIndex, this.uboBindingPoint);
                 if (this.globalDataUBO) { // Re-bind buffer base if UBO already exists
                    this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, this.uboBindingPoint, this.globalDataUBO);
                }
            } else {
                console.warn('GlobalDataBlock UBO not found in shader program:', progName);
            }
        }

        this.aPositionLoc = this.shaderManager.getAttributeLocation('a_position');
        if (this.aPositionLoc === null) {
            console.warn(`Attr 'a_position' missing.`);
        } else {
            try {
                this.gl.enableVertexAttribArray(this.aPositionLoc);
            } catch (e) {
                console.error(`Enable attr error:`, e);
                this.aPositionLoc = -1;
            }
        }
        this._markAllUniformsDirty(); // Mark non-UBO uniforms dirty
        console.log(`Shader updated.`);
        return true;
    }

    updateParameters(newParams) {
        let shaderNeedsUpdate = false;
        for (const key in newParams) {
            if (!Object.hasOwnProperty.call(this.state, key)) continue;
            const oldValue = this.state[key];
            const newValue = newParams[key];
            let changed = false;

            if (key === 'dataChannels') {
                if (this.isWebGL2) {
                    this._initOrUpdateGlobalDataUBO(newValue);
                } else {
                    if (Array.isArray(newValue) && Array.isArray(oldValue)) {
                        changed = newValue.length !== oldValue.length || newValue.some((val, i) => val !== oldValue[i]);
                        if (changed) {
                            const newChannels = [...DEFAULT_STATE.dataChannels];
                            for (let i = 0; i < Math.min(newChannels.length, newValue.length); i++) {
                                if (typeof newValue[i] === 'number') newChannels[i] = newValue[i];
                            }
                            this.state[key] = newChannels;
                            this._markUniformDirty(key);
                        }
                    } else if (Array.isArray(newValue)) {
                        const newChannels = [...DEFAULT_STATE.dataChannels];
                        for (let i = 0; i < Math.min(newChannels.length, newValue.length); i++) {
                            if (typeof newValue[i] === 'number') newChannels[i] = newValue[i];
                        }
                        this.state[key] = newChannels;
                        this._markUniformDirty(key);
                         changed = true;
                    }
                }
                continue;
            } else if (key === 'mouse') { // Handle mouse input
                 if (Array.isArray(newValue) && newValue.length === 2 &&
                    (newValue[0] !== oldValue[0] || newValue[1] !== oldValue[1])) {
                    this.state.mouse = [...newValue];
                    this._markUniformDirty('mouse');
                    changed = true; // Though 'changed' isn't strictly necessary if only marking dirty
                }
                // Continue to allow other checks for 'mouse' if it were an object, etc.
                // but for simple array, this is enough. If it's not an array, it falls through.
            }

            // General parameter update logic
            if (typeof oldValue === 'object' && oldValue !== null && !Array.isArray(oldValue)) {
                 // This is for objects like colorScheme
                if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                    this.state[key] = { ...oldValue, ...newValue };
                    changed = true;
                    if (key === 'colorScheme') {
                        if (newValue.hasOwnProperty('primary')) this._markUniformDirty('colorScheme.primary');
                        if (newValue.hasOwnProperty('secondary')) this._markUniformDirty('colorScheme.secondary');
                        if (newValue.hasOwnProperty('background')) this._markUniformDirty('colorScheme.background');
                    }
                    // Removed old dataChannels object logic from here
                }
            } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                this.state[key] = newValue;
                changed = true;
                this._markUniformDirty(key);
                if (key === 'geometryType' || key === 'projectionMethod') {
                    shaderNeedsUpdate = true;
                }
            }
        }
        if (shaderNeedsUpdate) { this.state.needsShaderUpdate = true; }
    }
    _checkResize() { const gl=this.gl, c=this.canvas, dw=c.clientWidth, dh=c.clientHeight; if(c.width!==dw || c.height!==dh){ c.width=dw; c.height=dh; gl.viewport(0,0,dw,dh); this.state.resolution=[dw,dh]; this._markUniformDirty('resolution'); return true; } return false; }
    _setUniforms() {
        const gl = this.gl; const dirty = this.state._dirtyUniforms; const programName = this.state.shaderProgramName;
        if (!this.shaderManager.useProgram(programName) || this.shaderManager.currentProgramName !== programName) return;
        const timeLoc = this.shaderManager.getUniformLocation('u_time'); if (timeLoc) gl.uniform1f(timeLoc, this.state.time); else dirty.add('u_time');
        const uniformsToRetry = new Set();
        dirty.forEach(name => { if (name === 'u_time') return; const loc = this.shaderManager.getUniformLocation(name); if (loc !== null) { try { switch (name) {
            case 'u_resolution': gl.uniform2fv(loc, this.state.resolution); break; case 'u_dimension': gl.uniform1f(loc, this.state.dimensions); break;
            case 'u_morphFactor': gl.uniform1f(loc, this.state.morphFactor); break; case 'u_rotationSpeed': gl.uniform1f(loc, this.state.rotationSpeed); break;
            case 'u_universeModifier': gl.uniform1f(loc, this.state.universeModifier); break; case 'u_patternIntensity': gl.uniform1f(loc, this.state.patternIntensity); break;
            case 'u_gridDensity': gl.uniform1f(loc, this.state.gridDensity); break;
            case 'u_gridDensity_lattice': gl.uniform1f(loc, this.state.gridDensity_lattice); break;
            case 'u_lineThickness': gl.uniform1f(loc, this.state.lineThickness); break;
            case 'u_shellWidth': gl.uniform1f(loc, this.state.shellWidth); break;
            case 'u_tetraThickness': gl.uniform1f(loc, this.state.tetraThickness); break;
            case 'u_glitchIntensity': gl.uniform1f(loc, this.state.glitchIntensity); break;
            case 'u_colorShift': gl.uniform1f(loc, this.state.colorShift); break;
            case 'u_mouse': gl.uniform2fv(loc, this.state.mouse); break;
            case 'u_isFullScreenEffect': gl.uniform1i(loc, this.state.isFullScreenEffect); break;

            // Projection (Perspective)
            case 'u_proj_perspective_baseDistance': gl.uniform1f(loc, this.state.proj_perspective_baseDistance); break;
            case 'u_proj_perspective_morphFactorImpact': gl.uniform1f(loc, this.state.proj_perspective_morphFactorImpact); break;
            case 'u_proj_perspective_channelImpact': gl.uniform1f(loc, this.state.proj_perspective_channelImpact); break;
            case 'u_proj_perspective_denomMin': gl.uniform1f(loc, this.state.proj_perspective_denomMin); break;

            // Projection (Stereographic)
            case 'u_proj_stereo_basePoleW': gl.uniform1f(loc, this.state.proj_stereo_basePoleW); break;
            case 'u_proj_stereo_channelImpact': gl.uniform1f(loc, this.state.proj_stereo_channelImpact); break;
            case 'u_proj_stereo_epsilon': gl.uniform1f(loc, this.state.proj_stereo_epsilon); break;
            case 'u_proj_stereo_singularityScale': gl.uniform1f(loc, this.state.proj_stereo_singularityScale); break;
            case 'u_proj_stereo_morphFactorImpact': gl.uniform1f(loc, this.state.proj_stereo_morphFactorImpact); break;

            // Geometry (Hypercube)
            case 'u_geom_hypercube_gridDensity_channel0Factor': gl.uniform1f(loc, this.state.geom_hypercube_gridDensity_channel0Factor); break;
            case 'u_geom_hypercube_gridDensity_timeFactor': gl.uniform1f(loc, this.state.geom_hypercube_gridDensity_timeFactor); break;
            case 'u_geom_hypercube_lineThickness_channel1Factor': gl.uniform1f(loc, this.state.geom_hypercube_lineThickness_channel1Factor); break;
            case 'u_geom_hypercube_wCoord_pCoeffs1': gl.uniform3fv(loc, this.state.geom_hypercube_wCoord_pCoeffs1); break;
            case 'u_geom_hypercube_wCoord_timeFactor1': gl.uniform1f(loc, this.state.geom_hypercube_wCoord_timeFactor1); break;
            case 'u_geom_hypercube_wCoord_pLengthFactor': gl.uniform1f(loc, this.state.geom_hypercube_wCoord_pLengthFactor); break;
            case 'u_geom_hypercube_wCoord_timeFactor2': gl.uniform1f(loc, this.state.geom_hypercube_wCoord_timeFactor2); break;
            case 'u_geom_hypercube_wCoord_channel1Factor': gl.uniform1f(loc, this.state.geom_hypercube_wCoord_channel1Factor); break;
            case 'u_geom_hypercube_wCoord_coeffs2': gl.uniform3fv(loc, this.state.geom_hypercube_wCoord_coeffs2); break;
            case 'u_geom_hypercube_baseSpeedFactor': gl.uniform1f(loc, this.state.geom_hypercube_baseSpeedFactor); break;
            case 'u_geom_hypercube_rotXW_timeFactor': gl.uniform1f(loc, this.state.geom_hypercube_rotXW_timeFactor); break;
            case 'u_geom_hypercube_rotXW_channel2Factor': gl.uniform1f(loc, this.state.geom_hypercube_rotXW_channel2Factor); break;
            case 'u_geom_hypercube_rotXW_morphFactor': gl.uniform1f(loc, this.state.geom_hypercube_rotXW_morphFactor); break;
            case 'u_geom_hypercube_rotYZ_timeFactor': gl.uniform1f(loc, this.state.geom_hypercube_rotYZ_timeFactor); break;
            case 'u_geom_hypercube_rotYZ_channel1Factor': gl.uniform1f(loc, this.state.geom_hypercube_rotYZ_channel1Factor); break;
            case 'u_geom_hypercube_rotYZ_morphFactor': gl.uniform1f(loc, this.state.geom_hypercube_rotYZ_morphFactor); break;
            case 'u_geom_hypercube_rotYZ_angleScale': gl.uniform1f(loc, this.state.geom_hypercube_rotYZ_angleScale); break;
            case 'u_geom_hypercube_rotZW_timeFactor': gl.uniform1f(loc, this.state.geom_hypercube_rotZW_timeFactor); break;
            case 'u_geom_hypercube_rotZW_channel0Factor': gl.uniform1f(loc, this.state.geom_hypercube_rotZW_channel0Factor); break;
            case 'u_geom_hypercube_rotZW_morphFactor': gl.uniform1f(loc, this.state.geom_hypercube_rotZW_morphFactor); break;
            case 'u_geom_hypercube_rotZW_angleScale': gl.uniform1f(loc, this.state.geom_hypercube_rotZW_angleScale); break;
            case 'u_geom_hypercube_rotYW_timeFactor': gl.uniform1f(loc, this.state.geom_hypercube_rotYW_timeFactor); break;
            case 'u_geom_hypercube_rotYW_morphFactor': gl.uniform1f(loc, this.state.geom_hypercube_rotYW_morphFactor); break;
            case 'u_geom_hypercube_finalLattice_minUniverseMod': gl.uniform1f(loc, this.state.geom_hypercube_finalLattice_minUniverseMod); break;

            // Hypersphere
            case 'u_geom_hsphere_density_gridFactor': gl.uniform1f(loc, this.state.geom_hsphere_density_gridFactor); break;
            case 'u_geom_hsphere_density_channel0Factor': gl.uniform1f(loc, this.state.geom_hsphere_density_channel0Factor); break;
            case 'u_geom_hsphere_shellWidth_channel1Factor': gl.uniform1f(loc, this.state.geom_hsphere_shellWidth_channel1Factor); break;
            case 'u_geom_hsphere_phase_tauFactor': gl.uniform1f(loc, this.state.geom_hsphere_phase_tauFactor); break;
            case 'u_geom_hsphere_phase_rotSpeedFactor': gl.uniform1f(loc, this.state.geom_hsphere_phase_rotSpeedFactor); break;
            case 'u_geom_hsphere_phase_channel2Factor': gl.uniform1f(loc, this.state.geom_hsphere_phase_channel2Factor); break;
            case 'u_geom_hsphere_wCoord_radiusFactor': gl.uniform1f(loc, this.state.geom_hsphere_wCoord_radiusFactor); break;
            case 'u_geom_hsphere_wCoord_timeFactorCos': gl.uniform1f(loc, this.state.geom_hsphere_wCoord_timeFactorCos); break;
            case 'u_geom_hsphere_wCoord_pCoeffs': gl.uniform3fv(loc, this.state.geom_hsphere_wCoord_pCoeffs); break;
            case 'u_geom_hsphere_wCoord_timeFactorSin': gl.uniform1f(loc, this.state.geom_hsphere_wCoord_timeFactorSin); break;
            case 'u_geom_hsphere_wCoord_dimFactorOffset': gl.uniform1f(loc, this.state.geom_hsphere_wCoord_dimFactorOffset); break;
            case 'u_geom_hsphere_wCoord_morphFactor': gl.uniform1f(loc, this.state.geom_hsphere_wCoord_morphFactor); break;
            case 'u_geom_hsphere_wCoord_channel1Factor': gl.uniform1f(loc, this.state.geom_hsphere_wCoord_channel1Factor); break;
            case 'u_geom_hsphere_baseSpeedFactor': gl.uniform1f(loc, this.state.geom_hsphere_baseSpeedFactor); break;
            case 'u_geom_hsphere_rotXW_timeFactor': gl.uniform1f(loc, this.state.geom_hsphere_rotXW_timeFactor); break;
            case 'u_geom_hsphere_rotXW_channel2Factor': gl.uniform1f(loc, this.state.geom_hsphere_rotXW_channel2Factor); break;
            case 'u_geom_hsphere_rotXW_angleScale': gl.uniform1f(loc, this.state.geom_hsphere_rotXW_angleScale); break;
            case 'u_geom_hsphere_finalLattice_minUniverseMod': gl.uniform1f(loc, this.state.geom_hsphere_finalLattice_minUniverseMod); break;

            // Hypertetrahedron
            case 'u_geom_htetra_density_gridFactor': gl.uniform1f(loc, this.state.geom_htetra_density_gridFactor); break;
            case 'u_geom_htetra_density_channel0Factor': gl.uniform1f(loc, this.state.geom_htetra_density_channel0Factor); break;
            case 'u_geom_htetra_thickness_channel1Factor': gl.uniform1f(loc, this.state.geom_htetra_thickness_channel1Factor); break;
            case 'u_geom_htetra_pMod3D_timeFactor': gl.uniform1f(loc, this.state.geom_htetra_pMod3D_timeFactor); break;
            case 'u_geom_htetra_wCoord_pCoeffsCos': gl.uniform3fv(loc, this.state.geom_htetra_wCoord_pCoeffsCos); break;
            case 'u_geom_htetra_wCoord_timeFactorCos': gl.uniform1f(loc, this.state.geom_htetra_wCoord_timeFactorCos); break;
            case 'u_geom_htetra_wCoord_pLengthFactor': gl.uniform1f(loc, this.state.geom_htetra_wCoord_pLengthFactor); break;
            case 'u_geom_htetra_wCoord_timeFactorSin': gl.uniform1f(loc, this.state.geom_htetra_wCoord_timeFactorSin); break;
            case 'u_geom_htetra_wCoord_channel1Factor': gl.uniform1f(loc, this.state.geom_htetra_wCoord_channel1Factor); break;
            case 'u_geom_htetra_wCoord_dimFactorOffset': gl.uniform1f(loc, this.state.geom_htetra_wCoord_dimFactorOffset); break;
            case 'u_geom_htetra_wCoord_morphFactor': gl.uniform1f(loc, this.state.geom_htetra_wCoord_morphFactor); break;
            case 'u_geom_htetra_wCoord_channel2Factor': gl.uniform1f(loc, this.state.geom_htetra_wCoord_channel2Factor); break;
            case 'u_geom_htetra_baseSpeedFactor': gl.uniform1f(loc, this.state.geom_htetra_baseSpeedFactor); break;
            case 'u_geom_htetra_rotXW_timeFactor': gl.uniform1f(loc, this.state.geom_htetra_rotXW_timeFactor); break;
            case 'u_geom_htetra_rotXW_channel2Factor': gl.uniform1f(loc, this.state.geom_htetra_rotXW_channel2Factor); break;
            case 'u_geom_htetra_rotXW_angleScale': gl.uniform1f(loc, this.state.geom_htetra_rotXW_angleScale); break;
            case 'u_geom_htetra_pMod4D_timeFactor': gl.uniform1f(loc, this.state.geom_htetra_pMod4D_timeFactor); break;
            case 'u_geom_htetra_finalLattice_minUniverseMod': gl.uniform1f(loc, this.state.geom_htetra_finalLattice_minUniverseMod); break;

            // Duocylinder
            case 'u_geom_duocyl_r1_base': gl.uniform1f(loc, this.state.geom_duocyl_r1_base); break;
            case 'u_geom_duocyl_r1_morphFactor': gl.uniform1f(loc, this.state.geom_duocyl_r1_morphFactor); break;
            case 'u_geom_duocyl_r2_base': gl.uniform1f(loc, this.state.geom_duocyl_r2_base); break;
            case 'u_geom_duocyl_r2_channel0Factor': gl.uniform1f(loc, this.state.geom_duocyl_r2_channel0Factor); break;
            case 'u_geom_duocyl_shellWidth_channel1Factor': gl.uniform1f(loc, this.state.geom_duocyl_shellWidth_channel1Factor); break;
            case 'u_geom_duocyl_fallback_pLengthFactor': gl.uniform1f(loc, this.state.geom_duocyl_fallback_pLengthFactor); break;
            case 'u_geom_duocyl_fallback_channel2Factor': gl.uniform1f(loc, this.state.geom_duocyl_fallback_channel2Factor); break;
            case 'u_geom_duocyl_wCoord_len_pXY_Factor': gl.uniform1f(loc, this.state.geom_duocyl_wCoord_len_pXY_Factor); break;
            case 'u_geom_duocyl_wCoord_timeFactorCos': gl.uniform1f(loc, this.state.geom_duocyl_wCoord_timeFactorCos); break;
            case 'u_geom_duocyl_wCoord_pzFactor': gl.uniform1f(loc, this.state.geom_duocyl_wCoord_pzFactor); break;
            case 'u_geom_duocyl_wCoord_pxFactor': gl.uniform1f(loc, this.state.geom_duocyl_wCoord_pxFactor); break;
            case 'u_geom_duocyl_wCoord_timeFactorSin': gl.uniform1f(loc, this.state.geom_duocyl_wCoord_timeFactorSin); break;
            case 'u_geom_duocyl_wCoord_dimFactorOffset': gl.uniform1f(loc, this.state.geom_duocyl_wCoord_dimFactorOffset); break;
            case 'u_geom_duocyl_wCoord_morphFactor': gl.uniform1f(loc, this.state.geom_duocyl_wCoord_morphFactor); break;
            case 'u_geom_duocyl_wCoord_channel2Factor': gl.uniform1f(loc, this.state.geom_duocyl_wCoord_channel2Factor); break;
            case 'u_geom_duocyl_baseSpeedFactor': gl.uniform1f(loc, this.state.geom_duocyl_baseSpeedFactor); break;
            case 'u_geom_duocyl_rotXW_timeFactor': gl.uniform1f(loc, this.state.geom_duocyl_rotXW_timeFactor); break;
            case 'u_geom_duocyl_rotXW_channel0Factor': gl.uniform1f(loc, this.state.geom_duocyl_rotXW_channel0Factor); break;
            case 'u_geom_duocyl_rotXW_angleScale': gl.uniform1f(loc, this.state.geom_duocyl_rotXW_angleScale); break;
            case 'u_geom_duocyl_finalLattice_minUniverseMod': gl.uniform1f(loc, this.state.geom_duocyl_finalLattice_minUniverseMod); break;

            // FullScreenLattice
            case 'u_lattice_edgeLineWidth': gl.uniform1f(loc, this.state.lattice_edgeLineWidth); break;
            case 'u_lattice_vertexSize': gl.uniform1f(loc, this.state.lattice_vertexSize); break;
            case 'u_lattice_distortP_pZ_factor': gl.uniform1f(loc, this.state.lattice_distortP_pZ_factor); break;
            case 'u_lattice_distortP_morphCoeffs': gl.uniform3fv(loc, this.state.lattice_distortP_morphCoeffs); break;
            case 'u_lattice_distortP_timeFactorScale': gl.uniform1f(loc, this.state.lattice_distortP_timeFactorScale); break;
            case 'u_lattice_wCoord_pLengthFactor': gl.uniform1f(loc, this.state.lattice_wCoord_pLengthFactor); break;
            case 'u_lattice_wCoord_timeFactor': gl.uniform1f(loc, this.state.lattice_wCoord_timeFactor); break;
            case 'u_lattice_wCoord_dimOffset': gl.uniform1f(loc, this.state.lattice_wCoord_dimOffset); break;
            case 'u_lattice_rotXW_timeFactor': gl.uniform1f(loc, this.state.lattice_rotXW_timeFactor); break;
            case 'u_lattice_rotYW_timeFactor': gl.uniform1f(loc, this.state.lattice_rotYW_timeFactor); break;
            case 'u_lattice_rotZW_timeFactor': gl.uniform1f(loc, this.state.lattice_rotZW_timeFactor); break;
            case 'u_lattice_glitch_baseFactor': gl.uniform1f(loc, this.state.lattice_glitch_baseFactor); break;
            case 'u_lattice_glitch_sinFactor': gl.uniform1f(loc, this.state.lattice_glitch_sinFactor); break;
            case 'u_lattice_glitch_rOffsetCoeffs': gl.uniform2fv(loc, this.state.lattice_glitch_rOffsetCoeffs); break;
            case 'u_lattice_glitch_gOffsetCoeffs': gl.uniform2fv(loc, this.state.lattice_glitch_gOffsetCoeffs); break;
            case 'u_lattice_glitch_bOffsetCoeffs': gl.uniform2fv(loc, this.state.lattice_glitch_bOffsetCoeffs); break;
            case 'u_lattice_moire_densityFactor1': gl.uniform1f(loc, this.state.lattice_moire_densityFactor1); break;
            case 'u_lattice_moire_densityFactor2': gl.uniform1f(loc, this.state.lattice_moire_densityFactor2); break;
            case 'u_lattice_moire_blendFactor': gl.uniform1f(loc, this.state.lattice_moire_blendFactor); break;
            case 'u_lattice_moire_mixCoeffs': gl.uniform3fv(loc, this.state.lattice_moire_mixCoeffs); break;
            case 'u_lattice_baseColor': gl.uniform3fv(loc, this.state.lattice_baseColor); break;
            case 'u_lattice_effectColor': gl.uniform3fv(loc, this.state.lattice_effectColor); break;
            case 'u_lattice_glow_color': gl.uniform3fv(loc, this.state.lattice_glow_color); break;
            case 'u_lattice_glow_timeFactor': gl.uniform1f(loc, this.state.lattice_glow_timeFactor); break;
            case 'u_lattice_glow_amplitudeOffset': gl.uniform1f(loc, this.state.lattice_glow_amplitudeOffset); break;
            case 'u_lattice_glow_amplitudeFactor': gl.uniform1f(loc, this.state.lattice_glow_amplitudeFactor); break;
            case 'u_lattice_vignette_inner': gl.uniform1f(loc, this.state.lattice_vignette_inner); break;
            case 'u_lattice_vignette_outer': gl.uniform1f(loc, this.state.lattice_vignette_outer); break;

            case 'u_primaryColor': gl.uniform3fv(loc, this.state.colorScheme.primary); break;
            case 'u_secondaryColor': gl.uniform3fv(loc, this.state.colorScheme.secondary); break;
            case 'u_backgroundColor': gl.uniform3fv(loc, this.state.colorScheme.background); break;
            default: break;
        } } catch (e) { console.error(`Error setting uniform '${name}':`, e); } } else { uniformsToRetry.add(name); } });
        this.state._dirtyUniforms = uniformsToRetry;
        // If WebGL1 and u_dataChannels is dirty, set it
        if (!this.isWebGL2 && dirty.has('u_dataChannels')) {
            const loc = this.shaderManager.getUniformLocation('u_dataChannels');
            if (loc) {
                gl.uniform1fv(loc, this.state.dataChannels);
            } else {
                uniformsToRetry.add('u_dataChannels'); // Add back if not found, though it should be
            }
        }
    }
    _drawFrameLogic(timestamp) {
        const gl = this.gl;
        // --- Start of core rendering logic from original _render ---
        if (!gl || gl.isContextLost()) {
            console.error(`Context lost.`);
            this.stop();
            this.state.callbacks.onError?.(new Error("WebGL context lost"));
            return false; // Indicate failure
        }

        if (!this.state.startTime) this.state.startTime = timestamp;
        const currentTime = (timestamp - this.state.startTime) * 0.001;
        this.state.deltaTime = currentTime - this.state.time;
        this.state.time = currentTime;
        this.state.lastUpdateTime = timestamp;
        this._markUniformDirty('time');

        this._checkResize();

        if (this.state.needsShaderUpdate) {
            if (!this._updateShaderIfNeeded()) {
                return false; // Indicate failure or stop
            }
        }

        this._setUniforms();

        const bg = this.state.colorScheme.background;
        gl.clearColor(bg[0], bg[1], bg[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (this.quadBuffer && this.aPositionLoc !== null && this.aPositionLoc >= 0) {
            try {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
                gl.enableVertexAttribArray(this.aPositionLoc);
                gl.vertexAttribPointer(this.aPositionLoc, 2, gl.FLOAT, false, 0, 0);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            } catch (e) {
                console.error("Draw error:", e);
                this.stop();
                this.state.callbacks.onError?.(new Error("WebGL draw error"));
                return false; // Indicate failure
            }
        }
        this.state.callbacks.onRender?.(this.state);
        return true; // Indicate success
        // --- End of core rendering logic ---
    }
    _render(timestamp) {
        if (!this.state.isRendering) return;

        if (this._drawFrameLogic(timestamp)) { // Call the new method
            // Only request next frame if drawing was successful and still rendering
            if (this.state.isRendering) {
                 this.state.animationFrameId = requestAnimationFrame(this._render.bind(this));
            }
        } else {
            // If _drawFrameLogic returned false, it might have called this.stop() or encountered an error.
            // Ensure rendering stops if not already explicitly stopped.
            if (this.state.isRendering) {
                this.stop(); // Or handle error appropriately
                console.warn("Rendering loop stopped due to issues in _drawFrameLogic.");
            }
        }
    }
    start() { if (this.state.isRendering) return; if (!this.gl || this.gl.isContextLost()) { console.error(`Cannot start, WebGL context invalid.`); return; } console.log(`Starting render loop.`); this.state.isRendering = true; this.state.startTime = performance.now(); this.state.time = 0; this.state.lastUpdateTime = this.state.startTime; if (this.state.needsShaderUpdate) { if (!this._updateShaderIfNeeded()) { console.error(`Initial shader update failed.`); this.state.isRendering = false; return; } } else if (this.aPositionLoc === null || this.aPositionLoc < 0) { this.aPositionLoc = this.shaderManager.getAttributeLocation('a_position'); if (this.aPositionLoc === null || this.aPositionLoc < 0) { console.error(`Attr 'a_position' invalid.`); this.state.isRendering = false; return; } try { this.gl.enableVertexAttribArray(this.aPositionLoc); } catch (e) { console.error("Enable attr error:", e); this.state.isRendering = false; return; } } this._markAllUniformsDirty(); this.state.animationFrameId = requestAnimationFrame(this._render.bind(this)); }
    stop() { if (!this.state.isRendering) return; console.log(`Stopping render loop.`); if (this.state.animationFrameId) { cancelAnimationFrame(this.state.animationFrameId); } this.state.isRendering = false; this.state.animationFrameId = null; }
    dispose() { const name = this.state?.shaderProgramName || 'Unknown'; console.log(`Disposing HypercubeCore (${name})...`); this.stop(); if (this.gl && !this.gl.isContextLost()) { try { if (this.quadBuffer) this.gl.deleteBuffer(this.quadBuffer); if (this.shaderManager?.dispose) { this.shaderManager.dispose(); } const loseCtx = this.gl.getExtension('WEBGL_lose_context'); loseCtx?.loseContext(); } catch(e) { console.warn(`WebGL cleanup error:`, e); } } this.quadBuffer = null; this.gl = null; this.canvas = null; this.shaderManager = null; this.state = {}; console.log(`HypercubeCore (${name}) disposed.`); }
}
export default HypercubeCore;
