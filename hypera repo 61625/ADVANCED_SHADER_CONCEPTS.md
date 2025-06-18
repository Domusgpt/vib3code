# Advanced Shader Adaptability for PMK/ASI Control

To achieve deeper integration and allow the Parserator Micro-Kernel (PMK) and Adaptive Schema Intelligence (ASI) to exert more fundamental control over the visual representation ("expanded fidelity and adaptive connection"), the visualizer's shader system can be evolved beyond simple uniform updates. This document explores conceptual strategies for such dynamic shader adaptability.

The goal is to enable PMK/ASI to modify not just *what* data is shown, but more profoundly *how* the underlying geometric and surface characteristics are rendered, based on its understanding of the data's nature, schema, context, or the ASI's optimization state.

## Strategies for Dynamic Shader Adaptability

### 1. Dynamic Shader Snippet Injection

*   **Concept:** The `ShaderManager` and `GeometryManager` would be refactored to assemble final shader programs from a collection of smaller, reusable GLSL code snippets. PMK/ASI could then, via the `VisualizerController` API, specify which optional snippets (e.g., for surface patterns, distortion effects, specific lighting responses) should be compiled into the active shader for a given geometry.
*   **API Indication:** `VisualizerController.applyShaderFeatures(geometryName: string, features: ShaderFeature[])` where `ShaderFeature` could be an object like `{ name: 'pulsatingSurface', snippets: { fragment_surface_logic: "p.xyz += sin(u_time + p.x * u_dataChannels[4]);" }, requiredUniforms: ['u_dataChannels[4]'] }`.
*   **Pros:**
    *   Highly flexible and extensible. New visual effects can be added as new snippets.
    *   Potentially efficient as only necessary code is compiled and run.
    *   Allows for fine-grained control over shader logic by the agent.
*   **Cons:**
    *   Increased complexity in `ShaderManager` (managing snippet dependencies, ensuring valid GLSL construction).
    *   Potential for shader compilation overhead if features change frequently.
    *   Requires careful design of snippet interfaces and compatibility.
*   **PMK/ASI Use Cases:**
    *   Visualizing schema characteristics: e.g., a "volatile" schema adds a 'shimmering' snippet.
    *   Representing data quality: Low confidence data adds a 'noisy_surface' snippet.
    *   ASI states: An "experimental optimization path" in ASI could trigger a visually distinct pattern snippet.

### 2. Uber-Shaders with Extensive Control Uniforms

*   **Concept:** Design highly parameterized "uber-shaders" for each geometry (or a general uber-shader). These shaders would contain a wide range of conditional logic (`if` statements or `mix` functions) controlled by numerous specialized uniforms (integers as booleans, floats for factors, etc.). PMK/ASI would manipulate these uniforms to enable/disable or modulate different visual features.
*   **API Indication:** Heavy use of `VisualizerController.setSpecificUniform(uniformName, value)` or an expanded `setVisualStyle` that includes these feature-switching uniforms.
*   **Pros:**
    *   No shader recompilation needed when features change, leading to fast visual updates.
    *   Can be simpler to manage than snippet injection if the set of variations is well-defined.
*   **Cons:**
    *   Shaders can become very large and complex ("mega-shaders"), potentially impacting performance due to excessive branching, even if features are disabled.
    *   Less flexible for entirely novel effects not pre-programmed into the shader.
    *   Harder to maintain and debug the GLSL.
*   **PMK/ASI Use Cases:**
    *   Toggling discrete visual features: `setSpecificUniform("u_enableEdgeHighlight", 1)`.
    *   Gradual effects: `setSpecificUniform("u_surfaceDistortionFactor", data.anomaly_score)`.
    *   Representing ASI's multi-level optimization (Level 1, 2, 3 from the brief) by setting different uniform combinations.

### 3. Library of Pre-compiled Shader Program Variants

*   **Concept:** Maintain a library of distinct, pre-compiled shader programs within `ShaderManager`. Each program could be a variant of a geometry shader with specific features or effects baked in (e.g., `hypercube_standard`, `hypercube_wireframe_pulsating`, `duocylinder_transparent_shell`). PMK/ASI would instruct the `VisualizerController` to switch to one of these named shader programs.
*   **API Indication:** `VisualizerController.setActiveShaderProgram(programName: string)`.
*   **Pros:**
    *   Fastest switching between visual styles as no recompilation is needed.
    *   Shaders can be individually optimized.
*   **Cons:**
    *   Less flexible; the set of visual appearances is limited to pre-compiled variants.
    *   Can lead to a large number of shader programs to manage, compile at startup, and store in GPU memory.
    *   Adding new variations requires code changes and recompilation of the visualizer itself.
*   **PMK/ASI Use Cases:**
    *   Switching to a "debug_view" shader program that highlights specific aspects useful for developers.
    *   Assigning distinct pre-defined visual styles to different data schemas recognized by PMK.

### 4. Compute Shaders for Geometry Generation/Modification (Advanced)

*   **Concept:** (Requires WebGL2 Compute) Use compute shaders to procedurally generate or modify the vertex data of geometries on the GPU based on parameters from PMK/ASI. This allows for highly dynamic and complex shape manipulations that go beyond surface effects or simple transformations.
*   **API Indication:** `VisualizerController.updateGeometryDefinition(geometryName: string, computeParams: object)`.
*   **Pros:**
    *   Extremely powerful for creating novel, data-driven geometries or complex deformations.
    *   Can offload significant computation to the GPU.
*   **Cons:**
    *   Highest complexity to implement and manage.
    *   WebGL2 Compute Shaders have more limited browser/platform availability.
    *   Requires a different rendering pipeline for these geometries.
*   **PMK/ASI Use Cases:**
    *   Visualizing abstract high-dimensional data structures by generating their 3D projection's mesh in real-time.
    *   Showing the "shape" of a data cluster or manifold as understood by PMK.

## Recommended Approach

A hybrid approach seems most viable:

*   **Near-term:** Enhance **Uber-Shaders (Strategy 2)** by adding more control uniforms to existing geometry shaders. This provides immediate gains in adaptability without requiring major `ShaderManager` refactoring. The `setSpecificUniform` API method is already a PoC for this.
*   **Mid-term:** Explore **Dynamic Shader Snippet Injection (Strategy 1)** for more complex or novel visual features that are hard to build into an uber-shader. This offers greater flexibility.
*   **Long-term:** For very advanced or performance-critical procedural geometry, **Compute Shaders (Strategy 4)** could be investigated if the target environments support WebGL2 Compute.
*   **Strategy 3 (Pre-compiled Library)** can be a part of the overall system, where commonly used snippet combinations or uber-shader configurations are pre-compiled for faster activation.

The choice of strategy will depend on the specific visual requirements of PMK/ASI, the desired level of dynamism, performance considerations, and development complexity. The current API should be designed to potentially accommodate these different strategies over time.
