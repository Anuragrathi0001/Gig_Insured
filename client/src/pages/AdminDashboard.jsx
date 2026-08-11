import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, AlertCircle, TrendingUp, ShieldAlert, CheckCircle2, CloudRain, Flame, Wind, RefreshCw, Save, Zap, MapPin, Activity, Clock, ShieldCheck, Bug, Crosshair, MessageSquare, Check, X, FileSearch, PieChart, DollarSign, Smartphone, Wifi, Compass, LineChart, Layers, AlertTriangle, Play, ArrowRight, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [zones, setZones] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [fraudQueue, setFraudQueue] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulation Console state
  const [selectedSimZone, setSelectedSimZone] = useState('Indiranagar');
  const [selectedSimType, setSelectedSimType] = useState('heavy_rain');
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simLogs, setSimLogs] = useState(null);

  const [activeFraudScenario, setActiveFraudScenario] = useState('normal');
  const [editingThresholds, setEditingThresholds] = useState({});
  const [selectedClaimEvidence, setSelectedClaimEvidence] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, forecastRes, heatmapRes, zonesRes, triggersRes, queueRes, appealsRes] = await Promise.all([
        axios.get('/api/admin/overview'),
        axios.get('/api/admin/forecast'),
        axios.get('/api/admin/heatmap'),
        axios.get('/api/admin/zones'),
        axios.get('/api/admin/triggers'),
        axios.get('/api/admin/fraud-queue'),
        axios.get('/api/admin/appeals')
      ]);
      setOverview(overviewRes.data.overview);
      setForecast(forecastRes.data.forecast || []);
      setHeatmap(heatmapRes.data.heatmap || []);
      setZones(zonesRes.data.zones || []);
      setTriggers(triggersRes.data.triggers || []);
      setFraudQueue(queueRes.data.queue || []);
      setAppeals(appealsRes.data.appeals || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const handleRunLiveDemoSimulation = async () => {
    setSimulating(true);
    setSimStep(1); // Step 1: Ingesting Signals

    setTimeout(async () => {
      setSimStep(2); // Step 2: Polygon Matching
      setTimeout(async () => {
        setSimStep(3); // Step 3: Fraud Engine
        setTimeout(async () => {
          setSimStep(4); // Step 4: Claim Decision
          try {
            const res = await axios.post('/api/admin/simulate-disruption', {
              scenario: selectedSimType,
              zoneName: selectedSimZone
            });
            setSimLogs(res.data);
            setSimStep(5); // Step 5: Razorpay UPI Dispatched
            fetchDashboardData();
            setTimeout(() => {
              setSimulating(false);
            }, 3000);
          } catch (err) {
            console.error('Simulation error:', err);
            setSimulating(false);
          }
        }, 800);
      }, 800);
    }, 800);
  };

  const handleSimulateFraud = async (scenarioKey) => {
    setActiveFraudScenario(scenarioKey);
    try {
      await axios.post('/api/admin/simulate-fraud', { scenario: scenarioKey });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to simulate fraud attack vector', err);
    }
  };

  const handleResolveClaim = async (claimId, action) => {
    try {
      await axios.post(`/api/admin/claims/${claimId}/resolve`, {
        action,
        reason: action === 'approve' ? 'Admin approved claim over risk threshold' : 'Fraud risk score confirmed by admin'
      });
      setSelectedClaimEvidence(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to resolve claim', err);
    }
  };

  const handleThresholdChange = (zoneId, field, value) => {
    setEditingThresholds(prev => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        [field]: Number(value)
      }
    }));
  };

  const handleSaveThresholds = async (zone) => {
    const updated = editingThresholds[zone._id];
    if (!updated) return;

    try {
      const newThresholds = {
        ...zone.triggerThresholds,
        ...updated
      };
      await axios.put(`/api/admin/zones/${zone._id}`, { triggerThresholds: newThresholds });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update zone thresholds', err);
    }
  };

  const { totalActivePolicies, policiesByTier, financials, claimsByDisruption } = overview || {};

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-emerald-400" />
            Insurer Admin Console & Live Demo Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-Time Parametric Disruption Triggering, Telemetry Fraud Queue & Razorpay X Payouts
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Razorpay X Payout Engine Active</span>
        </div>
      </div>

      {/* Live Disruption Simulation Control Console (Hackathon Pitch Feature) */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-extrabold uppercase tracking-wider">
              ⚡ Pitch Presentation Controls
            </span>
            <h2 className="text-lg font-extrabold text-white mt-1">Live End-to-End Parametric Disruption Simulator</h2>
            <p className="text-xs text-slate-400">Simulate real-time weather breach and watch automated Razorpay UPI payouts execute</p>
          </div>

          <button
            onClick={handleRunLiveDemoSimulation}
            disabled={simulating}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {simulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Processing Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Trigger Live Disruption</span>
              </>
            )}
          </button>
        </div>

        {/* Controls selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-400 mb-1.5 block">Select Target Zone Polygon:</label>
            <select
              value={selectedSimZone}
              onChange={(e) => setSelectedSimZone(e.target.value)}
              disabled={simulating}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
            >
              <option value="Indiranagar">Bengaluru — Indiranagar Hub</option>
              <option value="Koramangala">Bengaluru — Koramangala Hub</option>
              <option value="Andheri West">Mumbai — Andheri West Hub</option>
              <option value="Connaught Place">Delhi — Connaught Place Hub</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 mb-1.5 block">Select Disruption Scenario:</label>
            <select
              value={selectedSimType}
              onChange={(e) => setSelectedSimType(e.target.value)}
              disabled={simulating}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
            >
              <option value="heavy_rain">🌧️ Heavy Monsoon Downpour (&gt;30 mm/h)</option>
              <option value="heatwave">🔥 Severe Summer Heatwave (&gt;40°C)</option>
              <option value="hazardous_aqi">😷 Hazardous Severe AQI (&gt;350)</option>
              <option value="flash_flood">🌊 Urban Flash Waterlogging (45cm)</option>
            </select>
          </div>
        </div>

        {/* 5-Step Live Pipeline Execution Progress */}
        {simStep > 0 && (
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">5-Step Automated Execution Pipeline:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-[11px]">
              {/* Step 1 */}
              <div className={`p-2.5 rounded-xl border font-bold transition-all ${
                simStep >= 1 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-600'
              }`}>
                1. Weather Signal Breach
              </div>
              {/* Step 2 */}
              <div className={`p-2.5 rounded-xl border font-bold transition-all ${
                simStep >= 2 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-600'
              }`}>
                2. Geo Polygon Match
              </div>
              {/* Step 3 */}
              <div className={`p-2.5 rounded-xl border font-bold transition-all ${
                simStep >= 3 ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-600'
              }`}>
                3. Composite Fraud Scoring
              </div>
              {/* Step 4 */}
              <div className={`p-2.5 rounded-xl border font-bold transition-all ${
                simStep >= 4 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-600'
              }`}>
                4. Claim Decision Engine
              </div>
              {/* Step 5 */}
              <div className={`p-2.5 rounded-xl border font-bold transition-all ${
                simStep >= 5 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-600'
              }`}>
                5. Razorpay UPI Dispatched 💸
              </div>
            </div>

            {simLogs && (
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                ✅ {simLogs.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial Overview & Loss Ratio Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Loss Ratio Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Loss Ratio (%)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">{financials?.lossRatioPercentage || '0.0'}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Weekly + Cumulative Disruption Payout Ratio</p>
        </div>

        {/* Total Premiums Collected Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Premiums Incepted</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">₹{financials?.totalPremiumsCollected || 0}</p>
          <p className="text-[11px] text-cyan-400 font-semibold mt-1">Active Weekly Policies</p>
        </div>

        {/* Total Payouts Disbursed Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Payouts Disbursed</span>
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">₹{financials?.totalPayoutsDisbursed || 0}</p>
          <p className="text-[11px] text-amber-400 font-semibold mt-1">Direct Razorpay UPI Transfers</p>
        </div>

        {/* Active Policies Breakdown Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Active Policyholders</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totalActivePolicies || 0} Workers</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Basic: {policiesByTier?.Basic || 0} | Std: {policiesByTier?.Standard || 0} | Prem: {policiesByTier?.Premium || 0}
          </p>
        </div>
      </div>

      {/* Next Week Predictive Analytics & Claims Forecast Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <LineChart className="w-5 h-5 text-cyan-400" />
              Next-Week Predictive Analytics & Claim Volume Forecast
            </h3>
            <p className="text-xs text-slate-400">Rule-based predictive projection of disruption probability & payout liabilities by zone</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px] font-extrabold uppercase">
            AI Time-Series Model (TODO ML Marker)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {forecast.map((f) => (
            <div key={f.zoneId || f.zoneName} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{f.zoneName}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                  f.heatLevel === 'CRITICAL_RISK'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : f.heatLevel === 'HIGH_RISK'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {f.predictedDisruptionProbability}% Risk
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Projected Claims:</span>
                  <strong className="text-white font-mono">{f.projectedClaimVolume} claims</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Liability:</span>
                  <strong className="text-emerald-400 font-mono">₹{f.projectedPayoutExposure}</strong>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 truncate">
                  Factor: <span className="text-slate-300">{f.primaryRiskFactor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone-Level Claims Density & Spatial Risk Heatmap Grid */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Zone-Level Claims Density & Spatial Risk Heatmap Grid
            </h3>
            <p className="text-xs text-slate-400">GeoJSON polygon spatial risk score mapping per delivery cluster</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {heatmap.map((h) => {
            const riskColors = {
              CRITICAL_RISK: 'from-rose-950/80 to-slate-950 border-rose-500/40 text-rose-300',
              HIGH_RISK: 'from-amber-950/60 to-slate-950 border-amber-500/40 text-amber-300',
              MODERATE_RISK: 'from-cyan-950/40 to-slate-950 border-cyan-500/30 text-cyan-300',
              LOW_RISK: 'from-emerald-950/40 to-slate-950 border-emerald-500/30 text-emerald-300'
            };

            return (
              <div
                key={h.zoneName}
                className={`p-4 rounded-2xl bg-gradient-to-br border shadow-xl space-y-3 ${riskColors[h.heatLevel] || riskColors.MODERATE_RISK}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-white">{h.zoneName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-950/80 border border-slate-700">
                    Score: {h.zoneRiskScore}/100
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Claims Density:</span>
                    <strong className="font-mono text-white">{h.claimsDensityScore} claims/sqkm</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Disruption Prob:</span>
                    <strong className="font-mono">{h.disruptionProb}%</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 truncate">
                  Boundary: GeoJSON Polygon ({h.coordinates?.length || 5} Vertices)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disruption Type Visual Breakdown Row */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-cyan-400" />
          Parametric Disruption Claims Breakdown by Event Type
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">🌧️ Rain</span>
            <p className="text-xl font-bold text-cyan-400 mt-1">{claimsByDisruption?.rain || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">🔥 Extreme Heat</span>
            <p className="text-xl font-bold text-amber-400 mt-1">{claimsByDisruption?.heat || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">😷 Hazardous AQI</span>
            <p className="text-xl font-bold text-rose-400 mt-1">{claimsByDisruption?.aqi || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">🌊 Flash Flood</span>
            <p className="text-xl font-bold text-blue-400 mt-1">{claimsByDisruption?.flood || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">🚨 Curfew / Strike</span>
            <p className="text-xl font-bold text-purple-400 mt-1">{claimsByDisruption?.curfew || 0}</p>
          </div>
        </div>
      </div>

      {/* Fraud Attack Simulator Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Simulate Fraud Attack Vectors (Pitch Demo)</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Active Attack: <strong className="text-rose-400 uppercase">{activeFraudScenario}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleSimulateFraud('normal')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
              activeFraudScenario === 'normal'
                ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            ✅ Normal Genuine Claim
          </button>

          <button
            onClick={() => handleSimulateFraud('gps_spoofing')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
              activeFraudScenario === 'gps_spoofing'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🚨 GPS Spoofing (+25 pts)
          </button>

          <button
            onClick={() => handleSimulateFraud('fake_weather')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
              activeFraudScenario === 'fake_weather'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🚴 Fake Weather Ride (+30 pts)
          </button>

          <button
            onClick={() => handleSimulateFraud('coordinated_ring')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
              activeFraudScenario === 'coordinated_ring'
                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🌐 Coordinated Attack Ring (+35 pts)
          </button>
        </div>
      </div>

      {/* Fraud Queue Table with Evidence Drill-Down */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Fraud Review Queue (Claims Score 31-100)
            </h3>
            <p className="text-xs text-slate-400">Under-Review & Blocked claims requiring telemetry evidence inspection</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {fraudQueue.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No claims in fraud queue needing review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Claim ID & Worker</th>
                  <th className="px-4 py-3">Fraud Score</th>
                  <th className="px-4 py-3">Claim State</th>
                  <th className="px-4 py-3">Payout Amount</th>
                  <th className="px-4 py-3">Telemetry Evidence</th>
                  <th className="px-4 py-3">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {fraudQueue.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div className="font-bold text-white">{c._id}</div>
                      <div className="text-slate-400">{c.workerName || c.workerMobile || 'Worker'}</div>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        c.fraudRiskScore >= 71
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {c.fraudRiskScore}/100
                      </span>
                    </td>

                    <td className="px-4 py-3 font-extrabold uppercase text-[10px]">
                      <span className={`px-2 py-0.5 rounded border ${
                        c.claimState === 'Blocked'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {c.claimState}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-extrabold text-emerald-400 text-sm">
                      ₹{c.payoutAmount}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedClaimEvidence(c)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] transition-colors"
                      >
                        <FileSearch className="w-3.5 h-3.5" />
                        <span>Inspect Evidence</span>
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleResolveClaim(c._id, 'approve')}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold transition-all text-[11px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleResolveClaim(c._id, 'reject')}
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold transition-all text-[11px]"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Telemetry Evidence Drill-Down Modal */}
      {selectedClaimEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedClaimEvidence(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <FileSearch className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Telemetry & Fraud Risk Evidence Bundle</h3>
                <p className="text-xs text-slate-400">Claim ID: {selectedClaimEvidence._id} | Risk Score: <strong className="text-amber-400">{selectedClaimEvidence.fraudRiskScore}/100</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white flex items-center gap-2 mb-1">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>GPS Movement & Speed Logs</span>
                </div>
                <p className="text-slate-300 font-mono text-[11px]">
                  Speed: {selectedClaimEvidence.evidence?.gpsEvidence?.detectedSpeedKmph} km/h<br />
                  Fix: Static inside disruption zone ({selectedClaimEvidence.evidence?.gpsEvidence?.staticDurationMins}m)<br />
                  Status: <strong className="text-amber-400">{selectedClaimEvidence.evidence?.gpsEvidence?.status}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Platform Delivery Telemetry</span>
                </div>
                <p className="text-slate-300 font-mono text-[11px]">
                  Completed Deliveries: {selectedClaimEvidence.evidence?.platformEvidence?.ordersCompletedInWindow} orders<br />
                  Platform: {selectedClaimEvidence.evidence?.platformEvidence?.platformName}<br />
                  Status: <strong className="text-amber-400">{selectedClaimEvidence.evidence?.platformEvidence?.status}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>Device Hardware Fingerprint</span>
                </div>
                <p className="text-slate-300 font-mono text-[11px]">
                  Fingerprint ID: {selectedClaimEvidence.evidence?.deviceEvidence?.fingerprintId}<br />
                  Duplicate Accounts: {selectedClaimEvidence.evidence?.deviceEvidence?.associatedWorkerAccounts} workers<br />
                  Status: <strong className="text-purple-400">{selectedClaimEvidence.evidence?.deviceEvidence?.isDuplicateDevice ? 'DUPLICATE_DEVICE_FLAG' : 'UNIQUE'}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white flex items-center gap-2 mb-1">
                  <Wifi className="w-4 h-4 text-rose-400" />
                  <span>Network Subnet & Ring Graph</span>
                </div>
                <p className="text-slate-300 font-mono text-[11px]">
                  Subnet IP: {selectedClaimEvidence.evidence?.networkEvidence?.subnetIp}<br />
                  Cluster Size: {selectedClaimEvidence.evidence?.networkEvidence?.clusterClaimsCount} claims in 10m<br />
                  Status: <strong className="text-rose-400">{selectedClaimEvidence.evidence?.networkEvidence?.isClusterAttacked ? 'RING_ATTACK_DETECTED' : 'CLEAN'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleResolveClaim(selectedClaimEvidence._id, 'reject')}
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-extrabold text-xs transition-colors"
              >
                Reject Claim & Uphold Block
              </button>

              <button
                onClick={() => handleResolveClaim(selectedClaimEvidence._id, 'approve')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                Overrule Score & Dispatch UPI Payout (₹{selectedClaimEvidence.payoutAmount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone Threshold Configuration Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Zone Management & Premium Band Configurator</h3>
            <p className="text-xs text-slate-400">Configure disruption trigger thresholds per geographic polygon zone</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading zone configurations...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Zone & City</th>
                  <th className="px-4 py-3">Live Telemetry</th>
                  <th className="px-4 py-3">Rain Threshold</th>
                  <th className="px-4 py-3">Heat Threshold</th>
                  <th className="px-4 py-3">AQI Threshold</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {zones.map((z) => {
                  const live = z.liveWeather || {};
                  const thresholds = z.triggerThresholds || {};
                  return (
                    <tr key={z._id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{z.zoneName}</div>
                        <div className="text-[11px] text-slate-400">{z.city}</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px]">
                        <span className="text-cyan-300">🌧️ {live.rainMmPerHour || 0} mm/h</span> |{' '}
                        <span className="text-amber-300">🔥 {live.heatTempCelsius || 30}°C</span>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editingThresholds[z._id]?.rainMmPerHour ?? thresholds.rainMmPerHour}
                          onChange={(e) => handleThresholdChange(z._id, 'rainMmPerHour', e.target.value)}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editingThresholds[z._id]?.heatTempCelsius ?? thresholds.heatTempCelsius}
                          onChange={(e) => handleThresholdChange(z._id, 'heatTempCelsius', e.target.value)}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editingThresholds[z._id]?.aqiThreshold ?? thresholds.aqiThreshold}
                          onChange={(e) => handleThresholdChange(z._id, 'aqiThreshold', e.target.value)}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSaveThresholds(z)}
                          className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold transition-all text-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
