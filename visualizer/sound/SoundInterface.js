/**
 * SoundInterface.js - v1.0
 * Main audio interface for HyperAV
 * - Provides unified access to audio analysis and effects processing
 * - Manages audio permissions and fallback modes
 * - Handles audio reactivity state management
 */

import AnalysisModule from './modules/AnalysisModule.js';
import EffectsModule from './modules/EffectsModule.js';

class SoundInterface {
    constructor(options = {}) {
        this.options = {
            onStatusUpdate: null,         // Status callback
            onReactivityChange: null,     // Reactivity state change callback
            autoStart: false,             // Auto-start audio analysis
            ...options
        };
        
        // Initialize modules
        this.analysisModule = new AnalysisModule({
            onStatusUpdate: (message) => this._handleStatusUpdate(message)
        });
        
        this.effectsModule = new EffectsModule();
        
        // State
        this.isActive = false;
        this.isUsingMicrophone = false;
        this.isSimulating = false;
        this.updateIntervalId = null;
        this.lastUpdateTime = 0;
        
        // Auto-start if requested
        if (this.options.autoStart) {
            this.initialize();
        }
    }
    
    /**
     * Initialize the sound interface
     * @returns {Promise<boolean>} Success state
     */
    async initialize() {
        try {
            // Initialize analysis module
            const initialized = await this.analysisModule.initialize();
            if (!initialized) {
                this._setReactivityState('error', 'Audio initialization failed');
                return false;
            }
            
            // Try to connect microphone if we can
            this.tryConnectMicrophone();
            
            // Start update loop
            this._startUpdateLoop();
            
            this.isActive = true;
            return true;
        } catch (error) {
            console.error("Sound interface initialization error:", error);
            this._handleStatusUpdate(`Init error: ${error.message}`);
            this._setReactivityState('error', error.message);
            return false;
        }
    }
    
    /**
     * Try to connect to the microphone
     * @returns {Promise<boolean>} Success state
     */
    async tryConnectMicrophone() {
        try {
            const connected = await this.analysisModule.connectMicrophone();
            
            if (connected) {
                this.isUsingMicrophone = true;
                this.isSimulating = false;
                this._setReactivityState('microphone', 'Microphone connected');
                return true;
            } else {
                // Fallback to simulation
                this._startSimulation();
                return false;
            }
        } catch (error) {
            console.error("Microphone connection error:", error);
            this._handleStatusUpdate(`Mic error: ${error.message}`);
            this._startSimulation();
            return false;
        }
    }
    
    /**
     * Start audio simulation (fallback mode)
     * @private
     */
    _startSimulation() {
        this.analysisModule.startSimulation();
        this.isUsingMicrophone = false;
        this.isSimulating = true;
        this._setReactivityState('simulation', 'Using simulated audio');
    }
    
    /**
     * Stop audio simulation
     * @private
     */
    _stopSimulation() {
        this.analysisModule.stopSimulation();
        this.isSimulating = false;
    }
    
    /**
     * Start the update loop for continuous analysis
     * @private
     */
    _startUpdateLoop() {
        // Clear any existing interval
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
        }
        
        // Set update interval (approximately 30fps)
        this.updateIntervalId = setInterval(() => {
            if (!this.isActive) return;
            
            // Update last update time
            this.lastUpdateTime = Date.now();
            
            // Analyze audio if we have an analyzer
            this.analysisModule.analyze();
        }, 33); // ~30fps
    }
    
    /**
     * Update reactivity state and trigger callback
     * @param {string} state - Current state ('microphone', 'simulation', 'inactive', 'error')
     * @param {string} message - Status message
     * @private
     */
    _setReactivityState(state, message) {
        if (typeof this.options.onReactivityChange === 'function') {
            this.options.onReactivityChange(state, message);
        }
    }
    
    /**
     * Handle status updates from modules
     * @param {string} message - Status message
     * @private
     */
    _handleStatusUpdate(message) {
        if (typeof this.options.onStatusUpdate === 'function') {
            this.options.onStatusUpdate(message);
        }
    }
    
    /**
     * Process audio analysis into visualization parameters
     * @param {Object} baseParams - Base parameter values
     * @returns {Object} Processed parameters for visualization
     */
    processAudio(baseParams) {
        if (!this.isActive) return baseParams;
        
        // Get current analysis data
        const analysisData = this.analysisModule.analysisData;
        
        // Process through effects module
        return this.effectsModule.processAudio(analysisData, baseParams);
    }
    
    /**
     * Get pulse intensity for a parameter (for UI feedback)
     * @param {string} paramName - Parameter name
     * @returns {number} Pulse intensity from 0-1
     */
    getParameterPulse(paramName) {
        if (!this.isActive) return 0;
        return this.effectsModule.getPulseIntensity(
            paramName, 
            this.analysisModule.analysisData
        );
    }
    
    /**
     * Check if a parameter exceeds its activity threshold
     * @param {string} paramName - Parameter name
     * @returns {boolean} True if parameter should be considered 'active'
     */
    isParameterActive(paramName) {
        if (!this.isActive) return false;
        return this.effectsModule.isParameterActive(
            paramName,
            this.analysisModule.analysisData
        );
    }
    
    /**
     * Get current audio analysis data
     * @returns {Object} Current analysis data
     */
    getAnalysisData() {
        return this.analysisModule.analysisData;
    }
    
    /**
     * Check if audio interface is active
     * @returns {boolean} True if active
     */
    isInterfaceActive() {
        return this.isActive;
    }
    
    /**
     * Check if using microphone
     * @returns {boolean} True if using microphone
     */
    isMicrophoneActive() {
        return this.isUsingMicrophone;
    }
    
    /**
     * Update parameter mappings for audio reactivity
     * @param {Object} mappings - New mapping configurations
     */
    updateParameterMappings(mappings) {
        this.effectsModule.updateMappings(mappings);
    }
    
    /**
     * Pause audio processing
     */
    pause() {
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }
        this.isActive = false;
        this._setReactivityState('inactive', 'Audio processing paused');
    }
    
    /**
     * Resume audio processing
     */
    resume() {
        if (!this.isActive) {
            this.isActive = true;
            this._startUpdateLoop();
            
            const state = this.isUsingMicrophone ? 'microphone' : 
                          this.isSimulating ? 'simulation' : 'inactive';
            
            this._setReactivityState(state, 'Audio processing resumed');
        }
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        console.log("Disposing sound interface");
        
        // Clear update interval
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }
        
        // Dispose modules
        if (this.analysisModule) {
            this.analysisModule.dispose();
        }
        
        this.isActive = false;
        this.isUsingMicrophone = false;
        this.isSimulating = false;
    }
}

export default SoundInterface;