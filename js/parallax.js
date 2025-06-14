// Advanced Parallax Effects Module for VIB3CODE

class ParallaxEngine {
    constructor() {
        this.elements = [];
        this.scrollY = 0;
        this.windowHeight = window.innerHeight;
        this.isRunning = false;
        this.rafId = null;
        
        this.init();
    }
    
    init() {
        console.log('🌊 Initializing Parallax Engine...');
        
        this.setupElements();
        this.bindEvents();
        this.start();
        
        console.log(`✅ Parallax Engine initialized with ${this.elements.length} elements`);
    }
    
    setupElements() {
        // Background parallax layers
        const backgroundLayers = document.querySelectorAll('.parallax-layer');
        backgroundLayers.forEach((layer, index) => {
            const speed = parseFloat(layer.dataset.speed) || 0.5;
            this.elements.push({
                element: layer,
                type: 'background',
                speed: speed,
                offset: 0,
                id: `bg-layer-${index}`
            });
        });
        
        // Floating elements with complex motion
        const floatingElements = document.querySelectorAll('.floating-element');
        floatingElements.forEach((element, index) => {
            this.elements.push({
                element: element,
                type: 'floating',
                speed: 0.3 + (index * 0.1),
                amplitude: 20 + (index * 10),
                frequency: 0.001 + (index * 0.0005),
                offset: 0,
                id: `floating-${index}`
            });
        });
        
        // Section-based parallax
        const parallaxSections = document.querySelectorAll('.parallax-section');
        parallaxSections.forEach((section, index) => {
            this.elements.push({
                element: section,
                type: 'section',
                speed: 0.1,
                id: `section-${index}`
            });
        });
        
        // Card hover parallax
        const cards3D = document.querySelectorAll('.card-3d');
        cards3D.forEach((card, index) => {
            this.setupCardParallax(card, index);
        });
    }
    
    setupCardParallax(card, index) {
        let isHovering = false;
        let mouseX = 0;
        let mouseY = 0;
        
        card.addEventListener('mouseenter', () => {
            isHovering = true;
        });
        
        card.addEventListener('mouseleave', () => {
            isHovering = false;
            // Reset transform
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
        
        card.addEventListener('mousemove', (e) => {
            if (!isHovering) return;
            
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            mouseX = (e.clientX - centerX) / (rect.width / 2);
            mouseY = (e.clientY - centerY) / (rect.height / 2);
            
            this.updateCardTransform(card, mouseX, mouseY);
        });
        
        // Add to elements for scroll-based effects
        this.elements.push({
            element: card,
            type: 'card',
            speed: 0.05,
            mouseX: 0,
            mouseY: 0,
            isHovering: false,
            id: `card-${index}`
        });
    }
    
    updateCardTransform(card, mouseX, mouseY) {
        const maxRotation = 15;\n        const maxTranslation = 5;\n        \n        const rotateX = mouseY * -maxRotation;\n        const rotateY = mouseX * maxRotation;\n        const translateX = mouseX * maxTranslation;\n        const translateY = mouseY * maxTranslation;\n        \n        card.style.transform = `\n            perspective(1000px) \n            rotateX(${rotateX}deg) \n            rotateY(${rotateY}deg) \n            translateX(${translateX}px) \n            translateY(${translateY}px) \n            translateZ(20px)\n        `;\n        \n        // Update card glow position\n        const cardGlow = card.querySelector('.card-glow');\n        if (cardGlow) {\n            cardGlow.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;\n        }\n    }\n    \n    bindEvents() {\n        // Optimized scroll handler\n        window.addEventListener('scroll', () => {\n            this.scrollY = window.pageYOffset;\n        }, { passive: true });\n        \n        // Window resize handler\n        window.addEventListener('resize', this.debounce(() => {\n            this.windowHeight = window.innerHeight;\n            this.recalculateElements();\n        }, 250));\n        \n        // Performance monitoring\n        this.setupPerformanceMonitoring();\n    }\n    \n    setupPerformanceMonitoring() {\n        let frameCount = 0;\n        let lastTime = performance.now();\n        \n        const checkPerformance = () => {\n            frameCount++;\n            const currentTime = performance.now();\n            \n            if (currentTime - lastTime >= 1000) {\n                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));\n                \n                // Adjust quality based on performance\n                if (fps < 30) {\n                    this.enablePerformanceMode();\n                } else if (fps > 55) {\n                    this.disablePerformanceMode();\n                }\n                \n                frameCount = 0;\n                lastTime = currentTime;\n            }\n            \n            if (this.isRunning) {\n                requestAnimationFrame(checkPerformance);\n            }\n        };\n        \n        requestAnimationFrame(checkPerformance);\n    }\n    \n    enablePerformanceMode() {\n        // Reduce parallax effects for better performance\n        this.elements.forEach(element => {\n            if (element.type === 'floating') {\n                element.speed *= 0.5;\n                element.amplitude *= 0.7;\n            }\n        });\n        \n        console.log('⚡ Performance mode enabled');\n    }\n    \n    disablePerformanceMode() {\n        // Restore full parallax effects\n        this.recalculateElements();\n        console.log('🚀 Full quality mode restored');\n    }\n    \n    recalculateElements() {\n        // Recalculate element properties after resize\n        this.elements.forEach(element => {\n            if (element.element) {\n                const rect = element.element.getBoundingClientRect();\n                element.elementTop = rect.top + this.scrollY;\n                element.elementHeight = rect.height;\n            }\n        });\n    }\n    \n    update() {\n        if (!this.isRunning) return;\n        \n        const currentTime = performance.now();\n        \n        this.elements.forEach(element => {\n            if (!element.element) return;\n            \n            switch (element.type) {\n                case 'background':\n                    this.updateBackgroundLayer(element);\n                    break;\n                    \n                case 'floating':\n                    this.updateFloatingElement(element, currentTime);\n                    break;\n                    \n                case 'section':\n                    this.updateSection(element);\n                    break;\n                    \n                case 'card':\n                    this.updateCard(element);\n                    break;\n            }\n        });\n        \n        this.rafId = requestAnimationFrame(() => this.update());\n    }\n    \n    updateBackgroundLayer(element) {\n        const translateY = -(this.scrollY * element.speed);\n        element.element.style.transform = `translateY(${translateY}px)`;\n    }\n    \n    updateFloatingElement(element, currentTime) {\n        // Complex motion with sine waves and scroll influence\n        const scrollInfluence = this.scrollY * element.speed;\n        const timeInfluence = Math.sin(currentTime * element.frequency) * element.amplitude;\n        const rotationInfluence = Math.cos(currentTime * element.frequency * 0.5) * 5;\n        \n        const translateY = scrollInfluence + timeInfluence;\n        const rotation = rotationInfluence;\n        \n        element.element.style.transform = `\n            translateY(${translateY}px) \n            rotate(${rotation}deg)\n        `;\n        \n        // Opacity based on scroll position\n        const viewportCenter = this.scrollY + this.windowHeight / 2;\n        const elementCenter = element.element.offsetTop;\n        const distance = Math.abs(viewportCenter - elementCenter);\n        const maxDistance = this.windowHeight;\n        const opacity = Math.max(0.2, 1 - (distance / maxDistance));\n        \n        element.element.style.opacity = opacity;\n    }\n    \n    updateSection(element) {\n        // Subtle section movement\n        const rect = element.element.getBoundingClientRect();\n        const isInView = rect.bottom >= 0 && rect.top <= this.windowHeight;\n        \n        if (isInView) {\n            const translateY = this.scrollY * element.speed;\n            element.element.style.transform = `translateY(${translateY}px)`;\n        }\n    }\n    \n    updateCard(element) {\n        // Scroll-based card tilting\n        const rect = element.element.getBoundingClientRect();\n        const isInView = rect.bottom >= 0 && rect.top <= this.windowHeight;\n        \n        if (isInView && !element.isHovering) {\n            const centerY = rect.top + rect.height / 2;\n            const screenCenter = this.windowHeight / 2;\n            const distance = (centerY - screenCenter) / screenCenter;\n            \n            const rotateX = distance * 2;\n            const translateY = this.scrollY * element.speed;\n            \n            element.element.style.transform = `\n                perspective(1000px) \n                rotateX(${rotateX}deg) \n                translateY(${translateY}px)\n            `;\n        }\n    }\n    \n    start() {\n        if (this.isRunning) return;\n        \n        this.isRunning = true;\n        this.recalculateElements();\n        this.update();\n        \n        console.log('🌊 Parallax Engine started');\n    }\n    \n    stop() {\n        this.isRunning = false;\n        \n        if (this.rafId) {\n            cancelAnimationFrame(this.rafId);\n            this.rafId = null;\n        }\n        \n        console.log('⏹️ Parallax Engine stopped');\n    }\n    \n    // Utility functions\n    debounce(func, wait) {\n        let timeout;\n        return function executedFunction(...args) {\n            const later = () => {\n                clearTimeout(timeout);\n                func(...args);\n            };\n            clearTimeout(timeout);\n            timeout = setTimeout(later, wait);\n        };\n    }\n    \n    // Public API\n    addElement(element, options = {}) {\n        const config = {\n            element: element,\n            type: options.type || 'custom',\n            speed: options.speed || 0.5,\n            amplitude: options.amplitude || 20,\n            frequency: options.frequency || 0.001,\n            id: options.id || `custom-${this.elements.length}`\n        };\n        \n        this.elements.push(config);\n        console.log(`➕ Added parallax element: ${config.id}`);\n    }\n    \n    removeElement(id) {\n        const index = this.elements.findIndex(el => el.id === id);\n        if (index !== -1) {\n            this.elements.splice(index, 1);\n            console.log(`➖ Removed parallax element: ${id}`);\n        }\n    }\n    \n    setSpeed(id, speed) {\n        const element = this.elements.find(el => el.id === id);\n        if (element) {\n            element.speed = speed;\n            console.log(`⚡ Updated speed for ${id}: ${speed}`);\n        }\n    }\n    \n    // Cleanup\n    destroy() {\n        this.stop();\n        this.elements = [];\n        console.log('🔥 Parallax Engine destroyed');\n    }\n}\n\n// Reduced motion support\nconst prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;\n\nif (prefersReducedMotion) {\n    console.log('⚠️ Reduced motion preferred - Parallax effects disabled');\n} else {\n    // Initialize parallax engine\n    const parallaxEngine = new ParallaxEngine();\n    \n    // Export for external use\n    window.ParallaxEngine = parallaxEngine;\n    \n    // Cleanup on page unload\n    window.addEventListener('beforeunload', () => {\n        parallaxEngine.destroy();\n    });\n    \n    // Pause/resume based on visibility\n    document.addEventListener('visibilitychange', () => {\n        if (document.hidden) {\n            parallaxEngine.stop();\n        } else {\n            parallaxEngine.start();\n        }\n    });\n}\n\nexport default ParallaxEngine;