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
        
        console.log('🎨 Applied base theme:', theme.name);\n    };\n    \n    // Calculate section-specific colors maintaining relationships\n    ThemeEngine.prototype.getSectionColors = function(sectionId) {\n        var modifier = this.sectionModifiers[sectionId] || this.sectionModifiers.hero;\n        var base = this.baseTheme;\n        \n        // Apply mathematical transformations while maintaining relationships\n        var sectionColors = {\n            primary: this.transformColor(base.primary, modifier.colorShift),\n            secondary: this.transformColor(base.secondary, modifier.colorShift),\n            accent: this.transformColor(base.accent, modifier.colorShift),\n            background: this.transformColor(base.background, modifier.colorShift)\n        };\n        \n        return {\n            colors: sectionColors,\n            intensity: modifier.intensity,\n            particleCount: modifier.particleCount,\n            animationStyle: modifier.animationStyle,\n            visualComplexity: modifier.visualComplexity,\n            name: modifier.name\n        };\n    };\n    \n    // Transform HSL color maintaining mathematical relationships\n    ThemeEngine.prototype.transformColor = function(baseColor, shift) {\n        return {\n            h: (baseColor.h + shift.h + 360) % 360,\n            s: Math.max(0, Math.min(100, baseColor.s + shift.s)),\n            l: Math.max(0, Math.min(100, baseColor.l + shift.l))\n        };\n    };\n    \n    // Convert HSL object to CSS string\n    ThemeEngine.prototype.hslToString = function(hsl) {\n        return 'hsl(' + Math.round(hsl.h) + ', ' + Math.round(hsl.s) + '%, ' + Math.round(hsl.l) + '%)';\n    };\n    \n    // Setup intersection observer for section detection\n    ThemeEngine.prototype.setupSectionObserver = function() {\n        var self = this;\n        var options = {\n            threshold: 0.3,\n            rootMargin: '-20% 0px -20% 0px'\n        };\n        \n        this.sectionObserver = new IntersectionObserver(function(entries) {\n            for (var i = 0; i < entries.length; i++) {\n                var entry = entries[i];\n                if (entry.isIntersecting) {\n                    var sectionId = entry.target.id || 'hero';\n                    self.transitionToSection(sectionId);\n                }\n            }\n        }, options);\n        \n        // Observe all sections\n        var sections = document.querySelectorAll('section, .parallax-section');\n        for (var i = 0; i < sections.length; i++) {\n            this.sectionObserver.observe(sections[i]);\n        }\n    };\n    \n    // Transition visualizer to section-specific theme\n    ThemeEngine.prototype.transitionToSection = function(sectionId) {\n        if (this.currentSection === sectionId) return;\n        \n        console.log('🎭 Transitioning to section:', sectionId);\n        \n        var sectionTheme = this.getSectionColors(sectionId);\n        this.currentSection = sectionId;\n        \n        // Apply section colors to CSS\n        this.applySectionTheme(sectionTheme);\n        \n        // Notify visualizer of section change\n        this.notifyVisualizer(sectionTheme);\n        \n        // Update page elements\n        this.updatePageElements(sectionId, sectionTheme);\n    };\n    \n    // Apply section theme to CSS custom properties\n    ThemeEngine.prototype.applySectionTheme = function(theme) {\n        var root = document.documentElement;\n        \n        // Convert colors to CSS strings\n        var primary = this.hslToString(theme.colors.primary);\n        var secondary = this.hslToString(theme.colors.secondary);\n        var accent = this.hslToString(theme.colors.accent);\n        \n        // Smooth transition\n        root.style.transition = 'all ' + (this.transitionDuration / 1000) + 's ease-out';\n        \n        // Update theme properties\n        root.style.setProperty('--section-primary', primary);\n        root.style.setProperty('--section-secondary', secondary);\n        root.style.setProperty('--section-accent', accent);\n        root.style.setProperty('--section-intensity', theme.intensity);\n        \n        console.log('🎨 Applied section theme:', theme.name);\n    };\n    \n    // Notify visualizer of theme change\n    ThemeEngine.prototype.notifyVisualizer = function(theme) {\n        if (window.SimpleVisualizer) {\n            var visualizerConfig = {\n                colors: {\n                    primary: this.hslToString(theme.colors.primary),\n                    secondary: this.hslToString(theme.colors.secondary),\n                    accent: this.hslToString(theme.colors.accent),\n                    background: this.hslToString(theme.colors.background)\n                },\n                intensity: theme.intensity,\n                particleCount: theme.particleCount,\n                animationStyle: theme.animationStyle,\n                complexity: theme.visualComplexity\n            };\n            \n            window.SimpleVisualizer.updateTheme(visualizerConfig);\n        }\n        \n        // Dispatch custom event for other components\n        window.dispatchEvent(new CustomEvent('themeChange', {\n            detail: {\n                section: this.currentSection,\n                theme: theme\n            }\n        }));\n    };\n    \n    // Update page elements based on section\n    ThemeEngine.prototype.updatePageElements = function(sectionId, theme) {\n        // Add section-specific body class\n        document.body.className = document.body.className.replace(/section-\\w+/g, '');\n        document.body.classList.add('section-' + sectionId);\n        \n        // Update navigation indicator\n        var navLinks = document.querySelectorAll('.nav-link');\n        for (var i = 0; i < navLinks.length; i++) {\n            navLinks[i].classList.remove('active-section');\n        }\n        \n        var currentLink = document.querySelector('.nav-link[data-section=\"' + sectionId + '\"]');\n        if (currentLink) {\n            currentLink.classList.add('active-section');\n        }\n    };\n    \n    // Bind visualizer-specific events\n    ThemeEngine.prototype.bindVisualizerEvents = function() {\n        var self = this;\n        \n        // Listen for visualizer ready event\n        window.addEventListener('visualizerReady', function() {\n            // Initialize with current section theme\n            var initialTheme = self.getSectionColors(self.currentSection);\n            self.notifyVisualizer(initialTheme);\n        });\n        \n        // Listen for manual theme regeneration\n        window.addEventListener('regenerateTheme', function() {\n            self.regenerateTheme();\n        });\n    };\n    \n    // Regenerate entire theme with new base colors\n    ThemeEngine.prototype.regenerateTheme = function() {\n        console.log('🔄 Regenerating theme...');\n        \n        this.baseTheme = this.generateBaseTheme();\n        this.applyBaseTheme();\n        \n        // Re-apply current section theme\n        var sectionTheme = this.getSectionColors(this.currentSection);\n        this.applySectionTheme(sectionTheme);\n        this.notifyVisualizer(sectionTheme);\n        \n        console.log('✨ Theme regenerated:', this.baseTheme.name);\n    };\n    \n    // Get current theme info for debugging\n    ThemeEngine.prototype.getThemeInfo = function() {\n        return {\n            baseTheme: this.baseTheme,\n            currentSection: this.currentSection,\n            sectionTheme: this.getSectionColors(this.currentSection)\n        };\n    };\n    \n    // Public API\n    ThemeEngine.prototype.setSection = function(sectionId) {\n        this.transitionToSection(sectionId);\n    };\n    \n    // Initialize theme engine\n    var themeEngine = new ThemeEngine();\n    \n    // Export for global access\n    window.ThemeEngine = themeEngine;\n    \n    // Expose regenerate function globally for development\n    window.regenerateTheme = function() {\n        themeEngine.regenerateTheme();\n    };\n    \n    console.log('🎨 VIB3CODE Theme Engine loaded');\n    \n})();