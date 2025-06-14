/**
 * Global variable exposer for Flutter bridge integration
 * This file ensures visualizer components are accessible globally
 */

// Wait for visualizer main to initialize
let checkInterval = setInterval(() => {
    // Check if the main visualizer components exist in module scope
    const canvas = document.getElementById('hypercube-canvas');
    if (!canvas) return;
    
    // Try to access visualizer through the canvas context
    const moduleScope = canvas._visualizerScope;
    if (moduleScope) {
        // Expose necessary globals
        window.mainVisualizerCore = moduleScope.mainVisualizerCore;
        window.visualParams = moduleScope.visualParams;
        window.updateSlider = moduleScope.updateSlider;
        
        console.log('Visualizer globals exposed for Flutter bridge');
        clearInterval(checkInterval);
        
        // Initialize Flutter bridge if it's waiting
        if (window.initializeFlutterBridge) {
            window.initializeFlutterBridge();
        }
    }
}, 100);

// Also listen for a custom event from visualizer
document.addEventListener('visualizerReady', (event) => {
    if (event.detail) {
        window.mainVisualizerCore = event.detail.core;
        window.visualParams = event.detail.params;
        window.updateSlider = event.detail.updateSlider;
        
        console.log('Visualizer globals exposed via event');
        
        // Initialize Flutter bridge if it's waiting
        if (window.initializeFlutterBridge) {
            window.initializeFlutterBridge();
        }
    }
});