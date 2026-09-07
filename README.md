# 🏛️ 3D-ULPIN: Intelligent 3D Land & Vertical Property Information System
### Andhra Pradesh 3D Cadastre Platform (Enhanced & Fixed Edition)

This repository contains the complete, production-ready source code and pre-compiled assets for the **3D-ULPIN System**.

---

## ⚡ Highlights & Critical Fixes Included
1. **Zero-Crash 3D Interior Engine**:
   - Resolved the fatal React DOM reconciliation crash (NotFoundError: Failed to execute 'insertBefore' on 'Node').
   - The Three.js canvas rendering context is cleanly decoupled from React HUD overlays.
   - Smoothly opens and inspects individual floor apartments (Living Hall, Master Bedroom, Study, Modular Kitchen, Balcony) with full 360° orbit controls.
2. **Defensive DOM Safeguard**:
   - Injected runtime reconciliation protection preventing any external WebGL canvas resets from unmounting React components.
3. **Complete Cadastral Data Pre-cached**:
   - 100 Georeferenced Land Parcels
   - 100 3D Extruded Buildings
   - 986 Vertically Stacked Property Titles with 3D ULPINs
4. **Dual Running Mode**:
   - Supports both standard Node.js development (
pm run dev) and lightweight standalone Python hosting (py server.py 5173).

---

## 🚀 How to Run Locally

### Option A: Using Python (No Node.js installation required)
`ash
py server.py 5173
`
Then visit **http://localhost:5173** in your web browser.

### Option B: Using Node / Vite
`ash
npm install
npm run dev
`
Visit **http://localhost:5173** in your browser.

---

## 🌐 Deploying to Render
This repository includes a pre-configured 
ender.yaml.
Connecting this repository to [Render](https://render.com) will automatically build and publish the live web service at your custom domain or https://threed-ulpin.onrender.com.
