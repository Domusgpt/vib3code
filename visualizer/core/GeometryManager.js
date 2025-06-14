/* core/GeometryManager.js - v1.4 */
class BaseGeometry { constructor() {} getShaderCode() { throw new Error(`getShaderCode() must be implemented.`); } }

class HypercubeGeometry extends BaseGeometry {
    getShaderCode() {
        return `
            // NEW Uniforms available: u_lineThickness, u_colorShift
            // Uniforms used: u_dimension, u_time, u_morphFactor, u_gridDensity, u_lineThickness
            // u_universeModifier, u_audioBass, u_audioMid, u_audioHigh, u_rotationSpeed
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

                    vec3 projectedP = project4Dto3D(p4d); // Uses projection function
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

class HypersphereGeometry extends BaseGeometry {
    getShaderCode() {
        return `
            // NEW Uniforms available: u_shellWidth, u_colorShift
            // Uniforms used: u_dimension, u_time, u_morphFactor, u_gridDensity, u_shellWidth
            // u_universeModifier, u_audioBass, u_audioMid, u_audioHigh, u_rotationSpeed
             float calculateLattice(vec3 p) {
                 float radius3D = length(p);
                 float densityFactor = max(0.1, u_gridDensity * 0.7 * (1.0 + u_audioBass * 0.5));
                 float dynamicShellWidth = max(0.005, u_shellWidth * (1.0 + u_audioMid * 1.5)); // Use u_shellWidth
                 float phase = radius3D * densityFactor * 6.28318 - u_time * u_rotationSpeed * 0.8 + u_audioHigh * 3.0;
                 float shells3D = 0.5 + 0.5 * sin(phase);
                 shells3D = smoothstep(1.0 - dynamicShellWidth, 1.0, shells3D);

                float finalLattice = shells3D;
                float dim_factor = smoothstep(3.0, 4.5, u_dimension);

                if (dim_factor > 0.01) {
                     float w_coord = cos(radius3D * 2.5 - u_time * 0.55)
                                   * sin(p.x*1.0 + p.y*1.3 - p.z*0.7 + u_time*0.2)
                                   * dim_factor * (0.5 + u_morphFactor * 0.5 + u_audioMid * 0.5);

                    vec4 p4d = vec4(p, w_coord);
                     float baseSpeed = u_rotationSpeed * 0.85;
                     float time_rot1 = u_time * 0.38 * baseSpeed + u_audioHigh * 0.2;
                     float time_rot2 = u_time * 0.31 * baseSpeed + u_morphFactor * 0.6;
                     float time_rot3 = u_time * -0.24 * baseSpeed + u_audioBass * 0.25;
                     p4d = rotXW(time_rot1 * 1.05) * rotYZ(time_rot2) * rotYW(time_rot3 * 0.95) * p4d;

                     vec3 projectedP = project4Dto3D(p4d); // Uses projection function
                     float radius4D_proj = length(projectedP);
                     float phase4D = radius4D_proj * densityFactor * 6.28318 - u_time * u_rotationSpeed * 0.8 + u_audioHigh * 3.0;
                     float shells4D_proj = 0.5 + 0.5 * sin(phase4D);
                     shells4D_proj = smoothstep(1.0 - dynamicShellWidth, 1.0, shells4D_proj);
                     finalLattice = mix(shells3D, shells4D_proj, smoothstep(0.0, 1.0, u_morphFactor));
                 }
                return pow(max(0.0, finalLattice), max(0.1, u_universeModifier));
            }
        `;
    }
}

class HypertetrahedronGeometry extends BaseGeometry {
     getShaderCode() {
        return `
            // NEW Uniforms available: u_tetraThickness, u_colorShift
            // Uniforms used: u_dimension, u_time, u_morphFactor, u_gridDensity, u_tetraThickness
            // u_universeModifier, u_audioBass, u_audioMid, u_audioHigh, u_rotationSpeed
             float calculateLattice(vec3 p) {
                 float density = max(0.1, u_gridDensity * 0.65 * (1.0 + u_audioBass * 0.4));
                 float dynamicThickness = max(0.003, u_tetraThickness * (1.0 - u_audioMid * 0.7)); // Use u_tetraThickness

                 vec3 c1=normalize(vec3(1,1,1)), c2=normalize(vec3(-1,-1,1)), c3=normalize(vec3(-1,1,-1)), c4=normalize(vec3(1,-1,-1));
                 vec3 p_mod3D = fract(p * density * 0.5 + 0.5 + u_time * 0.005) - 0.5;
                 float d1=dot(p_mod3D, c1), d2=dot(p_mod3D, c2), d3=dot(p_mod3D, c3), d4=dot(p_mod3D, c4);
                 float minDistToPlane3D = min(min(abs(d1), abs(d2)), min(abs(d3), abs(d4)));
                 float lattice3D = 1.0 - smoothstep(0.0, dynamicThickness, minDistToPlane3D);

                 float finalLattice = lattice3D;
                 float dim_factor = smoothstep(3.0, 4.5, u_dimension);

                 if (dim_factor > 0.01) {
                     float w_coord = cos(p.x*1.8 - p.y*1.5 + p.z*1.2 + u_time*0.24) * sin(length(p)*1.4 + u_time*0.18 - u_audioMid*2.0) * dim_factor * (0.45 + u_morphFactor*0.55 + u_audioHigh*0.4);
                     vec4 p4d = vec4(p, w_coord);
                     float baseSpeed = u_rotationSpeed * 1.15;
                     float time_rot1 = u_time*0.28*baseSpeed + u_audioHigh*0.25; float time_rot2 = u_time*0.36*baseSpeed - u_audioBass*0.2 + u_morphFactor*0.4; float time_rot3 = u_time*0.32*baseSpeed + u_audioMid*0.15;
                     p4d = rotXW(time_rot1*0.95) * rotYW(time_rot2*1.05) * rotZW(time_rot3) * p4d;
                     vec3 projectedP = project4Dto3D(p4d); // Uses projection function

                     vec3 p_mod4D_proj = fract(projectedP * density * 0.5 + 0.5 + u_time * 0.008) - 0.5;
                     float dp1=dot(p_mod4D_proj,c1), dp2=dot(p_mod4D_proj,c2), dp3=dot(p_mod4D_proj,c3), dp4=dot(p_mod4D_proj,c4);
                     float minDistToPlane4D = min(min(abs(dp1), abs(dp2)), min(abs(dp3), abs(dp4)));
                     float lattice4D_proj = 1.0 - smoothstep(0.0, dynamicThickness, minDistToPlane4D);
                    finalLattice = mix(lattice3D, lattice4D_proj, smoothstep(0.0, 1.0, u_morphFactor));
                 }
                 return pow(max(0.0, finalLattice), max(0.1, u_universeModifier));
             }
         `;
    }
}

class GeometryManager {
    constructor(options = {}) { this.options = { defaultGeometry: 'hypercube', ...options }; this.geometries = {}; this._initGeometries(); }
    _initGeometries() { this.registerGeometry('hypercube', new HypercubeGeometry()); this.registerGeometry('hypersphere', new HypersphereGeometry()); this.registerGeometry('hypertetrahedron', new HypertetrahedronGeometry()); }
    registerGeometry(name, instance) { const lowerCaseName = name.toLowerCase(); if (!(instance instanceof BaseGeometry)) { console.error(`Invalid geometry object for '${lowerCaseName}'.`); return; } if (this.geometries[lowerCaseName]) { /* console.warn(`Overwriting geometry '${lowerCaseName}'.`); */ } this.geometries[lowerCaseName] = instance; }
    getGeometry(name) { const lowerCaseName = name ? name.toLowerCase() : this.options.defaultGeometry; const geometry = this.geometries[lowerCaseName]; if (!geometry) { console.warn(`Geometry '${name}' not found. Using default.`); return this.geometries[this.options.defaultGeometry.toLowerCase()]; } return geometry; }
    getGeometryTypes() { return Object.keys(this.geometries); }
}

export { GeometryManager, BaseGeometry, HypercubeGeometry, HypersphereGeometry, HypertetrahedronGeometry };
export default GeometryManager;
