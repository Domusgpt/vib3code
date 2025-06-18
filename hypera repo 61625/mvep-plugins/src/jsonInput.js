/* packages/mvep-plugins/src/jsonInput.js - v1.0 */

/**
 * JSON Input Plugin for MVEP
 * Converts JSON data structures into 4D visualization parameters
 * Part of the Polytopal Projection Processing (PPP) system
 */
export class JSONInputPlugin {
    constructor(options = {}) {
        this.options = {
            maxDepth: 10,
            colorScheme: 'type', // 'type', 'depth', 'size'
            complexityMapping: 'logarithmic', // 'linear', 'logarithmic', 'exponential'
            ...options
        };
        
        // Type to color mapping
        this.typeColors = {
            object: 0.0,    // Red spectrum
            array: 0.2,     // Orange spectrum
            string: 0.4,    // Yellow spectrum
            number: 0.6,    // Green spectrum
            boolean: 0.8,   // Blue spectrum
            null: 1.0       // Purple spectrum
        };
    }
    
    /**
     * Process JSON data into visualization parameters
     * @param {Object|Array} jsonData - JSON data to visualize
     * @returns {Object} Visualization parameters for MVEP
     */
    process(jsonData) {
        if (!jsonData) {
            return this._getDefaultParams();
        }
        
        // Analyze JSON structure
        const analysis = this._analyzeStructure(jsonData);
        
        // Map to visualization parameters
        return {
            dimension: this._mapDepthToDimension(analysis.maxDepth),
            morphing: this._mapComplexityToMorphing(analysis.complexity),
            color: this._mapTypeToColor(analysis.dominantType),
            rotation: this._mapSizeToRotation(analysis.totalNodes),
            density: this._mapDensityFromStructure(analysis),
            
            // Additional metadata for advanced visualizations
            metadata: {
                depth: analysis.maxDepth,
                nodes: analysis.totalNodes,
                types: analysis.typeDistribution,
                complexity: analysis.complexity,
                patterns: analysis.patterns
            }
        };
    }
    
    /**
     * Analyze JSON structure recursively
     * @private
     */
    _analyzeStructure(data, currentDepth = 0) {
        const analysis = {
            maxDepth: currentDepth,
            totalNodes: 1,
            typeDistribution: {},
            complexity: 0,
            patterns: [],
            dominantType: typeof data
        };
        
        const type = this._getType(data);
        analysis.typeDistribution[type] = 1;
        
        if (type === 'object' && data !== null) {
            const keys = Object.keys(data);
            analysis.complexity += keys.length;
            
            // Check for patterns
            if (this._isHomogeneous(data)) {
                analysis.patterns.push('homogeneous');
            }
            if (this._isNested(data)) {
                analysis.patterns.push('nested');
            }
            
            // Recurse through properties
            keys.forEach(key => {
                const subAnalysis = this._analyzeStructure(data[key], currentDepth + 1);
                analysis.maxDepth = Math.max(analysis.maxDepth, subAnalysis.maxDepth);
                analysis.totalNodes += subAnalysis.totalNodes;
                analysis.complexity += subAnalysis.complexity;
                
                // Merge type distributions
                Object.keys(subAnalysis.typeDistribution).forEach(subType => {
                    analysis.typeDistribution[subType] = 
                        (analysis.typeDistribution[subType] || 0) + subAnalysis.typeDistribution[subType];
                });
            });
        } else if (type === 'array') {
            analysis.complexity += data.length;
            
            // Check array patterns
            if (data.length > 0 && this._isHomogeneousArray(data)) {
                analysis.patterns.push('homogeneous-array');
            }
            
            // Recurse through elements
            data.forEach(item => {
                const subAnalysis = this._analyzeStructure(item, currentDepth + 1);
                analysis.maxDepth = Math.max(analysis.maxDepth, subAnalysis.maxDepth);
                analysis.totalNodes += subAnalysis.totalNodes;
                analysis.complexity += subAnalysis.complexity;
                
                // Merge type distributions
                Object.keys(subAnalysis.typeDistribution).forEach(subType => {
                    analysis.typeDistribution[subType] = 
                        (analysis.typeDistribution[subType] || 0) + subAnalysis.typeDistribution[subType];
                });
            });
        }
        
        // Determine dominant type
        let maxCount = 0;
        Object.entries(analysis.typeDistribution).forEach(([type, count]) => {
            if (count > maxCount) {
                maxCount = count;
                analysis.dominantType = type;
            }
        });
        
        return analysis;
    }
    
    /**
     * Map nesting depth to 4D dimension parameter
     * @private
     */
    _mapDepthToDimension(depth) {
        // Map depth 0-10 to dimension 3.0-4.5
        const normalized = Math.min(depth / this.options.maxDepth, 1.0);
        return 3.0 + normalized * 1.5;
    }
    
    /**
     * Map structural complexity to morphing parameter
     * @private
     */
    _mapComplexityToMorphing(complexity) {
        let normalized;
        
        switch (this.options.complexityMapping) {
            case 'logarithmic':
                normalized = Math.log(complexity + 1) / Math.log(1000);
                break;
            case 'exponential':
                normalized = (Math.exp(complexity / 100) - 1) / (Math.exp(10) - 1);
                break;
            case 'linear':
            default:
                normalized = complexity / 1000;
                break;
        }
        
        return Math.min(Math.max(normalized, 0), 1);
    }
    
    /**
     * Map data type to color parameter
     * @private
     */
    _mapTypeToColor(type) {
        return this.typeColors[type] || 0.5;
    }
    
    /**
     * Map total node count to rotation speed
     * @private
     */
    _mapSizeToRotation(nodeCount) {
        // Larger structures rotate slower for better observation
        const normalized = Math.log(nodeCount + 1) / Math.log(10000);
        return 1.0 - (normalized * 0.8); // 1.0 to 0.2
    }
    
    /**
     * Map structure patterns to grid density
     * @private
     */
    _mapDensityFromStructure(analysis) {
        let density = 1.0;
        
        // Adjust based on patterns
        if (analysis.patterns.includes('homogeneous')) {
            density *= 0.8; // Less dense for uniform structures
        }
        if (analysis.patterns.includes('nested')) {
            density *= 1.2; // More dense for deeply nested
        }
        if (analysis.totalNodes > 100) {
            density *= 0.7; // Reduce density for large structures
        }
        
        return Math.max(0.3, Math.min(2.0, density));
    }
    
    /**
     * Get standardized type name
     * @private
     */
    _getType(data) {
        if (data === null) return 'null';
        if (Array.isArray(data)) return 'array';
        return typeof data;
    }
    
    /**
     * Check if object has homogeneous values
     * @private
     */
    _isHomogeneous(obj) {
        const values = Object.values(obj);
        if (values.length === 0) return true;
        
        const firstType = this._getType(values[0]);
        return values.every(val => this._getType(val) === firstType);
    }
    
    /**
     * Check if object contains nested objects/arrays
     * @private
     */
    _isNested(obj) {
        return Object.values(obj).some(val => {
            const type = this._getType(val);
            return type === 'object' || type === 'array';
        });
    }
    
    /**
     * Check if array elements are homogeneous
     * @private
     */
    _isHomogeneousArray(arr) {
        if (arr.length === 0) return true;
        
        const firstType = this._getType(arr[0]);
        return arr.every(item => this._getType(item) === firstType);
    }
    
    /**
     * Get default visualization parameters
     * @private
     */
    _getDefaultParams() {
        return {
            dimension: 3.0,
            morphing: 0.0,
            color: 0.5,
            rotation: 1.0,
            density: 1.0,
            metadata: {
                depth: 0,
                nodes: 0,
                types: {},
                complexity: 0,
                patterns: []
            }
        };
    }
    
    /**
     * Create a real-time stream processor for live JSON updates
     * @param {Function} onUpdate - Callback for parameter updates
     * @returns {Function} Update function
     */
    createStreamProcessor(onUpdate) {
        let previousAnalysis = null;
        
        return (jsonData) => {
            const params = this.process(jsonData);
            
            // Calculate deltas for smooth transitions
            if (previousAnalysis) {
                params.transition = {
                    dimensionDelta: params.dimension - previousAnalysis.dimension,
                    morphingDelta: params.morphing - previousAnalysis.morphing,
                    colorDelta: params.color - previousAnalysis.color
                };
            }
            
            previousAnalysis = params;
            onUpdate(params);
        };
    }
}

// Specialized plugins for common JSON structures

/**
 * API Response visualization plugin
 */
export class APIResponsePlugin extends JSONInputPlugin {
    constructor(options = {}) {
        super({
            colorScheme: 'status',
            ...options
        });
    }
    
    process(responseData) {
        const baseParams = super.process(responseData);
        
        // Enhance with API-specific mappings
        if (responseData.status) {
            baseParams.color = this._mapStatusToColor(responseData.status);
        }
        
        if (responseData.error) {
            baseParams.morphing = 1.0; // Max distortion for errors
        }
        
        return baseParams;
    }
    
    _mapStatusToColor(status) {
        const statusColors = {
            200: 0.4,  // Green
            201: 0.4,
            204: 0.4,
            400: 0.1,  // Red
            401: 0.15,
            403: 0.15,
            404: 0.2,
            500: 0.0   // Deep red
        };
        
        return statusColors[status] || 0.5;
    }
}

/**
 * Configuration file visualization plugin
 */
export class ConfigPlugin extends JSONInputPlugin {
    constructor(options = {}) {
        super({
            colorScheme: 'depth',
            complexityMapping: 'linear',
            ...options
        });
    }
    
    process(configData) {
        const baseParams = super.process(configData);
        
        // Config files are usually static, reduce rotation
        baseParams.rotation *= 0.5;
        
        // Increase density for better structure visibility
        baseParams.density *= 1.5;
        
        return baseParams;
    }
}

export default JSONInputPlugin;