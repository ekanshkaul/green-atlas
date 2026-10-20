/**
 * SMVDU Green Atlas: Toxicity & Safety Controller (safety.js)
 * Clinical Hazard Tier Filtering, First-Aid Action Rendering,
 * and Dynamic Telemetry Tile Synchronization.
 */

document.addEventListener('DOMContentLoaded', () => {
    const cardsContainer = document.getElementById('hazard-cards-stage');
    const searchInput = document.getElementById('safety-search');
    const resultsSummary = document.getElementById('safety-results-summary');

    // Filter Buttons
    const btnTierAll = document.getElementById('btn-tier-all');
    const btnTierSafe = document.getElementById('btn-tier-safe');
    const btnTierIrritant = document.getElementById('btn-tier-irritant');
    const btnTierToxic = document.getElementById('btn-tier-toxic');
    const btnTierUnknown = document.getElementById('btn-tier-unknown');
    const tierButtons = [btnTierAll, btnTierSafe, btnTierIrritant, btnTierToxic, btnTierUnknown];

    // Telemetry Targets
    const elStatSafe = document.getElementById('safety-stat-safe');
    const elStatIrritant = document.getElementById('safety-stat-irritant');
    const elStatToxic = document.getElementById('safety-stat-toxic');
    const elStatUnknown = document.getElementById('safety-stat-unknown');

    let activeTier = 'ALL';

    function normalizeToxicity(value) {
        const normalized = String(value == null ? '' : value).trim().toLowerCase().replace(/[\s_-]+/g, ' ');
        if (['safe', 'non toxic', 'non-toxic', 'listed non-toxic'].includes(normalized)) return 'Safe';
        if (['mild irritant', 'irritant', 'allergenic'].includes(normalized)) return 'Mild Irritant';
        if (['toxic', 'severe toxic', 'highly toxic'].includes(normalized)) return 'Toxic';
        return 'Unknown';
    }

    function getBaselineCounts() {
        if (typeof getCampusTelemetry === 'function') {
            const telemetry = getCampusTelemetry();
            if (telemetry && typeof telemetry.safeCount === 'number') {
                return {
                    safe: telemetry.safeCount,
                    irritant: telemetry.irritantCount,
                    toxic: telemetry.toxicCount,
                    unknown: typeof telemetry.unknownCount === 'number' ? telemetry.unknownCount : 0
                };
            }
        }

        const flora = (typeof getFloraData === 'function') ? getFloraData() : [];
        let safe = 0, irritant = 0, toxic = 0, unknown = 0;
        flora.forEach(item => {
            const tier = normalizeToxicity(item.toxicity);
            if (tier === 'Toxic') toxic++;
            else if (tier === 'Mild Irritant') irritant++;
            else if (tier === 'Safe') safe++;
            else unknown++;
        });

        return { safe, irritant, toxic, unknown };
    }

    // ==========================================
    // 1. Dynamic Telemetry Counter Synchronization
    // ==========================================
    function updateSafetyCounters() {
        const counts = getBaselineCounts();

        if (elStatSafe) elStatSafe.textContent = counts.safe;
        if (elStatIrritant) elStatIrritant.textContent = counts.irritant;
        if (elStatToxic) elStatToxic.textContent = counts.toxic;
        if (elStatUnknown) elStatUnknown.textContent = counts.unknown;
    }

    // ==========================================
    // 2. Hazard Cards Renderer
    // ==========================================
    function getCoords(item) {
        const candidates = [
            [item?.latitude, item?.longitude],
            [item?.coords?.[0], item?.coords?.[1]],
            [item?.lat, item?.lng]
        ];

        for (const [rawLat, rawLng] of candidates) {
            const lat = parseFloat(rawLat);
            const lng = parseFloat(rawLng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                return [lat, lng];
            }
        }
        return null;
    }

    function renderHazardCards(records) {
        if (!cardsContainer) return;

        const openRecordIds = new Set(
            Array.from(cardsContainer.querySelectorAll('details[open]'))
                .map(details => details.closest('.hazard-profile-card')?.dataset.recordId)
                .filter(Boolean)
        );

        cardsContainer.innerHTML = '';

        updateResultsSummary(records);

        if (!records || records.length === 0) {
            cardsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--surface); border: 1px dashed var(--border-color); border-radius: 8px;">
                    <i class="fa-solid fa-shield-halved" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 0.5rem; display: block;"></i>
                    <h3 style="font-size: 1.1rem; color: var(--text-dark);">No Corresponding Species Found</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Adjust your search term or select another toxicity tier.</p>
                </div>
            `;
            return;
        }

        records.forEach(item => {
            const tier = normalizeToxicity(item.toxicity);
            const isToxic = tier === 'Toxic';
            const isIrritant = tier === 'Mild Irritant';
            const isSafe = tier === 'Safe';

            let borderClass = 'border-safe';
            let chipClass = 'hazard-safe';
            let iconClass = 'fa-circle-check';
            let tierLabel = 'Listed Non-Toxic';

            if (isToxic) {
                borderClass = 'border-toxic';
                chipClass = 'hazard-toxic';
                iconClass = 'fa-triangle-exclamation';
                tierLabel = 'Toxic';
            } else if (isIrritant) {
                borderClass = 'border-irritant';
                chipClass = 'hazard-irritant';
                iconClass = 'fa-circle-exclamation';
                tierLabel = 'Mild Irritant';
            } else if (!isSafe) {
                borderClass = 'border-unknown';
                chipClass = 'hazard-unknown';
                iconClass = 'fa-circle-question';
                tierLabel = 'Unknown / Not assessed';
            }

            const card = document.createElement('article');
            card.className = `hazard-profile-card ${borderClass}`;
            card.dataset.recordId = String(item.id == null ? '' : item.id);
            card.dataset.tier = tier;

            const coords = getCoords(item);
            const zoneLabel = item.zone || 'Unmapped';
            const recordId = item.id == null ? '' : item.id;
            const mapAction = coords
                ? `<a href="maps.html?lat=${encodeURIComponent(coords[0])}&lng=${encodeURIComponent(coords[1])}&id=${encodeURIComponent(recordId)}" class="btn-action btn-outline hazard-map-link" style="font-size: 0.72rem; padding: 0.3rem 0.65rem;">
                        <i class="fa-solid fa-map-pin" aria-hidden="true"></i> View Habitat Map
                    </a>`
                : `<span class="font-mono" style="font-size: 0.72rem; color: var(--text-muted);">
                        <i class="fa-solid fa-map-pin" aria-hidden="true"></i> Not georeferenced
                    </span>`;

            const isOpen = openRecordIds.has(String(recordId));

            card.innerHTML = `
                <details class="hazard-card-details"${isOpen ? ' open' : ''}>
                    <summary class="hazard-card-summary">
                        <span class="hazard-summary-text">
                            <span class="hazard-botanical-name">${escapeHtml(item.botanicalName)}</span>
                            <span class="hazard-summary-meta">
                                ${escapeHtml(item.commonName)}${item.dogriName ? ` &bull; <span class="hazard-dogri-name">${escapeHtml(item.dogriName)}</span>` : ''}
                            </span>
                        </span>
                        <span class="hazard-chip ${chipClass}"><i class="fa-solid ${iconClass}" aria-hidden="true"></i> ${tierLabel}</span>
                        <i class="fa-solid fa-chevron-down hazard-summary-chevron" aria-hidden="true"></i>
                    </summary>
                    <div class="hazard-card-body">
                        <div class="toxin-agent-box">
                            <div class="toxin-agent-label">Primary Active Compound / Hazard</div>
                            <div class="toxin-agent-val">${escapeHtml(item.toxicAgent && String(item.toxicAgent).trim() ? item.toxicAgent : 'Not recorded in the dataset.')}</div>
                        </div>

                        <div class="first-aid-box">
                            <strong><i class="fa-solid fa-notes-medical" aria-hidden="true"></i> Field Action</strong>
                            ${escapeHtml(item.firstAid && String(item.firstAid).trim() ? item.firstAid : 'No field-response note is recorded. Seek qualified medical advice; do not infer treatment from this page.')}
                        </div>

                        <div class="hazard-card-footer">
                            <span class="font-mono" style="font-size: 0.74rem; color: var(--text-muted);"><span class="hazard-record-id">${escapeHtml(recordId)}</span> <span class="hazard-summary-sep">&bull;</span> <i class="fa-solid fa-compass" aria-hidden="true"></i> Zone: ${escapeHtml(zoneLabel)}</span>
                            ${mapAction}
                        </div>
                    </div>
                </details>
            `;

            cardsContainer.appendChild(card);
        });
    }

    function updateResultsSummary(records) {
        if (!resultsSummary) return;

        const total = (typeof getFloraData === 'function') ? getFloraData().length : records.length;
        const mapped = records.filter(item => getCoords(item)).length;
        const countText = records.length === total
            ? `${total} records`
            : `Showing ${records.length} of ${total} records`;

        resultsSummary.textContent = `${countText} · ${mapped} with map coordinates.`;
    }

    // ==========================================
    // 3. Dynamic Filter Logic
    // ==========================================
    function applySafetyFilters() {
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const allRecords = (typeof getFloraData === 'function') ? getFloraData() : [];

        const filtered = allRecords.filter(item => {
            const tier = normalizeToxicity(item.toxicity);
            const matchesTier = (activeTier === 'ALL' || tier === activeTier);
            const matchesSearch = !query ||
                (item.botanicalName && item.botanicalName.toLowerCase().includes(query)) ||
                (item.commonName && item.commonName.toLowerCase().includes(query)) ||
                (item.dogriName && item.dogriName.toLowerCase().includes(query)) ||
                (item.toxicAgent && item.toxicAgent.toLowerCase().includes(query));

            return matchesTier && matchesSearch;
        });

        renderHazardCards(filtered);
    }

    function setTier(tier, activeBtn) {
        activeTier = tier;
        tierButtons.forEach(btn => {
            if (!btn) return;
            const isActive = btn === activeBtn;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        applySafetyFilters();
    }

    btnTierAll?.addEventListener('click', () => setTier('ALL', btnTierAll));
    btnTierSafe?.addEventListener('click', () => setTier('Safe', btnTierSafe));
    btnTierIrritant?.addEventListener('click', () => setTier('Mild Irritant', btnTierIrritant));
    btnTierToxic?.addEventListener('click', () => setTier('Toxic', btnTierToxic));
    btnTierUnknown?.addEventListener('click', () => setTier('Unknown', btnTierUnknown));

    searchInput?.addEventListener('input', applySafetyFilters);

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Initial Execution
    updateSafetyCounters();
    applySafetyFilters();

    // IndexedDB hydration and local observations can change the dataset.
    window.addEventListener('smvdu:dataready', () => {
        updateSafetyCounters();
        applySafetyFilters();
    });
    window.addEventListener('smvdu:datachanged', () => {
        updateSafetyCounters();
        applySafetyFilters();
    });
});

/* =========================================================
   MEDICAL CENTRE CALL HANDLER (Ext. 2222)
   ========================================================= */
(() => {
    const medicalCentreCall = document.getElementById('medical-centre-call');
    if (!medicalCentreCall) return;

    medicalCentreCall.addEventListener('click', () => {
        if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            console.info('Medical Centre: +91 1991 285524 — Extension 2222');
        }
    });
})();