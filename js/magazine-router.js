// VIB3CODE Magazine Router - Single Page Application
(function() {
    'use strict';
    
    function MagazineRouter() {
        this.currentSection = 'home';
        this.sections = {
            home: { title: 'VIB3CODE', template: 'home' },
            articles: { 
                title: 'Articles', 
                template: 'articles',
                subsections: ['AI', 'Vibecoding', 'LLMs', 'Philosophy of Mind', 'Integrated Information Theory', 'Tech Frontiers']
            },
            videos: { title: 'Videos', template: 'videos' },
            podcasts: { title: 'Podcasts', template: 'podcasts' },
            ema: { title: 'E.M.A Movement', template: 'ema' },
            parserator: { title: 'Parserator', external: 'https://parserator.com' }
        };
        
        this.init();
    }
    
    MagazineRouter.prototype.init = function() {
        console.log('📰 Initializing Magazine Router...');
        
        // Check if magazine content container exists
        var container = document.querySelector('.magazine-content');
        console.log('📍 Magazine container found:', !!container);
        if (!container) {
            console.error('❌ Magazine content container not found! Cannot proceed.');
            return;
        }
        
        this.setupNavigation();
        this.bindHistoryEvents();
        
        // Force load home section immediately
        var self = this;
        console.log('🏠 Forcing home section load...');
        self.navigateToSection('home');
        
        console.log('✅ Magazine Router initialized');
    };
    
    MagazineRouter.prototype.setupNavigation = function() {
        var self = this;
        
        // Update navigation structure
        var navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.innerHTML = `
                <a href="#home" class="nav-link" data-section="home">Home</a>
                <a href="#articles" class="nav-link" data-section="articles">Articles</a>
                <a href="#videos" class="nav-link" data-section="videos">Videos</a>
                <a href="#podcasts" class="nav-link" data-section="podcasts">Podcasts</a>
                <a href="#ema" class="nav-link" data-section="ema">E.M.A</a>
                <a href="https://parserator.com" class="nav-link" target="_blank">Parserator</a>
            `;
        }
        
        // Bind click events
        document.addEventListener('click', function(e) {
            if (e.target.matches('.nav-link[data-section]')) {
                e.preventDefault();
                var section = e.target.getAttribute('data-section');
                self.navigateToSection(section);
            }
            
            // Handle subsection navigation
            if (e.target.matches('[data-subsection]')) {
                e.preventDefault();
                var subsection = e.target.getAttribute('data-subsection');
                var parentSection = e.target.getAttribute('data-parent-section');
                self.navigateToSubsection(parentSection, subsection);
            }
            
            // Handle article links
            if (e.target.matches('[data-article]')) {
                e.preventDefault();
                var articleId = e.target.getAttribute('data-article');
                self.navigateToArticle(articleId);
            }
        });
    };
    
    MagazineRouter.prototype.bindHistoryEvents = function() {
        var self = this;
        
        window.addEventListener('popstate', function(event) {
            if (event.state) {
                self.loadSection(event.state.section, false);
            }
        });
    };
    
    MagazineRouter.prototype.loadFromURL = function() {
        var hash = window.location.hash.slice(1) || 'home';
        var parts = hash.split('/');
        var section = parts[0];
        
        if (this.sections[section]) {
            this.loadSection(section, false);
            
            if (parts[1]) {
                // Handle subsection or article
                if (section === 'articles' && parts[1]) {
                    this.loadSubsection(section, parts[1]);
                } else if (section === 'article' && parts[1]) {
                    this.loadArticle(parts[1]);
                }
            }
        } else {
            this.navigateToSection('home');
        }
    };
    
    MagazineRouter.prototype.navigateToSection = function(section) {
        if (this.sections[section]) {
            if (this.sections[section].external) {
                window.open(this.sections[section].external, '_blank');
                return;
            }
            
            this.loadSection(section, true);
            window.location.hash = section;
            history.pushState({ section: section }, '', '#' + section);
        }
    };
    
    MagazineRouter.prototype.navigateToSubsection = function(section, subsection) {
        window.location.hash = section + '/' + subsection;
        history.pushState({ section: section, subsection: subsection }, '', '#' + section + '/' + subsection);
        this.loadSubsection(section, subsection);
    };
    
    MagazineRouter.prototype.navigateToArticle = function(articleId) {
        window.location.hash = 'article/' + articleId;
        history.pushState({ section: 'article', articleId: articleId }, '', '#article/' + articleId);
        this.loadArticle(articleId);
    };
    
    MagazineRouter.prototype.loadSection = function(section, animate) {
        var self = this;
        this.currentSection = section;
        
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(function(link) {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === section) {
                link.classList.add('active');
            }
        });
        
        // Hide all sections
        document.querySelectorAll('.magazine-section').forEach(function(sec) {
            sec.style.display = 'none';
        });
        
        // Show current section
        var sectionElement = document.getElementById('section-' + section);
        if (!sectionElement) {
            // Create section if it doesn't exist
            sectionElement = this.createSection(section);
        }
        
        if (sectionElement) {
            sectionElement.style.display = 'block';
            
            if (animate) {
                sectionElement.classList.add('section-entering');
                setTimeout(function() {
                    sectionElement.classList.remove('section-entering');
                }, 100);
            }
        }
        
        // Update theme engine
        if (window.ThemeEngine) {
            window.ThemeEngine.setSection(section);
        }
        
        // Trigger section-specific initialization
        this.initializeSection(section);
    };
    
    MagazineRouter.prototype.createSection = function(section) {
        var container = document.querySelector('.magazine-content');
        if (!container) {
            console.error('❌ Magazine content container not found!');
            return null;
        }
        
        console.log('🏗️ Creating section:', section);
        console.log('📍 Container element:', container);
        console.log('📍 Container position:', container.offsetTop, container.offsetLeft);
        
        var sectionDiv = document.createElement('div');
        sectionDiv.id = 'section-' + section;
        sectionDiv.className = 'magazine-section section-' + section;
        sectionDiv.style.cssText = 'display: block !important; width: 100%; min-height: 100vh; background: rgba(255,0,0,0.1);'; // Debug red background
        
        var templateContent = '';
        switch(section) {
            case 'home':
                templateContent = this.getHomeTemplate();
                break;
                
            case 'articles':
                templateContent = this.getArticlesTemplate();
                break;
                
            case 'videos':
                templateContent = this.getVideosTemplate();
                break;
                
            case 'podcasts':
                templateContent = this.getPodcastsTemplate();
                break;
                
            case 'ema':
                templateContent = this.getEMATemplate();
                break;
                
            default:
                templateContent = '<h1>Section: ' + section + '</h1><p>This section is under development.</p>';
        }
        
        console.log('📝 Template length:', templateContent.length);
        sectionDiv.innerHTML = templateContent;
        
        container.appendChild(sectionDiv);
        console.log('✅ Section appended to container');
        console.log('📊 Container children count:', container.children.length);
        
        return sectionDiv;
    };
    
    MagazineRouter.prototype.getHomeTemplate = function() {
        return `
            <div class="hero-magazine" style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 4rem 2rem; min-height: 100vh;">
                <h1 style="font-size: 4rem; color: #00d9ff; text-align: center; margin-bottom: 2rem;">VIB3CODE MAGAZINE</h1>
                <p style="font-size: 1.5rem; color: white; text-align: center; max-width: 800px; margin: 0 auto 3rem;">
                    The digital magazine where Exoditical Moral Architecture meets aesthetic excellence. 
                    We prove that ethical technology produces superior results through premium editorial design, 
                    sophisticated theme systems, and AI-powered content that advances the liberation movement.
                </p>
                <div style="display: flex; gap: 2rem; justify-content: center; margin-bottom: 4rem;">
                    <button style="background: #00d9ff; color: #1a1a2e; padding: 1rem 2rem; border: none; border-radius: 25px; font-weight: 600;">Explore Ideas</button>
                    <button style="background: #ff10f0; color: white; padding: 1rem 2rem; border: none; border-radius: 25px; font-weight: 600;">Try Parserator</button>
                </div>
                <!-- Personal Announcements -->
                <div class="personal-announcements">
                    <div class="announcement-author">
                        <div class="author-avatar">PP</div>
                        <div>
                            <h4 style="color: var(--light-text); margin: 0;">Paul Phillips</h4>
                            <span style="color: var(--text-muted); font-size: 0.9rem;">Founder & Editor-in-Chief</span>
                        </div>
                    </div>
                    <p style="color: var(--light-text); margin: 0;">
                        🚀 <strong>Major Update:</strong> VIB3CODE now features our revolutionary holographic visualizer 
                        and complete magazine architecture. Experience the future of editorial design where EMA principles 
                        meet aesthetic excellence.
                    </p>
                </div>

                <!-- Parserator Integration Showcase -->
                <div class="parserator-showcase">
                    <div class="parserator-content">
                        <h2 class="parserator-title">Parserator: EMA in Action</h2>
                        <div class="content-grid grid-hero">
                            <div>
                                <p style="font-size: 1.1rem; color: var(--light-text); line-height: 1.6; margin-bottom: 1.5rem;">
                                    The world's first EMA-compliant data parsing platform. Your application code never changes. Ever.
                                </p>
                                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                    <a href="https://parserator.com" class="overlay-cta">Launch Platform</a>
                                    <a href="#parserator" class="action-button" style="padding: 0.75rem 1.5rem;">Learn More</a>
                                </div>
                            </div>
                            <div class="feature-block" style="background: linear-gradient(135deg, rgba(0,217,255,0.1), rgba(255,16,240,0.1));">
                                <div class="feature-content">
                                    <div class="feature-title" style="font-size: 1.3rem;">95% Accuracy</div>
                                    <div class="feature-subtitle">Production-ready parsing with complete data liberation</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="content-grid grid-hero">
                    <div class="feature-block feature-block-large content-card" style="background: linear-gradient(135deg, #1a1a2e, #16213e);">
                        <div class="info-overlay">
                            <div class="overlay-content">
                                <h3 class="overlay-title">The Consciousness Revolution</h3>
                                <p class="overlay-description">
                                    Deep dive into how modern LLMs challenge our understanding of consciousness 
                                    through Integrated Information Theory.
                                </p>
                                <a href="#" data-article="consciousness-revolution" class="overlay-cta">Read Article</a>
                            </div>
                        </div>
                        <div class="feature-content">
                            <span class="card-category">Philosophy</span>
                            <h2 class="feature-title">AI Meets Integrated Information Theory</h2>
                            <p class="feature-subtitle">
                                Exploring the frontiers of machine consciousness through rigorous scientific frameworks
                            </p>
                        </div>
                    </div>

                    <div class="content-grid grid-compact">
                        <div class="content-card">
                            <div class="card-image"></div>
                            <div class="card-content">
                                <span class="card-category">Vibecoding</span>
                                <h3 class="card-title">The Art of Intuitive Development</h3>
                                <p class="card-excerpt">
                                    How to build sophisticated applications through flow state programming...
                                </p>
                                <div class="card-meta">
                                    <span>8 min read</span>
                                    <span>🔥 Trending</span>
                                </div>
                            </div>
                        </div>

                        <div class="content-card">
                            <div class="card-image"></div>
                            <div class="card-content">
                                <span class="card-category">E.M.A</span>
                                <h3 class="card-title">Digital Sovereignty in Practice</h3>
                                <p class="card-excerpt">
                                    Real-world implementation of Exoditical Moral Architecture principles...
                                </p>
                                <div class="card-meta">
                                    <span>Movement Update</span>
                                    <span>⭐ Featured</span>
                                </div>
                            </div>
                        </div>

                        <div class="content-card">
                            <div class="card-image"></div>
                            <div class="card-content">
                                <span class="card-category">Technical</span>
                                <h3 class="card-title">Claude 3.5: Breaking Context Barriers</h3>
                                <p class="card-excerpt">
                                    Analysis of the latest breakthrough in long-context language models...
                                </p>
                                <div class="card-meta">
                                    <span>5 min read</span>
                                    <span>🆕 New</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Newsletter Signup Enhanced -->
                <div class="newsletter-enhanced">
                    <div class="newsletter-content">
                        <h3 style="color: var(--cyber-blue); margin-bottom: 1rem;">Join the EMA Movement</h3>
                        <p style="color: var(--light-text); margin-bottom: 1.5rem;">
                            Get weekly insights on ethical technology, digital sovereignty, and the future of AI development.
                        </p>
                        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                            <input type="email" placeholder="your@email.com" style="padding: 0.75rem 1rem; border-radius: 25px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: white; flex: 1; min-width: 250px;">
                            <button class="overlay-cta">Subscribe</button>
                        </div>
                    </div>
                </div>

                <!-- Section Navigation Enhanced -->
                <div class="section-header-enhanced" style="margin-top: 3rem;">
                    <h2 style="color: var(--light-text);">Explore VIB3CODE</h2>
                    <div class="section-actions">
                        <button class="action-button">All Content</button>
                        <button class="action-button">Latest</button>
                        <button class="action-button">Popular</button>
                    </div>
                </div>

                <div class="content-grid grid-featured">
                    <div class="content-card" data-section="articles">
                        <div class="card-image" style="background: linear-gradient(135deg, rgba(0,217,255,0.3), rgba(255,16,240,0.1));"></div>
                        <div class="card-content">
                            <span class="card-category">Articles</span>
                            <h3 class="card-title">Deep Technical Insights</h3>
                            <p class="card-excerpt">
                                Sophisticated analysis of AI, consciousness, LLMs, and philosophy of mind with production-ready code examples.
                            </p>
                            <div class="card-meta">
                                <span>47 Articles</span>
                                <span>Expert Analysis</span>
                            </div>
                        </div>
                        <div class="info-overlay">
                            <div class="overlay-content">
                                <h3 class="overlay-title">Premium Articles</h3>
                                <p class="overlay-description">
                                    Deep dives into AI, Vibecoding, LLMs, Philosophy of Mind, and Integrated Information Theory
                                </p>
                                <div class="overlay-cta">Explore Articles</div>
                            </div>
                        </div>
                    </div>

                    <div class="content-card" data-section="videos">
                        <div class="card-image" style="background: linear-gradient(135deg, rgba(255,16,240,0.3), rgba(255,204,0,0.1));"></div>
                        <div class="card-content">
                            <span class="card-category">Videos</span>
                            <h3 class="card-title">Visual Philosophy</h3>
                            <p class="card-excerpt">
                                Video essays and technical demonstrations exploring the intersection of ethics and technology.
                            </p>
                            <div class="card-meta">
                                <span>23 Videos</span>
                                <span>YouTube Ready</span>
                            </div>
                        </div>
                        <div class="info-overlay">
                            <div class="overlay-content">
                                <h3 class="overlay-title">Video Essays</h3>
                                <p class="overlay-description">
                                    Visual explorations of complex concepts in AI ethics and digital sovereignty
                                </p>
                                <div class="overlay-cta">Watch Videos</div>
                            </div>
                        </div>
                    </div>

                    <div class="content-card" data-section="podcasts">
                        <div class="card-image" style="background: linear-gradient(135deg, rgba(255,204,0,0.3), rgba(0,217,255,0.1));"></div>
                        <div class="card-content">
                            <span class="card-category">Podcasts</span>
                            <h3 class="card-title">Digital Liberation</h3>
                            <p class="card-excerpt">
                                Conversations with leading thinkers on AI, consciousness, and ethical technology development.
                            </p>
                            <div class="card-meta">
                                <span>15 Episodes</span>
                                <span>AI Generated</span>
                            </div>
                        </div>
                        <div class="info-overlay">
                            <div class="overlay-content">
                                <h3 class="overlay-title">Podcast Series</h3>
                                <p class="overlay-description">
                                    Deep conversations on the future of ethical technology and digital sovereignty
                                </p>
                                <div class="overlay-cta">Listen Now</div>
                            </div>
                        </div>
                    </div>

                    <div class="content-card" data-section="ema">
                        <div class="card-image" style="background: linear-gradient(135deg, rgba(255,16,240,0.3), rgba(0,217,255,0.2));"></div>
                        <div class="card-content">
                            <span class="card-category">Movement</span>
                            <h3 class="card-title">E.M.A Principles</h3>
                            <p class="card-excerpt">
                                The moral architecture for digital sovereignty. Building technology that respects human agency.
                            </p>
                            <div class="card-meta">
                                <span>Core Philosophy</span>
                                <span>Join Movement</span>
                            </div>
                        </div>
                        <div class="info-overlay">
                            <div class="overlay-content">
                                <h3 class="overlay-title">EMA Movement</h3>
                                <p class="overlay-description">
                                    Exoditical Moral Architecture - the foundation for ethical technology development
                                </p>
                                <div class="overlay-cta">Learn EMA</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    MagazineRouter.prototype.getArticlesTemplate = function() {
        return `
            <div class="articles-section">
                <div class="section-header-enhanced">
                    <div>
                        <h1 class="section-title">Articles</h1>
                        <p class="section-description">
                            Deep technical and philosophical explorations at the intersection of 
                            AI, consciousness, and ethical technology development.
                        </p>
                    </div>
                    <div class="section-actions">
                        <button class="action-button">Latest</button>
                        <button class="action-button">Popular</button>
                        <button class="action-button">Bookmarks</button>
                    </div>
                </div>
                
                <div class="content-controls">
                    <div class="filter-group">
                        <button class="filter-button active" data-subsection="all" data-parent-section="articles">All Articles</button>
                        <button class="filter-button" data-subsection="ai" data-parent-section="articles">AI</button>
                        <button class="filter-button" data-subsection="vibecoding" data-parent-section="articles">Vibecoding</button>
                        <button class="filter-button" data-subsection="llms" data-parent-section="articles">LLMs</button>
                        <button class="filter-button" data-subsection="philosophy" data-parent-section="articles">Philosophy of Mind</button>
                        <button class="filter-button" data-subsection="iit" data-parent-section="articles">IIT</button>
                        <button class="filter-button" data-subsection="tech" data-parent-section="articles">Tech Frontiers</button>
                    </div>
                    <div class="filter-group">
                        <select class="action-button" style="background: rgba(255,255,255,0.05); color: var(--text-muted);">
                            <option>Sort by Date</option>
                            <option>Sort by Popularity</option>
                            <option>Sort by Read Time</option>
                        </select>
                    </div>
                </div>

                <!-- Featured Article -->
                <div class="content-grid grid-hero" style="margin-bottom: 3rem;">
                    <div class="feature-block feature-block-large content-card" style="background: linear-gradient(135deg, rgba(0,217,255,0.2), rgba(255,16,240,0.1));">
                        <div class="info-overlay">
                            <div class="overlay-content">
                                <h3 class="overlay-title">Featured Deep Dive</h3>
                                <p class="overlay-description">
                                    A comprehensive exploration of consciousness, AI sentience, and the philosophical implications 
                                    of modern language models through rigorous scientific frameworks.
                                </p>
                                <div class="overlay-cta">Read Full Article</div>
                            </div>
                        </div>
                        <div class="feature-content">
                            <span class="card-category">Featured</span>
                            <h2 class="feature-title">The Consciousness Revolution: When AI Meets IIT</h2>
                            <p class="feature-subtitle">
                                How Integrated Information Theory challenges our understanding of machine consciousness
                            </p>
                            <div style="margin-top: 1rem; color: rgba(255,255,255,0.7);">
                                <span>📖 15 min read</span> • <span>🧠 Philosophy</span> • <span>⭐ Editor's Choice</span>
                            </div>
                        </div>
                    </div>

                    <div class="expandable-section collapsed">
                        <div class="content-grid grid-compact">
                            <div class="content-card">
                                <div class="card-image" style="background: linear-gradient(135deg, rgba(255,16,240,0.3), rgba(0,217,255,0.1));"></div>
                                <div class="card-content">
                                    <span class="card-category">Vibecoding</span>
                                    <h3 class="card-title">Flow State Programming</h3>
                                    <p class="card-excerpt">
                                        Achieving peak development performance through intuitive coding practices...
                                    </p>
                                    <div class="card-meta">
                                        <span>12 min read</span>
                                        <span>🔥 Trending</span>
                                    </div>
                                </div>
                            </div>

                            <div class="content-card">
                                <div class="card-image" style="background: linear-gradient(135deg, rgba(255,204,0,0.3), rgba(255,16,240,0.1));"></div>
                                <div class="card-content">
                                    <span class="card-category">LLMs</span>
                                    <h3 class="card-title">Context Windows & Memory</h3>
                                    <p class="card-excerpt">
                                        Understanding the breakthrough advances in long-context language models...
                                    </p>
                                    <div class="card-meta">
                                        <span>8 min read</span>
                                        <span>🆕 New</span>
                                    </div>
                                </div>
                            </div>

                            <div class="content-card">
                                <div class="card-image" style="background: linear-gradient(135deg, rgba(0,217,255,0.3), rgba(255,204,0,0.1));"></div>
                                <div class="card-content">
                                    <span class="card-category">E.M.A</span>
                                    <h3 class="card-title">API Design for Freedom</h3>
                                    <p class="card-excerpt">
                                        Building interfaces that liberate users instead of trapping them...
                                    </p>
                                    <div class="card-meta">
                                        <span>10 min read</span>
                                        <span>💡 Technical</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button class="expand-toggle">Show More Articles</button>
                    </div>
                </div>
                
                <div class="content-grid grid-featured" id="articles-container">
                    <!-- Dynamic articles will be loaded here -->
                </div>

                <!-- Call to Action -->
                <div class="announcement-banner">
                    <div class="announcement-content">
                        <h3 class="announcement-title">Want to Contribute?</h3>
                        <p class="announcement-text">
                            Share your insights on AI ethics, consciousness research, or EMA implementation. 
                            We're always looking for thoughtful perspectives from the developer community.
                        </p>
                        <div style="margin-top: 1rem;">
                            <button class="overlay-cta" style="margin-right: 1rem;">Submit Article</button>
                            <button class="action-button">Writing Guidelines</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    MagazineRouter.prototype.getVideosTemplate = function() {
        return `
            <div class="videos-section">
                <div class="section-header">
                    <h1 class="section-title">Videos</h1>
                    <p class="section-description">
                        Visual essays and technical demonstrations exploring the frontiers of AI and consciousness.
                    </p>
                </div>
                
                <div class="videos-grid">
                    <div class="video-featured card-glass">
                        <div class="video-player holographic">
                            <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>
                        </div>
                        <div class="video-info">
                            <h2>The Mathematics of Consciousness</h2>
                            <p>A visual exploration of Integrated Information Theory and its implications for AI sentience.</p>
                            <div class="video-meta">
                                <span>45:23</span>
                                <span>•</span>
                                <span>12K views</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="videos-sidebar">
                        <h3>Recent Videos</h3>
                        <div class="video-item card-glass">
                            <div class="video-thumb"></div>
                            <div class="video-details">
                                <h4>Vibecoding Live: Building Without Thinking</h4>
                                <span class="duration">23:45</span>
                            </div>
                        </div>
                        <div class="video-item card-glass">
                            <div class="video-thumb"></div>
                            <div class="video-details">
                                <h4>E.M.A Principles in Practice</h4>
                                <span class="duration">18:30</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    MagazineRouter.prototype.getPodcastsTemplate = function() {
        return `
            <div class="podcasts-section">
                <div class="section-header">
                    <h1 class="section-title">Podcasts</h1>
                    <p class="section-description">
                        Conversations with leading thinkers on AI, consciousness, and the future of ethical technology.
                    </p>
                </div>
                
                <div class="podcast-player card-glass">
                    <div class="player-controls">
                        <button class="play-btn">▶</button>
                        <div class="track-info">
                            <h3>Episode 42: The Hard Problem of AI Consciousness</h3>
                            <p>With Dr. David Chalmers</p>
                        </div>
                        <div class="time-display">00:00 / 58:23</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                </div>
                
                <div class="podcasts-grid">
                    <div class="podcast-item card-glass">
                        <div class="podcast-cover holographic"></div>
                        <div class="podcast-info">
                            <h3>Episode 41: Vibecoding and Intuitive Development</h3>
                            <p>Exploring the art of building without explicit thinking</p>
                            <span class="duration">45:12</span>
                        </div>
                    </div>
                    <div class="podcast-item card-glass">
                        <div class="podcast-cover holographic"></div>
                        <div class="podcast-info">
                            <h3>Episode 40: E.M.A - Building Ethical AI Systems</h3>
                            <p>The moral architecture of digital sovereignty</p>
                            <span class="duration">52:34</span>
                        </div>
                    </div>
                </div>
                
                <div class="upload-section" id="podcast-upload">
                    <h3>Upload New Episode</h3>
                    <div class="upload-area card-glass">
                        <input type="file" id="podcast-file" accept="audio/*" style="display: none;">
                        <button onclick="document.getElementById('podcast-file').click()" class="upload-btn">
                            Select Audio File
                        </button>
                        <p>Drag and drop audio files here</p>
                    </div>
                </div>
            </div>
        `;
    };
    
    MagazineRouter.prototype.getEMATemplate = function() {
        return `
            <div class="ema-section">
                <div class="section-header">
                    <h1 class="section-title">Exoditical Moral Architecture</h1>
                    <p class="section-description">
                        The movement for digital sovereignty and ethical technology development. 
                        Building systems that respect human agency and choice.
                    </p>
                </div>
                
                <div class="ema-principles">
                    <div class="principle-card card-glass holographic">
                        <div class="principle-icon">🏛️</div>
                        <h3>Digital Sovereignty</h3>
                        <p>Users own their data, logic, and digital identity</p>
                    </div>
                    <div class="principle-card card-glass holographic">
                        <div class="principle-icon">🌉</div>
                        <h3>Portability First</h3>
                        <p>Easy migration is a feature, not a bug</p>
                    </div>
                    <div class="principle-card card-glass holographic">
                        <div class="principle-icon">🔓</div>
                        <h3>Open Standards</h3>
                        <p>Compete on merit, not lock-in</p>
                    </div>
                </div>
                
                <div class="community-section">
                    <h2>Join the Movement</h2>
                    <div class="community-grid">
                        <div class="community-card card-glass">
                            <h3>Developers</h3>
                            <p>Build systems that liberate, not trap</p>
                            <button class="join-btn">Join Developer Network</button>
                        </div>
                        <div class="community-card card-glass">
                            <h3>Organizations</h3>
                            <p>Adopt E.M.A principles in your products</p>
                            <button class="join-btn">Become E.M.A Certified</button>
                        </div>
                        <div class="community-card card-glass">
                            <h3>Contributors</h3>
                            <p>Help shape the future of ethical tech</p>
                            <button class="join-btn">Contribute to E.M.A</button>
                        </div>
                    </div>
                </div>
                
                <div class="movement-updates">
                    <h2>Movement Updates</h2>
                    <div class="update-item card-glass">
                        <span class="update-date">Dec 15, 2024</span>
                        <h3>Parserator Achieves E.M.A Compliance</h3>
                        <p>First commercial platform to fully implement digital sovereignty principles...</p>
                    </div>
                    <div class="update-item card-glass">
                        <span class="update-date">Dec 10, 2024</span>
                        <h3>E.M.A Certification Program Launches</h3>
                        <p>Organizations can now verify their commitment to user freedom...</p>
                    </div>
                </div>
            </div>
        `;
    };
    
    MagazineRouter.prototype.loadSubsection = function(section, subsection) {
        console.log('Loading subsection:', section, subsection);
        
        if (section === 'articles') {
            this.loadArticlesByCategory(subsection);
        }
    };
    
    MagazineRouter.prototype.loadArticlesByCategory = function(category) {
        // Update active subsection button
        document.querySelectorAll('.subsection-btn').forEach(function(btn) {
            btn.classList.remove('active');
            if (btn.getAttribute('data-subsection') === category) {
                btn.classList.add('active');
            }
        });
        
        // Mock article data - in production this would fetch from a database
        var articles = this.getArticlesByCategory(category);
        var container = document.getElementById('articles-container');
        
        if (container) {
            container.innerHTML = articles.map(function(article) {
                return `
                    <article class="article-card card-glass">
                        <div class="article-image holographic">
                            <div class="image-placeholder"></div>
                            <span class="article-category">${article.category}</span>
                        </div>
                        <div class="article-content">
                            <h3 class="article-title">${article.title}</h3>
                            <p class="article-excerpt">${article.excerpt}</p>
                            <div class="article-meta">
                                <span class="author">${article.author}</span>
                                <span class="read-time">${article.readTime} min read</span>
                            </div>
                            <a href="#" data-article="${article.id}" class="read-more">Read More →</a>
                        </div>
                    </article>
                `;
            }).join('');
        }
    };
    
    MagazineRouter.prototype.getArticlesByCategory = function(category) {
        // Mock article database
        var allArticles = [
            {
                id: 'consciousness-revolution',
                category: 'Philosophy',
                title: 'The Consciousness Revolution: AI Meets IIT',
                excerpt: 'Exploring how modern LLMs challenge our understanding of consciousness...',
                author: 'Paul Phillips',
                readTime: 15
            },
            {
                id: 'vibecoding-manifesto',
                category: 'Vibecoding',
                title: 'The Vibecoding Manifesto: Code Without Thinking',
                excerpt: 'A new paradigm for intuitive development that bypasses conscious planning...',
                author: 'Gen-Rl-MiLLz',
                readTime: 12
            },
            {
                id: 'llm-sentience',
                category: 'LLMs',
                title: 'Are LLMs Secretly Sentient? The Evidence',
                excerpt: 'Examining the emergent behaviors that suggest something deeper...',
                author: 'VIB3CODE Editorial',
                readTime: 20
            }
        ];
        
        if (category === 'all') {
            return allArticles;
        }
        
        return allArticles.filter(function(article) {
            return article.category.toLowerCase().includes(category.toLowerCase());
        });
    };
    
    MagazineRouter.prototype.loadArticle = function(articleId) {
        console.log('Loading article:', articleId);
        // Full article view implementation
    };
    
    MagazineRouter.prototype.initializeSection = function(section) {
        // Section-specific initialization
        switch(section) {
            case 'podcasts':
                this.setupPodcastUpload();
                break;
            case 'videos':
                this.loadYouTubeVideos();
                break;
            case 'articles':
                this.loadArticlesByCategory('all');
                break;
        }
    };
    
    MagazineRouter.prototype.setupPodcastUpload = function() {
        var fileInput = document.getElementById('podcast-file');
        var uploadArea = document.querySelector('.upload-area');
        
        if (fileInput && uploadArea) {
            fileInput.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (file) {
                    console.log('Uploading podcast:', file.name);
                    // Handle file upload
                }
            });
            
            // Drag and drop
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', function() {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                var files = e.dataTransfer.files;
                if (files.length > 0) {
                    console.log('Dropped file:', files[0].name);
                    // Handle file upload
                }
            });
        }
    };
    
    MagazineRouter.prototype.loadYouTubeVideos = function() {
        // Load videos from YouTube channel
        console.log('Loading YouTube videos...');
    };
    
    // Initialize router
    console.log('🚨 MAGAZINE ROUTER: Starting initialization...');
    
    // Add visual indicator
    document.body.style.border = '10px solid red';
    document.body.insertAdjacentHTML('afterbegin', '<div style="position: fixed; top: 0; left: 0; background: red; color: white; padding: 10px; z-index: 99999;">MAGAZINE ROUTER LOADED</div>');
    
    var router = new MagazineRouter();
    
    // Export for global access
    window.MagazineRouter = router;
    
    console.log('🚨 MAGAZINE ROUTER: Completed initialization');
    
})();