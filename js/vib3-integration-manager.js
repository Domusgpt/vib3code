/**
 * VIB3CODE INTEGRATION MANAGER
 * 
 * Connects the HomeBasedReactiveSystem with the VIB3MultiVisualizerWebGL
 * Manages section switching and parameter synchronization
 * 
 * ARCHITECTURE: Direct WebGL approach with home-master parameter system
 */

console.log('🔗 VIB3CODE Integration Manager loading...');

class VIB3IntegrationManager {
    constructor() {
        this.homeMaster = null;
        this.multiVisualizer = null;
        this.currentSection = 'home';
        this.isInitialized = false;
        
        // Section navigation mapping
        this.sectionMapping = {
            'home': 'home',
            'homepage': 'home',
            'articles': 'articles',
            'videos': 'videos', 
            'podcasts': 'podcasts',
            'ema': 'ema'
        };
        
        console.log('🔗 Integration Manager created');
    }
    
    async initialize() {
        try {
            console.log('🔧 Initializing VIB3CODE Integration Manager...');
            
            // Wait for home-master system
            await this.waitForHomeMaster();
            
            // Wait for multi-visualizer system
            await this.waitForMultiVisualizer();
            
            // Initialize home-master system
            this.initializeHomeMaster();
            
            // Connect systems
            this.connectSystems();
            
            // Setup section navigation
            this.setupSectionNavigation();
            
            // Setup parameter synchronization
            this.setupParameterSync();
            
            this.isInitialized = true;
            
            console.log('✅ VIB3CODE Integration Manager initialized successfully');
            return this;
            
        } catch (error) {
            console.error('❌ Integration Manager initialization failed:', error);
            throw error;
        }
    }
    
    async waitForHomeMaster() {
        return new Promise((resolve, reject) => {
            const maxWait = 10000; // 10 seconds
            const startTime = Date.now();
            
            const checkHomeMaster = () => {
                if (window.HomeBasedReactiveSystem) {
                    console.log('✅ Home-Master System detected');
                    resolve();
                } else if (Date.now() - startTime > maxWait) {
                    reject(new Error('Home-Master System not found'));
                } else {
                    setTimeout(checkHomeMaster, 100);
                }
            };
            
            checkHomeMaster();
        });
    }
    
    async waitForMultiVisualizer() {
        return new Promise((resolve, reject) => {
            const maxWait = 10000; // 10 seconds
            const startTime = Date.now();
            
            const checkMultiVisualizer = () => {
                if (window.vib3MultiVisualizer || window.vib3MultiVisualizerReady) {
                    console.log('✅ Multi-Visualizer System detected');
                    resolve();
                } else if (Date.now() - startTime > maxWait) {
                    reject(new Error('Multi-Visualizer System not found'));
                } else {
                    setTimeout(checkMultiVisualizer, 100);
                }
            };
            
            checkMultiVisualizer();
        });
    }
    
    initializeHomeMaster() {
        // Create home-master system instance
        this.homeMaster = new window.HomeBasedReactiveSystem();
        
        // Initialize with random home parameters
        this.homeMaster.randomizeHome();
        
        // Export to global scope for debugging
        window.homeMasterSystem = this.homeMaster;
        
        console.log('🏠 Home-Master System initialized');
        console.log('📊 Configuration Summary:', this.homeMaster.getConfigSummary());
    }
    
    connectSystems() {
        // Get multi-visualizer instance
        this.multiVisualizer = window.vib3MultiVisualizer;
        
        if (!this.multiVisualizer) {
            throw new Error('Multi-Visualizer not available');
        }
        
        console.log('🔗 Systems connected successfully');
    }
    
    setupParameterSync() {
        // Listen for home-master parameter changes
        this.homeMaster.onChange((allConfigs) => {
            if (this.multiVisualizer) {
                // Get current section config
                const currentConfig = allConfigs[this.currentSection] || allConfigs.home;
                
                // Update multi-visualizer parameters
                this.multiVisualizer.updateParameters(currentConfig);
                
                console.log(`🎨 Parameters updated for section: ${this.currentSection}`);
            }
        });
        
        console.log('🔄 Parameter synchronization active');
    }
    
    setupSectionNavigation() {
        // Handle section switching
        this.setupNavigationListeners();
        
        // Handle scroll-based section detection
        this.setupScrollSectionDetection();
        
        console.log('🧭 Section navigation active');
    }
    
    setupNavigationListeners() {
        // Listen for navigation clicks
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href || href.startsWith('http') || href.startsWith('#')) return;
            
            // Extract section from href
            const section = this.extractSectionFromHref(href);
            if (section && section !== this.currentSection) {
                this.switchToSection(section);
            }
        });
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const section = this.extractSectionFromHash();
            if (section && section !== this.currentSection) {
                this.switchToSection(section);
            }
        });
    }
    
    setupScrollSectionDetection() {
        // Detect which section is currently visible
        let ticking = false;
        
        const updateSectionFromScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const visibleSection = this.detectVisibleSection();
                    if (visibleSection && visibleSection !== this.currentSection) {
                        this.switchToSection(visibleSection, false); // Don't scroll to section
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', updateSectionFromScroll);
    }
    
    extractSectionFromHref(href) {
        // Extract section from various href formats
        const cleanHref = href.replace(/^\/+/, '').split('?')[0].split('#')[0];
        
        if (!cleanHref || cleanHref === '/') return 'home';
        
        // Map common section names
        const sectionMap = {
            '': 'home',
            'index.html': 'home',
            'articles': 'articles',
            'articles.html': 'articles',
            'videos': 'videos', 
            'videos.html': 'videos',
            'podcasts': 'podcasts',
            'podcasts.html': 'podcasts',
            'ema': 'ema',
            'ema.html': 'ema'
        };
        
        return sectionMap[cleanHref] || 'home';
    }
    
    extractSectionFromHash() {
        const hash = window.location.hash.replace('#', '');
        return this.sectionMapping[hash] || null;
    }
    
    detectVisibleSection() {
        // Find which section is most visible in viewport
        const sections = document.querySelectorAll('[data-section], section[id]');
        let mostVisible = null;
        let maxVisibility = 0;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const visibility = this.calculateVisibility(rect);
            
            if (visibility > maxVisibility) {
                maxVisibility = visibility;
                mostVisible = section.getAttribute('data-section') || 
                             section.getAttribute('id') || 
                             'home';
            }
        });
        
        return this.sectionMapping[mostVisible] || 'home';
    }
    
    calculateVisibility(rect) {
        const viewportHeight = window.innerHeight;
        const elementHeight = rect.height;
        
        // Element completely above viewport
        if (rect.bottom < 0) return 0;
        
        // Element completely below viewport  
        if (rect.top > viewportHeight) return 0;
        
        // Calculate visible portion
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        
        return visibleHeight / elementHeight;
    }
    
    switchToSection(sectionId, shouldScroll = true) {
        const normalizedSection = this.sectionMapping[sectionId] || sectionId;
        
        if (normalizedSection === this.currentSection) return;
        
        console.log(`🔄 Switching from ${this.currentSection} to ${normalizedSection}`);
        
        this.currentSection = normalizedSection;
        
        // Update multi-visualizer
        if (this.multiVisualizer) {
            this.multiVisualizer.switchSection(normalizedSection);
        }
        
        // Update document title
        this.updateDocumentTitle(normalizedSection);
        
        // Trigger home-master parameter update
        if (this.homeMaster) {
            const sectionConfig = this.homeMaster.getSectionConfig(normalizedSection);
            if (this.multiVisualizer) {
                this.multiVisualizer.updateParameters(sectionConfig);
            }
        }
        
        // Scroll to section if requested
        if (shouldScroll) {
            this.scrollToSection(normalizedSection);
        }
        
        console.log(`✅ Switched to section: ${normalizedSection}`);
    }
    
    updateDocumentTitle(sectionId) {
        const titles = {
            home: 'VIB3CODE - Digital Freedom Through Elegant Code',
            articles: 'VIB3CODE - Technical Articles & EMA Philosophy', 
            videos: 'VIB3CODE - Video Essays & Digital Liberation',
            podcasts: 'VIB3CODE - Digital Liberation Podcast',
            ema: 'VIB3CODE - Exoditical Moral Architecture'
        };
        
        const newTitle = titles[sectionId] || titles.home;
        document.title = newTitle;
    }
    
    scrollToSection(sectionId) {
        // Find section element to scroll to
        const sectionElement = document.querySelector(`[data-section="${sectionId}"]`) ||
                              document.querySelector(`#${sectionId}`) ||
                              document.querySelector(`.${sectionId}-section`);
        
        if (sectionElement) {
            sectionElement.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    // Public API methods
    
    getCurrentSection() {
        return this.currentSection;
    }
    
    getHomeMasterConfig() {
        return this.homeMaster ? this.homeMaster.getAllConfigurations() : null;
    }
    
    getMultiVisualizerInfo() {
        return this.multiVisualizer ? this.multiVisualizer.getPerformanceInfo() : null;
    }
    
    randomizeHomeParameters() {
        if (this.homeMaster) {
            this.homeMaster.randomizeHome();
            console.log('🎲 Home parameters randomized');
        }
    }
    
    adjustHomeParameter(paramName, value) {
        if (this.homeMaster) {
            this.homeMaster.adjustHomeParameter(paramName, value);
            console.log(`🎛️ Adjusted ${paramName} to ${value}`);
        }
    }
    
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            currentSection: this.currentSection,
            homeMasterReady: !!this.homeMaster,
            multiVisualizerReady: !!this.multiVisualizer,
            homeMasterConfig: this.getHomeMasterConfig(),
            visualizerPerformance: this.getMultiVisualizerInfo()
        };
    }
}

// Global initialization
let vib3IntegrationManager = null;

async function initializeVIB3Integration() {
    try {
        console.log('🚀 Starting VIB3CODE Integration Manager...');
        
        vib3IntegrationManager = new VIB3IntegrationManager();
        await vib3IntegrationManager.initialize();
        
        // Export to global scope
        window.vib3IntegrationManager = vib3IntegrationManager;
        window.vib3IntegrationReady = true;
        
        // Setup global keyboard shortcuts for testing
        setupGlobalShortcuts();
        
        console.log('✅ VIB3CODE Integration Manager ready');
        console.log('📊 System Status:', vib3IntegrationManager.getSystemStatus());
        
        return vib3IntegrationManager;
        
    } catch (error) {
        console.error('❌ VIB3CODE Integration initialization failed:', error);
        return null;
    }
}

function setupGlobalShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Only trigger shortcuts if not typing in input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const manager = window.vib3IntegrationManager;
        if (!manager) return;
        
        switch (event.key) {
            case '1':
                manager.switchToSection('home');
                break;
            case '2':
                manager.switchToSection('articles');
                break;
            case '3':
                manager.switchToSection('videos');
                break;
            case '4':
                manager.switchToSection('podcasts');
                break;
            case '5':
                manager.switchToSection('ema');
                break;
            case 'r':
            case 'R':
                manager.randomizeHomeParameters();
                break;
        }
    });
    
    console.log('⌨️ Global shortcuts active (1-5 for sections, R for randomize)');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeVIB3Integration, 500); // Small delay for other systems
    });
} else {
    setTimeout(initializeVIB3Integration, 500);
}

// Export for ES6 modules
export { VIB3IntegrationManager, initializeVIB3Integration };
export default VIB3IntegrationManager;