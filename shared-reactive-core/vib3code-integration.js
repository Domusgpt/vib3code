/**
 * VIB3CODE HOME-MASTER INTEGRATION
 * 
 * Integrates the Home-Master Reactive System with VIB3CODE magazine sections.
 * Each magazine section gets its own visualizer instance configured from the 
 * home-derived parameters.
 */

class VIB3CodeReactiveIntegration {
  constructor() {
    this.homeMasterSystem = new HomeBasedReactiveSystem();
    this.sectionVisualizers = {};
    this.currentSection = 'homepage';
    
    // Initialize the system
    this.init();
  }
  
  init() {
    // Set up change listener for home-master system
    this.homeMasterSystem.onChange((allConfigs) => {
      this.updateAllSectionVisualizers(allConfigs);
    });
    
    // Set up section detection
    this.setupSectionDetection();
    
    // Load initial configuration
    this.homeMasterSystem.loadPreset('cyberpunk');
  }
  
  // Detect which section user is viewing
  setupSectionDetection() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId && sectionId !== this.currentSection) {
            this.switchToSection(sectionId);
          }
        }
      });
    }, { threshold: 0.5 });
    
    // Observe all sections
    document.querySelectorAll('[data-section]').forEach(section => {
      observer.observe(section);
    });
  }
  
  // Switch active section and transition visualizer
  switchToSection(sectionId) {
    console.log(`Switching to section: ${sectionId}`);
    this.currentSection = sectionId;
    
    // Get configuration for this section
    const config = this.homeMasterSystem.getSectionConfig(sectionId);
    if (config) {
      this.transitionToConfig(config);
    }
  }
  
  // Update all section visualizers when home changes
  updateAllSectionVisualizers(allConfigs) {
    Object.keys(allConfigs).forEach(sectionId => {
      const config = allConfigs[sectionId];
      const canvas = document.querySelector(`[data-section="${sectionId}"] canvas`);
      
      if (canvas && config) {
        // Initialize or update visualizer for this section
        if (!this.sectionVisualizers[sectionId]) {
          this.initializeSectionVisualizer(sectionId, canvas, config);
        } else {
          this.updateSectionVisualizer(sectionId, config);
        }
      }
    });
    
    // Update current section immediately
    if (this.currentSection && allConfigs[this.currentSection]) {
      this.transitionToConfig(allConfigs[this.currentSection]);
    }
  }
  
  // Initialize visualizer for a specific section
  initializeSectionVisualizer(sectionId, canvas, config) {
    console.log(`Initializing visualizer for ${sectionId}:`, config);
    
    // Create visualizer instance (assuming we have a base visualizer class)
    if (window.SimpleVisualizer) {
      const visualizer = new SimpleVisualizer();
      visualizer.setupCanvas(canvas);
      visualizer.applyConfig(config);
      this.sectionVisualizers[sectionId] = visualizer;
    }
  }
  
  // Update existing section visualizer
  updateSectionVisualizer(sectionId, config) {
    const visualizer = this.sectionVisualizers[sectionId];
    if (visualizer && visualizer.applyConfig) {
      visualizer.applyConfig(config);
    }
  }
  
  // Transition main visualizer to new configuration
  transitionToConfig(config) {
    const mainCanvas = document.getElementById('main-visualizer');
    if (mainCanvas && window.mainVisualizer) {
      // Smooth transition to new configuration
      window.mainVisualizer.transitionToConfig(config, 1000); // 1 second transition
    }
  }
  
  // EDITOR CONTROLS - expose to global scope
  
  randomizeHome() {
    return this.homeMasterSystem.randomizeHome();
  }
  
  setScrollReactivity(option) {
    this.homeMasterSystem.setHomeScrollReactivity(option);
  }
  
  adjustHomeParameter(param, value) {
    this.homeMasterSystem.adjustHomeParameter(param, value);
  }
  
  loadPreset(presetName) {
    this.homeMasterSystem.loadPreset(presetName);
  }
  
  getCurrentConfig() {
    return this.homeMasterSystem.getAllConfigurations();
  }
  
  getSectionConfig(sectionId) {
    return this.homeMasterSystem.getSectionConfig(sectionId);
  }
}

// VIB3CODE Magazine Section Mapping
const VIB3CODE_SECTIONS = {
  'homepage': 'hypercube',
  'articles': 'tetrahedron', 
  'philosophy': 'sphere',
  'community': 'torus',
  'podcasts': 'wave',
  'showcase': 'crystal',
  'about': 'fractal'
};

// Enhanced visualizer that works with home-master configs
class VIB3CodeVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = null;
    this.animationId = null;
    this.time = 0;
    this.scrollVelocity = 0;
    
    this.setupScrollTracking();
  }
  
  setupScrollTracking() {
    let lastScrollTop = 0;
    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      this.scrollVelocity = Math.abs(currentScrollTop - lastScrollTop);
      lastScrollTop = currentScrollTop;
      
      // Reset velocity after scroll stops
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.scrollVelocity = 0;
      }, 150);
    });
  }
  
  applyConfig(config) {
    this.config = config;
    console.log(`Applied config for ${config.geometry}:`, config);
  }
  
  transitionToConfig(newConfig, duration = 1000) {
    if (!this.config) {
      this.applyConfig(newConfig);
      return;
    }
    
    // Smooth transition between configurations
    const startConfig = { ...this.config };
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Interpolate between start and end configs
      this.config = this.interpolateConfigs(startConfig, newConfig, progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.config = newConfig;
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  interpolateConfigs(start, end, progress) {
    const interpolated = { ...start };
    
    // Interpolate numeric values
    const numericFields = ['gridDensity', 'morphFactor', 'rotationSpeed', 'glitchIntensity', 'dimension', 'hue'];
    numericFields.forEach(field => {
      if (start[field] !== undefined && end[field] !== undefined) {
        interpolated[field] = start[field] + (end[field] - start[field]) * progress;
      }
    });
    
    // Copy non-numeric fields from end
    interpolated.geometry = end.geometry;
    interpolated.scrollParams = end.scrollParams;
    interpolated.scrollDirection = end.scrollDirection;
    
    return interpolated;
  }
  
  render() {
    if (!this.config) return;
    
    this.time = performance.now();
    
    // Apply scroll reactivity
    const modifiedConfig = this.applyScrollReactivity(this.config);
    
    // Render based on geometry type
    switch (modifiedConfig.geometry) {
      case 'hypercube':
        this.renderHypercube(modifiedConfig);
        break;
      case 'tetrahedron':
        this.renderTetrahedron(modifiedConfig);
        break;
      case 'sphere':
        this.renderSphere(modifiedConfig);
        break;
      case 'torus':
        this.renderTorus(modifiedConfig);
        break;
      case 'crystal':
        this.renderCrystal(modifiedConfig);
        break;
      case 'fractal':
        this.renderFractal(modifiedConfig);
        break;
      default:
        this.renderHypercube(modifiedConfig);
    }
    
    this.animationId = requestAnimationFrame(() => this.render());
  }
  
  applyScrollReactivity(baseConfig) {
    const modified = { ...baseConfig };
    const scrollEffect = this.scrollVelocity * 0.01 * baseConfig.scrollSensitivity;
    
    if (baseConfig.scrollParams) {
      baseConfig.scrollParams.forEach(param => {
        if (modified[param] !== undefined) {
          const direction = baseConfig.scrollDirection || 1;
          modified[param] += scrollEffect * direction;
          
          // Clamp to reasonable ranges
          switch (param) {
            case 'gridDensity':
              modified[param] = Math.max(1, Math.min(30, modified[param]));
              break;
            case 'morphFactor':
              modified[param] = Math.max(0, Math.min(1, modified[param]));
              break;
            case 'glitchIntensity':
              modified[param] = Math.max(0, Math.min(1, modified[param]));
              break;
          }
        }
      });
    }
    
    return modified;
  }
  
  // Geometry rendering methods (simplified versions)
  renderHypercube(config) {
    this.clearCanvas();
    this.ctx.strokeStyle = `hsl(${config.hue * 360}, 80%, 60%)`;
    this.ctx.lineWidth = config.lineThickness || 2;
    
    // Simple hypercube wireframe
    const size = 100 + config.gridDensity * 5;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const rotation = this.time * 0.001 * config.rotationSpeed;
    
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(rotation);
    
    // Draw nested squares
    for (let i = 0; i < config.gridDensity; i++) {
      const s = size * (1 - i * 0.1);
      this.ctx.strokeRect(-s/2, -s/2, s, s);
    }
    
    this.ctx.restore();
  }
  
  renderTetrahedron(config) {
    this.clearCanvas();
    this.ctx.strokeStyle = `hsl(${config.hue * 360}, 80%, 60%)`;
    this.ctx.lineWidth = config.lineThickness || 2;
    
    // Simple tetrahedron wireframe
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const size = 80 + config.gridDensity * 3;
    
    this.ctx.beginPath();
    // Triangle shape
    this.ctx.moveTo(centerX, centerY - size);
    this.ctx.lineTo(centerX - size * 0.866, centerY + size * 0.5);
    this.ctx.lineTo(centerX + size * 0.866, centerY + size * 0.5);
    this.ctx.closePath();
    this.ctx.stroke();
  }
  
  renderSphere(config) {
    this.clearCanvas();
    this.ctx.strokeStyle = `hsl(${config.hue * 360}, 80%, 60%)`;
    this.ctx.lineWidth = config.lineThickness || 1;
    
    // Concentric circles
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    for (let i = 1; i <= config.gridDensity; i++) {
      const radius = i * 10;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }
  
  renderTorus(config) {
    this.clearCanvas();
    // Torus pattern - flowing curves
    this.ctx.strokeStyle = `hsl(${config.hue * 360}, 80%, 60%)`;
    this.ctx.lineWidth = config.lineThickness || 2;
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    for (let i = 0; i < config.gridDensity; i++) {
      const t = (this.time * 0.001 + i * 0.2) * config.rotationSpeed;
      const x = centerX + Math.cos(t) * (50 + i * 5);
      const y = centerY + Math.sin(t * 2) * (30 + i * 3);
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }
  
  renderCrystal(config) {
    this.clearCanvas();
    // Crystal lattice pattern
    this.ctx.strokeStyle = `hsl(${config.hue * 360}, 80%, 60%)`;
    this.ctx.lineWidth = config.lineThickness || 1;
    
    const spacing = Math.max(20, 200 / config.gridDensity);
    
    for (let x = 0; x < this.canvas.width; x += spacing) {
      for (let y = 0; y < this.canvas.height; y += spacing) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, spacing * 0.8, spacing * 0.8);
        this.ctx.stroke();
      }
    }
  }
  
  renderFractal(config) {
    this.clearCanvas();
    // Simple fractal tree
    this.ctx.strokeStyle = `hsl(${config.hue * 360}, 80%, 60%)`;
    this.ctx.lineWidth = config.lineThickness || 1;
    
    const drawBranch = (x, y, length, angle, depth) => {
      if (depth <= 0 || length < 2) return;
      
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
      
      const newLength = length * 0.7;
      drawBranch(endX, endY, newLength, angle - 0.5, depth - 1);
      drawBranch(endX, endY, newLength, angle + 0.5, depth - 1);
    };
    
    drawBranch(this.canvas.width / 2, this.canvas.height - 50, 80, -Math.PI/2, Math.min(8, config.gridDensity));
  }
  
  clearCanvas() {
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  start() {
    if (!this.animationId) {
      this.render();
    }
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// Initialize VIB3CODE integration when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.vib3codeIntegration = new VIB3CodeReactiveIntegration();
  
  // Initialize main visualizer
  const mainCanvas = document.getElementById('main-visualizer');
  if (mainCanvas) {
    window.mainVisualizer = new VIB3CodeVisualizer(mainCanvas);
    window.mainVisualizer.start();
  }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VIB3CodeReactiveIntegration, VIB3CodeVisualizer };
}