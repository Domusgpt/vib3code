// js/VisualizerController.js

export class VisualizerController {
    constructor(hypercubeCoreInstance) {
        if (!hypercubeCoreInstance) {
            throw new Error("VisualizerController requires a HypercubeCore instance.");
        }
        this.core = hypercubeCoreInstance;
        console.log("VisualizerController initialized.");
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
     * Example: { morphFactor: 0.5, colors: { primary: [1,0,0] } }
     */
    setVisualStyle(styleParams) {
        if (typeof styleParams !== 'object' || styleParams === null) {
            console.error("VisualizerController: Invalid styleParams object provided.");
            return;
        }

        const coreParamsToUpdate = {};

        if (styleParams.hasOwnProperty('dimensions') && typeof styleParams.dimensions === 'number') { // Added from API_REFERENCE
            coreParamsToUpdate.dimensions = styleParams.dimensions;
        }
        if (styleParams.hasOwnProperty('projectionMethod') && typeof styleParams.projectionMethod === 'string') { // Added from API_REFERENCE
            coreParamsToUpdate.projectionMethod = styleParams.projectionMethod;
        }
        if (styleParams.hasOwnProperty('morphFactor') && typeof styleParams.morphFactor === 'number') {
            coreParamsToUpdate.morphFactor = styleParams.morphFactor;
        }
        if (styleParams.hasOwnProperty('rotationSpeed') && typeof styleParams.rotationSpeed === 'number') {
            coreParamsToUpdate.rotationSpeed = styleParams.rotationSpeed;
        }
        if (styleParams.hasOwnProperty('lineThickness') && typeof styleParams.lineThickness === 'number') {
            coreParamsToUpdate.lineThickness = styleParams.lineThickness;
        }
        if (styleParams.hasOwnProperty('shellWidth') && typeof styleParams.shellWidth === 'number') { // Added from API_REFERENCE
            coreParamsToUpdate.shellWidth = styleParams.shellWidth;
        }
        if (styleParams.hasOwnProperty('tetraThickness') && typeof styleParams.tetraThickness === 'number') { // Added from API_REFERENCE
            coreParamsToUpdate.tetraThickness = styleParams.tetraThickness;
        }
        if (styleParams.hasOwnProperty('patternIntensity') && typeof styleParams.patternIntensity === 'number') { // Added from API_REFERENCE
            coreParamsToUpdate.patternIntensity = styleParams.patternIntensity;
        }
        if (styleParams.hasOwnProperty('universeModifier') && typeof styleParams.universeModifier === 'number') { // Added from API_REFERENCE
            coreParamsToUpdate.universeModifier = styleParams.universeModifier;
        }
        if (styleParams.hasOwnProperty('glitchIntensity') && typeof styleParams.glitchIntensity === 'number') { // Added from API_REFERENCE
            coreParamsToUpdate.glitchIntensity = styleParams.glitchIntensity;
        }

        let colorSchemeUpdates = {};
        if (styleParams.colors) {
            if (styleParams.colors.primary && Array.isArray(styleParams.colors.primary) && styleParams.colors.primary.length === 3) {
                colorSchemeUpdates.primary = styleParams.colors.primary;
            }
            if (styleParams.colors.secondary && Array.isArray(styleParams.colors.secondary) && styleParams.colors.secondary.length === 3) {
                colorSchemeUpdates.secondary = styleParams.colors.secondary;
            }
            if (styleParams.colors.background && Array.isArray(styleParams.colors.background) && styleParams.colors.background.length === 3) {
                // Corrected: styleParams.colors.background, not style.params
                colorSchemeUpdates.background = styleParams.colors.background;
            }
        }

        if (Object.keys(colorSchemeUpdates).length > 0) {
            coreParamsToUpdate.colorScheme = {
                ...(this.core.state.colorScheme || {}),
                ...colorSchemeUpdates
            };
        }

        if (Object.keys(coreParamsToUpdate).length > 0) {
            this.core.updateParameters(coreParamsToUpdate);
            console.log("VisualizerController: Visual styles updated", coreParamsToUpdate);
        } else {
            console.log("VisualizerController: No valid visual styles provided to update.");
        }
    }

    /**
     * Updates the data channels for the visualization.
     * @param {number[]} dataArray - Array of 8 float values.
     */
    updateData(dataArray) {
        if (Array.isArray(dataArray) && dataArray.length === 8 && dataArray.every(v => typeof v === 'number')) {
            this.core.updateParameters({ dataChannels: dataArray });
            // console.log("VisualizerController: Data channels updated", dataArray); // Can be too verbose
        } else {
            console.error("VisualizerController: Invalid dataArray for updateData. Must be an array of 8 numbers.");
        }
    }

    setSpecificUniform(uniformName, value) {
        console.warn(`VisualizerController: setSpecificUniform('${uniformName}', `, value, `) called. This attempts to update a core state parameter. For direct arbitrary uniform setting, HypercubeCore/ShaderManager would need extension.`);
        // This simplified version assumes the uniformName might match a key in HypercubeCore's state.
        // True arbitrary uniform setting would require direct GL access or a more complex ShaderManager interface.
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
