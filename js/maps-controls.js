/**
 * SMVDU Green Atlas — GIS map controls
 * Sector filters, accessibility, fullscreen, export, pinpoint and session restore.
 */

document.addEventListener('DOMContentLoaded', () => {
    const GIS = window.SmvdUMaps;
    if (!GIS) return;

    const {
        map, mapElement, basemaps, campusCenter: CAMPUS_CENTER, defaultZoom: DEFAULT_ZOOM,
        campusAreaM2: totalCampusAreaM2, campusPerimeterM: totalCampusPerimeterM,
        sectorDefinitions: SECTOR_DEFINITIONS, sectorPolygonMap, markerCluster,
        renderMapMarkers, formatArea, formatLength, isValidCoordinate, getAllSpecimenMarkers,
        getFloraRecords, showMapNotification
    } = GIS;

    const sidebar = document.getElementById('map-sector-sidebar');
    const elSidebarTitle = document.getElementById('sidebar-sector-name');
    const elSidebarDesc = document.getElementById('sidebar-sector-desc');
    const elSidebarDominant = document.getElementById('sidebar-dominant');
    const elSidebarArea = document.getElementById('sidebar-area');
    const elSidebarSoil = document.getElementById('sidebar-soil');
    const elSidebarCount = document.getElementById('sidebar-specimen-count');
    const sectorTableRows = document.querySelectorAll('.sector-table-interactive');

    const btnZoneAll = document.getElementById('filter-zone-all');
    const zoneButtons = [
        { btn: btnZoneAll, zone: 'ALL' },
        { btn: document.getElementById('filter-zone-pine'), zone: 'Pine Ridge Belt' },
        { btn: document.getElementById('filter-zone-avenue'), zone: 'Academic Avenue' },
        { btn: document.getElementById('filter-zone-scrub'), zone: 'Lower Scrublands' },
        { btn: document.getElementById('filter-zone-ravine'), zone: 'Ravine Corridors' }
    ];

    function setActiveZoneUI(zone) {
        zoneButtons.forEach(({ btn, zone: buttonZone }) => {
            if (!btn) return;
            const active = buttonZone === zone;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', String(active));
        });

        sectorTableRows.forEach(row => {
            const active = zone !== 'ALL' && row.dataset.zone === zone;
            row.classList.toggle('active-sector-row', active);
            row.setAttribute('aria-pressed', String(active));
        });
    }

    function highlightSector(targetZone, options = {}) {
        const { restoreViewport = false } = options;
        const allRecords = getFloraRecords();
        const mappedRecords = allRecords.filter(record => isValidCoordinate(record.coords));
        const elStatCount = document.getElementById('map-stat-active-count');
        const elStatCountMeta = document.getElementById('map-stat-count-meta');
        const elStatZone = document.getElementById('map-stat-active-zone');
        const elStatElevation = document.getElementById('map-stat-elevation');
        const elStatElevationMeta = document.getElementById('map-stat-elevation-meta');
        const elStatZoneMeta = document.getElementById('map-stat-zone-meta');

        Object.keys(sectorPolygonMap).forEach(key => {
            const poly = sectorPolygonMap[key];
            if (targetZone === 'ALL' || targetZone === key) {
                poly.setStyle(targetZone === key
                    ? { color: '#ffffff', weight: 4, fillOpacity: 0.45 }
                    : { color: SECTOR_DEFINITIONS[key].color, weight: 2, fillOpacity: 0.18 });
            } else {
                poly.setStyle({ color: '#9ca3af', weight: 1, fillOpacity: 0.08 });
            }
        });

        setActiveZoneUI(targetZone);

        if (targetZone === 'ALL') {
            if (!restoreViewport) map.flyTo(CAMPUS_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
            renderMapMarkers(allRecords);
            if (elStatCount) elStatCount.textContent = mappedRecords.length;
            if (elStatCountMeta) elStatCountMeta.textContent = `${mappedRecords.length} mapped of ${allRecords.length} catalogued`;
            if (elStatZone) elStatZone.textContent = 'All Zones Displayed';
            if (elStatZoneMeta) elStatZoneMeta.textContent = 'Ridge, Avenue, Scrub & Ravine';
            if (elStatElevation) elStatElevation.textContent = '780–880m';
            if (elStatElevationMeta) elStatElevationMeta.textContent = 'MSL (Trikuta Sub-Himalayan Foothills)';
            if (elSidebarTitle) elSidebarTitle.innerHTML = '<i class="fa-solid fa-circle-info"></i> Sector Inspector';
            if (elSidebarDesc) elSidebarDesc.textContent = 'Select a sector button above, click a map polygon, or choose a sector row in the table below.';
            if (elSidebarDominant) elSidebarDominant.textContent = 'Campus-wide floral associations';
            if (elSidebarArea) elSidebarArea.textContent = `${formatArea(totalCampusAreaM2)} | Perim: ${formatLength(totalCampusPerimeterM)}`;
            if (elSidebarSoil) elSidebarSoil.textContent = 'Campus-wide substrate summary';
            if (elSidebarCount) elSidebarCount.textContent = `${mappedRecords.length} Mapped Taxa`;
            sidebar?.classList.add('collapsed');
            return;
        }

        const targetPolygon = Object.hasOwn(sectorPolygonMap, targetZone)
            ? sectorPolygonMap[targetZone]
            : null;
        const sectorInfo = Object.hasOwn(SECTOR_DEFINITIONS, targetZone)
            ? SECTOR_DEFINITIONS[targetZone]
            : null;
        if (!sectorInfo) return;
        if (targetPolygon && !restoreViewport) {
            map.fitBounds(targetPolygon.getBounds(), { padding: [40, 40], maxZoom: 17, animate: true });
        }

        const matchingRecords = allRecords.filter(r => r.zone === targetZone);
        renderMapMarkers(matchingRecords);

        if (elStatCount) elStatCount.textContent = matchingRecords.length;
        if (elStatCountMeta) elStatCountMeta.textContent = `${matchingRecords.length} mapped in this sector`;
        if (elStatZone) elStatZone.textContent = targetZone;
        if (elStatZoneMeta) elStatZoneMeta.textContent = 'Selected ecological sector';

        const ranges = {
            'Pine Ridge Belt': ['840–880m', 'Northern Coniferous Belt'],
            'Academic Avenue': ['815–830m', 'Central Boulevard Corridor'],
            'Lower Scrublands': ['780–810m', 'Arid Southern Terraces'],
            'Ravine Corridors': ['825–865m', 'Shaded Nullah Channels']
        };
        const [elevation, elevationMeta] = ranges[targetZone] || ['—', ''];
        if (elStatElevation) elStatElevation.textContent = elevation;
        if (elStatElevationMeta) elStatElevationMeta.textContent = elevationMeta;

        if (elSidebarTitle) elSidebarTitle.innerHTML = `<i class="fa-solid fa-tree"></i> ${targetZone}`;
        if (elSidebarDesc) elSidebarDesc.textContent = sectorInfo.desc;
        if (elSidebarDominant) elSidebarDominant.textContent = sectorInfo.dominant;
        if (elSidebarArea) elSidebarArea.textContent = `${formatArea(sectorInfo.areaM2)} | Perim: ${formatLength(sectorInfo.perimeterM)}`;
        if (elSidebarCount) elSidebarCount.textContent = `${matchingRecords.length} Mapped Taxa`;

        sidebar?.classList.remove('collapsed');
    }

    window.addEventListener('smvdu:sector-select', e => {
        if (e.detail) highlightSector(e.detail);
    });

    zoneButtons.forEach(({ btn, zone }) => {
        btn?.addEventListener('click', () => highlightSector(zone));
    });

    // ----------------------------------------------------
    // Fullscreen
    // ----------------------------------------------------
    const mapFullscreenWrapper = document.getElementById('map-fullscreen-wrapper');
    const btnFullscreen = document.getElementById('btn-map-fullscreen');

    function updateFullscreenUI(isFullscreen) {
        if (!btnFullscreen) return;
        if (isFullscreen) {
            btnFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i> Minimize';
            btnFullscreen.title = 'Minimize Map View';
            btnFullscreen.setAttribute('aria-label', 'Minimize Map View');
        } else {
            btnFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i> Fullscreen';
            btnFullscreen.title = 'Toggle Fullscreen Map View';
            btnFullscreen.setAttribute('aria-label', 'Toggle Fullscreen Map View');
        }
        [10, 50, 150, 300].forEach(delay => setTimeout(() => map.invalidateSize(true), delay));
    }

    btnFullscreen?.addEventListener('click', () => {
        if (!mapFullscreenWrapper) return;
        if (!mapFullscreenWrapper.classList.contains('true-fullscreen')) {
            if (mapFullscreenWrapper.requestFullscreen) {
                mapFullscreenWrapper.requestFullscreen().catch(() => {
                    mapFullscreenWrapper.classList.add('true-fullscreen');
                    updateFullscreenUI(true);
                });
            } else {
                mapFullscreenWrapper.classList.add('true-fullscreen');
                updateFullscreenUI(true);
            }
        } else if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            mapFullscreenWrapper.classList.remove('true-fullscreen');
            updateFullscreenUI(false);
        }
    });

    document.addEventListener('fullscreenchange', () => {
        const isFs = !!document.fullscreenElement;
        mapFullscreenWrapper?.classList.toggle('true-fullscreen', isFs);
        updateFullscreenUI(isFs);
    });

    // ----------------------------------------------------
    // Settings + basemap switching
    // ----------------------------------------------------
    const settingsBtn = document.getElementById('btn-map-settings');
    const settingsDropdown = document.getElementById('map-settings-dropdown');

    settingsBtn?.addEventListener('click', e => {
        e.stopPropagation();
        if (settingsDropdown) settingsDropdown.style.display = settingsDropdown.style.display === 'none' ? 'block' : 'none';
    });
    settingsDropdown?.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', e => {
        if (settingsDropdown && !settingsBtn?.contains(e.target) && !settingsDropdown.contains(e.target)) {
            settingsDropdown.style.display = 'none';
        }
    });

    function switchBasemap(layer, btn) {
        Object.values(basemaps).forEach(l => { if (map.hasLayer(l)) map.removeLayer(l); });
        layer.addTo(map);
        document.querySelectorAll('#map-settings-dropdown [data-layer]').forEach(b => {
            const active = b === btn;
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', String(active));
        });
        saveFieldState();
    }

    settingsDropdown?.querySelectorAll('[data-layer]').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.classList.contains('active')));
        btn.addEventListener('click', () => {
            const layerType = btn.getAttribute('data-layer');
            if (layerType && basemaps[layerType]) switchBasemap(basemaps[layerType], btn);
            if (settingsDropdown) settingsDropdown.style.display = 'none';
        });
    });

    // ----------------------------------------------------
    // Sidebar + recenter
    // ----------------------------------------------------
    const sectorToggle = document.getElementById('btn-toggle-panel');
    const legendPanel = document.getElementById('map-legend-panel');
    const legendToggle = document.getElementById('btn-toggle-legend');
    const legendContent = document.getElementById('map-legend-content');

    function setSectorSidebarExpanded(expanded) {
        sidebar?.classList.toggle('collapsed', !expanded);
        sectorToggle?.setAttribute('aria-expanded', String(expanded));
    }

    function setLegendExpanded(expanded) {
        legendPanel?.classList.toggle('collapsed', !expanded);
        legendToggle?.setAttribute('aria-expanded', String(expanded));
        if (legendContent) legendContent.hidden = !expanded;
    }

    // Legend starts retracted. On first pointer entry into the map, reveal it once.
    setLegendExpanded(false);
    let legendAutoExpanded = false;
    mapElement?.addEventListener('mouseenter', () => {
        if (legendAutoExpanded) return;
        legendAutoExpanded = true;
        setLegendExpanded(true);
    }, { once: true });

    sectorToggle?.addEventListener('click', () => {
        const expanded = sidebar?.classList.contains('collapsed');
        setSectorSidebarExpanded(Boolean(expanded));
    });
    document.getElementById('btn-close-sidebar')?.addEventListener('click', () => setSectorSidebarExpanded(false));

    legendToggle?.addEventListener('click', () => {
        const expanded = legendPanel?.classList.contains('collapsed');
        setLegendExpanded(Boolean(expanded));
    });
    document.getElementById('btn-recenter-map')?.addEventListener('click', () => highlightSector('ALL'));

    // ----------------------------------------------------
    // Accessible sector table rows
    // ----------------------------------------------------
    sectorTableRows.forEach(row => {
        row.tabIndex = 0;
        row.setAttribute('role', 'button');
        row.setAttribute('aria-pressed', 'false');

        const activate = () => {
            const zoneName = row.getAttribute('data-zone');
            if (zoneName) highlightSector(zoneName);
        };
        row.addEventListener('click', activate);
        row.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate();
            }
        });
    });

    // ----------------------------------------------------
    // GeoJSON export: flora + sector polygons + campus boundary
    // ----------------------------------------------------
    function buildPolygonFeature(name, coords, properties = {}) {
        const ring = coords.map(([lat, lng]) => [lng, lat]);
        if (ring.length && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
            ring.push([...ring[0]]);
        }
        return {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [ring] },
            properties: { name, ...properties }
        };
    }

    function buildGeoJSON() {
        const records = getFloraRecords();
        const activeZone = zoneButtons.find(z => z.btn?.classList.contains('active'))?.zone || 'ALL';
        const selectedRecords = activeZone === 'ALL' ? records : records.filter(item => item.zone === activeZone);
        const features = [];

        selectedRecords.filter(item => isValidCoordinate(item.coords)).forEach(item => {
            features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [Number(item.coords[1]), Number(item.coords[0])] },
                properties: {
                    id: item.id,
                    botanicalName: item.botanicalName,
                    commonName: item.commonName,
                    dogriName: item.dogriName || null,
                    zone: item.zone,
                    toxicity: item.toxicity || 'Safe',
                    toxicAgent: item.toxicAgent || null
                }
            });
        });

        if (activeZone === 'ALL') {
            features.push(buildPolygonFeature('SMVDU Campus Boundary', GIS.campusBoundary, {
                featureType: 'campus-boundary',
                boundaryStatus: 'working-derived-boundary'
            }));
            Object.entries(SECTOR_DEFINITIONS).forEach(([name, info]) => {
                features.push(buildPolygonFeature(name, info.bounds, {
                    featureType: 'ecological-sector',
                    areaM2: info.areaM2,
                    perimeterM: info.perimeterM
                }));
            });
        } else {
            const info = SECTOR_DEFINITIONS[activeZone];
            if (info) features.push(buildPolygonFeature(activeZone, info.bounds, {
                featureType: 'ecological-sector',
                areaM2: info.areaM2,
                perimeterM: info.perimeterM
            }));
        }

        return {
            type: 'FeatureCollection',
            features,
            properties: {
                source: 'SMVDU Green Atlas GIS Atlas',
                exportScope: activeZone === 'ALL' ? 'All zones' : activeZone,
                generatedAt: new Date().toISOString()
            }
        };
    }

    document.getElementById('btn-export-geojson-dropdown')?.addEventListener('click', () => {
        const featureCollection = buildGeoJSON();
        const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/geo+json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'smvdu-green-atlas-campus-gis.geojson';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showMapNotification('GeoJSON export prepared successfully.', 'success');
        if (settingsDropdown) settingsDropdown.style.display = 'none';
    });

    // ----------------------------------------------------
    // Pinpoint + coordinate accuracy
    // ----------------------------------------------------
    let isPinpointActive = false;
    let pinpointMarker = null;
    let pinpointCoordsValue = null;
    const btnTogglePinpoint = document.getElementById('btn-toggle-pinpoint');
    const pinpointReadout = document.getElementById('pinpoint-readout');
    const pinpointCoords = document.getElementById('pinpoint-coords');
    const pinpointAccuracy = document.getElementById('pinpoint-accuracy');
    const btnCopyCoords = document.getElementById('btn-copy-coords');
    const btnClearPinpoint = document.getElementById('btn-clear-pinpoint');

    function clearPinpoint() {
        if (pinpointMarker) {
            map.removeLayer(pinpointMarker);
            pinpointMarker = null;
        }
        pinpointCoordsValue = null;
        if (pinpointCoords) pinpointCoords.textContent = '--';
        if (pinpointAccuracy) pinpointAccuracy.textContent = 'Map click • ~5 m visual precision';
        saveFieldState();
    }

    function setPinpointActive(active) {
        isPinpointActive = active;
        btnTogglePinpoint?.classList.toggle('active', active);
        btnTogglePinpoint?.setAttribute('aria-pressed', String(active));
        mapElement.style.cursor = active ? 'crosshair' : '';
        if (pinpointReadout) pinpointReadout.style.display = active ? 'inline-flex' : 'none';
        if (!active) clearPinpoint();
    }

    btnTogglePinpoint?.addEventListener('click', () => setPinpointActive(!isPinpointActive));
    btnClearPinpoint?.addEventListener('click', clearPinpoint);

    btnCopyCoords?.addEventListener('click', async () => {
        if (!pinpointCoordsValue) return;
        try {
            await navigator.clipboard.writeText(pinpointCoordsValue);
            showMapNotification('Coordinates copied to clipboard.', 'success');
        } catch (error) {
            console.warn('[SMVDU GIS] Clipboard copy failed:', error);
            showMapNotification('Could not access the clipboard. Select the coordinates manually.', 'warning');
        }
    });

    map.on('click', e => {
        if (!isPinpointActive) return;
        const lat = Number(e.latlng.lat.toFixed(6));
        const lng = Number(e.latlng.lng.toFixed(6));
        pinpointCoordsValue = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (pinpointCoords) pinpointCoords.textContent = pinpointCoordsValue;
        if (pinpointAccuracy) pinpointAccuracy.textContent = 'Map click • ~5 m visual precision';

        if (!pinpointMarker) {
            pinpointMarker = L.circleMarker(e.latlng, {
                radius: 8,
                fillColor: '#b5835a',
                color: '#fff',
                weight: 2,
                fillOpacity: 0.9
            }).addTo(map);
        } else {
            pinpointMarker.setLatLng(e.latlng);
        }
        saveFieldState();
    });

    // ----------------------------------------------------
    // Field state resilience
    // ----------------------------------------------------
    const STORAGE_KEY = 'smvdu_floris_map_session';

    function saveFieldState() {
        try {
            const c = map.getCenter();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                lat: c.lat,
                lng: c.lng,
                zoom: map.getZoom(),
                activeZone: zoneButtons.find(z => z.btn?.classList.contains('active'))?.zone || 'ALL',
                activeBasemap: document.querySelector('#map-settings-dropdown [data-layer].active')?.getAttribute('data-layer') || 'street',
                pinpointActive: isPinpointActive,
                pinpointCoords: pinpointCoordsValue,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('[SMVDU GIS] Failed to save field session:', error);
        }
    }

    map.on('moveend zoomend', saveFieldState);
    setInterval(saveFieldState, 10000);

    function restorePinpointState(saved) {
        if (!saved?.pinpointActive) return;
        setPinpointActive(true);
        if (!saved.pinpointCoords) return;

        const [lat, lng] = String(saved.pinpointCoords).split(',').map(v => Number(v.trim()));
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isValidCoordinate([lat, lng])) return;

        pinpointCoordsValue = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (pinpointCoords) pinpointCoords.textContent = pinpointCoordsValue;
        pinpointMarker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#b5835a',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9
        }).addTo(map);
    }

    function offerSessionRestore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            const ageMinutes = (Date.now() - Number(saved.timestamp)) / 60000;
            if (!saved || !Number.isFinite(ageMinutes) || ageMinutes > 1440) return;

            document.querySelector('.field-restore-toast')?.remove();
            const viewportContainer = document.querySelector('.map-viewport-container');
            if (!viewportContainer) return;

            const toast = document.createElement('div');
            toast.className = 'field-restore-toast';
            toast.innerHTML = `
                <span><i class="fa-solid fa-clock-rotate-left" style="color: var(--primary);"></i> Previous session available.</span>
                <div class="toast-actions">
                    <button type="button" class="btn-action btn-toast" id="btn-restore-session">Restore</button>
                    <button type="button" class="btn-action btn-outline btn-toast" id="btn-dismiss-toast" aria-label="Dismiss session restore">&times;</button>
                </div>
            `;
            viewportContainer.insertAdjacentElement('afterend', toast);

            document.getElementById('btn-restore-session').onclick = () => {
                const hasViewport = Number.isFinite(Number(saved.lat)) && Number.isFinite(Number(saved.lng)) &&
                    isValidCoordinate([Number(saved.lat), Number(saved.lng)]);
                if (hasViewport) map.setView([Number(saved.lat), Number(saved.lng)], Number(saved.zoom) || DEFAULT_ZOOM);

                if (saved.activeBasemap && Object.hasOwn(basemaps, saved.activeBasemap)) {
                    const layerBtn = document.querySelector(`#map-settings-dropdown [data-layer="${saved.activeBasemap}"]`);
                    switchBasemap(basemaps[saved.activeBasemap], layerBtn);
                }

                if (saved.activeZone && saved.activeZone !== 'ALL' && Object.hasOwn(SECTOR_DEFINITIONS, saved.activeZone)) {
                    highlightSector(saved.activeZone, { restoreViewport: true });
                } else {
                    highlightSector('ALL', { restoreViewport: true });
                }

                restorePinpointState(saved);
                toast.remove();
                localStorage.removeItem(STORAGE_KEY);
            };

            document.getElementById('btn-dismiss-toast').onclick = () => {
                toast.remove();
                localStorage.removeItem(STORAGE_KEY);
            };
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 15000);
        } catch (error) {
            console.warn('[SMVDU GIS] Failed to restore field session:', error);
        }
    }

    function syncInitialMap() {
        const records = getFloraRecords();
        const mappedRecords = records.filter(record => isValidCoordinate(record.coords));
        renderMapMarkers(records);

        const elCount = document.getElementById('map-stat-active-count');
        const elCountMeta = document.getElementById('map-stat-count-meta');
        const elArea = document.getElementById('map-stat-campus-area');
        if (elCount) elCount.textContent = mappedRecords.length;
        if (elCountMeta) elCountMeta.textContent = `${mappedRecords.length} mapped of ${records.length} catalogued`;
        if (elArea) elArea.textContent = formatArea(totalCampusAreaM2);

        const urlParams = new URLSearchParams(window.location.search);
        const linkLat = parseFloat(urlParams.get('lat'));
        const linkLng = parseFloat(urlParams.get('lng'));
        const linkId = urlParams.get('id');
        const linkSector = urlParams.get('sector');

        const hasValidLink = Number.isFinite(linkLat) && Number.isFinite(linkLng) && isValidCoordinate([linkLat, linkLng]);
        if (hasValidLink) {
            map.setView([linkLat, linkLng], 18);
            const targetMarker = getAllSpecimenMarkers().find(m => linkId ? (m.specimenData && m.specimenData.id === linkId) : false);
            if (targetMarker) {
                markerCluster.zoomToShowLayer(targetMarker, () => targetMarker.openPopup());
            }
            return;
        }

        if (urlParams.has('lat') || urlParams.has('lng')) {
            showMapNotification('The supplied map coordinates are invalid.', 'warning');
        }

        if (linkSector) {
            if (Object.hasOwn(SECTOR_DEFINITIONS, linkSector)) {
                highlightSector(linkSector);
            } else {
                showMapNotification('The requested ecological sector was not recognized.', 'warning');
                offerSessionRestore();
            }
            return;
        }

        offerSessionRestore();
    }

    // Start with all zones displayed.
    highlightSector('ALL', { restoreViewport: true });
    syncInitialMap();
});
