# 5. Headless Operation & Programmatic Output

**Summary:** Fully enable and optimize the kernel for running without a visible canvas and for outputting rendered frames programmatically.

**Details (from Refactoring Summary V.5):**
*   Fully implement offscreen rendering using WebGL2 Framebuffer Objects (FBOs) as conceptualized in `HypercubeCore.js`.
*   Implement methods in `VisualizerController` like `getSnapshot()` to retrieve rendered frames as image data (e.g., PNG data URL, ArrayBuffer of pixels). This is crucial for machine vision input.
*   Add support for rendering image sequences or video.

**Core Principles Alignment:**
*   **Machine Vision Focus:** Directly addresses the need for high-fidelity, rapid frame generation for machine input.
*   **Low Latency:** Implementation should prioritize efficient frame extraction.
*   **Lean Kernel:** FBO management should be efficient within `HypercubeCore.js`.
*   **Target Use Cases:** Essential for micro-robotics and remote/cloud-hybrid scenarios.
