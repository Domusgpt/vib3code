/**
 * HOME-MASTER REACTIVE SYSTEM
 * 
 * CORE PRINCIPLE: Home section controls everything through mathematical relationships.
 * - FIXED: Each section's geometry (hypercube, tetrahedron, sphere, etc.)
 * - VARIABLE: Home parameters are randomized/set by editor each publish
 * - DERIVED: All other sections auto-calculate from home using unchanging relationship rules
 * 
 * Editor Controls:
 * 1. randomizeHome() - Randomizes home, all others auto-derive
 * 2. setHomeScrollReactivity() - Sets which parameters respond to scroll
 * 3. adjustHomeParameter() - Fine-tune home, others auto-recalculate
 */

class HomeBasedReactiveSystem {
  constructor() {
    // ONLY GEOMETRIES ARE FIXED PER SECTION (Brand DNA)
    this.FIXED_GEOMETRIES = {
      homepage: 'hypercube',
      technology: 'tetrahedron', 
      ema: 'sphere',
      pricing: 'crystal',
      docs: 'fractal',
      about: 'torus'
    };
    
    // MATHEMATICAL RELATIONSHIP RULES (UNCHANGING ARCHITECTURE)
    this.RELATIONSHIP_DNA = {
      technology: {
        // Parameter relationships to home
        gridDensity: home => home.gridDensity * 0.7,        // 70% of home
        morphFactor: home => 1.0 - home.morphFactor,       // OPPOSITE
        rotationSpeed: home => home.rotationSpeed * 1.5,   // 150% faster
        glitchIntensity: home => home.glitchIntensity * 0.3, // Much calmer
        dimension: home => Math.max(3.0, home.dimension - 0.5), // Less dimensional
        lineThickness: home => home.lineThickness * 1.2,   // Slightly thicker
        patternIntensity: home => home.patternIntensity * 0.8, // Less intense
        
        // Color relationship
        hueShift: 0.33,  // 120 degree color shift (cyan from magenta)
        
        // Scroll behavior relationship
        scrollDirection: -1,  // OPPOSITE scroll direction from home
        scrollMapsTo: null    // Uses same params as home by default
      },
      
      ema: {
        gridDensity: home => home.gridDensity * 1.2,        // 120% of home
        morphFactor: home => home.morphFactor * 0.5,        // Half morphing
        rotationSpeed: home => home.rotationSpeed * 0.3,    // Much slower
        glitchIntensity: home => home.glitchIntensity * 2.0, // Double glitch
        dimension: home => Math.min(4.0, home.dimension + 0.3), // More dimensional
        lineThickness: home => home.lineThickness * 0.8,   // Thinner
        patternIntensity: home => home.patternIntensity * 1.3, // More intense
        
        hueShift: 0.66,  // 240 degree color shift (yellow from magenta)
        scrollDirection: 0.5,  // Half sensitivity, same direction
        scrollMapsTo: null
      },
      
      pricing: {
        gridDensity: home => Math.max(5, home.gridDensity - 3), // Home minus 3, min 5
        morphFactor: home => Math.min(1.0, home.morphFactor + 0.3), // Home plus 0.3
        rotationSpeed: home => home.rotationSpeed * 2.0,    // Double speed
        glitchIntensity: home => home.glitchIntensity * 0.1, // Minimal glitch
        dimension: home => home.dimension * 0.8,            // Less dimensional
        lineThickness: home => home.lineThickness,          // Same thickness
        patternIntensity: home => home.patternIntensity * 0.6, // Less intense
        
        hueShift: 0.5,   // Complementary color (180 degrees) - mint from magenta
        scrollDirection: 1,  // Same direction as home
        scrollMapsTo: ['dimension', 'lineThickness'] // Different scroll params
      },
      
      docs: {
        gridDensity: home => home.gridDensity * 1.5,        // 150% density
        morphFactor: home => home.morphFactor * 1.8,        // High morphing
        rotationSpeed: home => home.rotationSpeed * 0.8,    // Slightly slower
        glitchIntensity: home => home.glitchIntensity * 3.0, // Maximum chaos
        dimension: home => Math.min(4.0, home.dimension + 0.7), // Highest dimensional
        lineThickness: home => home.lineThickness * 0.5,   // Much thinner
        patternIntensity: home => home.patternIntensity * 2.0, // Double intensity
        
        hueShift: 0.25,  // 90 degree shift (purple)
        scrollDirection: 1.5,  // More sensitive, same direction
        scrollMapsTo: null
      },
      
      about: {
        gridDensity: home => home.gridDensity * 0.5,        // Half density
        morphFactor: home => home.morphFactor * 1.2,        // More fluid
        rotationSpeed: home => home.rotationSpeed * 0.6,    // Slower
        glitchIntensity: home => home.glitchIntensity * 0.8, // Slightly less glitch
        dimension: home => home.dimension * 0.9,            // Slightly less dimensional
        lineThickness: home => home.lineThickness * 1.5,   // Thicker
        patternIntensity: home => home.patternIntensity,    // Same intensity
        
        hueShift: 0.125, // 45 degree shift (orange-green)
        scrollDirection: -0.7,  // Opposite but less sensitive
        scrollMapsTo: null
      }
    };
    
    // Current state
    this.currentHome = null;
    this.derivedSections = {};
    
    // Event callbacks
    this.onConfigChange = null;
  }
  
  // EDITOR CONTROL: Randomize home, everything else auto-derives
  randomizeHome() {
    this.currentHome = {
      geometry: this.FIXED_GEOMETRIES.homepage,
      
      // BASE PARAMETERS (randomized each publish)
      gridDensity: Math.random() * 15 + 5,     // 5-20
      morphFactor: Math.random(),              // 0-1  
      rotationSpeed: Math.random() * 2,        // 0-2
      glitchIntensity: Math.random() * 0.5,    // 0-0.5
      dimension: Math.random() * 1 + 3,        // 3-4
      lineThickness: Math.random() * 0.05 + 0.02, // 0.02-0.07
      patternIntensity: Math.random() * 2 + 0.5,   // 0.5-2.5
      universeModifier: Math.random() * 2 + 0.5,   // 0.5-2.5
      colorShift: Math.random() * 0.5,         // 0-0.5
      
      // COLOR
      hue: Math.random(),                      // 0-1 (full color wheel)
      saturation: Math.random() * 0.3 + 0.7,  // 0.7-1.0 (high saturation)
      brightness: Math.random() * 0.3 + 0.7,  // 0.7-1.0 (bright)
      
      // SCROLL REACTIVITY SETTINGS
      scrollDirection: Math.random() > 0.5 ? 1 : -1, // Up or down
      scrollParams: this.randomScrollCombination(),   // Which params react
      scrollSensitivity: Math.random() * 2 + 0.5     // 0.5-2.5
    };
    
    // Auto-derive all other sections
    this.deriveAllSections();
    
    // Notify listeners
    if (this.onConfigChange) {
      this.onConfigChange(this.getAllConfigurations());
    }
    
    return this.currentHome;
  }
  
  // EDITOR CONTROL: Set specific scroll reactivity for home
  setHomeScrollReactivity(paramCombination) {
    if (!this.currentHome) this.randomizeHome();
    
    const scrollOptions = {
      'gridDensity + morphFactor': ['gridDensity', 'morphFactor'],
      'rotationSpeed + glitchIntensity': ['rotationSpeed', 'glitchIntensity'],
      'dimension + lineThickness': ['dimension', 'lineThickness'],
      'gridDensity + morphFactor + glitchIntensity + rotationSpeed': 
        ['gridDensity', 'morphFactor', 'glitchIntensity', 'rotationSpeed'],
      'all-chaos': ['gridDensity', 'morphFactor', 'rotationSpeed', 'glitchIntensity', 'dimension', 'lineThickness'],
      'minimal': ['gridDensity'],
      'color-focus': ['colorShift', 'hue'],
      'dimensional': ['dimension', 'morphFactor']
    };
    
    this.currentHome.scrollParams = scrollOptions[paramCombination] || scrollOptions['gridDensity + morphFactor'];
    this.deriveAllSections();
    
    if (this.onConfigChange) {
      this.onConfigChange(this.getAllConfigurations());
    }
  }
  
  // AUTOMATIC: All sections derive from home using fixed relationship rules
  deriveAllSections() {
    if (!this.currentHome) return;
    
    Object.keys(this.RELATIONSHIP_DNA).forEach(sectionId => {
      const rules = this.RELATIONSHIP_DNA[sectionId];
      
      this.derivedSections[sectionId] = {
        geometry: this.FIXED_GEOMETRIES[sectionId],
        
        // Apply mathematical relationships to each parameter
        gridDensity: rules.gridDensity(this.currentHome),
        morphFactor: rules.morphFactor(this.currentHome),
        rotationSpeed: rules.rotationSpeed(this.currentHome),
        glitchIntensity: rules.glitchIntensity(this.currentHome),
        dimension: rules.dimension(this.currentHome),
        lineThickness: rules.lineThickness(this.currentHome),
        patternIntensity: rules.patternIntensity(this.currentHome),
        universeModifier: this.currentHome.universeModifier, // Usually inherited
        colorShift: this.currentHome.colorShift,             // Usually inherited
        
        // Color relationship
        hue: (this.currentHome.hue + rules.hueShift) % 1.0,
        saturation: this.currentHome.saturation,
        brightness: this.currentHome.brightness,
        
        // Scroll behavior relationship
        scrollDirection: this.currentHome.scrollDirection * rules.scrollDirection,
        scrollParams: rules.scrollMapsTo || this.currentHome.scrollParams,
        scrollSensitivity: this.currentHome.scrollSensitivity * Math.abs(rules.scrollDirection)
      };
    });
  }
  
  // Helper: Random scroll parameter combinations
  randomScrollCombination() {
    const options = [
      ['gridDensity', 'morphFactor'],
      ['rotationSpeed', 'glitchIntensity'],
      ['dimension', 'lineThickness'],
      ['gridDensity', 'morphFactor', 'glitchIntensity'],
      ['rotationSpeed', 'dimension'],
      ['gridDensity', 'rotationSpeed', 'morphFactor'],
      ['colorShift', 'morphFactor'],
      ['dimension', 'glitchIntensity']
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // EDITOR CONTROL: Manual home parameter adjustment (others auto-derive)
  adjustHomeParameter(paramName, value) {
    if (!this.currentHome) this.randomizeHome();
    
    // Clamp values to reasonable ranges
    const clampedValue = this.clampParameter(paramName, value);
    this.currentHome[paramName] = clampedValue;
    
    // Recalculate all relationships
    this.deriveAllSections();
    
    if (this.onConfigChange) {
      this.onConfigChange(this.getAllConfigurations());
    }
  }
  
  // Helper: Clamp parameter values to reasonable ranges
  clampParameter(paramName, value) {
    const ranges = {
      gridDensity: [1, 30],
      morphFactor: [0, 1],
      rotationSpeed: [0, 5],
      glitchIntensity: [0, 1],
      dimension: [3, 4],
      lineThickness: [0.01, 0.1],
      patternIntensity: [0.1, 5],
      universeModifier: [0.1, 5],
      colorShift: [0, 1],
      hue: [0, 1],
      saturation: [0, 1],
      brightness: [0, 1],
      scrollSensitivity: [0.1, 5]
    };
    
    const range = ranges[paramName] || [0, 10];
    return Math.max(range[0], Math.min(range[1], value));
  }
  
  // EDITOR CONTROL: Quick preset configurations
  loadPreset(presetName) {
    const presets = {
      'cyberpunk': {
        gridDensity: 15, morphFactor: 0.8, rotationSpeed: 1.5,
        glitchIntensity: 0.4, dimension: 3.7, hue: 0.8,
        scrollParams: ['gridDensity', 'glitchIntensity']
      },
      'minimal': {
        gridDensity: 8, morphFactor: 0.2, rotationSpeed: 0.3,
        glitchIntensity: 0.05, dimension: 3.2, hue: 0.0,
        scrollParams: ['gridDensity', 'morphFactor']
      },
      'chaotic': {
        gridDensity: 20, morphFactor: 0.9, rotationSpeed: 2.0,
        glitchIntensity: 0.5, dimension: 3.9, hue: 0.5,
        scrollParams: ['gridDensity', 'morphFactor', 'glitchIntensity', 'rotationSpeed']
      },
      'elegant': {
        gridDensity: 12, morphFactor: 0.4, rotationSpeed: 0.8,
        glitchIntensity: 0.1, dimension: 3.4, hue: 0.15,
        scrollParams: ['morphFactor', 'dimension']
      }
    };
    
    if (presets[presetName]) {
      this.currentHome = {
        geometry: this.FIXED_GEOMETRIES.homepage,
        lineThickness: 0.03,
        patternIntensity: 1.2,
        universeModifier: 1.0,
        colorShift: 0.1,
        saturation: 0.8,
        brightness: 0.9,
        scrollDirection: 1,
        scrollSensitivity: 1.0,
        ...presets[presetName]
      };
      
      this.deriveAllSections();
      
      if (this.onConfigChange) {
        this.onConfigChange(this.getAllConfigurations());
      }
    }
  }
  
  // Get current state for any section
  getSectionConfig(sectionId) {
    if (sectionId === 'homepage') return this.currentHome;
    return this.derivedSections[sectionId];
  }
  
  // Get all current configurations
  getAllConfigurations() {
    return {
      homepage: this.currentHome,
      ...this.derivedSections
    };
  }
  
  // Get configuration summary for debugging
  getConfigSummary() {
    if (!this.currentHome) return "No configuration loaded";
    
    let summary = `HOME: ${this.currentHome.geometry} | Grid: ${this.currentHome.gridDensity.toFixed(1)} | Morph: ${this.currentHome.morphFactor.toFixed(2)} | Scroll: ${this.currentHome.scrollParams.join('+')}\n`;
    
    Object.keys(this.derivedSections).forEach(sectionId => {
      const config = this.derivedSections[sectionId];
      summary += `${sectionId.toUpperCase()}: ${config.geometry} | Grid: ${config.gridDensity.toFixed(1)} | Morph: ${config.morphFactor.toFixed(2)} | Hue: ${config.hue.toFixed(2)}\n`;
    });
    
    return summary;
  }
  
  // Set callback for configuration changes
  onChange(callback) {
    this.onConfigChange = callback;
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HomeBasedReactiveSystem;
}

// Global export for browser use
if (typeof window !== 'undefined') {
  window.HomeBasedReactiveSystem = HomeBasedReactiveSystem;
}