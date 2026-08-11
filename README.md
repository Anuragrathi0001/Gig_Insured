# 🛡️ Gig Insured — Parametric Income Insurance Platform for Gig Workers

[![DEVTrails 2026 Submission](https://img.shields.io/badge/DEVTrails--2026-Hackathon--Submission-emerald?style=for-the-badge)](https://devtrails2026.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)](https://github.com)

**Gig Insured** is an AI-powered, parametric micro-insurance platform designed specifically for food delivery and quick-commerce gig workers (Zomato, Swiggy, Zepto, Blinkit). It automatically protects workers' weekly earnings against severe environmental and civic disruptions — such as heavy monsoon downpours, extreme summer heatwaves, hazardous AQI smog, flash floods, and city curfews — without requiring manual claim filing or paperwork.

---

## 🔗 Live Demo & Deployment Links

- 🌐 **Live Web Application (Vercel)**: [https://gig-insured.vercel.app](https://gig-insured.vercel.app) *(Replace with your deployed Vercel URL)*
- ⚙️ **Backend REST API (Render)**: [https://gig-insured-api.onrender.com](https://gig-insured-api.onrender.com) *(Replace with your deployed Render URL)*
- 📖 **Smoke Test Checklist**: [SMOKE_TEST.md](SMOKE_TEST.md)

---

## ⚠️ GOLDEN RULES OF COVERAGE (PRD Section 5.2)

> [!IMPORTANT]
> **STRICT SCOPE LIMITATION — INCOME PROTECTION ONLY**
> 
> Per Section 5.2 of the Product Requirement Document (PRD):
> 1. **Gig Insured coverage is strictly and exclusively limited to INCOME LOSS PROTECTION** resulting from parametric environmental and civic disruptions that prevent active gig delivery workers from fulfilling orders.
> 2. **NO Health Coverage**: The policy does NOT cover medical expenses, hospitalization, or illness.
> 3. **NO Life Insurance**: The policy does NOT offer death or life insurance benefits.
> 4. **NO Vehicle/Property Coverage**: The policy does NOT cover damage, theft, or maintenance for bikes, scooters, or equipment.
> 5. **NO Personal Accident Liability**: Third-party liability and personal injury claims are explicitly excluded.

---

## ✨ Key System Features

### 1. 📱 Worker Onboarding & Risk Profiling
- **OTP Authentication**: Mobile-number + 6-digit OTP authentication with 7-day JWT tokens and rate-limiting protection.
- **Parametric Risk Profile**: Instant underwriting calculating `zoneRiskScore` (0-100) and `weatherExposureScore` based on historical zone disruption frequency.
- **Weekly Tiered Micro-Premiums**: Flexible weekly plans (**Basic**: ₹25–35/wk, **Standard**: ₹45–65/wk, **Premium**: ₹75–100/wk) with instant UPI activation via mock gateway.

### 2. ⚡ Disruption Monitoring & GeoJSON Spatial Pipeline
- **15-Minute Automated Monitor Cron**: `jobs/disruptionMonitor.js` fetches live weather/AQI telemetry via OpenWeatherMap API (with mock fallback).
- **GeoJSON Spatial Polygon Matching**: Cross-references workers' real-time GPS coordinates against zone boundaries.
- **Multi-Signal Validation**: Requires $\ge 2$ independent signals (e.g. weather API breach + platform order drop signal) to confirm disruption events.

### 3. 🛡️ Composite Fraud Detection Engine
- **4-Signal Composite Scoring**: Evaluates claims across:
  1. *GPS Movement Signal* (detects static GPS fixes/spoofing inside disruption zones).
  2. *Platform Delivery Telemetry* (flags active deliveries completed during disruption window).
  3. *Device Fingerprint Signal* (detects duplicate hardware IDs across accounts).
  4. *Network Graph Signal* (detects coordinated cluster attack rings).
- **Genuine-User Grace Threshold**: Automatically protects honest workers with tenure $>6$ weeks and $<2$ prior flags.

### 4. 💸 Automated Payout Execution & Worker Appeals
- **Razorpay X Instant UPI Payouts**: Automatically disburses 24x7 instant UPI payouts (`RZP_PYUT_...`) upon claim approval using the formula:
  $$\text{Payout} = \left(\frac{\text{Hours Lost}}{\text{Avg Daily Hours}}\right) \times \left(\frac{\text{Weekly Income}}{7}\right)$$
- **48-Hour Worker Appeals Pipeline**: Allows workers to appeal blocked claims within 48 hours for admin review.

### 5. 🏢 Insurer Admin Console & Predictive Analytics
- **Real-Time Loss Ratio Analytics**: Monitors Loss Ratio percentage ($\frac{\text{Payouts}}{\text{Premiums}} \times 100$), active policyholders, and claims distribution.
- **5-Step Live Disruption Simulator**: Presenter control panel allowing single-click simulation of monsoon storms, heatwaves, or flash floods in any zone.
- **Telemetry Evidence Drill-Down Modal**: Interactive modal displaying GPS logs, platform delivery activity, device fingerprints, and network subnets.
- **Predictive Time-Series Forecasts & Spatial Heatmap**: Zone-level claims density, spatial risk scores, and next-week financial liabilities forecast (with ML TODO integration markers).

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | React 18 + Vite | Desktop-first Admin & Mobile-first Worker SPA |
| **Styling** | Vanilla CSS + Tailwind CSS | Sleek dark-mode aesthetic with glassmorphism |
| **Icons** | Lucide React | Modern SVG icons |
| **Backend API** | Node.js + Express | Modular REST API with Bearer JWT auth middleware |
| **Database** | MongoDB + Mongoose | Schema validation + robust in-memory fallback store |
| **Job Scheduling**| Node-Cron | 15-minute disruption evaluation pipeline |
| **Payment Gateway**| Razorpay X (Simulated)| Instant 24x7 UPI payout dispatch (`RZP_PYUT_...`) |
| **Weather Telemetry**| OpenWeatherMap API | Live weather & fallback mock generator |

---

## 📁 Repository Structure

```
gig-insured/
├── server/
│   ├── config/            # Database connection & env setup
│   ├── controllers/       # Auth, Worker, Policy, Claim, Admin controllers
│   ├── jobs/              # Disruption monitoring cron job
│   ├── models/            # Mongoose schemas (Worker, ZoneConfig, Policy, Claim, etc.)
│   ├── routes/            # Express REST routes
│   ├── services/          # Risk Engine, Premium Engine, Fraud Engine, Forecast Engine
│   ├── scripts/           # seedDemo.js database hydrator
│   ├── render.yaml        # Render deployment blueprint
│   ├── railway.json       # Railway deployment config
│   └── server.js          # Main Express app entry point
├── client/
│   ├── src/
│   │   ├── components/    # Reusable UI components (ClaimsList, PlanSelection, etc.)
│   │   ├── context/       # AuthContext for JWT management
│   │   ├── pages/         # WorkerPortal and AdminDashboard pages
│   │   └── main.jsx       # Axios base URL & Vite entry point
│   ├── vercel.json        # Vercel SPA routing rewrite config
│   └── vite.config.js     # Vite configuration
└── SMOKE_TEST.md          # 5-minute hackathon pitch demonstration guide
```

---

## 🚀 Environment Variables & Setup Guide

### 1. Backend (`/server/.env`)
Create a `.env` file inside `/server`:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=gig_insured_super_secret_jwt_key_2026
MONGO_URI=mongodb://127.0.0.1:27017/gig-insured
OPENWEATHER_API_KEY=your_openweather_api_key_here
```
*(Note: If `MONGO_URI` or `OPENWEATHER_API_KEY` are missing, the app automatically switches to robust mock generators with zero downtime).*

### 2. Frontend (`/client/.env`)
Create a `.env` file inside `/client`:
```env
VITE_API_URL=http://localhost:5000
```
*(Set `VITE_API_URL` to your deployed backend URL on Vercel).*

---

## 🏃 Local Run & Seed Instructions

### Step 1: Install Dependencies
```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

### Step 2: Seed Demo Database
```bash
cd ../server
node scripts/seedDemo.js
```

### Step 3: Run Concurrent Local Servers
```bash
# Terminal 1: Run Backend API
cd server
npm run dev

# Terminal 2: Run Frontend App
cd client
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## ☁️ Cloud Deployment Instructions

### Deploying Backend to Render (`/server`)
1. Create a new Web Service on [Render.com](https://render.com).
2. Connect your GitHub repo and set **Root Directory** to `server`.
3. Set **Build Command**: `npm install`.
4. Set **Start Command**: `npm start`.
5. Add Environment Variables (`NODE_ENV=production`, `JWT_SECRET`, `MONGO_URI`).

### Deploying Frontend to Vercel (`/client`)
1. Create a new project on [Vercel.com](https://vercel.com).
2. Import your GitHub repo and set **Root Directory** to `client`.
3. Add Environment Variable: `VITE_API_URL` = `https://gig-insured-api.onrender.com`.
4. Click **Deploy**.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
