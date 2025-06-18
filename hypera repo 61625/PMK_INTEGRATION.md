# Visualizer Integration with Parserator Micro-Kernel (PMK) & Adaptive Schema Intelligence (ASI)

This document outlines the intended role and integration philosophy of the Headless Agentic Polytope Visualizer within the PMK/ASI ecosystem.

## Purpose in PMK/ASI

The visualizer serves as a specialized **output and monitoring component** for PMK and ASI. Its primary function is to provide a clear, machine-interpretable (and human-debuggable) visual representation of:

*   **Active Data Schemas:** Different polytopes can be used to symbolize various data schemas recognized by the PMK Architect. The visual characteristics of the polytope (complexity, stability, color) can reflect the state of that schema (e.g., confidence, usage frequency from ASI).
*   **Architect's Focus State:** The visualizer can represent what the PMK Architect is currently "focusing on." This could be a particular data stream, a specific feature set, or a stage in a processing pipeline.
*   **Data Topologies & Characteristics:** Abstract features of the data being processed (e.g., anomaly scores, data drift metrics, feature vector components) can be mapped to the dimensions, shape, movement, and appearance of the displayed polytopes.
*   **ASI Optimization States:** The visualizer can reflect the current optimization path chosen by ASI (e.g., "fast path" vs. "standard path" from the ASI brief), the confidence of an optimized parse, or the "temperature" of a schema indicating its readiness for optimization.
*   **System Health & Alerts:** Critical system states or alerts from PMK/ASI (e.g., high error rate, schema mismatch) can be represented by dramatic and unambiguous visual cues.

## Design Philosophy

1.  **Clarity and Information Density:** Visual representations must be unambiguous and prioritize conveying information over aesthetic appeal. The goal is to make the agent's internal state or data characteristics perceivable.
2.  **Direct Data Mapping:** The relationship between PMK/ASI data/states and the visual parameters of the polytopes should be direct, predictable, and well-documented. This allows the agent (or a developer monitoring the agent) to accurately interpret the visualization.
3.  **Agentic Control:** The visualizer is a "slave" component. PMK/ASI dictates all aspects of the visualization via a defined API. The visualizer does not have its own decision-making logic regarding what or how to display beyond executing received commands.
4.  **Efficiency:** As a micro-element, the visualizer itself should be computationally efficient, especially if multiple instances are used or if it's embedded in resource-constrained environments (though primary rendering may still require WebGL capabilities).

## High-Level Integration Interface (Preview)

A formal API will be defined (see `API_REFERENCE.md` - planned) for PMK/ASI to control the visualizer. This API will allow the controlling agent to:

*   **Select and Configure Geometries:** Choose a specific polytope (e.g., 'Hypercube', 'Duocylinder') and set its N-dimensional properties.
*   **Stream Data Inputs:** Provide structured data (e.g., a `PMKData` object containing named features, scores, and metrics) that the visualizer will map to shader uniforms and visual characteristics.
*   **Set Visual Styles:** Control global visual parameters such as base colors, line thickness, projection methods, and lighting (if any).
*   **Trigger Snapshots:** Command the visualizer to render and output a static image of its current state.

This integration aims to make the visualizer a powerful tool for understanding and debugging the complex internal workings of the PMK and ASI systems.
