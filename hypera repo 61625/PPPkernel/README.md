# Headless Agentic Polytope Visualizer for PMK/ASI

This project provides a headless, API-driven WebGL module for visualizing N-dimensional polytopes and dynamic geometric forms. It is primarily designed as a **topological data display component for agentic systems**, such as the Parserator Micro-Kernel (PMK) and Adaptive Schema Intelligence (ASI).

The visualizer's parameters are intended to be **machine-settable controls**, allowing an external agent to dynamically represent data states, active schemas, abstract data topologies, or system focus through the choice and configuration of displayed polytopes. Clarity and direct data mapping are prioritized over aesthetic complexity.

## Key Features

*   **API-Driven Control:** All aspects of the visualization (geometry selection, dimensionality, visual styling, data input) are controlled programmatically.
*   **Diverse Polytope Library:** Offers a range of polytopes (Hypercube, Hypersphere, Hypertetrahedron, Duocylinder) that can be assigned by an agent to represent different data types or system states. Extensible for new geometric forms.
*   **Configurable N-Dimensions:** The number of dimensions for calculations can be set via API, influencing the underlying structure of the visualized forms (currently projected to 3D).
*   **Selectable Projection Methods:** Supports various projection techniques (Perspective, Orthographic, Stereographic) to view higher-dimensional structures.
*   **Direct Data Channel Mapping:** Designed to receive data streams (e.g., from PMK/ASI `dataChannels` or `PMKData` objects) that directly drive visual properties like morphing, rotation, color, and line characteristics, providing clear feedback on agent-observed states.
*   **Headless Operation:** Optimized for integration as a module without a direct human-operated UI. A canvas output can be used for debugging, monitoring agent states, or generating visual outputs programmatically.

## Integration Principles

This visualizer serves as a component to be controlled by an external agent or system.

*   **Agent-Led Configuration:** The controlling system (e.g., PMK Architect or ASI logic) dictates the choice of polytope, its dimensionality, its appearance, and how its features map to incoming data.
*   **Topological Representation:** The primary goal is to clearly represent the structure and transformations of polytopes as a reflection of the agent's data understanding or focus.
*   **API for Control:** A JavaScript API (detailed in `API_REFERENCE.md`) will be exposed by a `VisualizerController` module to enable this external control.

## Technical Aspects

*   Built with **WebGL** and **GLSL** shaders for efficient, hardware-accelerated graphics.
*   `HypercubeCore.js`: The elemental rendering engine managing WebGL state and shader execution.
*   `VisualizerController.js` (to be developed): Wraps `HypercubeCore` and exposes the control API.
*   `GeometryManager.js`: Manages and provides shader code for different polytopes.
*   `ShaderManager.js`: Handles shader compilation and linking.

## Future Directions

*   Deepen integration with PMK/ASI by refining the API and data mapping capabilities.
*   Expand the library of polytopes and geometric primitives for richer data representation.
*   Enhance shader customizability through API-driven parameterization or snippet injection.
*   Support for generating snapshots or sequences of the visualization programmatically.

## How to Use

This module is intended to be integrated into a larger JavaScript/TypeScript project or controlled by an external system capable of interacting with its JavaScript API.

1.  **Include/Import** the necessary modules (`VisualizerController`, `HypercubeCore`, etc.).
2.  **Instantiate `VisualizerController`**, providing it with a target canvas (if rendering for display) or configuring it for offscreen rendering.
3.  **Use the API** exposed by `VisualizerController` to set geometries, update data, and control visual parameters.
4.  Refer to `API_REFERENCE.md` (to be created) for detailed API specifications.
5.  An example driver script (`pmk_asi_visualizer_driver.js` - to be created) will demonstrate API usage.
