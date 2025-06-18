/* core/GeometryManager.js - v1.4 */
class BaseGeometry { constructor() {} getShaderCode() { throw new Error(`getShaderCode() must be implemented.`); } }

class HypercubeGeometry extends BaseGeometry {
    getShaderCode() {
        return `
            // NEW Uniforms available: u_lineThickness, u_colorShift
            // Uniforms used: u_dimension, u_time, u_morphFactor, u_gridDensity, u_lineThickness
            // u_universeModifier, pmk_channels, u_rotationSpeed
            float calculateLattice(vec3 p) {
                // Parameterized dynamicGridDensity
                float dynamicGridDensity = max(0.1, u_gridDensity * (1.0 + pmk_channels[0] * u_geom_hypercube_gridDensity_channel0Factor));
                // Parameterized dynamicLineThickness
                float dynamicLineThickness = max(0.002, u_lineThickness * (1.0 - pmk_channels[1] * u_geom_hypercube_lineThickness_channel1Factor));

                // Use u_geom_hypercube_gridDensity_timeFactor for time-based grid animation
                vec3 p_grid3D = fract(p * dynamicGridDensity * 0.5 + u_time * u_geom_hypercube_gridDensity_timeFactor);
                vec3 dist3D = abs(p_grid3D - 0.5);
                float box3D = max(dist3D.x, max(dist3D.y, dist3D.z));
                float lattice3D = smoothstep(0.5, 0.5 - dynamicLineThickness, box3D);

                float finalLattice = lattice3D;
                float dim_factor = smoothstep(3.0, 4.5, u_dimension);

                if (dim_factor > 0.01) {
                    // Parameterized w_coord calculation
                    float w_coord_sin_arg = dot(p, u_geom_hypercube_wCoord_pCoeffs1) + u_time * u_geom_hypercube_wCoord_timeFactor1;
                    float w_coord_cos_arg = length(p) * u_geom_hypercube_wCoord_pLengthFactor - u_time * u_geom_hypercube_wCoord_timeFactor2 + pmk_channels[1] * u_geom_hypercube_wCoord_channel1Factor;
                    float w_coord_factor_coeffs = u_geom_hypercube_wCoord_coeffs2.x + u_morphFactor * u_geom_hypercube_wCoord_coeffs2.y + pmk_channels[2] * u_geom_hypercube_wCoord_coeffs2.z;

                    float w_coord = sin(w_coord_sin_arg) * cos(w_coord_cos_arg) * dim_factor * w_coord_factor_coeffs;

                    vec4 p4d = vec4(p, w_coord);
                    float baseSpeed = u_rotationSpeed * u_geom_hypercube_baseSpeedFactor; // New global factor for baseSpeed of this geometry

                    // Parameterized 4D rotations
                    float time_rot1 = u_time * u_geom_hypercube_rotXW_timeFactor * baseSpeed + pmk_channels[2] * u_geom_hypercube_rotXW_channel2Factor + u_morphFactor * u_geom_hypercube_rotXW_morphFactor;
                    float time_rot2 = u_time * u_geom_hypercube_rotYZ_timeFactor * baseSpeed - pmk_channels[1] * u_geom_hypercube_rotYZ_channel1Factor + u_morphFactor * u_geom_hypercube_rotYZ_morphFactor; // Added morph factor for YZ
                    float time_rot3 = u_time * u_geom_hypercube_rotZW_timeFactor * baseSpeed + pmk_channels[0] * u_geom_hypercube_rotZW_channel0Factor + u_morphFactor * u_geom_hypercube_rotZW_morphFactor; // Added morph factor for ZW

                    p4d = rotXW(time_rot1) * rotYZ(time_rot2 * u_geom_hypercube_rotYZ_angleScale) * rotZW(time_rot3 * u_geom_hypercube_rotZW_angleScale) * p4d;

                    float finalYW_rot_angle = u_time * u_geom_hypercube_rotYW_timeFactor * baseSpeed + u_morphFactor * u_geom_hypercube_rotYW_morphFactor;
                    p4d = rotYW(finalYW_rot_angle) * p4d;

                    vec3 projectedP = project4Dto3D(p4d); // Uses projection function
                    // Use u_geom_hypercube_gridDensity_timeFactor for 4D grid animation too (or a new one)
                    vec3 p_grid4D_proj = fract(projectedP * dynamicGridDensity * 0.5 + u_time * (u_geom_hypercube_gridDensity_timeFactor + 0.005)); // slight variation for 4D
                    vec3 dist4D_proj = abs(p_grid4D_proj - 0.5);
                    float box4D_proj = max(dist4D_proj.x, max(dist4D_proj.y, dist4D_proj.z));
                    float lattice4D_proj = smoothstep(0.5, 0.5 - dynamicLineThickness, box4D_proj);
                    finalLattice = mix(lattice3D, lattice4D_proj, smoothstep(0.0, 1.0, u_morphFactor));
                }
                // Parameterized finalLattice power
                return pow(finalLattice, 1.0 / max(u_geom_hypercube_finalLattice_minUniverseMod, u_universeModifier));
            }
        `;
    }
}

class HypersphereGeometry extends BaseGeometry {
    getShaderCode() {
        return `
            // NEW Uniforms available: u_shellWidth, u_colorShift
            // Uniforms used: u_dimension, u_time, u_morphFactor, u_gridDensity, u_shellWidth
            // u_universeModifier, pmk_channels, u_rotationSpeed
            float calculateLattice(vec3 p) {
                float radius3D = length(p);
                // Parameterized densityFactor
                float densityFactor = max(0.1, u_gridDensity * u_geom_hsphere_density_gridFactor * (1.0 + pmk_channels[0] * u_geom_hsphere_density_channel0Factor));
                // Parameterized dynamicShellWidth
                float dynamicShellWidth = max(0.005, u_shellWidth * (1.0 + pmk_channels[1] * u_geom_hsphere_shellWidth_channel1Factor));
                // Parameterized phase calculation (3D)
                float phase = radius3D * densityFactor * u_geom_hsphere_phase_tauFactor - u_time * u_rotationSpeed * u_geom_hsphere_phase_rotSpeedFactor + pmk_channels[2] * u_geom_hsphere_phase_channel2Factor;
                float shells3D = 0.5 + 0.5 * sin(phase);
                shells3D = smoothstep(1.0 - dynamicShellWidth, 1.0, shells3D);

                float finalLattice = shells3D;
                float dim_factor = smoothstep(3.0, 4.5, u_dimension);

                if (dim_factor > 0.01) {
                    // Parameterized w_coord calculation
                    float w_coord_cos_arg = radius3D * u_geom_hsphere_wCoord_radiusFactor - u_time * u_geom_hsphere_wCoord_timeFactorCos;
                    float w_coord_sin_arg = dot(p, u_geom_hsphere_wCoord_pCoeffs) + u_time * u_geom_hsphere_wCoord_timeFactorSin;
                    float w_coord_overall_factor = dim_factor * (u_geom_hsphere_wCoord_dimFactorOffset + u_morphFactor * u_geom_hsphere_wCoord_morphFactor + pmk_channels[1] * u_geom_hsphere_wCoord_channel1Factor);

                    float w_coord = cos(w_coord_cos_arg) * sin(w_coord_sin_arg) * w_coord_overall_factor;

                    vec4 p4d = vec4(p, w_coord);
                    // Parameterized 4D rotations base speed
                    float baseSpeed = u_rotationSpeed * u_geom_hsphere_baseSpeedFactor;
                    // Example parameterization for one rotation (time_rot1 for rotXW) - others would follow similar pattern
                    float time_rot1 = u_time * u_geom_hsphere_rotXW_timeFactor * baseSpeed + pmk_channels[2] * u_geom_hsphere_rotXW_channel2Factor;
                    float time_rot2 = u_time * 0.31 * baseSpeed + u_morphFactor * 0.6; // Kept simpler for brevity
                    float time_rot3 = u_time * -0.24 * baseSpeed + pmk_channels[0] * 0.25; // Kept simpler

                    p4d = rotXW(time_rot1 * u_geom_hsphere_rotXW_angleScale) * rotYZ(time_rot2) * rotYW(time_rot3 * 0.95) * p4d; // rotYW's 0.95 could be u_geom_hsphere_rotYW_angleScale

                    vec3 projectedP = project4Dto3D(p4d);
                    float radius4D_proj = length(projectedP);
                    // Use same parameterized phase factors for 4D
                    float phase4D = radius4D_proj * densityFactor * u_geom_hsphere_phase_tauFactor - u_time * u_rotationSpeed * u_geom_hsphere_phase_rotSpeedFactor + pmk_channels[2] * u_geom_hsphere_phase_channel2Factor;
                    float shells4D_proj = 0.5 + 0.5 * sin(phase4D);
                    shells4D_proj = smoothstep(1.0 - dynamicShellWidth, 1.0, shells4D_proj);
                    finalLattice = mix(shells3D, shells4D_proj, smoothstep(0.0, 1.0, u_morphFactor));
                }
                // Parameterized final power denominator
                return pow(max(0.0, finalLattice), max(u_geom_hsphere_finalLattice_minUniverseMod, u_universeModifier));
            }
        `;
    }
}

class HypertetrahedronGeometry extends BaseGeometry {
     getShaderCode() {
        return `
            // NEW Uniforms available: u_tetraThickness, u_colorShift
            // Uniforms used: u_dimension, u_time, u_morphFactor, u_gridDensity, u_tetraThickness
            // u_universeModifier, pmk_channels, u_rotationSpeed
            float calculateLattice(vec3 p) {
                // Parameterized density and thickness
                float density = max(0.1, u_gridDensity * u_geom_htetra_density_gridFactor * (1.0 + pmk_channels[0] * u_geom_htetra_density_channel0Factor));
                float dynamicThickness = max(0.003, u_tetraThickness * (1.0 - pmk_channels[1] * u_geom_htetra_thickness_channel1Factor));

                vec3 c1=normalize(vec3(1,1,1)), c2=normalize(vec3(-1,-1,1)), c3=normalize(vec3(-1,1,-1)), c4=normalize(vec3(1,-1,-1));
                // Parameterized p_mod3D time factor
                vec3 p_mod3D = fract(p * density * 0.5 + 0.5 + u_time * u_geom_htetra_pMod3D_timeFactor) - 0.5;
                float d1=dot(p_mod3D, c1), d2=dot(p_mod3D, c2), d3=dot(p_mod3D, c3), d4=dot(p_mod3D, c4);
                float minDistToPlane3D = min(min(abs(d1), abs(d2)), min(abs(d3), abs(d4)));
                float lattice3D = 1.0 - smoothstep(0.0, dynamicThickness, minDistToPlane3D);

                float finalLattice = lattice3D;
                float dim_factor = smoothstep(3.0, 4.5, u_dimension);

                if (dim_factor > 0.01) {
                    // Parameterized w_coord
                    float w_coord_cos_arg = dot(p, u_geom_htetra_wCoord_pCoeffsCos) + u_time * u_geom_htetra_wCoord_timeFactorCos;
                    float w_coord_sin_arg = length(p) * u_geom_htetra_wCoord_pLengthFactor + u_time * u_geom_htetra_wCoord_timeFactorSin - pmk_channels[1] * u_geom_htetra_wCoord_channel1Factor;
                    float w_coord_overall_factor = dim_factor * (u_geom_htetra_wCoord_dimFactorOffset + u_morphFactor * u_geom_htetra_wCoord_morphFactor + pmk_channels[2] * u_geom_htetra_wCoord_channel2Factor);
                    float w_coord = cos(w_coord_cos_arg) * sin(w_coord_sin_arg) * w_coord_overall_factor;

                    vec4 p4d = vec4(p, w_coord);
                    // Parameterized baseSpeed for rotations
                    float baseSpeed = u_rotationSpeed * u_geom_htetra_baseSpeedFactor;
                    // Example parameterization for one rotation (time_rot1 for rotXW)
                    float time_rot1 = u_time * u_geom_htetra_rotXW_timeFactor * baseSpeed + pmk_channels[2] * u_geom_htetra_rotXW_channel2Factor;
                    float time_rot2 = u_time * 0.36 * baseSpeed - pmk_channels[0] * 0.2 + u_morphFactor * 0.4; // Simplified
                    float time_rot3 = u_time * 0.32 * baseSpeed + pmk_channels[1] * 0.15; // Simplified

                    p4d = rotXW(time_rot1 * u_geom_htetra_rotXW_angleScale) * rotYW(time_rot2 * 1.05) * rotZW(time_rot3) * p4d; // Simplified scales

                    vec3 projectedP = project4Dto3D(p4d);

                    // Parameterized p_mod4D_proj time factor
                    vec3 p_mod4D_proj = fract(projectedP * density * 0.5 + 0.5 + u_time * u_geom_htetra_pMod4D_timeFactor) - 0.5;
                    float dp1=dot(p_mod4D_proj,c1), dp2=dot(p_mod4D_proj,c2), dp3=dot(p_mod4D_proj,c3), dp4=dot(p_mod4D_proj,c4);
                    float minDistToPlane4D = min(min(abs(dp1), abs(dp2)), min(abs(dp3), abs(dp4)));
                    float lattice4D_proj = 1.0 - smoothstep(0.0, dynamicThickness, minDistToPlane4D);
                    finalLattice = mix(lattice3D, lattice4D_proj, smoothstep(0.0, 1.0, u_morphFactor));
                }
                // Parameterized final power denominator
                return pow(max(0.0, finalLattice), max(u_geom_htetra_finalLattice_minUniverseMod, u_universeModifier));
             }
         `;
    }
}

class DuocylinderGeometry extends BaseGeometry {
    getShaderCode() {
        return `
            // Uniforms used: u_dimension, u_time, u_morphFactor, u_shellWidth, pmk_channels, u_rotationSpeed, u_universeModifier
            float calculateLattice(vec3 p) {
                // Parameterized r1, r2, dynamicShellWidth
                float r1_base = u_geom_duocyl_r1_base; // e.g., 0.6
                float r1 = r1_base + u_morphFactor * u_geom_duocyl_r1_morphFactor;
                float r2_base = u_geom_duocyl_r2_base; // e.g., 0.3
                float r2 = r2_base + pmk_channels[0] * u_geom_duocyl_r2_channel0Factor;
                float dynamicShellWidth = max(0.005, u_shellWidth * (1.0 - pmk_channels[1] * u_geom_duocyl_shellWidth_channel1Factor));

                // Parameterized Base 3D shape (fallback)
                float lattice3D = 0.5 + 0.5 * sin(length(p) * (u_geom_duocyl_fallback_pLengthFactor + pmk_channels[2] * u_geom_duocyl_fallback_channel2Factor) - u_time * u_rotationSpeed);
                lattice3D = smoothstep(1.0 - dynamicShellWidth, 1.0, lattice3D);

                float finalLattice = lattice3D;
                float dim_factor = smoothstep(3.5, 4.5, u_dimension); // This range could also be parameterized

                if (dim_factor > 0.01) {
                    // Parameterized w_coord
                    float w_coord_cos_arg = length(p.xy) * u_geom_duocyl_wCoord_len_pXY_Factor - u_time * u_geom_duocyl_wCoord_timeFactorCos * u_rotationSpeed;
                    float w_coord_sin_arg = p.z * u_geom_duocyl_wCoord_pzFactor + p.x * u_geom_duocyl_wCoord_pxFactor + u_time * u_geom_duocyl_wCoord_timeFactorSin * u_rotationSpeed;
                    float w_coord_overall_factor = dim_factor * (u_geom_duocyl_wCoord_dimFactorOffset + u_morphFactor * u_geom_duocyl_wCoord_morphFactor + pmk_channels[2] * u_geom_duocyl_wCoord_channel2Factor);
                    float w_coord = cos(w_coord_cos_arg) * sin(w_coord_sin_arg) * w_coord_overall_factor;

                    vec4 p4d = vec4(p, w_coord);

                    // Parameterized 4D rotations base speed
                    float baseSpeed = u_rotationSpeed * u_geom_duocyl_baseSpeedFactor;
                    // Example parameterization for one rotation (time_rot1 for rotXW)
                    float time_rot1 = u_time * u_geom_duocyl_rotXW_timeFactor * baseSpeed + pmk_channels[0] * u_geom_duocyl_rotXW_channel0Factor;
                    float time_rot2 = u_time * 0.25 * baseSpeed + pmk_channels[1] * 0.35; // Simplified
                    float time_rot3 = u_time * -0.20 * baseSpeed + pmk_channels[2] * 0.4;  // Simplified

                    p4d = rotXW(time_rot1 * u_geom_duocyl_rotXW_angleScale) * rotYZ(time_rot2) * rotZW(time_rot3) * p4d; // Simplified
                    p4d = rotYW(u_time * 0.15 * baseSpeed + u_morphFactor * 0.25) * p4d; // Simplified

                    float len_xy = length(p4d.xy);
                    float len_zw = length(p4d.zw);
                    float dist_to_shell_core = length(vec2(len_xy - r1, len_zw - r2));
                    float lattice4D = 1.0 - smoothstep(0.0, dynamicShellWidth, dist_to_shell_core);
                    finalLattice = mix(lattice3D, lattice4D, dim_factor);
                }
                // Parameterized final power denominator
                return pow(max(0.0, finalLattice), max(u_geom_duocyl_finalLattice_minUniverseMod, u_universeModifier));
            }
        `;
    }
}

class GeometryManager {
    constructor(options = {}) {
        this.options = { defaultGeometry: 'hypercube', ...options };
        this.geometries = {};
        this._initGeometries();
    }
    _initGeometries() {
        this.registerGeometry('hypercube', new HypercubeGeometry());
        this.registerGeometry('hypersphere', new HypersphereGeometry());
        this.registerGeometry('hypertetrahedron', new HypertetrahedronGeometry());
        this.registerGeometry('duocylinder', new DuocylinderGeometry());
        this.registerGeometry('fullscreenlattice', new FullScreenLatticeGeometry()); // Register new geometry
    }
    registerGeometry(name, instance) {
        const lowerCaseName = name.toLowerCase();
        if (!(instance instanceof BaseGeometry)) { // BaseGeometry is defined in this file
            console.error(`Invalid geometry object for '${lowerCaseName}'. Not an instance of BaseGeometry.`);
            return;
        }
        if (this.geometries[lowerCaseName]) {
            // console.warn(`Overwriting geometry '${lowerCaseName}'.`);
        }
        this.geometries[lowerCaseName] = instance;
    }
    getGeometry(name) {
        const lowerCaseName = name ? name.toLowerCase() : this.options.defaultGeometry;
        const geometry = this.geometries[lowerCaseName];
        if (!geometry) {
            console.warn(`Geometry '${name}' not found. Using default ('${this.options.defaultGeometry}').`);
            return this.geometries[this.options.defaultGeometry.toLowerCase()];
        }
        return geometry;
    }
    getGeometryTypes() { return Object.keys(this.geometries); }
}

// Import FullScreenLatticeGeometry AFTER BaseGeometry is defined and before GeometryManager might use it.
// However, since _initGeometries calls registerGeometry which uses BaseGeometry,
// it's better to import at the top.
import FullScreenLatticeGeometry from './FullScreenLatticeGeometry.js';

export { GeometryManager, BaseGeometry, HypercubeGeometry, HypersphereGeometry, HypertetrahedronGeometry, DuocylinderGeometry, FullScreenLatticeGeometry };
export default GeometryManager;
