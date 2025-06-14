/* core/ProjectionManager.js - v1.3 L */
class BaseProjection { constructor() {} getShaderCode() { throw new Error(`getShaderCode() must be implemented.`); } }
class PerspectiveProjection extends BaseProjection {
    constructor(viewDistance = 2.5) { super(); this.viewDistance = Math.max(0.1, viewDistance); }
    getShaderCode() { return `vec3 project4Dto3D(vec4 p) { float baseDistance = ${this.viewDistance.toFixed(2)}; float dynamicDistance = max(0.2, baseDistance * (1.0 + u_morphFactor * 0.4 - u_audioMid * 0.35)); float denominator = dynamicDistance + p.w; float w_factor = dynamicDistance / max(0.1, denominator); return p.xyz * w_factor; }`; }
}
class OrthographicProjection extends BaseProjection {
    getShaderCode() { return `vec3 project4Dto3D(vec4 p) { vec3 orthoP = p.xyz; float basePerspectiveDistance = 2.5; float dynamicPerspectiveDistance = max(0.2, basePerspectiveDistance * (1.0 - u_audioMid * 0.4)); float perspDenominator = dynamicPerspectiveDistance + p.w; float persp_w_factor = dynamicPerspectiveDistance / max(0.1, perspDenominator); vec3 perspP = p.xyz * persp_w_factor; float morphT = smoothstep(0.0, 1.0, u_morphFactor); return mix(orthoP, perspP, morphT); }`; }
}
class StereographicProjection extends BaseProjection {
    constructor(projectionPoleW = -1.5) { super(); this.baseProjectionPoleW = Math.abs(projectionPoleW) < 0.01 ? -1.0 : projectionPoleW; }
    getShaderCode() { return `vec3 project4Dto3D(vec4 p) { float basePoleW = ${this.baseProjectionPoleW.toFixed(2)}; float dynamicPoleW = sign(basePoleW) * max(0.1, abs(basePoleW + u_audioHigh * 0.4 * sign(basePoleW))); float denominator = p.w - dynamicPoleW; vec3 projectedP; float epsilon = 0.001; if (abs(denominator) < epsilon) { projectedP = normalize(p.xyz + vec3(epsilon)) * 1000.0; } else { float scale = (-dynamicPoleW) / denominator; projectedP = p.xyz * scale; } float morphT = smoothstep(0.0, 1.0, u_morphFactor * 0.8); vec3 orthoP = p.xyz; return mix(projectedP, orthoP, morphT); }`; }
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
