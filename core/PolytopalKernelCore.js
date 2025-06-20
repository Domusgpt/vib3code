/**
 * POLYTOPAL KERNEL CORE v2.0
 * 
 * Comprehensive kernelized architecture for polytopal projection-based visualizer system.
 * Integrates HypercubeCore, GeometryManager, ProjectionManager, and ShaderManager
 * with advanced home-master reactive parameter derivation.
 * 
 * ARCHITECTURE:
 * - Kernel: Core orchestration and state management
 * - Geometry Modules: Pluggable 4D geometry generators (hypercube, torus, wave, etc.)
 * - Projection Modules: 4D→3D projection methods (perspective, stereographic, kaleidoscope, etc.)
 * - Shader Kernel: Dynamic GLSL compilation and uniform management
 * - Parameter Kernel: Home-master mathematical relationship system
 */

import HypercubeCore from './HypercubeCore.js';
import GeometryManager from './GeometryManager.js';
import ProjectionManager from './ProjectionManager.js';
import ShaderManager from './ShaderManager.js';

class PolytopalKernelCore {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = null;
        this.isInitialized = false;
        this.isRunning = false;
        
        // Core kernel modules
        this.geometryManager = null;
        this.projectionManager = null;
        this.shaderManager = null;
        this.hypercubeCore = null;
        
        // Home-master integration
        this.homeMasterSystem = options.homeMasterSystem || null;
        this.currentSection = options.currentSection || 'home';
        
        // Configuration state
        this.kernelConfig = {
            geometryType: 'hypercube',
            projectionMethod: 'perspective',
            enableAudioReactivity: true,
            enableParameterDerivation: true,
            debugMode: false,
            ...options
        };
        
        // Performance monitoring
        this.performanceMetrics = {
            frameRate: 0,
            frameCount: 0,
            lastFrameTime: 0,
            renderTime: 0,
            shaderCompileTime: 0
        };
        
        // Event callbacks
        this.callbacks = {
            onInitialized: null,
            onGeometryChanged: null,
            onProjectionChanged: null,
            onParametersUpdated: null,
            onError: null,
            ...options.callbacks
        };
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing PolytopalKernelCore v2.0...');
        
        try {
            // Initialize WebGL context
            this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            if (!this.gl) {
                throw new Error('WebGL not supported');
            }
            
            // Initialize kernel modules
            await this.initializeKernelModules();
            
            // Initialize hypercube core with enhanced configuration
            await this.initializeHypercubeCore();
            
            // Setup home-master integration
            this.setupHomeMasterIntegration();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            this.isInitialized = true;
            console.log('✅ PolytopalKernelCore initialized successfully');
            
            this.callbacks.onInitialized?.(this);
            
        } catch (error) {
            console.error('❌ PolytopalKernelCore initialization failed:', error);
            this.callbacks.onError?.(error);
            throw error;
        }
    }
    
    async initializeKernelModules() {
        console.log('🔧 Initializing kernel modules...');
        
        // Initialize geometry manager with all polytopal geometries
        this.geometryManager = new GeometryManager({
            defaultGeometry: this.kernelConfig.geometryType
        });
        
        // Initialize projection manager with advanced projection methods
        this.projectionManager = new ProjectionManager({
            defaultProjection: this.kernelConfig.projectionMethod
        });
        
        // Initialize shader manager with dynamic compilation
        this.shaderManager = new ShaderManager(
            this.gl, 
            this.geometryManager, 
            this.projectionManager,
            {
                baseVertexShaderName: 'polytopal-vertex',
                baseFragmentShaderName: 'polytopal-fragment'
            }
        );
        
        console.log('✅ Kernel modules initialized');
    }
    
    async initializeHypercubeCore() {
        console.log('🎯 Initializing HypercubeCore with polytopal configuration...');
        
        // Get initial parameters from home-master system if available
        const initialParams = this.getHomeMasterParameters();
        
        const coreOptions = {
            geometryType: this.kernelConfig.geometryType,
            projectionMethod: this.kernelConfig.projectionMethod,
            shaderProgramName: 'polytopal-main',
            ...initialParams,
            callbacks: {
                onRender: (state) => this.onCoreRender(state),
                onError: (error) => this.onCoreError(error)
            }
        };
        
        this.hypercubeCore = new HypercubeCore(
            this.canvas,
            this.shaderManager,
            coreOptions
        );
        
        console.log('✅ HypercubeCore initialized with polytopal configuration');
    }
    
    setupHomeMasterIntegration() {
        if (!this.homeMasterSystem) {
            console.log('ℹ️ No home-master system provided, using standalone mode');
            return;
        }
        
        console.log('🏠 Setting up home-master integration...');
        
        // Listen for home-master parameter changes
        this.homeMasterSystem.onChange((allConfigs) => {
            this.onHomeMasterConfigChange(allConfigs);
        });
        
        // Apply initial configuration
        const sectionConfig = this.homeMasterSystem.getSectionConfig(this.currentSection);
        if (sectionConfig) {
            this.applyHomeMasterConfig(sectionConfig);
        }
        
        console.log('✅ Home-master integration active');
    }
    
    setupPerformanceMonitoring() {
        console.log('📊 Setting up performance monitoring...');
        
        setInterval(() => {
            this.calculatePerformanceMetrics();
        }, 1000);
        
        console.log('✅ Performance monitoring active');
    }
    
    // Home-Master Integration Methods
    
    getHomeMasterParameters() {
        if (!this.homeMasterSystem) return {};
        
        const config = this.homeMasterSystem.getSectionConfig(this.currentSection);
        if (!config) return {};
        
        return this.convertHomeMasterToCore(config);
    }
    
    convertHomeMasterToCore(homeMasterConfig) {
        // Convert home-master parameters to HypercubeCore parameters
        return {
            dimensions: homeMasterConfig.dimension || 3.5,
            morphFactor: homeMasterConfig.morphFactor || 0.5,
            rotationSpeed: homeMasterConfig.rotationSpeed || 0.2,
            universeModifier: homeMasterConfig.universeModifier || 1.0,
            patternIntensity: homeMasterConfig.patternIntensity || 1.0,
            gridDensity: homeMasterConfig.gridDensity || 8.0,
            lineThickness: homeMasterConfig.lineThickness || 0.03,
            shellWidth: homeMasterConfig.shellWidth || 0.025,
            tetraThickness: homeMasterConfig.tetraThickness || 0.035,
            glitchIntensity: homeMasterConfig.glitchIntensity || 0.0,
            colorShift: homeMasterConfig.colorShift || 0.0,
            colorScheme: {
                primary: this.hsvToRgb(homeMasterConfig.hue || 0.5, homeMasterConfig.saturation || 0.8, homeMasterConfig.brightness || 0.9),
                secondary: this.hsvToRgb((homeMasterConfig.hue + 0.33) % 1.0, homeMasterConfig.saturation || 0.8, (homeMasterConfig.brightness || 0.9) * 0.7),
                background: [0.05, 0.0, 0.2]
            }
        };
    }
    
    onHomeMasterConfigChange(allConfigs) {
        const sectionConfig = allConfigs[this.currentSection];
        if (sectionConfig && this.isInitialized) {
            this.applyHomeMasterConfig(sectionConfig);
            this.callbacks.onParametersUpdated?.(sectionConfig);
        }
    }
    
    applyHomeMasterConfig(config) {
        if (!this.hypercubeCore) return;
        
        // Convert and apply parameters
        const coreParams = this.convertHomeMasterToCore(config);
        this.hypercubeCore.updateParameters(coreParams);
        
        // Update geometry if changed
        if (config.geometry !== this.kernelConfig.geometryType) {
            this.switchGeometry(config.geometry);
        }
        
        console.log(`🎨 Applied home-master config for ${this.currentSection}:`, config.geometry);
    }
    
    // Polytopal Geometry and Projection Methods
    
    switchGeometry(geometryType) {
        if (!this.isInitialized) {
            console.warn('Cannot switch geometry before initialization');
            return false;
        }
        
        console.log(`🔄 Switching to geometry: ${geometryType}`);
        
        const oldGeometry = this.kernelConfig.geometryType;
        this.kernelConfig.geometryType = geometryType;
        
        this.hypercubeCore.updateParameters({ 
            geometryType: geometryType,
            needsShaderUpdate: true 
        });
        
        this.callbacks.onGeometryChanged?.(geometryType, oldGeometry);
        return true;
    }
    
    switchProjection(projectionMethod) {
        if (!this.isInitialized) {
            console.warn('Cannot switch projection before initialization');
            return false;
        }
        
        console.log(`🔄 Switching to projection: ${projectionMethod}`);
        
        const oldProjection = this.kernelConfig.projectionMethod;
        this.kernelConfig.projectionMethod = projectionMethod;
        
        this.hypercubeCore.updateParameters({ 
            projectionMethod: projectionMethod,
            needsShaderUpdate: true 
        });
        
        this.callbacks.onProjectionChanged?.(projectionMethod, oldProjection);
        return true;
    }
    
    switchSection(sectionId) {
        console.log(`🏠 PolytopalKernel switching to section: ${sectionId}`);
        
        this.currentSection = sectionId;
        
        if (this.homeMasterSystem) {
            const sectionConfig = this.homeMasterSystem.getSectionConfig(sectionId);
            if (sectionConfig) {
                this.applyHomeMasterConfig(sectionConfig);
            }
        }
    }
    
    // Advanced Parameter Control
    
    updateParameters(params) {
        if (!this.isInitialized) return false;
        
        this.hypercubeCore.updateParameters(params);
        return true;
    }
    
    setAudioLevels(bass, mid, high) {
        if (!this.kernelConfig.enableAudioReactivity) return;
        
        this.updateParameters({
            audioLevels: { bass, mid, high }
        });
    }
    
    // Utility Methods
    
    hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = v - c;
        
        let r, g, b;
        
        if (h < 1/6) { r = c; g = x; b = 0; }
        else if (h < 2/6) { r = x; g = c; b = 0; }
        else if (h < 3/6) { r = 0; g = c; b = x; }
        else if (h < 4/6) { r = 0; g = x; b = c; }
        else if (h < 5/6) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        
        return [r + m, g + m, b + m];
    }
    
    // Performance Monitoring
    
    calculatePerformanceMetrics() {
        const now = performance.now();
        const deltaTime = now - this.performanceMetrics.lastFrameTime;
        
        if (deltaTime > 0) {
            this.performanceMetrics.frameRate = 1000 / deltaTime;
        }
        
        this.performanceMetrics.lastFrameTime = now;
        
        if (this.kernelConfig.debugMode) {
            console.log(`📊 PolytopalKernel FPS: ${this.performanceMetrics.frameRate.toFixed(1)}`);
        }
    }
    
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    
    // Core Event Handlers
    
    onCoreRender(state) {
        this.performanceMetrics.frameCount++;
        this.performanceMetrics.renderTime = state.deltaTime;
    }
    
    onCoreError(error) {
        console.error('❌ PolytopalKernel core error:', error);
        this.callbacks.onError?.(error);
    }
    
    // Lifecycle Methods
    
    start() {
        if (!this.isInitialized) {
            console.warn('Cannot start before initialization');
            return false;
        }
        
        console.log('▶️ Starting PolytopalKernel render loop');
        this.hypercubeCore.start();
        this.isRunning = true;
        return true;
    }
    
    stop() {
        if (!this.isRunning) return;
        
        console.log('⏸️ Stopping PolytopalKernel render loop');
        this.hypercubeCore.stop();
        this.isRunning = false;
    }
    
    dispose() {
        console.log('🗑️ Disposing PolytopalKernelCore...');
        
        this.stop();
        
        if (this.hypercubeCore) {
            this.hypercubeCore.dispose();
            this.hypercubeCore = null;
        }
        
        if (this.shaderManager) {
            this.shaderManager.dispose();
            this.shaderManager = null;
        }
        
        this.geometryManager = null;
        this.projectionManager = null;
        this.gl = null;
        this.canvas = null;
        
        console.log('✅ PolytopalKernelCore disposed');
    }
    
    // Debug and Introspection
    
    getSystemState() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            currentSection: this.currentSection,
            geometryType: this.kernelConfig.geometryType,
            projectionMethod: this.kernelConfig.projectionMethod,
            performanceMetrics: this.getPerformanceMetrics(),
            availableGeometries: this.geometryManager?.getGeometryTypes() || [],
            availableProjections: this.projectionManager?.getProjectionTypes() || []
        };
    }
    
    enableDebugMode() {
        this.kernelConfig.debugMode = true;
        console.log('🐛 PolytopalKernel debug mode enabled');
    }
    
    disableDebugMode() {
        this.kernelConfig.debugMode = false;
        console.log('🔧 PolytopalKernel debug mode disabled');
    }
}

export default PolytopalKernelCore;