/* packages/mvep-plugins/src/audioInput.js - v1.0 */

/**
 * Audio Input Plugin for MVEP
 * Converts audio frequency data into 4D visualization parameters
 * Extracted and generalized from HyperAV
 */
export class AudioInputPlugin {
    constructor(options = {}) {
        this.options = {
            frequencyBands: 4,
            smoothingFactor: 0.8,
            sensitivity: 1.0,
            pitchTracking: true,
            ...options
        };
        
        // Frequency band ranges (Hz)
        this.bandRanges = [
            { name: 'bass', min: 20, max: 250, weight: 1.2 },
            { name: 'lowMid', min: 250, max: 1000, weight: 1.0 },
            { name: 'highMid', min: 1000, max: 4000, weight: 0.9 },
            { name: 'treble', min: 4000, max: 20000, weight: 0.8 }
        ];
        
        // Smoothing buffers
        this.smoothedValues = {
            bass: 0,
            lowMid: 0,
            highMid: 0,
            treble: 0,
            pitch: 440,
            volume: 0
        };
        
        // Note frequencies for pitch detection
        this.noteFrequencies = this._generateNoteFrequencies();
    }
    
    /**
     * Process audio data into visualization parameters
     * @param {Object} audioData - Audio analysis data
     * @returns {Object} Visualization parameters for MVEP
     */
    process(audioData) {
        if (!audioData || !audioData.frequencyData) {
            return this._getDefaultParams();
        }
        
        // Extract frequency bands
        const bands = this._extractFrequencyBands(audioData.frequencyData, audioData.sampleRate);
        
        // Smooth values over time
        this._smoothValues(bands);
        
        // Detect pitch if enabled
        let pitch = 440;
        if (this.options.pitchTracking && audioData.frequencyData) {
            pitch = this._detectPitch(audioData.frequencyData, audioData.sampleRate);
            this.smoothedValues.pitch = this._smooth(this.smoothedValues.pitch, pitch, 0.9);
        }
        
        // Calculate overall volume
        const volume = this._calculateVolume(audioData.frequencyData);
        this.smoothedValues.volume = this._smooth(this.smoothedValues.volume, volume, this.options.smoothingFactor);
        
        // Map to visualization parameters
        return {
            dimension: this._mapVolumeToDimension(this.smoothedValues.volume),
            morphing: this._mapBassToMorphing(this.smoothedValues.bass),
            color: this._mapPitchToColor(this.smoothedValues.pitch),
            rotation: this._mapMidToRotation(this.smoothedValues.lowMid, this.smoothedValues.highMid),
            density: this._mapTrebleToDensity(this.smoothedValues.treble),
            
            // Raw audio values for custom processing
            audio: {
                bass: this.smoothedValues.bass,
                lowMid: this.smoothedValues.lowMid,
                highMid: this.smoothedValues.highMid,
                treble: this.smoothedValues.treble,
                pitch: this.smoothedValues.pitch,
                volume: this.smoothedValues.volume,
                note: this._frequencyToNote(this.smoothedValues.pitch)
            }
        };
    }
    
    /**
     * Extract frequency band amplitudes
     * @private
     */
    _extractFrequencyBands(frequencyData, sampleRate) {
        const nyquist = sampleRate / 2;
        const binHz = nyquist / frequencyData.length;
        
        const bands = {};
        
        this.bandRanges.forEach(band => {
            const startBin = Math.floor(band.min / binHz);
            const endBin = Math.ceil(band.max / binHz);
            
            let sum = 0;
            let count = 0;
            
            for (let i = startBin; i < endBin && i < frequencyData.length; i++) {
                sum += frequencyData[i];
                count++;
            }
            
            const average = count > 0 ? sum / count : 0;
            bands[band.name] = (average / 255) * band.weight * this.options.sensitivity;
        });
        
        return bands;
    }
    
    /**
     * Smooth values over time
     * @private
     */
    _smoothValues(bands) {
        Object.keys(bands).forEach(key => {
            this.smoothedValues[key] = this._smooth(
                this.smoothedValues[key],
                bands[key],
                this.options.smoothingFactor
            );
        });
    }
    
    /**
     * Apply exponential smoothing
     * @private
     */
    _smooth(oldValue, newValue, factor) {
        return oldValue * factor + newValue * (1 - factor);
    }
    
    /**
     * Simple pitch detection using autocorrelation
     * @private
     */
    _detectPitch(frequencyData, sampleRate) {
        // Find the frequency bin with maximum amplitude
        let maxAmplitude = 0;
        let maxBin = 0;
        
        for (let i = 0; i < frequencyData.length / 2; i++) {
            if (frequencyData[i] > maxAmplitude) {
                maxAmplitude = frequencyData[i];
                maxBin = i;
            }
        }
        
        // Convert bin to frequency
        const nyquist = sampleRate / 2;
        const frequency = (maxBin / (frequencyData.length / 2)) * nyquist;
        
        // Only return valid musical frequencies
        if (frequency >= 80 && frequency <= 2000 && maxAmplitude > 30) {
            return frequency;
        }
        
        return this.smoothedValues.pitch; // Keep previous pitch
    }
    
    /**
     * Calculate overall volume
     * @private
     */
    _calculateVolume(frequencyData) {
        let sum = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            sum += frequencyData[i];
        }
        return (sum / frequencyData.length) / 255;
    }
    
    /**
     * Map volume to 4D dimension
     * @private
     */
    _mapVolumeToDimension(volume) {
        // Map volume 0-1 to dimension 3.0-4.2
        return 3.0 + volume * 1.2;
    }
    
    /**
     * Map bass frequencies to morphing
     * @private
     */
    _mapBassToMorphing(bass) {
        // Bass directly controls morphing factor
        return Math.min(bass, 1.0);
    }
    
    /**
     * Map pitch to color
     * @private
     */
    _mapPitchToColor(pitch) {
        // Map pitch to color spectrum (logarithmic scale)
        const minPitch = 80;   // E2
        const maxPitch = 2000; // B6
        
        const logPitch = Math.log(pitch);
        const logMin = Math.log(minPitch);
        const logMax = Math.log(maxPitch);
        
        const normalized = (logPitch - logMin) / (logMax - logMin);
        return Math.max(0, Math.min(1, normalized));
    }
    
    /**
     * Map mid frequencies to rotation speed
     * @private
     */
    _mapMidToRotation(lowMid, highMid) {
        // Average of mid frequencies affects rotation
        const midAverage = (lowMid + highMid) / 2;
        return 0.5 + midAverage * 1.5; // 0.5 to 2.0
    }
    
    /**
     * Map treble to grid density
     * @private
     */
    _mapTrebleToDensity(treble) {
        // High frequencies increase visual complexity
        return 0.5 + treble * 1.5; // 0.5 to 2.0
    }
    
    /**
     * Generate note frequency table
     * @private
     */
    _generateNoteFrequencies() {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const a4Frequency = 440;
        const frequencies = {};
        
        for (let octave = 0; octave <= 8; octave++) {
            notes.forEach((note, index) => {
                const halfSteps = (octave - 4) * 12 + index - 9; // A4 is 9 semitones above C4
                const frequency = a4Frequency * Math.pow(2, halfSteps / 12);
                frequencies[`${note}${octave}`] = frequency;
            });
        }
        
        return frequencies;
    }
    
    /**
     * Convert frequency to nearest note
     * @private
     */
    _frequencyToNote(frequency) {
        let closestNote = 'A4';
        let minDiff = Infinity;
        
        Object.entries(this.noteFrequencies).forEach(([note, freq]) => {
            const diff = Math.abs(freq - frequency);
            if (diff < minDiff) {
                minDiff = diff;
                closestNote = note;
            }
        });
        
        return closestNote;
    }
    
    /**
     * Get default visualization parameters
     * @private
     */
    _getDefaultParams() {
        return {
            dimension: 3.0,
            morphing: 0.0,
            color: 0.5,
            rotation: 1.0,
            density: 1.0,
            audio: {
                bass: 0,
                lowMid: 0,
                highMid: 0,
                treble: 0,
                pitch: 440,
                volume: 0,
                note: 'A4'
            }
        };
    }
    
    /**
     * Create audio analyzer for Web Audio API
     * @param {AudioContext} audioContext - Web Audio context
     * @param {MediaStreamAudioSourceNode} source - Audio source
     * @returns {AnalyserNode} Configured analyzer
     */
    createAnalyzer(audioContext, source) {
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 2048;
        analyzer.smoothingTimeConstant = this.options.smoothingFactor;
        
        source.connect(analyzer);
        
        return analyzer;
    }
    
    /**
     * Process live audio stream
     * @param {AnalyserNode} analyzer - Web Audio analyzer
     * @param {Function} onUpdate - Callback for parameter updates
     */
    processStream(analyzer, onUpdate) {
        const frequencyData = new Uint8Array(analyzer.frequencyBinCount);
        const sampleRate = analyzer.context.sampleRate;
        
        const update = () => {
            analyzer.getByteFrequencyData(frequencyData);
            
            const params = this.process({
                frequencyData: frequencyData,
                sampleRate: sampleRate
            });
            
            onUpdate(params);
            
            requestAnimationFrame(update);
        };
        
        update();
    }
}

export default AudioInputPlugin;