/**
 * visualizer-main.js - v1.5
 * Standalone script for HyperAudioVisualizer (Web Audio Input).
 * - Enhanced audio reactivity: Audio levels modulate visual parameters.
 * - Added dissonance proxy affecting color shift.
 * - Added more detailed logging for audio analysis.
 * - Improved browser compatibility for microphone access
 * - Added fallback visualization with patterned random data
 * - Optimized audio analysis parameters for better visual performance
 */
import HypercubeCore from '../core/HypercubeCore.js';
import ShaderManager from '../core/ShaderManager.js';
import GeometryManager from '../core/GeometryManager.js';
import ProjectionManager from '../core/ProjectionManager.js';
import VisualizerController from './VisualizerController.js'; // Import VisualizerController

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
    let currentDataSource = 'microphone'; // Added state variable
    
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
        // bass, mid, high and their smooth versions can be kept for specific UI mappings
        // or direct use if some logic still relies on these named versions for the first 3 channels.
        // However, the primary source for HypercubeCore will be dataChannelsSmooth.
        bass: 0, mid: 0, high: 0,
        bassSmooth: 0, midSmooth: 0, highSmooth: 0,
        dataChannels: Array(8).fill(0.0),       // Raw values from source
        dataChannelsSmooth: Array(8).fill(0.0), // Smoothed values for shaders
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

    function generateProceduralData(time) {
        const channels = [];
        for (let i = 0; i < 8; i++) {
            channels.push(0.5 + 0.5 * Math.sin(time * (0.5 + i * 0.3) + i * 0.5));
        }
        return channels;
    }

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
            updateDataChannels(); // Changed to new function name
            
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
    
    function updateDataChannels() {
        const currentTime = mainVisualizerCore?.state?.time ?? (performance.now() / 1000); // Get time for procedural

        if (currentDataSource === 'microphone') {
            if (!analyser || !freqData) {
                // This is the existing mic failure / simulation logic
                // Let's call this 'simulated_mic_failure' for clarity if we add it as a source
                // For now, if mic is selected but not working, it will use this existing fallback.
                // The console.warn will indicate this.
                console.warn("Audio analyzer not available for 'microphone' source. Using fallback simulation.");
                // ... (existing code for when !analyser)
                // This part already updates analysisData.bassSmooth, etc.
                // Ensure this part correctly updates analysisData.bass, mid, high too
                // and then they are smoothed.
                // The existing code:
                const simulationTime = Date.now() / 1000; //simulationTime was defined inside this block
                const notePattern = Math.floor(simulationTime % 8); // Cycle through 8 patterns
                
                // Simulate a series of musical notes
                const simulatedNotes = ['C', 'E', 'G', 'B', 'D', 'F', 'A'];
                const simulatedOctaves = [3, 4, 5];
                const noteIndex = Math.floor(simulationTime * 0.5) % simulatedNotes.length;
                const octaveIndex = Math.floor(simulationTime * 0.2) % simulatedOctaves.length;
                
                // Set simulated pitch data
                analysisData.pitch = {
                    frequency: NOTE_FREQUENCIES[simulatedNotes[noteIndex]] * Math.pow(2, simulatedOctaves[octaveIndex] - 4),
                    note: simulatedNotes[noteIndex],
                    octave: simulatedOctaves[octaveIndex],
                    cents: (Math.sin(simulationTime * 0.3) * 50).toFixed(0),
                    inTune: Math.random() > 0.7
                };
                
                // Set simulated frequency band data
                // analysisData.bass = 0.2 + Math.random() * 0.3; // old
                // analysisData.mid = 0.1 + Math.random() * 0.3; // old
                // analysisData.high = 0.05 + Math.random() * 0.2; // old
                const simMicData = Array(8).fill(0.0);
                simMicData[0] = 0.2 + Math.random() * 0.3;
                simMicData[1] = 0.1 + Math.random() * 0.3;
                simMicData[2] = 0.05 + Math.random() * 0.2;
                // Fill other channels with some random variations if desired
                for (let i = 3; i < 8; i++) {
                    simMicData[i] = Math.random() * 0.1;
                }
                analysisData.dataChannels = simMicData;
                
                // Apply smoothing
                const alpha = 0.2; // This alpha is from the original block
                for(let i=0; i<8; i++) {
                    analysisData.dataChannelsSmooth[i] = (analysisData.dataChannelsSmooth[i] === undefined ? 0.0 : analysisData.dataChannelsSmooth[i]) * (1 - alpha) + analysisData.dataChannels[i] * alpha;
                }
                analysisData.bassSmooth = analysisData.dataChannelsSmooth[0];
                analysisData.midSmooth = analysisData.dataChannelsSmooth[1];
                analysisData.highSmooth = analysisData.dataChannelsSmooth[2];
                
                // Update status occasionally
                if (statusDiv && Math.random() < 0.01) { // Added statusDiv check
                    statusDiv.textContent = `Simulated Note: ${analysisData.pitch.note}${analysisData.pitch.octave}`;
                }
                return; // Exit after handling this case.
            }
            
            // Original audio processing logic from calculateAudioLevels
            try {
                analyser.getByteFrequencyData(freqData);
                analyser.getByteTimeDomainData(timeData);
                // ... (rest of the original try block for audio processing)
                 // Check if we're getting any audio signal - this was inside the original try, makes sense here
                const hasAudioSignal = freqData.some(value => value > 0);
                if (!hasAudioSignal) { // This case should ideally not be hit if the outer if(!analyser) is true, but good for robustness
                    console.warn("No audio signal detected despite analyser being present - check microphone input");
                    // Fallback to simulation similar to above, or just zero out
                    analysisData.dataChannels.fill(0.0);
                    // Smoothing will then decay to zero
                    const alpha = 0.15;
                    for(let i=0; i<8; i++) {
                        analysisData.dataChannelsSmooth[i] = (analysisData.dataChannelsSmooth[i] === undefined ? 0.0 : analysisData.dataChannelsSmooth[i]) * (1 - alpha) + analysisData.dataChannels[i] * alpha;
                    }
                    analysisData.bassSmooth = analysisData.dataChannelsSmooth[0];
                    analysisData.midSmooth = analysisData.dataChannelsSmooth[1];
                    analysisData.highSmooth = analysisData.dataChannelsSmooth[2];
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
            const currentMicData = Array(8).fill(0.0);
            currentMicData[0] = bassAvg;
            currentMicData[1] = midAvg;
            currentMicData[2] = highAvg;
            // Optionally fill other channels, e.g. currentMicData[3] = analysisData.dominantPitchValue;
            analysisData.dataChannels = currentMicData;
            
            // Apply smoothing with proper alpha value
            const alpha = 0.15;
            for(let i=0; i<8; i++) {
                 analysisData.dataChannelsSmooth[i] = (analysisData.dataChannelsSmooth[i] === undefined ? 0.0 : analysisData.dataChannelsSmooth[i]) * (1 - alpha) + analysisData.dataChannels[i] * alpha;
            }
            analysisData.bassSmooth = analysisData.dataChannelsSmooth[0]; // Keep these for compatibility
            analysisData.midSmooth = analysisData.dataChannelsSmooth[1];
            analysisData.highSmooth = analysisData.dataChannelsSmooth[2];
            
            // Log values occasionally for debugging
            if (statusDiv && Math.random() < 0.01) { // Added statusDiv check
                const noteInfo = pitchData.frequency > 0 
                    ? `Note: ${pitchData.note}${pitchData.octave} (${pitchData.cents > 0 ? '+' : ''}${pitchData.cents}¢)` 
                    : 'No pitch detected';
                    
                console.log(`Audio: Bass=${analysisData.bassSmooth.toFixed(2)} Mid=${analysisData.midSmooth.toFixed(2)} High=${analysisData.highSmooth.toFixed(2)} | ${noteInfo}`);
                
                // Update status with pitch information
                statusDiv.textContent = noteInfo;
            }
            } catch (err) { // This is the original catch block for audio processing errors
                console.error("Error analyzing audio:", err);
                // Fallback to random values for testing
                const errorMicData = Array(8).fill(0.0);
                errorMicData[0] = 0.1 + Math.random() * 0.3;
                errorMicData[1] = 0.2 + Math.random() * 0.3;
                errorMicData[2] = 0.1 + Math.random() * 0.2;
                analysisData.dataChannels = errorMicData;

                // Apply smoothing
                const alpha = 0.2; // This alpha is from the original catch
                for(let i=0; i<8; i++) {
                    analysisData.dataChannelsSmooth[i] = (analysisData.dataChannelsSmooth[i] === undefined ? 0.0 : analysisData.dataChannelsSmooth[i]) * (1 - alpha) + analysisData.dataChannels[i] * alpha;
                }
                analysisData.bassSmooth = analysisData.dataChannelsSmooth[0];
                analysisData.midSmooth = analysisData.dataChannelsSmooth[1];
                analysisData.highSmooth = analysisData.dataChannelsSmooth[2];
            }
        } else if (currentDataSource === 'procedural') {
            const proceduralValues = generateProceduralData(currentTime);
            analysisData.dataChannels = [...proceduralValues]; // raw values
            const alpha = 0.15;
            for(let i=0; i<8; i++) {
                analysisData.dataChannelsSmooth[i] = (analysisData.dataChannelsSmooth[i] === undefined ? 0.0 : analysisData.dataChannelsSmooth[i]) * (1 - alpha) + analysisData.dataChannels[i] * alpha;
            }
            // Update bass/mid/high for compatibility if anything uses them by name
            analysisData.bassSmooth = analysisData.dataChannelsSmooth[0];
            analysisData.midSmooth = analysisData.dataChannelsSmooth[1];
            analysisData.highSmooth = analysisData.dataChannelsSmooth[2];

            if (statusDiv && Math.random() < 0.01) { // Update status occasionally
                statusDiv.textContent = `Procedural Data: CH1=${analysisData.bassSmooth.toFixed(2)} CH2=${analysisData.midSmooth.toFixed(2)} CH3=${analysisData.highSmooth.toFixed(2)}`; // Keep showing first 3 for status
            }
        }
        // Ensure that analysisData.pitch related objects are reset or handled if procedural data doesn't provide them
        if (currentDataSource !== 'microphone') {
            analysisData.pitch = { frequency: 0, note: 'N/A', octave: 0, cents: 0, inTune: false, strength: 0 };
            analysisData.dominantPitch = 0;
            analysisData.dominantPitchValue = 0;
        }
    }

    function setupControls() {
        for (const key in sliders) {
            const slider = sliders[key]; const display = valueDisplays[key];
            if (slider && display) {
                if (key === 'dimension') {
                    visualParams[key] = parseInt(slider.value, 10);
                    display.textContent = visualParams[key]; // No toFixed for integers
                    slider.addEventListener('input', () => {
                        visualParams[key] = parseInt(slider.value, 10);
                        display.textContent = visualParams[key];
                        if(mainVisualizerCore) mainVisualizerCore.updateParameters({ [key]: visualParams[key] });
                        // Slider progress for number input might need different handling or be omitted
                        // For now, let's assume styled-input doesn't use the --slider-progress CSS var directly
                    });
                } else {
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
        }
        // Update geometrySelect and projectionSelect to use vizController
        geometrySelect?.addEventListener('change', (e) => {
            if (vizController) {
                vizController.setPolytope(e.target.value);
            } else {
                mainVisualizerCore?.updateParameters({ geometryType: e.target.value });
            }
        });
        projectionSelect?.addEventListener('change', (e) => {
            if (vizController) {
                vizController.setVisualStyle({ core: { projectionMethod: e.target.value } });
            } else {
                mainVisualizerCore?.updateParameters({ projectionMethod: e.target.value });
            }
        });

        const dataSourceSelect = document.getElementById('dataSourceSelect');
        if (dataSourceSelect) {
            dataSourceSelect.addEventListener('change', (e) => {
                currentDataSource = e.target.value;
                console.log(`Data source changed to: ${currentDataSource}`);
                if (statusDiv) statusDiv.textContent = `Data source: ${currentDataSource}`;
                // If switching to microphone and it's not set up, prompt user or attempt setup
                if (currentDataSource === 'microphone' && (!audioContext || !analyser)) {
                    if (reactivityIndicator) { // reactivityIndicator is already defined
                        reactivityIndicator.textContent = "CLICK FOR MIC ACCESS";
                        reactivityIndicator.style.borderColor = "var(--accent-color-primary)"; // Reset style
                    }
                    // Optionally, trigger the mic setup directly, or rely on user click
                    // await setupAudio(); // This might be too aggressive
                } else if (currentDataSource === 'procedural') {
                    if (reactivityIndicator) {
                        reactivityIndicator.textContent = "PROCEDURAL DATA";
                        reactivityIndicator.style.borderColor = "#44ddff"; // Some other color
                    }
                }
                // Reset smoothed values to prevent jumps from last source
                analysisData.bassSmooth = 0; analysisData.midSmooth = 0; analysisData.highSmooth = 0;
            });
        }
        console.log("Controls initialized.");
    }

    function mainUpdateLoop() {
        if (!mainVisualizerCore?.state?.isRendering) return;
        updateDataChannels(); // Changed from calculateAudioLevels and removed if (analyser)

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
            
            // Adjust hue based on octave (cyclic shift)
            pitchHue = (baseHue + (analysisData.pitch.octave % 3) * 0.33) % 1.0;
            
            // Adjust saturation based on note strength
            pitchSaturation = 0.5 + analysisData.pitch.strength * 0.5;
            
            // Adjust brightness based on octave (higher octaves are brighter)
            const octaveOffset = Math.max(0, Math.min(1, (analysisData.pitch.octave - 2) / 5));
            pitchBrightness = 0.7 + octaveOffset * 0.3;
            
            // RGB moiré effect based on tuning (sharp or flat)
            // When in tune, the offset is 0
            if (!analysisData.pitch.inTune) {
                tuningOffset = analysisData.pitch.cents / 50.0; // -1.0 to 1.0
            }
        } else {
            // No pitch detected - use energy-based fallback
            pitchHue = (Date.now() * 0.0001) % 1.0; // Slowly cycle through colors
            pitchSaturation = 0.5 + energyFactor * 0.5;
            pitchBrightness = 0.7 + analysisData.highSmooth * 0.3;
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
            shellWidth: visualParams.shellWidth * (0.7 + analysisData.midSmooth * 1.8 + analysisData.bassSmooth * 0.4), // Uses smoothed named versions
            tetraThickness: visualParams.tetraThickness * (1.3 - analysisData.highSmooth * 0.9 + analysisData.bassSmooth * 0.3), // Uses smoothed named versions
            dataChannels: [...analysisData.dataChannelsSmooth], // Pass the full array
            
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
                    // For 'dimension' (number input), this progress update might not apply or needs adjustment
                    if (slider.type === 'range') {
                        const progress = (max === min) ? 0 : (clampedValue - min) / (max - min);
                        const wrapper = slider.closest('.slider-wrapper');
                        if (wrapper) {
                            wrapper.style.setProperty('--slider-progress', Math.max(0, Math.min(1, progress)).toFixed(3));
                        }
                    }
                    
                    // Update value display with the effective parameter value
                    if (key === 'dimension') {
                        display.textContent = clampedValue; // No toFixed for integer
                    } else {
                        display.textContent = clampedValue.toFixed(decimals);
                    }
                    
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
            
            // Create main visualizer core with error callback
            statusDiv.textContent = "Creating visualization core...";
            mainVisualizerCore = new HypercubeCore(canvas, shaderManager, {
                 geometryType: 'hypercube', // MODIFIED for testing SDF geometries
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

    // Instantiate VisualizerController after mainVisualizerCore is created
    let vizController = null;
    if (mainVisualizerCore && mainVisualizerCore.gl) {
        const initialDataChannelDef = {
            uboChannels: [
                { snapshotField: 'audio_bass', uboChannelIndex: 0, defaultValue: 0.0 },
                { snapshotField: 'audio_mid', uboChannelIndex: 1, defaultValue: 0.0 },
                { snapshotField: 'audio_high', uboChannelIndex: 2, defaultValue: 0.0 },
                { snapshotField: 'time_seconds', uboChannelIndex: 3, defaultValue: 0.0 },
                { snapshotField: 'pitch_frequency', uboChannelIndex: 4, defaultValue: 0.0 },
                { snapshotField: 'pitch_strength', uboChannelIndex: 5, defaultValue: 0.0 }, // Existing channel 5
                // For testing, we will add a new specific mapping for channel 5 if the above is already used.
                // Let's assume 'pitch_strength' is okay, or if we need a dedicated test, we'd ensure this index is unique for 'test_ubo_channel_5'.
                // For clarity, let's add a new specific one, assuming channel 5 might be used by pitch_strength.
                // Let's use channel 8 (0-indexed) for test_ubo_channel_5, if available.
                // Rechecking initialDataChannelDef, channels 0-7 are used. So let's use channel 8 for test.
                { snapshotField: 'test_ubo_channel_5_effect', uboChannelIndex: 8, defaultValue: 0.0 }, // Changed to 8 for clarity
                { snapshotField: 'energy_factor', uboChannelIndex: 6, defaultValue: 0.0 },
                { snapshotField: 'dissonance_factor', uboChannelIndex: 7, defaultValue: 0.0 }
            ],
            directParams: [
                // visualParams are reactive based on audio, so mapping them directly from a snapshot
                // might conflict with the reactive system unless the snapshot is the source of truth for them.
                // For now, let's assume UI/sliders update visualParams, which then can be part of snapshot.
                { snapshotField: 'ui_rotationSpeed', coreStateName: 'rotationSpeed', defaultValue: visualParams.rotationSpeed },
                { snapshotField: 'ui_morphFactor', coreStateName: 'morphFactor', defaultValue: visualParams.morphFactor },
                { snapshotField: 'ui_glitchIntensity', coreStateName: 'glitchIntensity', defaultValue: visualParams.glitchIntensity }
            ]
        };
        // Example baseParameters (could be loaded from a config file or UI preset)
        const baseParams = {
            // core state
            colorShift: 0.05,
            patternIntensity: 1.2,
            // projection params
            proj_perspective_baseDistance: 2.8,
            // geometry params for hypercube (if it's the default)
            geom_hypercube_baseSpeedFactor: 1.1,
            // lattice params (if fullscreenlattice is used)
            lattice_edgeLineWidth: 0.025
        };

        vizController = new VisualizerController(mainVisualizerCore, {
            dataChannelDefinition: initialDataChannelDef,
            baseParameters: baseParams
        });

    } else {
        console.error("Failed to initialize HypercubeCore, VisualizerController cannot be created.");
    }

    // Update mainUpdateLoop to use vizController.updateData with a snapshot
    function mainUpdateLoop() {
        if (!mainVisualizerCore?.state?.isRendering || !vizController) return; // Added !vizController check
        updateDataChannels();

        // ... (all the reactive calculations for effectiveParams remain the same) ...
        // Calculate audio-influenced factors
        const dissonanceFactor = analysisData.midSmooth * analysisData.highSmooth * 2.0;
        const energyFactor = (analysisData.bassSmooth + analysisData.midSmooth) * 0.5;
        const transientFactor = Math.max(0, analysisData.highSmooth - lastEnergy) * 2.0;
        lastEnergy = analysisData.highSmooth * 0.8;

        // Log core state for lattice for verification (previous test)
        // if (mainVisualizerCore && mainVisualizerCore.state.geometryType === 'fullscreenlattice') {
        //     console.log("Core State for Lattice:", {
        //         morph: mainVisualizerCore.state.morphFactor,
        //         glitch: mainVisualizerCore.state.glitchIntensity,
        //         grid: mainVisualizerCore.state.gridDensity_lattice,
        //         lattice_edgeLineWidth: mainVisualizerCore.state.lattice_edgeLineWidth
        //     });
        // }

        // Logging for HypercubeGeometry and Projection (new test)
        if (mainVisualizerCore && mainVisualizerCore.state.geometryType === 'hypercube') {
            console.log("Hypercube & Projection State:", {
                geom_wCoord_pLengthFactor: mainVisualizerCore.state.geom_hypercube_wCoord_pLengthFactor,
                proj_persp_baseDistance: mainVisualizerCore.state.proj_perspective_baseDistance,
                audio_bass_to_UBO0: currentDataSnapshot.audio_bass, // Example of data sent to UBO
                audio_mid_to_UBO1: currentDataSnapshot.audio_mid    // Example of data sent to UBO
            });
        }

        let pitchHue = 0.5;
        let pitchSaturation = 0.8;
        let pitchBrightness = 0.9;
        let tuningOffset = 0;

        if (analysisData.pitch.frequency > 0) {
            const noteMap = {'C': 0, 'C#': 0.083, 'D': 0.167, 'D#': 0.25, 'E': 0.333,
                             'F': 0.417, 'F#': 0.5, 'G': 0.583, 'G#': 0.667, 'A': 0.75,
                             'A#': 0.833, 'B': 0.917};
            const baseHue = noteMap[analysisData.pitch.note] || 0;
            pitchHue = (baseHue + (analysisData.pitch.octave % 3) * 0.33) % 1.0;
            pitchSaturation = 0.5 + analysisData.pitch.strength * 0.5;
            const octaveOffset = Math.max(0, Math.min(1, (analysisData.pitch.octave - 2) / 5));
            pitchBrightness = 0.7 + octaveOffset * 0.3;
            if (!analysisData.pitch.inTune) {
                tuningOffset = analysisData.pitch.cents / 50.0;
            }
        } else {
            pitchHue = (Date.now() * 0.0001) % 1.0;
            pitchSaturation = 0.5 + energyFactor * 0.5;
            pitchBrightness = 0.7 + analysisData.highSmooth * 0.3;
        }

        visualParams.hue = pitchHue;
        visualParams.saturation = pitchSaturation;
        visualParams.brightness = pitchBrightness;
        visualParams.rgbOffset = tuningOffset;

        const paramMappings = {
            morphFactor: { factor: analysisData.pitch.frequency > 0 ? 0.4 + (analysisData.pitch.octave / 6) * 0.8 + transientFactor * 0.5 : 0.8 + analysisData.midSmooth * 1.8 + transientFactor * 0.7, primary: 'pitch', secondary: 'transient', pulseThreshold: 0.3 },
            dimension: { factor: analysisData.pitch.frequency > 0 ? 3.0 + (noteMap[analysisData.pitch.note] || 0) * 2.0 : 0.65 + analysisData.bassSmooth * 0.6 + analysisData.midSmooth * 0.3, primary: 'pitch', secondary: 'bass', pulseThreshold: 0.4 },
            rotationSpeed: { factor: analysisData.pitch.frequency > 0 ? 0.2 + (analysisData.pitch.octave / 8) * 2.0 + analysisData.midSmooth * 1.0 : 0.8 + analysisData.midSmooth * 3.0 + analysisData.highSmooth * 2.0,  primary: 'pitch', secondary: 'mid', pulseThreshold: 0.25 },
            gridDensity: { factor: analysisData.pitch.frequency > 0 ? 4.0 + ((analysisData.pitch.octave % 3) * 3.0) + analysisData.bassSmooth * 6.0 : 0.5 + analysisData.bassSmooth * 2.2 + transientFactor * 0.7, primary: 'pitch', secondary: 'bass', pulseThreshold: 0.4 },
            lineThickness: { factor: analysisData.pitch.frequency > 0 ? 1.5 - ((analysisData.pitch.octave - 2) / 6) * 0.8 : 1.5 - analysisData.highSmooth * 1.0 + analysisData.bassSmooth * 0.3, primary: 'pitch', secondary: 'high', pulseThreshold: 0.5, inverse: true },
            patternIntensity: { factor: analysisData.pitch.frequency > 0 ? 0.7 + Math.abs(analysisData.pitch.cents / 50.0) * 1.5 + transientFactor * 0.5 : 0.8 + analysisData.midSmooth * 1.5 + transientFactor * 1.1, primary: 'tuning', secondary: 'transient', pulseThreshold: 0.25 },
            universeModifier: { factor: analysisData.pitch.frequency > 0 ? 0.5 + (noteMap[analysisData.pitch.note] || 0) * 1.5 : 0.7 + analysisData.bassSmooth * 1.2 + dissonanceFactor * 0.4, primary: 'note', secondary: 'bass', pulseThreshold: 0.4 },
            glitchIntensity: { factor: analysisData.pitch.frequency > 0 ? 0.01 + (analysisData.pitch.inTune ? 0 : (Math.abs(analysisData.pitch.cents) / 50.0) * 0.08) : 0.02 + analysisData.highSmooth * 0.08 + transientFactor * 0.1, primary: 'tuning', secondary: 'transient', pulseThreshold: 0.2, additive: true },
            colorShift: { factor: analysisData.pitch.frequency > 0 ? analysisData.pitch.cents / 50.0 : 1.2 + (dissonanceFactor * 1.5) + (energyFactor - 0.1) * 0.8, primary: 'tuning', secondary: 'energy', pulseThreshold: 0.3, bipolar: true }
        };

        const noteMap = {'C': 0, 'C#': 0.083, 'D': 0.167, 'D#': 0.25, 'E': 0.333, 'F': 0.417, 'F#': 0.5, 'G': 0.583, 'G#': 0.667, 'A': 0.75, 'A#': 0.833, 'B': 0.917};

        const effectiveParams = {
            shellWidth: visualParams.shellWidth * (0.7 + analysisData.midSmooth * 1.8 + analysisData.bassSmooth * 0.4),
            tetraThickness: visualParams.tetraThickness * (1.3 - analysisData.highSmooth * 0.9 + analysisData.bassSmooth * 0.3),
            // dataChannels: [...analysisData.dataChannelsSmooth], // This will be handled by the snapshot via vizController
            hue: visualParams.hue, saturation: visualParams.saturation, brightness: visualParams.brightness, rgbOffset: visualParams.rgbOffset,
            projectionDistance: analysisData.pitch.frequency > 0 ? 2.0 + (analysisData.pitch.octave - 3) * 0.5 : 2.0 + analysisData.bassSmooth * 1.0,
            projectionAngle: analysisData.pitch.frequency > 0 ? (noteMap[analysisData.pitch.note] || 0) * Math.PI * 2 : (Date.now() * 0.0005) % (Math.PI * 2)
        };

        for (const key in paramMappings) {
            const mapping = paramMappings[key];
            if (mapping.additive) {
                effectiveParams[key] = visualParams[key] + (visualParams[key] * analysisData.highSmooth * 0.2) + (transientFactor * 0.3);
            } else if (mapping.bipolar) {
                effectiveParams[key] = visualParams[key] + (dissonanceFactor - 0.1) * 0.8 + (energyFactor - 0.2) * 0.5;
            } else {
                effectiveParams[key] = visualParams[key] * mapping.factor;
            }
        }

        // Update UI sliders (remains the same)
        for (const key in sliders) { /* ... existing slider update logic ... */ }

        // Clamp values (remains the same)
        effectiveParams.morphFactor = Math.max(0, Math.min(1.5, effectiveParams.morphFactor));
        // ... other clamps ...
        effectiveParams.colorShift = Math.max(-1.0, Math.min(1.0, effectiveParams.colorShift));

        // Instead of mainVisualizerCore.updateParameters(effectiveParams);
        // We construct the snapshot and send it to vizController
        const currentDataSnapshot = {
            audio_bass: analysisData.bassSmooth,
            audio_mid: analysisData.midSmooth,
            audio_high: analysisData.highSmooth,
            time_seconds: mainVisualizerCore.state.time,
            pitch_frequency: analysisData.pitch.frequency,
            pitch_strength: analysisData.pitch.strength,
            energy_factor: energyFactor,
            dissonance_factor: dissonanceFactor,
            // Include UI-driven parameters if they should be part of snapshot for direct mapping
            ui_rotationSpeed: visualParams.rotationSpeed,
            ui_morphFactor: visualParams.morphFactor,
            ui_glitchIntensity: visualParams.glitchIntensity
            // Add any other values from 'effectiveParams' that are defined in directParams or uboChannels
            // For example, if 'glitchIntensity' is a directParam, it would be:
            // visual_glitchIntensity: effectiveParams.glitchIntensity
            // (assuming snapshotField is 'visual_glitchIntensity')
            test_ubo_channel_5_effect: (Math.sin(mainVisualizerCore.state.time * 2.0) + 1.0) * 0.25 // Pulsating value for UBO channel 8
        };
        // Also, add any other effectiveParams that are meant to be directly controlled but are calculated reactively
        // This part needs careful consideration of what 'effectiveParams' should override vs. what snapshot provides.
        // For now, we assume snapshot provides raw data, and HypercubeCore state (from sliders/UI) is separate.
        // The directParams in initialDataChannelDef like 'ui_rotationSpeed' are from 'visualParams' (sliders).
        // The 'effectiveParams' are for parameters NOT directly mapped from snapshot but reactively calculated.
        // So, we should still call updateParameters for these reactively calculated ones.
        mainVisualizerCore.updateParameters(effectiveParams);
        // And then send the specific snapshot data
        vizController.updateData(currentDataSnapshot);

        requestAnimationFrame(mainUpdateLoop);
    }


    // Mock PMK Input Handler
    const commandInput = document.getElementById('pmkCommandInput');
    const sendCommandButton = document.getElementById('sendPmkCommand');

    if (sendCommandButton && commandInput && vizController) {
        sendCommandButton.addEventListener('click', () => {
            const commandStr = commandInput.value.trim();
            if (!commandStr) return;

            try {
                const commandObj = JSON.parse(commandStr);
                if (!commandObj.command || !commandObj.payload === undefined) { // Check payload existence
                    console.error("Invalid command format. Need 'command' and 'payload'.", commandObj);
                    if(statusDiv) statusDiv.textContent = "Error: Invalid command format.";
                    return;
                }

                console.log("Attempting command:", commandObj.command, "with payload:", commandObj.payload);
                if(statusDiv) statusDiv.textContent = `Cmd: ${commandObj.command}`;

                switch (commandObj.command) {
                    case 'setPolytope':
                        if (typeof commandObj.payload === 'string') {
                            vizController.setPolytope(commandObj.payload);
                        } else if (typeof commandObj.payload === 'object' && commandObj.payload.name) {
                            vizController.setPolytope(commandObj.payload.name, commandObj.payload.styleParams);
                        } else {
                             console.error("Invalid payload for setPolytope. Expected string or {name, styleParams}.");
                             if(statusDiv) statusDiv.textContent = "Error: Invalid setPolytope payload.";
                        }
                        break;
                    case 'setVisualStyle':
                        if (typeof commandObj.payload === 'object') {
                            vizController.setVisualStyle(commandObj.payload);
                        } else {
                            console.error("Invalid payload for setVisualStyle. Expected object.");
                            if(statusDiv) statusDiv.textContent = "Error: Invalid setVisualStyle payload.";
                        }
                        break;
                    case 'updateData':
                        if (typeof commandObj.payload === 'object' && commandObj.payload !== null && !Array.isArray(commandObj.payload)) {
                            vizController.updateData(commandObj.payload);
                        } else {
                             console.error("Invalid payload for updateData. Expected a JSON object.");
                             if(statusDiv) statusDiv.textContent = "Error: Invalid updateData payload (must be JSON object).";
                        }
                        break;
                    case 'setDataMappingRules': // New command
                        if (typeof commandObj.payload === 'object' && commandObj.payload !== null) {
                            vizController.setDataMappingRules(commandObj.payload);
                        } else {
                            console.error("Invalid payload for setDataMappingRules. Expected object.");
                            if(statusDiv) statusDiv.textContent = "Error: Invalid setDataMappingRules payload.";
                        }
                        break;
                    case 'setSpecificUniform':
                        if (commandObj.payload && commandObj.payload.name && commandObj.payload.hasOwnProperty('value')) {
                            vizController.setSpecificUniform(commandObj.payload.name, commandObj.payload.value);
                        } else {
                            console.error("Invalid payload for setSpecificUniform. Expected {name, value}.");
                            if(statusDiv) statusDiv.textContent = "Error: Invalid setSpecificUniform payload.";
                        }
                        break;
                    default:
                        console.warn("Unknown command:", commandObj.command);
                        if(statusDiv) statusDiv.textContent = `Error: Unknown command ${commandObj.command}`;
                }
                commandInput.value = ''; // Clear input after processing
            } catch (e) {
                console.error("Error processing command:", e);
                if(statusDiv) statusDiv.textContent = `Error: ${e.message}`;
            }
        });
    } else {
        if (!vizController) console.warn("VisualizerController not initialized, PMK command input disabled.");
        else console.warn("PMK command input elements not found in HTML.");
    }
});
