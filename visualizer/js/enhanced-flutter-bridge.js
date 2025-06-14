/**
 * Enhanced Flutter Bridge Integration for HyperAV Visualizer with Morph-UI
 * This file provides advanced communication bridge with dynamic parameter binding support
 * Version: 2.0 - Enhanced for Parameter Binding Engine
 */

// Global state for the enhanced bridge
window.morphUIBridge = {
    isReady: false,
    parameterMappings: new Map(),
    performanceMonitor: {
        fps: 60,
        drawCalls: 0,
        lastFrameTime: 0,
    },
    feedbackSystem: {
        enabled: true,
        callbacks: new Map(),
    }
};

// Enhanced Flutter Bridge Integration
function initializeEnhancedFlutterBridge() {
    console.log('Initializing Enhanced Flutter Bridge v2.0...');
    
    // Core parameter update function with dynamic mapping support
    window.updateVisualizerParameter = function(name, value, options = {}) {
        if (!window.mainVisualizerCore) {
            console.warn('Visualizer core not ready for parameter:', name);
            return;
        }
        
        try {
            // Direct parameter update (new binding system)
            if (isVisualizerParameter(name)) {
                updateDirectParameter(name, value, options);
            } else {
                // Legacy mapping fallback
                updateLegacyParameter(name, value);
            }
            
            // Send feedback to Flutter if enabled
            if (window.morphUIBridge.feedbackSystem.enabled) {
                sendParameterFeedback(name, value);
            }
            
        } catch (error) {
            console.error('Error updating visualizer parameter:', error);
            sendErrorToFlutter(error, name, value);
        }
    };
    
    // Direct parameter update for new binding system
    function updateDirectParameter(parameterName, value, options = {}) {
        const updateObject = { [parameterName]: value };
        
        // Apply any transformation options
        if (options.smooth && window.visualParams) {
            const currentValue = window.visualParams[parameterName] || 0;
            const smoothed = currentValue + (value - currentValue) * (options.smoothFactor || 0.1);
            updateObject[parameterName] = smoothed;
        }
        
        // Update visualizer core
        window.mainVisualizerCore.updateParameters(updateObject);
        
        // Update global parameters object
        if (window.visualParams) {
            window.visualParams[parameterName] = updateObject[parameterName];
        }
        
        // Update UI slider if it exists
        if (window.updateSlider) {
            window.updateSlider(parameterName, updateObject[parameterName]);
        }
        
        console.debug(`Direct parameter update: ${parameterName} = ${updateObject[parameterName]}`);
    }
    
    // Legacy parameter mapping (backwards compatibility)
    function updateLegacyParameter(name, value) {
        const legacyMappings = {
            // Audio synthesis parameters (legacy)
            'filterCutoff': { target: 'lineThickness', scale: (v) => 0.005 + v * 0.095 },
            'filterResonance': { target: 'glitchIntensity', scale: (v) => v * 0.15 },
            'reverbMix': { target: 'gridDensity', scale: (v) => 20 - v * 15 },
            'masterVolume': { target: 'patternIntensity', scale: (v) => 0.1 + v * 2.0 },
            
            // XY Pad control (legacy)
            'rotationX': { target: 'rotationX', scale: (v) => v },
            'rotationY': { target: 'rotationY', scale: (v) => v },
            
            // Envelope parameters (legacy)
            'attackTime': { target: 'morphFactor', scale: (v) => v * 1.5 },
            'releaseTime': { target: 'universeModifier', scale: (v) => 0.2 + v * 1.8 },
            
            // Oscillator parameters (legacy)
            'waveformType': { target: 'colorShift', scale: (v) => v / 5 },
            'oscillatorVolume': { target: 'patternIntensity', scale: (v) => 0.5 + v * 1.5 },
        };
        
        const mapping = legacyMappings[name];
        if (mapping) {
            const scaledValue = mapping.scale(value);
            updateDirectParameter(mapping.target, scaledValue);
        } else {
            console.warn(`No mapping found for legacy parameter: ${name}`);
        }
    }
    
    // Check if parameter is a direct visualizer parameter
    function isVisualizerParameter(name) {
        const visualizerParams = [
            'dimension', 'morphFactor', 'rotationX', 'rotationY', 'rotationSpeed',
            'gridDensity', 'lineThickness', 'patternIntensity', 'universeModifier',
            'colorShift', 'glitchIntensity', 'shellWidth', 'tetraThickness'
        ];
        return visualizerParams.includes(name);
    }
    
    // Performance monitoring
    window.startPerformanceMonitoring = function() {
        const monitor = window.morphUIBridge.performanceMonitor;
        
        function updatePerformanceStats() {
            const now = performance.now();
            const deltaTime = now - monitor.lastFrameTime;
            
            if (deltaTime > 0) {
                monitor.fps = Math.round(1000 / deltaTime);
                monitor.lastFrameTime = now;
                
                // Send performance data to Flutter
                sendPerformanceStats(monitor);
            }
            
            requestAnimationFrame(updatePerformanceStats);
        }
        
        updatePerformanceStats();
        console.log('Performance monitoring started');
    };
    
    // Send performance statistics to Flutter
    function sendPerformanceStats(stats) {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'performance_stats',
                fps: stats.fps,
                drawCalls: stats.drawCalls,
                timestamp: Date.now(),
            }, '*');
        }
    }
    
    // Send parameter feedback to Flutter
    function sendParameterFeedback(parameter, value) {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'parameter_feedback',
                parameter: parameter,
                value: value,
                timestamp: Date.now(),
            }, '*');
        }
    }
    
    // Send error information to Flutter
    function sendErrorToFlutter(error, parameter, value) {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'error',
                message: error.message,
                parameter: parameter,
                value: value,
                timestamp: Date.now(),
            }, '*');
        }
    }
    
    // Enhanced effect system
    window.toggleVisualizerEffect = function(effect, intensity = 1.0) {
        if (!window.mainVisualizerCore || !window.visualParams) {
            console.warn('Cannot toggle effect, visualizer not ready');
            return;
        }
        
        const effects = {
            'blur': () => {
                const current = window.visualParams.glitchIntensity || 0;
                window.visualParams.glitchIntensity = current > 0 ? 0 : 0.05 * intensity;
            },
            'grid': () => {
                const current = window.visualParams.gridDensity || 8;
                window.visualParams.gridDensity = current > 10 ? 4 : 16;
            },
            'trails': () => {
                const current = window.visualParams.patternIntensity || 1;
                window.visualParams.patternIntensity = current > 1.5 ? 0.5 : 2.0 * intensity;
            },
            'morph': () => {
                const current = window.visualParams.morphFactor || 0.7;
                window.visualParams.morphFactor = current > 1.0 ? 0.3 : 1.4 * intensity;
            },
            'dimension': () => {
                const current = window.visualParams.dimension || 4.0;
                window.visualParams.dimension = current > 4.0 ? 3.2 : 4.8;
            },
            'color': () => {
                const current = window.visualParams.colorShift || 0;
                window.visualParams.colorShift = current !== 0 ? 0 : 0.5 * intensity;
            }
        };
        
        const effectFunction = effects[effect];
        if (effectFunction) {
            effectFunction();
            window.mainVisualizerCore.updateParameters(window.visualParams);
            console.log(`Effect toggled: ${effect} with intensity ${intensity}`);
        } else {
            console.warn(`Unknown effect: ${effect}`);
        }
    };
    
    // Enhanced reset function
    window.resetVisualizer = function(presetName = 'default') {
        if (!window.mainVisualizerCore) {
            console.warn('Cannot reset, visualizer not ready');
            return;
        }
        
        const presets = {
            'default': {
                morphFactor: 0.7, dimension: 4.0, rotationSpeed: 0.5, gridDensity: 8.0,
                lineThickness: 0.03, patternIntensity: 1.3, universeModifier: 1.0,
                colorShift: 0.0, glitchIntensity: 0.02,
                shellWidth: 0.025, tetraThickness: 0.035,
            },
            'performance': {
                morphFactor: 0.8, dimension: 4.2, rotationSpeed: 1.0, gridDensity: 12.0,
                lineThickness: 0.05, patternIntensity: 2.0, universeModifier: 1.5,
                colorShift: 0.3, glitchIntensity: 0.05,
                shellWidth: 0.04, tetraThickness: 0.06,
            },
            'minimal': {
                morphFactor: 0.3, dimension: 3.5, rotationSpeed: 0.2, gridDensity: 4.0,
                lineThickness: 0.01, patternIntensity: 0.8, universeModifier: 0.7,
                colorShift: 0.0, glitchIntensity: 0.0,
                shellWidth: 0.01, tetraThickness: 0.02,
            }
        };
        
        const preset = presets[presetName] || presets['default'];
        window.visualParams = { ...preset };
        window.mainVisualizerCore.updateParameters(window.visualParams);
        
        // Update all sliders if function is available
        if (window.updateSlider) {
            for (const key in window.visualParams) {
                window.updateSlider(key, window.visualParams[key]);
            }
        }
        
        console.log(`Visualizer reset to preset: ${presetName}`);
    };
    
    // Configuration system
    window.configureVisualizer = function(config) {
        if (config.enablePerformanceMonitoring) {
            window.startPerformanceMonitoring();
        }
        
        if (config.targetFPS) {
            // Could implement FPS limiting here if needed
            console.log(`Target FPS set to: ${config.targetFPS}`);
        }
        
        if (config.enableFeedback !== undefined) {
            window.morphUIBridge.feedbackSystem.enabled = config.enableFeedback;
        }
        
        if (config.adaptiveQuality) {
            // Could implement quality scaling based on performance
            console.log('Adaptive quality enabled');
        }
        
        console.log('Visualizer configured:', config);
    };
    
    // Batch parameter updates for performance
    window.updateMultipleParameters = function(parameterMap) {
        if (!window.mainVisualizerCore) return;
        
        const updateObject = {};
        for (const [parameter, value] of Object.entries(parameterMap)) {
            if (isVisualizerParameter(parameter)) {
                updateObject[parameter] = value;
            }
        }
        
        if (Object.keys(updateObject).length > 0) {
            window.mainVisualizerCore.updateParameters(updateObject);
            
            // Update global parameters
            if (window.visualParams) {
                Object.assign(window.visualParams, updateObject);
            }
            
            console.debug('Batch parameter update:', updateObject);
        }
    };
    
    // Enhanced message listener
    window.addEventListener('message', function(event) {
        if (event.data && typeof event.data === 'object') {
            try {
                switch (event.data.type) {
                    case 'updateParameter':
                        window.updateVisualizerParameter(
                            event.data.parameter, 
                            event.data.value,
                            event.data.options
                        );
                        break;
                        
                    case 'updateMultiple':
                        window.updateMultipleParameters(event.data.parameters);
                        break;
                        
                    case 'toggleEffect':
                        window.toggleVisualizerEffect(
                            event.data.effect, 
                            event.data.intensity
                        );
                        break;
                        
                    case 'resetVisualizer':
                        window.resetVisualizer(event.data.preset);
                        break;
                        
                    case 'configure':
                        window.configureVisualizer(event.data.config);
                        break;
                        
                    case 'refresh':
                        location.reload();
                        break;
                        
                    default:
                        console.debug('Unknown message type:', event.data.type);
                }
            } catch (error) {
                console.error('Error processing message:', error);
                sendErrorToFlutter(error, 'message_processing', event.data);
            }
        }
    });
    
    // Mark bridge as ready
    window.morphUIBridge.isReady = true;
    
    // Notify Flutter that enhanced bridge is ready
    if (window.flutter_inappwebview) {
        window.flutter_inappwebview.callHandler('bridgeReady');
    } else if (window.parent !== window) {
        window.parent.postMessage({
            type: 'visualizer_ready',
            version: '2.0',
            features: [
                'dynamic_parameter_binding',
                'performance_monitoring',
                'batch_updates',
                'advanced_effects',
                'preset_system'
            ]
        }, '*');
    }
    
    console.log('Enhanced Flutter Bridge v2.0 initialized successfully');
}

// Initialize when visualizer is ready
function tryInitializeEnhancedBridge() {
    if (window.mainVisualizerCore && window.visualParams) {
        initializeEnhancedFlutterBridge();
    } else {
        console.log('Waiting for visualizer core to be ready...');
        setTimeout(tryInitializeEnhancedBridge, 500);
    }
}

// Try to initialize immediately if visualizer is ready
if (window.mainVisualizerCore) {
    tryInitializeEnhancedBridge();
} else {
    // Otherwise wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(tryInitializeEnhancedBridge, 1000);
        });
    } else {
        setTimeout(tryInitializeEnhancedBridge, 1000);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeEnhancedFlutterBridge, tryInitializeEnhancedBridge };
}