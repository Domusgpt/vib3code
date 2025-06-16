const MagazineRouter = {
    contentContainer: null,
    articlesData: [], // Will be assigned allArticles
    navLinks: [],
    currentRoute: { section: null, itemId: null },

    // NEW HELPER METHODS FIRST
    loadArticleContent: function(articleElement, htmlPath) {
        if (!articleElement || !htmlPath) return;
        const targetDivId = `article-body-${articleElement.dataset.contentId}`;
        const targetDiv = articleElement.querySelector(`#${targetDivId}`);

        if (!targetDiv) {
            console.error(`MagazineRouter: Target div #${targetDivId} for article content not found.`);
            return;
        }

        targetDiv.innerHTML = '<p><em>Loading full article...</em></p>';

        fetch(htmlPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status} fetching ${htmlPath}`);
                }
                return response.text();
            })
            .then(html => {
                targetDiv.innerHTML = html;
            })
            .catch(error => {
                console.error(`MagazineRouter: Error loading article content from ${htmlPath}:`, error);
                targetDiv.innerHTML = `<p style="color:red;"><em>Error loading article: ${error.message}. Please try again later.</em></p>`;
            });
    },
    loadInteractiveScript: function(interactiveElement, scriptPath) {
        if (!interactiveElement || !scriptPath) return;

        const existingScript = document.querySelector(`script[src="${scriptPath}"][data-interactive-id="${interactiveElement.dataset.contentId}"]`);
        if (existingScript) {
            return;
        }

        const script = document.createElement('script');
        script.src = scriptPath;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-interactive-id', interactiveElement.dataset.contentId);

        script.onerror = () => {
            console.error(`MagazineRouter: Failed to load script ${scriptPath}.`);
            const targetDiv = interactiveElement.querySelector('.interactive-embed-target');
            if (targetDiv) {
                targetDiv.innerHTML = `<p style="color:red;"><em>Failed to load interactive content script.</em></p>`;
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
            const body = document.body;
            if (body) {
                const newContentContainer = document.createElement('div');
                newContentContainer.className = 'magazine-content';
                const footer = document.querySelector('footer.footer-cyber');
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
        this.navLinks = document.querySelectorAll('nav.nav-cyber .nav-links a');
        this.navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#') && !link.getAttribute('target')) {
                    event.preventDefault();
                    const sectionSlug = href.substring(1);
                    this.navigateToSection(sectionSlug);
                }
            });
        });
    },

    parseRoute: function() {
        const hash = window.location.hash.replace(/^#!\/?/, '');
        const parts = hash.split('/');
        let section = parts[0] || 'home';
        const itemId = parts[1] || null;
        const knownSections = ['home', 'articles', 'videos', 'audios', 'interactives', 'spotlights', 'ema', 'about'];
        let isKnownSection = knownSections.includes(section);
        let isArticleIdRoute = false;

        if (!isKnownSection) {
            const article = this.findArticleById(section);
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
        const { section, itemId, isArticleIdRoute } = this.parseRoute();
        this.currentRoute = { section, itemId, isArticleIdRoute };
        console.log(\`MagazineRouter: Routing to section: \${section}, item ID: \${itemId}, (isArticleIdRoute: \${isArticleIdRoute})\`);
        this.updateNavActiveState(section);

        this.renderContent(section, itemId, isArticleIdRoute);

        let themeKey = section;
        if (isArticleIdRoute) {
            const article = this.findArticleById(section);
            themeKey = article ? (article.theme_modifier_key || article.contentType || 'article') : 'home';
        }
        if (window.ThemeEngine && typeof window.ThemeEngine.applySectionTheme === 'function') {
            window.ThemeEngine.applySectionTheme(themeKey);
        } else if (window.VIB3VisualizerIntegration && typeof window.VIB3VisualizerIntegration.applySectionPreset === 'function') {
            window.VIB3VisualizerIntegration.applySectionPreset(themeKey);
        }
    },

    navigateToSection: function(sectionSlug, itemId = null) {
        let newHash = `#!/${sectionSlug}`;
        if (itemId) {
            newHash += `/${itemId}`;
        }
        if (window.location.hash === newHash) {
            this.handleRouteChange();
        } else {
            window.location.hash = newHash;
        }
    },

    updateNavActiveState: function(currentIdentifier) {
        let activeRouteKey = currentIdentifier;
        const article = this.findArticleById(currentIdentifier);
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
        this.navLinks.forEach(link => {
            const linkSection = link.getAttribute('data-section') || link.getAttribute('href').substring(1);
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
        let itemsToRender = [];

        if (isArticleIdRoute) {
            const item = this.findArticleById(section);
            if (item) {
                itemsToRender.push(item);
            } else {
                console.warn(`MagazineRouter: Item with ID '${section}' not found.`);
            }
        } else if (itemId) {
            const item = this.findArticleById(itemId);
            if (item) {
                itemsToRender.push(item);
            } else {
                console.warn(`MagazineRouter: Item with ID '${itemId}' in section '${section}' not found.`);
            }
        } else {
            let filteredData = [];
            const articlesSource = this.articlesData || [];
            switch (section) {
                case 'home':
                    filteredData = articlesSource.sort((a,b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0).slice(0, 5);
                    break;
                case 'articles':
                    filteredData = articlesSource.filter(item => item.contentType === 'article').sort((a,b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0);
                    break;
                case 'videos':
                    filteredData = articlesSource.filter(item => item.contentType === 'video').sort((a,b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0);
                    break;
                case 'audios':
                    filteredData = articlesSource.filter(item => item.contentType === 'audio').sort((a,b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0);
                    break;
                case 'interactives':
                    filteredData = articlesSource.filter(item => item.contentType === 'interactive').sort((a,b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0);
                    break;
                default:
                    console.warn(`MagazineRouter: Unknown section '${section}' for list view or no specific list view defined.`);
                    break;
            }
            itemsToRender = filteredData;
        }

        if (itemsToRender.length === 0) {
             this.contentContainer.innerHTML = \`<div class="container-cyber" style="padding: 40px 20px; text-align: center;"><h2 class="section-title">No Content Found</h2><p>Sorry, there's no content available for this section or item.</p></div>\`;
             return;
        }

        itemsToRender.forEach(item => {
            let itemHtml = '';
            if (!item || typeof item.id === 'undefined') { console.error("MagazineRouter: Attempting to render invalid item.", item); return; }
            let effectiveContentType = item.contentType;
            if (typeof effectiveContentType === 'undefined') {
                console.warn(`MagazineRouter: Item '\${item.id}' missing contentType, defaulting to 'article'.\`, item);
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
                    console.warn(\`Router: No renderer for contentType '\${effectiveContentType}' (item ID \${item.id}).\`);
                    itemHtml = \`<div class="content-item error-item glass-element" style="padding:20px; margin:10px;"><h2>\${item.title || 'Unknown Title'}</h2><p>Cannot display contentType ('\${effectiveContentType}') yet.</p></div>\`;
                    break;
            }
            if (itemHtml) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = itemHtml;
                const renderedElement = tempDiv.firstChild;
                if (renderedElement) {
                    this.contentContainer.appendChild(renderedElement);
                    // Post-render actions for specific types
                    if (effectiveContentType === "article" && item.html_content_path && renderedElement.dataset.htmlContentPath) {
                        this.loadArticleContent(renderedElement, item.html_content_path);
                    }
                    if (effectiveContentType === "interactive" && item.bootstrap_script_path) {
                        const bootstrapTarget = renderedElement.querySelector('[data-bootstrap-script]');
                        if(bootstrapTarget && bootstrapTarget.dataset.bootstrapScript) {
                           this.loadInteractiveScript(renderedElement, bootstrapTarget.dataset.bootstrapScript);
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
        return this.articlesData.find(article => article.id === id);
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

document.addEventListener('DOMContentLoaded', () => {
    if (typeof MagazineRouter !== 'undefined' && typeof MagazineRouter.init === 'function') {
        if (typeof allArticles !== 'undefined' && Array.isArray(allArticles)) {
            MagazineRouter.init(allArticles);
        } else {
            console.warn("MagazineRouter: 'allArticles' (from fallback) is not defined or not an array. Router will init with empty data.");
            MagazineRouter.init([]);
        }
        setTimeout(() => {
            MagazineRouter.handleRouteChange();
        }, 0);
    } else {
        console.error("MagazineRouter object or its init method is not defined (fallback listener).");
    }
});
