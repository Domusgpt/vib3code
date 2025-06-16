var MagazineRouter = { // Converted const
    contentContainer: null,
    articlesData: [], // Will be assigned allArticles
    navLinks: [],
    currentRoute: { section: null, itemId: null },

    // NEW HELPER METHODS FIRST
    loadArticleContent: function(articleElement, htmlPath) {
        if (!articleElement || !htmlPath) return;
        var targetDivId = 'article-body-' + articleElement.dataset.contentId;
        var targetDiv = articleElement.querySelector('#' + targetDivId);

        if (!targetDiv) {
            console.error('MagazineRouter: Target div #' + targetDivId + ' for article content not found.');
            return;
        }

        targetDiv.innerHTML = '<p><em>Loading full article...</em></p>';

        fetch(htmlPath)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('HTTP error ' + response.status + ' fetching ' + htmlPath);
                }
                return response.text();
            })
            .then(function(html) {
                targetDiv.innerHTML = html;
            })
            .catch(function(error) {
                console.error('MagazineRouter: Error loading article content from ' + htmlPath + ':', error);
                targetDiv.innerHTML = '<p style="color:red;"><em>Error loading article: ' + error.message + '. Please try again later.</em></p>';
            });
    },
    loadInteractiveScript: function(interactiveElement, scriptPath) {
        if (!interactiveElement || !scriptPath) return;

        var existingScript = document.querySelector('script[src="' + scriptPath + '"][data-interactive-id="' + interactiveElement.dataset.contentId + '"]');
        if (existingScript) {
            return;
        }

        var script = document.createElement('script');
        script.src = scriptPath;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-interactive-id', interactiveElement.dataset.contentId);

        script.onerror = function() {
            console.error('MagazineRouter: Failed to load script ' + scriptPath + '.');
            var targetDiv = interactiveElement.querySelector('.interactive-embed-target');
            if (targetDiv) {
                targetDiv.innerHTML = '<p style="color:red;"><em>Failed to load interactive content script.</em></p>';
            }
        };
        document.body.appendChild(script);
    },

    // EXISTING METHODS + FULL RENDERCONTENT
    init: function(articles) {
        this.articlesData = articles;
        this.contentContainer = document.querySelector('.magazine-content');

        if (!this.contentContainer) {
            console.error("MagazineRouter: Content container '.magazine-content' not found. Cannot initialize.");
            var body = document.body; // Converted const
            if (body) {
                var newContentContainer = document.createElement('div'); // Converted const
                newContentContainer.className = 'magazine-content';
                var footer = document.querySelector('footer.footer-cyber'); // Converted const
                if (footer) {
                    body.insertBefore(newContentContainer, footer);
                } else {
                    body.appendChild(newContentContainer);
                }
                this.contentContainer = newContentContainer;
                console.warn("MagazineRouter: '.magazine-content' was missing, dynamically created it.");
            } else {
                 console.error("MagazineRouter: Document body not found, critical failure.");
                 return;
            }
        }
        this.setupNavLinks();
        window.addEventListener('hashchange', this.handleRouteChange.bind(this));
        console.log("MagazineRouter initialized with " + (this.articlesData ? this.articlesData.length : 0) + " articles.");
        if (!this.articlesData || this.articlesData.length === 0) {
            console.warn("MagazineRouter: No articles loaded.");
        }
    },

    setupNavLinks: function() {
        var self = this;
        this.navLinks = document.querySelectorAll('nav.nav-cyber .nav-links a');
        this.navLinks.forEach(function(link) {
            link.addEventListener('click', function(event) {
                var href = link.getAttribute('href'); // Converted const
                if (href && href.startsWith('#') && !link.getAttribute('target')) {
                    event.preventDefault();
                    var sectionSlug = href.substring(1); // Converted const
                    self.navigateToSection(sectionSlug);
                }
            });
        });
    },

    parseRoute: function() {
        var hash = window.location.hash.replace(/^#!\/?/, ''); // Converted const
        var parts = hash.split('/'); // Converted const
        var section = parts[0] || 'home'; // Converted let
        var itemId = parts[1] || null; // Converted const
        var knownSections = ['home', 'articles', 'videos', 'audios', 'interactives', 'spotlights', 'ema', 'about']; // Converted const
        var isKnownSection = knownSections.includes(section); // Converted let
        var isArticleIdRoute = false; // Converted let

        if (!isKnownSection) {
            var article = this.findArticleById(section); // Converted const
            if (article) {
                isArticleIdRoute = true;
            }
        }
        if (!isKnownSection && !isArticleIdRoute) {
            console.warn('MagazineRouter: Unknown section or ID \'' + section + '\', defaulting to \'home\'.');
            section = 'home';
        }
        return { section: section, itemId: isArticleIdRoute ? null : itemId, isArticleIdRoute: isArticleIdRoute };
    },

    handleRouteChange: function() {
        var routeInfo = this.parseRoute();
        var section = routeInfo.section;
        var itemId = routeInfo.itemId;
        var isArticleIdRoute = routeInfo.isArticleIdRoute;
        this.currentRoute = { section: section, itemId: itemId, isArticleIdRoute: isArticleIdRoute };
        console.log('MagazineRouter: Routing to section: ' + section + ', item ID: ' + itemId + ', (isArticleIdRoute: ' + isArticleIdRoute + ')');
        this.updateNavActiveState(section);

        this.renderContent(section, itemId, isArticleIdRoute);

        var themeKey = section; // Converted let
        if (isArticleIdRoute) {
            var article = this.findArticleById(section); // Converted const
            themeKey = article ? (article.theme_modifier_key || article.contentType || 'article') : 'home';
        }
        if (window.ThemeEngine && typeof window.ThemeEngine.applySectionTheme === 'function') {
            window.ThemeEngine.applySectionTheme(themeKey);
        } else if (window.VIB3VisualizerIntegration && typeof window.VIB3VisualizerIntegration.applySectionPreset === 'function') {
            window.VIB3VisualizerIntegration.applySectionPreset(themeKey);
        }
    },

    navigateToSection: function(sectionSlug, itemId = null) {
        var newHash = '#!/' + sectionSlug; // Converted let
        if (itemId) {
            newHash += '/' + itemId;
        }
        if (window.location.hash === newHash) {
            this.handleRouteChange();
        } else {
            window.location.hash = newHash;
        }
    },

    updateNavActiveState: function(currentIdentifier) {
        var activeRouteKey = currentIdentifier; // Converted let
        var article = this.findArticleById(currentIdentifier); // Converted const
        if (article && article.contentType) {
            switch(article.contentType) {
                case 'video': activeRouteKey = 'videos'; break;
                case 'audio': activeRouteKey = 'audios'; break;
                case 'interactive': activeRouteKey = 'interactives'; break;
                case 'spotlight': activeRouteKey = 'spotlights'; break;
                case 'article': activeRouteKey = 'articles'; break;
                default: activeRouteKey = 'articles';
            }
        }
        this.navLinks.forEach(function(link) {
            var linkSection = link.getAttribute('data-section') || link.getAttribute('href').substring(1); // Converted const
            if (linkSection === activeRouteKey) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    renderContent: function(section, itemId, isArticleIdRoute) {
        if (!this.contentContainer) {
            console.error("MagazineRouter: No content container to render into.");
            return;
        }
        this.contentContainer.innerHTML = '';
        var itemsToRender = []; // Converted let

        if (isArticleIdRoute) {
            var item = this.findArticleById(section); // Converted const
            if (item) {
                itemsToRender.push(item);
            } else {
                console.warn('MagazineRouter: Item with ID \'' + section + '\' not found.');
            }
        } else if (itemId) {
            var item = this.findArticleById(itemId); // Converted const, had to rename from previous block
            if (item) {
                itemsToRender.push(item);
            } else {
                console.warn('MagazineRouter: Item with ID \'' + itemId + '\' in section \'' + section + '\' not found.');
            }
        } else {
            var filteredData = []; // Converted let
            var articlesSource = this.articlesData || []; // Converted const
            switch (section) {
                case 'home':
                    filteredData = articlesSource.sort(function(a,b) { return (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0; }).slice(0, 5);
                    break;
                case 'articles':
                    filteredData = articlesSource.filter(function(item) { return item.contentType === 'article'; }).sort(function(a,b) { return (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0; });
                    break;
                case 'videos':
                    filteredData = articlesSource.filter(function(item) { return item.contentType === 'video'; }).sort(function(a,b) { return (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0; });
                    break;
                case 'audios':
                    filteredData = articlesSource.filter(function(item) { return item.contentType === 'audio'; }).sort(function(a,b) { return (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0; });
                    break;
                case 'interactives':
                    filteredData = articlesSource.filter(function(item) { return item.contentType === 'interactive'; }).sort(function(a,b) { return (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0; });
                    break;
                default:
                    console.warn('MagazineRouter: Unknown section \'' + section + '\' for list view or no specific list view defined.');
                    break;
            }
            itemsToRender = filteredData;
        }

        if (itemsToRender.length === 0) {
             this.contentContainer.innerHTML = '<div class="container-cyber" style="padding: 40px 20px; text-align: center;"><h2 class="section-title">No Content Found</h2><p>Sorry, there is no content available for this section or item.</p></div>';
             return;
        }

        var self = this;
        itemsToRender.forEach(function(item) {
            var itemHtml = ''; // Converted let
            if (!item || typeof item.id === 'undefined') { console.error("MagazineRouter: Attempting to render invalid item.", item); return; }
            var effectiveContentType = item.contentType; // Converted let
            if (typeof effectiveContentType === 'undefined') {
                console.warn('MagazineRouter: Item \'' + item.id + '\' missing contentType, defaulting to \'article\'.', item);
                effectiveContentType = 'article';
            }
            switch (effectiveContentType) {
                case 'article':
                    if (typeof renderArticlePost === 'function') { itemHtml = renderArticlePost(item); }
                    else { console.error('renderArticlePost not defined.'); itemHtml = '<p>Error: Article renderer missing.</p>'; }
                    break;
                case 'video':
                    if (typeof renderVideoPost === 'function') { itemHtml = renderVideoPost(item); }
                    else { console.error('renderVideoPost not defined.'); itemHtml = '<p>Error: Video renderer missing.</p>'; }
                    break;
                case 'audio':
                    if (typeof renderAudioPost === 'function') { itemHtml = renderAudioPost(item); }
                    else { console.error('renderAudioPost not defined.'); itemHtml = '<p>Error: Audio renderer missing.</p>'; }
                    break;
                case 'interactive':
                    if (typeof renderInteractivePost === 'function') { itemHtml = renderInteractivePost(item); }
                    else { console.error('renderInteractivePost not defined.'); itemHtml = '<p>Error: Interactive renderer missing.</p>'; }
                    break;
                default:
                    console.warn('Router: No renderer for contentType \'' + effectiveContentType + '\' (item ID ' + item.id + ').');
                    itemHtml = '<div class="content-item error-item glass-element" style="padding:20px; margin:10px;"><h2>' + (item.title || 'Unknown Title') + '</h2><p>Cannot display contentType (\'' + effectiveContentType + '\') yet.</p></div>';
                    break;
            }
            if (itemHtml) {
                var tempDiv = document.createElement('div'); // Converted const
                tempDiv.innerHTML = itemHtml;
                var renderedElement = tempDiv.firstChild; // Converted const
                if (renderedElement) {
                    self.contentContainer.appendChild(renderedElement);
                    if (effectiveContentType === "article" && item.html_content_path && renderedElement.dataset.htmlContentPath) {
                        self.loadArticleContent(renderedElement, item.html_content_path);
                    }
                    if (effectiveContentType === "interactive" && item.bootstrap_script_path) {
                        var bootstrapTarget = renderedElement.querySelector('[data-bootstrap-script]'); // Converted const
                        if(bootstrapTarget && bootstrapTarget.dataset.bootstrapScript) {
                           self.loadInteractiveScript(renderedElement, bootstrapTarget.dataset.bootstrapScript);
                        }
                    }
                } else {
                    console.error("MagazineRouter: Generated item HTML was empty for item:", item);
                }
            }
        });
    },

    findArticleById: function(id) {
        if (!this.articlesData || this.articlesData.length === 0) return null;
        return this.articlesData.find(function(article) { return article.id === id; });
    }
};

var allArticles = [
    {
        "title": "My New Test Article",
        "author": "Jules AI Editor",
        "date": "2025-06-15",
        "id": "new-test-article",
        "contentType": "article",
        "html_content_path": "/assets/articles/new-test-article/content.html",
        "tags": ["intended mood", "pipeline", "visual", "guidelines for new s & s", "asset", "test", "new"],
        "description": "A new test article to demonstrate full pipeline capabilities.",
        "header_image_path": "/assets/images/new_test_article/new_header.png",
        "linked_document_pdf": "/assets/documents/new_test_article/new_document.pdf",
        "visual_mood": "calm minimalist blue_focus",
        "theme_modifier_key": "article_new_test_article_custom",
        "ai_suggestions": {
            "suggested_excerpt": "my new test article this is a new article created to test the full content pipeline, including asset creation and visual mood processing.",
            "suggested_categories": ["guidelines for new s & s", "intended mood"],
            "suggested_tags": ["intended mood", "pipeline", "visual", "guidelines for new s & s", "asset", "test", "new"]
        },
        "excerpt": "my new test article this is a new article created to test the full content pipeline, including asset creation and visual mood processing.",
        "category": "guidelines for new s & s"
    },
    {
        "id": "video1",
        "contentType": "video",
        "title": "My First Video",
        "video_url": "https://example.com/video.mp4",
        "transcript_path": "/assets/videos/video1/transcript.txt",
        "excerpt": "A cool video."
    },
    {
        "id": "my_cool_podcast_ep1",
        "contentType": "audio",
        "title": "My Cool Podcast - Episode 1",
        "author": "Podcast Host",
        "date": "2023-11-20",
        "audio_url": "https://example.com/podcast_ep1.mp3",
        "duration": "00:30:45",
        "excerpt": "Talking about cool audio things.",
        "episode_artwork_path": "/assets/audio/my_cool_podcast_ep1/podcast_ep1_art.jpg",
        "shownotes_path": "/assets/audio/my_cool_podcast_ep1/ep1_notes.txt",
        "series_title": "My Cool Podcast",
        "tags": ["podcast", "audio", "episode1"]
    },
    {
        "id": "my_game_01",
        "contentType": "interactive",
        "title": "My Awesome Interactive Game",
        "author": "Game Developer",
        "date": "2023-11-25",
        "live_url": "https://example.com/mygame/index.html",
        "bootstrap_script_path": "/assets/interactive/my_game_01/load_my_game.js",
        "embed_target_div_id": "game-container-div",
        "excerpt": "A fun block-stacking game.",
        "thumbnail_image_path": "/assets/interactive/my_game_01/game_thumb.png",
        "instructions_path": "/assets/interactive/my_game_01/game_instructions.txt",
        "required_assets_paths": [
            "/assets/interactive/my_game_01/required/game_styles.css",
            {"path": "/assets/interactive/my_game_01/required/levels.json", "type": "json"},
            "https://cdn.example.com/somelib.js"
        ],
        "tags": ["game", "interactive", "fun"]
    }
];

document.addEventListener('DOMContentLoaded', function() {
    if (typeof MagazineRouter !== 'undefined' && typeof MagazineRouter.init === 'function') {
        if (typeof allArticles !== 'undefined' && Array.isArray(allArticles)) {
            MagazineRouter.init(allArticles);
        } else {
            console.warn("MagazineRouter: 'allArticles' (from fallback) is not defined or not an array. Router will init with empty data.");
            MagazineRouter.init([]);
        }
        setTimeout(function() {
            MagazineRouter.handleRouteChange();
        }, 0);
    } else {
        console.error("MagazineRouter object or its init method is not defined (fallback listener).");
    }
});
