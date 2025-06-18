// js/VisualizerController.js

export class VisualizerController {
    constructor(hypercubeCoreInstance, config = {}) {
        if (!hypercubeCoreInstance) {
            throw new Error("VisualizerController requires a HypercubeCore instance.");
        }
        this.core = hypercubeCoreInstance;
        // Process baseParameters first if they exist
        if (config.baseParameters && typeof config.baseParameters === 'object') {
            this.core.updateParameters(config.baseParameters);
            console.log("VisualizerController: Applied baseParameters.", config.baseParameters);
        }
        this.dataChannelDefinition = config.dataChannelDefinition || {};
        this.mappingRules = {
            ubo: [], // Array of objects: { snapshotField: string, uboChannelIndex: int, defaultValue: float, transform?: function }
            direct: {} // Object: snapshotField: { coreStateName: string, defaultValue: any, transform?: function }
        };
        this._generateInitialMappingRules(this.dataChannelDefinition); // This will populate the new structure
        console.log("VisualizerController initialized with config:", config);
        console.log("Initial mapping rules:", JSON.parse(JSON.stringify(this.mappingRules))); // Deep copy for logging
    }

    _generateInitialMappingRules(definition) {
        // Clear existing rules before applying new definition or defaults
        this.mappingRules.ubo = [];
        this.mappingRules.direct = {};

        if (definition && definition.uboChannels && Array.isArray(definition.uboChannels)) {
            definition.uboChannels.forEach(rule => {
                if (rule.snapshotField && typeof rule.uboChannelIndex === 'number' && rule.hasOwnProperty('defaultValue')) {
                    this.mappingRules.ubo.push({ ...rule });
                } else {
                    console.warn("VisualizerController: Invalid UBO channel rule in definition:", rule);
                }
            });
        } else {
            // Setup default UBO mappings if no definition provided for uboChannels
            for (let i = 0; i < 8; i++) { // Default for first 8 channels
                this.mappingRules.ubo.push({
                    snapshotField: `channel${i}`,
                    uboChannelIndex: i,
                    defaultValue: 0.0
                });
            }
            console.log("VisualizerController: Using default placeholder UBO mapping rules.");
        }

        if (definition && definition.directParams && Array.isArray(definition.directParams)) {
            definition.directParams.forEach(rule => {
                if (rule.snapshotField && rule.coreStateName && rule.hasOwnProperty('defaultValue')) {
                    this.mappingRules.direct[rule.snapshotField] = { ...rule };
                } else {
                    console.warn("VisualizerController: Invalid direct parameter rule in definition:", rule);
                }
            });
        } else {
            // Setup default direct mappings if no definition provided for directParams
            this.mappingRules.direct['polytope_rotationSpeed'] = { coreStateName: 'rotationSpeed', defaultValue: 0.5 };
            this.mappingRules.direct['main_morphFactor'] = { coreStateName: 'morphFactor', defaultValue: 0.5 };
            this.mappingRules.direct['visual_glitchIntensity'] = { coreStateName: 'glitchIntensity', defaultValue: 0.0 };
            console.log("VisualizerController: Using default placeholder direct mapping rules.");
        }
        // No return needed as it modifies this.mappingRules directly
    }

    /**
     * Sets the current polytope (geometry).
     * @param {string} polytopeName - The registered name of the geometry.
     */
    setPolytope(polytopeName) {
        if (typeof polytopeName === 'string') {
            this.core.updateParameters({ geometryType: polytopeName });
            console.log(`VisualizerController: Polytope changed to ${polytopeName}`);
        } else {
            console.error("VisualizerController: Invalid polytopeName provided.");
        }
    }

    /**
     * Sets global visual style parameters.
     * @param {object} styleParams - Object containing style parameters.
     * Example: { core: { morphFactor: 0.5, rotationSpeed: 0.1 }, projection: { perspective: { baseDistance: 3.0 } } }
     */
    setVisualStyle(styleParams) {
        if (typeof styleParams !== 'object' || styleParams === null) {
            console.error("VisualizerController: Invalid styleParams object provided.");
            return;
        }

        const paramsToUpdate = {};

        // Helper to recursively flatten and map parameters
        const processParams = (obj, prefix = '') => {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    const fullKey = prefix ? `${prefix}_${key}` : key;

                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        // Check for specific known object structures like colorScheme first
                        if (key === 'colorScheme') {
                            // colorScheme is a direct state property in HypercubeCore,
                            // but its sub-properties (primary, secondary, background) are what we update.
                            // HypercubeCore's updateParameters handles merging of colorScheme objects.
                            paramsToUpdate.colorScheme = { ...(this.core.state.colorScheme || {}), ...value };
                        } else if (key === 'colors') { // Legacy support for styleParams.colors.primary
                             paramsToUpdate.colorScheme = {
                                ...(this.core.state.colorScheme || {}),
                                ...(paramsToUpdate.colorScheme || {}), // merge with already processed colorScheme if any
                             };
                             if(value.primary) paramsToUpdate.colorScheme.primary = value.primary;
                             if(value.secondary) paramsToUpdate.colorScheme.secondary = value.secondary;
                             if(value.background) paramsToUpdate.colorScheme.background = value.background;
                        } else {
                            // For other nested objects, create a flattened key structure for HypercubeCore state
                            // e.g., projection: { perspective: { baseDistance: 3.0 } } becomes proj_perspective_baseDistance
                            // This requires HypercubeCore.state to have keys like 'proj_perspective_baseDistance'
                            // This part assumes that the structure in styleParams matches the flattened structure
                            // expected by HypercubeCore's DEFAULT_STATE and updateParameters logic.
                            // Example: styleParams.projection.perspective.baseDistance should map to
                            // core.state.proj_perspective_baseDistance
                            // We will assume for now that the keys in styleParams are already somewhat flattened
                            // or directly match HypercubeCore state keys.
                            // A more robust system would use a predefined schema or map.

                            // Let's try a simple flattening for common prefixes like 'proj' and 'geom' and 'lattice'
                            if (prefix === 'projection' || prefix === 'geometry' || prefix === 'lattice') {
                                // e.g. projection.perspective.baseDistance -> proj_perspective_baseDistance
                                // geometry.hypercube.wCoordFactor1 -> geom_hypercube_wCoordFactor1
                                // lattice.lineWidth -> lattice_lineWidth (if not already prefixed)
                                 processParams(value, `${prefix.substring(0,4)}_${key}`);
                            } else if (prefix === '' && (key === 'projection' || key === 'geometry' || key === 'lattice' || key === 'core')) {
                                 processParams(value, key === 'core' ? '' : key); // 'core' prefix is not added to state keys
                            } else {
                                // For other nested objects not following the pattern, they are ignored for now
                                // or would require specific handling.
                                console.warn(`VisualizerController: Unsupported nested style structure for key '${fullKey}'.`);
                            }
                        }
                    } else {
                        // Direct value or already flattened key
                        // If prefix is 'core', we don't add it (e.g. core.morphFactor -> morphFactor)
                        const stateKey = (prefix === 'core' || prefix === '') ? key : fullKey;
                        paramsToUpdate[stateKey] = value;
                    }
                }
            }
        };

        processParams(styleParams);

        // Legacy direct properties (kept for some backward compatibility or simple cases)
        // These will be overwritten by the processParams if there are conflicts, which is usually fine.
        if (styleParams.hasOwnProperty('dimensions') && typeof styleParams.dimensions === 'number') {
            paramsToUpdate.dimensions = styleParams.dimensions;
        }
        if (styleParams.hasOwnProperty('projectionMethod') && typeof styleParams.projectionMethod === 'string') {
            paramsToUpdate.projectionMethod = styleParams.projectionMethod;
        }
        // ... (add other direct top-level properties from the old setVisualStyle if needed)

        if (Object.keys(paramsToUpdate).length > 0) {
            this.core.updateParameters(paramsToUpdate);
            console.log("VisualizerController: Visual styles updated", paramsToUpdate);
        } else {
            console.log("VisualizerController: No valid visual styles provided or mapped to update.");
        }
    }

    /**
     * Updates the data channels for the visualization.
     * @param {object} dataSnapshot - Object containing data fields to map.
     */
    updateData(dataSnapshot) {
        if (typeof dataSnapshot !== 'object' || dataSnapshot === null) {
            console.error("VisualizerController: Invalid dataSnapshot object provided to updateData.");
            return;
        }

        // Ensure globalDataBuffer is available and has a length, otherwise use a default size.
        const uboSize = (this.core && this.core.globalDataBuffer && this.core.globalDataBuffer.length > 0)
                        ? this.core.globalDataBuffer.length
                        : 64; // Default UBO size if core or buffer not fully initialized

        let uboDataArray = new Float32Array(uboSize).fill(0.0);
        const directParamsToUpdate = {};
        const unmappedFields = { ...dataSnapshot };

        // UBO Mapping
        if (this.mappingRules.ubo && Array.isArray(this.mappingRules.ubo)) {
            this.mappingRules.ubo.forEach(rule => {
                let value;
                if (dataSnapshot.hasOwnProperty(rule.snapshotField)) {
                    value = dataSnapshot[rule.snapshotField];
                    delete unmappedFields[rule.snapshotField]; // Mark as mapped
                } else {
                    value = rule.defaultValue;
                }

                if (rule.transform && typeof rule.transform === 'function') {
                    try {
                        value = rule.transform(value);
                    } catch (e) {
                        console.warn(`VisualizerController: Error transforming UBO field '${rule.snapshotField}':`, e);
                        value = rule.defaultValue; // Fallback on transform error
                    }
                }

                const numericValue = parseFloat(value);
                if (!isNaN(numericValue)) {
                    if (rule.uboChannelIndex >= 0 && rule.uboChannelIndex < uboSize) {
                        uboDataArray[rule.uboChannelIndex] = numericValue;
                        // console.log(`VisualizerController: Mapped UBO field '${rule.snapshotField}' (raw: ${dataSnapshot[rule.snapshotField]}, transformed: ${numericValue}) to channel ${rule.uboChannelIndex}`);
                    } else {
                        console.warn(`VisualizerController: Invalid channel index ${rule.uboChannelIndex} for UBO field '${rule.snapshotField}'`);
                    }
                } else {
                    console.warn(`VisualizerController: Could not parse float for UBO field '${rule.snapshotField}' (value: ${value}). Using default ${rule.defaultValue}.`);
                    uboDataArray[rule.uboChannelIndex] = parseFloat(rule.defaultValue); // Ensure default is also float
                }
            });
            console.log("UBO Data Sent:", uboDataArray); // Added for verification
            this.core.updateParameters({ dataChannels: uboDataArray });
        } else {
            console.warn("VisualizerController: UBO mapping rules are missing or not an array.");
        }

        // Direct Parameter Mapping
        if (this.mappingRules.direct && typeof this.mappingRules.direct === 'object') {
            for (const snapshotField in this.mappingRules.direct) {
                const rule = this.mappingRules.direct[snapshotField];
                let value;

                if (dataSnapshot.hasOwnProperty(snapshotField)) {
                    value = dataSnapshot[snapshotField];
                    delete unmappedFields[snapshotField]; // Mark as mapped
                } else {
                    value = rule.defaultValue;
                }

                if (rule.transform && typeof rule.transform === 'function') {
                    try {
                        value = rule.transform(value);
                    } catch (e) {
                        console.warn(`VisualizerController: Error transforming direct param '${rule.coreStateName}' from field '${snapshotField}':`, e);
                        value = rule.defaultValue; // Fallback on transform error
                    }
                }

                // Basic type validation based on defaultValue's type (could be more robust)
                if (typeof value !== typeof rule.defaultValue && rule.defaultValue !== null && typeof rule.defaultValue !== 'undefined') {
                     // Attempt type coersion for numbers specifically if default is number and value is string
                    if (typeof rule.defaultValue === 'number' && typeof value === 'string') {
                        const parsedValue = parseFloat(value);
                        if (!isNaN(parsedValue)) {
                            value = parsedValue;
                        } else {
                             console.warn(`VisualizerController: Type mismatch for direct param '${rule.coreStateName}'. Expected type ~${typeof rule.defaultValue}, got ${typeof value}. Value:`, dataSnapshot[snapshotField], `Rule:`, rule, `Using default.`);
                             value = rule.defaultValue;
                        }
                    } else if (typeof rule.defaultValue === 'boolean' && typeof value !== 'boolean') {
                        // Simple coersion for boolean
                        value = !!value;
                    }
                    else {
                        console.warn(`VisualizerController: Type mismatch for direct param '${rule.coreStateName}'. Expected type ~${typeof rule.defaultValue}, got ${typeof value}. Value:`, dataSnapshot[snapshotField], `Rule:`, rule, `Using default.`);
                        value = rule.defaultValue;
                    }
                }
                directParamsToUpdate[rule.coreStateName] = value;
                // console.log(`VisualizerController: Mapped direct field '${snapshotField}' to core parameter '${rule.coreStateName}' (raw: ${dataSnapshot[snapshotField]}, final value: ${JSON.stringify(value)})`);
            }
        } else {
            console.warn("VisualizerController: Direct mapping rules are missing or not an object.");
        }

        if (Object.keys(directParamsToUpdate).length > 0) {
            this.core.updateParameters(directParamsToUpdate);
        }

        // Log unmapped fields
        if (Object.keys(unmappedFields).length > 0) {
            console.log("VisualizerController: Unmapped fields in dataSnapshot:", unmappedFields);
        }
    }

    /**
     * Sets or updates the data mapping rules.
     * @param {object} newRules - Object with optional 'ubo' and 'direct' properties.
     *                          'ubo' should be an array of rule objects.
     *                          'direct' should be an object where keys are snapshotFields.
     */
    setDataMappingRules(newRules) {
        if (typeof newRules !== 'object' || newRules === null) {
            console.error("VisualizerController: Invalid newRules object provided to setDataMappingRules.");
            return;
        }

        if (newRules.ubo && Array.isArray(newRules.ubo)) {
            // Simple strategy: Replace UBO rules.
            // More complex: merge based on uboChannelIndex or snapshotField.
            this.mappingRules.ubo = [];
            newRules.ubo.forEach(rule => {
                if (rule.snapshotField && typeof rule.uboChannelIndex === 'number' && rule.hasOwnProperty('defaultValue')) {
                    this.mappingRules.ubo.push({ ...rule });
                } else {
                    console.warn("VisualizerController: Invalid UBO channel rule in newRules:", rule);
                }
            });
            console.log("VisualizerController: UBO mapping rules updated.");
        }

        if (newRules.direct && typeof newRules.direct === 'object') {
            // Merge direct rules: new rules override or add to existing ones.
            for (const snapshotField in newRules.direct) {
                const rule = newRules.direct[snapshotField];
                if (rule.coreStateName && rule.hasOwnProperty('defaultValue')) {
                    this.mappingRules.direct[snapshotField] = { ...rule };
                } else {
                    console.warn("VisualizerController: Invalid direct parameter rule in newRules for field:", snapshotField, rule);
                }
            }
            console.log("VisualizerController: Direct mapping rules updated.");
        }
        console.log("VisualizerController: Mapping rules are now:", JSON.parse(JSON.stringify(this.mappingRules)));
    }

    setSpecificUniform(uniformName, value) {
        // The warning can be softened as HypercubeCore.updateParameters now handles many state vars that map to uniforms.
        console.log(`VisualizerController: setSpecificUniform('${uniformName}', `, value, `) called. This directly updates a HypercubeCore state parameter.`);
        if (typeof uniformName === 'string') {
            this.core.updateParameters({ [uniformName]: value });
        } else {
            console.error("VisualizerController: Invalid uniformName for setSpecificUniform.");
        }
    }

    // Placeholder for getSnapshot
    getSnapshot(config = { format: 'png' }) {
        console.warn("VisualizerController: getSnapshot() called but not implemented.", config);
        return Promise.reject(new Error("getSnapshot not implemented."));
    }

    // Placeholder for dispose
    dispose() {
        console.log("VisualizerController: dispose() called.");
        if (this.core && typeof this.core.dispose === 'function') {
            this.core.dispose();
        }
        this.core = null; // Release reference
    }
}
export default VisualizerController;
