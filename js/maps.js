/**
 * SMVDU Green Atlas — legacy GIS entry point.
 *
 * The map implementation is now split into:
 *   - maps-core.js     (map, geometry, layers, markers)
 *   - maps-controls.js (UI, export, pinpoint, session state)
 *
 * maps.html loads those files directly. This file is retained so old links
 * do not silently point at a removed resource.
 */
