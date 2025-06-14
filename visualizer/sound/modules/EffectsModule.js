/**
 * EffectsModule.js - v1.0
 * Audio effects processing module for HyperAV
 * - Transforms pitch and amplitude data into visual parameters
 * - Handles color mapping from musical notes
 * - Implements smoothing and transient detection
 * - Creates parameter mappings for audio reactivity
 */

class EffectsModule {
    constructor(options = {}) {
        this.options = {
            colorTuning: 0.5,    // Base color tuning adjustment
            transientThreshold: 0.05,  // Threshold for transient detection
            smoothingFactor: 0.15,     // Default smoothing factor
            bassEmphasis: 1.0,         // Bass emphasis factor
            midEmphasis: 1.0,          // Mid emphasis factor
            highEmphasis: 1.0,         // High emphasis factor
            ...options
        };
        
        // State tracking
        this.lastEnergy = 0;
        this.lastBass = 0;
        this.lastMid = 0;
        this.lastHigh = 0;
        this.transientValue = 0;
        
        // Musical note to color mapping (C=red, moving through spectrum)
        this.noteColorMap = {
            'C': 0, 'C#': 0.083, 'D': 0.167, 'D#': 0.25, 'E': 0.333, 
            'F': 0.417, 'F#': 0.5, 'G': 0.583, 'G#': 0.667, 'A': 0.75, 
            'A#': 0.833, 'B': 0.917
        };
        
        // Parameter mapping definitions
        this.parameterMappings = {};
        this._initializeDefaultMappings();
    }
    
    /**
     * Set up default parameter mappings
     * @private
     */
    _initializeDefaultMappings() {
        // Default mapping configurations
        this.parameterMappings = {
            morphFactor: {
                // Make morph factor respond to pitch octave (higher = more morph)
                primary: 'pitch',
                secondary: 'transient',
                baseScale: 0.8,
                primaryScale: 1.8,
                secondaryScale: 0.7,
                pulseThreshold: 0.3,
                min: 0,
                max: 1.5
            },
            dimension: {
                // Link dimension to note (C=3, B=5)
                primary: 'pitch',
                secondary: 'bass',
                baseScale: 0.65,
                primaryScale: 2.0,
                secondaryScale: 0.6,
                pulseThreshold: 0.4,
                min: 3,
                max: 5
            },
            rotationSpeed: {
                // Higher notes rotate faster
                primary: 'pitch',
                secondary: 'mid',
                baseScale: 0.8,
                primaryScale: 2.0,
                secondaryScale: 3.0,
                pulseThreshold: 0.25,
                min: 0,
                max: 3
            },
            gridDensity: {
                // Grid density varies with pitch - density changes with each octave
                primary: 'pitch',
                secondary: 'bass',
                baseScale: 0.5,
                primaryScale: 3.0,
                secondaryScale: 2.2,
                pulseThreshold: 0.4,
                min: 1,
                max: 25
            },
            lineThickness: {
                // Line thickness varies inversely with note - high notes have thinner lines
                primary: 'pitch',
                secondary: 'high',
                baseScale: 1.5,
                primaryScale: -0.8,
                secondaryScale: -1.0,
                pulseThreshold: 0.5,
                min: 0.002,
                max: 0.1,
                inverse: true
            },
            patternIntensity: {
                // Pattern intensity stronger for sharper/flatter notes (detuning)
                primary: 'tuning',
                secondary: 'transient',
                baseScale: 0.8,
                primaryScale: 1.5,
                secondaryScale: 1.1,
                pulseThreshold: 0.25,
                min: 0,
                max: 3
            },
            universeModifier: {
                // Universe modifier changes with note scale degree
                primary: 'note',
                secondary: 'bass',
                baseScale: 0.7,
                primaryScale: 1.5,
                secondaryScale: 1.2,
                pulseThreshold: 0.4,
                min: 0.3,
                max: 2.5
            },
            glitchIntensity: {
                // Glitch more when out of tune
                primary: 'tuning',
                secondary: 'transient',
                baseScale: 0.02,
                primaryScale: 0.08,
                secondaryScale: 0.1,
                pulseThreshold: 0.2,
                min: 0,
                max: 0.15,
                additive: true
            },
            colorShift: {
                // Color shift based on tuning (sharp = positive, flat = negative)
                primary: 'tuning',
                secondary: 'energy',
                baseScale: 0,
                primaryScale: 1.0,
                secondaryScale: 0.8,
                pulseThreshold: 0.3,
                min: -1.0,
                max: 1.0,
                bipolar: true
            }
        };
    }
    
    /**
     * Update parameter mappings
     * @param {Object} mappings - New mapping configurations 
     */
    updateMappings(mappings) {
        for (const key in mappings) {
            if (this.parameterMappings[key]) {
                this.parameterMappings[key] = {
                    ...this.parameterMappings[key],
                    ...mappings[key]
                };
            } else {
                this.parameterMappings[key] = mappings[key];
            }
        }
    }
    
    /**
     * Process audio analysis data into visual parameters
     * @param {Object} analysisData - Audio analysis data
     * @param {Object} baseParams - Base parameter values
     * @returns {Object} Processed parameters for visualization
     */
    processAudio(analysisData, baseParams) {
        // Extract key values from analysis data
        const { 
            bass, mid, high, 
            bassSmooth, midSmooth, highSmooth,
            pitch,
            dominantPitch, dominantPitchValue
        } = analysisData;
        
        // Calculate derived values
        const dissonanceFactor = midSmooth * highSmooth * 2.0;
        const energyFactor = (bassSmooth + midSmooth) * 0.5;
        
        // Calculate transient factor (sudden changes in high frequency)
        const transientRaw = Math.max(0, highSmooth - this.lastEnergy) * 2.0;
        this.transientValue = transientRaw;
        this.lastEnergy = highSmooth * 0.8; // Update with decay
        
        // Store transients for bass and mid for parameter mapping
        const bassTrans = Math.max(0, bassSmooth - this.lastBass) * 1.5;
        const midTrans = Math.max(0, midSmooth - this.lastMid) * 1.5;
        const highTrans = transientRaw;
        
        this.lastBass = bassSmooth * 0.9;
        this.lastMid = midSmooth * 0.9;
        this.lastHigh = highSmooth * 0.9;
        
        // Start with a copy of base parameters
        const effectiveParams = { ...baseParams };
        
        // Calculate pitch-based color parameters
        const colorParams = this._calculateColorParameters(pitch, energyFactor);
        Object.assign(effectiveParams, colorParams);
        
        // Add projection parameters based on pitch
        effectiveParams.projectionDistance = pitch.frequency > 0 
            ? 2.0 + (pitch.octave - 3) * 0.5
            : 2.0 + bassSmooth * 1.0;
            
        effectiveParams.projectionAngle = pitch.frequency > 0
            ? (this.noteColorMap[pitch.note] || 0) * Math.PI * 2
            : (Date.now() * 0.0005) % (Math.PI * 2);
        
        // Process each parameter based on audio
        for (const paramName in this.parameterMappings) {
            if (!baseParams.hasOwnProperty(paramName)) continue;
            
            const mapping = this.parameterMappings[paramName];
            let value = baseParams[paramName]; // Start with base value
            
            // Apply specific parameter mapping logic
            if (mapping.additive) {
                // Additive parameters add to base value
                value += (value * highSmooth * 0.2) + (transientRaw * 0.3);
            } else if (mapping.bipolar) {
                // Bipolar parameters can go positive or negative from center
                value += (dissonanceFactor - 0.1) * 0.8 + (energyFactor - 0.2) * 0.5;
            } else {
                // Apply mapping based on primary audio source
                let factor = mapping.baseScale;
                
                if (mapping.primary === 'pitch' && pitch.frequency > 0) {
                    // Use pitch for primary scaling
                    factor += (pitch.octave / 6) * mapping.primaryScale;
                    factor += mapping.inverse ? -highSmooth * 0.5 : highSmooth * 0.5;
                } else if (mapping.primary === 'note' && pitch.frequency > 0) {
                    // Use note (C=0, B=0.917) for primary scaling
                    factor += (this.noteColorMap[pitch.note] || 0) * mapping.primaryScale;
                } else if (mapping.primary === 'tuning' && pitch.frequency > 0) {
                    // Use tuning (cents deviation) for primary scaling
                    factor += Math.abs(pitch.cents / 50.0) * mapping.primaryScale;
                } else if (mapping.primary === 'bass') {
                    // Use bass level for primary scaling
                    factor += bassSmooth * mapping.primaryScale;
                } else if (mapping.primary === 'mid') {
                    // Use mid level for primary scaling
                    factor += midSmooth * mapping.primaryScale;
                } else if (mapping.primary === 'high') {
                    // Use high level for primary scaling
                    factor += highSmooth * mapping.primaryScale;
                } else if (mapping.primary === 'energy') {
                    // Use overall energy for primary scaling
                    factor += energyFactor * mapping.primaryScale;
                } else if (mapping.primary === 'transient') {
                    // Use transient detection for primary scaling
                    factor += transientRaw * mapping.primaryScale;
                }
                
                // Apply secondary mapping for more variation
                if (mapping.secondary === 'bass') {
                    factor += bassSmooth * mapping.secondaryScale;
                } else if (mapping.secondary === 'mid') {
                    factor += midSmooth * mapping.secondaryScale;
                } else if (mapping.secondary === 'high') {
                    factor += highSmooth * mapping.secondaryScale;
                } else if (mapping.secondary === 'transient') {
                    factor += transientRaw * mapping.secondaryScale;
                } else if (mapping.secondary === 'energy') {
                    factor += energyFactor * mapping.secondaryScale;
                }
                
                // Apply the factor to the base value
                if (mapping.inverse) {
                    // For inverse parameters (like thickness)
                    value *= Math.max(0.1, 2.0 - factor);
                } else {
                    value *= factor;
                }
            }
            
            // Clamp value to allowed range
            if (mapping.min !== undefined && mapping.max !== undefined) {
                value = Math.max(mapping.min, Math.min(mapping.max, value));
            }
            
            // Store the calculated value
            effectiveParams[paramName] = value;
        }
        
        // Calculate shell width and tetra thickness (derived from line thickness)
        effectiveParams.shellWidth = baseParams.shellWidth * 
            (0.7 + midSmooth * 1.8 + bassSmooth * 0.4);
        
        effectiveParams.tetraThickness = baseParams.tetraThickness * 
            (1.3 - highSmooth * 0.9 + bassSmooth * 0.3);
            
        // Add audio levels for direct use in shaders
        effectiveParams.audioLevels = { 
            bass: bassSmooth, 
            mid: midSmooth, 
            high: highSmooth 
        };
        
        // Return the fully processed parameters
        return effectiveParams;
    }
    
    /**
     * Calculate color parameters based on pitch data
     * @param {Object} pitch - Pitch detection data
     * @param {number} energyFactor - Overall audio energy factor
     * @returns {Object} Color parameters
     * @private
     */
    _calculateColorParameters(pitch, energyFactor) {
        // Default color values
        let hue = 0.5;          // Default hue
        let saturation = 0.8;   // Default saturation
        let brightness = 0.9;   // Default brightness
        let rgbOffset = 0;      // RGB separation for moiré effect
        
        // Process pitch data if we have valid pitch detection
        if (pitch.frequency > 0) {
            // Base hue on note
            const baseHue = this.noteColorMap[pitch.note] || 0;
            
            // Adjust hue based on octave - full spectrum shift for more color variation
            hue = (baseHue + (pitch.octave % 7) * 0.14) % 1.0;
            
            // Adjust saturation to be more vibrant - higher baseline for neon effect
            saturation = 0.85 + pitch.strength * 0.15;
            
            // Adjust brightness based on octave - emphasize neon effect
            // Most vibrant in human hearing range (octaves 2-7)
            const humanAudibleRange = Math.max(0.0, 1.0 - Math.abs(pitch.octave - 4.5) / 3.0);
            brightness = 0.6 + humanAudibleRange * 0.6;
            
            // RGB moiré effect based on tuning (sharp or flat)
            // Enhanced effect with more dramatic offset for neon chromatic aberration
            if (!pitch.inTune) {
                // Increase the effect when further from perfect tuning
                const intensity = Math.abs(pitch.cents) / 50.0; // 0 to 1.0
                rgbOffset = pitch.cents / 50.0 * (1.0 + intensity * 2.0); // Amplified effect
            } else {
                // Small random variation even when in tune for visual interest
                rgbOffset = (Math.random() * 0.04 - 0.02) * pitch.strength;
            }
        } else {
            // No pitch detected - use energy-based fallback with intense neon colors
            hue = (Date.now() * 0.0001) % 1.0; // Slowly cycle through colors
            
            // Higher saturation baseline for neon effect
            saturation = 0.9 + energyFactor * 0.1;
            
            // Reduce brightness at extreme frequencies (outside human range)
            brightness = 0.7 + energyFactor * 0.3;
        }
        
        return {
            hue,
            saturation,
            brightness,
            rgbOffset
        };
    }
    
    /**
     * Get pulse intensity for UI feedback
     * @param {string} paramName - Parameter name
     * @param {Object} analysisData - Audio analysis data
     * @returns {number} Pulse intensity from 0-1
     */
    getPulseIntensity(paramName, analysisData) {
        const mapping = this.parameterMappings[paramName];
        if (!mapping) return 0;
        
        // Calculate pulse intensity based on primary and secondary audio bands
        let pulseIntensity = 0;
        
        if (mapping.primary === 'bass') {
            pulseIntensity = analysisData.bassSmooth * 1.5;
        } else if (mapping.primary === 'mid') {
            pulseIntensity = analysisData.midSmooth * 1.5;
        } else if (mapping.primary === 'high') {
            pulseIntensity = analysisData.highSmooth * 1.5;
        } else if (mapping.primary === 'dissonance') {
            const dissonanceFactor = analysisData.midSmooth * analysisData.highSmooth * 2.0;
            pulseIntensity = dissonanceFactor * 1.2;
        } else if (mapping.primary === 'energy') {
            const energyFactor = (analysisData.bassSmooth + analysisData.midSmooth) * 0.5;
            pulseIntensity = energyFactor * 1.2;
        } else if (mapping.primary === 'transient') {
            pulseIntensity = this.transientValue * 2.0;
        }
        
        // Limit pulse intensity
        return Math.min(1, Math.max(0, pulseIntensity));
    }
    
    /**
     * Check if a parameter exceeds its activity threshold
     * @param {string} paramName - Parameter name
     * @param {Object} analysisData - Audio analysis data
     * @returns {boolean} True if parameter should be considered 'active'
     */
    isParameterActive(paramName, analysisData) {
        const mapping = this.parameterMappings[paramName];
        if (!mapping || mapping.pulseThreshold === undefined) return false;
        
        const intensity = this.getPulseIntensity(paramName, analysisData);
        return intensity > mapping.pulseThreshold;
    }
}

export default EffectsModule;