# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
## Run Commands
- Run directly from browser by opening `index.html`
- No build process required - pure frontend application
- Browser permissions required for microphone access

## Code Style Guidelines
- **JavaScript**: ES6+ with modules (import/export)
- **Version Control**: Each file includes version number in header comments (e.g., `/* file.js - v1.4 */`)
- **Formatting**: Compact code with minimal whitespace; function chaining and ternary operators preferred
- **Naming**: camelCase variables/methods, PascalCase classes, underscore prefix for private methods
- **DOM Access**: Cache DOM elements, minimize reflows/repaints
- **Error Handling**: Try/catch around WebGL operations, console.error for failures, status reporting via UI
- **State Management**: Immutable state pattern with dirty flags for efficient updates
- **Logging Strategy**: Console logging for critical events with clear prefixes

## Structure
- `core/`: Core visualization engine components (HypercubeCore.js, ShaderManager.js, etc.)
- `js/`: Application interface layer (visualizer-main.js for controls, audio processing)
- `css/`: Layered styling with variables (neumorphic-vars.css) and component styles

## Technical Features
- **WebGL** for rendering 4D geometry with custom shaders
- **Audio Analysis**: Frequency band analysis (bass/mid/high) with smoothing for visualization
- **Responsive Design**: Automatic canvas resizing and UI adaptations
- **Dynamic Parameter System**: Base values + audio-reactive modifiers
- **Custom Geometry Pipeline**: 4D objects with multiple projection methods