# ARCHIVED VISUALIZER FILES

**WARNING: DO NOT USE THESE FILES**

These visualizer files have been archived to prevent conflicts and confusion. They were creating multiple canvas elements and interfering with the Phase 2b VisualizerManager system.

## Current Active System (DO USE):
- `../js/persistent-multi-visualizer.js` - Phase 2b VisualizerManager with rule-based reactivity
- `../js/vib3code-visualizer-init.js` - VIB3CODE-specific initialization

## Archived Files (DO NOT USE):
- `visualizer.js` - Old basic visualizer
- `visualizer-main.js` - Legacy main visualizer
- `visualizer-dynamic.js` - Dynamic visualizer variant
- `holographic-visualizer.js` - Holographic effects system
- `hyperav-visualizer.js` - HyperAV implementation
- `visualizer-simple.js` - Simple fallback visualizer
- `vib3-visualizer-integration.js` - Old integration system
- `simple-working-visualizer.js` - Working visualizer port
- `multi-instance-visualizer.js` - Old multi-instance system
- `working-4d-hyperav.js` - 4D HyperAV implementation
- `hyperav-integration-enhanced.js` - Enhanced integration
- `hyperav-loader.js` - HyperAV loader

## Why Archived:
1. **Multiple Canvas Conflicts** - Each file was creating its own canvas elements
2. **Initialization Race Conditions** - Systems were fighting for control
3. **Inconsistent APIs** - Different visualizer architectures
4. **Performance Issues** - Multiple WebGL contexts competing
5. **Development Confusion** - Too many similar files with different approaches

## For Future Development:
- **ONLY** modify the Phase 2b system files
- **NEVER** create new visualizer files without archiving old ones first
- **ALWAYS** use the VisualizerManager architecture
- **TEST** that only ONE visualizer system is active at a time

This cleanup prevents future agents from accidentally loading conflicting visualizer systems.