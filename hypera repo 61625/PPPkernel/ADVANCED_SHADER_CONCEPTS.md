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
---

## Strategies for High-Capacity Data Input to Shaders

As the visualizer evolves to be driven by complex data from PMK/ASI, the need to pass a significantly larger number of data parameters (beyond a small array of uniforms like `u_dataChannels[8]`) to the GLSL shaders becomes critical. This section explores robust WebGL mechanisms for this purpose.

The goal is to allow PMK/ASI to provide a rich dataset that can drive many aspects of the visualization simultaneously, enabling the visualizer to "scale as far as it can handle with input and processing ability."

### 1. Data Textures

*   **Concept:** Utilize WebGL textures not for their traditional visual purpose, but as carriers of arbitrary floating-point data. A 1D or 2D texture can store a large array or grid of numbers, which can then be sampled by shaders.
*   **JavaScript (Client-Side - e.g., in `HypercubeCore.js`):**
    *   **Creation:** A `WebGLTexture` object is created using `gl.createTexture()`.
    *   **Data Format:** The texture is typically configured with an internal format like `gl.RGBA32F` (WebGL2) or `gl.RGBA` with `type = gl.FLOAT` (WebGL1, requires `OES_texture_float` extension) to store floating-point data. For a large 1D array of floats, it can be packed into an RGBA texture (4 floats per pixel) or a 2D texture where each pixel (or R, G, B, A component) represents a data point.
    *   **Populating:** Data is passed as a `Float32Array` (or similar) to `gl.texImage2D()` (to initialize) or `gl.texSubImage2D()` (to update parts of it).
        ```javascript
        // Example: Creating a 1D data texture (e.g., 256 floats)
        // const numFloats = 256;
        // const textureWidth = numFloats / 4; // If using RGBA to pack 4 floats per pixel
        // const data = new Float32Array(numFloats);
        // /* ... populate data ... */
        // const dataTexture = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D, dataTexture);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, textureWidth, 1, 0, gl.RGBA, gl.FLOAT, data);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // Important for data
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        ```
*   **GLSL (Shader Access):**
    *   A `sampler2D` uniform is used: `uniform sampler2D u_pmkDataTexture;`
    *   Data is fetched using `texture2D()` (or `texelFetch()` for direct integer coord access in GLSL ES 3.00 / WebGL2).
        ```glsl
        // Example: Reading the i-th float (assuming packed in RGBA)
        // float getDataValue(sampler2D tex, int index) {
        //     int pixelIndex = index / 4;
        //     int componentIndex = index % 4;
        //     // Calculate texture coordinates (0.0 to 1.0)
        //     // float texWidth = float(textureSize(tex, 0).x); // GLSL ES 3.00
        //     // For fixed size known in shader: const float texWidth = 64.0; (256 floats / 4 components)
        //     // vec2 uv = vec2((float(pixelIndex) + 0.5) / texWidth, 0.5); // For 1-row texture
        //     // vec4 rawData = texture2D(u_pmkDataTexture, uv);
        //     // Using texelFetch for direct integer coordinates (WebGL2 / GLSL ES 3.00)
        //     ivec2 texCoord = ivec2(pixelIndex, 0); // For 1-row texture
        //     vec4 rawData = texelFetch(u_pmkDataTexture, texCoord, 0);
        //
        //     if (componentIndex == 0) return rawData.r;
        //     if (componentIndex == 1) return rawData.g;
        //     if (componentIndex == 2) return rawData.b;
        //     return rawData.a;
        // }
        // float myValue = getDataValue(u_pmkDataTexture, 5); // Get the 5th float
        ```
*   **Pros:**
    *   Works in both WebGL1 (with `OES_texture_float` extension) and WebGL2.
    *   Can store very large amounts of data (limited by max texture size, e.g., 4096x4096 or higher).
    *   Flexible data organization (1D array, 2D grid).
    *   GPU memory access can be efficient for coherent reads.
*   **Cons:**
    *   Texture sampling can have higher latency than direct uniform access for small, frequently changing data.
    *   Dependent texture reads (using results of one texture read to calculate coordinates for another) can be slow on some older mobile hardware.
    *   Requires careful calculation of texture coordinates in shaders to access specific data elements. `texelFetch` (WebGL2) simplifies this.
    *   Floating-point precision of textures might be a concern on very old/limited hardware (though `gl.FLOAT` type with `RGBA32F` internal format is robust).
*   **API Impact on `VisualizerController`:**
    *   `updateData(dataSnapshot: object)`: The `dataSnapshot` would need to be transformed into a `Float32Array` and written to the texture by `HypercubeCore`.
    *   PMK/ASI might need to know the texture dimensions or the packing strategy to effectively map its data.

### 2. Uniform Buffer Objects (UBOs)

*   **Concept:** (WebGL2 Only) Allows defining large, structured blocks of uniform data in GLSL shaders, which are backed by buffer objects (similar to vertex buffers) in JavaScript. This is generally more efficient for managing and switching between large sets of related uniforms.
*   **GLSL Definition:**
    *   Uniform blocks are defined with a specific layout (usually `std140` for cross-platform compatibility and defined padding/alignment).
    ```glsl
    // #version 300 es (required for UBOs)
    layout(std140) uniform PmkDataUniformBlock {
        float focusMetric;
        float confidenceScore;
        vec3 alertColor;
        float rawValues[64]; // Example: an array within the UBO
        // mat4 someTransform; // Matrices also possible
    };
    // Values are then accessed directly: e.g., `if (focusMetric > 0.9) { ... }`
    ```
*   **JavaScript (Client-Side - e.g., in `HypercubeCore.js`):**
    *   **Buffer Creation:** `gl.createBuffer()`, `gl.bindBuffer(gl.UNIFORM_BUFFER, buffer)`, `gl.bufferData(gl.UNIFORM_BUFFER, dataSizeOrTypedArray, gl.DYNAMIC_DRAW)`.
    *   **Linking to Shader:**
        1.  Get the uniform block index: `blockIndex = gl.getUniformBlockIndex(program, "PmkDataUniformBlock");`
        2.  Assign a binding point to the uniform block in the shader: `gl.uniformBlockBinding(program, blockIndex, bindingPoint);` (e.g., `bindingPoint = 0`).
        3.  Bind the buffer to the same binding point: `gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, buffer);` (or `gl.bindBufferRange` for parts of a buffer).
    *   **Updating Data:** `gl.bindBuffer(gl.UNIFORM_BUFFER, buffer)`, then `gl.bufferSubData(gl.UNIFORM_BUFFER, offset, typedArrayData)`.
*   **Pros:**
    *   Clean, direct, and typed access to data in GLSL (e.g., `PmkDataUniformBlock.focusMetric`).
    *   Efficient for updating and swapping large blocks of uniform data.
    *   Can be shared between multiple shader programs.
    *   Memory layout is standardized (though `std140` requires careful attention to padding and alignment).
*   **Cons:**
    *   **WebGL2 Only.** This is a significant factor if WebGL1 compatibility is needed.
    *   `std140` layout rules can be cumbersome, requiring padding for correct alignment of types (e.g., a `vec3` often takes up the space of a `vec4`). This can lead to wasted space if not managed carefully.
    *   Maximum UBO size is substantial (e.g., at least 16KB, often 64KB or more), but still finite. Max number of uniform blocks is also limited.
*   **API Impact on `VisualizerController`:**
    *   `updateData(dataSnapshot: object)`: The `dataSnapshot` would need to be carefully structured to match the UBO layout (including padding) and serialized into a `Float32Array` (or `ArrayBuffer`) for `gl.bufferSubData`.
    *   The structure of the UBO would need to be defined and known by both PMK/ASI (to prepare data) and the visualizer.

### 3. Comparison and Recommendation

| Feature                 | Data Textures                                  | Uniform Buffer Objects (UBOs)                |
|-------------------------|------------------------------------------------|----------------------------------------------|
| **WebGL Version**       | WebGL1 (with ext), WebGL2                      | WebGL2 Only                                  |
| **Data Structure**      | Raw array/grid of floats (packed into texels)  | Structured (named variables, arrays, structs)|
| **GLSL Access**         | `texture2D`/`texelFetch`, coord math needed    | Direct variable access (e.g., `Block.member`)|
| **Max Size**            | Very large (max texture dimensions)            | Large (e.g., 16-64KB+ per block)             |
| **Ease of JS Setup**    | Relatively straightforward texture setup       | More complex (block indexing, binding points)|
| **Ease of Data Update** | `texSubImage2D` for whole/partial updates    | `bufferSubData` for whole/partial updates    |
| **Shader Complexity**   | Can be higher due to manual indexing/unpacking | Lower, direct access                           |
| **Performance**         | Good, but sampling has overhead vs direct read | Generally very good for structured uniforms  |
| **Flexibility**         | High for arbitrary data layouts                | Moderate, tied to defined block structure    |
    
**Recommendation:**

Given PMK/ASI's goal to "scale as far as it can handle" and the desire for future-proofing and high performance with structured data:

1.  **Primary Recommendation: Uniform Buffer Objects (UBOs)**
    *   If the target environment for the visualizer can be **guaranteed to be WebGL2-compatible**, UBOs offer a cleaner, more structured, and potentially more performant way to handle large, organized sets of parameters. The direct, typed access in GLSL is a significant advantage for shader readability and maintainability. This seems to align well with passing complex state from an "Architect" model.
    *   The `std140` layout complexity is a one-time setup cost for each defined UBO structure.

2.  **Secondary/Fallback or Alternative: Data Textures**
    *   If **WebGL1 compatibility is a strict requirement**, Data Textures are the most viable solution for large data volumes.
    *   They are also suitable if the data is extremely large (e.g., megabytes, exceeding typical UBO limits) or if its structure is highly dynamic and not easily definable in a fixed UBO block.
    *   Could also be used *in conjunction* with UBOs: UBOs for frequently accessed structured parameters, and Data Textures for larger, less frequently changing bulk data.

**Decision Point:** The choice heavily depends on the WebGL version constraint. For a forward-looking "elemental core," designing with WebGL2 (and thus UBOs) as the baseline would be preferable for its enhanced capabilities. If WebGL1 must be supported, Data Textures are the way.

For the purpose of this conceptual step, we will assume **UBOs are the preferred path if WebGL2 is acceptable**, due to the cleaner integration with structured data from PMK/ASI. If not, Data Textures are the fallback. The documentation should reflect this.
