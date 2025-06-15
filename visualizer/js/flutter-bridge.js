/**
 * Flutter Bridge Integration for HyperAV Visualizer
 * This file provides the communication bridge between Flutter and the visualizer
 */

// Wait for visualizer to be ready
function initializeFlutterBridge() {
    // Flutter Bridge Integration
    window.updateVisualizerParameter = function(name, value) {
        if (!window.mainVisualizerCore) return;
        
        // Map Flutter parameters to visualizer parameters
        const parameterMap = {
            // Audio synthesis parameters
            'filterCutoff': { target: 'dimension', scale: (v) => 3 + v * 2 }, // 0-1 -> 3-5
            'filterResonance': { target: 'rotationSpeed', scale: (v) => v * 2 }, // 0-1 -> 0-2
            'reverbMix': { target: 'glitchIntensity', scale: (v) => v * 0.1 }, // 0-1 -> 0-0.1
            'masterVolume': { target: 'patternIntensity', scale: (v) => 0.5 + v * 1.5 }, // 0-1 -> 0.5-2
            
            // XY Pad direct control
            'rotationX': { target: 'rotationX', scale: (v) => v * 360 }, // 0-1 -> 0-360
            'rotationY': { target: 'rotationY', scale: (v) => v * 360 }, // 0-1 -> 0-360
            
            // Envelope parameters
            'attackTime': { target: 'morphFactor', scale: (v) => v * 1.5 }, // 0-1 -> 0-1.5
            'releaseTime': { target: 'lineThickness', scale: (v) => 0.01 + v * 0.09 }, // 0-1 -> 0.01-0.1
            
            // Oscillator parameters
            'waveformType': { target: 'colorShift', scale: (v) => v / 5 }, // 0-5 -> 0-1
            'oscillatorVolume': { target: 'universeModifier', scale: (v) => 0.5 + v * 1.5 }, // 0-1 -> 0.5-2
        };
        
        const mapping = parameterMap[name];
        if (mapping) {
            const scaledValue = mapping.scale(value);
            
            // Update visualizer parameters
            if (window.visualParams) {
                window.visualParams[mapping.target] = scaledValue;
            }
            
            // Update the visualizer core
            if (window.mainVisualizerCore) {
                window.mainVisualizerCore.updateParameters({
                    [mapping.target]: scaledValue
                });
            }
            
            // Update UI if slider exists and function is available
            if (window.updateSlider) {
                window.updateSlider(mapping.target, scaledValue);
            }
        }
    };
    
    // Effect toggle functions for Flutter
    window.toggleVisualizerEffect = function(effect) {
        if (!window.mainVisualizerCore || !window.visualParams) return;
        
        switch(effect) {
            case 'blur':
                window.visualParams.glitchIntensity = window.visualParams.glitchIntensity > 0 ? 0 : 0.05;
                break;
            case 'grid':
                window.visualParams.gridDensity = window.visualParams.gridDensity > 4 ? 2 : 12;
                break;
            case 'trails':
                // Toggle between different pattern intensities for trail effect
                window.visualParams.patternIntensity = window.visualParams.patternIntensity > 1 ? 0.5 : 2;
                break;
        }
        
        window.mainVisualizerCore.updateParameters(window.visualParams);
    };
    
    window.resetVisualizer = function() {
        if (!window.mainVisualizerCore) return;
        
        // Reset to default values
        window.visualParams = {
            morphFactor: 0.7, dimension: 4.0, rotationSpeed: 0.5, gridDensity: 8.0,
            lineThickness: 0.03, patternIntensity: 1.3, universeModifier: 1.0,
            colorShift: 0.0, glitchIntensity: 0.02,
            shellWidth: 0.025, tetraThickness: 0.035,
            hue: 0.5, saturation: 0.8, brightness: 0.9
        };
        
        window.mainVisualizerCore.updateParameters(window.visualParams);
        
        // Update all sliders if function is available
        if (window.updateSlider) {
            for (const key in window.visualParams) {
                window.updateSlider(key, window.visualParams[key]);
            }
        }
    };
    
    // Set up message listener for iframe communication
    window.addEventListener('message', function(event) {
        if (event.data && typeof event.data === 'object') {
            if (event.data.type === 'updateParameter') {
                window.updateVisualizerParameter(event.data.parameter, event.data.value);
            } else if (event.data.type === 'toggleEffect') {
                window.toggleVisualizerEffect(event.data.effect);
            } else if (event.data.type === 'resetVisualizer') {
                window.resetVisualizer();
            }
        }
    });
    
    // Notify Flutter that bridge is ready
    if (window.flutter_inappwebview) {
        window.flutter_inappwebview.callHandler('bridgeReady');
    } else if (window.parent !== window) {
        // We're in an iframe, notify parent
        window.parent.postMessage('bridgeReady', '*');
    }
    
    console.log('Flutter bridge initialized');
}

// Try to initialize immediately if visualizer is ready
if (window.mainVisualizerCore) {
    initializeFlutterBridge();
} else {
    // Otherwise wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Give visualizer time to initialize
            setTimeout(initializeFlutterBridge, 1000);
        });
    } else {
        // DOM already loaded, just wait a bit for visualizer
        setTimeout(initializeFlutterBridge, 1000);
    }
}