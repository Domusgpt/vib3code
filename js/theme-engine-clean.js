// VIB3CODE Dynamic Theme Engine with Mathematical Color Relationships
(function() {
    'use strict';
    
    function ThemeEngine() {
        this.currentSection = 'home';
        this.baseTheme = null;
        this.currentColors = {};
        this.transitionDuration = 800;
        this.sectionObserver = null;
        
        // Mathematical section modifiers that preserve color relationships
        this.sectionModifiers = {
            home: {
                name: 'Hero Foundation',
                colorShift: { h: 0, s: 0, l: 0 },
                intensity: 1.0,
                particleCount: 150,
                animationStyle: 'smooth',
                visualComplexity: 'high'
            },
            articles: {
                name: 'Editorial Insight',
                colorShift: { h: 30, s: 5, l: -5 },
                intensity: 0.9,
                particleCount: 120,
                animationStyle: 'flowing',
                visualComplexity: 'medium'
            },
            videos: {
                name: 'Visual Philosophy',
                colorShift: { h: -45, s: 10, l: 5 },
                intensity: 1.2,
                particleCount: 180,
                animationStyle: 'dynamic',
                visualComplexity: 'high'
            },
            podcasts: {
                name: 'Audio Wisdom',
                colorShift: { h: 60, s: -5, l: 10 },
                intensity: 0.8,
                particleCount: 100,
                animationStyle: 'gentle',
                visualComplexity: 'low'
            },
            ema: {
                name: 'Moral Architecture',
                colorShift: { h: 90, s: 15, l: -10 },
                intensity: 1.1,
                particleCount: 200,
                animationStyle: 'structural',
                visualComplexity: 'high'
            },
            parserator: {
                name: 'Digital Liberation',
                colorShift: { h: 120, s: 20, l: 15 },
                intensity: 1.3,
                particleCount: 250,
                animationStyle: 'revolutionary',
                visualComplexity: 'maximum'
            }
        };
        
        // Sophisticated theme palettes
        this.themeLibrary = [
            {
                name: 'Digital Sovereignty',
                primary: { h: 210, s: 85, l: 25 },
                secondary: { h: 330, s: 90, l: 45 },
                accent: { h: 45, s: 100, l: 60 },
                background: { h: 210, s: 20, l: 8 },
                complexity: 'high',
                speed: 1.0
            },
            {
                name: 'Liberation Matrix',
                primary: { h: 180, s: 70, l: 30 },
                secondary: { h: 300, s: 85, l: 50 },
                accent: { h: 60, s: 95, l: 65 },
                background: { h: 240, s: 15, l: 12 },
                complexity: 'high',
                speed: 0.9
            },
            {
                name: 'Ethical Code',
                primary: { h: 270, s: 80, l: 35 },
                secondary: { h: 30, s: 90, l: 55 },
                accent: { h: 120, s: 100, l: 70 },
                background: { h: 270, s: 25, l: 10 },
                complexity: 'medium',
                speed: 1.1
            },
            {
                name: 'Bridge Builder',
                primary: { h: 195, s: 75, l: 40 },
                secondary: { h: 315, s: 85, l: 50 },
                accent: { h: 75, s: 90, l: 65 },
                background: { h: 195, s: 30, l: 15 },
                complexity: 'high',
                speed: 0.8
            },
            {
                name: 'Open Standards',
                primary: { h: 240, s: 90, l: 25 },
                secondary: { h: 0, s: 85, l: 45 },
                accent: { h: 90, s: 100, l: 60 },
                background: { h: 240, s: 20, l: 8 },
                complexity: 'medium',
                speed: 1.2
            },
            {
                name: 'Quantum Renaissance',
                primary: { h: 285, s: 85, l: 30 },
                secondary: { h: 45, s: 90, l: 50 },
                accent: { h: 165, s: 95, l: 65 },
                background: { h: 285, s: 25, l: 12 },
                complexity: 'high',
                speed: 1.0
            },
            {
                name: 'Neural Elegance',
                primary: { h: 225, s: 80, l: 35 },
                secondary: { h: 345, s: 85, l: 45 },
                accent: { h: 105, s: 90, l: 70 },
                background: { h: 225, s: 30, l: 10 },
                complexity: 'medium',
                speed: 0.9
            },
            {
                name: 'Code Alchemy',
                primary: { h: 255, s: 75, l: 40 },
                secondary: { h: 15, s: 90, l: 55 },
                accent: { h: 135, s: 100, l: 75 },
                background: { h: 255, s: 20, l: 15 },
                complexity: 'high',
                speed: 1.1
            }
        ];
        
        this.init();
    }
    
    ThemeEngine.prototype.init = function() {
        console.log('🎨 Initializing VIB3CODE Theme Engine...');
        
        // Generate initial theme
        this.baseTheme = this.generateBaseTheme();
        this.applyBaseTheme();
        
        // Setup section observation for dynamic transitions
        this.setupSectionObserver();
        
        // Bind visualizer events
        this.bindVisualizerEvents();
        
        console.log('✅ Theme Engine initialized with:', this.baseTheme.name);
    };
    
    ThemeEngine.prototype.generateBaseTheme = function() {
        var randomIndex = Math.floor(Math.random() * this.themeLibrary.length);
        return this.themeLibrary[randomIndex];
    };
    
    ThemeEngine.prototype.applyBaseTheme = function() {
        var theme = this.baseTheme;
        var root = document.documentElement;
        
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
    
    ThemeEngine.prototype.getSectionColors = function(sectionId) {
        var modifier = this.sectionModifiers[sectionId] || this.sectionModifiers.home;
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
    
    ThemeEngine.prototype.transformColor = function(baseColor, shift) {
        return {
            h: (baseColor.h + shift.h + 360) % 360,
            s: Math.max(0, Math.min(100, baseColor.s + shift.s)),
            l: Math.max(0, Math.min(100, baseColor.l + shift.l))
        };
    };
    
    ThemeEngine.prototype.hslToString = function(hsl) {
        return 'hsl(' + Math.round(hsl.h) + ', ' + Math.round(hsl.s) + '%, ' + Math.round(hsl.l) + '%)';
    };
    
    ThemeEngine.prototype.setupSectionObserver = function() {
        var self = this;
        
        // Observer for magazine sections
        var options = {
            threshold: 0.3,
            rootMargin: '-20% 0px -20% 0px'
        };
        
        this.sectionObserver = new IntersectionObserver(function(entries) {
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (entry.isIntersecting) {
                    var sectionId = entry.target.id || 'home';
                    self.transitionToSection(sectionId);
                }
            }
        }, options);
        
        // Observe magazine sections
        setTimeout(function() {
            var sections = document.querySelectorAll('.magazine-section');
            for (var i = 0; i < sections.length; i++) {
                self.sectionObserver.observe(sections[i]);
            }
        }, 1000);
    };
    
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
    
    ThemeEngine.prototype.notifyVisualizer = function(theme) {
        if (window.HolographicVisualizer) {
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
            
            window.HolographicVisualizer.updateTheme(visualizerConfig);
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChange', {
            detail: {
                section: this.currentSection,
                theme: theme
            }
        }));
    };
    
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
    
    ThemeEngine.prototype.bindVisualizerEvents = function() {
        var self = this;
        
        // Listen for visualizer ready event
        window.addEventListener('visualizerReady', function() {
            var initialTheme = self.getSectionColors(self.currentSection);
            self.notifyVisualizer(initialTheme);
        });
        
        // Listen for manual theme regeneration
        window.addEventListener('regenerateTheme', function() {
            self.regenerateTheme();
        });
    };
    
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
    
    ThemeEngine.prototype.getThemeInfo = function() {
        return {
            baseTheme: this.baseTheme,
            currentSection: this.currentSection,
            sectionTheme: this.getSectionColors(this.currentSection)
        };
    };
    
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