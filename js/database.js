/**
 * SMVDU Green Atlas: Herbarium Database Controller (js/database.js)
 * Searchable catalogue, specimen inspection, field observation intake,
 * CSV export, QR tags and printable botanical plaques.
 *
 * Data integrity principles:
 * - Missing toxicity is shown as Unknown / Not assessed, never assumed Safe.
 * - Missing IUCN status is shown as Not recorded, never assumed LC.
 * - An observation is only reported as saved after IndexedDB confirms the write.
 * - QR links are derived from the current deployment URL, with no invented fallback.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ----------------------------------------------------
    // Core elements
    // ----------------------------------------------------
    const tableBody = document.getElementById('flora-table-body');
    const searchInput = document.getElementById('flora-search');
    const filterZone = document.getElementById('filter-zone');
    const filterHabit = document.getElementById('filter-habit');
    const filterToxicity = document.getElementById('filter-toxicity');
    const btnReset = document.getElementById('btn-reset-filters');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnExportVerifiedCsv = document.getElementById('btn-export-verified-csv');

    const elDbTotal = document.getElementById('db-stat-total');
    const elDbFamilies = document.getElementById('db-stat-families');
    const elDbObs = document.getElementById('db-stat-observations');
    const elDbVisible = document.getElementById('db-stat-visible');
    const elDbMetaTotal = document.getElementById('db-meta-total');
    const elDbMetaFamilies = document.getElementById('db-meta-families');
    const elDbMetaObs = document.getElementById('db-meta-observations');
    const elDbMetaVisible = document.getElementById('db-meta-visible');

    const statusAnnouncer = document.getElementById('db-status-announcer');
    const storageWarning = document.getElementById('db-storage-warning');
    const storageWarningText = document.getElementById('db-storage-warning-text');
    const migrationNote = document.getElementById('db-migration-note');
    const migrationNoteText = document.getElementById('db-migration-note-text');
    const syncBadge = document.getElementById('db-active-sync-badge');

    const PAGE_SIZE = 15;
    const CAMPUS_BOUNDS = Object.freeze({
        minLat: 32.936,
        maxLat: 32.947,
        minLng: 74.949,
        maxLng: 74.960
    });
    const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

    let currentPage = 1;
    let currentFilteredRecords = [];
    let showVerifiedOnly = false;
    let highResPhotoBase64 = '';
    let activeQrItem = null;
    let lastFocusedElement = null;
    let isSubmitting = false;
    let pendingDuplicateConfirmation = false;
    let deepLinkHandled = false;

    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');
    const elCurrentPageNum = document.getElementById('current-page-num');
    const elTotalPagesNum = document.getElementById('total-pages-num');
    const elPaginationInfo = document.getElementById('pagination-info');
    const btnToggleVerified = document.getElementById('btn-toggle-verified');

    const cardModal = document.getElementById('specimen-card-modal');
    const btnCloseCardModal = document.getElementById('btn-close-card-modal');
    const qrModal = document.getElementById('specimen-qr-modal');
    const btnCloseQrModal = document.getElementById('btn-close-specimen-qr');
    const qrModalId = document.getElementById('qr-modal-id');
    const qrModalBotanical = document.getElementById('qr-modal-botanical');
    const qrModalCommon = document.getElementById('qr-modal-common');
    const qrModalImg = document.getElementById('specimen-qr-image');
    const qrModalTarget = document.getElementById('qr-modal-target');
    const qrModalError = document.getElementById('qr-modal-error');
    const qrActionStatus = document.getElementById('qr-action-status');
    const btnDownloadQr = document.getElementById('btn-download-qr');
    const btnPrintQrPlaque = document.getElementById('btn-print-qr-plaque');

    const observationModal = document.getElementById('observation-modal');
    const btnOpenModal = document.getElementById('btn-open-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const formAddSpecimen = document.getElementById('form-add-specimen');
    const formStatus = document.getElementById('observation-form-status');
    const duplicateWarning = document.getElementById('duplicate-warning');
    const btnSubmitObservation = document.getElementById('btn-submit-observation');

    const btnAcquireGps = document.getElementById('btn-acquire-gps');
    const inputLat = document.getElementById('input-lat');
    const inputLng = document.getElementById('input-lng');
    const gpsStatusMsg = document.getElementById('gps-status-msg');
    const inputPhoto = document.getElementById('input-photo');
    const previewWrap = document.getElementById('photo-preview-wrap');
    const previewImg = document.getElementById('photo-preview-img');
    const photoStatus = document.getElementById('photo-status');

    const inputBotanical = document.getElementById('input-botanical');
    const inputCommon = document.getElementById('input-common');
    const inputDogri = document.getElementById('input-dogri');
    const inputFamily = document.getElementById('input-family');
    const inputHabit = document.getElementById('input-habit');
    const inputZone = document.getElementById('input-zone');
    const inputToxicity = document.getElementById('input-toxicity');
    const inputIucn = document.getElementById('input-iucn');
    const inputElevation = document.getElementById('input-elevation');
    const inputPhenology = document.getElementById('input-phenology');
    const inputNotes = document.getElementById('input-notes');

    // Filters dropdown
    const btnFilters = document.getElementById('btn-filters');
    const filtersDropdown = document.getElementById('filters-dropdown');

    // ----------------------------------------------------
    // Shared helpers
    // ----------------------------------------------------
    function setText(element, value) {
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

    function normalizeToxicity(value) {
        const normalized = normalizeText(value).replace(/[_-]+/g, ' ');
        if (['safe', 'non toxic', 'non-toxic', 'listed non-toxic'].includes(normalized)) return 'Safe';
        if (['mild irritant', 'irritant', 'allergenic'].includes(normalized)) return 'Mild Irritant';
        if (['toxic', 'severe toxic', 'highly toxic'].includes(normalized)) return 'Toxic';
        return 'Unknown';
    }

    function toxicityLabel(value) {
        const tier = normalizeToxicity(value);
        if (tier === 'Safe') return 'Listed non-toxic';
        if (tier === 'Mild Irritant') return 'Mild Irritant';
        if (tier === 'Toxic') return 'Toxic';
        return 'Unknown / Not assessed';
    }

    function toxicityClass(value) {
        const tier = normalizeToxicity(value);
        if (tier === 'Toxic') return 'hazard-toxic';
        if (tier === 'Mild Irritant') return 'hazard-irritant';
        if (tier === 'Safe') return 'hazard-safe';
        return 'hazard-unknown';
    }

    function displayText(value, fallback = 'Not recorded') {
        if (value == null) return fallback;
        const text = String(value).trim();
        return text || fallback;
    }

    function displayIucn(value) {
        return displayText(value, 'Not recorded');
    }

    function displayPhenology(value) {
        const normalized = normalizeText(value).replace(/[.!]+$/, '');
        if (!normalized || [
            'standard foothill phenological schedule',
            'standard foothill phenological pattern',
            'field observed phenological status'
        ].includes(normalized)) {
            return 'Not recorded';
        }
        return displayText(value);
    }

    function getCoords(item) {
        if (!item || typeof item !== 'object') return null;
        const candidates = [
            [item.coords?.[0], item.coords?.[1]],
            [item.latitude, item.longitude],
            [item.lat, item.lng]
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

    function getSafeRecords() {
        try {
            if (typeof getFloraData !== 'function') return [];
            const records = getFloraData();
            if (!Array.isArray(records)) return [];
            const valid = records.filter(record =>
                record && typeof record === 'object' && record.id && record.botanicalName
            );
            if (valid.length !== records.length) {
                console.warn(`[Green Atlas Database] Skipped ${records.length - valid.length} malformed record(s).`);
            }
            return valid;
        } catch (error) {
            console.error('[Green Atlas Database] Unable to read flora data:', error);
            return [];
        }
    }

    function announce(message) {
        if (statusAnnouncer) statusAnnouncer.textContent = message;
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function csvCell(value, protectFormula = true) {
        let text = value == null ? '' : String(value);
        if (protectFormula && (/^[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) {
            text = "'" + text;
        }
        return `"${text.replace(/"/g, '""')}"`;
    }

    function downloadBlob(filename, content, type) {
        const blob = content instanceof Blob ? content : new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function sanitizeFilename(value) {
        return String(value == null ? '' : value)
            .replace(/[^a-z0-9-]+/gi, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 80) || 'specimen';
    }

    function setSelectOptions(select, options) {
        if (!select) return;
        const previous = select.value;
        select.replaceChildren();
        options.forEach(optionData => {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.textContent = optionData.label;
            if (optionData.disabled) option.disabled = true;
            if (optionData.selected) {
                option.selected = true;
                option.setAttribute('selected', '');
            }
            select.appendChild(option);
        });
        if (Array.from(select.options).some(option => option.value === previous)) {
            select.value = previous;
        }
    }

    // ----------------------------------------------------
    // Persistent storage status
    // ----------------------------------------------------
    function showStorageWarning(message) {
        if (storageWarning) storageWarning.hidden = false;
        if (storageWarningText) storageWarningText.textContent = message;
        if (syncBadge) {
            syncBadge.textContent = 'DATA ENGINE // SESSION ONLY';
            syncBadge.classList.add('status-warning');
        }
        const chip = syncBadge?.closest('.status-chip');
        if (chip) chip.classList.add('is-warning');
    }

    function clearStorageWarning() {
        if (storageWarning) storageWarning.hidden = true;
        if (syncBadge) {
            syncBadge.textContent = 'DATA ENGINE // PERSISTENT';
            syncBadge.classList.remove('status-warning');
        }
        const chip = syncBadge?.closest('.status-chip');
        if (chip) chip.classList.remove('is-warning');
    }

    async function checkStorageAvailability() {
        if (!('indexedDB' in window) || typeof openIndexedDB !== 'function') {
            showStorageWarning('IndexedDB is unavailable in this browser. Observations cannot be saved.');
            return;
        }
        try {
            const db = await openIndexedDB();
            if (!db) {
                showStorageWarning('Persistent storage could not be opened. Observations cannot be saved.');
                return;
            }
            clearStorageWarning();
        } catch (error) {
            console.error('[Green Atlas Database] Storage check failed:', error);
            showStorageWarning('Persistent storage could not be opened. Observations cannot be saved.');
        }
    }

    window.addEventListener('smvdu:storage-unavailable', event => {
        showStorageWarning(event.detail?.message || 'Persistent storage is unavailable. Observations cannot be saved.');
    });

    function updateMigrationNote(count) {
        if (!migrationNote || !migrationNoteText) return;
        if (Number.isFinite(count) && count > 0) {
            migrationNote.hidden = false;
            migrationNoteText.textContent = `${count} legacy observation${count === 1 ? ' was' : 's were'} relocated to new IDs to avoid collisions with the 175-record catalogue.`;
        } else {
            migrationNote.hidden = true;
            migrationNoteText.textContent = '';
        }
    }

    // ----------------------------------------------------
    // Filters dropdown
    // ----------------------------------------------------
    btnFilters?.addEventListener('click', event => {
        event.stopPropagation();
        if (!filtersDropdown) return;
        const opening = filtersDropdown.hidden;
        filtersDropdown.hidden = !opening;
        btnFilters.setAttribute('aria-expanded', String(opening));
    });

    filtersDropdown?.addEventListener('click', event => event.stopPropagation());

    document.addEventListener('click', event => {
        if (filtersDropdown && !btnFilters?.contains(event.target) && !filtersDropdown?.contains(event.target)) {
            filtersDropdown.hidden = true;
            btnFilters?.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !filtersDropdown || filtersDropdown.hidden) return;
        filtersDropdown.hidden = true;
        btnFilters?.setAttribute('aria-expanded', 'false');
        btnFilters?.focus();
    });

    // ----------------------------------------------------
    // Modal helpers
    // ----------------------------------------------------
    const pageRegions = [
        document.querySelector('header'),
        document.querySelector('main'),
        document.querySelector('footer')
    ].filter(Boolean);

    function setPageInert(inert) {
        pageRegions.forEach(region => {
            if (inert) region.setAttribute('inert', '');
            else region.removeAttribute('inert');
        });
    }

    function getFocusableElements(container) {
        if (!container) return [];
        return Array.from(container.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(element => element.getClientRects().length > 0);
    }

    function showModal(element) {
        if (!element) return;
        const anyOpen = [cardModal, qrModal, observationModal].some(
            modal => modal && modal.classList.contains('modal-open')
        );
        if (!anyOpen) {
            lastFocusedElement = document.activeElement;
            setPageInert(true);
        }

        document.body.classList.remove('page-enter');
        document.body.style.transform = 'none';

        if (element.parentNode !== document.body) document.body.appendChild(element);

        element.style.display = 'flex';
        element.setAttribute('aria-hidden', 'false');
        element.classList.add('modal-open');
        document.body.style.overflow = 'hidden';

        const dialog = element.querySelector('.modal-dialog');
        if (dialog) dialog.scrollTop = 0;
        element.scrollTop = 0;

        window.requestAnimationFrame(() => {
            if (!element.classList.contains('modal-open')) return;
            const preferred = element.id === 'observation-modal'
                ? inputBotanical
                : getFocusableElements(element)[0];
            (preferred || element.querySelector('.modal-dialog'))?.focus?.();
        });
    }

    function hideModal(element) {
        if (!element) return;
        element.classList.remove('modal-open');
        element.style.display = 'none';
        element.setAttribute('aria-hidden', 'true');

        const anyOpen = [cardModal, qrModal, observationModal].some(
            modal => modal && (modal.classList.contains('modal-open') || modal.style.display === 'flex')
        );

        if (!anyOpen) {
            document.body.style.overflow = '';
            document.body.style.transform = '';
            setPageInert(false);
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
            lastFocusedElement = null;
        }
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            [cardModal, qrModal, observationModal].forEach(hideModal);
            return;
        }
        if (event.key !== 'Tab') return;

        const openModal = [cardModal, qrModal, observationModal].find(
            modal => modal && modal.classList.contains('modal-open')
        );
        if (!openModal) return;

        const focusable = getFocusableElements(openModal);
        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!openModal.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    // ----------------------------------------------------
    // QR and deployment URL helpers
    // ----------------------------------------------------
    function getConfiguredBaseUrl() {
        const meta = document.querySelector('meta[name="green-atlas-base-url"]');
        const configured = meta?.getAttribute('content')?.trim();
        if (configured) {
            try {
                return new URL(configured, window.location.href).href.replace(/\/?$/, '/');
            } catch (error) {
                console.warn('[Green Atlas Database] Invalid green-atlas-base-url meta value:', configured);
                return null;
            }
        }
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            return new URL('./', window.location.href).href;
        }
        return null;
    }

    function getSpecimenDeepLink(id) {
        const base = getConfiguredBaseUrl();
        if (!base || id == null || String(id).trim() === '') return null;
        const url = new URL('database.html', base);
        url.searchParams.set('q', String(id));
        return url.href;
    }

    function createLocalQrDataUrl(text, px = 220) {
        if (typeof qrcode !== 'function') return null;
        try {
            const qr = qrcode(0, 'M');
            qr.addData(text);
            qr.make();
            const moduleCount = qr.getModuleCount();
            const margin = 2;
            const cellSize = Math.max(3, Math.ceil(px / (moduleCount + margin * 2)));
            const size = (moduleCount + margin * 2) * cellSize;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const context = canvas.getContext('2d');
            if (!context) return null;
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, size, size);
            context.fillStyle = '#000000';
            for (let row = 0; row < moduleCount; row += 1) {
                for (let col = 0; col < moduleCount; col += 1) {
                    if (qr.isDark(row, col)) {
                        context.fillRect((col + margin) * cellSize, (row + margin) * cellSize, cellSize, cellSize);
                    }
                }
            }
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.warn('[Green Atlas Database] Local QR generation failed:', error);
            return null;
        }
    }

    function buildQrCode(text, px = 220) {
        const local = createLocalQrDataUrl(text, px);
        if (local) return { src: local, local: true };
        return {
            src: `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(text)}&margin=1`,
            local: false
        };
    }

    function setQrError(message) {
        if (qrModalError) {
            qrModalError.textContent = message;
            qrModalError.hidden = false;
        }
        if (qrActionStatus) qrActionStatus.textContent = message;
        announce(message);
    }

    function setQrStatus(message) {
        if (qrActionStatus) qrActionStatus.textContent = message;
        announce(message);
    }

    function disableQrActions(disabled) {
        if (btnDownloadQr) btnDownloadQr.disabled = disabled;
        if (btnPrintQrPlaque) btnPrintQrPlaque.disabled = disabled;
    }

    function openSpecimenQrModal(item) {
        if (!qrModal || !item) return;
        activeQrItem = item;

        const deepLink = getSpecimenDeepLink(item.id);
        setText(qrModalId, displayText(item.id));
        setText(qrModalBotanical, displayText(item.botanicalName));
        const commonParts = [displayText(item.commonName, ''), displayText(item.dogriName, '')].filter(Boolean);
        setText(qrModalCommon, commonParts.length ? commonParts.join(' · ') : 'Not recorded');
        setText(qrModalTarget, deepLink || 'Deployment URL unavailable');

        if (qrModalError) {
            qrModalError.hidden = true;
            qrModalError.textContent = '';
        }
        if (qrActionStatus) qrActionStatus.textContent = '';
        disableQrActions(false);
        if (qrModalImg) {
            qrModalImg.hidden = false;
            qrModalImg.onerror = null;
            qrModalImg.removeAttribute('data-target');
        }

        if (!deepLink) {
            if (qrModalImg) {
                qrModalImg.removeAttribute('src');
                qrModalImg.hidden = true;
            }
            disableQrActions(true);
            setQrError('A public deployment URL is required to generate a QR code. Open the site over HTTP(S) or set the green-atlas-base-url meta tag.');
        } else {
            const qr = buildQrCode(deepLink, 220);
            if (qrModalImg) {
                qrModalImg.dataset.target = deepLink;
                qrModalImg.dataset.source = qr.local ? 'local' : 'remote';
                qrModalImg.alt = `QR code for ${displayText(item.botanicalName)} (${displayText(item.id)})`;
                qrModalImg.onerror = () => {
                    qrModalImg.hidden = true;
                    disableQrActions(true);
                    setQrError('The QR image could not be loaded. The external QR service may be unavailable.');
                };
                qrModalImg.src = qr.src;
            }
        }

        showModal(qrModal);
    }

    async function downloadQrImage(source, filename) {
        if (!source) throw new Error('No QR image source.');
        if (source.startsWith('data:')) {
            const link = document.createElement('a');
            link.href = source;
            link.download = filename;
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            link.remove();
            return;
        }

        const response = await fetch(source, { mode: 'cors' });
        if (!response.ok) throw new Error(`QR image request failed with HTTP ${response.status}.`);
        const blob = await response.blob();
        downloadBlob(filename, blob, blob.type || 'image/png');
    }

    btnDownloadQr?.addEventListener('click', async () => {
        if (!activeQrItem || !qrModalImg) return;
        const source = qrModalImg.getAttribute('src');
        if (!source) {
            setQrError('No QR image is available to download.');
            return;
        }

        const filename = `QR_${sanitizeFilename(activeQrItem.id)}_${sanitizeFilename(activeQrItem.botanicalName)}.png`;
        if (btnDownloadQr) btnDownloadQr.disabled = true;
        try {
            await downloadQrImage(source, filename);
            setQrStatus('QR image downloaded.');
        } catch (error) {
            console.warn('[Green Atlas Database] QR download failed:', error);
            window.open(source, '_blank', 'noopener,noreferrer');
            setQrStatus('The QR image could not be downloaded automatically. It has been opened in a new tab for saving.');
        } finally {
            if (btnDownloadQr) btnDownloadQr.disabled = false;
        }
    });

    btnPrintQrPlaque?.addEventListener('click', () => {
        if (activeQrItem) printBotanicalPlaque(activeQrItem);
    });

    // ----------------------------------------------------
    // GPS and photo processing
    // ----------------------------------------------------
    function setGpsStatus(type, message) {
        if (!gpsStatusMsg) return;
        gpsStatusMsg.className = `gps-status font-mono${type ? ` is-${type}` : ''}`;
        gpsStatusMsg.textContent = message;
    }

    btnAcquireGps?.addEventListener('click', () => {
        if (!navigator.geolocation) {
            setGpsStatus('error', 'Geolocation is not supported by this browser.');
            return;
        }

        const originalHtml = btnAcquireGps.innerHTML;
        btnAcquireGps.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Locking GPS...';
        btnAcquireGps.disabled = true;
        setGpsStatus('neutral', 'Acquiring satellite constellation lock...');

        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude.toFixed(5);
                const lng = position.coords.longitude.toFixed(5);
                const accuracy = Math.round(position.coords.accuracy);
                if (inputLat) inputLat.value = lat;
                if (inputLng) inputLng.value = lng;

                const numericLat = Number(lat);
                const numericLng = Number(lng);
                const outsideCampus = numericLat < CAMPUS_BOUNDS.minLat || numericLat > CAMPUS_BOUNDS.maxLat ||
                    numericLng < CAMPUS_BOUNDS.minLng || numericLng > CAMPUS_BOUNDS.maxLng;

                if (outsideCampus) {
                    setGpsStatus('warning', `GPS fixed at ${lat}, ${lng} (±${accuracy}m), outside the known campus extent. Check the location before saving.`);
                } else {
                    setGpsStatus('success', `GPS fixed at ${lat}, ${lng} (±${accuracy}m accuracy).`);
                }

                btnAcquireGps.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Captured';
                btnAcquireGps.disabled = false;
                window.setTimeout(() => { btnAcquireGps.innerHTML = originalHtml; }, 2500);
            },
            error => {
                let message = 'Unable to retrieve GPS coordinates.';
                if (error.code === 1) message = 'Location permission denied by the user.';
                else if (error.code === 2) message = 'Position unavailable (low satellite reception).';
                else if (error.code === 3) message = 'GPS request timed out.';
                setGpsStatus('error', message);
                btnAcquireGps.innerHTML = originalHtml;
                btnAcquireGps.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    });

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => resolve(event.target.result);
            reader.onerror = () => reject(reader.error || new Error('The file could not be read.'));
            reader.readAsDataURL(file);
        });
    }

    function compressImage(dataUrl, maxDimension = 1600, quality = 0.82) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    let width = img.naturalWidth || img.width;
                    let height = img.naturalHeight || img.height;
                    if (!width || !height) throw new Error('The image has no readable dimensions.');

                    if (width > height && width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext('2d');
                    if (!context) throw new Error('The image canvas is unavailable.');
                    context.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('The selected image could not be decoded.'));
            img.src = dataUrl;
        });
    }

    function setPhotoStatus(type, message) {
        if (!photoStatus) return;
        photoStatus.className = `font-mono photo-status${type ? ` is-${type}` : ''}`;
        photoStatus.textContent = message;
    }

    inputPhoto?.addEventListener('change', async event => {
        const file = event.target.files?.[0];
        highResPhotoBase64 = '';
        if (previewWrap) previewWrap.hidden = true;
        if (previewImg) previewImg.removeAttribute('src');

        if (!file) {
            setPhotoStatus('', '');
            return;
        }
        if (!file.type.startsWith('image/')) {
            setPhotoStatus('error', 'Choose a JPEG, PNG, WebP or other image file.');
            event.target.value = '';
            return;
        }
        if (file.size > MAX_PHOTO_BYTES) {
            setPhotoStatus('error', 'The image exceeds 10 MB. Choose a smaller file.');
            event.target.value = '';
            return;
        }

        setPhotoStatus('neutral', 'Compressing image…');
        try {
            const dataUrl = await readFileAsDataUrl(file);
            const compressed = await compressImage(dataUrl, 1600, 0.82);
            highResPhotoBase64 = compressed;
            if (previewImg) previewImg.src = compressed;
            if (previewWrap) previewWrap.hidden = false;
            const kilobytes = Math.round((compressed.length * 0.75) / 1024);
            setPhotoStatus('success', `Ready · approximately ${kilobytes} KB after compression`);
        } catch (error) {
            console.warn('[Green Atlas Database] Photo processing failed:', error);
            highResPhotoBase64 = '';
            if (previewWrap) previewWrap.hidden = true;
            if (previewImg) previewImg.removeAttribute('src');
            setPhotoStatus('error', 'The image could not be processed. Try a different file.');
        }
    });

    // ----------------------------------------------------
    // Telemetry and table rendering
    // ----------------------------------------------------
    function refreshTelemetry(visibleCount) {
        const telemetry = (typeof getCampusTelemetry === 'function') ? getCampusTelemetry() : null;
        if (!telemetry) {
            setText(elDbTotal, '—');
            setText(elDbFamilies, '—');
            setText(elDbObs, '—');
            setText(elDbVisible, visibleCount);
            return;
        }

        setText(elDbTotal, telemetry.totalSpecies);
        setText(elDbFamilies, telemetry.totalFamilies);
        setText(elDbObs, telemetry.loggedObservationCount);
        setText(elDbVisible, visibleCount);

        setText(elDbMetaTotal, `${telemetry.records.length} records · ${telemetry.verifiedCount} verified · ${telemetry.mappedCount} mapped`);
        setText(elDbMetaFamilies, `${telemetry.totalFamilies} distinct families in the catalogue`);
        setText(
            elDbMetaObs,
            telemetry.loggedObservationCount > 0
                ? 'Records added beyond the catalogued dataset'
                : 'No field observations logged in this browser'
        );
        setText(
            elDbMetaVisible,
            `${visibleCount} of ${telemetry.records.length} records match the active filters`
        );

        updateMigrationNote(telemetry.migratedObservationCount);
    }

    function createActionButton(className, label, ariaLabel, recordId) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = label;
        button.dataset.id = recordId;
        button.setAttribute('aria-label', ariaLabel);
        return button;
    }

    function createEmptyState() {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 8;
        const wrapper = document.createElement('div');
        wrapper.className = 'db-empty-state';

        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-seedling';
        icon.setAttribute('aria-hidden', 'true');

        const title = document.createElement('h3');
        title.textContent = 'No matching specimens';

        const message = document.createElement('p');
        message.textContent = 'No botanical specimens match the active search and filters.';

        const reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'btn-action btn-outline';
        reset.textContent = 'Reset filters';
        reset.addEventListener('click', resetAllFilters);

        wrapper.append(icon, title, message, reset);
        cell.appendChild(wrapper);
        row.appendChild(cell);
        return row;
    }

    function renderPaginatedTable() {
        if (!tableBody) return;
        tableBody.replaceChildren();
        const totalRecords = currentFilteredRecords.length;
        refreshTelemetry(totalRecords);

        if (totalRecords === 0) {
            tableBody.appendChild(createEmptyState());
            setText(elPaginationInfo, 'Showing 0 specimens');
            setText(elCurrentPageNum, '1');
            setText(elTotalPagesNum, '1');
            if (btnPrevPage) btnPrevPage.disabled = true;
            if (btnNextPage) btnNextPage.disabled = true;
            return;
        }

        const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
        currentPage = Math.min(Math.max(1, currentPage), totalPages);
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = Math.min(startIndex + PAGE_SIZE, totalRecords);
        const pageItems = currentFilteredRecords.slice(startIndex, endIndex);

        setText(elPaginationInfo, `Showing ${startIndex + 1}–${endIndex} of ${totalRecords} specimens`);
        setText(elCurrentPageNum, String(currentPage));
        setText(elTotalPagesNum, String(totalPages));
        if (btnPrevPage) btnPrevPage.disabled = currentPage === 1;
        if (btnNextPage) btnNextPage.disabled = currentPage === totalPages;

        const fragment = document.createDocumentFragment();
        pageItems.forEach(item => {
            const row = document.createElement('tr');

            const idCell = document.createElement('td');
            idCell.className = 'font-mono db-id-cell';
            idCell.textContent = displayText(item.id);
            if (item.verified === true) {
                const icon = document.createElement('i');
                icon.className = 'fa-solid fa-circle-check db-verified-icon';
                icon.setAttribute('role', 'img');
                icon.setAttribute('aria-label', 'Verified taxon record');
                icon.title = 'Verified taxon record';
                idCell.appendChild(document.createTextNode(' '));
                idCell.appendChild(icon);
            }

            const specimenCell = document.createElement('td');
            const botanical = document.createElement('strong');
            botanical.className = 'db-species-name';
            botanical.textContent = displayText(item.botanicalName);
            const common = document.createElement('span');
            common.className = 'db-common-name';
            common.textContent = displayText(item.commonName);
            specimenCell.append(botanical, common);

            const dogriCell = document.createElement('td');
            dogriCell.className = 'db-dogri';
            dogriCell.textContent = displayText(item.dogriName);
            if (!item.dogriName) dogriCell.classList.add('db-cell-muted');

            const familyCell = document.createElement('td');
            familyCell.className = 'db-cell';
            familyCell.textContent = displayText(item.family);

            const habitCell = document.createElement('td');
            habitCell.className = 'db-cell';
            habitCell.textContent = displayText(item.habit);

            const zoneCell = document.createElement('td');
            zoneCell.className = 'db-cell';
            zoneCell.textContent = displayText(item.zone);

            const toxicityCell = document.createElement('td');
            const toxicityChip = document.createElement('span');
            toxicityChip.className = `hazard-chip ${toxicityClass(item.toxicity)}`;
            toxicityChip.textContent = toxicityLabel(item.toxicity);
            toxicityCell.appendChild(toxicityChip);

            const actionsCell = document.createElement('td');
            actionsCell.className = 'db-actions-cell';
            const actions = document.createElement('div');
            actions.className = 'row-actions';

            const viewButton = createActionButton(
                'btn-action btn-outline btn-tool btn-view-card',
                'View Card',
                `View specimen details for ${displayText(item.botanicalName)}`,
                item.id
            );
            const viewIcon = document.createElement('i');
            viewIcon.className = 'fa-solid fa-id-card';
            viewIcon.setAttribute('aria-hidden', 'true');
            viewButton.prepend(viewIcon);

            const qrButton = createActionButton(
                'btn-action btn-tool btn-qr btn-open-qr',
                'QR Plaque',
                `Generate a QR tag for ${displayText(item.botanicalName)}`,
                item.id
            );
            const qrIcon = document.createElement('i');
            qrIcon.className = 'fa-solid fa-qrcode';
            qrIcon.setAttribute('aria-hidden', 'true');
            qrButton.prepend(qrIcon);

            actions.append(viewButton, qrButton);
            actionsCell.appendChild(actions);

            row.append(idCell, specimenCell, dogriCell, familyCell, habitCell, zoneCell, toxicityCell, actionsCell);
            fragment.appendChild(row);
        });

        tableBody.appendChild(fragment);
    }

    tableBody?.addEventListener('click', event => {
        const button = event.target.closest('button[data-id]');
        if (!button || !tableBody.contains(button)) return;
        const id = button.dataset.id;
        const target = getSafeRecords().find(record => record.id === id);
        if (!target) {
            announce('The selected specimen could not be found.');
            return;
        }
        try {
            if (button.classList.contains('btn-view-card')) openSpecimenModal(target);
            else if (button.classList.contains('btn-open-qr')) openSpecimenQrModal(target);
        } catch (error) {
            console.error('[Green Atlas Database] Row action failed:', error);
            announce('The specimen action could not be completed.');
        }
    });

    btnPrevPage?.addEventListener('click', () => {
        if (currentPage <= 1) return;
        currentPage -= 1;
        renderPaginatedTable();
        document.querySelector('.density-table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    btnNextPage?.addEventListener('click', () => {
        if (currentPage >= Math.ceil(currentFilteredRecords.length / PAGE_SIZE)) return;
        currentPage += 1;
        renderPaginatedTable();
        document.querySelector('.density-table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ----------------------------------------------------
    // Specimen inspection modal
    // ----------------------------------------------------
    function openSpecimenModal(item) {
        if (!cardModal || !item) return;
        const coords = getCoords(item);

        const heading = document.getElementById('modal-card-botanical');
        if (heading) {
            heading.replaceChildren();
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-seedling';
            icon.setAttribute('aria-hidden', 'true');
            heading.append(icon, document.createTextNode(` ${displayText(item.botanicalName)}`));
        }

        setText(document.getElementById('modal-card-id'), displayText(item.id));
        setText(document.getElementById('modal-card-common'), displayText(item.commonName));
        const dogri = displayText(item.dogriName, '');
        setText(document.getElementById('modal-card-dogri'), dogri ? `Dogri: ${dogri}` : 'Dogri: Not recorded');
        setText(document.getElementById('modal-card-family'), displayText(item.family));
        setText(document.getElementById('modal-card-habit'), displayText(item.habit));
        setText(document.getElementById('modal-card-zone'), displayText(item.zone));
        setText(document.getElementById('modal-card-elevation'), displayText(item.elevation));
        setText(document.getElementById('modal-card-coords'), coords
            ? `${coords[0].toFixed(5)}° N, ${coords[1].toFixed(5)}° E`
            : 'Not georeferenced');
        setText(document.getElementById('modal-card-iucn'), displayIucn(item.iucn));
        setText(document.getElementById('modal-card-phenology'), displayPhenology(item.phenology));
        setText(document.getElementById('modal-card-notes'), displayText(item.notes));

        const toxicity = document.getElementById('modal-card-toxicity');
        if (toxicity) {
            toxicity.className = `hazard-chip ${toxicityClass(item.toxicity)}`;
            toxicity.textContent = toxicityLabel(item.toxicity);
        }

        const photoContainer = document.getElementById('modal-card-photo-container');
        const photo = document.getElementById('modal-card-photo');
        if (photoContainer && photo) {
            if (item.photo) {
                photo.onerror = () => { photoContainer.hidden = true; };
                photo.src = item.photo;
                photoContainer.hidden = false;
            } else {
                photo.onerror = null;
                photo.removeAttribute('src');
                photoContainer.hidden = true;
            }
        }

        const mapLink = document.getElementById('modal-card-maplink');
        if (mapLink) {
            if (coords) {
                mapLink.href = `maps.html?lat=${encodeURIComponent(coords[0])}&lng=${encodeURIComponent(coords[1])}&id=${encodeURIComponent(item.id)}`;
                mapLink.classList.remove('is-disabled');
                mapLink.removeAttribute('aria-disabled');
                mapLink.removeAttribute('tabindex');
                mapLink.innerHTML = '<i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> GIS Map';
            } else {
                mapLink.removeAttribute('href');
                mapLink.classList.add('is-disabled');
                mapLink.setAttribute('aria-disabled', 'true');
                mapLink.setAttribute('tabindex', '-1');
                mapLink.innerHTML = '<i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> No map coordinates';
            }
        }

        const printButton = document.getElementById('modal-card-printbtn');
        if (printButton) printButton.onclick = () => printBotanicalPlaque(item);

        showModal(cardModal);
    }

    btnCloseCardModal?.addEventListener('click', () => hideModal(cardModal));
    cardModal?.addEventListener('click', event => {
        if (event.target === cardModal) hideModal(cardModal);
    });
    btnCloseQrModal?.addEventListener('click', () => hideModal(qrModal));
    qrModal?.addEventListener('click', event => {
        if (event.target === qrModal) hideModal(qrModal);
    });

    // ----------------------------------------------------
    // Filters and search
    // ----------------------------------------------------
    function getVerifiedCount() {
        return getSafeRecords().filter(record => record.verified === true).length;
    }

    function updateVerifiedToggle() {
        if (!btnToggleVerified) return;
        btnToggleVerified.classList.toggle('is-active', showVerifiedOnly);
        btnToggleVerified.setAttribute('aria-pressed', String(showVerifiedOnly));
        btnToggleVerified.innerHTML = showVerifiedOnly
            ? `<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Showing Verified (${getVerifiedCount()})`
            : '<i class="fa-solid fa-check-circle" aria-hidden="true"></i> Verified Only';
    }

    function populateFilterOptions() {
        const records = getSafeRecords();
        const zones = Array.from(new Set(records.map(record => String(record.zone || '').trim()).filter(Boolean)))
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        const habits = Array.from(new Set(records.map(record => String(record.habit || '').trim()).filter(Boolean)))
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        const hasUnassigned = records.some(record => !String(record.zone || '').trim());

        const zoneOptions = [{ value: 'ALL', label: 'All Ecological Sectors' }]
            .concat(zones.map(zone => ({ value: zone, label: zone })));
        if (hasUnassigned) zoneOptions.push({ value: 'UNMAPPED', label: 'Unmapped / No Sector' });
        setSelectOptions(filterZone, zoneOptions);

        setSelectOptions(filterHabit, [{ value: 'ALL', label: 'All Habits' }]
            .concat(habits.map(habit => ({ value: habit, label: habit }))));

        const formZones = zones.length ? zones : ['Pine Ridge Belt', 'Academic Avenue', 'Lower Scrublands', 'Ravine Corridors'];
        const firstZonePopulate = !inputZone?.dataset.initialized;
        if (firstZonePopulate && inputZone) inputZone.value = '';
        setSelectOptions(inputZone, [{ value: '', label: 'Select ecological sector…', disabled: true, selected: true }]
            .concat(formZones.map(zone => ({ value: zone, label: zone }))));
        if (inputZone) inputZone.dataset.initialized = 'true';

        const formHabits = habits.length ? habits : ['Tree', 'Shrub', 'Herb', 'Climber'];
        const firstHabitPopulate = !inputHabit?.dataset.initialized;
        if (firstHabitPopulate && inputHabit) inputHabit.value = '';
        setSelectOptions(inputHabit, [{ value: '', label: 'Select plant habit…', disabled: true, selected: true }]
            .concat(formHabits.map(habit => ({ value: habit, label: habit }))));
        if (inputHabit) inputHabit.dataset.initialized = 'true';
    }

    function recordMatchesQuery(item, query) {
        if (!query) return true;
        const haystack = normalizeText([
            item.id,
            item.botanicalName,
            item.commonName,
            item.dogriName,
            item.family,
            item.habit,
            item.zone,
            item.elevation,
            item.toxicity,
            toxicityLabel(item.toxicity),
            item.iucn,
            item.phenology,
            item.notes,
            item.toxicAgent,
            item.firstAid
        ].filter(Boolean).join(' '));
        return haystack.includes(query);
    }

    function applyFilters() {
        const query = normalizeText(searchInput ? searchInput.value : '');
        const selectedZone = filterZone ? filterZone.value : 'ALL';
        const selectedHabit = filterHabit ? filterHabit.value : 'ALL';
        const selectedToxicity = filterToxicity ? filterToxicity.value : 'ALL';

        currentFilteredRecords = getSafeRecords().filter(item => {
            const matchesSearch = recordMatchesQuery(item, query);
            const itemZone = String(item.zone || '').trim();
            const matchesZone = selectedZone === 'ALL' ||
                (selectedZone === 'UNMAPPED' ? !itemZone : itemZone === selectedZone);
            const matchesHabit = selectedHabit === 'ALL' || item.habit === selectedHabit;
            const itemToxicity = normalizeToxicity(item.toxicity);
            const matchesToxicity = selectedToxicity === 'ALL' ||
                (selectedToxicity === 'Unknown' ? itemToxicity === 'Unknown' : itemToxicity === selectedToxicity);
            const matchesVerified = !showVerifiedOnly || item.verified === true;

            return matchesSearch && matchesZone && matchesHabit && matchesToxicity && matchesVerified;
        });

        renderPaginatedTable();
    }

    function resetAllFilters() {
        if (searchInput) searchInput.value = '';
        if (filterZone) filterZone.value = 'ALL';
        if (filterHabit) filterHabit.value = 'ALL';
        if (filterToxicity) filterToxicity.value = 'ALL';
        showVerifiedOnly = false;
        updateVerifiedToggle();
        currentPage = 1;
        applyFilters();
        if (filtersDropdown) filtersDropdown.hidden = true;
        btnFilters?.setAttribute('aria-expanded', 'false');
        searchInput?.focus();
        announce('Filters reset.');
    }

    searchInput?.addEventListener('input', () => { currentPage = 1; applyFilters(); });
    filterZone?.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    filterHabit?.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    filterToxicity?.addEventListener('change', () => { currentPage = 1; applyFilters(); });

    btnToggleVerified?.addEventListener('click', () => {
        showVerifiedOnly = !showVerifiedOnly;
        updateVerifiedToggle();
        currentPage = 1;
        applyFilters();
    });

    btnReset?.addEventListener('click', resetAllFilters);

    // ----------------------------------------------------
    // Field observation intake
    // ----------------------------------------------------
    function setFormStatus(type, message) {
        if (!formStatus) return;
        formStatus.hidden = !message;
        formStatus.className = `form-status${type ? ` is-${type}` : ''}`;
        formStatus.textContent = message || '';
    }

    function resetDuplicateState() {
        pendingDuplicateConfirmation = false;
        if (duplicateWarning) {
            duplicateWarning.hidden = true;
            duplicateWarning.textContent = '';
        }
    }

    function resetObservationForm() {
        formAddSpecimen?.reset();
        highResPhotoBase64 = '';
        if (previewWrap) previewWrap.hidden = true;
        if (previewImg) previewImg.removeAttribute('src');
        setPhotoStatus('', '');
        setFormStatus('', '');
        resetDuplicateState();
        setGpsStatus('neutral', 'Manual entry active or click "Get Current GPS" during field sampling.');
        if (btnSubmitObservation) {
            btnSubmitObservation.disabled = false;
            btnSubmitObservation.innerHTML = '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Commit Observation';
        }
        if (btnCancelModal) btnCancelModal.disabled = false;
        formAddSpecimen?.setAttribute('aria-busy', 'false');
        isSubmitting = false;
    }

    function setSubmitting(active) {
        isSubmitting = active;
        if (btnSubmitObservation) {
            btnSubmitObservation.disabled = active;
            btnSubmitObservation.innerHTML = active
                ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Saving…'
                : '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Commit Observation';
        }
        if (btnCancelModal) btnCancelModal.disabled = active;
        formAddSpecimen?.setAttribute('aria-busy', String(active));
    }

    function readObservationForm() {
        return {
            botanicalName: inputBotanical ? inputBotanical.value.trim() : '',
            commonName: inputCommon ? inputCommon.value.trim() : '',
            dogriName: inputDogri ? inputDogri.value.trim() : '',
            family: inputFamily ? inputFamily.value.trim() : '',
            habit: inputHabit ? inputHabit.value : '',
            zone: inputZone ? inputZone.value : '',
            toxicity: inputToxicity ? inputToxicity.value : '',
            iucn: inputIucn ? inputIucn.value : '',
            elevation: inputElevation ? inputElevation.value.trim() : '',
            phenology: inputPhenology ? inputPhenology.value.trim() : '',
            lat: inputLat ? parseFloat(inputLat.value) : NaN,
            lng: inputLng ? parseFloat(inputLng.value) : NaN,
            notes: inputNotes ? inputNotes.value.trim() : '',
            photo: highResPhotoBase64 || null
        };
    }

    function validateObservation(entry) {
        if (!entry.botanicalName) return 'Enter the botanical name before saving.';
        if (!entry.commonName) return 'Enter the common name before saving.';
        if (!entry.family) return 'Enter the botanical family before saving.';
        if (!entry.habit) return 'Select a plant habit before saving.';
        if (!entry.zone) return 'Select an ecological sector before saving.';
        if (!entry.toxicity) return 'Select a toxicity assessment before saving.';
        if (!Number.isFinite(entry.lat) || !Number.isFinite(entry.lng)) {
            return 'Enter valid latitude and longitude before saving.';
        }
        if (entry.lat < -90 || entry.lat > 90 || entry.lng < -180 || entry.lng > 180) {
            return 'Latitude must be between -90 and 90, and longitude between -180 and 180.';
        }
        if (entry.lat < CAMPUS_BOUNDS.minLat || entry.lat > CAMPUS_BOUNDS.maxLat ||
            entry.lng < CAMPUS_BOUNDS.minLng || entry.lng > CAMPUS_BOUNDS.maxLng) {
            return 'These coordinates are outside the known campus extent. Check the GPS fix or enter the correct location before saving.';
        }
        if (entry.photo && entry.photo.length > 4500000) {
            return 'The compressed photo is too large to store. Choose a smaller image.';
        }
        return null;
    }

    function distanceMeters(a, b) {
        const toRadians = degrees => (degrees * Math.PI) / 180;
        const earthRadius = 6371000;
        const dLat = toRadians(b[0] - a[0]);
        const dLng = toRadians(b[1] - a[1]);
        const lat1 = toRadians(a[0]);
        const lat2 = toRadians(b[0]);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
        return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(h)));
    }

    function findPotentialDuplicates(entry) {
        const targetName = normalizeText(entry.botanicalName);
        return getSafeRecords().filter(record => {
            if (normalizeText(record.botanicalName) !== targetName) return false;
            const recordCoords = getCoords(record);
            if (recordCoords) {
                return distanceMeters(recordCoords, [entry.lat, entry.lng]) < 50;
            }
            return normalizeText(record.zone) === normalizeText(entry.zone);
        });
    }

    function openObservationModal() {
        if (!observationModal) return;
        resetObservationForm();
        showModal(observationModal);
        inputBotanical?.focus();
    }

    function closeObservationModal() {
        hideModal(observationModal);
    }

    btnOpenModal?.addEventListener('click', openObservationModal);
    btnCloseModal?.addEventListener('click', closeObservationModal);
    btnCancelModal?.addEventListener('click', closeObservationModal);
    observationModal?.addEventListener('click', event => {
        if (event.target === observationModal) closeObservationModal();
    });

    formAddSpecimen?.addEventListener('input', resetDuplicateState);
    formAddSpecimen?.addEventListener('change', resetDuplicateState);

    formAddSpecimen?.addEventListener('submit', async event => {
        event.preventDefault();
        if (isSubmitting) return;

        const entry = readObservationForm();
        const validationError = validateObservation(entry);
        if (validationError) {
            setFormStatus('error', validationError);
            return;
        }

        const duplicates = findPotentialDuplicates(entry);
        if (duplicates.length > 0 && !pendingDuplicateConfirmation) {
            pendingDuplicateConfirmation = true;
            if (duplicateWarning) {
                duplicateWarning.hidden = false;
                duplicateWarning.textContent = `Possible duplicate: ${displayText(duplicates[0].botanicalName)} (${displayText(duplicates[0].id)}) is already recorded nearby or in the same sector. Submit again only if this is a separate observation.`;
            }
            setFormStatus('warning', 'Review the possible duplicate warning before committing.');
            return;
        }

        if (typeof logObservation !== 'function') {
            setFormStatus('error', 'The data service is unavailable. The observation was not saved.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await logObservation(entry);
            if (!result || result.ok !== true) {
                setFormStatus('error', result?.error || 'The observation could not be saved.');
                return;
            }

            setFormStatus('success', `Observation ${result.record.id} saved to persistent storage.`);
            announce(`Observation ${result.record.id} saved.`);
            currentPage = 1;
            applyFilters();
            window.setTimeout(() => closeObservationModal(), 900);
        } catch (error) {
            console.error('[Green Atlas Database] Observation save failed:', error);
            setFormStatus('error', 'The observation could not be saved. Check browser storage permissions and retry.');
        } finally {
            setSubmitting(false);
        }
    });

    // ----------------------------------------------------
    // CSV export
    // ----------------------------------------------------
    function exportToCSV(records, filename) {
        if (!Array.isArray(records) || records.length === 0) {
            announce('No records are available to export.');
            return;
        }

        const headers = [
            'Specimen ID', 'Botanical Name', 'Common English Name', 'Dogri Vernacular',
            'Family', 'Habit', 'Sector Zone', 'Elevation', 'Toxicity', 'Verified Status',
            'Latitude (GPS)', 'Longitude (GPS)', 'IUCN Status', 'Phenology', 'Field Notes', 'Portal URL'
        ];

        const rows = records.map(record => {
            const coords = getCoords(record);
            return [
                csvCell(record.id),
                csvCell(displayText(record.botanicalName)),
                csvCell(displayText(record.commonName)),
                csvCell(displayText(record.dogriName)),
                csvCell(displayText(record.family)),
                csvCell(displayText(record.habit)),
                csvCell(displayText(record.zone)),
                csvCell(displayText(record.elevation)),
                csvCell(toxicityLabel(record.toxicity)),
                csvCell(record.verified === true ? 'Yes' : 'No'),
                csvCell(coords ? coords[0].toFixed(5) : '', false),
                csvCell(coords ? coords[1].toFixed(5) : '', false),
                csvCell(displayIucn(record.iucn)),
                csvCell(displayPhenology(record.phenology)),
                csvCell(displayText(record.notes)),
                csvCell(getSpecimenDeepLink(record.id) || '')
            ];
        });

        const csv = '\uFEFF' + [
            headers.map(header => csvCell(header, false)).join(','),
            ...rows.map(row => row.join(','))
        ].join('\r\n');

        downloadBlob(filename, csv, 'text/csv;charset=utf-8;');
        announce(`Exported ${records.length} records to CSV.`);
    }

    btnExportCsv?.addEventListener('click', () => {
        exportToCSV(
            getSafeRecords(),
            `SMVDU_Green_Atlas_Catalog_${new Date().toISOString().slice(0, 10)}.csv`
        );
    });

    btnExportVerifiedCsv?.addEventListener('click', () => {
        const verifiedRecords = getSafeRecords().filter(record => record.verified === true);
        exportToCSV(
            verifiedRecords,
            `SMVDU_Green_Atlas_Verified_Records_${new Date().toISOString().slice(0, 10)}.csv`
        );
    });

    // ----------------------------------------------------
    // 4x6 botanical plaque print generator
    // ----------------------------------------------------
    function printBotanicalPlaque(item) {
        const printStage = document.getElementById('plaque-print-stage');
        if (!printStage || !item) return;

        const deepLink = getSpecimenDeepLink(item.id);
        const qr = deepLink ? buildQrCode(deepLink, 300) : null;
        const coords = getCoords(item);
        const gpsLabel = coords
            ? `${coords[0].toFixed(5)}°N, ${coords[1].toFixed(5)}°E`
            : 'Not georeferenced';
        let notes = displayText(item.notes);
        if (notes.length > 360) notes = `${notes.slice(0, 357)}…`;

        const qrMarkup = qr
            ? `<img src="${escapeHtml(qr.src)}" alt="QR code for ${escapeHtml(item.id)}" data-qr-target="${escapeHtml(deepLink)}" style="width: 85px; height: 85px; border: 1px solid #1e4620; padding: 2px;">
               <div class="plaque-qr-caption">SCAN TELEMETRY</div>`
            : `<div class="plaque-qr-unavailable">QR UNAVAILABLE<br><span>Open this site over HTTP(S)</span></div>`;

        printStage.innerHTML = `
            <div class="plaque-outer-frame" data-print-record-id="${escapeHtml(item.id)}">
                <div class="plaque-header-sub">
                    <span>SMVDU CAMPUS FLORA PROJECT &bull; FIELD HERBARIUM ARCHIVE</span>
                    <span>${escapeHtml(displayText(item.id))}</span>
                </div>

                <div class="plaque-identity-row">
                    <div class="plaque-identity-text">
                        <div class="plaque-botanical-name">${escapeHtml(displayText(item.botanicalName))}</div>
                        <div class="plaque-vernacular">
                            <strong>Common:</strong> ${escapeHtml(displayText(item.commonName))}
                            ${item.dogriName ? ` &bull; <strong>Dogri:</strong> ${escapeHtml(displayText(item.dogriName))}` : ''}
                        </div>
                    </div>
                    <div class="plaque-qr-box">
                        ${qrMarkup}
                    </div>
                </div>

                <div class="plaque-meta-grid">
                    <div><strong>FAMILY:</strong> ${escapeHtml(displayText(item.family))}</div>
                    <div><strong>HABIT:</strong> ${escapeHtml(displayText(item.habit))}</div>
                    <div><strong>SECTOR:</strong> ${escapeHtml(displayText(item.zone))}</div>
                    <div><strong>ELEVATION:</strong> ${escapeHtml(displayText(item.elevation))}</div>
                    <div><strong>GPS:</strong> ${escapeHtml(gpsLabel)}</div>
                    <div><strong>TOXICITY:</strong> ${escapeHtml(toxicityLabel(item.toxicity))}</div>
                    <div><strong>IUCN:</strong> ${escapeHtml(displayIucn(item.iucn))}</div>
                    <div><strong>STATUS:</strong> ${item.verified === true ? 'Verified taxon record' : 'Not marked verified'}</div>
                </div>

                <div class="plaque-notes">
                    <strong>ETHNOBOTANICAL &amp; FIELD NOTES:</strong><br>
                    ${escapeHtml(notes)}
                </div>

                <div class="plaque-footer">
                    <span>SHRI MATA VAISHNO DEVI UNIVERSITY, KATRA</span>
                    <span>DYD BATCH OF 2026 &bull; GIS CAMPUS AUDIT</span>
                </div>
            </div>
        `;

        document.body.classList.add('printing-plaque');
        const cleanup = () => {
            document.body.classList.remove('printing-plaque');
            printStage.innerHTML = '';
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);

        const qrImg = printStage.querySelector('img');
        let printed = false;
        const go = () => {
            if (printed) return;
            printed = true;
            window.setTimeout(() => window.print(), 150);
        };
        if (qrImg && !qrImg.complete) {
            qrImg.addEventListener('load', go, { once: true });
            qrImg.addEventListener('error', go, { once: true });
            window.setTimeout(go, 3500);
        } else {
            go();
        }
    }

    // ----------------------------------------------------
    // Deep links: ?q=ID and ?search=BotanicalName
    // ----------------------------------------------------
    function handleDeepLink() {
        if (deepLinkHandled) return;
        const params = new URLSearchParams(window.location.search);
        const queryId = params.get('q');
        if (!queryId) return;

        const match = getSafeRecords().find(record =>
            normalizeText(record.id) === normalizeText(queryId)
        );
        if (!match) {
            if (searchInput) searchInput.value = queryId;
            currentPage = 1;
            applyFilters();
            return;
        }

        deepLinkHandled = true;
        if (searchInput) searchInput.value = match.id;
        currentPage = 1;
        applyFilters();
        window.setTimeout(() => openSpecimenModal(match), 250);
    }

    // ----------------------------------------------------
    // Initialization
    // ----------------------------------------------------
    const initialParams = new URLSearchParams(window.location.search);
    const initialSearch = initialParams.get('search');
    if (initialSearch && searchInput) searchInput.value = initialSearch;

    checkStorageAvailability();
    populateFilterOptions();
    updateVerifiedToggle();
    applyFilters();
    handleDeepLink();

    window.addEventListener('smvdu:dataready', () => {
        populateFilterOptions();
        updateVerifiedToggle();
        applyFilters();
        handleDeepLink();
    });

    window.addEventListener('smvdu:datachanged', () => {
        populateFilterOptions();
        updateVerifiedToggle();
        applyFilters();
    });
});
