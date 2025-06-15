/**
 * AnalysisModule.js - v1.0
 * Audio analysis module for HyperAV
 * - Handles Web Audio API setup and management
 * - Provides real-time frequency and time-domain analysis
 * - Implements musical pitch detection with cents deviation
 * - Supports multiple frequency bands (bass, mid, high)
 * - Includes smoothing algorithms and transient detection
 * - Fallback to simulated audio when microphone unavailable
 */

class AnalysisModule {
    constructor(options = {}) {
        this.options = {
            fftSize: 2048,
            smoothingTimeConstant: 0.4,
            bassBand: [20, 250],
            midBand: [250, 4000],
            highBand: [4000, 12000],
            ...options
        };
        
        // Audio context and analyzer
        this.audioContext = null;
        this.analyser = null;
        this.micSource = null;
        
        // Analysis data arrays
        this.freqData = null;
        this.timeData = null;
        
        // Analysis results
        this.analysisData = {
            bass: 0, mid: 0, high: 0,
            bassSmooth: 0, midSmooth: 0, highSmooth: 0,
            dominantPitch: 0,       // Frequency of dominant pitch in Hz
            dominantPitchValue: 0,  // Strength of dominant pitch 0-1
            pitch: {                // Structured pitch data
                frequency: 0,       // Detected pitch in Hz
                note: 'A',          // Musical note (A-G)
                octave: 4,          // Octave number
                cents: 0,           // Cents deviation from perfect pitch (-50 to +50)
                inTune: false,      // Whether the note is in tune (within ±15 cents)
                strength: 0         // Strength of the pitch detection (0-1)
            }
        };
        
        // Smoothing and transient detection state
        this.lastEnergy = 0;
        this.lastPitch = 0;
        
        // Musical note reference frequencies - A4 = 440Hz
        this.NOTE_FREQUENCIES = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 
            'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        };
        
        // Status callback
        this.onStatusUpdate = options.onStatusUpdate || null;
        
        // For fallback/testing
        this.simulationActive = false;
        this.simulationInterval = null;
    }
    
    /**
     * Initialize audio context and analyzer
     * @returns {Promise<boolean>} Success state
     */
    async initialize() {
        try {
            // Create audio context with fallback
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context (needed for some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Setup analyzer with specified FFT size
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.options.fftSize;
            this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;
            
            // Initialize data arrays
            this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeData = new Uint8Array(this.analyser.fftSize);
            
            this._updateStatus("Audio context initialized");
            console.log("Audio analysis module initialized:", {
                "Audio Context State": this.audioContext.state,
                "Sample Rate": this.audioContext.sampleRate,
                "FFT Size": this.analyser.fftSize,
                "Frequency Bins": this.analyser.frequencyBinCount
            });
            
            return true;
        } catch (err) {
            console.error("Audio initialization error:", err);
            this._updateStatus(`Audio init error: ${err.message}`);
            this._cleanup();
            return false;
        }
    }
    
    /**
     * Request microphone access and connect to analyzer
     * @returns {Promise<boolean>} Success state
     */
    async connectMicrophone() {
        if (!this.audioContext || !this.analyser) {
            const initialized = await this.initialize();
            if (!initialized) return false;
        }
        
        try {
            this._updateStatus("Requesting microphone access...");
            
            // Request mic access with explicit constraints for better audio quality
            const constraints = { 
                audio: { 
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                } 
            };
            
            // Get user media with error handling
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Connect mic to analyzer
            this.micSource = this.audioContext.createMediaStreamSource(stream);
            this.micSource.connect(this.analyser);
            
            // Add a dummy node to keep audio context active
            const dummyNode = this.audioContext.createGain();
            dummyNode.gain.value = 0;
            this.analyser.connect(dummyNode);
            dummyNode.connect(this.audioContext.destination);
            
            this._updateStatus("Microphone connected");
            console.log("Microphone connected successfully");
            
            // Stop any simulation that might be running
            this.stopSimulation();
            
            // Force initial calculation
            this.analyze();
            
            return true;
        } catch (err) {
            console.error("Microphone connection error:", err);
            this._updateStatus(`Mic error: ${err.message}`);
            
            // Start simulation as fallback
            this.startSimulation();
            return false;
        }
    }
    
    /**
     * Start simulating audio data for testing/fallback
     */
    startSimulation() {
        if (this.simulationActive) return;
        
        this._updateStatus("Using simulated audio data");
        this.simulationActive = true;
        
        // Stop any existing interval
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
        
        // Start generating simulated data
        this.simulationInterval = setInterval(() => this._generateSimulatedData(), 40); // ~25fps
    }
    
    /**
     * Stop the audio simulation
     */
    stopSimulation() {
        if (!this.simulationActive) return;
        
        this.simulationActive = false;
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
    }
    
    /**
     * Generate simulated audio data with musical patterns
     * @private
     */
    _generateSimulatedData() {
        const simulationTime = Date.now() / 1000;
        const notePattern = Math.floor(simulationTime % 8); // Cycle through 8 patterns
        
        // Simulate a series of musical notes
        const simulatedNotes = ['C', 'E', 'G', 'B', 'D', 'F', 'A'];
        const simulatedOctaves = [3, 4, 5];
        const noteIndex = Math.floor(simulationTime * 0.5) % simulatedNotes.length;
        const octaveIndex = Math.floor(simulationTime * 0.2) % simulatedOctaves.length;
        
        // Set simulated pitch data - more dynamic with wider octave range
        this.analysisData.pitch = {
            frequency: this.NOTE_FREQUENCIES[simulatedNotes[noteIndex]] * 
                       Math.pow(2, simulatedOctaves[octaveIndex] - 4),
            note: simulatedNotes[noteIndex],
            octave: simulatedOctaves[octaveIndex],
            cents: (Math.sin(simulationTime * 0.3) * 50).toFixed(0),
            inTune: Math.random() > 0.7,
            strength: 0.8 + Math.random() * 0.2 // High strength for vibrant colors
        };
        
        // Set simulated frequency band data - more dynamic for testing
        // Create patterns that emphasize mid-range (human audible) frequencies
        const pulseRate = Math.sin(simulationTime * 0.8) * 0.5 + 0.5;
        this.analysisData.bass = 0.3 + Math.random() * 0.3 + pulseRate * 0.3;
        this.analysisData.mid = 0.4 + Math.random() * 0.4 + pulseRate * 0.2;
        this.analysisData.high = 0.2 + Math.random() * 0.3 + pulseRate * 0.1;
        
        // Apply smoothing
        const alpha = 0.2;
        this.analysisData.bassSmooth = this.analysisData.bassSmooth * (1 - alpha) + 
                                      this.analysisData.bass * alpha;
        this.analysisData.midSmooth = this.analysisData.midSmooth * (1 - alpha) + 
                                     this.analysisData.mid * alpha;
        this.analysisData.highSmooth = this.analysisData.highSmooth * (1 - alpha) + 
                                      this.analysisData.high * alpha;
        
        // Update dominant pitch information
        this.analysisData.dominantPitch = this.analysisData.pitch.frequency;
        this.analysisData.dominantPitchValue = this.analysisData.pitch.strength;
        
        // Occasionally update status
        if (Math.random() < 0.01) {
            this._updateStatus(`Simulated Note: ${this.analysisData.pitch.note}${this.analysisData.pitch.octave}`);
        }
    }
    
    /**
     * Analyze audio data from the analyzer
     * Updates analysisData with real-time audio information
     * @returns {Object} The current analysis data
     */
    analyze() {
        if (this.simulationActive || !this.analyser || !this.freqData) {
            return this.analysisData;
        }
        
        try {
            // Get both frequency and time domain data
            this.analyser.getByteFrequencyData(this.freqData);
            this.analyser.getByteTimeDomainData(this.timeData);
            
            // Check if we're getting any audio signal
            const hasAudioSignal = this.freqData.some(value => value > 0);
            if (!hasAudioSignal) {
                console.warn("No audio signal detected - check microphone permissions and input");
                this.startSimulation();
                return this.analysisData;
            }
            
            // Calculate frequency bands
            const bufferLength = this.analyser.frequencyBinCount;
            const nyquist = this.audioContext.sampleRate / 2;
            const [bassLow, bassHigh] = this.options.bassBand;
            const [midLow, midHigh] = this.options.midBand;
            const [highLow, highHigh] = this.options.highBand;
            const freqPerBin = nyquist / bufferLength;
            
            let bassSum = 0, midSum = 0, highSum = 0;
            let bassCount = 0, midCount = 0, highCount = 0;
            let maxEnergyBin = 0, maxEnergy = 0;
            
            // Analyze frequency bands
            for (let i = 0; i < bufferLength; i++) {
                const freq = i * freqPerBin;
                const value = this.freqData[i] / 255.0;
                
                // Track maximum energy bin for dominant frequency
                if (this.freqData[i] > maxEnergy && freq > 80) { // Ignore very low frequencies
                    maxEnergy = this.freqData[i];
                    maxEnergyBin = i;
                }
                
                if (freq >= bassLow && freq < bassHigh) { 
                    bassSum += value; 
                    bassCount++; 
                } else if (freq >= midLow && freq < midHigh) { 
                    midSum += value; 
                    midCount++; 
                } else if (freq >= highLow && freq < highHigh) { 
                    highSum += value; 
                    highCount++; 
                }
            }
            
            // Calculate averages with safety checks
            const bassAvg = bassCount > 0 ? bassSum / bassCount : 0;
            const midAvg = midCount > 0 ? midSum / midCount : 0;
            const highAvg = highCount > 0 ? highSum / highCount : 0;
            
            // Set dominant frequency and strength
            this.analysisData.dominantPitch = maxEnergyBin * freqPerBin;
            this.analysisData.dominantPitchValue = maxEnergy / 255.0;
            
            // Perform pitch detection
            const pitchData = this._detectPitch(this.freqData, this.audioContext.sampleRate);
            this.analysisData.pitch = pitchData;
            
            // Update raw values
            this.analysisData.bass = bassAvg;
            this.analysisData.mid = midAvg;
            this.analysisData.high = highAvg;
            
            // Apply smoothing with proper alpha value
            const alpha = 0.15;
            this.analysisData.bassSmooth = this.analysisData.bassSmooth * (1 - alpha) + 
                                          this.analysisData.bass * alpha;
            this.analysisData.midSmooth = this.analysisData.midSmooth * (1 - alpha) + 
                                         this.analysisData.mid * alpha;
            this.analysisData.highSmooth = this.analysisData.highSmooth * (1 - alpha) + 
                                          this.analysisData.high * alpha;
            
            // Log values occasionally for debugging
            if (Math.random() < 0.01) {
                const noteInfo = pitchData.frequency > 0 
                    ? `Note: ${pitchData.note}${pitchData.octave} (${pitchData.cents > 0 ? '+' : ''}${pitchData.cents}¢)` 
                    : 'No pitch detected';
                    
                console.log(`Audio: Bass=${this.analysisData.bassSmooth.toFixed(2)} Mid=${this.analysisData.midSmooth.toFixed(2)} High=${this.analysisData.highSmooth.toFixed(2)} | ${noteInfo}`);
                
                // Update status with pitch information
                this._updateStatus(noteInfo);
            }
            
            return this.analysisData;
            
        } catch (err) {
            console.error("Error analyzing audio:", err);
            
            // Fallback to simulated values
            this.startSimulation();
            return this.analysisData;
        }
    }
    
    /**
     * Detect musical pitch from frequency data
     * @param {Uint8Array} frequencyData - FFT frequency data (0-255)
     * @param {number} sampleRate - Audio sample rate
     * @returns {Object} Pitch information object
     * @private
     */
    _detectPitch(frequencyData, sampleRate) {
        // Find the dominant frequency bin
        let maxValue = 0;
        let maxIndex = 0;
        const nyquist = sampleRate / 2;
        const binCount = frequencyData.length;
        const freqPerBin = nyquist / binCount;
        
        // Ignore first few bins (very low frequencies/DC offset)
        for (let i = 5; i < binCount; i++) {
            const value = frequencyData[i];
            if (value > maxValue) {
                maxValue = value;
                maxIndex = i;
            }
        }
        
        // Calculate the frequency from the bin index
        const dominantFrequency = maxIndex * freqPerBin;
        const dominantStrength = maxValue / 255.0;
        
        // Only consider strong enough signals
        if (dominantStrength < 0.1 || dominantFrequency < 20 || dominantFrequency > 8000) {
            return {
                frequency: 0,
                note: 'None',
                octave: 0,
                cents: 0,
                inTune: false,
                strength: 0
            };
        }
        
        // Convert frequency to musical note
        // A4 = 440 Hz is our reference
        const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const a4 = 440.0;
        const a4Index = 69; // MIDI note number for A4
        
        // Calculate distance from A4 in semitones
        const semitoneDistance = 12 * Math.log2(dominantFrequency / a4);
        const roundedSemitoneDistance = Math.round(semitoneDistance);
        const noteIndex = ((a4Index + roundedSemitoneDistance) % 12 + 12) % 12; // Ensure positive modulo
        
        // Calculate octave
        const octave = Math.floor((a4Index + roundedSemitoneDistance) / 12) - 1;
        
        // Calculate cents deviation (how much the note is out of tune)
        // 0 cents = perfectly in tune, -50 to +50 cents = out of tune
        const cents = Math.round(100 * (semitoneDistance - roundedSemitoneDistance));
        
        // Consider a note "in tune" if it's within ±15 cents of perfect pitch
        const inTune = Math.abs(cents) <= 15;
        
        return {
            frequency: dominantFrequency,
            note: noteStrings[noteIndex],
            octave: octave,
            cents: cents,
            inTune: inTune,
            strength: dominantStrength
        };
    }
    
    /**
     * Update status via callback if provided
     * @param {string} message - Status message
     * @private
     */
    _updateStatus(message) {
        if (typeof this.onStatusUpdate === 'function') {
            this.onStatusUpdate(message);
        }
    }
    
    /**
     * Clean up audio resources
     * @private
     */
    _cleanup() {
        this.stopSimulation();
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (e) {
                console.warn("Error closing audio context:", e);
            }
        }
        
        this.audioContext = null;
        this.analyser = null;
        this.micSource = null;
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        console.log("Disposing audio analysis module");
        this._cleanup();
    }
}

export default AnalysisModule;