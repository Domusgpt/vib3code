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
    const s = (str) => String(str || '').replace(/[&<>"']/g, (match) => {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
    });

    let playerHtml = '';
    if (video.embed_code) {
        // If embed_code is provided, assume it's safe and use it directly.
        // More security considerations would be needed in a real-world app if embed_code is user-supplied.
        playerHtml = video.embed_code;
    } else if (video.video_url) {
        playerHtml = `
            <video controls width="100%" preload="metadata">
                <source src="${s(video.video_url)}" type="video/mp4">
                Your browser does not support the video tag. Click <a href="${s(video.video_url)}" target="_blank">here</a> to watch.
            </video>
        `;
    } else {
        playerHtml = '<p>No video source available.</p>';
    }

    return `
<article class="content-item video-post" id="video-${s(video.id)}" data-content-id="${s(video.id)}" data-content-type="video">
    <header class="video-header content-header">
        <h1>${s(video.title)}</h1>
        <p class="video-meta content-meta">
            ${video.author ? `<span>By: ${s(video.author)}</span>` : ''}
            ${video.author && video.date ? ' | ' : ''}
            ${video.date ? `<span>Date: ${s(video.date)}</span>` : ''}
        </p>
        ${video.category ? `<p class="category-meta">Category: ${s(video.category)}</p>` : ''}
        ${video.tags && video.tags.length ? `<p class="tags-meta">Tags: ${video.tags.map(tag => s(tag)).join(', ')}</p>` : ''}
    </header>
    <section class="video-player-section">
        ${playerHtml}
    </section>
    ${video.excerpt ? `
    <section class="video-description content-body">
        <p class="excerpt">${s(video.excerpt)}</p>
    </section>
    ` : ''}
    ${video.transcript_path ? `
    <section class="video-transcript content-supplementary">
        <h3>Transcript</h3>
        <div id="transcript-content-${s(video.id)}" data-transcript-path="${s(video.transcript_path)}">
            <button class="load-transcript-button" onclick="loadTranscript('${s(video.id)}', '${s(video.transcript_path)}')">Load Transcript</button>
            <div class="transcript-text" style="display:none;"></div>
        </div>
    </section>
    ` : ''}
    <footer class="video-footer content-footer">
        <!-- Placeholder for any footer content -->
    </footer>
</article>
`;
}

// Basic function to load transcript - this is a helper and might be expanded or moved
// For now, it's a simple fetch and display
// This function would ideally be part of a larger site script, not necessarily with the template.
// But including a basic version here for the template to be somewhat functional if tested in isolation.
function loadTranscript(videoId, transcriptPath) {
    const transcriptContainer = document.querySelector(\`#transcript-content-\${videoId} .transcript-text\`);
    const button = document.querySelector(\`#transcript-content-\${videoId} .load-transcript-button\`);
    if (!transcriptContainer || !button) return;

    button.textContent = 'Loading...';
    button.disabled = true;

    fetch(transcriptPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            return response.text();
        })
        .then(text => {
            transcriptContainer.innerHTML = text.replace(/\n/g, '<br>'); // Simple formatting
            transcriptContainer.style.display = 'block';
            button.style.display = 'none'; // Hide button after loading
        })
        .catch(error => {
            transcriptContainer.innerHTML = \`<p>Error loading transcript: \${error.message}</p>\`;
            transcriptContainer.style.display = 'block';
            button.textContent = 'Retry'; // Allow retry
            button.disabled = false;
        });
}
