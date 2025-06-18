# 7. Rendering Engine Research Spike

**Objective:**
To perform a time-boxed research spike to evaluate the suitability of WebGPU and potentially one other rendering technology against the current WebGL2 implementation for the Visualization Kernel. The primary goal is to determine the best path forward for achieving high-performance, low-latency, high-fidelity rendering suitable for machine vision input and demanding use cases, while adhering to the "lean and mean microkernel" principle.

**Background & Motivation:**
The Visualization Kernel aims to serve demanding applications, including machine vision input (requiring rapid frame extraction) and potentially micro-robotics or cloud-hybrid scenarios. While WebGL2 is functional, it's important to assess if WebGPU or other technologies offer significant advantages in performance, latency, and future-proofing that would justify a migration effort, either now or in the near future.

**Candidate Technologies for Initial Evaluation:**
1.  **WebGPU:** Modern graphics API successor to WebGL, designed for better performance and access to compute shaders.
2.  **Consideration for one lightweight native option (if applicable for core logic, even if web deployment needs wrappers):** e.g., a focused look at a library like Google's Filament, or direct use of Vulkan/Metal via a wrapper like MoltenVK for portability if extreme performance is needed and browser is just one target. (This is optional and depends on how strictly browser-bound the *core rendering logic itself* must be vs. where the *output* is consumed). For the purpose of this initial spike, focusing primarily on WebGPU vs. WebGL2 is likely sufficient.

**Key Evaluation Metrics:**
1.  **Raw Rendering Performance:** Frame rates achievable for a representative scene (e.g., N-D polytope with moderate complexity).
2.  **Frame Extraction Efficiency & Latency:** Speed and overhead of reading back rendered frames for machine consumption.
3.  **Development Effort & Learning Curve:** Estimated time and complexity to achieve a basic working prototype. Availability of resources, documentation, and community support.
4.  **"Leanness" & Integration Overhead:** How easily can the engine be integrated? What is the deployment size impact? How well does it support a modular, microkernel architecture?
5.  **Maturity & Stability:** Current state of browser/platform support and API stability.
6.  **Compute Shader Capabilities:** Relevance for future Dimensia-like features.

**Tasks for the Research Spike:**
1.  **Environment Setup (for each candidate explored, primarily WebGPU):**
    *   Set up a minimal development environment.
    *   Ensure necessary tools, libraries, and browser flags (if needed for WebGPU) are configured.
2.  **Minimal N-D Polytope Renderer Prototype:**
    *   Implement a very basic renderer for a 3D or 4D polytope (e.g., a cube or hypercube).
    *   Focus on core rendering logic, basic transformations, and a simple shader.
3.  **Frame Extraction Test:**
    *   Implement a mechanism to render to an offscreen buffer (if applicable).
    *   Measure the time taken to read back pixel data.
4.  **Performance Benchmarking (Simple):**
    *   Run the prototype and measure frame rates.
    *   Compare against a similar simple scene in the current WebGL2 kernel.
5.  **Code & API Assessment:**
    *   Briefly evaluate the API ergonomics and how the existing kernel's structure (ShaderManager, GeometryManager, parameterization) might map to the candidate technology.
6.  **Documentation of Findings:**
    *   Summarize results for each metric.
    *   List pros and cons for each candidate technology in the context of this project's specific goals.

**Time-Box for Spike:**
*   Proposed: **1-2 weeks** (focused effort).

**Deliverable:**
*   A concise report (this README can be updated with the findings) containing:
        *   Summary of experiments performed.
        *   Comparative analysis based on the evaluation metrics.
        *   A clear recommendation:
            *   Continue with WebGL2 for the medium term, focusing on other enhancements.
            *   Prioritize migration to WebGPU (or another candidate) immediately.
            *   A hybrid approach or phased migration strategy.
        *   Justification for the recommendation.

**Core Principles Alignment for this Research:**
*   This research directly addresses the strategic need for **high performance, low latency, and future viability** for demanding machine vision and constrained environment use cases.
*   It respects the **"lean kernel"** principle by evaluating technologies on their ability to support this.
