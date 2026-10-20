# 🌿 SMVDU Floris

> **Institutional Repository of Campus Vascular Flora & Spatial Microclimate Stratification**

[![Release](https://img.shields.io/badge/Release-v2.3.0-10b981.svg)](index.html)
[![Platform](https://img.shields.io/badge/Platform-GitHub%20Pages-blue.svg)](https://ekanshkaul.github.io/green-atlas/)
[![Architecture](https://img.shields.io/badge/Architecture-Static%20PWA-orange.svg)](#-tech-stack--architecture)

**SMVDU Floris** serves as the official digital herbarium, vegetation GIS atlas, and spatial taxonomic directory for Shri Mata Vaishno Devi University, Kakryal (Katra, J&K). Situated in the dynamic bio-geographical ecotone of the Trikuta foothills at elevations between 780m and 880m MSL, the platform bridges physical field taxonomy and spatial GIS telemetry.

---

## 📸 Key Features & Capabilities

### 📖 Campus Flora Repository (`database.html`)
* **116 Cataloged Vascular Taxa:** Standardized botanical ledger covering major sub-Himalayan lineages (Pinaceae, Fabaceae, Apocynaceae, etc.).
* **Vernacular Ethnobotany:** Includes local Dogri names, family metadata, plant habits, and phenological schedules.
* **Persistent Local Data Engine:** IndexedDB-backed local observation logging with real-time sync status, instant GPS coordinate auto-acquisition via browser geolocation, and automatic image compression for localStorage.
* **QR Tagging & Plaque Generation:** Built-in QR modal tools and printable 4x6 botanical plaque templates for field-mounted specimens.
* **CSV Export:** Direct CSV spreadsheet export functionality.

### 🗺️ Vegetation GIS Atlas (`maps.html`)
* **Spatial Canopy Stratification:** Real-time interactive maps powered by Leaflet.js and MarkerCluster.
* **Ecological Sector Zoning:** Campus grounds partitioned into 4 distinct microclimate sectors:
  * *Pine Ridge Belt* (Northern Coniferous Perimeter)
  * *Academic Avenue* (Central Boulevard Corridor)
  * *Lower Scrublands* (Arid Southern Terraces)
  * *Ravine Corridors* (Shaded Nullah Channels)
* **Interactive Tooling:** Basemap layering (Street View, Satellite Imagery, Topographic), interactive coordinate dropper (`Pinpoint`), sector inspector sidebar, and GeoJSON export.

### 🔬 Sustainability & Audit (`research.html`)
* **Ecological Sampling Methodology:** Stratified random quadrat protocols (10m x 10m) and FSI allometric equations.
* **Telemetry Insights:** Estimated carbon sequestration (1,420 tCO₂e/yr), Shannon-Wiener Diversity Index ($H' = 3.18$), invasive species pressure tracking, and a 6-phase field survey timetable (DYD Batch of 2026).

### 🛡️ Toxicity & Safety Protocols (`safety.html`)
* **Researcher Hazard Classifications:** Filterable safety profiles (*Non-Toxic/Safe*, *Mild Irritant*, *Severe Toxic*).
* **Clinical Triage:** Emergency exposure protocols, target organ symptoms, and direct communication links to the SMVDU Medical Aid Centre (Ext. 2222).

### ⚡ Offline PWA Architecture (`sw.js`)
* **Progressive Web App:** Fully functional offline capabilities powered by a dedicated service worker (`smvdu-floris-v2.3.0`) and non-blocking ArcGIS tile caching pipeline.

---

## 🛠️ Tech Stack & Architecture

| Category | Technologies / Libraries |
|---|---|
| **Frontend** | HTML5, CSS3 (Custom Properties, Flexbox/Grid), Native JavaScript (ES6) |
| **GIS & Mapping** | Leaflet.js (v1.9.4), Leaflet.markercluster (v1.5.3), ArcGIS Online Tile Layers[cite: 5, 7] |
| **Storage & PWA** | Service Worker API, IndexedDB API, Web Storage |
| **Icons & Fonts** | Font Awesome 6.4.0, Google Fonts (*Inter*, *JetBrains Mono*, *Playfair Display*) |
| **Utilities** | qrcode-generator (v1.4.4), html5-qrcode (v2.3.8)[cite: 5, 6] |

---

## 📁 Repository Structure

```text
.
├── index.html               # Institutional home portal & telemetry metrics
├── database.html            # Searchable flora database, observation intake & QR tools[cite: 6]
├── maps.html                # Interactive Leaflet GIS vegetation map & sector inspector[cite: 7]
├── research.html            # Sustainability audit, carbon indices & survey timetable[cite: 8]
├── safety.html              # Toxicity risk profiles & clinical emergency triage[cite: 9]
├── css/                     # Page-specific & global theme stylesheets (style, database, maps, research, safety)[cite: 2, 6, 7, 8, 9]
├── js/                      # Modular controllers (data engine, main UI, database, maps, research, safety)[cite: 2, 5, 6, 7, 8, 9]
├── icons/                   # PWA manifest icons & application shortcut assets[cite: 3]
├── manifest.json            # PWA Web App Manifest configuration[cite: 3]
├── sw.js                    # Service worker script with offline app shell & tile caching[cite: 5]
└── SECURITY.md              # Security policy and vulnerability reporting guidelines[cite: 4]
