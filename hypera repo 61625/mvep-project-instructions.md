# MVEP Project Instructions

## Project Goal
Transform HyperAV into a machine-optimized visual encoding platform (MVEP) for high-dimensional data processing.

## Core Objectives
1. Extend HyperAV's 4D visualization for arbitrary data parameters
2. Create dense visual encodings optimized for computer vision
3. Implement Bayesian optimization for parameter mapping
4. Build machine-readable output pipeline

## Development Phases

### Phase 1: Foundation Refactoring
1. Remove audio-specific logic from HyperAV core
2. Create abstract data interface layer
3. Implement parameter validation system
4. Setup testing framework

### Phase 2: Visual Encoding Extension
1. Expand beyond color/morphing to include:
   - Texture patterns
   - Particle behaviors
   - Line weights
   - Opacity gradients
2. Create parameter interconnection system
3. Implement multi-scale representations

### Phase 3: Machine Output Pipeline
1. Build frame capture system
2. Add metadata encoding
3. Implement standard format exports
4. Create streaming output option

### Phase 4: Bayesian Optimization
1. Add uncertainty quantification
2. Implement adaptive mapping selection
3. Create feedback loop for encoding optimization
4. Build online learning system

## Technical Requirements
- Maintain 60fps performance
- Support 100+ parameters
- Output standard CV formats
- GPU memory < 4GB
- WebGL 2.0 compatibility

## Success Criteria
1. Process 100,000 data points in real-time
2. Generate machine-readable outputs
3. Demonstrate improved CV model performance
4. Maintain modular architecture
5. Pass all integration tests

## Development Guidelines
1. Code must be modular and extensible
2. All components need unit tests
3. Document parameter mappings
4. Profile performance regularly
5. Maintain backwards compatibility where possible

## Collaboration Protocol
1. Use atomic development approach
2. Implement parallel workflows where possible
3. Regular code reviews
4. Performance benchmarking
5. Documentation updates with each feature