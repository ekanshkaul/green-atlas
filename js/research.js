/**
 * SMVDU Green Atlas: Research & Sustainability Audit Controller (research.js)
 * Data-derived catalogue metrics, sector navigation, accessible plant
 * hovercards and citation copying.
 *
 * All figures shown on the page are calculated from js/data.js. Metrics that
 * cannot be supported by the supplied dataset (abundance-based diversity,
 * biomass, carbon stock, surveyed sector areas) are deliberately not shown.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==========================================
    // Shared helpers
    // ==========================================
    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function normalizeText(value) {
        return String(value == null ? '' : value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function toFiniteNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function formatInteger(value) {
        return Number.isFinite(value) ? value.toLocaleString() : '—';
    }

    function formatPercent(part, total) {
        if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return '—';
        return `${((part / total) * 100).toFixed(1)}%`;
    }

    function formatElevationRange(min, max) {
        if (!Number.isFinite(min) || !Number.isFinite(max)) return 'not recorded';
        return `${min}–${max}m MSL`;
    }

    function getCoordinates(record) {
        if (!record || typeof record !== 'object') return null;
        const candidates = [
            [record.coords?.[0], record.coords?.[1]],
            [record.latitude, record.longitude],
            [record.lat, record.lng]
        ];

        for (const [rawLat, rawLng] of candidates) {
            const lat = parseFloat(rawLat);
            const lng = parseFloat(rawLng);
            if (Number.isFinite(lat) && Number.isFinite(lng) &&
                lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return [lat, lng];
            }
        }
        return null;
    }

    function getRecordsSafely() {
        try {
            if (typeof getFloraData !== 'function') {
                return { records: [], error: 'The flora data service is unavailable.' };
            }
            const records = getFloraData();
            if (!Array.isArray(records)) {
                return { records: [], error: 'The flora data service did not return a record list.' };
            }
            return {
                records: records.filter(record => record && typeof record === 'object'),
                error: null
            };
        } catch (error) {
            console.error('[Green Atlas Research] Unable to read flora data:', error);
            return { records: [], error: 'The flora dataset could not be loaded.' };
        }
    }

    // ==========================================
    // 1. Catalogue metrics (calculation only)
    // ==========================================
    function calculateMetrics(records) {
        const metrics = {
            total: 0,
            species: 0,
            families: 0,
            mapped: 0,
            verified: 0,
            invasiveCount: 0,
            elevMin: null,
            elevMax: null,
            zones: {}
        };

        if (!Array.isArray(records) || records.length === 0) return metrics;

        const speciesSet = new Set();
        const familySet = new Set();
        const elevations = [];

        records.forEach(record => {
            if (!record || typeof record !== 'object') return;

            metrics.total += 1;

            if (record.botanicalName) speciesSet.add(normalizeText(record.botanicalName));
            if (record.family) familySet.add(normalizeText(record.family));

            const mapped = Boolean(getCoordinates(record));
            if (mapped) metrics.mapped += 1;
            if (record.verified === true) metrics.verified += 1;
            if (/\binvasive\b/i.test(String(record.notes || ''))) metrics.invasiveCount += 1;

            const elevationMatch = String(record.elevation || '').match(/(\d+)\s*m/i);
            const elevation = elevationMatch ? toFiniteNumber(elevationMatch[1]) : null;
            if (elevation != null) elevations.push(elevation);

            const zoneName = String(record.zone || '').trim() || 'Unassigned';
            if (!metrics.zones[zoneName]) {
                metrics.zones[zoneName] = {
                    total: 0,
                    mapped: 0,
                    verified: 0,
                    elevations: []
                };
            }

            const zone = metrics.zones[zoneName];
            zone.total += 1;
            if (mapped) zone.mapped += 1;
            if (record.verified === true) zone.verified += 1;
            if (elevation != null) zone.elevations.push(elevation);
        });

        metrics.species = speciesSet.size;
        metrics.families = familySet.size;

        if (elevations.length) {
            metrics.elevMin = Math.min(...elevations);
            metrics.elevMax = Math.max(...elevations);
        }

        Object.values(metrics.zones).forEach(zone => {
            if (zone.elevations.length) {
                zone.elevMin = Math.min(...zone.elevations);
                zone.elevMax = Math.max(...zone.elevations);
            } else {
                zone.elevMin = null;
                zone.elevMax = null;
            }
            delete zone.elevations;
        });

        return metrics;
    }

    // ==========================================
    // 2. Metrics presentation
    // ==========================================
    function updateSectorTable(zones, unavailable = false) {
        const rows = document.querySelectorAll('#research-sector-body tr[data-sector]');
        rows.forEach(row => {
            const zoneName = row.getAttribute('data-sector') || '';
            const zone = zones[zoneName] || {
                total: 0,
                mapped: 0,
                verified: 0,
                elevMin: null,
                elevMax: null
            };

            const totalElement = row.querySelector('[data-sector-stat="total"]');
            const mappedElement = row.querySelector('[data-sector-stat="mapped"]');
            const verifiedElement = row.querySelector('[data-sector-stat="verified"]');
            const elevationElement = row.querySelector('[data-sector-stat="elevation"]');

            if (totalElement) totalElement.textContent = unavailable ? '—' : formatInteger(zone.total);
            if (mappedElement) mappedElement.textContent = unavailable ? '—' : formatInteger(zone.mapped);
            if (verifiedElement) verifiedElement.textContent = unavailable ? '—' : formatInteger(zone.verified);
            if (elevationElement) {
                elevationElement.textContent = unavailable
                    ? 'Not recorded'
                    : (zoneName === 'Unassigned' ? 'Not recorded' : formatElevationRange(zone.elevMin, zone.elevMax));
            }
        });
    }

    function updateMetricsUI(metrics) {
        setText('research-stat-taxa', formatInteger(metrics.species));
        setText('research-stat-families', formatInteger(metrics.families));
        setText('research-stat-verified', formatInteger(metrics.verified));

        setText(
            'research-meta-taxa',
            metrics.total > 0
                ? `${formatInteger(metrics.total)} records: ${formatInteger(metrics.mapped)} mapped + ${formatInteger(metrics.total - metrics.mapped)} unmapped`
                : 'No flora records were returned.'
        );
        setText('research-meta-families', 'Taxonomic breadth of the catalogue');
        setText(
            'research-meta-verified',
            metrics.total > 0
                ? `${formatInteger(metrics.verified)} of ${formatInteger(metrics.total)} records carry the dataset verification flag`
                : 'Data unavailable'
        );

        setText('research-elevation-range', formatElevationRange(metrics.elevMin, metrics.elevMax));

        const invasiveNote = document.getElementById('research-invasive-note');
        if (invasiveNote) {
            invasiveNote.textContent = metrics.total > 0
                ? `Invasive behaviour is mentioned in the field notes of ${formatInteger(metrics.invasiveCount)} of ${formatInteger(metrics.total)} records (${formatPercent(metrics.invasiveCount, metrics.total)}); this is a text flag, not a measured pressure index.`
                : 'Invasive-note counts are unavailable because the dataset could not be loaded.';
        }

        updateSectorTable(metrics.zones);
    }

    function updateDataErrorState(message) {
        setText('research-stat-taxa', '—');
        setText('research-stat-families', '—');
        setText('research-stat-verified', '—');
        setText('research-meta-taxa', message || 'Flora data could not be loaded.');
        setText('research-meta-families', 'Data unavailable');
        setText('research-meta-verified', 'Data unavailable');
        setText('research-elevation-range', 'not recorded');

        const invasiveNote = document.getElementById('research-invasive-note');
        if (invasiveNote) {
            invasiveNote.textContent = 'Invasive-note counts are unavailable because the dataset could not be loaded.';
        }

        updateSectorTable({}, true);
    }

    function updateSurveyStats() {
        const statusElements = Array.from(document.querySelectorAll('[data-survey-status]'));
        const complete = statusElements.filter(element => element.getAttribute('data-survey-status') === 'complete').length;
        const total = statusElements.length;

        setText('research-stat-surveys', total > 0 ? `${complete} / ${total}` : '—');
        setText(
            'research-meta-surveys',
            total > 0
                ? `${complete} complete, ${total - complete} in progress`
                : 'Survey schedule unavailable'
        );
    }

    // ==========================================
    // 3. Sector row navigation
    // ==========================================
    function initSectorNavigation() {
        const rows = document.querySelectorAll('.sector-row-interactive');

        rows.forEach(row => {
            const sectorName = row.getAttribute('data-sector');
            if (!sectorName) return;

            const navigate = () => {
                window.location.assign(`maps.html?sector=${encodeURIComponent(sectorName)}`);
            };

            row.addEventListener('click', event => {
                // Dedicated map links handle their own navigation.
                if (event.target.closest('a, button')) return;
                navigate();
            });

            row.addEventListener('keydown', event => {
                if (event.target.closest('a, button')) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate();
                }
            });
        });
    }

    // ==========================================
    // 4. Plant hovercards
    // ==========================================
    function initPlantHovercards() {
        const popup = document.getElementById('plantHoverCard');
        const triggers = document.querySelectorAll('.plant-hover-trigger');
        if (!popup || triggers.length === 0) return;

        const supportsHover = window.matchMedia
            ? window.matchMedia('(hover: hover)').matches
            : true;
        const MARGIN = 12;
        const GAP = 8;

        let activeTrigger = null;
        let hideTimer = null;
        let suppressNextFocus = false;
        let focusOpenedCard = false;

        function findPlantRecord(query) {
            const { records, error } = getRecordsSafely();
            if (error) return { record: null, error };
            if (records.length === 0) return { record: null, error: 'No flora records are available.' };

            const normalizedQuery = normalizeText(query);
            if (!normalizedQuery) return { record: null, error: null };

            const fields = record => [
                record.id,
                record.botanicalName,
                record.commonName,
                record.dogriName
            ].map(normalizeText).filter(Boolean);

            let match = records.find(record => fields(record).some(value => value === normalizedQuery));
            if (!match) {
                match = records.find(record => fields(record).some(value => {
                    if (value.length < 4) return false;
                    return value.includes(normalizedQuery) || normalizedQuery.includes(value);
                }));
            }

            return { record: match || null, error: null };
        }

        function renderFoundRecord(record, query) {
            const toxicity = String(record.toxicity || '').trim();
            const isKnownToxicity = ['Safe', 'Mild Irritant', 'Toxic'].includes(toxicity);
            const chipLabel = isKnownToxicity
                ? (toxicity === 'Safe' ? 'Listed non-toxic' : toxicity)
                : 'Not recorded';
            const chipClass = toxicity === 'Toxic'
                ? 'hazard-toxic'
                : toxicity === 'Mild Irritant'
                    ? 'hazard-irritant'
                    : isKnownToxicity
                        ? 'hazard-safe'
                        : 'hazard-neutral';

            const botanicalName = record.botanicalName || 'Botanical name not recorded';
            const commonName = record.commonName || 'Common name not recorded';
            const family = record.family || 'Not recorded';
            const zone = record.zone || 'Not recorded';
            const recordId = record.id || 'Not recorded';
            const recordStatus = record.verified === true ? 'Verified taxon record' : 'Not marked verified';
            const databaseQuery = record.botanicalName || query;

            popup.innerHTML = `
                <button type="button" class="popup-close" aria-label="Close plant details">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
                <div class="popup-header">
                    <div class="popup-title-wrap">
                        <div class="popup-botanical"></div>
                        <div class="popup-common"></div>
                    </div>
                    <span class="hazard-chip popup-toxicity"></span>
                </div>
                <div class="popup-details">
                    <div><span>Family:</span> <strong data-popup-field="family"></strong></div>
                    <div><span>Zone:</span> <strong data-popup-field="zone"></strong></div>
                    <div><span>Catalog ID:</span> <strong data-popup-field="id"></strong></div>
                    <div><span>Record status:</span> <strong data-popup-field="status"></strong></div>
                </div>
                <a class="popup-action" href="database.html"></a>
            `;

            popup.querySelector('.popup-botanical').textContent = botanicalName;
            popup.querySelector('.popup-common').textContent = commonName;

            const chip = popup.querySelector('.popup-toxicity');
            chip.className = `hazard-chip popup-toxicity ${chipClass}`;
            chip.textContent = chipLabel;

            popup.querySelector('[data-popup-field="family"]').textContent = family;
            popup.querySelector('[data-popup-field="zone"]').textContent = zone;
            popup.querySelector('[data-popup-field="id"]').textContent = recordId;
            popup.querySelector('[data-popup-field="status"]').textContent = recordStatus;

            const action = popup.querySelector('.popup-action');
            action.href = `database.html?search=${encodeURIComponent(databaseQuery)}`;
            action.textContent = 'View species in database';
        }

        function renderMissingRecord(query, error) {
            const title = error ? 'Flora data unavailable' : 'Species record not found';
            const message = error
                ? error
                : `No matching record for “${query}” in the current dataset.`;

            popup.innerHTML = `
                <button type="button" class="popup-close" aria-label="Close plant details">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
                <div class="popup-header">
                    <div class="popup-title-wrap">
                        <div class="popup-botanical"></div>
                        <div class="popup-common"></div>
                    </div>
                </div>
                <p class="popup-note"></p>
                <a class="popup-action" href="database.html"></a>
            `;

            popup.querySelector('.popup-botanical').textContent = title;
            popup.querySelector('.popup-common').textContent = message;
            popup.querySelector('.popup-note').textContent = error
                ? 'Reload the page or open the flora database directly.'
                : 'Check the spelling, or search the flora database for this name.';

            const action = popup.querySelector('.popup-action');
            action.href = error
                ? 'database.html'
                : `database.html?search=${encodeURIComponent(query)}`;
            action.textContent = error ? 'Open flora database' : 'Search the flora database';
        }

        function positionPopup(trigger) {
            if (!trigger || !popup.classList.contains('active')) return;

            const triggerRect = trigger.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();
            const popupWidth = popupRect.width;
            const popupHeight = popupRect.height;

            let left = triggerRect.left + (triggerRect.width / 2) - (popupWidth / 2);
            const maxLeft = Math.max(MARGIN, window.innerWidth - popupWidth - MARGIN);
            left = Math.min(Math.max(MARGIN, left), maxLeft);

            let top = triggerRect.bottom + GAP;
            if (top + popupHeight > window.innerHeight - MARGIN) {
                top = triggerRect.top - popupHeight - GAP;
            }
            const maxTop = Math.max(MARGIN, window.innerHeight - popupHeight - MARGIN);
            top = Math.min(Math.max(MARGIN, top), maxTop);

            popup.style.left = `${Math.round(left)}px`;
            popup.style.top = `${Math.round(top)}px`;
        }

        function showHoverCard(trigger, options = {}) {
            if (!trigger) return;
            if (hideTimer) {
                window.clearTimeout(hideTimer);
                hideTimer = null;
            }

            if (activeTrigger && activeTrigger !== trigger) {
                activeTrigger.setAttribute('aria-expanded', 'false');
            }

            const query = trigger.getAttribute('data-plant') || trigger.textContent.trim();
            const result = findPlantRecord(query);
            if (result.record) {
                renderFoundRecord(result.record, query);
            } else {
                renderMissingRecord(query, result.error);
            }

            activeTrigger = trigger;
            trigger.setAttribute('aria-expanded', 'true');

            popup.classList.add('active');
            popup.setAttribute('aria-hidden', 'false');
            popup.style.visibility = 'hidden';
            positionPopup(trigger);
            popup.style.visibility = '';

            if (options.focusPopup) {
                popup.querySelector('.popup-close')?.focus();
            }
        }

        function hideHoverCard(options = {}) {
            const { immediate = false, restoreFocus = false } = options;
            if (hideTimer) {
                window.clearTimeout(hideTimer);
                hideTimer = null;
            }

            const triggerToRestore = activeTrigger;

            const finish = () => {
                if (activeTrigger) {
                    activeTrigger.setAttribute('aria-expanded', 'false');
                    activeTrigger = null;
                }
                popup.classList.remove('active');
                popup.setAttribute('aria-hidden', 'true');
                focusOpenedCard = false;

                if (restoreFocus && triggerToRestore) {
                    if (document.activeElement !== triggerToRestore) {
                        suppressNextFocus = true;
                        triggerToRestore.focus();
                    }
                }
            };

            if (immediate) {
                finish();
            } else {
                hideTimer = window.setTimeout(finish, 180);
            }
        }

        triggers.forEach(trigger => {
            trigger.setAttribute('tabindex', '0');
            trigger.setAttribute('role', 'button');
            trigger.setAttribute('aria-haspopup', 'group');
            trigger.setAttribute('aria-controls', 'plantHoverCard');
            trigger.setAttribute('aria-expanded', 'false');

            if (supportsHover) {
                trigger.addEventListener('mouseenter', () => {
                    focusOpenedCard = false;
                    showHoverCard(trigger);
                });
                trigger.addEventListener('mouseleave', () => hideHoverCard());
            }

            trigger.addEventListener('focus', () => {
                if (suppressNextFocus) {
                    suppressNextFocus = false;
                    return;
                }
                focusOpenedCard = true;
                showHoverCard(trigger);
            });

            trigger.addEventListener('blur', () => {
                window.setTimeout(() => {
                    if (activeTrigger === trigger && !popup.contains(document.activeElement)) {
                        hideHoverCard();
                    }
                }, 0);
            });

            trigger.addEventListener('click', event => {
                event.preventDefault();
                if (focusOpenedCard) {
                    focusOpenedCard = false;
                    showHoverCard(trigger);
                    return;
                }
                if (activeTrigger === trigger && popup.classList.contains('active')) {
                    hideHoverCard({ immediate: true });
                } else {
                    showHoverCard(trigger);
                }
            });

            trigger.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    showHoverCard(trigger, { focusPopup: true });
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    hideHoverCard({ immediate: true, restoreFocus: true });
                }
            });
        });

        popup.addEventListener('mouseenter', () => {
            if (hideTimer) {
                window.clearTimeout(hideTimer);
                hideTimer = null;
            }
        });
        popup.addEventListener('mouseleave', () => hideHoverCard());
        popup.addEventListener('focusin', () => {
            if (hideTimer) {
                window.clearTimeout(hideTimer);
                hideTimer = null;
            }
        });
        popup.addEventListener('focusout', () => {
            window.setTimeout(() => {
                if (activeTrigger && !popup.contains(document.activeElement)) {
                    hideHoverCard();
                }
            }, 0);
        });
        popup.addEventListener('click', event => {
            if (event.target.closest('.popup-close')) {
                event.preventDefault();
                hideHoverCard({ immediate: true, restoreFocus: true });
            }
        });

        document.addEventListener('click', event => {
            if (!popup.classList.contains('active')) return;
            if (popup.contains(event.target) || event.target.closest('.plant-hover-trigger')) return;
            hideHoverCard({ immediate: true });
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !popup.classList.contains('active')) return;
            event.preventDefault();
            hideHoverCard({ immediate: true, restoreFocus: true });
        });

        window.addEventListener('scroll', () => {
            if (!activeTrigger) return;
            const rect = activeTrigger.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) {
                hideHoverCard({ immediate: true });
                return;
            }
            positionPopup(activeTrigger);
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (activeTrigger) positionPopup(activeTrigger);
        });
    }

    // ==========================================
    // 5. Citation clipboard copy
    // ==========================================
    function initCitationCopy() {
        const button = document.getElementById('btnCopyCitation');
        const buttonText = document.getElementById('copyBtnText');
        const citation = document.getElementById('citationContent');
        const status = document.getElementById('copyStatus');
        if (!button || !citation) return;

        const originalText = buttonText ? buttonText.textContent : 'Copy Citation';
        let resetTimer = null;

        function setButtonState(state, message) {
            button.classList.toggle('is-copied', state === 'success');
            button.classList.toggle('is-error', state === 'error');
            if (buttonText) buttonText.textContent = message;

            if (status) {
                if (state === 'success') status.textContent = 'Citation copied to the clipboard.';
                else if (state === 'error') status.textContent = 'Citation could not be copied. The citation text has been selected for manual copying.';
                else status.textContent = '';
            }

            if (resetTimer) window.clearTimeout(resetTimer);
            if (state !== 'idle') {
                resetTimer = window.setTimeout(() => {
                    button.classList.remove('is-copied', 'is-error');
                    if (buttonText) buttonText.textContent = originalText;
                    if (status) status.textContent = '';
                }, 2400);
            }
        }

        async function copyText(text) {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch (error) {
                    console.warn('[Green Atlas Research] Clipboard API unavailable, trying fallback.', error);
                }
            }

            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.top = '0';
            textarea.style.left = '-9999px';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);

            let copied = false;
            try {
                copied = document.execCommand('copy');
            } catch (error) {
                copied = false;
            }
            textarea.remove();
            return copied;
        }

        button.addEventListener('click', async () => {
            const text = citation.innerText.trim();
            if (!text) {
                setButtonState('error', 'Nothing to copy');
                return;
            }

            const copied = await copyText(text);
            if (copied) {
                setButtonState('success', 'Copied!');
                return;
            }

            const selection = window.getSelection ? window.getSelection() : null;
            if (selection) {
                const range = document.createRange();
                range.selectNodeContents(citation);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            setButtonState('error', 'Copy failed');
        });
    }

    // ==========================================
    // Initialization
    // ==========================================
    function refreshMetrics() {
        const { records, error } = getRecordsSafely();
        if (error || records.length === 0) {
            updateDataErrorState(error || 'No flora records were returned.');
            return;
        }
        updateMetricsUI(calculateMetrics(records));
    }

    refreshMetrics();
    updateSurveyStats();
    initSectorNavigation();
    initPlantHovercards();
    initCitationCopy();

    // IndexedDB hydration can replace the seed records after initial render.
    window.addEventListener('smvdu:dataready', refreshMetrics);
    window.addEventListener('smvdu:datachanged', refreshMetrics);
});
