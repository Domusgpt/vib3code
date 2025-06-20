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

class HypersliceProjection extends BaseProjection {
    constructor(slicePosition = 0.0) { super(); this.baseSlicePosition = slicePosition; }
    getShaderCode() { return `vec3 project4Dto3D(vec4 p) { float dynamicSlice = ${this.baseSlicePosition.toFixed(2)} + u_morphFactor * 2.0 - 1.0 + u_audioMid * 0.6; float tolerance = 0.1 + u_audioHigh * 0.2; float sliceWeight = 1.0 - smoothstep(0.0, tolerance, abs(p.w - dynamicSlice)); vec3 slicedP = p.xyz * (0.8 + sliceWeight * 0.4); float baseDistance = 2.5; float dynamicDistance = max(0.2, baseDistance * (1.0 + u_morphFactor * 0.4)); float w_factor = dynamicDistance / max(0.1, dynamicDistance + abs(p.w - dynamicSlice)); return mix(p.xyz, slicedP * w_factor, sliceWeight); }`; }
}

class IsometricProjection extends BaseProjection {
    getShaderCode() { return `vec3 project4Dto3D(vec4 p) { float sqrt2 = 1.414213562; float sqrt3 = 1.732050808; float sqrt6 = 2.449489743; mat3 isoMatrix = mat3( 1.0/sqrt2, -1.0/sqrt2, 0.0, 1.0/sqrt6, 1.0/sqrt6, -2.0/sqrt6, 1.0/sqrt3, 1.0/sqrt3, 1.0/sqrt3 ); vec3 isoP = isoMatrix * p.xyz; float wInfluence = p.w * (0.3 + u_morphFactor * 0.4 + u_audioMid * 0.3); isoP += vec3(wInfluence * 0.1, wInfluence * 0.15, wInfluence * 0.05); float perspectiveFactor = 1.0 + p.w * 0.1 * (1.0 + u_audioHigh * 0.5); return isoP * perspectiveFactor; }`; }
}

class KaleidoscopeProjection extends BaseProjection {
    constructor(segments = 6) { super(); this.segments = Math.max(3, Math.floor(segments)); }
    getShaderCode() { return `vec3 project4Dto3D(vec4 p) { float segments = ${this.segments.toFixed(1)} + floor(u_morphFactor * 4.0); float angle = atan(p.y, p.x); float segmentAngle = 6.28318530718 / segments; float foldedAngle = mod(angle, segmentAngle); if (mod(floor(angle / segmentAngle), 2.0) == 1.0) { foldedAngle = segmentAngle - foldedAngle; } float radius = length(p.xy); vec2 foldedXY = vec2(cos(foldedAngle), sin(foldedAngle)) * radius; float wRotation = p.w * (0.5 + u_audioMid * 0.8) + u_time * 0.3; float cosW = cos(wRotation); float sinW = sin(wRotation); vec3 rotatedP = vec3( foldedXY.x * cosW - p.z * sinW, foldedXY.y, foldedXY.x * sinW + p.z * cosW ); float kaleidoscopeScale = 1.0 + sin(radius * 8.0 + u_time * 2.0) * 0.1 * u_audioHigh; return rotatedP * kaleidoscopeScale; }`; }
}
class ProjectionManager {
    constructor(options = {}) { this.options = { defaultProjection: 'perspective', ...options }; this.projections = {}; this._initProjections(); }
    _initProjections() { 
        this.registerProjection('perspective', new PerspectiveProjection()); 
        this.registerProjection('orthographic', new OrthographicProjection()); 
        this.registerProjection('stereographic', new StereographicProjection()); 
        this.registerProjection('hyperslice', new HypersliceProjection());
        this.registerProjection('isometric', new IsometricProjection());
        this.registerProjection('kaleidoscope', new KaleidoscopeProjection());
    }
    registerProjection(name, instance) { const lowerCaseName = name.toLowerCase(); if (!(instance instanceof BaseProjection)) { console.error(`Invalid projection object for '${lowerCaseName}'.`); return; } if (this.projections[lowerCaseName]) { /* console.warn(`Overwriting projection '${lowerCaseName}'.`); */ } this.projections[lowerCaseName] = instance; }
    getProjection(name) { const lowerCaseName = name ? name.toLowerCase() : this.options.defaultProjection; const projection = this.projections[lowerCaseName]; if (!projection) { console.warn(`Projection '${name}' not found. Using default.`); return this.projections[this.options.defaultProjection.toLowerCase()]; } return projection; }
    getProjectionTypes() { return Object.keys(this.projections); }
}
export { ProjectionManager, BaseProjection, PerspectiveProjection, OrthographicProjection, StereographicProjection, HypersliceProjection, IsometricProjection, KaleidoscopeProjection };
export default ProjectionManager;
