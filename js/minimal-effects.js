// Minimal Effects for VIB3CODE - No ES6 features for maximum compatibility

// Main App
function VIB3CODEApp() {
    this.isLoaded = false;
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
    this.setupCardAnimations();
    this.setupNewsletterForm();
    
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
            self.triggerLoadedAnimations();
        }, 1000);
    }
    this.isLoaded = true;
};

VIB3CODEApp.prototype.triggerLoadedAnimations = function() {
    var heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        heroTitle.style.animation = 'none';
        heroTitle.offsetHeight; // Trigger reflow
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
    
    // Mobile navigation toggle
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for navigation links
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
            
            // Close mobile menu if open
            if (navLinks) {
                navLinks.classList.remove('active');
            }
            if (navToggle) {
                navToggle.classList.remove('active');
            }
        });
    }
    
    // Add scroll effect to navigation
    var ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                var scrolled = window.scrollY > 100;
                if (nav) {
                    if (scrolled) {
                        nav.classList.add('scrolled');
                    } else {
                        nav.classList.remove('scrolled');
                    }
                }
                ticking = false;
            });
            ticking = true;
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
    
    var ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    updateParallax();
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
    
    // Button hover effects
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
        var btnText = submitButton.querySelector('.btn-text');
        var originalText = btnText.textContent;
        btnText.textContent = 'Subscribing...';
        submitButton.disabled = true;
        
        // Simulate subscription
        setTimeout(function() {
            if (Math.random() < 0.95) {
                self.showFormStatus('Welcome to the VIB3CODE community! Check your email for confirmation.', 'success');
                emailInput.value = '';
            } else {
                self.showFormStatus('Something went wrong. Please try again later.', 'error');
            }
            
            btnText.textContent = originalText;
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

// Initialize the app
var vib3codeApp = new VIB3CODEApp();

// Export for use by other modules
window.VIB3CODE = vib3codeApp;

// Handle page unload
window.addEventListener('beforeunload', function() {
    console.log('🔥 VIB3CODE app destroyed');
});