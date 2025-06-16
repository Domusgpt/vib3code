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
        
        console.log('✅ Parallax Engine initialized with ' + this.elements.length + ' elements');
    }
    
    setupElements() {
        var self = this; // For 'this' context in forEach
        var backgroundLayers = document.querySelectorAll('.parallax-layer');
        backgroundLayers.forEach(function(layer, index) {
            var speed = parseFloat(layer.dataset.speed) || 0.5;
            self.elements.push({
                element: layer,
                type: 'background',
                speed: speed,
                offset: 0,
                id: 'bg-layer-' + index
            });
        });
        
        var floatingElements = document.querySelectorAll('.floating-element');
        floatingElements.forEach(function(element, index) {
            self.elements.push({
                element: element,
                type: 'floating',
                speed: 0.3 + (index * 0.1),
                amplitude: 20 + (index * 10),
                frequency: 0.001 + (index * 0.0005),
                offset: 0,
                id: 'floating-' + index
            });
        });
        
        var parallaxSections = document.querySelectorAll('.parallax-section');
        parallaxSections.forEach(function(section, index) {
            self.elements.push({
                element: section,
                type: 'section',
                speed: 0.1,
                id: 'section-' + index
            });
        });
        
        var cards3D = document.querySelectorAll('.card-3d');
        cards3D.forEach(function(card, index) {
            self.setupCardParallax(card, index);
        });
    }
    
    setupCardParallax(card, index) {
        var self = this; // For 'this' context
        var isHovering = false;
        var mouseX = 0;
        var mouseY = 0;
        
        card.addEventListener('mouseenter', function() {
            isHovering = true;
        });
        
        card.addEventListener('mouseleave', function() {
            isHovering = false;
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
        
        card.addEventListener('mousemove', function(e) {
            if (!isHovering) return;
            
            var rect = card.getBoundingClientRect();
            var centerX = rect.left + rect.width / 2;
            var centerY = rect.top + rect.height / 2;
            
            mouseX = (e.clientX - centerX) / (rect.width / 2);
            mouseY = (e.clientY - centerY) / (rect.height / 2);
            
            self.updateCardTransform(card, mouseX, mouseY);
        });
        
        this.elements.push({
            element: card,
            type: 'card',
            speed: 0.05,
            mouseX: 0,
            mouseY: 0,
            isHovering: false,
            id: 'card-' + index
        });
    }
    
    updateCardTransform(card, mouseX, mouseY) {
        var maxRotation = 15;
        var maxTranslation = 5;

        var rotateX = mouseY * -maxRotation;
        var rotateY = mouseX * maxRotation;
        var translateX = mouseX * maxTranslation;
        var translateY = mouseY * maxTranslation;

        card.style.transform =
            'perspective(1000px) ' +
            'rotateX(' + rotateX + 'deg) ' +
            'rotateY(' + rotateY + 'deg) ' +
            'translateX(' + translateX + 'px) ' +
            'translateY(' + translateY + 'px) ' +
            'translateZ(20px)';

        var cardGlow = card.querySelector('.card-glow');
        if (cardGlow) {
            cardGlow.style.transform = 'translate(' + (mouseX * 20) + 'px, ' + (mouseY * 20) + 'px)';
        }
    }
    
    bindEvents() {
        var self = this; // For 'this' context
        window.addEventListener('scroll', function() {
            self.scrollY = window.pageYOffset;
        }, { passive: true });
        
        window.addEventListener('resize', this.debounce(function() {
            self.windowHeight = window.innerHeight;
            self.recalculateElements();
        }, 250));
        
        this.setupPerformanceMonitoring();
    }
    
    setupPerformanceMonitoring() {
        var self = this; // For 'this' context
        var frameCount = 0;
        var lastTime = performance.now();
        
        var checkPerformance = function() {
            frameCount++;
            var currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                var fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 30) {
                    self.enablePerformanceMode();
                } else if (fps > 55) {
                    self.disablePerformanceMode();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            if (self.isRunning) {
                requestAnimationFrame(checkPerformance);
            }
        };
        
        requestAnimationFrame(checkPerformance);
    }
    
    enablePerformanceMode() {
        this.elements.forEach(function(element) {
            if (element.type === 'floating') {
                element.speed *= 0.5;
                element.amplitude *= 0.7;
            }
        });
        
        console.log('⚡ Performance mode enabled');
    }
    
    disablePerformanceMode() {
        this.recalculateElements();
        console.log('🚀 Full quality mode restored');
    }
    
    recalculateElements() {
        var self = this; // For 'this' context
        this.elements.forEach(function(element) {
            if (element.element) {
                var rect = element.element.getBoundingClientRect();
                element.elementTop = rect.top + self.scrollY;
                element.elementHeight = rect.height;
            }
        });
    }
    
    update() {
        var self = this; // For 'this' context
        if (!this.isRunning) return;
        
        var currentTime = performance.now();
        
        this.elements.forEach(function(element) {
            if (!element.element) return;
            
            switch (element.type) {
                case 'background':
                    self.updateBackgroundLayer(element);
                    break;
                    
                case 'floating':
                    self.updateFloatingElement(element, currentTime);
                    break;
                    
                case 'section':
                    self.updateSection(element);
                    break;
                    
                case 'card':
                    self.updateCard(element);
                    break;
            }
        });
        
        this.rafId = requestAnimationFrame(function() { self.update(); });
    }
    
    updateBackgroundLayer(element) {
        var translateY = -(this.scrollY * element.speed);
        element.element.style.transform = 'translateY(' + translateY + 'px)';
    }
    
    updateFloatingElement(element, currentTime) {
        var scrollInfluence = this.scrollY * element.speed;
        var timeInfluence = Math.sin(currentTime * element.frequency) * element.amplitude;
        var rotationInfluence = Math.cos(currentTime * element.frequency * 0.5) * 5;

        var translateY = scrollInfluence + timeInfluence;
        var rotation = rotationInfluence;

        element.element.style.transform =
            'translateY(' + translateY + 'px) ' +
            'rotate(' + rotation + 'deg)';

        var viewportCenter = this.scrollY + this.windowHeight / 2;
        var elementCenter = element.element.offsetTop;
        var distance = Math.abs(viewportCenter - elementCenter);
        var maxDistance = this.windowHeight;
        var opacity = Math.max(0.2, 1 - (distance / maxDistance));
        
        element.element.style.opacity = opacity;
    }
    
    updateSection(element) {
        var rect = element.element.getBoundingClientRect();
        var isInView = rect.bottom >= 0 && rect.top <= this.windowHeight;
        
        if (isInView) {
            var translateY = this.scrollY * element.speed;
            element.element.style.transform = 'translateY(' + translateY + 'px)';
        }
    }
    
    updateCard(element) {
        var rect = element.element.getBoundingClientRect();
        var isInView = rect.bottom >= 0 && rect.top <= this.windowHeight;
        
        if (isInView && !element.isHovering) {
            var centerY = rect.top + rect.height / 2;
            var screenCenter = this.windowHeight / 2;
            var distance = (centerY - screenCenter) / screenCenter;
            
            var rotateX = distance * 2;
            var translateY = this.scrollY * element.speed;
            
            element.element.style.transform =
                'perspective(1000px) ' +
                'rotateX(' + rotateX + 'deg) ' +
                'translateY(' + translateY + 'px)';
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.recalculateElements();
        this.update(); // Corrected to call method directly
        
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
    
    debounce(func, wait) {
        var timeout;
        return function executedFunction() {
            var context = this;
            var args = arguments;
            var later = function() {
                clearTimeout(timeout);
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    addElement(element, options) {
        options = options || {};
        var config = {
            element: element,
            type: options.type || 'custom',
            speed: options.speed || 0.5,
            amplitude: options.amplitude || 20,
            frequency: options.frequency || 0.001,
            id: options.id || ('custom-' + this.elements.length)
        };
        
        this.elements.push(config);
        console.log('➕ Added parallax element: ' + config.id);
    }
    
    removeElement(id) {
        var index = this.elements.findIndex(function(el) { return el.id === id; });
        if (index !== -1) {
            this.elements.splice(index, 1);
            console.log('➖ Removed parallax element: ' + id);
        }
    }
    
    setSpeed(id, speed) {
        var element = this.elements.find(function(el) { return el.id === id; });
        if (element) {
            element.speed = speed;
            console.log('⚡ Updated speed for ' + id + ': ' + speed);
        }
    }
    
    destroy() {
        this.stop();
        this.elements = [];
        console.log('🔥 Parallax Engine destroyed');
    }
}

var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    console.log('⚠️ Reduced motion preferred - Parallax effects disabled');
} else {
    var parallaxEngine = new ParallaxEngine();
    
    window.ParallaxEngine = parallaxEngine;
    
    window.addEventListener('beforeunload', function() {
        parallaxEngine.destroy();
    });
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            parallaxEngine.stop();
        } else {
            parallaxEngine.start();
        }
    });
}