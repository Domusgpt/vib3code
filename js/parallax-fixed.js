// VIB3CODE Parallax Engine - Fixed Version
(function() {
    'use strict';
    
    function ParallaxEngine() {
        this.elements = [];
        this.scrollY = 0;
        this.windowHeight = window.innerHeight;
        this.isRunning = false;
        this.rafId = null;
        
        this.init();
    }
    
    ParallaxEngine.prototype.init = function() {
        console.log('🌊 Initializing Parallax Engine...');
        
        this.setupElements();
        this.bindEvents();
        this.start();
        
        console.log('✅ Parallax Engine initialized with ' + this.elements.length + ' elements');
    };
    
    ParallaxEngine.prototype.setupElements = function() {
        var backgroundLayers = document.querySelectorAll('.parallax-layer');
        for (var i = 0; i < backgroundLayers.length; i++) {
            var layer = backgroundLayers[i];
            var speed = parseFloat(layer.dataset.speed) || 0.5;
            this.elements.push({
                element: layer,
                type: 'background',
                speed: speed,
                offset: 0,
                id: 'bg-layer-' + i
            });
        }
        
        var floatingElements = document.querySelectorAll('.floating-element');
        for (var i = 0; i < floatingElements.length; i++) {
            var element = floatingElements[i];
            this.elements.push({
                element: element,
                type: 'floating',
                speed: 0.3 + (i * 0.1),
                amplitude: 20 + (i * 10),
                frequency: 0.001 + (i * 0.0005),
                offset: 0,
                id: 'floating-' + i
            });
        }
        
        var parallaxSections = document.querySelectorAll('.parallax-section');
        for (var i = 0; i < parallaxSections.length; i++) {
            var section = parallaxSections[i];
            this.elements.push({
                element: section,
                type: 'section',
                speed: 0.1,
                id: 'section-' + i
            });
        }
        
        var cards3D = document.querySelectorAll('.card-3d');
        for (var i = 0; i < cards3D.length; i++) {
            this.setupCardParallax(cards3D[i], i);
        }
    };
    
    ParallaxEngine.prototype.setupCardParallax = function(card, index) {
        var self = this;
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
    };
    
    ParallaxEngine.prototype.updateCardTransform = function(card, mouseX, mouseY) {
        var maxRotation = 15;
        var maxTranslation = 5;
        
        var rotateX = mouseY * -maxRotation;
        var rotateY = mouseX * maxRotation;
        var translateX = mouseX * maxTranslation;
        var translateY = mouseY * maxTranslation;
        
        var transform = 'perspective(1000px) ' +
            'rotateX(' + rotateX + 'deg) ' +
            'rotateY(' + rotateY + 'deg) ' +
            'translateX(' + translateX + 'px) ' +
            'translateY(' + translateY + 'px) ' +
            'translateZ(20px)';
        
        card.style.transform = transform;
        
        var cardGlow = card.querySelector('.card-glow');
        if (cardGlow) {
            cardGlow.style.transform = 'translate(' + (mouseX * 20) + 'px, ' + (mouseY * 20) + 'px)';
        }
    };
    
    ParallaxEngine.prototype.bindEvents = function() {
        var self = this;
        
        window.addEventListener('scroll', function() {
            self.scrollY = window.pageYOffset;
        }, { passive: true });
        
        window.addEventListener('resize', this.debounce(function() {
            self.windowHeight = window.innerHeight;
            self.recalculateElements();
        }, 250));
        
        this.setupPerformanceMonitoring();
    };
    
    ParallaxEngine.prototype.setupPerformanceMonitoring = function() {
        var frameCount = 0;
        var lastTime = performance.now();
        var self = this;
        
        function checkPerformance() {
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
        }
        
        requestAnimationFrame(checkPerformance);
    };
    
    ParallaxEngine.prototype.enablePerformanceMode = function() {
        for (var i = 0; i < this.elements.length; i++) {
            var element = this.elements[i];
            if (element.type === 'floating') {
                element.speed *= 0.5;
                element.amplitude *= 0.7;
            }
        }
        
        console.log('⚡ Performance mode enabled');
    };
    
    ParallaxEngine.prototype.disablePerformanceMode = function() {
        this.recalculateElements();
        // console.log('🚀 Full quality mode restored'); // Reduced logging for performance
    };
    
    ParallaxEngine.prototype.recalculateElements = function() {
        for (var i = 0; i < this.elements.length; i++) {
            var element = this.elements[i];
            if (element.element) {
                var rect = element.element.getBoundingClientRect();
                element.elementTop = rect.top + this.scrollY;
                element.elementHeight = rect.height;
            }
        }
    };
    
    ParallaxEngine.prototype.update = function() {
        if (!this.isRunning) return;
        
        var currentTime = performance.now();
        
        for (var i = 0; i < this.elements.length; i++) {
            var element = this.elements[i];
            if (!element.element) continue;
            
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
        }
        
        var self = this;
        this.rafId = requestAnimationFrame(function() {
            self.update();
        });
    };
    
    ParallaxEngine.prototype.updateBackgroundLayer = function(element) {
        var translateY = -(this.scrollY * element.speed);
        element.element.style.transform = 'translateY(' + translateY + 'px)';
    };
    
    ParallaxEngine.prototype.updateFloatingElement = function(element, currentTime) {
        var scrollInfluence = this.scrollY * element.speed;
        var timeInfluence = Math.sin(currentTime * element.frequency) * element.amplitude;
        var rotationInfluence = Math.cos(currentTime * element.frequency * 0.5) * 5;
        
        var translateY = scrollInfluence + timeInfluence;
        var rotation = rotationInfluence;
        
        element.element.style.transform = 'translateY(' + translateY + 'px) rotate(' + rotation + 'deg)';
        
        var viewportCenter = this.scrollY + this.windowHeight / 2;
        var elementCenter = element.element.offsetTop;
        var distance = Math.abs(viewportCenter - elementCenter);
        var maxDistance = this.windowHeight;
        var opacity = Math.max(0.2, 1 - (distance / maxDistance));
        
        element.element.style.opacity = opacity;
    };
    
    ParallaxEngine.prototype.updateSection = function(element) {
        var rect = element.element.getBoundingClientRect();
        var isInView = rect.bottom >= 0 && rect.top <= this.windowHeight;
        
        if (isInView) {
            var translateY = this.scrollY * element.speed;
            element.element.style.transform = 'translateY(' + translateY + 'px)';
        }
    };
    
    ParallaxEngine.prototype.updateCard = function(element) {
        var rect = element.element.getBoundingClientRect();
        var isInView = rect.bottom >= 0 && rect.top <= this.windowHeight;
        
        if (isInView && !element.isHovering) {
            var centerY = rect.top + rect.height / 2;
            var screenCenter = this.windowHeight / 2;
            var distance = (centerY - screenCenter) / screenCenter;
            
            var rotateX = distance * 2;
            var translateY = this.scrollY * element.speed;
            
            var transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) translateY(' + translateY + 'px)';
            element.element.style.transform = transform;
        }
    };
    
    ParallaxEngine.prototype.start = function() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.recalculateElements();
        this.update();
        
        console.log('🌊 Parallax Engine started');
    };
    
    ParallaxEngine.prototype.stop = function() {
        this.isRunning = false;
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        console.log('⏹️ Parallax Engine stopped');
    };
    
    ParallaxEngine.prototype.debounce = function(func, wait) {
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
    };
    
    ParallaxEngine.prototype.destroy = function() {
        this.stop();
        this.elements = [];
        console.log('🔥 Parallax Engine destroyed');
    };
    
    // Check for reduced motion preference
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        console.log('⚠️ Reduced motion preferred - Parallax effects disabled');
    } else {
        // Initialize parallax engine
        var parallaxEngine = new ParallaxEngine();
        
        // Export for external use
        window.ParallaxEngine = parallaxEngine;
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            parallaxEngine.destroy();
        });
        
        // Pause/resume based on visibility
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                parallaxEngine.stop();
            } else {
                parallaxEngine.start();
            }
        });
    }
    
})();