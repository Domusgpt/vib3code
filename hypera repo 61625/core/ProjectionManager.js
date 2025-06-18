/* core/ProjectionManager.js - v1.3 L */
class BaseProjection { constructor() {} getShaderCode() { throw new Error(`getShaderCode() must be implemented.`); } }
class PerspectiveProjection extends BaseProjection {
    constructor() { super(); } // viewDistance removed
    getShaderCode() {
        return `vec3 project4Dto3D(vec4 p) {
            float dynamicDistance = max(0.2, u_proj_perspective_baseDistance * (1.0 + u_morphFactor * u_proj_perspective_morphFactorImpact - pmk_channels[1] * u_proj_perspective_channelImpact));
            float denominator = dynamicDistance + p.w;
            float w_factor = dynamicDistance / max(u_proj_perspective_denomMin, denominator);
            return p.xyz * w_factor;
        }`;
    }
}
class OrthographicProjection extends BaseProjection {
    getShaderCode() { // Assuming u_audioMid maps to pmk_channels[1] for consistency
        return `vec3 project4Dto3D(vec4 p) {
            vec3 orthoP = p.xyz;
            float basePerspectiveDistance = 2.5; /* TODO: Parameterize if needed */
            float dynamicPerspectiveDistance = max(0.2, basePerspectiveDistance * (1.0 - pmk_channels[1] * 0.4));
            float perspDenominator = dynamicPerspectiveDistance + p.w;
            float persp_w_factor = dynamicPerspectiveDistance / max(0.1, perspDenominator);
            vec3 perspP = p.xyz * persp_w_factor;
            float morphT = smoothstep(0.0, 1.0, u_morphFactor);
            return mix(orthoP, perspP, morphT);
        }`;
    }
}
class StereographicProjection extends BaseProjection {
    constructor() { super(); } // baseProjectionPoleW removed
    getShaderCode() { // Assuming u_audioHigh maps to pmk_channels[2]
        return `vec3 project4Dto3D(vec4 p) {
            float dynamicPoleW = sign(u_proj_stereo_basePoleW) * max(0.1, abs(u_proj_stereo_basePoleW + pmk_channels[2] * u_proj_stereo_channelImpact * sign(u_proj_stereo_basePoleW)));
            float denominator = p.w - dynamicPoleW;
            vec3 projectedP;
            if (abs(denominator) < u_proj_stereo_epsilon) {
                projectedP = normalize(p.xyz + vec3(u_proj_stereo_epsilon)) * u_proj_stereo_singularityScale;
            } else {
                float scale = (-dynamicPoleW) / denominator;
                projectedP = p.xyz * scale;
            }
            float morphT = smoothstep(0.0, 1.0, u_morphFactor * u_proj_stereo_morphFactorImpact);
            vec3 orthoP = p.xyz;
            return mix(projectedP, orthoP, morphT);
        }`;
    }
}
class ProjectionManager {
    constructor(options = {}) { this.options = { defaultProjection: 'perspective', ...options }; this.projections = {}; this._initProjections(); }
    _initProjections() { this.registerProjection('perspective', new PerspectiveProjection()); this.registerProjection('orthographic', new OrthographicProjection()); this.registerProjection('stereographic', new StereographicProjection()); }
    registerProjection(name, instance) { const lowerCaseName = name.toLowerCase(); if (!(instance instanceof BaseProjection)) { console.error(`Invalid projection object for '${lowerCaseName}'.`); return; } if (this.projections[lowerCaseName]) { /* console.warn(`Overwriting projection '${lowerCaseName}'.`); */ } this.projections[lowerCaseName] = instance; }
    getProjection(name) { const lowerCaseName = name ? name.toLowerCase() : this.options.defaultProjection; const projection = this.projections[lowerCaseName]; if (!projection) { console.warn(`Projection '${name}' not found. Using default.`); return this.projections[this.options.defaultProjection.toLowerCase()]; } return projection; }
    getProjectionTypes() { return Object.keys(this.projections); }
}
export { ProjectionManager, BaseProjection, PerspectiveProjection, OrthographicProjection, StereographicProjection };
export default ProjectionManager;
