# Objective

## Purpose
Create an interactive, exploratory game that embodies gradient ascent as play. The Map Lab provides a crisp, scalable foundation to iterate on map generation and remix dynamics before gameplay layers are added.

## Core Goals
- Always glanceable: banded color mapping for movement values
- Scales from tiny boards to massive worlds
- Iteration-first: parameterized, deterministic generation with remix controls

## Design Principles
- Deterministic seeds and parameter sets for reproducible worlds
- Chunked generation and windowed rendering for performance
- Separation of concerns: generation in workers, rendering in UI, tests in CI

## What "Good" Looks Like
- Multiscale structure: continents, islands, seams, fine texture
- Smooth exploration at 55+ FPS on mid-range hardware
- Remix operations feel like tectonic shifts, not random chaos
- Contributors can add fields or remixes by extending pure functions

## Iteration Loop
1. Adjust generation parameters in the UI
2. Observe changes instantly with consistent seed
3. Save parameter sets and share with collaborators
4. Run perf tests to catch regressions early
