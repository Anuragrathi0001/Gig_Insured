# 🚀 Gig Insured — Hackathon Demo Smoke Test Checklist

Follow this 5-minute step-by-step checklist for a smooth live presentation of **Gig Insured** (Parametric Income Insurance for Gig Workers).

---

## 📋 Pre-Flight Setup
1. **Start Backend Server**:
   ```bash
   cd server
   npm run dev
   ```
   *Console output confirms: `Server running on port 5000` & `[In-Memory Store]: Hydrated offline fallbacks`.*

2. **Start Frontend Web App**:
   ```bash
   cd client
   npm run dev
   ```
   *Open browser at `http://localhost:5173`.*

3. **Seed Clean Demo Database** (Optional / Fresh Start):
   ```bash
   node server/scripts/seedDemo.js
   ```

---

## 🧪 Demo Scenario 1: Mobile OTP Auth & Worker Onboarding (Worker Portal)

- [ ] **Step 1: Open Worker Portal**
  - Navigate to `http://localhost:5173` (Worker View).
  - Click **"Worker Login / Register"**.

- [ ] **Step 2: OTP Authentication**
  - Enter mobile number: `9876543210` (or any 10-digit mobile).
  - Click **"Send OTP"**.
  - Check screen / console hint (`123456` or dev OTP hint).
  - Enter OTP and click **"Verify OTP"**.

- [ ] **Step 3: Instant Onboarding & Risk Profiling**
  - Fill form:
    - **Name**: `Rahul Sharma`
    - **City**: `Bengaluru`
    - **Zone**: `Indiranagar`
    - **Platform**: `Zomato`
    - **Weekly Income**: `₹6,500`
    - **UPI ID**: `rahul@paytm`
  - Click **"Calculate Risk & Continue"**.
  - Observe generated **Zone Risk Score** (e.g. `81/100`) and **Weather Exposure Score**.

- [ ] **Step 4: Weekly Tier Selection & Mock UPI Activation**
  - Select plan tier: **Standard Plan** (`₹45/week` premium, `₹1,500/week` max benefit).
  - Click **"Activate Policy via UPI"**.
  - See mock UPI instant confirmation badge & policy status move to **"Active"**.

---

## ⚡ Demo Scenario 2: Live Disruption Trigger & Auto Payout (Admin Portal)

- [ ] **Step 5: Switch to Insurer Admin Dashboard**
  - Click top navbar tab: **"Insurer Admin"** (`http://localhost:5173/admin`).
  - View Loss Ratio Analytics, Policy Metrics, and Predictive Forecasts.

- [ ] **Step 6: Trigger Live Disruption Simulation**
  - In the **Live Disruption Simulator Console**:
    - **Zone**: Select `Bengaluru — Indiranagar Hub`.
    - **Disruption**: Select `Heavy Monsoon Downpour (>30 mm/h)`.
  - Click **"Trigger Live Disruption"**.
  - Watch the 5-Step Pipeline Progress Bar:
    1. ⚡ Weather Signal Breach ($\ge 2$ signals confirmed).
    2. 📍 GeoJSON Spatial Matching (Matches `Rahul Sharma` in Indiranagar).
    3. 🛡️ Composite Fraud Engine evaluation.
    4. ⚖️ Auto-Approval.
    5. 💸 Instant Razorpay X UPI Payout (`RZP_PYUT_...`).

- [ ] **Step 7: Verify Near Real-Time Worker Dashboard Update**
  - Switch back to **"Worker Portal"** (`http://localhost:5173`).
  - Observe:
    - **"Earnings Protected"** counter increases by payout amount (e.g. `+₹464`).
    - **7-Day Timeline** pill updates to `Disruption Detected ⚡` / `Payout Dispatched 💸`.
    - Claim item appears under Claims List with **Razorpay UPI Transaction Reference**.

---

## 🛡️ Demo Scenario 3: Fraud Telemetry Inspection & Appeal Review

- [ ] **Step 8: Simulate Fraud Attack Vector**
  - On Admin Dashboard, click **"🚨 GPS Spoofing (+25 pts)"** or **"🌐 Coordinated Attack Ring (+35 pts)"**.
  - Trigger disruption in `Koramangala`.

- [ ] **Step 9: Fraud Queue Telemetry Evidence Inspection**
  - Scroll to **Fraud Review Queue Table** on Admin Panel.
  - Click **"Inspect Evidence"** on queued claim.
  - Review 4-Signal Telemetry Modal:
    - 📍 GPS speed fix (`0 km/h static`).
    - 🚴 Active platform deliveries during storm.
    - 📱 Hardware device fingerprint.
    - 🌐 Shared IP network subnet attack ring.

- [ ] **Step 10: Admin Resolution**
  - Click **"Overrule Score & Dispatch UPI Payout"** or **"Reject Claim"**.
  - Observe immediate claim state transition and Razorpay UPI dispatch response.

---

## ✅ Smoke Test Passed!
Your **Gig Insured** hackathon pitch demo is fully operational with zero blocking bugs!
