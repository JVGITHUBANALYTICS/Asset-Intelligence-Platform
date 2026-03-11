# ⚡ Asset Intelligence Platform

A professional-grade, data-driven web dashboard for electric utility **Transmission & Distribution (T&D) asset management**. Built for monitoring fleet health, running AI/ML risk models, planning capital replacements, and generating regulatory reports — modeled after a real-world utility environment (PPL Electric Utilities).

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Pages & Modules](#pages--modules)
- [Health Models](#health-models)
- [Screenshots](#screenshots)
- [License](#license)

---

## Overview

The Asset Intelligence Platform provides utility asset managers, engineers, and executives with a centralized dashboard to:

- **Monitor** the health and risk status of 47,000+ T&D assets across the service territory
- **Score** assets using 12 AI/ML models (Random Forest, XGBoost, Neural Networks, Weibull distributions, and more)
- **Visualize** risk distribution geographically on interactive maps
- **Plan** capital replacements with budget-optimized scheduling
- **Generate** regulatory reports for PUC filings and executive summaries
- **Manage** inspection records, DGA test results, and maintenance history

---

## Features

- **Interactive Dashboard** — KPI cards, bar/line/pie/doughnut charts, and a Leaflet map with risk-coded asset markers
- **12 AI/ML Health Models** — model registry with detail modals, radar comparisons, accuracy tracking, and run controls
- **Asset Registry** — searchable, filterable table of all utility assets with risk scoring
- **Work Queue** — staging area for engineering review with CSV export
- **Replacement Planning** — capital plan builder with 5-year forecasting and budget allocation charts
- **Reports Hub** — 6 report types with inline generation (Fleet Health, PUC Filing), generated report history, and a document library with drag-and-drop upload
- **DGA Test Results** — dissolved gas analysis viewer for transformer diagnostics
- **Inspection Results** — field inspection record management
- **Maintenance History** — historical maintenance log with filtering
- **Data Ingestion** — upload interface for new asset data
- **Analytics** — fleet-level trend analysis
- **Dark/Light Theme** — full theme support with CARTO dark/light map tiles
- **Auth System** — login/register with protected routes
- **Responsive Design** — mobile sidebar overlay, collapsible navigation, responsive grid layouts

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **React Router v6** | Client-side routing with protected routes |
| **Recharts** | Charts (bar, line, pie, radar, stacked) |
| **React Leaflet** | Interactive geographic maps |
| **Lucide React** | Icon library |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### Installation

```bash
# Clone the repository
git clone https://github.com/JVGITHUBANALYTICS/Asset-Intelligence-Platform.git
cd Asset-Intelligence-Platform/admin-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
Asset-Intelligence-Platform/
├── admin-dashboard/
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/               # LoginForm, RegisterForm
│   │   │   ├── Dashboard/          # StatsCard, ActivityFeed, ChartPlaceholder
│   │   │   ├── Layout/             # Layout, Sidebar, Navbar, Footer
│   │   │   └── UI/                 # Button, Card, Table, Modal, Input
│   │   ├── context/                # AuthContext, ThemeContext
│   │   ├── data/                   # Mock data (assets, inspections, DGA, maintenance)
│   │   ├── hooks/                  # useAuth, useTheme
│   │   ├── pages/                  # All page components (13 pages)
│   │   ├── routes/                 # AppRoutes with protected routing
│   │   ├── services/               # API, auth, and user services
│   │   ├── styles/                 # Global CSS
│   │   ├── types/                  # TypeScript type definitions
│   │   ├── utils/                  # Constants, helpers, Leaflet setup
│   │   ├── App.tsx                 # Root component
│   │   └── main.tsx                # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore
├── LICENSE
└── README.md
```

---

## Pages & Modules

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Fleet overview with KPIs, charts, geographic risk map, critical asset list |
| `/assets` | Asset Registry | Searchable table of all T&D assets with risk scores |
| `/inspections` | Inspection Results | Field inspection record viewer and manager |
| `/dga-tests` | DGA Test Results | Dissolved gas analysis results for transformers |
| `/maintenance` | Maintenance History | Historical maintenance records with filtering |
| `/health-models` | Health Models | AI/ML model registry with 12 models, radar chart comparison |
| `/work-queue` | Work Queue | Asset staging for engineering review, CSV export |
| `/replacement` | Replacement Planning | Capital plan builder, 5-year forecast, budget allocation |
| `/analytics` | Analytics | Fleet-level trend analysis |
| `/reports` | Reports | Report generation, history, and document library |
| `/data-upload` | Data Ingestion | Upload new asset data, inspections, DGA results |
| `/settings` | Settings | User preferences and configuration |
| `/profile` | Profile | User profile management |

---

## Health Models

The platform includes 12 AI/ML health models spanning 6 categories:

| Model | Category | Algorithm | Accuracy |
|---|---|---|---|
| Transformer Health Index | Regressor | Random Forest | 94% |
| Circuit Breaker Failure Predictor | Classifier | XGBoost | 91% |
| Age-Based Deterioration Curve | Physics-Based | Weibull Distribution | 87% |
| Thermal Overload Risk Model | Physics-Based | Thermal Dynamic Simulation | 89% |
| Maintenance Impact Scoring | Rule-Based | Weighted Decision Matrix | 92% |
| Lightning Vulnerability Index | Classifier | Neural Network (MLP) | 88% |
| DGA Fault Gas Interpreter | Classifier | Multi-class SVM + Duval Triangle | 93% |
| Asset Criticality Ranker | Rule-Based | AHP | 95% |
| Fleet Segmentation Model | Clustering | K-Means + DBSCAN | 86% |
| Replacement Cost Estimator | Regressor | LightGBM | 90% |
| Cable Insulation Degradation | Ensemble | Stacked (RF + XGBoost + Linear) | 88% |
| Outage Impact Predictor | Regressor | Random Forest + GIS | 85% |

---

## Asset Types

The platform manages the following T&D equipment:

- Power Transformers
- Circuit Breakers
- Distribution Transformers
- Disconnect Switches
- Capacitor Banks
- Voltage Regulators
- Reclosers
- Underground Cables

---

## Screenshots

> Screenshots coming soon.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
