# Contributing to SMVDU Green Atlas 🌿

Thank you for your interest in contributing to the **SMVDU Green Atlas**! Whether you are a student, software developer, GIS specialist, or botanical researcher, your contributions help maintain and expand this institutional herbarium and spatial mapping platform for Shri Mata Vaishno Devi University.

Please take a moment to review this document before submitting your contributions.

---

## 📋 Table of Contents
1. [Code of Conduct](#-code-of-conduct)
2. [Types of Contributions](#-types-of-contributions)
3. [Getting Started (Local Development)](#-getting-started-local-development)
4. [Branching & Workflow Guidelines](#-branching--workflow-guidelines)
5. [Code & Data Standards](#-code--data-standards)
6. [Submitting a Pull Request (PR)](#-submitting-a-pull-request-pr)
7. [Reporting Security Issues](#-reporting-security-issues)

---

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and collaborative environment. Treat all team members, researchers, and contributors with respect regardless of their background or experience level.

---

## 💡 Types of Contributions

You can contribute to SMVDU Green Atlas in several ways:

* **Botanical Data & Field Observations:** Verifying existing taxa, supplying missing Dogri/common names, updating phenology schedules, or adding newly georeferenced specimen records.
* **GIS & Spatial Mapping:** Refining campus polygon boundaries, adding new map features, or improving spatial calculation performance (`GeographicLib` / `Leaflet`).
* **Frontend & Accessibility (UI/UX):** Enhancing responsive layouts, dark/light theme styling, focus states, keyboard navigation, or screen-reader accessibility (ARIA compliance).
* **PWA & Offline Performance:** Optimizing Service Worker caching pipelines, local IndexedDB schema handling, or asset loading speeds.
* **Documentation:** Improving READMEs, adding inline code comments, or writing guides for field researchers.

---

## 🚀 Getting Started (Local Development)

SMVDU Green Atlas is built as a **static, zero-build Progressive Web Application (PWA)**. You do **not** need `npm`, Webpack, or any build step to get started.

1. **Fork and Clone the Repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/green-atlas.git](https://github.com/YOUR_USERNAME/green-atlas.git)
   cd green-atlas
