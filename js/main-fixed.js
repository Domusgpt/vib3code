// VIB3CODE Main App - Fixed Version
(function() {
    'use strict';
    
    // Main App Class
    function VIB3CODEApp() {
        this.isLoaded = false;
        this.scrollY = 0;
        this.ticking = false;
        this.intersectionObserver = null;
        this.audioContext = null;
        this.audioInitialized = false;
        
        this.init();
    }
    
    VIB3CODEApp.prototype.init = function() {
        var self = this;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                self.setup();
            });
        } else {
            self.setup();
        }
    };
    
    VIB3CODEApp.prototype.setup = function() {
        console.log('🚀 VIB3CODE initializing...');
        
        this.setupLoadingScreen();
        this.setupNavigation();
        this.setupScrollEffects();
        this.setupIntersectionObserver();
        this.setupCardAnimations();
        this.setupNewsletterForm();
        this.setupAudioContext();
        this.setupPersistentVisualizers(); // Call the new method
        
        var self = this;
        setTimeout(function() {
            self.hideLoadingScreen();
        }, 2000);
        
        console.log('✅ VIB3CODE initialized successfully');
    };
    
    VIB3CODEApp.prototype.setupLoadingScreen = function() {
        var loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        
        var loadingText = loadingScreen.querySelector('.loading-text');
        var messages = [
            'Initializing VIB3CODE...',
            'Loading cyberpunk aesthetic...',
            'Connecting to the matrix...',
            'Preparing 4D visualizer...',
            'Code without chains ready!'
        ];
        
        var messageIndex = 0;
        var messageInterval = setInterval(function() {
            if (messageIndex < messages.length - 1) {
                messageIndex++;
                if (loadingText) {
                    loadingText.textContent = messages[messageIndex];
                }
            } else {
                clearInterval(messageInterval);
            }
        }, 400);
    };
    
    VIB3CODEApp.prototype.hideLoadingScreen = function() {
        var loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            var self = this;
            setTimeout(function() {
                loadingScreen.style.display = 'none';
            }, 1000);
        }
        this.isLoaded = true;
        this.triggerLoadedAnimations();
    };
    
    VIB3CODEApp.prototype.triggerLoadedAnimations = function() {
        var heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            heroTitle.style.animation = 'none';
            heroTitle.offsetHeight;
            heroTitle.style.animation = null;
        }
        
        var floatingElements = document.querySelectorAll('.floating-element');
        for (var i = 0; i < floatingElements.length; i++) {
            (function(element, index) {
                setTimeout(function() {
                    element.style.opacity = '1';
                    element.style.animation = 'float ' + (8 + index * 2) + 's ease-in-out infinite';
                    element.style.animationDelay = (index * 0.5) + 's';
                }, index * 200);
            })(floatingElements[i], i);
        }
    };
    
    VIB3CODEApp.prototype.setupNavigation = function() {
        var nav = document.getElementById('main-nav');
        var navToggle = document.getElementById('nav-toggle');
        var navLinks = document.querySelector('.nav-links');
        
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', function() {
                navLinks.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }
        
        var navLinkElements = document.querySelectorAll('.nav-link[data-section]');
        for (var i = 0; i < navLinkElements.length; i++) {
            navLinkElements[i].addEventListener('click', function(e) {
                e.preventDefault();
                var sectionId = this.getAttribute('data-section');
                var section = document.getElementById(sectionId);
                
                if (section) {
                    var offsetTop = section.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
                
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
                if (navToggle) {
                    navToggle.classList.remove('active');
                }
            });
        }
        
        var self = this;
        window.addEventListener('scroll', function() {
            if (!self.ticking) {
                requestAnimationFrame(function() {
                    var scrolled = window.scrollY > 100;
                    if (nav) {
                        nav.classList.toggle('scrolled', scrolled);
                    }
                    self.ticking = false;
                });
                self.ticking = true;
            }
        });
    };
    
    VIB3CODEApp.prototype.setupScrollEffects = function() {
        var parallaxLayers = document.querySelectorAll('.parallax-layer');
        var self = this;
        
        function updateParallax() {
            if (!self.isLoaded) return;
            
            var scrollTop = window.pageYOffset;
            
            for (var i = 0; i < parallaxLayers.length; i++) {
                var layer = parallaxLayers[i];
                var speed = parseFloat(layer.dataset.speed) || 0.5;
                var yPos = -(scrollTop * speed);
                layer.style.transform = 'translateY(' + yPos + 'px)';
            }
        }
        
        window.addEventListener('scroll', function() {
            self.scrollY = window.scrollY;
            if (!self.ticking) {
                requestAnimationFrame(function() {
                    updateParallax();
                    self.ticking = false;
                });
                self.ticking = true;
            }
        });
        
        updateParallax();
    };
    
    VIB3CODEApp.prototype.setupIntersectionObserver = function() {
        var observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        var self = this;
        this.intersectionObserver = new IntersectionObserver(function(entries) {
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    
                    if (entry.target.classList.contains('ema-card')) {
                        self.animateEMACard(entry.target);
                    }
                    
                    if (entry.target.classList.contains('article-featured')) {
                        self.animateCodeVisualization(entry.target);
                    }
                }
            }
        }, observerOptions);
        
        var animatableElements = document.querySelectorAll('.ema-card, .article-featured, .sidebar-article, .section-header');
        
        for (var i = 0; i < animatableElements.length; i++) {
            this.intersectionObserver.observe(animatableElements[i]);
        }
    };
    
    VIB3CODEApp.prototype.animateEMACard = function(card) {
        var indicator = card.querySelector('.card-indicator');
        
        if (indicator) {
            indicator.style.animation = 'pulse-indicator 1s ease-out';
        }
        
        setTimeout(function() {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.opacity = '1';
        }, 100);
    };
    
    VIB3CODEApp.prototype.animateCodeVisualization = function(article) {
        var codeLines = article.querySelectorAll('.code-lines span');
        var dataFlow = article.querySelector('.data-flow');
        
        for (var i = 0; i < codeLines.length; i++) {
            (function(line, index) {
                setTimeout(function() {
                    line.style.animation = 'type-in 0.8s ease-out forwards';
                }, index * 300);
            })(codeLines[i], i);
        }
        
        if (dataFlow) {
            setTimeout(function() {
                dataFlow.style.animation = 'flow 3s ease-in-out infinite';
            }, 1000);
        }
    };
    
    VIB3CODEApp.prototype.setupCardAnimations = function() {
        var cards3D = document.querySelectorAll('.card-3d');
        
        for (var i = 0; i < cards3D.length; i++) {
            var card = cards3D[i];
            
            card.addEventListener('mousemove', function(e) {
                var rect = this.getBoundingClientRect();
                var centerX = rect.left + rect.width / 2;
                var centerY = rect.top + rect.height / 2;
                
                var deltaX = (e.clientX - centerX) / (rect.width / 2);
                var deltaY = (e.clientY - centerY) / (rect.height / 2);
                
                var rotateX = deltaY * -10;
                var rotateY = deltaX * 10;
                
                this.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(10px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            });
        }
        
        var cyberButtons = document.querySelectorAll('.btn-cyber');
        for (var i = 0; i < cyberButtons.length; i++) {
            var button = cyberButtons[i];
            
            button.addEventListener('mouseenter', function() {
                var glow = this.querySelector('.btn-glow');
                if (glow) {
                    glow.style.left = '100%';
                }
            });
            
            button.addEventListener('mouseleave', function() {
                var glow = this.querySelector('.btn-glow');
                if (glow) {
                    setTimeout(function() {
                        glow.style.left = '-100%';
                    }, 500);
                }
            });
        }
    };
    
    VIB3CODEApp.prototype.setupNewsletterForm = function() {
        var form = document.getElementById('newsletter-form');
        var emailInput = document.getElementById('email-input');
        var formStatus = document.getElementById('form-status');
        
        if (!form || !emailInput || !formStatus) return;
        
        var self = this;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            var email = emailInput.value.trim();
            if (!email || !self.isValidEmail(email)) {
                self.showFormStatus('Please enter a valid email address', 'error');
                return;
            }
            
            var submitButton = form.querySelector('button[type="submit"]');
            var originalText = submitButton.querySelector('.btn-text').textContent;
            submitButton.querySelector('.btn-text').textContent = 'Subscribing...';
            submitButton.disabled = true;
            
            setTimeout(function() {
                if (Math.random() < 0.95) {
                    self.showFormStatus('Welcome to the VIB3CODE community! Check your email for confirmation.', 'success');
                    emailInput.value = '';
                } else {
                    self.showFormStatus('Something went wrong. Please try again later.', 'error');
                }
                
                submitButton.querySelector('.btn-text').textContent = originalText;
                submitButton.disabled = false;
            }, 1500);
        });
        
        emailInput.addEventListener('input', function() {
            var email = emailInput.value.trim();
            if (email && !self.isValidEmail(email)) {
                emailInput.style.borderColor = 'var(--cyber-pink)';
                emailInput.style.boxShadow = '0 0 10px rgba(255, 16, 240, 0.3)';
            } else {
                emailInput.style.borderColor = 'rgba(0, 217, 255, 0.3)';
                emailInput.style.boxShadow = 'none';
            }
        });
    };
    
    VIB3CODEApp.prototype.isValidEmail = function(email) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    
    VIB3CODEApp.prototype.showFormStatus = function(message, type) {
        var formStatus = document.getElementById('form-status');
        if (!formStatus) return;
        
        formStatus.textContent = message;
        formStatus.className = 'form-status ' + type;
        formStatus.style.opacity = '1';
        
        if (type === 'success') {
            setTimeout(function() {
                formStatus.style.opacity = '0';
            }, 5000);
        }
    };
    
    VIB3CODEApp.prototype.setupAudioContext = function() {
        var enableAudioBtn = document.getElementById('enable-audio');
        var audioWarning = document.getElementById('audio-warning');
        var self = this;
        
        this.checkAudioContextSupport();
        
        if (enableAudioBtn) {
            enableAudioBtn.addEventListener('click', function() {
                self.initializeAudioContext();
                if (audioWarning) {
                    audioWarning.style.display = 'none';
                }
            });
        }
        
        document.addEventListener('click', function() {
            if (!self.audioInitialized) {
                self.initializeAudioContext();
            }
        }, { once: true });
    };
    
    VIB3CODEApp.prototype.checkAudioContextSupport = function() {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.warn('Web Audio API not supported');
            return false;
        }
        
        var needsUserGesture = /iPad|iPhone|iPod|Safari/.test(navigator.userAgent);
        if (needsUserGesture) {
            var audioWarning = document.getElementById('audio-warning');
            if (audioWarning) {
                audioWarning.style.display = 'flex';
            }
        }
        
        return true;
    };
    
    VIB3CODEApp.prototype.initializeAudioContext = function() {
        if (this.audioInitialized) return;
        
        var self = this;
        
        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(function() {
                    self.audioInitialized = true;
                    console.log('🎵 Audio context initialized');
                    
                    window.dispatchEvent(new CustomEvent('audioContextReady', {
                        detail: { audioContext: self.audioContext }
                    }));
                });
            } else {
                this.audioInitialized = true;
                console.log('🎵 Audio context initialized');
                
                window.dispatchEvent(new CustomEvent('audioContextReady', {
                    detail: { audioContext: this.audioContext }
                }));
            }
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    };

    VIB3CODEApp.prototype.setupPersistentVisualizers = function() {
        console.log('Setting up Persistent Visualizers...');

        function createAndAppendCanvas(id, className, zIndex) {
            let canvas = document.getElementById(id);
            if (canvas) { // If canvas already exists (e.g. from previous load or static HTML)
                // Optionally clear it or ensure it's correctly styled
                console.log(`Canvas ${id} already exists. Reusing.`);
            } else {
                canvas = document.createElement('canvas');
                canvas.id = id;
                document.body.appendChild(canvas);
                console.log(`Canvas ${id} created.`);
            }

            canvas.className = className; // Apply class
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = zIndex.toString();
            return canvas;
        }

        const headerCanvas = createAndAppendCanvas('persistent-header', 'header-visualizer', 1);
        const contentCanvas = createAndAppendCanvas('persistent-content', 'content-visualizer', 0);
        const ambientCanvas = createAndAppendCanvas('persistent-ambient', 'ambient-visualizer', -1);

        if (window.visualizerManager && typeof window.visualizerManager.addInstance === 'function') {
            const vm = window.visualizerManager;

            vm.addInstance('header', headerCanvas,
                { intensity: 0.3, opacity: 0.25, transitionDuration: 1000,
                  reactivityConfig: { gridDensityFromVelocity: 1.5, glitchFromMouseVelocity: 0.04, rotationFromScrollVelocity: 0.08, intensityFromVelocity: 0.8 } },
                { intensityMultiplierRelativeToMaster: 1.0 },
                vm.globalVelocityState
            );

            vm.addInstance('content', contentCanvas,
                { intensity: 0.15, opacity: 0.12, transitionDuration: 1000,
                  reactivityConfig: { gridDensityFromVelocity: 2.0, glitchFromMouseVelocity: 0.05, rotationFromScrollVelocity: 0.1, intensityFromVelocity: 1.0 } },
                { intensityMultiplierRelativeToMaster: 0.5 },
                vm.globalVelocityState
            );

            vm.addInstance('ambient', ambientCanvas,
                { intensity: 0.08, opacity: 0.06, transitionDuration: 1000,
                  reactivityConfig: { gridDensityFromVelocity: 2.5, glitchFromMouseVelocity: 0.06, rotationFromScrollVelocity: 0.12, intensityFromVelocity: 1.2 } },
                { intensityMultiplierRelativeToMaster: 0.25 },
                vm.globalVelocityState
            );

            // After adding instances, it might be necessary to apply the initial master style
            // if the router hasn't run yet or if a default state is desired immediately.
            // vm.applyMasterStyle(vm.getCurrentMasterStyleKey() || 'home');

        } else {
            console.error('VisualizerManager not found or addInstance method is missing. Visualizers not added.');
        }
    };
    
    VIB3CODEApp.prototype.destroy = function() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        console.log('🔥 VIB3CODE app destroyed');
    };
    
    // Initialize the app
    var vib3codeApp = new VIB3CODEApp();
    
    // Export for use by other modules
    window.VIB3CODE = vib3codeApp;
    
    // Handle page unload
    window.addEventListener('beforeunload', function() {
        vib3codeApp.destroy();
    });
    
})();