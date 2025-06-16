// VIB3CODE Dynamic Theme Engine - Mathematical Color Relationships
(function() {
    'use strict';
    
    function ThemeEngine() {
        this.baseTheme = this.generateBaseTheme();
        this.sectionModifiers = this.defineSectionModifiers();
        this.currentSection = 'hero';
        this.transitionDuration = 2000;
        
        this.init();
    }
    
    ThemeEngine.prototype.init = function() {
        console.log('🎨 Initializing VIB3CODE Theme Engine...');
        
        this.applyBaseTheme();
        this.setupSectionObserver();
        this.bindVisualizerEvents();
        
        console.log('✅ Theme Engine initialized with base theme:', this.baseTheme.name);
    };
    
    // Generate mathematically related base theme
    ThemeEngine.prototype.generateBaseTheme = function() {
        var themes = [
            {
                name: 'Digital Sovereignty',
                primary: { h: 210, s: 85, l: 25 },    // Deep blue
                secondary: { h: 330, s: 90, l: 45 },  // Magenta
                accent: { h: 45, s: 100, l: 60 },     // Gold
                background: { h: 210, s: 20, l: 8 },  // Dark blue-grey
                complexity: 'high',
                speed: 1.0
            },
            {
                name: 'Liberation Matrix',
                primary: { h: 160, s: 80, l: 30 },    // Teal
                secondary: { h: 20, s: 85, l: 50 },   // Orange-red
                accent: { h: 280, s: 95, l: 65 },     // Purple
                background: { h: 160, s: 15, l: 10 }, // Dark teal-grey
                complexity: 'medium',
                speed: 0.8
            },
            {
                name: 'Ethical Code',
                primary: { h: 120, s: 70, l: 35 },    // Green
                secondary: { h: 300, s: 80, l: 55 },  // Violet
                accent: { h: 60, s: 90, l: 70 },      // Yellow
                background: { h: 120, s: 25, l: 12 }, // Dark green-grey
                complexity: 'low',
                speed: 1.2
            },
            {
                name: 'Bridge Builder',
                primary: { h: 30, s: 75, l: 40 },     // Orange
                secondary: { h: 210, s: 85, l: 45 },  // Blue
                accent: { h: 315, s: 85, l: 60 },     // Pink
                background: { h: 30, s: 20, l: 15 },  // Dark orange-grey
                complexity: 'high',
                speed: 0.9
            },
            {
                name: 'Open Standards',
                primary: { h: 270, s: 80, l: 40 },    // Purple
                secondary: { h: 90, s: 75, l: 50 },   // Lime
                accent: { h: 180, s: 90, l: 65 },     // Cyan
                background: { h: 270, s: 18, l: 11 }, // Dark purple-grey
                complexity: 'medium',
                speed: 1.1
            },
            {
                name: 'Quantum Renaissance', 
                primary: { h: 340, s: 95, l: 40 },    // Deep rose
                secondary: { h: 200, s: 100, l: 35 }, // Electric blue
                accent: { h: 60, s: 100, l: 75 },     // Brilliant gold
                background: { h: 340, s: 25, l: 6 },  // Deep rose-black
                complexity: 'maximum',
                speed: 1.4
            },
            {
                name: 'Neural Elegance',
                primary: { h: 240, s: 60, l: 45 },    // Sophisticated blue
                secondary: { h: 15, s: 85, l: 55 },   // Warm copper
                accent: { h: 135, s: 70, l: 65 },     // Sage green
                background: { h: 240, s: 30, l: 9 },  // Midnight blue
                complexity: 'refined',
                speed: 0.7
            },
            {
                name: 'Code Alchemy',
                primary: { h: 285, s: 90, l: 38 },    // Mystic purple
                secondary: { h: 45, s: 95, l: 52 },   // Alchemical gold
                accent: { h: 165, s: 80, l: 58 },     // Emerald wisdom
                background: { h: 285, s: 35, l: 7 },  // Deep mystic
                complexity: 'dynamic',
                speed: 1.3
            }
        ];
        
        return themes[Math.floor(Math.random() * themes.length)];
    };
    
    // Define relative relationships between sections
    ThemeEngine.prototype.defineSectionModifiers = function() {
        return {
            hero: {
                name: 'Foundation',
                colorShift: { h: 0, s: 0, l: 0 },      // Base colors
                intensity: 1.0,
                particleCount: 100,
                animationStyle: 'flowing',
                visualComplexity: 'base'
            },
            articles: {
                name: 'Editorial Excellence', 
                colorShift: { h: 30, s: 10, l: 5 },    // Warmer, more saturated
                intensity: 0.8,
                particleCount: 75,
                animationStyle: 'elegant',
                visualComplexity: 'refined'
            },
            videos: {
                name: 'Visual Narrative',
                colorShift: { h: -45, s: 15, l: -5 },  // Cooler, more dramatic
                intensity: 1.3,
                particleCount: 150,
                animationStyle: 'cinematic',
                visualComplexity: 'dynamic'
            },
            tools: {
                name: 'Technical Precision',
                colorShift: { h: 60, s: -20, l: -10 }, // More analytical
                intensity: 0.9,
                particleCount: 50,
                animationStyle: 'geometric',
                visualComplexity: 'minimal'
            },
            parserator: {
                name: 'Data Liberation',
                colorShift: { h: 90, s: 25, l: 10 },   // Vibrant, energetic
                intensity: 1.5,
                particleCount: 200,
                animationStyle: 'energetic',
                visualComplexity: 'maximum'
            },
            freedom: {
                name: 'Digital Sovereignty',
                colorShift: { h: 120, s: 5, l: 15 },   // Philosophical, enlightened
                intensity: 1.1,
                particleCount: 100,
                animationStyle: 'meditative',
                visualComplexity: 'balanced'
            },
            newsletter: {
                name: 'Community Connection',
                colorShift: { h: -30, s: 20, l: 8 },   // Warmer, more inviting
                intensity: 0.7,
                particleCount: 80,
                animationStyle: 'welcoming',
                visualComplexity: 'soft'
            }
        };
    };
    
    // Apply base theme to CSS custom properties
    ThemeEngine.prototype.applyBaseTheme = function() {
        var root = document.documentElement;
        var theme = this.baseTheme;
        
        // Convert HSL to CSS strings
        var primary = 'hsl(' + theme.primary.h + ', ' + theme.primary.s + '%, ' + theme.primary.l + '%)';
        var secondary = 'hsl(' + theme.secondary.h + ', ' + theme.secondary.s + '%, ' + theme.secondary.l + '%)';
        var accent = 'hsl(' + theme.accent.h + ', ' + theme.accent.s + '%, ' + theme.accent.l + '%)';
        var background = 'hsl(' + theme.background.h + ', ' + theme.background.s + '%, ' + theme.background.l + '%)';
        
        // Update CSS custom properties
        root.style.setProperty('--theme-primary', primary);
        root.style.setProperty('--theme-secondary', secondary);
        root.style.setProperty('--theme-accent', accent);
        root.style.setProperty('--theme-background', background);
        root.style.setProperty('--theme-speed', theme.speed);
        root.style.setProperty('--theme-complexity', theme.complexity);
        
        // Store for visualizer access
        this.currentColors = {
            primary: primary,
            secondary: secondary,
            accent: accent,
            background: background
        };
        
        console.log('🎨 Applied base theme:', theme.name);
    };
    
    // Calculate section-specific colors maintaining relationships
    ThemeEngine.prototype.getSectionColors = function(sectionId) {
        var modifier = this.sectionModifiers[sectionId] || this.sectionModifiers.hero;
        var base = this.baseTheme;
        
        // Apply mathematical transformations while maintaining relationships
        var sectionColors = {
            primary: this.transformColor(base.primary, modifier.colorShift),
            secondary: this.transformColor(base.secondary, modifier.colorShift),
            accent: this.transformColor(base.accent, modifier.colorShift),
            background: this.transformColor(base.background, modifier.colorShift)
        };
        
        return {
            colors: sectionColors,
            intensity: modifier.intensity,
            particleCount: modifier.particleCount,
            animationStyle: modifier.animationStyle,
            visualComplexity: modifier.visualComplexity,
            name: modifier.name
        };
    };
    
    // Transform HSL color maintaining mathematical relationships
    ThemeEngine.prototype.transformColor = function(baseColor, shift) {
        return {
            h: (baseColor.h + shift.h + 360) % 360,
            s: Math.max(0, Math.min(100, baseColor.s + shift.s)),
            l: Math.max(0, Math.min(100, baseColor.l + shift.l))
        };
    };
    
    // Convert HSL object to CSS string
    ThemeEngine.prototype.hslToString = function(hsl) {
        return 'hsl(' + Math.round(hsl.h) + ', ' + Math.round(hsl.s) + '%, ' + Math.round(hsl.l) + '%)';
    };
    
    // Setup intersection observer for section detection
    ThemeEngine.prototype.setupSectionObserver = function() {
        var self = this;
        var options = {
            threshold: 0.3,
            rootMargin: '-20% 0px -20% 0px'
        };
        
        this.sectionObserver = new IntersectionObserver(function(entries) {
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (entry.isIntersecting) {
                    var sectionId = entry.target.id || 'hero';
                    self.transitionToSection(sectionId);
                }
            }
        }, options);
        
        // Observe all sections
        var sections = document.querySelectorAll('section, .parallax-section');
        for (var i = 0; i < sections.length; i++) {
            this.sectionObserver.observe(sections[i]);
        }
    };
    
    // Transition visualizer to section-specific theme
    ThemeEngine.prototype.transitionToSection = function(sectionId) {
        if (this.currentSection === sectionId) return;
        
        console.log('🎭 Transitioning to section:', sectionId);
        
        var sectionTheme = this.getSectionColors(sectionId);
        this.currentSection = sectionId;
        
        // Apply section colors to CSS
        this.applySectionTheme(sectionTheme);
        
        // Notify visualizer of section change
        this.notifyVisualizer(sectionTheme);
        
        // Update page elements
        this.updatePageElements(sectionId, sectionTheme);
    };
    
    // Apply section theme to CSS custom properties
    ThemeEngine.prototype.applySectionTheme = function(theme) {
        var root = document.documentElement;
        
        // Convert colors to CSS strings
        var primary = this.hslToString(theme.colors.primary);
        var secondary = this.hslToString(theme.colors.secondary);
        var accent = this.hslToString(theme.colors.accent);
        
        // Smooth transition
        root.style.transition = 'all ' + (this.transitionDuration / 1000) + 's ease-out';
        
        // Update theme properties
        root.style.setProperty('--section-primary', primary);
        root.style.setProperty('--section-secondary', secondary);
        root.style.setProperty('--section-accent', accent);
        root.style.setProperty('--section-intensity', theme.intensity);
        
        console.log('🎨 Applied section theme:', theme.name);
    };
    
    // Notify visualizer of theme change
    ThemeEngine.prototype.notifyVisualizer = function(theme) {
        if (window.SimpleVisualizer) {
            var visualizerConfig = {
                colors: {
                    primary: this.hslToString(theme.colors.primary),
                    secondary: this.hslToString(theme.colors.secondary),
                    accent: this.hslToString(theme.colors.accent),
                    background: this.hslToString(theme.colors.background)
                },
                intensity: theme.intensity,
                particleCount: theme.particleCount,
                animationStyle: theme.animationStyle,
                complexity: theme.visualComplexity
            };
            
            window.SimpleVisualizer.updateTheme(visualizerConfig);
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChange', {
            detail: {
                section: this.currentSection,
                theme: theme
            }
        }));
    };
    
    // Update page elements based on section
    ThemeEngine.prototype.updatePageElements = function(sectionId, theme) {
        // Add section-specific body class
        document.body.className = document.body.className.replace(/section-\w+/g, '');
        document.body.classList.add('section-' + sectionId);
        
        // Update navigation indicator
        var navLinks = document.querySelectorAll('.nav-link');
        for (var i = 0; i < navLinks.length; i++) {
            navLinks[i].classList.remove('active-section');
        }
        
        var currentLink = document.querySelector('.nav-link[data-section="' + sectionId + '"]');
        if (currentLink) {
            currentLink.classList.add('active-section');
        }
    };
    
    // Bind visualizer-specific events
    ThemeEngine.prototype.bindVisualizerEvents = function() {
        var self = this;
        
        // Listen for visualizer ready event
        window.addEventListener('visualizerReady', function() {
            // Initialize with current section theme
            var initialTheme = self.getSectionColors(self.currentSection);
            self.notifyVisualizer(initialTheme);
        });
        
        // Listen for manual theme regeneration
        window.addEventListener('regenerateTheme', function() {
            self.regenerateTheme();
        });
    };
    
    // Regenerate entire theme with new base colors
    ThemeEngine.prototype.regenerateTheme = function() {
        console.log('🔄 Regenerating theme...');
        
        this.baseTheme = this.generateBaseTheme();
        this.applyBaseTheme();
        
        // Re-apply current section theme
        var sectionTheme = this.getSectionColors(this.currentSection);
        this.applySectionTheme(sectionTheme);
        this.notifyVisualizer(sectionTheme);
        
        console.log('✨ Theme regenerated:', this.baseTheme.name);
    };
    
    // Get current theme info for debugging
    ThemeEngine.prototype.getThemeInfo = function() {
        return {
            baseTheme: this.baseTheme,
            currentSection: this.currentSection,
            sectionTheme: this.getSectionColors(this.currentSection)
        };
    };
    
    // Public API
    ThemeEngine.prototype.setSection = function(sectionId) {
        this.transitionToSection(sectionId);
    };
    
    // Initialize theme engine
    var themeEngine = new ThemeEngine();
    
    // Export for global access
    window.ThemeEngine = themeEngine;
    
    // Expose regenerate function globally for development
    window.regenerateTheme = function() {
        themeEngine.regenerateTheme();
    };
    
    console.log('🎨 VIB3CODE Theme Engine loaded');
    
})();