// Clean Parallax Effects Module for VIB3CODE

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
        var self = this;
        var backgroundLayers = document.querySelectorAll('.parallax-layer'); // Converted
        backgroundLayers.forEach(function(layer, index) {
            var speed = parseFloat(layer.dataset.speed) || 0.5; // Converted
            self.elements.push({
                element: layer,
                type: 'background',
                speed: speed,
                offset: 0,
                id: 'bg-layer-' + index
            });
        });
        
        var floatingElements = document.querySelectorAll('.floating-element'); // Converted
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
        
        var parallaxSections = document.querySelectorAll('.parallax-section'); // Converted
        parallaxSections.forEach(function(section, index) {
            self.elements.push({
                element: section,
                type: 'section',
                speed: 0.1,
                id: 'section-' + index
            });
        });
        
        var cards3D = document.querySelectorAll('.card-3d'); // Converted
        cards3D.forEach(function(card, index) {
            self.setupCardParallax(card, index);
        });
    }
    
    setupCardParallax(card, index) {
        var self = this;
        var isHovering = false; // Converted let to var
        
        card.addEventListener('mouseenter', function() {
            isHovering = true;
        });
        
        card.addEventListener('mouseleave', function() {
            isHovering = false;
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
        
        card.addEventListener('mousemove', function(e) {
            if (!isHovering) return;
            
            var rect = card.getBoundingClientRect(); // Converted
            var centerX = rect.left + rect.width / 2; // Converted
            var centerY = rect.top + rect.height / 2; // Converted
            
            var mouseX = (e.clientX - centerX) / (rect.width / 2);
            var mouseY = (e.clientY - centerY) / (rect.height / 2);
            
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
        var maxRotation = 15; // Converted
        var maxTranslation = 5; // Converted
        
        var rotateX = mouseY * -maxRotation; // Converted
        var rotateY = mouseX * maxRotation; // Converted
        var translateX = mouseX * maxTranslation; // Converted
        var translateY = mouseY * maxTranslation; // Converted
        
        var transform = 'perspective(1000px) ' + // Converted
            'rotateX(' + rotateX + 'deg) ' +
            'rotateY(' + rotateY + 'deg) ' +
            'translateX(' + translateX + 'px) ' +
            'translateY(' + translateY + 'px) ' +
            'translateZ(20px)';
        
        card.style.transform = transform;
        
        var cardGlow = card.querySelector('.card-glow'); // Converted
        if (cardGlow) {
            cardGlow.style.transform = 'translate(' + (mouseX * 20) + 'px, ' + (mouseY * 20) + 'px)';
        }
    }
    
    bindEvents() {
        var self = this;
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
        var self = this;
        var frameCount = 0; // Converted let to var
        var lastTime = performance.now(); // Converted let to var
        
        var checkPerformance = function() { // Converted
            frameCount++;
            var currentTime = performance.now(); // Converted
            
            if (currentTime - lastTime >= 1000) {
                var fps = Math.round((frameCount * 1000) / (currentTime - lastTime)); // Converted
                
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
        var self = this;
        this.elements.forEach(function(element) {
            if (element.element) {
                var rect = element.element.getBoundingClientRect(); // Converted
                element.elementTop = rect.top + self.scrollY;
                element.elementHeight = rect.height;
            }
        });
    }
    
    update() {
        var self = this;
        if (!this.isRunning) return;
        
        var currentTime = performance.now(); // Converted
        
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
        var translateY = -(this.scrollY * element.speed); // Converted
        element.element.style.transform = 'translateY(' + translateY + 'px)';
    }
    
    updateFloatingElement(element, currentTime) {
        var scrollInfluence = this.scrollY * element.speed; // Converted
        var timeInfluence = Math.sin(currentTime * element.frequency) * element.amplitude; // Converted
        var rotationInfluence = Math.cos(currentTime * element.frequency * 0.5) * 5; // Converted
        
        var translateY = scrollInfluence + timeInfluence; // Converted
        var rotation = rotationInfluence; // Converted
        
        element.element.style.transform = 'translateY(' + translateY + 'px) rotate(' + rotation + 'deg)';
        
        var viewportCenter = this.scrollY + this.windowHeight / 2; // Converted
        var elementCenter = element.element.offsetTop;
        var distance = Math.abs(viewportCenter - elementCenter); // Converted
        var maxDistance = this.windowHeight; // Converted
        var opacity = Math.max(0.2, 1 - (distance / maxDistance)); // Converted
        
        element.element.style.opacity = opacity;
    }
    
    updateSection(element) {
        var rect = element.element.getBoundingClientRect(); // Converted
        var isInView = rect.bottom >= 0 && rect.top <= this.windowHeight; // Converted
        
        if (isInView) {
            var translateY = this.scrollY * element.speed; // Converted
            element.element.style.transform = 'translateY(' + translateY + 'px)';
        }
    }
    
    updateCard(element) {
        var rect = element.element.getBoundingClientRect(); // Converted
        var isInView = rect.bottom >= 0 && rect.top <= this.windowHeight; // Converted

        if (isInView && !element.isHovering) {
            var centerY = rect.top + rect.height / 2; // Converted
            var screenCenter = this.windowHeight / 2; // Converted
            var distance = (centerY - screenCenter) / screenCenter; // Converted
            
            var rotateX = distance * 2; // Converted
            var translateY = this.scrollY * element.speed;
            
            var transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) translateY(' + translateY + 'px)'; // Converted
            element.element.style.transform = transform;
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.recalculateElements();
        this.rafId = requestAnimationFrame(this.update.bind(this));
        
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
        var timeout; // Converted let
        return function executedFunction() {
            var context = this;
            var args = arguments; // Converted
            var later = function() {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    addElement(element, options) {
        options = options || {};
        var config = { // Converted
            element: element,
            type: options.type || 'custom',
            speed: options.speed || 0.5,
            amplitude: options.amplitude || 20,
            frequency: options.frequency || 0.001,
            id: options.id || 'custom-' + this.elements.length
        };
        
        this.elements.push(config);
        console.log('➕ Added parallax element: ' + config.id);
    }
    
    removeElement(id) {
        var index = this.elements.findIndex(function(el) { return el.id === id; }); // Converted
        if (index !== -1) {
            this.elements.splice(index, 1);
            console.log('➖ Removed parallax element: ' + id);
        }
    }
    
    setSpeed(id, speed) {
        var element = this.elements.find(function(el) { return el.id === id; }); // Converted
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

var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; // Converted

if (prefersReducedMotion) {
    console.log('⚠️ Reduced motion preferred - Parallax effects disabled');
} else {
    var parallaxEngine = new ParallaxEngine(); // Converted
    
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