/**
 * visualizer-main.js - v1.7
 * Standalone script for HyperAudioVisualizer (Web Audio Input).
 * - Enhanced audio reactivity: Audio levels modulate visual parameters.
 * - Added dissonance proxy affecting color shift.
 * - Added more detailed logging for audio analysis.
 * - Improved browser compatibility for microphone access
 * - Added fallback visualization with patterned random data
 * - Optimized audio analysis parameters for better visual performance
 * - Added collapsible controls menu
 * - Implemented touch-based parameter controls on the visualization
 * - Added glassmorphism and magnification effects
 * - Integrated modular sound interface for improved audio processing
 */
import HypercubeCore from '../core/HypercubeCore.js';
import ShaderManager from '../core/ShaderManager.js';
import GeometryManager from '../core/GeometryManager.js';
import ProjectionManager from '../core/ProjectionManager.js';
import SoundInterface from '../sound/SoundInterface.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('hypercube-canvas');
    const statusDiv = document.getElementById('status');
    if (!canvas) { statusDiv.textContent = "Error: Canvas not found."; return; }

    // DOM Elements
    const sliders = {
        morphFactor: document.getElementById('morphFactor'), dimension: document.getElementById('dimension'),
        rotationSpeed: document.getElementById('rotationSpeed'), gridDensity: document.getElementById('gridDensity'),
        lineThickness: document.getElementById('lineThickness'), patternIntensity: document.getElementById('patternIntensity'),
        universeModifier: document.getElementById('universeModifier'), colorShift: document.getElementById('colorShift'),
        glitchIntensity: document.getElementById('glitchIntensity'),
    };
    const valueDisplays = {}; for (const key in sliders) { if(sliders[key]) valueDisplays[key] = document.getElementById(`${sliders[key].id}-value`); }
    const geometrySelect = document.getElementById('geometryType'); const projectionSelect = document.getElementById('projectionMethod');
    const reactivityIndicator = document.querySelector('.reactivity-indicator');
    
    // Add click handler to reactivity indicator to manually trigger mic permission
    if (reactivityIndicator) {
        reactivityIndicator.addEventListener('click', async () => {
            // Only try to setup audio if not already set up
            if (!audioContext || !analyser) {
                statusDiv.textContent = "Requesting microphone access...";
                const audioReady = await setupAudio();
                if (audioReady) {
                    statusDiv.textContent = "Mic connected successfully!";
                    reactivityIndicator.textContent = "AUDIO REACTIVE (MIC)";
                    reactivityIndicator.style.borderColor = "#00ff80";
                } else {
                    statusDiv.textContent = "Microphone access denied or error";
                    reactivityIndicator.textContent = "CLICK FOR MIC ACCESS";
                }
            }
        });
        
        // Set initial text to prompt for click
        reactivityIndicator.textContent = "CLICK FOR MIC ACCESS";
        reactivityIndicator.style.cursor = "pointer";
    }

    // State
    let gl = null, audioContext = null, analyser = null, micSource = null;
    let mainVisualizerCore = null, geometryManager = null, projectionManager = null, shaderManager = null;
    
    // Enhanced audio analysis data including pitch detection
    let analysisData = { 
        bass: 0, mid: 0, high: 0, 
        bassSmooth: 0, midSmooth: 0, highSmooth: 0,
        dominantPitch: 0,        // Frequency of dominant pitch in Hz
        dominantPitchValue: 0,   // Strength of dominant pitch 0-1
        pitch: {                 // Structured pitch data
            frequency: 0,        // Detected pitch in Hz
            note: 'A',           // Musical note (A-G)
            octave: 4,           // Octave number
            cents: 0,            // Cents deviation from perfect pitch (-50 to +50)
            inTune: false        // Whether the note is in tune (within ±15 cents)
        }
    };
    
    // Audio analysis arrays
    let freqData = null;
    let timeData = null;
    
    // Musical note reference frequencies - A4 = 440Hz
    const NOTE_FREQUENCIES = {
        'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 
        'E': 329.63, 'F': 349.23, 'F#': 369.99, 
        'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };
    
    let visualParams = { // Stores BASE values from sliders
        morphFactor: 0.7, dimension: 4.0, rotationSpeed: 0.5, gridDensity: 8.0,
        lineThickness: 0.03, patternIntensity: 1.3, universeModifier: 1.0,
        colorShift: 0.0, glitchIntensity: 0.02,
        // Default derived params (will be updated by lineThickness slider)
        shellWidth: 0.025, tetraThickness: 0.035,
        // Color parameters for pitch-based visualization
        hue: 0.5,             // Base hue value (0-1)
        saturation: 0.8,      // Base saturation value
        brightness: 0.9,      // Base brightness value
        rgbOffset: 0.0        // RGB color offset (for moiré effects)
    };
    
    // Transient detection
    let lastEnergy = 0;       // For transient smoothing
    let lastPitch = 0;        // For pitch changes detection

    async function setupAudio() {
        try {
            // Create audio context with fallback
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context (needed for some browsers)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            // Setup analyzer with larger FFT for better resolution and pitch detection
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048; // Larger FFT size for better frequency resolution
            analyser.smoothingTimeConstant = 0.4; // Less smoothing for faster reaction
            freqData = new Uint8Array(analyser.frequencyBinCount);
            timeData = new Uint8Array(analyser.fftSize); // Time domain data for pitch detection
            
            // Request mic access with explicit constraints
            statusDiv.textContent = "Requesting Mic...";
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
            micSource = audioContext.createMediaStreamSource(stream);
            micSource.connect(analyser);
            
            // Add a dummy node to keep audio context active
            const dummyNode = audioContext.createGain();
            dummyNode.gain.value = 0;
            analyser.connect(dummyNode);
            dummyNode.connect(audioContext.destination);
            
            // Debug info
            console.log("Audio setup complete:", {
                "Audio Context State": audioContext.state,
                "Sample Rate": audioContext.sampleRate,
                "FFT Size": analyser.fftSize,
                "Frequency Bins": analyser.frequencyBinCount
            });
            
            statusDiv.textContent = "Mic OK - Visualizer Active"; 
            
            // Forcing initial audio calculation
            calculateAudioLevels();
            
            return true;
        } catch (err) { 
            console.error("Audio setup error:", err); 
            statusDiv.textContent = `Error: ${err.message}.`; 
            
            // Cleanup on error
            if (audioContext?.state !== 'closed') audioContext?.close(); 
            audioContext = null; 
            analyser = null; 
            return false; 
        }
    }

    // Detect musical pitch from frequency data
    function detectPitch(frequencyData, sampleRate) {
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
        const noteIndex = (a4Index + roundedSemitoneDistance) % 12;
        
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
    
    function calculateAudioLevels() {
        if (!analyser || !freqData) {
            console.warn("Audio analyzer not available");
            return;
        }
        
        try {
            // Get both frequency and time domain data
            analyser.getByteFrequencyData(freqData);
            analyser.getByteTimeDomainData(timeData);
            
            // Check if we're getting any audio signal
            const hasAudioSignal = freqData.some(value => value > 0);
            if (!hasAudioSignal) {
                console.warn("No audio signal detected - check microphone permissions and input");
                
                // Generate simulated data with musical patterns
                const simulationTime = Date.now() / 1000;
                const notePattern = Math.floor(simulationTime % 8); // Cycle through 8 patterns
                
                // Simulate a series of musical notes
                const simulatedNotes = ['C', 'E', 'G', 'B', 'D', 'F', 'A'];
                const simulatedOctaves = [3, 4, 5];
                const noteIndex = Math.floor(simulationTime * 0.5) % simulatedNotes.length;
                const octaveIndex = Math.floor(simulationTime * 0.2) % simulatedOctaves.length;
                
                // Set simulated pitch data - more dynamic with wider octave range
                analysisData.pitch = {
                    frequency: NOTE_FREQUENCIES[simulatedNotes[noteIndex]] * Math.pow(2, simulatedOctaves[octaveIndex] - 4),
                    note: simulatedNotes[noteIndex],
                    octave: simulatedOctaves[octaveIndex],
                    cents: (Math.sin(simulationTime * 0.3) * 50).toFixed(0),
                    inTune: Math.random() > 0.7,
                    strength: 0.8 + Math.random() * 0.2 // High strength for vibrant colors
                };
                
                // Set simulated frequency band data - more dynamic for testing
                // Create patterns that emphasize mid-range (human audible) frequencies
                const pulseRate = Math.sin(simulationTime * 0.8) * 0.5 + 0.5;
                analysisData.bass = 0.3 + Math.random() * 0.3 + pulseRate * 0.3;
                analysisData.mid = 0.4 + Math.random() * 0.4 + pulseRate * 0.2;
                analysisData.high = 0.2 + Math.random() * 0.3 + pulseRate * 0.1;
                
                // Apply smoothing
                const alpha = 0.2;
                analysisData.bassSmooth = analysisData.bassSmooth * (1 - alpha) + analysisData.bass * alpha;
                analysisData.midSmooth = analysisData.midSmooth * (1 - alpha) + analysisData.mid * alpha;
                analysisData.highSmooth = analysisData.highSmooth * (1 - alpha) + analysisData.high * alpha;
                
                // Update status occasionally
                if (Math.random() < 0.01) {
                    statusDiv.textContent = `Simulated Note: ${analysisData.pitch.note}${analysisData.pitch.octave}`;
                }
                
                return;
            }
            
            // Calculate frequency bands
            const bufferLength = analyser.frequencyBinCount;
            const nyquist = audioContext.sampleRate / 2;
            const bassBand = [20, 250], midBand = [250, 4000], highBand = [4000, 12000];
            const freqPerBin = nyquist / bufferLength;
            
            let bassSum = 0, midSum = 0, highSum = 0;
            let bassCount = 0, midCount = 0, highCount = 0;
            let maxEnergyBin = 0, maxEnergy = 0;
            
            // Analyze frequency bands
            for (let i = 0; i < bufferLength; i++) {
                const freq = i * freqPerBin;
                const value = freqData[i] / 255.0;
                
                // Track maximum energy bin for dominant frequency
                if (freqData[i] > maxEnergy && freq > 80) { // Ignore very low frequencies
                    maxEnergy = freqData[i];
                    maxEnergyBin = i;
                }
                
                if (freq >= bassBand[0] && freq < bassBand[1]) { 
                    bassSum += value; 
                    bassCount++; 
                } else if (freq >= midBand[0] && freq < midBand[1]) { 
                    midSum += value; 
                    midCount++; 
                } else if (freq >= highBand[0] && freq < highBand[1]) { 
                    highSum += value; 
                    highCount++; 
                }
            }
            
            // Calculate averages with safety checks
            const bassAvg = bassCount > 0 ? bassSum / bassCount : 0;
            const midAvg = midCount > 0 ? midSum / midCount : 0;
            const highAvg = highCount > 0 ? highSum / highCount : 0;
            
            // Set dominant frequency and strength
            analysisData.dominantPitch = maxEnergyBin * freqPerBin;
            analysisData.dominantPitchValue = maxEnergy / 255.0;
            
            // Perform pitch detection
            const pitchData = detectPitch(freqData, audioContext.sampleRate);
            analysisData.pitch = pitchData;
            
            // Update raw values
            analysisData.bass = bassAvg;
            analysisData.mid = midAvg;
            analysisData.high = highAvg;
            
            // Apply smoothing with proper alpha value
            const alpha = 0.15;
            analysisData.bassSmooth = analysisData.bassSmooth * (1 - alpha) + analysisData.bass * alpha;
            analysisData.midSmooth = analysisData.midSmooth * (1 - alpha) + analysisData.mid * alpha;
            analysisData.highSmooth = analysisData.highSmooth * (1 - alpha) + analysisData.high * alpha;
            
            // Log values occasionally for debugging
            if (Math.random() < 0.01) {
                const noteInfo = pitchData.frequency > 0 
                    ? `Note: ${pitchData.note}${pitchData.octave} (${pitchData.cents > 0 ? '+' : ''}${pitchData.cents}¢)` 
                    : 'No pitch detected';
                    
                console.log(`Audio: Bass=${analysisData.bassSmooth.toFixed(2)} Mid=${analysisData.midSmooth.toFixed(2)} High=${analysisData.highSmooth.toFixed(2)} | ${noteInfo}`);
                
                // Update status with pitch information
                statusDiv.textContent = noteInfo;
            }
        } catch (err) {
            console.error("Error analyzing audio:", err);
            
            // Fallback to random values for testing
            analysisData.bass = 0.1 + Math.random() * 0.3;
            analysisData.mid = 0.2 + Math.random() * 0.3;
            analysisData.high = 0.1 + Math.random() * 0.2;
            
            // Apply smoothing
            const alpha = 0.2;
            analysisData.bassSmooth = analysisData.bassSmooth * (1 - alpha) + analysisData.bass * alpha;
            analysisData.midSmooth = analysisData.midSmooth * (1 - alpha) + analysisData.mid * alpha;
            analysisData.highSmooth = analysisData.highSmooth * (1 - alpha) + analysisData.high * alpha;
        }
    }

    function setupControls() {
        for (const key in sliders) {
            const slider = sliders[key]; const display = valueDisplays[key];
            if (slider && display) {
                const step = slider.step; const decimals = step.includes('.') ? step.split('.')[1].length : 0;
                visualParams[key] = parseFloat(slider.value); display.textContent = visualParams[key].toFixed(decimals);
                slider.addEventListener('input', () => {
                    visualParams[key] = parseFloat(slider.value); display.textContent = visualParams[key].toFixed(decimals);
                    if(key === 'lineThickness') { visualParams.shellWidth = visualParams.lineThickness*0.8; visualParams.tetraThickness = visualParams.lineThickness*1.1; if(mainVisualizerCore){ mainVisualizerCore.state._dirtyUniforms.add('u_shellWidth'); mainVisualizerCore.state._dirtyUniforms.add('u_tetraThickness');}}
                    if(mainVisualizerCore) mainVisualizerCore.updateParameters({ [key]: visualParams[key] }); // Direct update
                    const wrapper = slider.closest('.slider-wrapper'); if(wrapper) { const min=parseFloat(slider.min), max=parseFloat(slider.max), val=visualParams[key]; const progress=(max===min)?0:(val-min)/(max-min); wrapper.style.setProperty('--slider-progress', Math.max(0,Math.min(1,progress)).toFixed(3)); }
                });
                 const wrapper = slider.closest('.slider-wrapper'); if(wrapper) { const min=parseFloat(slider.min), max=parseFloat(slider.max), val=visualParams[key]; const progress=(max===min)?0:(val-min)/(max-min); wrapper.style.setProperty('--slider-progress', Math.max(0,Math.min(1,progress)).toFixed(3)); }
            }
        }
        geometrySelect?.addEventListener('change', (e) => { mainVisualizerCore?.updateParameters({ geometryType: e.target.value }); });
        projectionSelect?.addEventListener('change', (e) => { mainVisualizerCore?.updateParameters({ projectionMethod: e.target.value }); });
        console.log("Controls initialized.");
    }

    function mainUpdateLoop() {
        if (!mainVisualizerCore?.state?.isRendering) return;
        if (analyser) calculateAudioLevels();

        // Calculate audio-influenced factors
        const dissonanceFactor = analysisData.midSmooth * analysisData.highSmooth * 2.0;
        const energyFactor = (analysisData.bassSmooth + analysisData.midSmooth) * 0.5;
        const transientFactor = Math.max(0, analysisData.highSmooth - lastEnergy) * 2.0;
        lastEnergy = analysisData.highSmooth * 0.8; // Update transient tracking with decay
        
        // Calculate pitch-based color parameters (cyclic through spectrum each octave)
        let pitchHue = 0.5; // Default hue
        let pitchSaturation = 0.8; // Default saturation
        let pitchBrightness = 0.9; // Default brightness
        let tuningOffset = 0; // Moiré effect based on tuning
        
        // Only process pitch if we have valid data
        if (analysisData.pitch.frequency > 0) {
            // Map note to hue (C=red, moving through spectrum)
            const noteMap = {'C': 0, 'C#': 0.083, 'D': 0.167, 'D#': 0.25, 'E': 0.333, 
                             'F': 0.417, 'F#': 0.5, 'G': 0.583, 'G#': 0.667, 'A': 0.75, 
                             'A#': 0.833, 'B': 0.917};
            
            // Base hue on note
            const baseHue = noteMap[analysisData.pitch.note] || 0;
            
            // Adjust hue based on octave - full spectrum shift for more color variation
            pitchHue = (baseHue + (analysisData.pitch.octave % 7) * 0.14) % 1.0;
            
            // Adjust saturation to be more vibrant - higher baseline for neon effect
            pitchSaturation = 0.85 + analysisData.pitch.strength * 0.15;
            
            // Adjust brightness based on octave - emphasize neon effect
            // Most vibrant in human hearing range (octaves 2-7)
            const humanAudibleRange = Math.max(0.0, 1.0 - Math.abs(analysisData.pitch.octave - 4.5) / 3.0);
            pitchBrightness = 0.6 + humanAudibleRange * 0.6;
            
            // RGB moiré effect based on tuning (sharp or flat)
            // Enhanced effect with more dramatic offset for neon chromatic aberration
            if (!analysisData.pitch.inTune) {
                // Increase the effect when further from perfect tuning
                const intensity = Math.abs(analysisData.pitch.cents) / 50.0; // 0 to 1.0
                tuningOffset = analysisData.pitch.cents / 50.0 * (1.0 + intensity * 2.0); // Amplified effect
            } else {
                // Small random variation even when in tune for visual interest
                tuningOffset = (Math.random() * 0.04 - 0.02) * analysisData.pitch.strength;
            }
        } else {
            // No pitch detected - use energy-based fallback with intense neon colors
            pitchHue = (Date.now() * 0.0001) % 1.0; // Slowly cycle through colors
            
            // Higher saturation baseline for neon effect
            pitchSaturation = 0.9 + energyFactor * 0.1;
            
            // Reduce brightness at extreme frequencies (outside human range)
            // Maximum brightness in mid-frequency response
            const midEnergyFactor = (analysisData.midSmooth / (analysisData.bassSmooth + analysisData.highSmooth + 0.01));
            pitchBrightness = 0.5 + midEnergyFactor * 0.7 + analysisData.highSmooth * 0.3;
        }
        
        // Update parameters with pitch-based colors
        visualParams.hue = pitchHue;
        visualParams.saturation = pitchSaturation;
        visualParams.brightness = pitchBrightness;
        visualParams.rgbOffset = tuningOffset;
        
        // Calculate reactivity mappings for each parameter
        const paramMappings = {
            morphFactor: {
                // Make morph factor respond to pitch octave (higher = more morph)
                factor: analysisData.pitch.frequency > 0 
                    ? 0.4 + (analysisData.pitch.octave / 6) * 0.8 + transientFactor * 0.5
                    : 0.8 + analysisData.midSmooth * 1.8 + transientFactor * 0.7,
                primary: 'pitch',
                secondary: 'transient',
                pulseThreshold: 0.3
            },
            dimension: {
                // Link dimension to note (C=3, B=5)
                factor: analysisData.pitch.frequency > 0
                    ? 3.0 + (noteMap[analysisData.pitch.note] || 0) * 2.0
                    : 0.65 + analysisData.bassSmooth * 0.6 + analysisData.midSmooth * 0.3,
                primary: 'pitch',
                secondary: 'bass',
                pulseThreshold: 0.4
            },
            rotationSpeed: {
                // Higher notes rotate faster
                factor: analysisData.pitch.frequency > 0
                    ? 0.2 + (analysisData.pitch.octave / 8) * 2.0 + analysisData.midSmooth * 1.0
                    : 0.8 + analysisData.midSmooth * 3.0 + analysisData.highSmooth * 2.0, 
                primary: 'pitch',
                secondary: 'mid',
                pulseThreshold: 0.25
            },
            gridDensity: {
                // Grid density varies with pitch - density changes with each octave
                factor: analysisData.pitch.frequency > 0
                    ? 4.0 + ((analysisData.pitch.octave % 3) * 3.0) + analysisData.bassSmooth * 6.0
                    : 0.5 + analysisData.bassSmooth * 2.2 + transientFactor * 0.7,
                primary: 'pitch',
                secondary: 'bass',
                pulseThreshold: 0.4
            },
            lineThickness: {
                // Line thickness varies inversely with note - high notes have thinner lines
                factor: analysisData.pitch.frequency > 0
                    ? 1.5 - ((analysisData.pitch.octave - 2) / 6) * 0.8
                    : 1.5 - analysisData.highSmooth * 1.0 + analysisData.bassSmooth * 0.3,
                primary: 'pitch',
                secondary: 'high',
                pulseThreshold: 0.5,
                inverse: true
            },
            patternIntensity: {
                // Pattern intensity stronger for sharper/flatter notes (detuning)
                factor: analysisData.pitch.frequency > 0
                    ? 0.7 + Math.abs(analysisData.pitch.cents / 50.0) * 1.5 + transientFactor * 0.5
                    : 0.8 + analysisData.midSmooth * 1.5 + transientFactor * 1.1,
                primary: 'tuning',
                secondary: 'transient',
                pulseThreshold: 0.25
            },
            universeModifier: {
                // Universe modifier changes with note scale degree
                factor: analysisData.pitch.frequency > 0
                    ? 0.5 + (noteMap[analysisData.pitch.note] || 0) * 1.5
                    : 0.7 + analysisData.bassSmooth * 1.2 + dissonanceFactor * 0.4,
                primary: 'note',
                secondary: 'bass',
                pulseThreshold: 0.4
            },
            glitchIntensity: {
                // Glitch more when out of tune
                factor: analysisData.pitch.frequency > 0
                    ? 0.01 + (analysisData.pitch.inTune ? 0 : (Math.abs(analysisData.pitch.cents) / 50.0) * 0.08)
                    : 0.02 + analysisData.highSmooth * 0.08 + transientFactor * 0.1,
                primary: 'tuning',
                secondary: 'transient',
                pulseThreshold: 0.2,
                additive: true
            },
            colorShift: {
                // Color shift based on tuning (sharp = positive, flat = negative)
                factor: analysisData.pitch.frequency > 0
                    ? analysisData.pitch.cents / 50.0  // -1.0 to 1.0 range
                    : 1.2 + (dissonanceFactor * 1.5) + (energyFactor - 0.1) * 0.8,
                primary: 'tuning',
                secondary: 'energy',
                pulseThreshold: 0.3,
                bipolar: true
            }
        };
        
        // Get note map for dimension/universe calculations
        const noteMap = {'C': 0, 'C#': 0.083, 'D': 0.167, 'D#': 0.25, 'E': 0.333, 
                         'F': 0.417, 'F#': 0.5, 'G': 0.583, 'G#': 0.667, 'A': 0.75, 
                         'A#': 0.833, 'B': 0.917};
        
        // Calculate fully reactive parameters
        const effectiveParams = {
            shellWidth: visualParams.shellWidth * (0.7 + analysisData.midSmooth * 1.8 + analysisData.bassSmooth * 0.4),
            tetraThickness: visualParams.tetraThickness * (1.3 - analysisData.highSmooth * 0.9 + analysisData.bassSmooth * 0.3),
            audioLevels: { bass: analysisData.bassSmooth, mid: analysisData.midSmooth, high: analysisData.highSmooth },
            
            // Add pitch-based color parameters
            hue: visualParams.hue,
            saturation: visualParams.saturation,
            brightness: visualParams.brightness,
            rgbOffset: visualParams.rgbOffset,
            
            // Adding additional projection parameters based on pitch
            projectionDistance: analysisData.pitch.frequency > 0 
                ? 2.0 + (analysisData.pitch.octave - 3) * 0.5
                : 2.0 + analysisData.bassSmooth * 1.0,
                
            projectionAngle: analysisData.pitch.frequency > 0
                ? (noteMap[analysisData.pitch.note] || 0) * Math.PI * 2
                : (Date.now() * 0.0005) % (Math.PI * 2)
        };
        
        // Calculate each parameter based on its mapping
        for (const key in paramMappings) {
            const mapping = paramMappings[key];
            
            if (mapping.additive) {
                // Additive parameters add to base value instead of multiplying
                effectiveParams[key] = visualParams[key] + 
                    (visualParams[key] * analysisData.highSmooth * 0.2) + 
                    (transientFactor * 0.3);
            } else if (mapping.bipolar) {
                // Bipolar parameters can go positive or negative from center
                effectiveParams[key] = visualParams[key] + 
                    (dissonanceFactor - 0.1) * 0.8 + 
                    (energyFactor - 0.2) * 0.5;
            } else {
                // Standard multiplicative parameters
                effectiveParams[key] = visualParams[key] * mapping.factor;
            }
        }

        // Update slider positions and add visual effects based on audio reactivity
        for (const key in sliders) {
            const slider = sliders[key];
            const display = valueDisplays[key];
            if (slider && display) {
                const min = parseFloat(slider.min);
                const max = parseFloat(slider.max);
                const step = slider.step;
                const decimals = step.includes('.') ? step.split('.')[1].length : 0;
                const value = effectiveParams[key];
                
                // Only update if value is valid
                if (value !== undefined && !isNaN(value)) {
                    // Clamp value to slider range
                    const clampedValue = Math.max(min, Math.min(max, value));
                    
                    // Update slider position visually (not the value to avoid feedback loops)
                    const progress = (max === min) ? 0 : (clampedValue - min) / (max - min);
                    const wrapper = slider.closest('.slider-wrapper');
                    if (wrapper) {
                        wrapper.style.setProperty('--slider-progress', Math.max(0, Math.min(1, progress)).toFixed(3));
                    }
                    
                    // Update value display with the effective parameter value
                    display.textContent = clampedValue.toFixed(decimals);
                    
                    // Add visual effects to sliders based on audio analysis
                    const controlGroup = slider.closest('.control-group');
                    const mapping = paramMappings[key];
                    
                    if (mapping) {
                        // Calculate pulse intensity based on primary and secondary audio bands
                        let pulseIntensity = 0;
                        
                        if (mapping.primary === 'bass') {
                            pulseIntensity = analysisData.bassSmooth * 1.5;
                        } else if (mapping.primary === 'mid') {
                            pulseIntensity = analysisData.midSmooth * 1.5;
                        } else if (mapping.primary === 'high') {
                            pulseIntensity = analysisData.highSmooth * 1.5;
                        } else if (mapping.primary === 'dissonance') {
                            pulseIntensity = dissonanceFactor * 1.2;
                        } else if (mapping.primary === 'energy') {
                            pulseIntensity = energyFactor * 1.2;
                        } else if (mapping.primary === 'transient') {
                            pulseIntensity = transientFactor * 2.0;
                        }
                        
                        // Limit pulse intensity
                        pulseIntensity = Math.min(1, pulseIntensity);
                        
                        if (wrapper) {
                            wrapper.style.setProperty('--pulse-intensity', pulseIntensity.toFixed(2));
                        }
                        
                        // Add 'active' class to control groups that exceed their pulse threshold
                        if (pulseIntensity > mapping.pulseThreshold) {
                            controlGroup?.classList.add('active');
                        } else {
                            controlGroup?.classList.remove('active');
                        }
                    } else {
                        // For parameters without mappings, use overall energy
                        const defaultPulse = Math.min(1, energyFactor * 1.2);
                        if (wrapper) {
                            wrapper.style.setProperty('--pulse-intensity', defaultPulse.toFixed(2));
                        }
                        
                        if (defaultPulse > 0.5) {
                            controlGroup?.classList.add('active');
                        } else {
                            controlGroup?.classList.remove('active');
                        }
                    }
                }
            }
        }

        // Clamp values to valid ranges
        effectiveParams.morphFactor = Math.max(0, Math.min(1.5, effectiveParams.morphFactor));
        effectiveParams.dimension = Math.max(3, Math.min(5, effectiveParams.dimension));
        effectiveParams.rotationSpeed = Math.max(0, Math.min(3, effectiveParams.rotationSpeed));
        effectiveParams.gridDensity = Math.max(1, Math.min(25, effectiveParams.gridDensity));
        effectiveParams.lineThickness = Math.max(0.002, Math.min(0.1, effectiveParams.lineThickness));
        effectiveParams.shellWidth = Math.max(0.005, Math.min(0.08, effectiveParams.shellWidth));
        effectiveParams.tetraThickness = Math.max(0.003, Math.min(0.1, effectiveParams.tetraThickness));
        effectiveParams.patternIntensity = Math.max(0, Math.min(3, effectiveParams.patternIntensity));
        effectiveParams.universeModifier = Math.max(0.3, Math.min(2.5, effectiveParams.universeModifier));
        effectiveParams.glitchIntensity = Math.max(0, Math.min(0.15, effectiveParams.glitchIntensity));
        effectiveParams.colorShift = Math.max(-1.0, Math.min(1.0, effectiveParams.colorShift));

        mainVisualizerCore.updateParameters(effectiveParams);
        requestAnimationFrame(mainUpdateLoop);
    }

    // Setup random audio data for fallback/testing
    function setupRandomAudioData() {
        console.log("Setting up random audio data");
        
        // Set up simple interval to generate fake audio data
        const randomAudioInterval = setInterval(() => {
            // Only use random data if real analyzer is not available
            if (!analyser) {
                // Generate slightly structured random values
                const time = Date.now() / 1000;
                const bassFactor = 0.5 + 0.4 * Math.sin(time * 0.33); // Slower bass rhythm
                const midFactor = 0.5 + 0.4 * Math.sin(time * 0.67);  // Medium mid rhythm
                const highFactor = 0.3 + 0.3 * Math.sin(time * 1.5);  // Faster high rhythm
                
                // Apply more dramatic random variations for exciting visuals
                analysisData.bass = 0.3 + bassFactor * Math.random() * 0.7;
                analysisData.mid = 0.3 + midFactor * Math.random() * 0.6;
                analysisData.high = 0.2 + highFactor * Math.random() * 0.6;
                
                // Add frequent dramatic peaks for more excitement
                if (Math.random() < 0.15) {
                    analysisData.bass += 0.6;
                }
                if (Math.random() < 0.18) {
                    analysisData.mid += 0.5;
                }
                if (Math.random() < 0.2) {
                    analysisData.high += 0.6;
                }
                
                // Create synchronized moments (all bands active at once)
                if (Math.random() < 0.03) {
                    analysisData.bass += 0.7;
                    analysisData.mid += 0.6;
                    analysisData.high += 0.5;
                }
                
                // Smooth the values
                const alpha = 0.25;
                analysisData.bassSmooth = analysisData.bassSmooth * (1 - alpha) + analysisData.bass * alpha;
                analysisData.midSmooth = analysisData.midSmooth * (1 - alpha) + analysisData.mid * alpha;
                analysisData.highSmooth = analysisData.highSmooth * (1 - alpha) + analysisData.high * alpha;
                
                // Clamp to valid range
                analysisData.bassSmooth = Math.min(1, Math.max(0, analysisData.bassSmooth));
                analysisData.midSmooth = Math.min(1, Math.max(0, analysisData.midSmooth));
                analysisData.highSmooth = Math.min(1, Math.max(0, analysisData.highSmooth));
            } else {
                // Real analyzer is now available, clear the interval
                clearInterval(randomAudioInterval);
            }
        }, 40); // 25fps random updates
    }

    // Setup collapsible controls
    function setupCollapsibleControls() {
        const controlsContainer = document.querySelector('.controls-container');
        const collapseToggle = document.getElementById('collapseToggle');
        const controlsContent = document.getElementById('controlsContent');
        
        if (!controlsContainer || !collapseToggle || !controlsContent) {
            console.warn("Collapsible controls elements not found");
            return;
        }
        
        // Store the content height for animation
        let contentHeight = controlsContent.scrollHeight;
        
        // Set initial height to ensure smooth animation
        controlsContent.style.maxHeight = contentHeight + 'px';
        
        // Toggle collapse state
        collapseToggle.addEventListener('click', () => {
            controlsContainer.classList.toggle('collapsed');
            
            // Update content height in case it changed
            if (!controlsContainer.classList.contains('collapsed')) {
                // Get the current scroll height and use it
                contentHeight = controlsContent.scrollHeight;
                controlsContent.style.maxHeight = contentHeight + 'px';
            }
        });
        
        // Update content height on window resize
        window.addEventListener('resize', () => {
            if (!controlsContainer.classList.contains('collapsed')) {
                contentHeight = controlsContent.scrollHeight;
                controlsContent.style.maxHeight = contentHeight + 'px';
            }
        });
        
        console.log("Collapsible controls initialized");
    }
    
    // Setup direct touch/mouse parameter controls
    function setupTouchControls() {
        const canvas = document.getElementById('hypercube-canvas');
        const touchIndicator = document.getElementById('touchIndicator');
        const paramInfo = document.getElementById('parameterInfo');
        const paramXValue = document.getElementById('paramXValue');
        const paramYValue = document.getElementById('paramYValue');
        
        if (!canvas || !touchIndicator || !paramInfo || !paramXValue || !paramYValue) {
            console.warn("Canvas or touch elements not found");
            return;
        }
        
        // Parameter mapping for X and Y axes
        const xAxisParameter = {
            name: "dimension",
            label: "Dimension",
            min: 3,
            max: 5,
            step: 0.01
        };
        
        const yAxisParameter = {
            name: "morphFactor",
            label: "Morph",
            min: 0,
            max: 1.5,
            step: 0.01
        };
        
        // Update parameter info display
        paramXValue.textContent = xAxisParameter.label;
        paramYValue.textContent = yAxisParameter.label;
        
        // Interaction state
        let isInteracting = false;
        
        // Function to handle parameter updates based on canvas coordinates
        function updateParameters(x, y) {
            // Get canvas dimensions
            const rect = canvas.getBoundingClientRect();
            const canvasWidth = rect.width;
            const canvasHeight = rect.height;
            
            // Calculate normalized position (0-1)
            const normalizedX = Math.max(0, Math.min(1, x / canvasWidth));
            const normalizedY = 1 - Math.max(0, Math.min(1, y / canvasHeight)); // Invert Y axis
            
            // Map to parameter ranges
            const xValue = xAxisParameter.min + normalizedX * (xAxisParameter.max - xAxisParameter.min);
            const yValue = yAxisParameter.min + normalizedY * (yAxisParameter.max - yAxisParameter.min);
            
            // Update visualizer parameters
            visualParams[xAxisParameter.name] = xValue;
            visualParams[yAxisParameter.name] = yValue;
            
            // Update the core visualizer
            mainVisualizerCore?.updateParameters({
                [xAxisParameter.name]: xValue,
                [yAxisParameter.name]: yValue
            });
            
            // Update corresponding sliders and displays
            updateSlider(xAxisParameter.name, xValue);
            updateSlider(yAxisParameter.name, yValue);
            
            // Position the touch indicator
            touchIndicator.style.left = `${x}px`;
            touchIndicator.style.top = `${y}px`;
            
            // Format parameter values for display
            const xValueFormatted = formatValue(xValue, xAxisParameter.step);
            const yValueFormatted = formatValue(yValue, yAxisParameter.step);
            
            // Update parameter info with current values
            paramXValue.textContent = `${xAxisParameter.label}: ${xValueFormatted}`;
            paramYValue.textContent = `${yAxisParameter.label}: ${yValueFormatted}`;
        }
        
        // Format numeric value according to step precision
        function formatValue(value, step) {
            const decimals = step.toString().includes('.') ? step.toString().split('.')[1].length : 0;
            return value.toFixed(decimals);
        }
        
        // Update a slider and its display
        function updateSlider(paramName, value) {
            const slider = document.getElementById(paramName);
            const display = document.getElementById(`${paramName}-value`);
            
            if (slider) {
                slider.value = value;
                
                // Update slider track fill
                const min = parseFloat(slider.min);
                const max = parseFloat(slider.max);
                const progress = (value - min) / (max - min);
                const wrapper = slider.closest('.slider-wrapper');
                if (wrapper) {
                    wrapper.style.setProperty('--slider-progress', progress.toFixed(3));
                }
                
                // Update value display
                if (display) {
                    const step = slider.step;
                    const decimals = step.includes('.') ? step.split('.')[1].length : 0;
                    display.textContent = value.toFixed(decimals);
                }
            }
        }
        
        // Mouse/touch event handlers
        function handleStart(e) {
            isInteracting = true;
            touchIndicator.classList.add('active');
            
            // Get coordinates
            const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
            const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
            
            // Get position relative to canvas
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            // Update parameters and visuals
            updateParameters(x, y);
            
            // Prevent default to avoid scrolling on touch devices
            e.preventDefault();
        }
        
        function handleMove(e) {
            if (!isInteracting) return;
            
            // Get coordinates
            const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
            const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
            
            // Get position relative to canvas
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            // Update parameters and visuals
            updateParameters(x, y);
            
            // Prevent default to avoid scrolling on touch devices
            e.preventDefault();
        }
        
        function handleEnd() {
            isInteracting = false;
            touchIndicator.classList.remove('active');
        }
        
        // Add event listeners
        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('touchstart', handleStart, { passive: false });
        
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('touchcancel', handleEnd);
        
        console.log("Direct touch/mouse parameter controls initialized");
    }

    async function initialize() {
        try {
            // Set status
            statusDiv.textContent = "Initializing WebGL...";
            
            // Initialize WebGL context with antialiasing
            gl = canvas.getContext('webgl', { 
                antialias: true,
                powerPreference: 'high-performance',
                desynchronized: true
            }) || canvas.getContext('experimental-webgl'); 
            
            if (!gl) throw new Error("WebGL context creation failed");
            
            // Initialize core managers
            statusDiv.textContent = "Creating geometry...";
            geometryManager = new GeometryManager();
            projectionManager = new ProjectionManager();
            
            // Initialize shader manager
            statusDiv.textContent = "Compiling shaders...";
            shaderManager = new ShaderManager(gl, geometryManager, projectionManager);
            
            // Setup UI controls
            setupControls();
            setupCollapsibleControls();
            setupTouchControls();
            
            // Apply glassmorphism effects to elements
            document.querySelectorAll('.selectors select, #status, .reactivity-indicator').forEach(el => {
                el.classList.add('glass-effect', 'magnify-effect');
            });
            
            // Create main visualizer core with error callback
            statusDiv.textContent = "Creating visualization core...";
            mainVisualizerCore = new HypercubeCore(canvas, shaderManager, {
                 geometryType: geometrySelect?.value ?? 'hypercube',
                 projectionMethod: projectionSelect?.value ?? 'perspective',
                 ...visualParams,
                 callbacks: { 
                     onError: (err) => { 
                         statusDiv.textContent = `Vis Error: ${err.message}`; 
                         console.error("Visualizer error:", err); 
                     },
                     onRender: () => {
                         // Optional render callback for frame timing
                     }
                 }
            });
            
            // Check if shaders compiled successfully
            if (!mainVisualizerCore.shaderManager.programs[mainVisualizerCore.state.shaderProgramName]) {
                throw new Error("Initial shader compilation failed");
            }
            
            // Log success
            console.log("Visualizer Core initialized successfully");
            statusDiv.textContent = "Visualization ready";
        } catch (err) { 
            console.error("Visualization initialization error:", err); 
            statusDiv.textContent = `Error: ${err.message}`; 
            return; 
        }
        
        // Set up fallback random audio data immediately
        setupRandomAudioData();
        
        // Start the visualization and render loop immediately with random data
        mainVisualizerCore.start(); 
        requestAnimationFrame(mainUpdateLoop);
        
        // Check if we're in an iframe in a web environment (likely to have permission issues)
        const isInIframe = window !== window.top;
        const isWebHosted = window.location.protocol.startsWith('http');
        
        // Don't auto-request microphone in hosted environments, wait for user click instead
        if (!isInIframe && !isWebHosted) {
            // If not in hosted environment, try to initialize audio automatically
            // This helps when running from local file system directly
            try {
                statusDiv.textContent = "Attempting to access microphone...";
                const audioReady = await setupAudio();
                
                if (audioReady) {
                    statusDiv.textContent = "Mic OK - Visualizer Active";
                    
                    // Update reactivity indicator
                    const reactivityIndicator = document.querySelector('.reactivity-indicator');
                    if (reactivityIndicator) {
                        reactivityIndicator.textContent = "AUDIO REACTIVE (MIC)";
                        reactivityIndicator.style.borderColor = "#00ff80";
                        reactivityIndicator.style.animation = 'pulseLabel 1.5s infinite';
                    }
                } else {
                    console.warn("Automatic microphone access failed, using simulation");
                }
            } catch (err) {
                console.error("Error during automatic audio setup:", err);
            }
        }
        
        console.log("Initialization complete - visualization running");
    }
    initialize();
});
