# 3. New Geometries and Visual Effects

**Summary:** Extend the range of visual representations available in the kernel.

**Details (from Refactoring Summary V.3):**
*   Utilize the `GeometryManager` and `ShaderManager` to add new `BaseGeometry` implementations.
*   Develop more full-screen shader effects similar to `FullScreenLatticeGeometry`.

**Core Principles Alignment:**
*   **Lean Kernel:** New geometries/effects should be modular and self-contained, integrating via the existing managers without bloating the core.
*   **Adaptability:** Provides richer visual vocabulary for data representation.
*   **Performance:** New shaders should be optimized for performance.
