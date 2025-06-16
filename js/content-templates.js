/**
 * Renders the HTML structure for a video post.
 * @param {object} video - The video data object. Expected properties:
 *   id, title, author, date, embed_code (optional), video_url, excerpt (optional), transcript_path (optional)
 * @returns {string} HTML string for the video post.
 */
function renderVideoPost(video) {
    if (!video || !video.id || !video.title) {
        console.error('Invalid video object provided to renderVideoPost', video);
        return '<article class="content-item video-post error"><p>Error: Video data is incomplete.</p></article>';
    }

    // Sanitize inputs minimally (more robust sanitation should happen before this point or via a library)
    var s = function(str) {
        return String(str || '').replace(/[&<>"']/g, function(match) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
        });
    };

    var playerHtml = '';
    if (video.embed_code) {
        // If embed_code is provided, assume it's safe and use it directly.
        // More security considerations would be needed in a real-world app if embed_code is user-supplied.
        playerHtml = video.embed_code;
    } else if (video.video_url) {
        playerHtml = 
            '<video controls width="100%" preload="metadata">' +
                '<source src="' + s(video.video_url) + '" type="video/mp4">' +
                'Your browser does not support the video tag. Click <a href="' + s(video.video_url) + '" target="_blank">here</a> to watch.' +
            '</video>';
    } else {
        playerHtml = '<p>No video source available.</p>';
    }

    return (
'<article class="content-item video-post" id="video-' + s(video.id) + '" data-content-id="' + s(video.id) + '" data-content-type="video">' +
    '<header class="video-header content-header">' +
        '<h1>' + s(video.title) + '</h1>' +
        '<p class="video-meta content-meta">' +
            (video.author ? '<span>By: ' + s(video.author) + '</span>' : '') +
            (video.author && video.date ? ' | ' : '') +
            (video.date ? '<span>Date: ' + s(video.date) + '</span>' : '') +
        '</p>' +
        (video.category ? '<p class="category-meta">Category: ' + s(video.category) + '</p>' : '') +
        (video.tags && video.tags.length ? '<p class="tags-meta">Tags: ' + video.tags.map(function(tag) { return s(tag); }).join(', ') + '</p>' : '') +
    '</header>' +
    '<section class="video-player-section">' +
        playerHtml +
    '</section>' +
    (video.excerpt ? 
    '<section class="video-description content-body">' +
        '<p class="excerpt">' + s(video.excerpt) + '</p>' +
    '</section>'
    : '') +
    (video.transcript_path ?
    '<section class="video-transcript content-supplementary">' +
        '<h3>Transcript</h3>' +
        '<div id="transcript-content-' + s(video.id) + '" data-transcript-path="' + s(video.transcript_path) + '">' +
            '<button class="load-transcript-button" onclick="loadTranscript(\'' + s(video.id) + '\', \'' + s(video.transcript_path) + '\')">Load Transcript</button>' +
            '<div class="transcript-text" style="display:none;"></div>' +
        '</div>' +
    '</section>'
    : '') +
    '<footer class="video-footer content-footer">' +
        '<!-- Placeholder for any footer content -->' +
    '</footer>' +
'</article>'
);
}

// Basic function to load transcript - this is a helper and might be expanded or moved
// For now, it's a simple fetch and display
// This function would ideally be part of a larger site script, not necessarily with the template.
// But including a basic version here for the template to be somewhat functional if tested in isolation.
function loadTranscript(videoId, transcriptPath) {
    var transcriptContainer = document.querySelector('#transcript-content-' + videoId + ' .transcript-text');
    var button = document.querySelector('#transcript-content-' + videoId + ' .load-transcript-button');
    if (!transcriptContainer || !button) return;

    button.textContent = 'Loading...';
    button.disabled = true;

    fetch(transcriptPath)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.text();
        })
        .then(function(text) {
            transcriptContainer.innerHTML = text.replace(/\n/g, '<br>'); // Simple formatting
            transcriptContainer.style.display = 'block';
            button.style.display = 'none'; // Hide button after loading
        })
        .catch(function(error) {
            transcriptContainer.innerHTML = '<p>Error loading transcript: ' + error.message + '</p>';
            transcriptContainer.style.display = 'block';
            button.textContent = 'Retry'; // Allow retry
            button.disabled = false;
        });
}

/**
 * Renders the HTML structure for an audio post.
 * @param {object} audio - The audio data object. Expected properties:
 *   id, title, author, date, audio_url, excerpt (optional), shownotes_path (optional),
 *   series_title (optional), category (optional), tags (optional)
 * @returns {string} HTML string for the audio post.
 */
function renderAudioPost(audio) {
    if (!audio || !audio.id || !audio.title) {
        console.error('Invalid audio object provided to renderAudioPost', audio);
        return '<article class="content-item audio-post error"><p>Error: Audio data is incomplete.</p></article>';
    }

    // Sanitize inputs minimally
    var s = function(str) {
        return String(str || '').replace(/[&<>"']/g, function(match) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
        });
    };

    var playerHtml = '';
    if (audio.audio_url) {
        playerHtml = 
            '<audio controls preload="metadata" style="width: 100%;">' +
                '<source src="' + s(audio.audio_url) + '" type="audio/mpeg">' +
                'Your browser does not support the audio element. Click <a href="' + s(audio.audio_url) + '" target="_blank">here</a> to listen.' +
            '</audio>';
    } else {
        playerHtml = '<p>No audio source available.</p>';
    }

    return (
'<article class="content-item audio-post" id="audio-' + s(audio.id) + '" data-content-id="' + s(audio.id) + '" data-content-type="audio">' +
    '<header class="audio-header content-header">' +
        '<h1>' + s(audio.title) + '</h1>' +
        '<p class="audio-meta content-meta">' +
            (audio.author ? '<span>By: ' + s(audio.author) + '</span>' : '') +
            (audio.author && audio.date ? ' | ' : '') +
            (audio.date ? '<span>Date: ' + s(audio.date) + '</span>' : '') +
        '</p>' +
        (audio.series_title ? '<p class="series-meta">Series: ' + s(audio.series_title) + '</p>' : '') +
        (audio.category ? '<p class="category-meta">Category: ' + s(audio.category) + '</p>' : '') +
        (audio.tags && audio.tags.length ? '<p class="tags-meta">Tags: ' + audio.tags.map(function(tag) { return s(tag); }).join(', ') + '</p>' : '') +
    '</header>' +
    '<section class="audio-player-section">' +
        playerHtml +
    '</section>' +
    (audio.excerpt ?
    '<section class="audio-description content-body">' +
        '<p class="excerpt">' + s(audio.excerpt) + '</p>' +
    '</section>'
    : '') +
    (audio.shownotes_path ?
    '<section class="audio-shownotes content-supplementary">' +
        '<h3>Show Notes</h3>' +
        '<div id="shownotes-content-' + s(audio.id) + '" data-shownotes-path="' + s(audio.shownotes_path) + '">' +
            '<button class="load-shownotes-button" onclick="loadShowNotes(\'' + s(audio.id) + '\', \'' + s(audio.shownotes_path) + '\')">Load Show Notes</button>' +
            '<div class="shownotes-text" style="display:none;"></div>' +
        '</div>' +
    '</section>'
    : '') +
    '<footer class="audio-footer content-footer">' +
        '<!-- Placeholder for any footer content -->' +
    '</footer>' +
'</article>'
);
}

/**
 * Loads show notes for an audio post.
 * @param {string} audioId - The ID of the audio post.
 * @param {string} shownotesPath - The path to the show notes file.
 */
function loadShowNotes(audioId, shownotesPath) {
    var notesContainer = document.querySelector('#shownotes-content-' + audioId + ' .shownotes-text'); // Converted
    var button = document.querySelector('#shownotes-content-' + audioId + ' .load-shownotes-button'); // Converted
    if (!notesContainer || !button) {
        console.error('Could not find elements for show notes for audio ID:', audioId);
        return;
    }

    button.textContent = 'Loading...';
    button.disabled = true;

    fetch(shownotesPath)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status + ' for ' + shownotesPath);
            }
            return response.text();
        })
        .then(function(text) {
            notesContainer.innerHTML = text.replace(/\n/g, '<br>');
            notesContainer.style.display = 'block';
            button.style.display = 'none';
        })
        .catch(function(error) {
            notesContainer.innerHTML = '<p>Error loading show notes: ' + error.message + '</p>';
            notesContainer.style.display = 'block';
            button.textContent = 'Retry';
            button.disabled = false;
        });
}


/**
 * Renders the HTML structure for an interactive post.
 * @param {object} interactive - The interactive data object. Expected properties:
 *   id, title, author, date, excerpt (optional), live_url (optional),
 *   embed_target_div_id (optional, for script-based embeds),
 *   bootstrap_script_path (optional, for script-based embeds),
 *   instructions_path (optional), category (optional), tags (optional)
 * @returns {string} HTML string for the interactive post.
 */
function renderInteractivePost(interactive) {
    if (!interactive || !interactive.id || !interactive.title) {
        console.error('Invalid interactive object provided to renderInteractivePost', interactive);
        return '<article class="content-item interactive-post error"><p>Error: Interactive data is incomplete.</p></article>';
    }

    var s = function(str) {
        return String(str || '').replace(/[&<>"']/g, function(match) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
        });
    };

    var interactiveContentHtml = ''; // Converted
    var targetDivId = s(interactive.embed_target_div_id || 'interactive-embed-' + s(interactive.id)); // Converted

    if (interactive.bootstrap_script_path) {
        interactiveContentHtml =
            '<div id="' + targetDivId + '" class="interactive-embed-target" data-bootstrap-script="' + s(interactive.bootstrap_script_path) + '">' +
                '<p>Loading interactive content...</p>' +
                '<!-- The script at ' + s(interactive.bootstrap_script_path) + ' should target this div. -->' +
            '</div>';
    } else if (interactive.live_url) {
        interactiveContentHtml =
            '<iframe src="' + s(interactive.live_url) + '"' +
                    ' width="100%"' +
                    ' height="600px"' +
                    ' frameborder="0"' +
                    ' allowfullscreen' +
                    ' title="' + s(interactive.title) + ' - Live Interactive Content">' +
                '<p>Your browser does not support iframes. <a href="' + s(interactive.live_url) + '" target="_blank">Click here to view the content.</a></p>' +
            '</iframe>';
    } else {
        interactiveContentHtml = '<p>No interactive content source available.</p>';
    }

    return (
'<article class="content-item interactive-post" id="interactive-' + s(interactive.id) + '" data-content-id="' + s(interactive.id) + '" data-content-type="interactive">' +
    '<header class="interactive-header content-header">' +
        '<h1>' + s(interactive.title) + '</h1>' +
        '<p class="interactive-meta content-meta">' +
            (interactive.author ? '<span>By: ' + s(interactive.author) + '</span>' : '') +
            (interactive.author && interactive.date ? ' | ' : '') +
            (interactive.date ? '<span>Date: ' + s(interactive.date) + '</span>' : '') +
        '</p>' +
        (interactive.category ? '<p class="category-meta">Category: ' + s(interactive.category) + '</p>' : '') +
        (interactive.tags && interactive.tags.length ? '<p class="tags-meta">Tags: ' + interactive.tags.map(function(tag) { return s(tag); }).join(', ') + '</p>' : '') +
    '</header>' +
    '<section class="interactive-content-area">' +
        interactiveContentHtml +
    '</section>' +
    (interactive.excerpt ?
    '<section class="interactive-description content-body">' +
        '<p class="excerpt">' + s(interactive.excerpt) + '</p>' +
    '</section>'
    : '') +
    (interactive.instructions_path ?
    '<section class="interactive-instructions content-supplementary">' +
        '<h3>Instructions / About</h3>' +
        '<div id="instructions-content-' + s(interactive.id) + '" data-instructions-path="' + s(interactive.instructions_path) + '">' +
            '<button class="load-instructions-button" onclick="loadInteractiveInstructions(\'' + s(interactive.id) + '\', \'' + s(interactive.instructions_path) + '\')">Load Instructions</button>' +
            '<div class="instructions-text" style="display:none;"></div>' +
        '</div>' +
    '</section>'
    : '') +
    '<footer class="interactive-footer content-footer">' +
        '<!-- Placeholder for any footer content -->' +
    '</footer>' +
'</article>'
);
}

/**
 * Loads instructions for an interactive post.
 * @param {string} interactiveId - The ID of the interactive post.
 * @param {string} instructionsPath - The path to the instructions file.
 */
function loadInteractiveInstructions(interactiveId, instructionsPath) {
    var instructionsContainer = document.querySelector('#instructions-content-' + interactiveId + ' .instructions-text'); // Converted
    var button = document.querySelector('#instructions-content-' + interactiveId + ' .load-instructions-button'); // Converted
    if (!instructionsContainer || !button) {
        console.error('Could not find elements for instructions for interactive ID:', interactiveId);
        return;
    }

    button.textContent = 'Loading...';
    button.disabled = true;

    fetch(instructionsPath)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status + ' for ' + instructionsPath);
            }
            return response.text();
        })
        .then(function(text) {
            instructionsContainer.innerHTML = text.replace(/\n/g, '<br>');
            instructionsContainer.style.display = 'block';
            button.style.display = 'none';
        })
        .catch(function(error) {
            instructionsContainer.innerHTML = '<p>Error loading instructions: ' + error.message + '</p>';
            instructionsContainer.style.display = 'block';
            button.textContent = 'Retry';
            button.disabled = false;
        });
}



/**
 * Renders the HTML structure for a standard article post.
 * @param {object} article - The article data object. Expected properties:
 *   id, title, author, date, excerpt (optional), category (optional), tags (optional),
 *   header_image_path (optional), html_content_path (required, path to pre-rendered HTML body)
 * @returns {string} HTML string for the article post.
 */
function renderArticlePost(article) {
    if (!article || !article.id || !article.title) {
        console.error('Invalid article object provided to renderArticlePost', article);
        return '<article class="content-item article-post error"><p>Error: Article data is incomplete.</p></article>';
    }
    if (!article.html_content_path) {
        console.warn('Article object missing html_content_path in renderArticlePost', article);
    }

    var s = function(str) {
        return String(str || '').replace(/[&<>"']/g, function(match) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
        });
    };

    var headerImageHtml = ''; // Converted
    if (article.header_image_path) {
        var imagePath = article.header_image_path;
        // Use base path resolver if available in MagazineRouter
        if (window.MagazineRouter && typeof window.MagazineRouter.resolveAssetPath === 'function') {
            imagePath = window.MagazineRouter.resolveAssetPath(article.header_image_path);
        }
        headerImageHtml = '<img src="' + s(imagePath) + '" alt="' + s(article.title) + ' header image" class="article-header-image">';
    }

    return (
'<article class="content-item article-post" id="article-' + s(article.id) + '" data-content-id="' + s(article.id) + '" data-content-type="article" data-html-content-path="' + s(article.html_content_path || '') + '">' +
    '<header class="article-header content-header">' +
        headerImageHtml +
        '<h1>' + s(article.title) + '</h1>' +
        '<p class="article-meta content-meta">' +
            (article.author ? '<span>By: ' + s(article.author) + '</span>' : '') +
            (article.author && article.date ? ' | ' : '') +
            (article.date ? '<span>Date: ' + s(article.date) + '</span>' : '') +
        '</p>' +
        (article.category ? '<p class="category-meta">Category: ' + s(article.category) + '</p>' : '') +
        (article.tags && article.tags.length ? '<p class="tags-meta">Tags: ' + article.tags.map(function(tag) { return s(tag); }).join(', ') + '</p>' : '') +
    '</header>' +
    (article.excerpt ?
    '<section class="article-excerpt content-body">' +
        '<p class="excerpt">' + s(article.excerpt) + '</p>' +
    '</section>'
    : '') +
    '<section class="article-body-content" id="article-body-' + s(article.id) + '">' +
        '<!-- Main article HTML content will be loaded here by the router from ' + s(article.html_content_path || 'unknown path') + ' -->' +
        (!article.html_content_path ? '<p><em>Article content could not be loaded (path missing).</em></p>' : '<p><em>Loading article content...</em></p>') +
    '</section>' +
    '<footer class="article-footer content-footer">' +
        '<!-- Placeholder for related articles, comments, etc. -->' +
    '</footer>' +
'</article>'
);
}
