/* core/ShaderManager.js - v1.4 */
class ShaderManager {
    constructor(gl, geometryManager, projectionManager, options = {}) { if (!gl) throw new Error("WebGL context needed."); if (!geometryManager) throw new Error("GeometryManager needed."); if (!projectionManager) throw new Error("ProjectionManager needed."); this.gl = gl; this.geometryManager = geometryManager; this.projectionManager = projectionManager; this.options = this._mergeDefaults(options); this.shaderSources = {}; this.compiledShaders = {}; this.programs = {}; this.uniformLocations = {}; this.attributeLocations = {}; this.currentProgramName = null; this._initShaderTemplates(); }
    _mergeDefaults(options){ return { baseVertexShaderName: 'base-vertex', baseFragmentShaderName: 'base-fragment', ...options }; }
    _initShaderTemplates(){ this._registerShaderSource(this.options.baseVertexShaderName, this._getBaseVertexShaderSource(), this.gl.VERTEX_SHADER); this._registerShaderSource(this.options.baseFragmentShaderName, this._getBaseFragmentShaderSource(), this.gl.FRAGMENT_SHADER); }
    _registerShaderSource(name, source, type){ this.shaderSources[name] = { source, type }; }
    _compileShader(shaderIdentifier, source, type) { if (this.compiledShaders[shaderIdentifier]) { return this.compiledShaders[shaderIdentifier]; } const shader = this.gl.createShader(type); if (!shader) { console.error(`Failed create shader '${shaderIdentifier}'.`); this.compiledShaders[shaderIdentifier] = null; return null; } this.gl.shaderSource(shader, source); this.gl.compileShader(shader); if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) { const log = this.gl.getShaderInfoLog(shader); console.error(`Compile error shader '${shaderIdentifier}':\n${log}`); this._logShaderSourceWithError(source, log); this.gl.deleteShader(shader); this.compiledShaders[shaderIdentifier] = null; return null; } this.compiledShaders[shaderIdentifier] = shader; return shader; }
    _logShaderSourceWithError(source, errorLog) { const lines=source.split('\n'); const match=errorLog.match(/ERROR:\s*\d+:(\d+):/); let errLine=match?parseInt(match[1],10):-1; console.error("--- Shader Source ---"); lines.forEach((line, i)=>{const p=(i+1===errLine)?">> ": "   "; console.error(p+(i+1).toString().padStart(3)+": "+line);}); console.error("--- Shader Source End ---"); }
    _createProgram(programName, vertexShader, fragmentShader) { if (this.programs[programName]) { const old = this.programs[programName]; if (old) { try { const shaders = this.gl.getAttachedShaders(old); shaders?.forEach(s => this.gl.detachShader(old, s)); this.gl.deleteProgram(old); } catch (e) {} } delete this.programs[programName]; delete this.uniformLocations[programName]; delete this.attributeLocations[programName]; } const program = this.gl.createProgram(); if (!program) { console.error(`Failed create program '${programName}'.`); return null; } this.gl.attachShader(program, vertexShader); this.gl.attachShader(program, fragmentShader); this.gl.linkProgram(program); if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) { console.error(`Link error program '${programName}':\n${this.gl.getProgramInfoLog(program)}`); try { this.gl.detachShader(program, vertexShader); } catch(e) {} try { this.gl.detachShader(program, fragmentShader); } catch(e) {} this.gl.deleteProgram(program); this.programs[programName] = null; return null; } this.programs[programName] = program; this.uniformLocations[programName] = {}; this.attributeLocations[programName] = {}; console.log(`Program '${programName}' created/linked.`); return program; }
    createDynamicProgram(programName, geometryTypeName, projectionMethodName) { const vsName = this.options.baseVertexShaderName; const vsInfo = this.shaderSources[vsName]; if (!vsInfo) { console.error(`Base VS source '${vsName}' missing.`); return null; } const vs = this._compileShader(vsName, vsInfo.source, vsInfo.type); if (!vs) return null; const geom = this.geometryManager.getGeometry(geometryTypeName); const proj = this.projectionManager.getProjection(projectionMethodName); if (!geom || !proj) { console.error(`Geom/Proj provider missing.`); return null; } const geomGLSL = geom.getShaderCode(); const projGLSL = proj.getShaderCode(); if (typeof geomGLSL !== 'string' || typeof projGLSL !== 'string') { console.error(`Invalid GLSL returned.`); return null; } const fsName = this.options.baseFragmentShaderName; const fsInfo = this.shaderSources[fsName]; if (!fsInfo) { console.error(`Base FS source '${fsName}' missing.`); return null; } let fsSource = fsInfo.source; fsSource = fsSource.replace('//__GEOMETRY_CODE_INJECTION_POINT__', geomGLSL); fsSource = fsSource.replace('//__PROJECTION_CODE_INJECTION_POINT__', projGLSL); const fsId = `fragment-${geometryTypeName}-${projectionMethodName}`; const fs = this._compileShader(fsId, fsSource, fsInfo.type); if (!fs) return null; const newProg = this._createProgram(programName, vs, fs); if (this.currentProgramName === programName) { if (newProg) { this.gl.useProgram(newProg); } else { this.gl.useProgram(null); this.currentProgramName = null; console.error(`Failed rebuild active program '${programName}'.`); } } return newProg; }
    useProgram(programName) { if (programName === null) { if (this.currentProgramName !== null) { try { this.gl.useProgram(null); } catch(e){} this.currentProgramName = null; } return true; } const program = this.programs[programName]; if (program) { const currentGLProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM); if (currentGLProgram !== program) { try { this.gl.useProgram(program); } catch(e) { console.error(`useProgram failed for ${programName}`, e); return false;} } this.currentProgramName = programName; return true; } else { console.warn(`Program '${programName}' not found or invalid.`); if (this.currentProgramName === programName) { this.currentProgramName = null; try { this.gl.useProgram(null); } catch(e){} } return false;} }
    getUniformLocation(name) { if (!this.currentProgramName || !this.programs[this.currentProgramName]) { return null; } const cache = this.uniformLocations[this.currentProgramName]; if (cache.hasOwnProperty(name)) { return cache[name]; } const loc = this.gl.getUniformLocation(this.programs[this.currentProgramName], name); cache[name] = loc; return loc; }
    getAttributeLocation(name) { if (!this.currentProgramName || !this.programs[this.currentProgramName]) { return null; } const cache = this.attributeLocations[this.currentProgramName]; if (cache.hasOwnProperty(name)) { return cache[name]; } const loc = this.gl.getAttribLocation(this.programs[this.currentProgramName], name); cache[name] = (loc === -1) ? null : loc; return cache[name]; }
    _getBaseVertexShaderSource() { return `attribute vec2 a_position; varying vec2 v_uv; void main() { v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`; }
    _getBaseFragmentShaderSource() {
        return \`
#version 300 es
            precision highp float;
            uniform vec2 u_resolution; uniform float u_time;
            uniform float u_dimension; uniform float u_morphFactor; uniform float u_rotationSpeed;
            uniform float u_universeModifier; uniform float u_patternIntensity; uniform float u_gridDensity;
            uniform float u_lineThickness; uniform float u_shellWidth; uniform float u_tetraThickness; // Specific thickness uniforms
            uniform float u_glitchIntensity; uniform float u_colorShift;
            uniform vec3 u_primaryColor; uniform vec3 u_secondaryColor; uniform vec3 u_backgroundColor;
            uniform vec2 u_mouse; // Global mouse
            uniform int u_isFullScreenEffect; // Flag to switch rendering path

            // Projection Uniforms (Perspective)
            uniform float u_proj_perspective_baseDistance;
            uniform float u_proj_perspective_morphFactorImpact;
            uniform float u_proj_perspective_channelImpact; // Assumes pmk_channels[1] for u_audioMid
            uniform float u_proj_perspective_denomMin;

            // Projection Uniforms (Stereographic)
            uniform float u_proj_stereo_basePoleW;
            uniform float u_proj_stereo_channelImpact; // Assumes pmk_channels[2] for u_audioHigh
            uniform float u_proj_stereo_epsilon;
            uniform float u_proj_stereo_singularityScale;
            uniform float u_proj_stereo_morphFactorImpact;

            // Geometry Specific Uniforms (HypercubeGeometry)
            uniform float u_geom_hypercube_gridDensity_channel0Factor;
            uniform float u_geom_hypercube_gridDensity_timeFactor;
            uniform float u_geom_hypercube_lineThickness_channel1Factor;
            uniform vec3  u_geom_hypercube_wCoord_pCoeffs1;
            uniform float u_geom_hypercube_wCoord_timeFactor1;
            uniform float u_geom_hypercube_wCoord_pLengthFactor;
            uniform float u_geom_hypercube_wCoord_timeFactor2;
            uniform float u_geom_hypercube_wCoord_channel1Factor;
            uniform vec3  u_geom_hypercube_wCoord_coeffs2;
            uniform float u_geom_hypercube_baseSpeedFactor;
            uniform float u_geom_hypercube_rotXW_timeFactor;
            uniform float u_geom_hypercube_rotXW_channel2Factor;
            uniform float u_geom_hypercube_rotXW_morphFactor;
            uniform float u_geom_hypercube_rotYZ_timeFactor;
            uniform float u_geom_hypercube_rotYZ_channel1Factor;
            uniform float u_geom_hypercube_rotYZ_morphFactor;
            uniform float u_geom_hypercube_rotYZ_angleScale;
            uniform float u_geom_hypercube_rotZW_timeFactor;
            uniform float u_geom_hypercube_rotZW_channel0Factor;
            uniform float u_geom_hypercube_rotZW_morphFactor;
            uniform float u_geom_hypercube_rotZW_angleScale;
            uniform float u_geom_hypercube_rotYW_timeFactor;
            uniform float u_geom_hypercube_rotYW_morphFactor;
            uniform float u_geom_hypercube_finalLattice_minUniverseMod;

            // Uniforms for FullScreenLatticeEffect (specific ones)
            uniform float u_gridDensity_lattice; // Specific to lattice effect (already declared)
            uniform float u_lattice_edgeLineWidth;
            uniform float u_lattice_vertexSize;
            uniform float u_lattice_distortP_pZ_factor;
            uniform vec3  u_lattice_distortP_morphCoeffs;
            uniform float u_lattice_distortP_timeFactorScale;
            uniform float u_lattice_wCoord_pLengthFactor;
            uniform float u_lattice_wCoord_timeFactor;
            uniform float u_lattice_wCoord_dimOffset;
            uniform float u_lattice_rotXW_timeFactor;
            uniform float u_lattice_rotYW_timeFactor;
            uniform float u_lattice_rotZW_timeFactor;
            uniform float u_lattice_glitch_baseFactor;
            uniform float u_lattice_glitch_sinFactor;
            uniform vec2  u_lattice_glitch_rOffsetCoeffs;
            uniform vec2  u_lattice_glitch_gOffsetCoeffs;
            uniform vec2  u_lattice_glitch_bOffsetCoeffs;
            uniform float u_lattice_moire_densityFactor1;
            uniform float u_lattice_moire_densityFactor2;
            uniform float u_lattice_moire_blendFactor;
            uniform vec3  u_lattice_moire_mixCoeffs;
            uniform vec3  u_lattice_baseColor;
            uniform vec3  u_lattice_effectColor;
            uniform vec3  u_lattice_glow_color;
            uniform float u_lattice_glow_timeFactor;
            uniform float u_lattice_glow_amplitudeOffset;
            uniform float u_lattice_glow_amplitudeFactor;
            uniform float u_lattice_vignette_inner;
            uniform float u_lattice_vignette_outer;

            // Geometry Specific Uniforms (HypersphereGeometry)
            uniform float u_geom_hsphere_density_gridFactor;
            uniform float u_geom_hsphere_density_channel0Factor;
            uniform float u_geom_hsphere_shellWidth_channel1Factor;
            uniform float u_geom_hsphere_phase_tauFactor;
            uniform float u_geom_hsphere_phase_rotSpeedFactor;
            uniform float u_geom_hsphere_phase_channel2Factor;
            uniform float u_geom_hsphere_wCoord_radiusFactor;
            uniform float u_geom_hsphere_wCoord_timeFactorCos;
            uniform vec3  u_geom_hsphere_wCoord_pCoeffs;
            uniform float u_geom_hsphere_wCoord_timeFactorSin;
            uniform float u_geom_hsphere_wCoord_dimFactorOffset;
            uniform float u_geom_hsphere_wCoord_morphFactor;
            uniform float u_geom_hsphere_wCoord_channel1Factor;
            uniform float u_geom_hsphere_baseSpeedFactor;
            uniform float u_geom_hsphere_rotXW_timeFactor;
            uniform float u_geom_hsphere_rotXW_channel2Factor;
            uniform float u_geom_hsphere_rotXW_angleScale;
            uniform float u_geom_hsphere_finalLattice_minUniverseMod;

            // Geometry Specific Uniforms (HypertetrahedronGeometry)
            uniform float u_geom_htetra_density_gridFactor;
            uniform float u_geom_htetra_density_channel0Factor;
            uniform float u_geom_htetra_thickness_channel1Factor;
            uniform float u_geom_htetra_pMod3D_timeFactor;
            uniform vec3  u_geom_htetra_wCoord_pCoeffsCos;
            uniform float u_geom_htetra_wCoord_timeFactorCos;
            uniform float u_geom_htetra_wCoord_pLengthFactor;
            uniform float u_geom_htetra_wCoord_timeFactorSin;
            uniform float u_geom_htetra_wCoord_channel1Factor;
            uniform float u_geom_htetra_wCoord_dimFactorOffset;
            uniform float u_geom_htetra_wCoord_morphFactor;
            uniform float u_geom_htetra_wCoord_channel2Factor;
            uniform float u_geom_htetra_baseSpeedFactor;
            uniform float u_geom_htetra_rotXW_timeFactor;
            uniform float u_geom_htetra_rotXW_channel2Factor;
            uniform float u_geom_htetra_rotXW_angleScale;
            uniform float u_geom_htetra_pMod4D_timeFactor;
            uniform float u_geom_htetra_finalLattice_minUniverseMod;

            // Geometry Specific Uniforms (DuocylinderGeometry)
            uniform float u_geom_duocyl_r1_base;
            uniform float u_geom_duocyl_r1_morphFactor;
            uniform float u_geom_duocyl_r2_base;
            uniform float u_geom_duocyl_r2_channel0Factor;
            uniform float u_geom_duocyl_shellWidth_channel1Factor;
            uniform float u_geom_duocyl_fallback_pLengthFactor;
            uniform float u_geom_duocyl_fallback_channel2Factor;
            uniform float u_geom_duocyl_wCoord_len_pXY_Factor;
            uniform float u_geom_duocyl_wCoord_timeFactorCos;
            uniform float u_geom_duocyl_wCoord_pzFactor;
            uniform float u_geom_duocyl_wCoord_pxFactor;
            uniform float u_geom_duocyl_wCoord_timeFactorSin;
            uniform float u_geom_duocyl_wCoord_dimFactorOffset;
            uniform float u_geom_duocyl_wCoord_morphFactor;
            uniform float u_geom_duocyl_wCoord_channel2Factor;
            uniform float u_geom_duocyl_baseSpeedFactor;
            uniform float u_geom_duocyl_rotXW_timeFactor;
            uniform float u_geom_duocyl_rotXW_channel0Factor;
            uniform float u_geom_duocyl_rotXW_angleScale;
            uniform float u_geom_duocyl_finalLattice_minUniverseMod;

            varying vec2 v_uv;

            layout(std140) uniform GlobalDataBlock {
                float pmk_channels[64]; // Start with 64 floats
            };

            // N-DIMENSIONAL GENERALIZATION POINT:
            // The following rotation matrices (rotXW, rotYW, etc.) are specific to 3D/4D.
            // For N-dimensional support, these would need to be replaced or supplemented by
            // a generalized N-D rotation function, e.g.:
            // void apply_rotation_nd(inout float p[N_DIMS], int axis1, int axis2, float angle, int N_DIMS) { ... }
            // or matrix generation functions for N-D rotation matrices.
            // The 'mat4' type would also need to be generalized (e.g., float[N_DIMS*N_DIMS]).
            mat4 rotXW(float a){float c=cos(a),s=sin(a);return mat4(c,0,0,-s, 0,1,0,0, 0,0,1,0, s,0,0,c);} mat4 rotYW(float a){float c=cos(a),s=sin(a);return mat4(1,0,0,0, 0,c,0,-s, 0,0,1,0, 0,s,0,c);} mat4 rotZW(float a){float c=cos(a),s=sin(a);return mat4(1,0,0,0, 0,1,0,0, 0,0,c,-s, 0,0,s,c);} mat4 rotXY(float a){float c=cos(a),s=sin(a);return mat4(c,-s,0,0, s,c,0,0, 0,0,1,0, 0,0,0,1);} mat4 rotYZ(float a){float c=cos(a),s=sin(a);return mat4(1,0,0,0, 0,c,-s,0, 0,s,c,0, 0,0,0,1);} mat4 rotXZ(float a){float c=cos(a),s=sin(a);return mat4(c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1);}

            /*
            // N-DIMENSIONAL GENERALIZATION STUB (Illustrative)
            // const int MAX_SUPPORTED_DIMS = 8; // Example max
            // void rotate_hyperplane_nd(inout float point[MAX_SUPPORTED_DIMS], int d1, int d2, float angle, int actual_dims) {
            //     if (d1 >= actual_dims || d2 >= actual_dims || d1 == d2) return; // Basic checks
            //     float c = cos(angle);
            //     float s = sin(angle);
            //     float val1 = point[d1];
            //     float val2 = point[d2];
            //     point[d1] = val1 * c - val2 * s;
            //     point[d2] = val1 * s + val2 * c;
            // }
            //
            // Example usage (conceptual):
            // float my_nd_point[MAX_SUPPORTED_DIMS];
            // // ... initialize my_nd_point from p, w_coord, etc. based on u_dimension ...
            // rotate_hyperplane_nd(my_nd_point, 0, 3, u_time, int(u_dimension)); // Rotate XW plane if u_dimension is 4+
            */

            vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);} vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}

            // N-DIMENSIONAL GENERALIZATION POINT:
            // The injected projection code (e.g., project4Dto3D) is dimension-specific.
            // For N-D support, this would need to become a generalized projectNDtoMD function,
            // where N (source dimensions) and M (target dimensions, e.g., 3 for visualization)
            // are parameters or determined by u_dimension.
            //__PROJECTION_CODE_INJECTION_POINT__
            //__GEOMETRY_CODE_INJECTION_POINT__ // This will now contain both calculateLattice and getLatticeEffectColor

            void main() {
                vec3 finalColor;

                if (u_isFullScreenEffect == 1) {
                    // FullScreenLatticeEffect path
                    // Note: u_mouse_lattice, u_morphFactor_lattice etc. were defined in FullScreenLatticeGeometry.
                    // Here, we assume HypercubeCore will map global uniforms (u_mouse, u_morphFactor etc.)
                    // to these if they are intended to be the same, or manage specific ones.
                    // For this subtask, we use the global uniform names directly where they match,
                    // and specific names (like u_gridDensity_lattice) where specified.
                    // u_mouse is assumed to be a global vec2 uniform for mouse position.
                    finalColor = getLatticeEffectColor(v_uv, u_time, u_resolution, u_mouse,
                                                       u_morphFactor, u_glitchIntensity, u_rotationSpeed,
                                                       u_dimension, u_gridDensity_lattice);
                } else {
                    // Standard SDF rendering path
                    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0); vec2 uv = (v_uv * 2.0 - 1.0) * aspect;
                    vec3 rayOrigin = vec3(0.0, 0.0, -2.5); vec3 rayDirection = normalize(vec3(uv, 1.0));

                    // Use pmk_channels for rotation influence as per previous changes
                    float camRotY = u_time * 0.05 * u_rotationSpeed + pmk_channels[1] * 0.1;
                    float camRotX = sin(u_time * 0.03 * u_rotationSpeed) * 0.15 + pmk_channels[2] * 0.1;
                    mat4 camMat = rotXY(camRotX) * rotYZ(camRotY);
                    rayDirection = (camMat * vec4(rayDirection, 0.0)).xyz;

                    vec3 p = rayDirection * 1.5;
                    float latticeValue = calculateLattice(p); // From standard SDF geometries

                    finalColor = mix(u_backgroundColor, u_primaryColor, latticeValue);
                    finalColor = mix(finalColor, u_secondaryColor, smoothstep(0.2, 0.7, pmk_channels[1]) * latticeValue * 0.6);

                    if (abs(u_colorShift) > 0.01) {
                        vec3 hsv = rgb2hsv(finalColor);
                        hsv.x = fract(hsv.x + u_colorShift * 0.5 + pmk_channels[2] * 0.1);
                        finalColor = hsv2rgb(hsv);
                    }

                    finalColor *= (0.8 + u_patternIntensity * 0.7);

                    if (u_glitchIntensity > 0.001) {
                         float glitch = u_glitchIntensity * (0.5 + 0.5 * sin(u_time * 8.0 + p.y * 10.0));
                         vec2 offsetR = vec2(cos(u_time*25.), sin(u_time*18.+p.x*5.)) * glitch * 0.2 * aspect;
                         vec2 offsetB = vec2(sin(u_time*19.+p.y*6.), cos(u_time*28.)) * glitch * 0.15 * aspect;

                         vec3 pR_glitch = normalize(vec3(uv + offsetR/aspect, 1.0));
                         pR_glitch = (camMat*vec4(pR_glitch,0.0)).xyz * 1.5;
                         vec3 pB_glitch = normalize(vec3(uv + offsetB/aspect, 1.0));
                         pB_glitch = (camMat*vec4(pB_glitch,0.0)).xyz * 1.5;

                         float latticeR = calculateLattice(pR_glitch);
                         float latticeB = calculateLattice(pB_glitch);

                         vec3 colorR = mix(u_backgroundColor, u_primaryColor, latticeR);
                         colorR = mix(colorR, u_secondaryColor, smoothstep(0.2, 0.7, pmk_channels[1]) * latticeR * 0.6);
                         vec3 colorB = mix(u_backgroundColor, u_primaryColor, latticeB);
                         colorB = mix(colorB, u_secondaryColor, smoothstep(0.2, 0.7, pmk_channels[1]) * latticeB * 0.6);

                         if (abs(u_colorShift) > 0.01) {
                             vec3 hsvR=rgb2hsv(colorR); hsvR.x=fract(hsvR.x+u_colorShift*0.5+pmk_channels[2]*0.1); colorR=hsv2rgb(hsvR);
                             vec3 hsvB=rgb2hsv(colorB); hsvB.x=fract(hsvB.x+u_colorShift*0.5+pmk_channels[2]*0.1); colorB=hsv2rgb(hsvB);
                         }
                         finalColor = vec3(colorR.r, finalColor.g, colorB.b);
                         finalColor *= (0.8 + u_patternIntensity * 0.7);
                    }
                    finalColor = pow(clamp(finalColor, 0.0, 1.5), vec3(0.9));
                }
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
    }
    dispose() { console.log("Disposing ShaderManager..."); if (!this.gl) return; try { this.gl.useProgram(null); } catch(e) {} for (const name in this.programs) { if (this.programs[name]) { const p = this.programs[name]; try { const s = this.gl.getAttachedShaders(p); s?.forEach(sh=>this.gl.detachShader(p,sh)); this.gl.deleteProgram(p); } catch (e) {} } } this.programs={}; for (const name in this.compiledShaders) { if(this.compiledShaders[name]) { try {this.gl.deleteShader(this.compiledShaders[name]);} catch(e){} } } this.compiledShaders={}; this.shaderSources={}; this.uniformLocations={}; this.attributeLocations={}; this.currentProgramName=null; this.geometryManager=null; this.projectionManager=null; console.log("ShaderManager disposed."); }
}
export default ShaderManager;
