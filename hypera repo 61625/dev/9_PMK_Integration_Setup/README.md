# 9. PMK Integration Setup & Testing

**Summary:** Focus on the practical integration of the visualization kernel with the Parserator Micro-Kernel (PMK) or a similar agentic system.

**Details (from Refactoring Summary VI):**
*   **PMK as Data Source:** Define and test the flow where PMK outputs `dataSnapshot` objects to `VisualizerController.updateData()`.
*   **Dynamic Visual Representation Testing:**
        *   Implement and test schema-driven visualization: PMK calls `setDataMappingRules()` based on its current focus schema.
        *   Verify real-time state display from continuous `dataSnapshot` updates.
        *   Test error/anomaly highlighting by mapping specific PMK states to salient visual parameters.
    *   **Develop Control Flow Examples/Prototypes:** Implement the example control flow described in the refactoring summary (PMK initializes controller, processes event, sets style, updates data).

**Core Principles Alignment:**
*   **Agentic Focus:** This is the primary integration goal.
*   **Adaptability:** Demonstrates the kernel's ability to respond to dynamic agent commands and data.
*   **Testability:** Provides a real-world test case for the system.
