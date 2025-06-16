// VIB3CODE Interactive Features - TechRadar Inspired Enhancements
(function() {
    'use strict';
    
    function InteractiveFeatures() {
        this.init();
    }
    
    InteractiveFeatures.prototype.init = function() {
        console.log('🎮 Initializing Interactive Features...');
        
        this.bindExpandableElements();
        this.bindFilterButtons();
        this.bindHoverEffects();
        this.bindCardClicks();
        this.bindScrollEffects();
        
        console.log('✅ Interactive Features initialized');
    };
    
    // Expandable sections functionality
    InteractiveFeatures.prototype.bindExpandableElements = function() {
        var self = this;
        
        document.addEventListener('click', function(e) {
            if (e.target.matches('.expand-toggle')) {
                self.toggleExpandableSection(e.target);
            }
        });
    };
    
    InteractiveFeatures.prototype.toggleExpandableSection = function(button) {
        var section = button.previousElementSibling;
        if (!section || !section.classList.contains('expandable-section')) {
            section = button.closest('.expandable-section') || 
                     document.querySelector('.expandable-section');
        }
        
        if (section) {
            var isCollapsed = section.classList.contains('collapsed');
            
            if (isCollapsed) {
                section.classList.remove('collapsed');
                section.classList.add('expanded');
                button.textContent = 'Show Less';
                
                // Smooth scroll to reveal content
                setTimeout(function() {
                    section.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest' 
                    });
                }, 100);
            } else {
                section.classList.remove('expanded');
                section.classList.add('collapsed');
                button.textContent = 'Show More Articles';
            }
        }
    };
    
    // Filter buttons functionality
    InteractiveFeatures.prototype.bindFilterButtons = function() {
        var self = this;
        
        document.addEventListener('click', function(e) {
            if (e.target.matches('.filter-button')) {
                self.handleFilterClick(e.target);
            }
            
            if (e.target.matches('.action-button')) {
                self.handleActionClick(e.target);
            }
        });
    };
    
    InteractiveFeatures.prototype.handleFilterClick = function(button) {
        // Remove active class from siblings
        var filterGroup = button.closest('.filter-group');
        if (filterGroup) {
            var siblings = filterGroup.querySelectorAll('.filter-button');
            for (var i = 0; i < siblings.length; i++) {
                siblings[i].classList.remove('active');
            }
        }
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Add visual feedback
        button.style.transform = 'scale(0.95)';
        setTimeout(function() {
            button.style.transform = '';
        }, 150);
        
        // Trigger filter event if magazine router is available
        if (window.MagazineRouter && button.hasAttribute('data-subsection')) {
            var subsection = button.getAttribute('data-subsection');
            var parentSection = button.getAttribute('data-parent-section');
            
            if (parentSection && window.MagazineRouter.loadSubsection) {
                window.MagazineRouter.loadSubsection(parentSection, subsection);
            }
        }
        
        console.log('🔍 Filter applied:', button.textContent);
    };
    
    InteractiveFeatures.prototype.handleActionClick = function(button) {
        // Visual feedback for action buttons
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 4px 12px rgba(0, 217, 255, 0.3)';
        
        setTimeout(function() {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 200);
        
        console.log('⚡ Action triggered:', button.textContent);
    };
    
    // Enhanced hover effects
    InteractiveFeatures.prototype.bindHoverEffects = function() {
        var self = this;
        
        // Content cards enhanced hover
        document.addEventListener('mouseenter', function(e) {
            var target = e.target || e.srcElement;
            if (!target || !target.matches) return; // Safety check for older browsers
            
            if (target.matches('.content-card') || target.closest('.content-card')) {
                var card = target.matches('.content-card') ? target : target.closest('.content-card');
                self.enhanceCardHover(card, true);
            }
        }, true);
        
        document.addEventListener('mouseleave', function(e) {
            var target = e.target || e.srcElement;
            if (!target || !target.matches) return; // Safety check for older browsers
            
            if (target.matches('.content-card') || target.closest('.content-card')) {
                var card = target.matches('.content-card') ? target : target.closest('.content-card');
                self.enhanceCardHover(card, false);
            }
        }, true);
        
        // Feature blocks hover
        document.addEventListener('mouseenter', function(e) {
            var target = e.target || e.srcElement;
            if (!target || !target.matches) return; // Safety check for older browsers
            
            if (target.matches('.feature-block') || target.closest('.feature-block')) {
                var block = target.matches('.feature-block') ? target : target.closest('.feature-block');
                self.enhanceFeatureHover(block, true);
            }
        }, true);
        
        document.addEventListener('mouseleave', function(e) {
            var target = e.target || e.srcElement;
            if (!target || !target.matches) return; // Safety check for older browsers
            
            if (target.matches('.feature-block') || target.closest('.feature-block')) {
                var block = target.matches('.feature-block') ? target : target.closest('.feature-block');
                self.enhanceFeatureHover(block, false);
            }
        }, true);
    };
    
    InteractiveFeatures.prototype.enhanceCardHover = function(card, isEntering) {
        if (isEntering) {
            // Add dynamic glow effect
            card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 217, 255, 0.2)';
            
            // Enhance the holographic overlay
            var overlay = card.querySelector('.info-overlay');
            if (overlay) {
                overlay.style.backdropFilter = 'blur(15px)';
            }
            
            // Subtle scale animation
            card.style.transform = 'translateY(-8px) scale(1.02)';
            
        } else {
            // Reset effects
            setTimeout(function() {
                card.style.boxShadow = '';
                card.style.transform = '';
                
                var overlay = card.querySelector('.info-overlay');
                if (overlay) {
                    overlay.style.backdropFilter = '';
                }
            }, 300);
        }
    };
    
    InteractiveFeatures.prototype.enhanceFeatureHover = function(block, isEntering) {
        if (isEntering) {
            block.style.transform = 'scale(1.02)';
            block.style.filter = 'brightness(1.1)';
        } else {
            setTimeout(function() {
                block.style.transform = '';
                block.style.filter = '';
            }, 300);
        }
    };
    
    // Card click functionality
    InteractiveFeatures.prototype.bindCardClicks = function() {
        var self = this;
        
        document.addEventListener('click', function(e) {
            var card = e.target.closest('.content-card');
            if (card && !e.target.matches('a, button, .overlay-cta')) {
                self.handleCardClick(card);
            }
            
            // Handle section navigation
            if (card && card.hasAttribute('data-section')) {
                e.preventDefault();
                var section = card.getAttribute('data-section');
                if (window.MagazineRouter && window.MagazineRouter.navigateToSection) {
                    window.MagazineRouter.navigateToSection(section);
                }
            }
        });
    };
    
    InteractiveFeatures.prototype.handleCardClick = function(card) {
        // Add click ripple effect
        var ripple = document.createElement('div');
        ripple.style.cssText =
            'position: absolute;' +
            'background: rgba(0, 217, 255, 0.3);' +
            'border-radius: 50%;' +
            'width: 20px;' +
            'height: 20px;' +
            'animation: ripple 0.6s ease-out;' +
            'pointer-events: none;' +
            'z-index: 1000;';
        
        // Add ripple animation CSS if not exists
        if (!document.querySelector('#ripple-styles')) {
            var style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent =
                '@keyframes ripple {' +
                    '0% {' +
                        'transform: scale(0);' +
                        'opacity: 1;' +
                    '}' +
                    '100% {' +
                        'transform: scale(4);' +
                        'opacity: 0;' +
                    '}' +
                '}';
            document.head.appendChild(style);
        }
        
        card.style.position = 'relative';
        card.appendChild(ripple);
        
        setTimeout(function() {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    };
    
    // Scroll-based effects
    InteractiveFeatures.prototype.bindScrollEffects = function() {
        var self = this;
        var ticking = false;
        
        function updateScrollEffects() {
            self.updateParallaxCards();
            self.updateVisibilityAnimations();
            ticking = false;
        }
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        });
    };
    
    InteractiveFeatures.prototype.updateParallaxCards = function() {
        var scrollY = window.pageYOffset;
        var cards = document.querySelectorAll('.content-card');
        
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var rect = card.getBoundingClientRect();
            var speed = 0.05;
            
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                var yPos = -(scrollY * speed);
                var cardImage = card.querySelector('.card-image');
                if (cardImage) {
                    cardImage.style.transform = 'translateY(' + yPos + 'px)';
                }
            }
        }
    };
    
    InteractiveFeatures.prototype.updateVisibilityAnimations = function() {
        var cards = document.querySelectorAll('.content-card:not(.animated)');
        
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var rect = card.getBoundingClientRect();
            
            if (rect.top < window.innerHeight * 0.8) {
                card.classList.add('animated');
                card.style.animation = 'slideInUp 0.6s ease-out forwards';
                card.style.animationDelay = (i * 0.1) + 's';
            }
        }
        
        // Add animation CSS if not exists
        if (!document.querySelector('#visibility-animations')) {
            var style = document.createElement('style');
            style.id = 'visibility-animations';
            style.textContent =
                '@keyframes slideInUp {' +
                    'from {' +
                        'opacity: 0;' +
                        'transform: translateY(30px);' +
                    '}' +
                    'to {' +
                        'opacity: 1;' +
                        'transform: translateY(0);' +
                    '}' +
                '}' +
                
                '.content-card:not(.animated) {' +
                    'opacity: 0;' +
                    'transform: translateY(30px);' +
                '}';
            document.head.appendChild(style);
        }
    };
    
    // Search functionality placeholder
    InteractiveFeatures.prototype.initSearch = function() {
        var searchInput = document.querySelector('.search-input');
        if (searchInput) {
            var self = this;
            var debounceTimer;
            
            searchInput.addEventListener('input', function(e) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                    self.performSearch(e.target.value);
                }, 300);
            });
        }
    };
    
    InteractiveFeatures.prototype.performSearch = function(query) {
        console.log('🔍 Searching for:', query);
        // Implementation for search functionality
    };
    
    // Initialize interactive features
    var interactiveFeatures = new InteractiveFeatures();
    
    // Export for global access
    window.InteractiveFeatures = interactiveFeatures;
    
    console.log('🎮 VIB3CODE Interactive Features loaded');
    
})();