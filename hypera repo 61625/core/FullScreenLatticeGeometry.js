import BaseGeometry from './BaseGeometry.js'; // Assuming BaseGeometry exists

class FullScreenLatticeGeometry extends BaseGeometry {
    constructor(options = {}) {
        super(options);
        this.type = 'fullscreenlattice';
    }

    getShaderCode() {
        // GLSL code extracted and adapted from HypercubeLatticeEffect fragment shader
        return `
            // Uniforms expected by this geometry shader code.
            // Global uniforms (u_time, u_resolution, u_mouse, u_morphFactor, u_glitchIntensity, u_rotationSpeed, u_dimension)
            // are passed as arguments to getLatticeEffectColor.
            // gridDensity argument to getLatticeEffectColor is expected to be u_gridDensity_lattice.

            // Specific uniforms for FullScreenLatticeGeometry:
            uniform float u_lattice_edgeLineWidth;
            uniform float u_lattice_vertexSize;
            uniform float u_lattice_distortP_pZ_factor;
            uniform vec3  u_lattice_distortP_morphCoeffs; // x for p.x, y for p.y, z for p.z distortion
            uniform float u_lattice_distortP_timeFactorScale; // Scales the 'timeFactor = time * 0.2 * rotationSpeed' for distortion part

            uniform float u_lattice_wCoord_pLengthFactor;
            uniform float u_lattice_wCoord_timeFactor;
            uniform float u_lattice_wCoord_dimOffset; // e.g. -3.0 to make (dimension - 3.0)

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
            uniform vec3  u_lattice_moire_mixCoeffs; // x for r, y for g, z for b

            uniform vec3  u_lattice_baseColor;
            uniform vec3  u_lattice_effectColor;
            uniform vec3  u_lattice_glow_color;
            uniform float u_lattice_glow_timeFactor;
            uniform float u_lattice_glow_amplitudeOffset;
            uniform float u_lattice_glow_amplitudeFactor;

            uniform float u_lattice_vignette_inner;
            uniform float u_lattice_vignette_outer;


            // Helper Functions from HypercubeLatticeEffect (prefixed with lattice_ to avoid potential conflicts)
            mat4 lattice_rotateXY(float theta) {
                float c = cos(theta); float s = sin(theta);
                return mat4(c,-s,0,0, s,c,0,0, 0,0,1,0, 0,0,0,1);
            }
            mat4 lattice_rotateXZ(float theta) {
                float c = cos(theta); float s = sin(theta);
                return mat4(c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1);
            }
            mat4 lattice_rotateXW(float theta) {
                float c = cos(theta); float s = sin(theta);
                return mat4(c,0,0,-s, 0,1,0,0, 0,0,1,0, s,0,0,c);
            }
            mat4 lattice_rotateYZ(float theta) {
                float c = cos(theta); float s = sin(theta);
                return mat4(1,0,0,0, 0,c,-s,0, 0,s,c,0, 0,0,0,1);
            }
            mat4 lattice_rotateYW(float theta) {
                float c = cos(theta); float s = sin(theta);
                return mat4(1,0,0,0, 0,c,0,-s, 0,0,1,0, 0,s,0,c);
            }
            mat4 lattice_rotateZW(float theta) {
                float c = cos(theta); float s = sin(theta);
                return mat4(1,0,0,0, 0,1,0,0, 0,0,c,-s, 0,0,s,c);
            }

            vec3 lattice_project4Dto3D(vec4 p) {
                float w = 2.0 / (2.0 + p.w);
                return vec3(p.x * w, p.y * w, p.z * w);
            }

            // vec2 lattice_project3Dto2D(vec3 p) { // Not directly used if output is color
            //     float z = 2.0 / (3.0 + p.z);
            //     return vec2(p.x * z, p.y * z);
            // }

            // float lattice_gridLine(float position, float width) { // Seems unused in final main
            //     float halfW = width * 0.5;
            //     return smoothstep(0.0, halfW, halfW - abs(position));
            // }

            // float lattice_distanceToGridPoint(vec3 p, float gridSize) { // Seems unused in final main
            //     vec3 gridPos = floor(p * gridSize + 0.5) / gridSize;
            //     return length(p - gridPos);
            // }

            float lattice_edges(vec3 p, float gridSize, float lineWidth) {
                vec3 grid = fract(p * gridSize);
                vec3 edges = 1.0 - smoothstep(0.0, lineWidth, abs(grid - 0.5));
                return max(max(edges.x, edges.y), edges.z);
            }

            float lattice_vertices(vec3 p, float gridSize, float vertexSize) {
                vec3 grid = fract(p * gridSize);
                vec3 distToVertex = min(grid, 1.0 - grid);
                float minDist = min(min(distToVertex.x, distToVertex.y), distToVertex.z);
                return 1.0 - smoothstep(0.0, vertexSize, minDist);
            }

            float calculateHypercubeLatticeValue(vec3 p_calc, float morphFactor_calc, float gridSize_calc, float time_calc, float rotationSpeed_calc, float dimension_calc) {
                // Use parameterized edgeLineWidth and vertexSize
                float edges = lattice_edges(p_calc, gridSize_calc, u_lattice_edgeLineWidth);
                float vertices = lattice_vertices(p_calc, gridSize_calc, u_lattice_vertexSize);

                // Use parameterized timeFactorScale for distortion time effect
                float timeFactor = time_calc * u_lattice_distortP_timeFactorScale * rotationSpeed_calc;

                vec3 distortedP = p_calc;
                // Use parameterized distortion factors
                distortedP.x += sin(p_calc.z * u_lattice_distortP_pZ_factor + timeFactor) * morphFactor_calc * u_lattice_distortP_morphCoeffs.x;
                distortedP.y += cos(p_calc.x * u_lattice_distortP_pZ_factor + timeFactor) * morphFactor_calc * u_lattice_distortP_morphCoeffs.y; // Assuming pZ_factor can be reused for pX
                distortedP.z += sin(p_calc.y * u_lattice_distortP_pZ_factor + timeFactor) * morphFactor_calc * u_lattice_distortP_morphCoeffs.z; // Assuming pZ_factor can be reused for pY

                if (dimension_calc > 3.0) { // This 3.0 could be a uniform u_lattice_minWDimension
                  // Parameterized w-coordinate calculation
                  float w = sin(length(p_calc) * u_lattice_wCoord_pLengthFactor + time_calc * u_lattice_wCoord_timeFactor) * (dimension_calc + u_lattice_wCoord_dimOffset);
                  vec4 p4d = vec4(distortedP, w);

                  // Parameterized 4D rotations
                  p4d = lattice_rotateXW(timeFactor * u_lattice_rotXW_timeFactor) * p4d;
                  p4d = lattice_rotateYW(timeFactor * u_lattice_rotYW_timeFactor) * p4d;
                  p4d = lattice_rotateZW(timeFactor * u_lattice_rotZW_timeFactor) * p4d;

                  distortedP = lattice_project4Dto3D(p4d);
                }

                // Use parameterized edgeLineWidth and vertexSize again for distorted version
                float distortedEdges = lattice_edges(distortedP, gridSize_calc, u_lattice_edgeLineWidth);
                float distortedVertices = lattice_vertices(distortedP, gridSize_calc, u_lattice_vertexSize);

                edges = mix(edges, distortedEdges, morphFactor);
                vertices = mix(vertices, distortedVertices, morphFactor);

                return max(edges, vertices);
            }

            // This function will be called by the main fragment shader
            // It replaces the 'main()' function of the original HypercubeLatticeEffect shader
            vec3 getLatticeEffectColor(vec2 screenUV, float time, vec2 resolution, vec2 mouse,
                                       float morphFactor, float glitchIntensity, float rotationSpeed,
                                       float dimension, float gridDensity) {

                // screenUV is v_uv from main shader. Global uniforms (time, resolution, mouse, etc.) are passed as args.
                // gridDensity arg is u_gridDensity_lattice.
                vec2 uv_norm = screenUV;

                float aspectRatio = resolution.x / resolution.y;
                uv_norm.x *= aspectRatio;

                vec2 center = vec2(mouse.x * aspectRatio, mouse.y); // mouse is global u_mouse

                vec3 p_base = vec3(uv_norm - center, 0.0);

                // Original timeRotation used 0.2, can be parameterized if needed: u_lattice_mainRotationFactor
                float timeRotation = time * 0.2 * rotationSpeed;
                mat2 rotation = mat2(cos(timeRotation), -sin(timeRotation), sin(timeRotation), cos(timeRotation));
                p_base.xy = rotation * p_base.xy;

                 // Original p.z movement, can be parameterized: u_lattice_pz_timeFactor, u_lattice_pz_amplitude
                p_base.z = sin(time * 0.1) * 0.5;

                // Parameterized glitch amount
                float glitchAmount = glitchIntensity * (u_lattice_glitch_baseFactor + u_lattice_glitch_baseFactor * sin(time * u_lattice_glitch_sinFactor));

                // Parameterized glitch offsets
                vec2 rOffset = glitchAmount * u_lattice_glitch_rOffsetCoeffs;
                vec2 gOffset = glitchAmount * u_lattice_glitch_gOffsetCoeffs;
                vec2 bOffset = glitchAmount * u_lattice_glitch_bOffsetCoeffs;

                float r_val = calculateHypercubeLatticeValue(vec3(p_base.xy + rOffset, p_base.z), morphFactor, gridDensity, time, rotationSpeed, dimension);
                float g_val = calculateHypercubeLatticeValue(vec3(p_base.xy + gOffset, p_base.z), morphFactor, gridDensity, time, rotationSpeed, dimension);
                float b_val = calculateHypercubeLatticeValue(vec3(p_base.xy + bOffset, p_base.z), morphFactor, gridDensity, time, rotationSpeed, dimension);

                // Parameterized Moiré
                float moireGrid1 = calculateHypercubeLatticeValue(p_base, morphFactor, gridDensity * u_lattice_moire_densityFactor1, time, rotationSpeed, dimension);
                float moireGrid2 = calculateHypercubeLatticeValue(p_base, morphFactor, gridDensity * u_lattice_moire_densityFactor2, time, rotationSpeed, dimension);
                float moire = abs(moireGrid1 - moireGrid2) * u_lattice_moire_blendFactor;

                r_val = mix(r_val, moire, u_lattice_moire_mixCoeffs.r);
                g_val = mix(g_val, moire, u_lattice_moire_mixCoeffs.g);
                b_val = mix(b_val, moire, u_lattice_moire_mixCoeffs.b);

                // Use parameterized base and effect colors
                vec3 final_color = mix(u_lattice_baseColor, u_lattice_effectColor, vec3(r_val, g_val, b_val));

                // Parameterized pulsing glow
                final_color += u_lattice_glow_color * (u_lattice_glow_amplitudeOffset + u_lattice_glow_amplitudeFactor * sin(time * u_lattice_glow_timeFactor));

                // Parameterized vignette
                float vignette = 1.0 - smoothstep(u_lattice_vignette_inner, u_lattice_vignette_outer, length(uv_norm - vec2(center.x, center.y)));
                color *= vignette;

                return color;
            }
        `;
    }
}

export default FullScreenLatticeGeometry;
