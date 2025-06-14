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
        const maxRotation = 15;
        const maxTranslation = 5;
        
        const rotateX = mouseY * -maxRotation;
        const rotateY = mouseX * maxRotation;
        const translateX = mouseX * maxTranslation;
        const translateY = mouseY * maxTranslation;
        
        card.style.transform = `
            perspective(1000px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            translateX(${translateX}px) 
            translateY(${translateY}px) 
            translateZ(20px)
        `;
        
        // Update card glow position
        const cardGlow = card.querySelector('.card-glow');
        if (cardGlow) {
            cardGlow.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;
        }
    }
    
    bindEvents() {
        // Optimized scroll handler
        window.addEventListener('scroll', () => {
            this.scrollY = window.pageYOffset;
        }, { passive: true });
        
        // Window resize handler
        window.addEventListener('resize', this.debounce(() => {
            this.windowHeight = window.innerHeight;
            this.recalculateElements();
        }, 250));
        
        // Performance monitoring
        this.setupPerformanceMonitoring();
    }
    
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const checkPerformance = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Adjust quality based on performance
                if (fps < 30) {
                    this.enablePerformanceMode();
                } else if (fps > 55) {
                    this.disablePerformanceMode();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            if (this.isRunning) {
                requestAnimationFrame(checkPerformance);
            }
        };
        
        requestAnimationFrame(checkPerformance);
    }
    
    enablePerformanceMode() {
        // Reduce parallax effects for better performance
        this.elements.forEach(element => {
            if (element.type === 'floating') {
                element.speed *= 0.5;
                element.amplitude *= 0.7;
            }
        });
        
        console.log('⚡ Performance mode enabled');
    }
    
    disablePerformanceMode() {
        // Restore full parallax effects
        this.recalculateElements();
        console.log('🚀 Full quality mode restored');
    }
    
    recalculateElements() {
        // Recalculate element properties after resize
        this.elements.forEach(element => {
            if (element.element) {
                const rect = element.element.getBoundingClientRect();
                element.elementTop = rect.top + this.scrollY;
                element.elementHeight = rect.height;
            }
        });
    }
    
    update() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        
        this.elements.forEach(element => {
            if (!element.element) return;
            
            switch (element.type) {
                case 'background':
                    this.updateBackgroundLayer(element);
                    break;
                    
                case 'floating':
                    this.updateFloatingElement(element, currentTime);
                    break;
                    
                case 'section':
                    this.updateSection(element);
                    break;
                    
                case 'card':
                    this.updateCard(element);
                    break;
            }
        });
        
        this.rafId = requestAnimationFrame(() => this.update());
    }
    
    updateBackgroundLayer(element) {
        const translateY = -(this.scrollY * element.speed);
        element.element.style.transform = `translateY(${translateY}px)`;
    }
    
    updateFloatingElement(element, currentTime) {
        // Complex motion with sine waves and scroll influence
        const scrollInfluence = this.scrollY * element.speed;
        const timeInfluence = Math.sin(currentTime * element.frequency) * element.amplitude;
        const rotationInfluence = Math.cos(currentTime * element.frequency * 0.5) * 5;
        
        const translateY = scrollInfluence + timeInfluence;
        const rotation = rotationInfluence;
        
        element.element.style.transform = `
            translateY(${translateY}px) 
            rotate(${rotation}deg)
        `;
        
        // Opacity based on scroll position
        const viewportCenter = this.scrollY + this.windowHeight / 2;
        const elementCenter = element.element.offsetTop;
        const distance = Math.abs(viewportCenter - elementCenter);
        const maxDistance = this.windowHeight;
        const opacity = Math.max(0.2, 1 - (distance / maxDistance));
        
        element.element.style.opacity = opacity;
    }
    
    updateSection(element) {
        // Subtle section movement
        const rect = element.element.getBoundingClientRect();
        const isInView = rect.bottom >= 0 && rect.top <= this.windowHeight;
        
        if (isInView) {
            const translateY = this.scrollY * element.speed;
            element.element.style.transform = `translateY(${translateY}px)`;
        }
    }
    
    updateCard(element) {
        // Scroll-based card tilting
        const rect = element.element.getBoundingClientRect();
        const isInView = rect.bottom >= 0 && rect.top <= this.windowHeight;
        
        if (isInView && !element.isHovering) {
            const centerY = rect.top + rect.height / 2;
            const screenCenter = this.windowHeight / 2;
            const distance = (centerY - screenCenter) / screenCenter;
            
            const rotateX = distance * 2;
            const translateY = this.scrollY * element.speed;
            
            element.element.style.transform = `
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                translateY(${translateY}px)
            `;
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.recalculateElements();
        this.update();
        
        console.log('🌊 Parallax Engine started');
    }
    
    stop() {
        this.isRunning = false;
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        console.log('⏹️ Parallax Engine stopped');
    }
    
    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Public API
    addElement(element, options = {}) {
        const config = {
            element: element,
            type: options.type || 'custom',
            speed: options.speed || 0.5,
            amplitude: options.amplitude || 20,
            frequency: options.frequency || 0.001,
            id: options.id || `custom-${this.elements.length}`
        };
        
        this.elements.push(config);
        console.log(`➕ Added parallax element: ${config.id}`);
    }
    
    removeElement(id) {
        const index = this.elements.findIndex(el => el.id === id);
        if (index !== -1) {
            this.elements.splice(index, 1);
            console.log(`➖ Removed parallax element: ${id}`);
        }
    }
    
    setSpeed(id, speed) {
        const element = this.elements.find(el => el.id === id);
        if (element) {
            element.speed = speed;
            console.log(`⚡ Updated speed for ${id}: ${speed}`);
        }
    }
    
    // Cleanup
    destroy() {
        this.stop();
        this.elements = [];
        console.log('🔥 Parallax Engine destroyed');
    }
}

// Reduced motion support
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    console.log('⚠️ Reduced motion preferred - Parallax effects disabled');
} else {
    // Initialize parallax engine
    const parallaxEngine = new ParallaxEngine();
    
    // Export for external use
    window.ParallaxEngine = parallaxEngine;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        parallaxEngine.destroy();
    });
    
    // Pause/resume based on visibility
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            parallaxEngine.stop();
        } else {
            parallaxEngine.start();
        }
    });
}