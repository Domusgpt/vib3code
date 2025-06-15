Manual Testing Instructions for Magazine Router:

1.  Serve this 'router_test_package' directory using a simple local HTTP server.
    For example, if you have Python 3:
    \`python -m http.server 8000\` (or any available port)
    Or using Node.js `npx serve .`

2.  Open your web browser and navigate to \`http://localhost:8000/index.html\`.

3.  Test Navigation and Rendering:
    *   **Home:** The page should initially load the "home" view. This should display a mix of articles and videos (specifically "My New Test Article" and "My First Video" from the test data).
    *   **Articles Section:** Click the "Articles" navigation link (or manually go to \`http://localhost:8000/index.html#!/articles\`).
        *   Verify: Only "My New Test Article" is displayed.
        *   Verify: The full article body ("Full article body content for New Test Article...") is dynamically loaded and displayed within the article's content area.
    *   **Videos Section:** Click the "Videos" navigation link (or manually go to \`http://localhost:8000/index.html#!/videos\`).
        *   Verify: Only "My First Video" is displayed.
        *   Verify: The video player (or embed code placeholder) is visible.
        *   Verify: Click the "Load Transcript" button. The transcript ("This is the transcript for My First Video...") should appear.
    *   **Direct Link to Article:** Navigate directly to \`http://localhost:8000/index.html#!/new-test-article\`.
        *   Verify: "My New Test Article" is displayed directly, with its full content loaded.
    *   **Direct Link to Video:** Navigate directly to \`http://localhost:8000/index.html#!/video1\`.
        *   Verify: "My First Video" is displayed directly. Transcript loading should work.

4.  Check the browser's JavaScript console for any errors reported by the router or template functions.

Expected Data in `allArticles` (within `router_test_package/js/magazine-router.js`):
- An article with `id: "new-test-article"`, `contentType: "article"`, `html_content_path: "/assets/articles/new-test-article/content.html"`
- A video with `id: "video1"`, `contentType: "video"`, `transcript_path: "/assets/videos/video1/transcript.txt"`
- An audio post with `id: "my_cool_podcast_ep1"`, `contentType: "audio"`
- An interactive post with `id: "my_game_01"`, `contentType: "interactive"`

(Audio and Interactive posts won't be fully rendered yet by this test setup, but their data should be in allArticles and not cause errors when the router iterates).
