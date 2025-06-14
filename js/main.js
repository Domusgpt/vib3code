// Main JavaScript Module for VIB3CODE
// Handles all interactions, animations, and user experience

class VIB3CODEApp {
    constructor() {
        this.isLoaded = false;
        this.scrollY = 0;
        this.ticking = false;
        this.intersectionObserver = null;
        this.audioContext = null;
        this.audioInitialized = false;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        console.log('🚀 VIB3CODE initializing...');
        
        // Initialize all modules
        this.setupLoadingScreen();
        this.setupNavigation();
        this.setupScrollEffects();
        this.setupIntersectionObserver();
        this.setupCardAnimations();
        this.setupNewsletterForm();
        this.setupAudioContext();
        
        // Mark as loaded after a brief delay
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 2000);
        
        console.log('✅ VIB3CODE initialized successfully');
    }
    
    setupLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        
        // Simulate loading progress
        const loadingText = loadingScreen.querySelector('.loading-text');
        const messages = [
            'Initializing VIB3CODE...',
            'Loading cyberpunk aesthetic...',
            'Connecting to the matrix...',
            'Preparing 4D visualizer...',
            'Code without chains ready!'
        ];
        
        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            if (messageIndex < messages.length - 1) {
                messageIndex++;
                if (loadingText) {
                    loadingText.textContent = messages[messageIndex];
                }
            } else {
                clearInterval(messageInterval);
            }
        }, 400);
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
        }
        this.isLoaded = true;
        this.triggerLoadedAnimations();
    }
    
    triggerLoadedAnimations() {
        // Trigger hero animations
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            heroTitle.style.animation = 'none';
            heroTitle.offsetHeight; // Trigger reflow
            heroTitle.style.animation = null;
        }
        
        // Start floating elements
        const floatingElements = document.querySelectorAll('.floating-element');
        floatingElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.animation = `float ${8 + index * 2}s ease-in-out infinite`;
                element.style.animationDelay = `${index * 0.5}s`;
            }, index * 200);
        });
    }
    
    setupNavigation() {
        const nav = document.getElementById('main-nav');
        const navToggle = document.getElementById('nav-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        // Mobile navigation toggle
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }
        
        // Smooth scrolling for navigation links
        const navLinkElements = document.querySelectorAll('.nav-link[data-section]');
        navLinkElements.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                const section = document.getElementById(sectionId);
                
                if (section) {
                    const offsetTop = section.offsetTop - 80; // Account for fixed nav
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
        });
        
        // Add scroll effect to navigation
        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                requestAnimationFrame(() => {
                    const scrolled = window.scrollY > 100;
                    if (nav) {
                        nav.classList.toggle('scrolled', scrolled);
                    }
                    this.ticking = false;
                });
                this.ticking = true;
            }
        });
    }
    
    setupScrollEffects() {
        // Parallax effect for background layers
        const parallaxLayers = document.querySelectorAll('.parallax-layer');
        
        const updateParallax = () => {
            if (!this.isLoaded) return;
            
            const scrollTop = window.pageYOffset;
            
            parallaxLayers.forEach(layer => {
                const speed = parseFloat(layer.dataset.speed) || 0.5;
                const yPos = -(scrollTop * speed);
                layer.style.transform = `translateY(${yPos}px)`;
            });
        };
        
        // Optimized scroll handler
        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
            if (!this.ticking) {
                requestAnimationFrame(() => {
                    updateParallax();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        });
        
        // Initial parallax setup
        updateParallax();
    }
    
    setupIntersectionObserver() {
        // Animate elements as they come into view
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    
                    // Special animations for specific elements
                    if (entry.target.classList.contains('ema-card')) {
                        this.animateEMACard(entry.target);
                    }
                    
                    if (entry.target.classList.contains('article-featured')) {
                        this.animateCodeVisualization(entry.target);
                    }
                }
            });
        }, observerOptions);
        
        // Observe all animatable elements
        const animatableElements = document.querySelectorAll(
            '.ema-card, .article-featured, .sidebar-article, .section-header'
        );
        
        animatableElements.forEach(element => {
            this.intersectionObserver.observe(element);
        });
    }
    
    animateEMACard(card) {
        const indicator = card.querySelector('.card-indicator');
        const principle = card.dataset.principle;
        
        // Animate the indicator
        if (indicator) {
            indicator.style.animation = 'pulse-indicator 1s ease-out';
        }
        
        // Add specific animations based on principle type
        setTimeout(() => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.opacity = '1';
        }, 100);
    }
    
    animateCodeVisualization(article) {
        const codeLines = article.querySelectorAll('.code-lines span');
        const dataFlow = article.querySelector('.data-flow');
        
        // Animate code lines typing effect
        codeLines.forEach((line, index) => {
            setTimeout(() => {
                line.style.animation = `type-in 0.8s ease-out forwards`;
            }, index * 300);
        });
        
        // Start data flow animation
        if (dataFlow) {
            setTimeout(() => {
                dataFlow.style.animation = 'flow 3s ease-in-out infinite';
            }, 1000);
        }
    }
    
    setupCardAnimations() {
        // 3D card tilt effects
        const cards3D = document.querySelectorAll('.card-3d');
        
        cards3D.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const deltaX = (e.clientX - centerX) / (rect.width / 2);
                const deltaY = (e.clientY - centerY) / (rect.height / 2);
                
                const rotateX = deltaY * -10; // Reduced for subtlety
                const rotateY = deltaX * 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            });
        });
        
        // Button hover effects
        const cyberButtons = document.querySelectorAll('.btn-cyber');
        cyberButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                const glow = button.querySelector('.btn-glow');
                if (glow) {
                    glow.style.left = '100%';
                }
            });
            
            button.addEventListener('mouseleave', () => {
                const glow = button.querySelector('.btn-glow');
                if (glow) {
                    setTimeout(() => {
                        glow.style.left = '-100%';
                    }, 500);
                }
            });
        });
    }
    
    setupNewsletterForm() {
        const form = document.getElementById('newsletter-form');
        const emailInput = document.getElementById('email-input');
        const formStatus = document.getElementById('form-status');
        
        if (!form || !emailInput || !formStatus) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            if (!email || !this.isValidEmail(email)) {
                this.showFormStatus('Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading state
            const submitButton = form.querySelector('button[type=\"submit\"]');
            const originalText = submitButton.querySelector('.btn-text').textContent;
            submitButton.querySelector('.btn-text').textContent = 'Subscribing...';
            submitButton.disabled = true;
            
            try {
                // Simulate API call (replace with actual newsletter service)
                await this.simulateSubscription(email);
                
                this.showFormStatus('Welcome to the VIB3CODE community! Check your email for confirmation.', 'success');
                emailInput.value = '';
                
                // Analytics tracking (if needed)
                this.trackNewsletterSignup(email);
                
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                this.showFormStatus('Something went wrong. Please try again later.', 'error');
            } finally {
                // Reset button state
                submitButton.querySelector('.btn-text').textContent = originalText;
                submitButton.disabled = false;
            }
        });
        
        // Email validation on input
        emailInput.addEventListener('input', () => {
            const email = emailInput.value.trim();
            if (email && !this.isValidEmail(email)) {
                emailInput.style.borderColor = 'var(--cyber-pink)';
                emailInput.style.boxShadow = '0 0 10px rgba(255, 16, 240, 0.3)';
            } else {
                emailInput.style.borderColor = 'rgba(0, 217, 255, 0.3)';
                emailInput.style.boxShadow = 'none';
            }
        });
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        return emailRegex.test(email);
    }
    
    async simulateSubscription(email) {
        // Simulate API delay
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 95% success rate
                if (Math.random() < 0.95) {
                    resolve({ success: true, email });
                } else {
                    reject(new Error('Subscription failed'));
                }
            }, 1500);
        });
    }
    
    showFormStatus(message, type) {
        const formStatus = document.getElementById('form-status');
        if (!formStatus) return;
        
        formStatus.textContent = message;
        formStatus.className = `form-status ${type}`;
        formStatus.style.opacity = '1';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                formStatus.style.opacity = '0';
            }, 5000);
        }
    }
    
    trackNewsletterSignup(email) {
        // Analytics tracking - replace with your preferred service
        console.log('Newsletter signup tracked:', email);
        
        // Example: Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'newsletter_signup', {
                'event_category': 'engagement',
                'event_label': 'newsletter',
                'value': 1
            });
        }
    }
    
    setupAudioContext() {
        // Audio context for visualizer (user activation required)
        const enableAudioBtn = document.getElementById('enable-audio');
        const audioWarning = document.getElementById('audio-warning');
        
        // Check if we need user interaction for audio
        this.checkAudioContextSupport();
        
        if (enableAudioBtn) {
            enableAudioBtn.addEventListener('click', () => {
                this.initializeAudioContext();
                if (audioWarning) {
                    audioWarning.style.display = 'none';
                }
            });
        }
        
        // Auto-initialize on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioInitialized) {
                this.initializeAudioContext();
            }
        }, { once: true });
    }
    
    checkAudioContextSupport() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.warn('Web Audio API not supported');
            return false;
        }
        
        // Check if we need user gesture (Safari, mobile browsers)
        const needsUserGesture = /iPad|iPhone|iPod|Safari/.test(navigator.userAgent);
        if (needsUserGesture) {
            const audioWarning = document.getElementById('audio-warning');
            if (audioWarning) {
                audioWarning.style.display = 'flex';
            }
        }
        
        return true;
    }
    
    async initializeAudioContext() {
        if (this.audioInitialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.audioInitialized = true;
            console.log('🎵 Audio context initialized');
            
            // Dispatch event for visualizer
            window.dispatchEvent(new CustomEvent('audioContextReady', {
                detail: { audioContext: this.audioContext }
            }));
            
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }
    
    // Utility methods
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
    
    debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
    
    // Cleanup
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        console.log('🔥 VIB3CODE app destroyed');
    }
}

// Initialize the app
const vib3codeApp = new VIB3CODEApp();

// Export for use by other modules
window.VIB3CODE = vib3codeApp;

// Handle page unload
window.addEventListener('beforeunload', () => {
    vib3codeApp.destroy();
});