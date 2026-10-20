# 🌿 SMVDU Green Atlas

> **Identify • Document • Map • Connect**

[![Release](https://img.shields.io/badge/Release-v3.1.1-10b981.svg)](RELEASE_NOTES_v3.1.1.md)
[![Platform](https://img.shields.io/badge/Platform-GitHub%20Pages-blue.svg)](https://ekanshkaul.github.io/green-atlas/)
[![Architecture](https://img.shields.io/badge/Architecture-Static%20PWA-orange.svg)](#-tech-stack--architecture)

**SMVDU Green Atlas** is an interactive, progressive web application (PWA) and digital ecological directory designed to catalog, map, and analyze the diverse botanical flora across the Shri Mata Vaishno Devi University (SMVDU) campus.

---

## 📸 Key Features & Capabilities

### 📖 Comprehensive Flora Database
* **175 Catalogued Taxa:** Documented across **69 botanical families**, featuring 73 verified specimen records.
* **Smart Search & Filters:** Search by botanical name, common vernacular (Dogri/English), family, sector, toxicity tier, IUCN status, and phenology.
* **Offline Observation Logging:** Native browser-side data intake using IndexedDB (Schema v4) with image compression, duplicate detection, and campus range validation.
* **Data Export:** Export custom datasets directly to **Master CSV** and **Verified XLSX** formats with built-in formula-injection safeguards and UTF-8 BOM encoding.

### 🗺️ Interactive Vegetation GIS Maps
* **WGS84 Geodesy:** Accurate sector areas and distances calculated via GeographicLib and Leaflet.
* **Sector Breakdown:** Coverage across *Pine Ridge Belt*, *Academic Avenue*, *Lower Scrublands*, and *Ravine Corridors* with deep-link support (`maps.html?sector=...`).
* **GIS Tools:** Responsive map legend, campus boundary overlays, custom toxicity markers, dark/light basemaps, fullscreen mode, and GeoJSON export.

### 🛡️ Toxicity & Safety Protocols
* **Safety Tiers:** Clear categorization (*Safe*, *Mild Irritant*, *Toxic*, and *Unknown / Not assessed*).
* **Emergency Guidance:** Field action steps, toxin information, and one-tap emergency contact routing.

### 📌 QR Plaques & Field Identification
* **Local Offline Generation:** Uses an embedded QR generator to produce instant field deep links and printable 4×6 botanical plaques without relying on remote APIs.

### ⚡ Offline PWA Architecture
* **Fast & Static:** Zero server dependencies, database backends, or build steps. Hosted directly via GitHub Pages.
* **Service Worker Caching:** Full offline access for core application pages, vendor assets, and previously cached map tiles.

---

## 🛠️ Tech Stack & Architecture

| Category | Technologies / Libraries |
|---|---|
| **Frontend** | HTML5, CSS3 (Custom Properties, Flexbox/Grid), Native JavaScript (ES6+ Modules) |
| **GIS & Mapping** | [Leaflet.js](https://leafletjs.com/), [GeographicLib](https://geographiclib.sourceforge.io/) |
| **Storage & PWA** | Service Worker API, IndexedDB API, Web Storage |
| **Security** | Content Security Policy (CSP), Subresource Integrity (SRI), HTML Output Sanitization |
| **Icons & Fonts** | Font Awesome 6, Google Fonts (*Inter*, *JetBrains Mono*, *Playfair Display*) |

---

## 📁 Repository Structure

```text
.
├── index.html               # Landing page & telemetry metrics
├── database.html            # Searchable flora database & observation intake
├── maps.html                # GIS vegetation map interface
├── research.html            # Ecological audit & sector composition
├── safety.html              # Toxicity reference & emergency protocols
├── css/                     # Page-specific & theme stylesheets
├── js/                      # Modular JavaScript controllers (maps-core, data, etc.)
├── icons/                   # Favicons & PWA application icons
├── master-datasheet.csv     # Master 175-record catalogue dataset
└── verified-datasheet.xlsx  # Verified 73-record botanical workbook
