/**
 * SMVDU Green Atlas — GIS map core
 * Map initialization, WGS84 geodesy, campus/sector geometry, basemaps and markers.
 */

document.addEventListener('DOMContentLoaded', () => {
    const geo = window.GeographicLib?.Geodesic?.WGS84;
    if (!geo) {
        console.error('[SMVDU GIS] GeographicLib failed to load; map geodesy is unavailable.');
    }

    // ----------------------------------------------------
    // WGS84 ellipsoidal geodesy
    // ----------------------------------------------------
    function calculateGeodesicMetrics(coords) {
        if (!Array.isArray(coords) || coords.length < 2 || !geo) {
            return { areaM2: 0, perimeterM: 0 };
        }

        const polygon = geo.Polygon(false);
        coords.forEach(([lat, lng]) => polygon.AddPoint(lat, lng));
        const result = polygon.Compute(false, true);

        return {
            areaM2: Math.abs(Number(result.area) || 0),
            perimeterM: Number(result.perimeter) || 0
        };
    }

    function calculateGeodesicArea(coords) {
        return calculateGeodesicMetrics(coords).areaM2;
    }

    function calculatePerimeter(coords) {
        return calculateGeodesicMetrics(coords).perimeterM;
    }

    function formatArea(m2) {
        return `${(m2 / 10000).toFixed(2)} Ha (${(m2 / 1e6).toFixed(3)} km²)`;
    }

    function formatLength(m) {
        if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
        return `${Math.round(m)} m`;
    }

    function isValidCoordinate(coords) {
        if (!Array.isArray(coords) || coords.length !== 2) return false;
        const lat = Number(coords[0]);
        const lng = Number(coords[1]);
        return Number.isFinite(lat) && Number.isFinite(lng) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    // ----------------------------------------------------
    // Campus boundary & ecological sectors
    // ----------------------------------------------------
    const CAMPUS_CENTER = [32.94190, 74.95380];
    const DEFAULT_ZOOM = 16;

    /*
     * IMPORTANT:
     * A surveyed campus-boundary polygon was not present in the supplied files.
     * This working boundary is therefore derived from the supplied sector extents.
     * Replace this array with the official survey/GIS boundary when available.
     */
    const CAMPUS_BOUNDARY = [
        [32.93765, 74.95035],
        [32.94045, 74.95060],
        [32.94272, 74.95288],
        [32.94272, 74.95305],
        [32.94535, 74.95305],
        [32.94565, 74.95612],
        [32.94355, 74.95630],
        [32.94348, 74.95848],
        [32.94045, 74.95862],
        [32.94045, 74.95575],
        [32.93800, 74.95340],
        [32.93765, 74.95035]
    ];

    const SECTOR_DEFINITIONS = {
        "Pine Ridge Belt": {
            color: "#15803d", fillColor: "#22c55e",
            bounds: [[32.94300, 74.95300], [32.94520, 74.95320], [32.94550, 74.95600], [32.94350, 74.95620], [32.94280, 74.95480]],
            dominant: "Pinus roxburghii, Mallotus philippensis, Quercus leucotrichophora",
            desc: "Coniferous high-ridge canopy running along the northern perimeter."
        },
        "Academic Avenue": {
            color: "#a16207", fillColor: "#eab308",
            bounds: [[32.94050, 74.95250], [32.94300, 74.95280], [32.94320, 74.95500], [32.94070, 74.95480]],
            dominant: "Bauhinia variegata, Dalbergia sissoo, Cassia fistula",
            desc: "Central campus boulevard corridor uniting administrative and lecture complexes."
        },
        "Lower Scrublands": {
            color: "#c2410c", fillColor: "#f97316",
            bounds: [[32.93780, 74.95050], [32.94050, 74.95080], [32.94060, 74.95300], [32.93800, 74.95320]],
            dominant: "Acacia modesta, Calotropis procera, Ziziphus mauritiana",
            desc: "Arid south-facing terraces and boundary zones with drought-adapted thickets."
        },
        "Ravine Corridors": {
            color: "#0e7490", fillColor: "#06b6d4",
            bounds: [[32.94060, 74.95560], [32.94350, 74.95540], [32.94330, 74.95820], [32.94060, 74.95840]],
            dominant: "Equisetum ramosissimum, Adiantum capillus-veneris, Salix tetrasperma",
            desc: "Deep shaded nullah channels and seasonal drainage corridors."
        }
    };

    const campusMetrics = calculateGeodesicMetrics(CAMPUS_BOUNDARY);
    let totalCampusAreaM2 = campusMetrics.areaM2;
    let totalCampusPerimeterM = campusMetrics.perimeterM;

    Object.keys(SECTOR_DEFINITIONS).forEach(key => {
        const sec = SECTOR_DEFINITIONS[key];
        const metrics = calculateGeodesicMetrics(sec.bounds);
        sec.areaM2 = metrics.areaM2;
        sec.perimeterM = metrics.perimeterM;
    });

    const mapElement = document.getElementById('campus-full-map');
    if (!mapElement || typeof L === 'undefined') return;

    const map = L.map('campus-full-map', {
        center: CAMPUS_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true
    });

    // Attribution is intentionally enabled for the third-party basemap providers.
    const TILE_CONFIG = {
        maxZoom: 19,
        keepBuffer: 6,
        updateWhenZooming: false,
        updateWhenIdle: true,
        attribution: '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a>'
    };

    const basemaps = {
        street: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', TILE_CONFIG),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', TILE_CONFIG),
        topo: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', TILE_CONFIG)
    };
    basemaps.street.addTo(map);

    // Campus boundary overlay. It is deliberately separate from sector polygons.
    const campusBoundaryLayer = L.polygon(CAMPUS_BOUNDARY, {
        color: '#14532d',
        weight: 2.5,
        opacity: 0.95,
        fillColor: '#22c55e',
        fillOpacity: 0.035,
        dashArray: '8, 5'
    }).addTo(map);
    campusBoundaryLayer.bindTooltip('<strong>Campus Boundary</strong><br><span style="font-size:0.7rem;">Working boundary derived from supplied sector extents</span>', {
        sticky: true,
        className: 'sector-map-tooltip'
    });

    // Tile error feedback — small, non-blocking field notification.
    let tileErrorTimer = null;
    function showMapNotification(message, type = 'info') {
        document.querySelector('.map-inline-notification')?.remove();
        const note = document.createElement('div');
        const allowedType = ['info', 'warning', 'error', 'success'].includes(type) ? type : 'info';
        note.className = `map-inline-notification ${allowedType}`;
        note.setAttribute('role', 'status');

        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-circle-exclamation';
        const text = document.createElement('span');
        text.textContent = message;
        note.append(icon, text);

        const wrapper = document.getElementById('map-fullscreen-wrapper');
        if (wrapper) wrapper.appendChild(note);
        clearTimeout(tileErrorTimer);
        tileErrorTimer = setTimeout(() => note.remove(), 5000);
    }

    Object.values(basemaps).forEach(layer => {
        layer.on('tileerror', () => {
            showMapNotification('Map imagery is temporarily unavailable. Check your connection and try again.', 'warning');
        });
    });

    map.invalidateSize(true);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => map.invalidateSize(true));
    }
    window.addEventListener('load', () => map.invalidateSize(true));

    if (typeof ResizeObserver !== 'undefined') {
        const mapResizeObserver = new ResizeObserver(() => map.invalidateSize());
        mapResizeObserver.observe(mapElement);
    } else {
        [50, 250, 600, 1200, 2000].forEach(delay => setTimeout(() => map.invalidateSize(true), delay));
    }
    window.addEventListener('resize', () => map.invalidateSize());

    const sectorLayerGroup = L.featureGroup().addTo(map);
    const sectorPolygonMap = {};

    Object.keys(SECTOR_DEFINITIONS).forEach(sectorKey => {
        const info = SECTOR_DEFINITIONS[sectorKey];
        const polygon = L.polygon(info.bounds, {
            color: info.color,
            weight: 2,
            opacity: 0.85,
            fillColor: info.fillColor,
            fillOpacity: 0.18,
            dashArray: '4, 6'
        });
        polygon.on('click', () => window.dispatchEvent(new CustomEvent('smvdu:sector-select', { detail: sectorKey })));
        polygon.bindTooltip(`<strong>${sectorKey}</strong><br><span style="font-size: 0.7rem;">Area: ${formatArea(info.areaM2)}</span>`, {
            sticky: true,
            className: 'sector-map-tooltip'
        });
        sectorPolygonMap[sectorKey] = polygon;
        sectorLayerGroup.addLayer(polygon);
    });

    const markerCluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 35,
        spiderfyOnMaxZoom: true,
        chunkedLoading: true
    }).addTo(map);

    let allSpecimenMarkers = [];

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getToxicityPresentation(value) {
        const tier = typeof normalizeStoredToxicity === 'function'
            ? normalizeStoredToxicity(value)
            : String(value == null ? '' : value).trim();

        if (tier === 'Toxic') {
            return { markerClass: 'marker-toxic', chipClass: 'hazard-toxic', label: 'Toxic' };
        }
        if (tier === 'Mild Irritant') {
            return { markerClass: 'marker-irritant', chipClass: 'hazard-irritant', label: 'Mild Irritant' };
        }
        if (tier === 'Safe') {
            return { markerClass: 'marker-safe', chipClass: 'hazard-safe', label: 'Safe' };
        }
        return { markerClass: 'marker-unknown', chipClass: 'hazard-unknown', label: 'Unknown / Not assessed' };
    }

    function renderMapMarkers(records) {
        markerCluster.clearLayers();
        allSpecimenMarkers = [];

        records.filter(item => isValidCoordinate(item.coords)).forEach(item => {
            const toxicity = getToxicityPresentation(item.toxicity);
            const colorClass = toxicity.markerClass;
            const badgeClass = toxicity.chipClass;

            const icon = L.divIcon({
                className: 'custom-gis-pin-wrap',
                html: `<div class="gis-pin-node ${colorClass}"><i class="fa-solid fa-seedling"></i></div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            });
            const marker = L.marker(item.coords, { icon, title: item.botanicalName });

            const popupHtml = `
                <div class="plant-hover-card" style="width: 270px; padding: 0.5rem;">
                    <div class="ph-header" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div class="ph-botanical" style="font-family: 'Playfair Display', Georgia, serif; font-size: 1rem; font-weight: 700; font-style: italic; color: var(--primary);">${escapeHtml(item.botanicalName)}</div>
                            <div class="ph-common" style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(item.commonName || '')}</div>
                        </div>
                        <span class="hazard-chip ${badgeClass}" style="font-size: 0.65rem; padding: 0.15rem 0.4rem;">${escapeHtml(toxicity.label)}</span>
                    </div>
                    <div class="ph-details" style="font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; margin-bottom: 0.75rem;">
                        <div>ID: <strong>${escapeHtml(item.id)}</strong></div>
                        <div>Zone: <strong>${escapeHtml(item.zone)}</strong></div>
                    </div>
                    <a href="database.html?search=${encodeURIComponent(item.botanicalName)}" class="ph-btn" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: var(--primary); color: #fff; padding: 0.4rem; border-radius: 4px; font-size: 0.8rem; text-decoration: none;">Open Flora Record</a>
                </div>
            `;
            marker.bindPopup(popupHtml, { maxWidth: 300, className: 'persistent-flora-popup' });
            marker.specimenData = item;
            allSpecimenMarkers.push(marker);
            markerCluster.addLayer(marker);
        });
    }

    window.SmvdUMaps = {
        map,
        mapElement,
        basemaps,
        campusCenter: CAMPUS_CENTER,
        defaultZoom: DEFAULT_ZOOM,
        campusBoundary: CAMPUS_BOUNDARY,
        campusBoundaryLayer,
        campusAreaM2: totalCampusAreaM2,
        campusPerimeterM: totalCampusPerimeterM,
        sectorDefinitions: SECTOR_DEFINITIONS,
        sectorPolygonMap,
        sectorLayerGroup,
        markerCluster,
        getAllSpecimenMarkers: () => allSpecimenMarkers,
        renderMapMarkers,
        formatArea,
        formatLength,
        isValidCoordinate,
        showMapNotification,
        calculateGeodesicArea,
        calculatePerimeter,
        getFloraRecords: () => (typeof getFloraData === 'function' ? getFloraData() : [])
    };
});
