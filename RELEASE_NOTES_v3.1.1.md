# SMVDU Green Atlas — Release Notes

## Version 3.1.1

| | |
|---|---|
| **Release date** | 19 October 2026 |
| **Previous baseline** | 2.3.0 (SMVDU Floris) |
| **Release type** | Branding, data, usability, accessibility and security update |
| **Platform** | Static HTML / CSS / JavaScript progressive web app (PWA), hosted on GitHub Pages |
| **Status** | Release candidate, verified locally |

---

## Contents

1. [Overview](#1-overview)
2. [Release Metrics](#2-release-metrics)
3. [Branding and Visual Identity](#3-branding-and-visual-identity)
4. [Home Page](#4-home-page)
5. [Flora Database](#5-flora-database)
6. [Vegetation GIS Maps](#6-vegetation-gis-maps)
7. [Sustainability and Ecological Audit](#7-sustainability-and-ecological-audit)
8. [Toxicity and Safety](#8-toxicity-and-safety)
9. [Navigation, Responsive Design and Accessibility](#9-navigation-responsive-design-and-accessibility)
10. [Performance, PWA and Offline Support](#10-performance-pwa-and-offline-support)
11. [Security, Privacy and Data Integrity](#11-security-privacy-and-data-integrity)
12. [Technical and File-Level Changes](#12-technical-and-file-level-changes)
13. [Compatibility and Migration Notes](#13-compatibility-and-migration-notes)
14. [Verification](#14-verification)
15. [Known Limitations and Follow-Up Items](#15-known-limitations-and-follow-up-items)
16. [Deployment Checklist](#16-deployment-checklist)
17. [Release Impact](#17-release-impact)

**Change labels used in this document**

| Label | Meaning |
|---|---|
| **New** | A capability, asset, page section or safeguard added in this release |
| **Improved** | An existing capability, layout or workflow that was upgraded |
| **Fixed** | A correctness, safety or consistency problem corrected in this release |
| **Verified** | A release claim checked directly against the current assets or data |

---

## 1. Overview

This document records the functional, content, design, accessibility, security and infrastructure changes between the previous release (v2.3.0) and the current release (v3.1.1) of the SMVDU Green Atlas.

Version 3.1.1 is a consolidated release. It completes the transition from the *SMVDU Floris* identity to *SMVDU Green Atlas* and substantially expands the plant catalogue, GIS tooling, accessibility coverage and data-integrity safeguards.

The application remains fully static. No server-side component, authentication layer, database service or build step has been added.

### Highlights

- **Rebrand.** The entire site now carries the SMVDU Green Atlas identity, with a new centred green ATLAS wordmark, a refreshed home hero, and consistent titles, metadata and footer copy.
- **Larger catalogue.** Expanded from 116 to **175 taxa** across **69 documented families**, including 59 new records and 73 records carrying a verification flag.
- **Flora Database.** Rebuilt controller with verified-only filtering, a separate verified CSV export, broader search, safer observation intake and local QR generation.
- **Vegetation GIS Maps.** Rebuilt around WGS84 geodesy, with a separate campus boundary, sector deep links, fullscreen mode, a map legend, an accessible sector table and richer GeoJSON export.
- **Evidence-based research page.** Unsupported research claims were replaced with data-derived metrics, a data-scope notice, a sector composition table and a survey timetable.
- **Safer toxicity data.** A new *Unknown / Not assessed* tier replaces the assumption that missing data means *Safe* or *Least Concern*.
- **Accessibility.** Skip links, ARIA state management, keyboard support, focus-visible styles, reduced-motion handling, responsive table guidance and modal focus trapping.
- **Security.** Content Security Policy, referrer policy and Subresource Integrity for third-party assets, while remaining compatible with GitHub Pages.
- **Assets and offline support.** Full PWA icon set, local QR library, master CSV and verified XLSX datasheets, and an updated service-worker cache (v3.1.1).

---

## 2. Release Metrics

| Metric | v2.3.0 | v3.1.1 |
|---|---|---|
| Catalogue records | 116 | **175** |
| New records | — | 59 (FL-117 to FL-175) |
| Documented families | 60 | **69** |
| Verified records | Not tracked | **73** |
| Georeferenced records | 116 | 116 |
| Toxicity tiers | Safe, Irritant, Toxic | Safe, Irritant, Toxic, **Unknown** |
| Sector coverage | 4 sectors | 4 sectors + Unassigned |
| Downloadable datasets | None | Master CSV + verified XLSX |
| PWA icon assets | Manifest references only | 10 icon assets added |
| Runtime QR library | CDN `qrcode-generator` | Local `js/qrcode.min.js` |
| Page count | 5 | 5 |

### Seed-data distribution (v3.1.1)

| Sector | Records |
|---|---|
| Pine Ridge Belt | 25 |
| Academic Avenue | 30 |
| Lower Scrublands | 30 |
| Ravine Corridors | 31 |
| Unassigned | 59 |
| **Total** | **175** |

| Toxicity label | Records |
|---|---|
| Safe | 140 |
| Mild Irritant | 23 |
| Toxic | 12 |
| Unknown | 0 |

**Notes**

- The 59 verified-datasheet additions account for the *Unassigned* group, as those records carry neither sector nor coordinate assignments.
- The observation form and filters support *Unknown / Not assessed*, although the seed catalogue contains no such records.
- The v2.3.0 interface displayed "50+" families; its dataset contained 60 unique family values. v3.1.1 contains 69.

---

## 3. Branding and Visual Identity

### New: SMVDU Green Atlas identity

- Renamed the platform from *SMVDU Floris* to *SMVDU Green Atlas* across page titles, headings, navigation, footer, manifest and security policy.
- Added a centred **GREEN ATLAS** wordmark to the shared header on every page.
- Retained the SMVDU prefix in the home-page hero and removed it from the compact navigation wordmark, keeping the header focused on the Atlas identity.

### New: Home-page visual hierarchy

- Replaced the single-line hero with a stacked "SMVDU / Green Atlas" title.
- Added the tagline *Identify – Document – Map – Connect*.
- Moved release metrics into a contained telemetry card.
- Refreshed the campus mission copy to match the new identity.

### Improved: Typography and iconography

- Added Playfair Display italic 600 for botanical names.
- Retained Inter for interface text and JetBrains Mono for identifiers, metrics and coordinates.
- Added a complete favicon and PWA icon set: 32×32 favicon, SVG icon, Apple touch icon, and 72, 96, 128, 144, 152, 192, 384 and 512 px assets.
- Added page-level meta descriptions to all five pages and aligned titles with the new brand.

### Improved: Light and dark themes

- Expanded theme-specific styling across navigation, cards, tables, chips, dialogs, status messages and map legends.
- Dark-theme rules increased from 51 to 77 across the stylesheet set.
- The green ATLAS wordmark uses a dedicated dark-theme colour for contrast.

---

## 4. Home Page

### New: Release-level telemetry

- Presents 175 catalogued taxa, 69 botanical families, four ecological sectors and the 780–880 m elevation range.
- Includes supporting text for 73 verified and 116 georeferenced records.

### Improved: Performance

- The home page displays release-level figures without initialising the IndexedDB data engine, reducing initial JavaScript and storage work on the landing page.

### Improved: Accessibility and navigation

- Added a skip link targeting the main content, and a main-content focus target.
- Added the shared Atlas wordmark, updated navigation labels, and `aria-current` state for the active page.
- Standardised footer links.

---

## 5. Flora Database

### New: Larger, verified catalogue

- Catalogue expanded from 116 to 175 records across 69 documented families.
- Added a per-record verification flag. 73 records are flagged as verified and visually marked in the table.
- Added a **Verified Only** quick toggle and a separate **Verified CSV** export.
- Added a **Filters** panel with dynamically populated sector and habit options.
- Added an *Unknown / Not assessed* toxicity filter.

### Improved: Search and table workflow

- Search now covers ID, botanical name, common name, Dogri name, family, habit, sector, elevation, toxicity label, IUCN status, phenology, notes, toxic agent and first-aid text.
- Search, filters and the verified-only toggle reset pagination to page 1.
- Retained 15-records-per-page pagination with accurate page, range and total counts, and disabled states at the first and last page.
- Added a clear empty state with a **Reset filters** action.
- Table rows are rendered with DOM APIs and `textContent` rather than unsafe HTML string assembly.
- Added a horizontal-scroll hint for narrow screens.

### Improved: Telemetry accuracy

- Replaced hardcoded counters with live values: *Catalogued Taxa*, *Botanical Families*, *Field Observations Logged* and *Currently Filtered*.
- Meta text now distinguishes records, verified records, mapped records and locally logged observations.
- *Field Observations Logged* counts records added beyond the catalogue, rather than every database row.

### New: Verified and safe data handling

- Missing or unrecognised toxicity is displayed as *Unknown / Not assessed*, never as *Safe*.
- Missing IUCN status is displayed as *Not recorded*, never as *Least Concern*.
- Removed generic phenology, field-note and first-aid messages that could be mistaken for real specimen observations.
- Removed fallback coordinates from observation intake. Latitude and longitude are now required, range-checked, and checked against the known campus extent.
- An observation is reported as saved only after IndexedDB confirms the write.
- Added warnings when persistent storage is unavailable, plus quota and write-failure messages.
- Added duplicate-entry warnings for matching names at nearby coordinates or in the same sector, without blocking legitimate repeat observations.
- Added photo validation: image MIME check, 10 MB input limit, canvas resize and JPEG compression before local storage.

### New: IndexedDB migration and persistence

- IndexedDB schema upgraded to **version 4**, with a verification index.
- The database name is intentionally unchanged so existing field observations survive the upgrade.
- Legacy observations using IDs 117 and above are relocated to new IDs to avoid collisions with the 59 new verified records.
- A visible migration note reports how many legacy observations were relocated.
- Observations remain local to the browser; nothing is uploaded to a server.

### Improved: CSV export

- Exports include 16 fields: Specimen ID, Botanical Name, Common English Name, Dogri Vernacular, Family, Habit, Sector Zone, Elevation, Toxicity, Verified Status, Latitude, Longitude, IUCN Status, Phenology, Field Notes and Portal URL.
- Every text field is quoted, and embedded quotes are doubled.
- Leading `=`, `+`, `-`, `@`, tab, carriage-return and line-feed characters are prefixed to prevent spreadsheet formula injection.
- Added a UTF-8 BOM so Dogri and other Unicode text opens correctly in Excel.
- Replaced large encoded data URLs with a Blob-based download and object-URL cleanup.
- Added separate **All CSV** and **Verified CSV** actions.

### Improved: QR tags and plaques

- QR generation now uses the locally vendored `qrcode-generator` 1.4.4 library. The remote QR service remains only as a fallback if local generation fails.
- QR deep links are built from the current deployment URL or an optional `green-atlas-base-url` meta value. No invented fallback URL is used.
- QR tags, specimen cards and map links consistently use the same record ID.
- Added QR download, QR print-plaque, and a clear error state when no public URL is available.
- The printable 4×6 botanical plaque includes the QR code, verified status, toxicity label, IUCN status and escaped field notes.

### New: Deep links and accessibility

- `?q=ID` deep links open the matching specimen card.
- `?search=BotanicalName` deep links prefill the catalogue search.
- Added modal focus trapping, Escape handling, inert background state and focus restoration.
- Added screen-reader announcements for search, export, save and error feedback.

---

## 6. Vegetation GIS Maps

### Improved: Modular architecture

The previous monolithic `js/maps.js` was split into two modules:

| Module | Responsibility |
|---|---|
| `js/maps-core.js` | Map initialisation, WGS84 geometry, layers and markers |
| `js/maps-controls.js` | Sector UI, accessibility, export, pinpoint and session handling |

`js/maps.js` is retained as a small documentation stub so that older references do not point to a removed resource. `maps.html` loads the two new modules directly.

### New: WGS84 geodesy and campus boundary

- Sector and campus areas and perimeters are now calculated with GeographicLib WGS84 ellipsoidal geodesy, replacing the previous approximate spherical calculation.
- Added a campus boundary polygon, distinct from the four sector polygons.
- Added a **static** badge and explanatory text clarifying that the displayed area is a working approximation derived from supplied sector extents, not a surveyed boundary.

### Improved: Map controls

- Added fullscreen mode with responsive map resizing.
- Added a retractable map legend for the campus boundary, the four sectors and toxicity marker colours.
- Added a **Clear** action for pinpoint coordinates, alongside **Copy**.
- Retained Street, Satellite and Topographic basemaps.
- Added tile-error notifications and a graceful initialisation guard when Leaflet is unavailable.
- Improved sector highlighting, sidebar state, viewport restoration and recentring behaviour.

### New: Sector navigation and accessibility

- Sector rows in the research and map tables are keyboard accessible and respond to Enter and Space.
- Added direct sector deep links: `maps.html?sector=…`
- Added accessible labels, `aria-pressed` states, focus indicators and a screen-reader-friendly sector inspector.
- Invalid sector and coordinate parameters now produce a non-blocking message instead of an uncaught error.

### Improved: Session restoration

- The previous map session is still offered for restoration, but saved values are now validated for coordinates, basemap and sector before use. An invalid zoom falls back to the default.
- Pinpoint state is restored only when the stored coordinates are valid.
- The restore notification has accessible labels, a dismiss action and a 15-second expiry.
- Session values remain under the existing `localStorage` key for backward compatibility.

### Improved: GeoJSON export

- Export now respects the currently active sector.
- Export includes flora points, sector polygons and the campus boundary, with area and perimeter properties and generation metadata. The previous export contained flora points only.

### Improved: Map popups and data handling

- Marker popups escape botanical name, common name, ID and zone values.
- Missing or unrecognised toxicity is presented as *Unknown / Not assessed* with a neutral marker and chip style.
- External attribution and specimen links use `noopener` and `noreferrer`.
- Map URLs and stored state are validated before use.

---

## 7. Sustainability and Ecological Audit

### Fixed: Unsupported research claims removed

The following hardcoded figures and labels were removed because the supplied dataset cannot substantiate them:

- 1,420 tCO₂e/year carbon sequestration estimate
- 3.18 Shannon–Wiener diversity figure
- 14.2% invasive-species pressure figure
- "PEER REVIEWED" label
- 6/6 survey-completion claim

The page no longer presents estimates as verified results without supporting abundance, biomass, survey or peer-review data.

### New: Data scope and limitations notice

- Added a prominent notice explaining that the supplied dataset contains **presence records**, not quadrat abundance counts, tree diameters, biomass equations, measured carbon values or surveyed sector areas.
- Added a note that invasive behaviour is a text flag in field notes, explicitly distinguished from a measured pressure index.
- Added a note that survey statuses reflect the project schedule and that field sheets are not included in the dataset.

### New: Data-derived metrics

- Replaced static headline figures with dynamically calculated *Catalogued Taxa*, *Families Represented*, *Verified Records* and *Survey Phases Complete*.
- Added supporting text for records, mapped and unmapped counts, and verification coverage.
- Added the recorded elevation range across supplied elevation tags.

### New: Sector composition table

- Counts by sector for records, mapped records and verified records.
- Recorded elevation ranges and habitat descriptions.
- An *Unassigned* row for verified datasheet additions without a sector or coordinates.
- Sector rows and their **Map** buttons navigate to the correct map sector. Clickable rows no longer double-trigger navigation when the dedicated Map control is used.

### New: Survey timetable

- Six-phase field survey schedule with target season, target sectors, focus phenology and status.
- Phases I–V are marked *Complete* and Phase VI is marked *In Progress*, matching the current project record in place of the previous 6/6 claim.

### New: Plant hovercards

- Accessible hovercards on survey and sector references, supporting mouse hover, keyboard focus and touch activation.
- Viewport-aware positioning, a close control, Escape-key handling and focus restoration.
- Missing records display *Species record not found*. Unavailable data is shown as *Not recorded* rather than fabricated values.

### New: Citation copying

- Added a **Copy Citation** action with a formatted institutional citation.
- Success or failure is announced through an `aria-live` status message.
- Falls back to selecting the citation text when the Clipboard API is unavailable or permission is denied, and restores the button state afterwards.

### Improved: Responsive and accessible tables

- Added horizontal-scroll hints, table captions, scoped column headers and responsive layouts.
- Added reduced-motion handling for hover and transition effects.

---

## 8. Toxicity and Safety

### New: Safety notice and limitations

- Added a prominent notice stating that the page is a project reference, **not a clinically approved protocol**.
- Clarified that a *Safe* label is a dataset label, not a guarantee of harmlessness.
- Added guidance to seek urgent professional medical care for ingestion, eye exposure, breathing difficulty, collapse or severe symptoms.
- Rewrote the field exposure table as cautious reminders rather than a clinical treatment algorithm.

### New: Unknown / Not assessed tier

- Added a fourth toxicity tier and count.
- Added an *Unknown* filter button and support for unknown values in search and card rendering.
- Missing data is no longer silently styled as *Safe*.
- Cards show *Not recorded in the dataset* when the toxic agent or first-aid note is absent.

### Improved: Dynamic counts and filters

- Safety counters are calculated from the actual dataset and update when IndexedDB hydration or local observations change the records.
- Seed-data counts: 140 Safe, 23 Mild Irritant, 12 Toxic, 0 Unknown.
- Tier buttons expose `aria-pressed` state. Search has an accessible label and a live results summary.
- Cards preserve their open/closed state when the filter or search changes.

### Improved: Hazard cards

- Converted cards to native `details` / `summary` disclosures for keyboard and screen-reader support.
- Added record ID, sector, toxin/hazard summary, field action and a map link.
- Map links appear only when valid coordinates exist. Otherwise the card states *Not georeferenced*.

### Fixed: Medical contact handling

- The listed number is displayed as **+91 1991 285524**, with the instruction to ask for extension **2222**.
- Removed automatic extension dialling from the `tel:` link. Users are told to enter the extension if prompted.
- Added a caveat that extension handling varies by device and that the number should be confirmed with the university before being relied upon in an emergency.
- Retained the desktop call-handler fallback while allowing mobile devices to open their native dialler.

---

## 9. Navigation, Responsive Design and Accessibility

### New: Sticky, scroll-aware header

- The shared header is now sticky on every page.
- At the top of the page it remains transparent and in its original position. After scrolling, it docks to the viewport edge with a frosted background, subtle border and shadow, keeping the green ATLAS wordmark visible.
- Implemented with a reserved header height and scroll-state styling to avoid layout shift and content overlap.

### New: Centred Atlas wordmark

- The green **GREEN ATLAS** wordmark sits between the menu trigger and the theme toggle.
- The SMVDU prefix is removed from the compact navigation mark.
- The wordmark has hover and focus-visible states in both light and dark themes.

### Improved: Navigation drawer

- Opens on hover for pointer devices and toggles on click or touch.
- Added hover-intent timing so the drawer closes smoothly when the pointer leaves.
- Clicking outside closes the drawer. The theme toggle is explicitly exempt, so changing theme does not close the menu.
- Added `aria-controls`, `aria-expanded`, `aria-hidden` and an animated hamburger/close icon.

### Improved: Accessibility coverage

| Measure | v2.3.0 | v3.1.1 |
|---|---|---|
| ARIA attributes across the site | 20 | **184** |
| Focus-visible style rules | 0 | **25** |
| Responsive media queries | 11 | **18** |

- Added skip links to all five pages and `aria-current` on the active navigation item.
- Added live regions for database, map, research and safety status messages.
- Added modal focus trapping, Escape handling, inert backgrounds and focus restoration.
- Added reduced-motion support for page transitions, hover effects and map controls.
- Added accessible names for icon-only controls, search fields, tables, dialogs and map regions.
- Added horizontal-scroll hints for wide data tables.

### Improved: Responsive layout

- Database toolbars, action groups and tables adapt to narrow screens.
- Map controls, fullscreen mode, sector sidebar, legend and pinpoint bar adapt to viewport size.
- Research and safety cards, survey tables, citation boxes and hovercards have small-screen layouts.
- Touch targets and table scroll containers were enlarged where needed.

---

## 10. Performance, PWA and Offline Support

### Improved: Initial-load work

- The home page no longer loads the full data engine.
- The GIS controller is split into focused modules, making map behaviour easier to maintain and load.
- QR generation no longer depends on a remote runtime library.
- Page-specific CSS remains separated so each page loads only its own styles.

### New: PWA assets

- Added 10 icon assets used by the manifest, favicon links and Apple touch icon.
- Updated the manifest name, short name and the 175-record shortcut description.
- The manifest continues to define the same five-page scope and standalone display behaviour.

### Improved: Service worker

- Cache name advanced to `smvdu-green-atlas-v3.1.1`.
- The app-shell cache now includes the icon set, the local QR library, `maps-core.js` and `maps-controls.js`.
- The external vendor cache now includes GeographicLib and no longer includes the unused `html5-qrcode` dependency.
- Navigation remains network-first with cache fallback. Static assets remain cache-first with network fallback.
- ArcGIS map tiles use a separate tile cache, restricted to the expected ArcGIS host and MapServer tile path.
- Old caches are purged on activation and the new cache is claimed immediately.
- Returning users may need one reload to receive the updated HTML, CSS and JavaScript. The cache version change prevents stale assets from persisting.

### Improved: Offline behaviour

- The five-page app shell, local scripts, styles, icons and vendor libraries are available offline after the service worker installs.
- Previously visited map tiles can be served from the tile cache.
- Observations and photos remain available locally through IndexedDB.
- A first online visit is still required to install the app shell and populate the cache.

---

## 11. Security, Privacy and Data Integrity

Version 2.3.0 had no site-wide Content Security Policy or referrer policy, and its third-party integrity coverage was incomplete. Version 3.1.1 adds the following baseline controls while remaining deployable on GitHub Pages.

### New: Content Security Policy

An enforcing `Content-Security-Policy` meta tag was added to all five HTML pages.

| Directive scope | Allowed sources |
|---|---|
| Scripts | Same-origin files, the hashed inline theme loader, and unpkg (pinned map libraries) |
| Styles | Same-origin, inline styles required by the existing design, Google Fonts, cdnjs, unpkg |
| Images | Same-origin, `data:` and `blob:` URLs, ArcGIS tiles, unpkg/cdnjs assets, the QR fallback service |
| Connections | QR fallback, ArcGIS tiles, font hosts |
| Workers, manifests, form actions | Same-origin only |

The policy was validated in report-only mode with zero violations before being enforced.

### New: Subresource Integrity

- Added verified SHA-512 integrity attributes to Font Awesome, Leaflet CSS/JS, MarkerCluster CSS/JS and GeographicLib.
- Added `crossorigin="anonymous"` for cross-origin assets.
- Existing Font Awesome integrity on the database page was verified and reused.
- Google Fonts CSS is not SRI-pinned because its response varies by user agent. All other third-party runtime assets are integrity-pinned.

### New: Referrer policy

- Added `strict-origin-when-cross-origin` to every page.
- External map attribution and specimen links also use `noreferrer`.

### Improved: Output handling

- Removed the remaining unescaped HTML notification path in the map controller. Dynamic notification text is now inserted with `textContent`.
- User and dataset values are escaped before insertion into map popups, hazard cards, specimen plaques, hovercards and dynamic tables.
- Table rows and modal fields use DOM APIs and `textContent` where possible.
- CSV output includes quoting and spreadsheet formula-injection protection.

### Improved: Data integrity and storage safety

- Missing toxicity and IUCN values are no longer coerced to *Safe* or *Least Concern*.
- Observation latitude and longitude are validated against global and campus bounds.
- Observations are reported as saved only after IndexedDB confirms the transaction.
- Storage quota errors, unavailable IndexedDB and write failures produce explicit messages.
- Legacy observation IDs are migrated to avoid collisions with the new dataset.
- Sector and basemap lookups are prototype-safe.
- Map session values are validated before restoration.
- QR deep links use the deployment origin or a configured base URL; no hardcoded fallback URL is invented.

### Improved: Privacy posture

- The site remains a static application with no server-side database, login, session cookie, analytics script or credential storage.
- Observations and photos remain in the user's browser.
- Third-party requests are limited to Google Fonts, cdnjs, unpkg, ArcGIS basemap tiles and the optional QR image fallback.
- No secrets, API keys or passwords are present in the site assets.
- `SECURITY.md` was updated with the new brand identity and continues to direct reports to private GitHub vulnerability reporting.

### Verified: Datasheet integrity

- The master CSV contains 175 records. The verified XLSX contains 73 records.
- The 73 verified workbook IDs match the 73 records flagged as verified in `data.js`, with no missing IDs, extra IDs or duplicates.
- The verified workbook contains no formulas, macros, external workbook links, embedded media, email addresses or phone numbers.
- Two records (SMVDU-FL-047 and SMVDU-FL-054) use combined slash-separated names in the verified workbook, while the web catalogue displays the primary species name. This is noted for a future content reconciliation pass.

---

## 12. Technical and File-Level Changes

### New files

| File | Purpose |
|---|---|
| `js/maps-core.js` | Map initialisation, geodesy, layers and markers |
| `js/maps-controls.js` | Sector controls, accessibility, export, pinpoint, session restore and map UI |
| `js/qrcode.min.js` | Locally vendored `qrcode-generator` 1.4.4 (MIT) |
| `icons/` | Complete favicon and PWA icon set |
| `master-datasheet.csv` | Full 175-record catalogue export |
| `verified-datasheet.xlsx` | 73-record verified botanical workbook |

### Updated files

| File | Changes |
|---|---|
| `index.html` | New brand, hero, telemetry, metadata and navigation |
| `database.html` | New telemetry, filters, verified export, QR modal, observation form and accessibility |
| `maps.html` | Fullscreen, legend, accessible sector table, dynamic statistics and updated controls |
| `research.html` | Data-scope notice, dynamic metrics, sector table, survey timetable, hovercards and citation sections |
| `safety.html` | Safety notice, Unknown tier, dynamic counts, revised medical contact and collapsible cards |
| `css/style.css` | Brand, header, navigation, theme, responsive and accessibility styling |
| `css/database.css` | Database toolbar, table, modal, QR, form and print styling |
| `css/maps.css` | Map controls, legend, sidebar, fullscreen, marker and responsive styling |
| `css/research.css` | Metrics, tables, notices, hovercards, citation and responsive styling |
| `css/safety.css` | Safety notice, cards, filters, triage table and responsive styling |
| `js/data.js` | V3 catalogue, verified flags, IndexedDB v4 migration, validation and telemetry |
| `js/database.js` | Search, filters, verified export, QR, CSV, plaque, observation validation and modal accessibility |
| `js/main.js` | Sticky header state, hover/click navigation, theme handling and service-worker registration |
| `js/research.js` | Dynamic metrics, sector navigation, hovercards and citation copying |
| `js/safety.js` | Normalisation, Unknown tier, dynamic counts, card rendering and dataset refresh handling |
| `js/maps.js` | Retained as a small legacy documentation stub |
| `sw.js` | v3.1.1 cache, app-shell and vendor lists, offline strategy |
| `manifest.json` | New name, short name and 175-record shortcut text |
| `SECURITY.md` | New brand name and updated reporting guidance |

### Removed or replaced

- Removed the unused `html5-qrcode` external dependency from the service-worker vendor list.
- Replaced the CDN-hosted `qrcode-generator` load with the local `js/qrcode.min.js`.
- Replaced the monolithic map controller with `maps-core.js` and `maps-controls.js`.
- Replaced hardcoded research claims and telemetry with data-derived values.

### Dependencies

| Library | Version | Delivery |
|---|---|---|
| Leaflet | 1.9.4 | CDN (SRI-pinned) |
| Leaflet.markercluster | 1.5.3 | CDN (SRI-pinned) |
| GeographicLib | 1.52.1 | CDN (SRI-pinned) |
| Font Awesome | 6.4.0 | CDN (SRI-pinned) |
| qrcode-generator | 1.4.4 | Local |
| Google Fonts | Inter, JetBrains Mono, Playfair Display | CDN (not SRI-pinned; see §15) |

The application remains build-free. All pages can be served directly from a static host, with no bundler, package manager or server runtime required.

---

## 13. Compatibility and Migration Notes

- **Browser preferences are preserved.** The theme storage key remains `smvdu_floris_theme` and the map session key remains `smvdu_floris_map_session`.
- **IndexedDB.** The database name remains `SMVDU_BIO_INDEXED_DB`. The schema is upgraded to version 4 with a verification index, and existing observations are retained.
- **Legacy observation IDs.** Observations with IDs 117 and above are relocated to new IDs so they are not overwritten by the new 117–175 verified records. The migration is surfaced to the user on the database page.
- **Service-worker cache.** The cache name has changed. Existing users may see one reload while the new app shell and vendor assets install; old caches are purged.
- **QR codes.** QR codes are generated from the current deployment origin. If the site is served from a preview URL, set the `green-atlas-base-url` meta value to the final production URL before printing permanent plaques.
- **Paths.** All paths remain relative, so the site can be deployed at a GitHub Pages project path without changing internal links.
- **Browser support.** Modern evergreen browsers are supported. IndexedDB is required for persistent observations; where persistent storage is unavailable, the interface shows a warning and a read-only catalogue view. Service workers require HTTPS (or `localhost` during development).
- **No server-side migration, API change or database provisioning is required.**

---

## 14. Verification

The release was checked locally with a static HTTP server and headless Microsoft Edge via Playwright, in addition to static review and editor diagnostics.

| Area | Result |
|---|---|
| Page loading | All five pages load without application JavaScript errors |
| Content Security Policy | Enforcing CSP produces no violations on any page |
| Subresource Integrity | Font Awesome, Leaflet, MarkerCluster and GeographicLib load successfully under SRI |
| Maps | Map initialises, renders markers, opens popups, responds to sector filters and handles sector deep links |
| Maps with service worker | Map loads correctly while the service worker is active and serving cached vendor assets |
| Invalid input | Invalid sector keys and invalid coordinates are handled without uncaught errors |
| Notification safety | Map notifications render user-supplied text as text, not HTML |
| Database | Search, filtering, pagination, specimen modal, QR modal and CSV export work |
| CSV export | Contains 175 records plus header, includes the UTF-8 BOM, and downloads successfully |
| Safety page | Tier filters, search, dynamic counts and collapsible cards work |
| Interface | Theme switching and the navigation drawer work |
| Service worker | Reaches the ready state, controls the page after reload, and creates the `smvdu-green-atlas-v3.1.1` cache |
| Diagnostics | No errors or warnings reported in the project |

---

## 15. Known Limitations and Follow-Up Items

**Research metrics**
Carbon sequestration, Shannon–Wiener diversity and invasive-pressure indices are intentionally not presented. The supplied dataset lacks the abundance, biomass, survey and quadrat data needed to calculate them.

**Sector boundaries**
Boundaries and areas are working approximations derived from supplied extents. They are labelled as static/derived on the Maps page and must not be treated as surveyed boundaries.

**Toxicity and first-aid content**
Toxicity and first-aid text are dataset labels, not clinically approved advice. Clinical review and source citations remain a future content task.

**Coordinate sensitivity**
Exact coordinates are published as supplied. Conservation-sensitive records should be reviewed before public release if precise locality data is considered sensitive.

**Third-party asset integrity**
Google Fonts CSS cannot be reliably pinned with SRI because its response varies by user agent. All other third-party runtime assets are integrity-pinned.

**GitHub Pages header limitations**
GitHub Pages cannot set custom response headers such as `frame-ancestors` or `X-Content-Type-Options`. The site uses a meta CSP and referrer policy; header-only protections would require a different host or a proxy.

**Verified workbook naming**
The verified workbook uses combined slash-separated names for SMVDU-FL-047 and SMVDU-FL-054. Confirm whether the web catalogue should display both names in a future content pass.

**QR plaque URL**
Confirm the final GitHub Pages URL and set `green-atlas-base-url` before printing permanent QR plaques.

---

## 16. Deployment Checklist

- [ ] Publish the complete site folder, preserving the `css/`, `js/`, `icons/` and data-file structure. Do not deploy the `.git` directory as part of the public site.
- [ ] Confirm all new files are present, especially `maps-core.js`, `maps-controls.js`, `qrcode.min.js`, the `icons/` directory, `master-datasheet.csv` and `verified-datasheet.xlsx`.
- [ ] Confirm GitHub Pages is enabled for the correct branch and that the production URL resolves.
- [ ] Set the `green-atlas-base-url` meta value in `database.html` to the final public URL before generating permanent QR plaques.
- [ ] Load all five pages and check the browser console for CSP, SRI or missing-file errors.
- [ ] Verify the map, sector links, marker popups, database search, QR modal, CSV exports and safety filters on the deployed origin.
- [ ] Clear the old service-worker cache or perform one reload to confirm the v3.1.1 app shell is active.
- [ ] Confirm the printed 4×6 plaque layout and scan a printed QR code with a mobile device.
- [ ] Confirm the verified datasheet download and master CSV open correctly in the intended spreadsheet application.
- [ ] Record the deployment date and release version for future release notes.

---

## 17. Release Impact

Version 3.1.1 brings the SMVDU Green Atlas to a larger, more transparent and more maintainable release. The catalogue is broader, the maps and database are more capable, the research and safety pages now distinguish supplied data from unsupported claims, and the interface is materially more accessible on desktop, tablet and mobile.

The release also establishes a security and data-integrity baseline for future work: explicit *Unknown* values, validated observation intake, verified exports, integrity-pinned vendor assets, a tested CSP, local QR generation and a versioned offline cache.
