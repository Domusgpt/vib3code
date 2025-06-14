# HyperAV - 4D Audio-Reactive Visualizer

A stunning 4D geometry visualizer that reacts to audio input, bringing higher-dimensional mathematics to life with captivating WebGL visuals and real-time sound reactivity.

## Features

- **4D Geometry Engine**: Explore hypercubes, hyperspheres, and hypertetrahedra with interactive controls
- **Audio Reactivity**: Microphone input transforms sound into dynamic visual parameters
- **Advanced Audio Analysis**: Musical pitch detection with note/octave identification and tuning visualization
- **Direct Touch Controls**: Interact directly with the visualization canvas to adjust key parameters
- **Multiple Projection Methods**: Switch between perspective, orthographic, and stereographic 4D→3D projections
- **Responsive Design**: Optimized for both desktop and mobile devices with adaptive UI
- **Modern Visual Effects**: Glassmorphism, neon glow effects, and magnification for an immersive experience
- **No Dependencies**: Built with vanilla JavaScript and WebGL - no frameworks required

## Quick Start

No installation or build process required - just open in any modern browser:

1. Clone or download this repository
2. Open `index.html` in your browser 
3. Allow microphone access when prompted
4. Explore the 4D universe!

```bash
# If you have Python, you can run a local server
python -m http.server

# Then visit http://localhost:8000 in your browser
```

## Visual Controls

- **Direct Canvas Interaction**: Click and drag on the visualization to adjust dimension and morphing
- **Parameter Sliders**: Fine-tune visualization properties like rotation speed, grid density, and more
- **Geometry Selection**: Switch between different 4D shapes
- **Projection Method**: Change how 4D geometry is projected into 3D space
- **Collapsible UI**: Minimize the control panel to enjoy fullscreen visuals

## Audio Reactivity

HyperAV analyzes microphone input in real-time to:

- Map bass frequencies to structural changes
- Link mid-range frequencies to morphing and rotation
- Use high frequencies for fine details and effects
- Detect musical notes and map to color spectrum
- React to pitch changes and audio transients
- Provide fallback patterns when microphone isn't available

## Project Structure

- `core/`: Core visualization engine
  - `HypercubeCore.js`: Main WebGL renderer
  - `ShaderManager.js`: GLSL shader compilation
  - `GeometryManager.js`: 4D primitive generation
  - `ProjectionManager.js`: 4D-to-3D projection methods
- `js/`: Application layer
  - `visualizer-main.js`: UI, audio processing, parameter mapping
- `css/`: Styling system
  - `enhanced-styles.css`: Visual effects
  - `neumorphic-style.css`: Component styles
  - `neumorphic-vars.css`: Design variables
- `sound/`: Audio processing modules
  - `SoundInterface.js`: Main audio management
  - `modules/AnalysisModule.js`: Frequency analysis and pitch detection
  - `modules/EffectsModule.js`: Audio-to-visual parameter mapping

## Browser Support

- Chrome/Edge (recommended): Best performance and audio reactivity
- Firefox/Safari: Good support with minor variations
- Mobile browsers: Full support with touch-optimized interface
- Note: Requires WebGL and Web Audio API support

## Development

HyperAV uses ES6 modules and vanilla JavaScript, making it easy to modify:

- Audio reactivity is handled in `js/visualizer-main.js` and `sound/` modules
- WebGL rendering is managed by `core/HypercubeCore.js`
- UI interactions are defined in the event handlers in `visualizer-main.js`

## License

MIT License

---

Made with 💜 by GEN-R-L M-S-R-E

Tag me on GitHub if you use this project!