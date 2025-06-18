# Visualizer API Reference

This document specifies the API for controlling the Headless Agentic Polytope Visualizer, designed for integration with systems like the Parserator Micro-Kernel (PMK) and Adaptive Schema Intelligence (ASI).

The visualizer is controlled via a JavaScript module, tentatively named `VisualizerController`, which wraps the core WebGL rendering engine (`HypercubeCore`).

## Initialization

### `new VisualizerController(config: VisualizerConfig): VisualizerControllerInstance`

Creates and initializes a new visualizer instance.

**`VisualizerConfig` Object:**

*   `canvasId?: string`: (Optional) The ID of an existing HTML canvas element to render to. If not provided, an offscreen canvas might be used, suitable for programmatic image extraction.
*   `initialDimensions?: int`: (Default: 4) Initial N-dimensions for polytope calculations.
*   `initialPolytope?: string`: (Default: 'hypercube') The name of the initial polytope to display.
*   `initialProjection?: string`: (Default: 'perspective') The initial projection method.
*   `baseParameters?: object`: (Optional) An object containing initial values for core visual parameters (see `setVisualStyle` for examples).
*   `dataChannelDefinition?: object`: (Optional) Describes the expected structure or names of data channels the visualizer will receive (e.g., `{ count: 3, names: ['focus_metric', 'confidence_score', 'anomaly_level'] }`). This helps in mapping data to shader uniforms.

## Runtime Control API Methods

All methods are part of the `VisualizerControllerInstance`.

### `setPolytope(polytopeName: string, styleParams?: object): Promise<void>`

Changes the currently displayed polytope and optionally sets initial style parameters specific to this polytope instance.

*   `polytopeName: string`: The registered name of the geometry to switch to (e.g., 'hypercube', 'duocylinder').
*   `styleParams?: object`: (Optional) An object with parameters to apply specifically to this polytope, potentially overriding global styles for certain features if the geometry supports it (e.g., specific line thickness for this polytope, initial morph state).

### `updateData(dataSnapshot: object): Promise<void>`

Provides a new snapshot of data from the controlling agent (PMK/ASI) to drive the visualization. The structure of `dataSnapshot` should align with what `dataChannelDefinition` might have specified or be a general key-value store that shaders can be adapted to use.

*   `dataSnapshot: object`: An object containing the data to be mapped to visual properties.
    *   Example: `{ "focus_metric": 0.75, "confidence_score": 0.98, "anomaly_level": 0.05, "raw_vector": [0.1, 0.2, ...], "active_schema_id": "contact_extraction" }`
    *   The visualizer (and its shaders) will be responsible for mapping these named values to specific `u_dataChannelN` uniforms or other custom uniforms.

### `setVisualStyle(styleParams: VisualStyleParams): Promise<void>`

Sets global visual style parameters for the visualization.

**`VisualStyleParams` Object (examples, can be expanded):**

*   `dimensions?: int`: Set the N-dimensionality for calculations.
*   `projectionMethod?: string`: Change the projection (e.g., 'perspective', 'orthographic').
*   `colors?: { primary?: vec3, secondary?: vec3, background?: vec3 }`: Update color scheme. Values are typically arrays `[r, g, b]` with components from 0.0 to 1.0.
*   `lineThickness?: float`: Global line thickness.
*   `shellWidth?: float`: Global shell width.
*   `tetraThickness?: float`: Global tetrahedron thickness.
*   `morphFactor?: float`: Global morph factor.
*   `rotationSpeed?: float`: Global base rotation speed.
*   `patternIntensity?: float`: Global pattern intensity.
*   `universeModifier?: float`: Global universe modifier.
*   `glitchIntensity?: float`: Global glitch intensity.
    // Other parameters from HypercubeCore's DEFAULT_STATE can be included.

### `setSpecificUniform(uniformName: string, value: any): Promise<void>`

Allows direct setting of a specific GLSL shader uniform. This provides fine-grained, low-level control for advanced scenarios where PMK/ASI needs to manipulate shader behavior directly.

*   `uniformName: string`: The exact name of the uniform in the shader (e.g., `u_customEffectStrength`).
*   `value: any`: The value to set. Must match the uniform's type (float, vec2, vec3, vec4, mat4, int, bool, arrays of these). The controller should attempt type validation or pass through.

### `getSnapshot(config: SnapshotConfig): Promise<string | ArrayBuffer>`

Renders a single frame of the current visualization state and returns it.

**`SnapshotConfig` Object:**

*   `format: 'png' | 'jpeg' | 'webp' | 'buffer'`: (Default: 'png') Desired output format. 'buffer' might return an ArrayBuffer of pixel data (e.g., RGBA).
*   `width?: int`: (Optional) Width of the snapshot. Defaults to canvas width.
*   `height?: int`: (Optional) Height of the snapshot. Defaults to canvas height.
*   `quality?: float`: (Optional, for 'jpeg'/'webp') Quality from 0.0 to 1.0.

### `dispose(): Promise<void>`

Cleans up WebGL resources and stops the rendering loop. The instance should not be used after calling `dispose`.

## Data Mapping and Shader Interaction (Conceptual)

*   The `dataSnapshot` provided to `updateData` will be processed by the `VisualizerController`.
*   The controller will map fields from `dataSnapshot` to a set of standardized `u_dataChannel[N]` uniforms (e.g., up to 8 or 16) or to specifically named custom uniforms if the active geometry/shader program is designed to use them.
*   The exact mapping strategy (e.g., which `dataSnapshot` field goes to which `u_dataChannel`) might be:
    1.  Pre-defined by convention.
    2.  Configurable during `VisualizerController` initialization (via `dataChannelDefinition`).
    3.  Dynamically updated via a dedicated API method (e.g., `setDataMappingRules(rules: object)` - future enhancement).
*   Shaders (both the main fragment shader and geometry-specific GLSL) will then use these `u_dataChannel[N]` or custom uniforms to drive visual properties, achieving the data representation.

This API is designed to be extensible. New methods and parameters can be added as the integration with PMK/ASI evolves and more specific control requirements are identified.
---

## Parameter Mapping Engine

To enable fine-grained and dynamic control of visual parameters by an external agent like PMK/ASI, the `VisualizerController` supports a configurable mapping layer. This layer translates fields from the `dataSnapshot` (provided via `updateData`) into specific visual parameters of the simulation.

### `setParameterMappingRules(rules: ParameterMappingRules): Promise<void>`

Sets or replaces the active mapping rules for the visualizer.

*   `rules: ParameterMappingRules`: An object defining the set of mapping rules. If `null` or an empty ruleset is provided, all existing mappings are cleared.

**`ParameterMappingRules` Object Structure:**

```json
{
  "mappings": [
    {
      "sourceField": "path.to.source.value_in_dataSnapshot",
      "targetParam": "visualizer.parameter_key",
      "enabled": true, // Optional, default true. Allows toggling rules.
      "scale": 1.0,    // Optional, default 1.0. Multiplier.
      "offset": 0.0,   // Optional, default 0.0. Added after scale.
      "minClamp": null, // Optional, e.g., 0.0. Applied after scale and offset.
      "maxClamp": null, // Optional, e.g., 1.0. Applied after scale and offset.
      "valueMapping": { // Optional. For mapping discrete source values to target values.
        // "source_value_1": "target_value_1_or_array",
        // "source_value_2": "target_value_2_or_array"
      },
      "defaultValue": null, // Optional. Value to use if sourceField is not found or valueMapping fails.
                           // If null and source not found, targetParam is not updated by this rule.
      "notes": "" // Optional, for human-readable comments about the rule.
    }
    // ... more mapping objects ...
  ]
}
```

**Mapping Rule Details:**

*   `sourceField: string`: A dot-notation path to the value within the `dataSnapshot` object passed to `updateData()`.
    *   Examples: `"metrics.anomalyScore"`, `"sensorData[2].value"`, `"asiState.activePath"`.
*   `targetParam: string`: A dot-notation path to the visualizer parameter to be updated. This typically corresponds to keys in `HypercubeCore.state` or nested keys within `HypercubeCore.state.colorScheme`.
    *   Examples: `"morphFactor"`, `"lineThickness"`, `"colorScheme.primary"`, `"colorScheme.secondary[0]"` (to target red component of secondary color).
*   `enabled: boolean` (Optional, default: `true`): If `false`, this rule is skipped.
*   `scale: number` (Optional, default: `1.0`): The value from `sourceField` is multiplied by `scale`.
*   `offset: number` (Optional, default: `0.0`): `offset` is added to the value after scaling.
*   `minClamp: number` (Optional): If provided, the value (after scale and offset) is clamped to not go below `minClamp`.
*   `maxClamp: number` (Optional): If provided, the value (after scale and offset) is clamped to not go above `maxClamp`.
*   `valueMapping: object` (Optional):
    *   An object where keys are expected values from `sourceField` and values are the corresponding values to be set for `targetParam`.
    *   If `valueMapping` is present, `scale`, `offset`, `minClamp`, `maxClamp` are ignored for this rule unless the source value is not found in `valueMapping` keys and a `defaultValue` is not provided (behavior TBD for this edge case - likely numerical transformations would apply to `defaultValue` if it's numerical).
    *   Example: `{"sourceField": "status", "targetParam": "glitchIntensity", "valueMapping": {"ERROR": 0.5, "WARNING": 0.1, "OK": 0.0}}`
*   `defaultValue: any` (Optional): If the `sourceField` is not found in the `dataSnapshot`, or if `valueMapping` is used and the source value doesn't match any key, this `defaultValue` will be used for the `targetParam`. If `defaultValue` itself is subject to scale/offset/clamp, it should be documented. Typically, `defaultValue` is a direct value for `targetParam`.
*   `notes: string` (Optional): Human-readable description or purpose of the rule.

**Processing Logic (Conceptual for `VisualizerController.updateData()`):**

1.  When `updateData(dataSnapshot)` is called:
2.  The `VisualizerController` retrieves the active `ParameterMappingRules`.
3.  It iterates through each enabled mapping rule in `rules.mappings`.
4.  For each rule:
    a.  It attempts to resolve `sourceField` from `dataSnapshot` (using a helper for dot notation and array access).
    b.  If the value is found:
        i.  If `valueMapping` is defined and the resolved value is a key in `valueMapping`, the corresponding mapped value is used.
        ii. Else, the resolved numerical value is processed: `finalValue = (resolvedValue * rule.scale) + rule.offset;`
        iii. `finalValue` is then clamped if `minClamp` and/or `maxClamp` are defined.
    c.  If the value is not found and `rule.defaultValue` is provided, `finalValue` becomes `rule.defaultValue`.
    d.  If a `finalValue` is determined, it's prepared for updating the `targetParam`.
5.  After evaluating all rules, the `VisualizerController` aggregates all changes for `HypercubeCore.state` and makes a single efficient call to `this.core.updateParameters({...aggregatedChanges})`. This is to avoid multiple small updates per frame.

This mapping engine provides a highly flexible way for PMK/ASI to translate its internal states and data characteristics into rich, dynamic visualizations without requiring changes to the visualizer's core rendering logic for every new mapping requirement.
