import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, AlertCircle, TrendingUp, ShieldAlert, CheckCircle2, CloudRain, Flame, Wind, RefreshCw, Save, Zap, MapPin, Activity, Clock, ShieldCheck, Bug, Crosshair, MessageSquare, Check, X, FileSearch, PieChart, DollarSign, Smartphone, Wifi, Compass, LineChart, Layers, AlertTriangle, Play, ArrowRight, CheckCircle, ChevronDown } from 'lucide-react';
import axios from 'axios';

/* ── Custom Dropdown (Admin) ──────────────────────────────────────────── */
function CustomSelect({ label, value, options, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(prev => !prev)}
        className={`
          w-full flex items-center gap-2.5 px-4 py-3
          bg-[var(--input)] border rounded-[calc(var(--radius)*0.5)]
          text-xs font-bold text-[var(--foreground)]
          transition-all duration-200 select-none focus:outline-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${open
            ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-sm'
            : 'border-[var(--border)] hover:border-[var(--ring)]/60'}
        `}
      >
        {selectedOption?.emoji && (
          <span className="text-base leading-none shrink-0">{selectedOption.emoji}</span>
        )}
        <span className="flex-1 text-left truncate">{selectedOption?.label ?? value}</span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--muted-foreground)] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Panel */}
      {open && !disabled && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-[calc(var(--radius)*0.65)]
            border border-[var(--border)] bg-[var(--card)]
            shadow-[0_8px_32px_rgba(0,0,0,0.14)] overflow-hidden"
          style={{ animation: 'adminDropdownIn 0.15s cubic-bezier(.4,0,.2,1)' }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--muted)]/60">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              {label}
            </span>
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold
                      transition-colors duration-100 text-left
                      ${isSelected
                        ? 'bg-[var(--primary)]/12 text-[var(--primary)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--muted)]'}
                    `}
                  >
                    {opt.emoji
                      ? <span className="text-base leading-none shrink-0 w-5 text-center">{opt.emoji}</span>
                      : <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black
                          ${isSelected ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'}`}>
                          {opt.label.charAt(0)}
                        </span>
                    }
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--primary)] stroke-[3]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <style>{`
        @keyframes adminDropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

const ZONE_OPTIONS = [
  { value: 'Indiranagar',    label: 'Bengaluru — Indiranagar Hub' },
  { value: 'Koramangala',    label: 'Bengaluru — Koramangala Hub' },
  { value: 'Andheri West',   label: 'Mumbai — Andheri West Hub' },
  { value: 'Connaught Place',label: 'Delhi — Connaught Place Hub' },
];

const SCENARIO_OPTIONS = [
  { value: 'heavy_rain',    emoji: '🌧️', label: 'Heavy Monsoon Downpour (>30 mm/h)' },
  { value: 'heatwave',      emoji: '🔥', label: 'Severe Summer Heatwave (>40°C)' },
  { value: 'hazardous_aqi', emoji: '😷', label: 'Hazardous Severe AQI (>350)' },
  { value: 'flash_flood',   emoji: '🌊', label: 'Urban Flash Waterlogging (45cm)' },
];

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
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] px-3 py-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-5 sm:space-y-8 text-[var(--foreground)]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight flex items-start gap-2 font-sans leading-tight">
            <LayoutDashboard className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--primary)] mt-0.5 shrink-0" />
            <span>Insurer Admin Console &amp; Live Demo Simulator</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]/70 mt-1 ml-7 sm:ml-0">
            Real-Time Parametric Disruption Triggering, Telemetry Fraud Queue &amp; Razorpay X Payouts
          </p>
        </div>
        <div className="flex items-center self-start sm:self-auto gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)]/15 border border-[var(--primary)]/40 text-[var(--primary)] text-xs font-bold shadow-sm shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Razorpay X Payout Engine Active</span>
        </div>
      </div>

      {/* Live Disruption Simulation Control Console */}
      <div className="p-4 sm:p-6 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md space-y-4 sm:space-y-5 text-[var(--card-foreground)]">
        <div className="flex flex-col gap-3">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/40 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider inline-block mb-2">
              ⚡ Pitch Presentation Controls
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--foreground)] font-sans leading-snug">Live End-to-End Parametric Disruption Simulator</h2>
            <p className="text-xs font-medium text-[var(--foreground)]/70 mt-1">Simulate real-time weather breach and watch automated Razorpay UPI payouts execute</p>
          </div>

          <button
            onClick={handleRunLiveDemoSimulation}
            disabled={simulating}
            className="w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {simulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary-foreground)]" />
                <span>Processing Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Trigger Live Disruption</span>
              </>
            )}
          </button>
        </div>

        {/* Controls selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-[var(--foreground)] mb-1.5 block">Select Target Zone Polygon:</label>
            <CustomSelect
              label="Select Zone"
              value={selectedSimZone}
              options={ZONE_OPTIONS}
              onChange={setSelectedSimZone}
              disabled={simulating}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--foreground)] mb-1.5 block">Select Disruption Scenario:</label>
            <CustomSelect
              label="Select Scenario"
              value={selectedSimType}
              options={SCENARIO_OPTIONS}
              onChange={setSelectedSimType}
              disabled={simulating}
            />
          </div>
        </div>

        {/* 5-Step Live Pipeline Execution Progress */}
        {simStep > 0 && (
          <div className="pt-3 sm:pt-4 border-t border-[var(--border)] space-y-3">
            <h4 className="text-[10px] sm:text-xs font-extrabold text-[var(--foreground)] uppercase tracking-wider">5-Step Automated Execution Pipeline:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px] sm:text-xs font-bold">
              <div className={`p-2 sm:p-2.5 rounded-[calc(var(--radius)*0.4)] border transition-all ${
                simStep >= 1 ? 'bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]/60'
              }`}>1. Weather Signal</div>
              <div className={`p-2 sm:p-2.5 rounded-[calc(var(--radius)*0.4)] border transition-all ${
                simStep >= 2 ? 'bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]/60'
              }`}>2. Geo Polygon</div>
              <div className={`p-2 sm:p-2.5 rounded-[calc(var(--radius)*0.4)] border transition-all ${
                simStep >= 3 ? 'bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]' : 'bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]/60'
              }`}>3. Fraud Score</div>
              <div className={`p-2 sm:p-2.5 rounded-[calc(var(--radius)*0.4)] border transition-all ${
                simStep >= 4 ? 'bg-[var(--chart-3)]/25 border-[var(--chart-3)] text-[var(--chart-3)]' : 'bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]/60'
              }`}>4. Claim Decision</div>
              <div className={`col-span-2 sm:col-span-1 p-2 sm:p-2.5 rounded-[calc(var(--radius)*0.4)] border transition-all ${
                simStep >= 5 ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-sm' : 'bg-[var(--input)] border-[var(--border)] text-[var(--foreground)]/60'
              }`}>5. Razorpay UPI 💸</div>
            </div>

            {simLogs && (
              <div className="p-3 sm:p-3.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--background)] border border-[var(--primary)]/40 text-[var(--primary)] text-xs font-mono font-bold">
                ✅ {simLogs.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial Overview & Loss Ratio Metric Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Loss Ratio Card */}
        <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--foreground)]/80">Loss Ratio (%)</span>
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--primary)]">{financials?.lossRatioPercentage || '0.0'}%</p>
          <p className="text-[10px] sm:text-xs font-medium text-[var(--foreground)]/70 mt-1">Weekly Disruption Payout Ratio</p>
        </div>

        {/* Total Premiums Collected Card */}
        <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--foreground)]/80">Premiums Incepted</span>
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)]">₹{financials?.totalPremiumsCollected || 0}</p>
          <p className="text-[10px] sm:text-xs font-bold text-[var(--primary)] mt-1">Active Weekly Policies</p>
        </div>

        {/* Total Payouts Disbursed Card */}
        <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--foreground)]/80">Payouts Disbursed</span>
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent)] fill-[var(--accent)]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)]">₹{financials?.totalPayoutsDisbursed || 0}</p>
          <p className="text-[10px] sm:text-xs font-bold text-[var(--accent)] mt-1">Direct Razorpay UPI Transfers</p>
        </div>

        {/* Active Policies Breakdown Card */}
        <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--foreground)]/80">Active Policyholders</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)]">{totalActivePolicies || 0} Workers</p>
          <p className="text-[10px] sm:text-xs font-medium text-[var(--foreground)]/70 mt-1">
            Basic: <strong className="text-[var(--foreground)]">{policiesByTier?.Basic || 0}</strong> | Std: <strong className="text-[var(--foreground)]">{policiesByTier?.Standard || 0}</strong> | Prem: <strong className="text-[var(--foreground)]">{policiesByTier?.Premium || 0}</strong>
          </p>
        </div>
      </div>

      {/* Next Week Predictive Analytics & Claims Forecast Panel */}
      <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md space-y-4">
        {/* Section header — stacked on mobile, side-by-side on sm+ */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)] shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] font-sans leading-snug">
                Next-Week Predictive Analytics &amp; Claim Volume Forecast
              </h3>
            </div>
            <p className="text-[10px] sm:text-xs font-medium text-[var(--foreground)]/70 ml-6 sm:ml-7">
              Rule-based predictive projection of disruption probability &amp; payout liabilities by zone
            </p>
          </div>
          <span className="self-start sm:self-auto shrink-0 px-2.5 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-[10px] sm:text-xs font-extrabold uppercase whitespace-nowrap">
            AI Time-Series
          </span>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {forecast.map((f) => (
            <div key={f.zoneId || f.zoneName} className="p-3 sm:p-4 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-[var(--foreground)] truncate">{f.zoneName}</span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold uppercase border ${
                  f.heatLevel === 'CRITICAL_RISK'
                    ? 'bg-[var(--destructive)]/15 text-[var(--destructive)] border-[var(--destructive)]/40'
                    : f.heatLevel === 'HIGH_RISK'
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/40'
                    : 'bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/40'
                }`}>
                  {f.predictedDisruptionProbability}%
                </span>
              </div>
              <div className="space-y-1 text-[10px] sm:text-xs">
                <div className="flex justify-between text-[var(--foreground)]/80">
                  <span>Claims:</span>
                  <strong className="text-[var(--foreground)] font-mono">{f.projectedClaimVolume}</strong>
                </div>
                <div className="flex justify-between text-[var(--foreground)]/80">
                  <span>Liability:</span>
                  <strong className="text-[var(--primary)] font-mono font-bold">₹{f.projectedPayoutExposure}</strong>
                </div>
                <div className="text-[9px] sm:text-[10px] text-[var(--foreground)]/60 pt-1 border-t border-[var(--border)] truncate">
                  {f.primaryRiskFactor}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone-Level Claims Density & Spatial Risk Heatmap Grid */}
      <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md space-y-3 sm:space-y-4">
        <div className="flex items-start gap-2">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] font-sans leading-snug">
              Zone-Level Claims Density &amp; Spatial Risk Heatmap
            </h3>
            <p className="text-[10px] sm:text-xs font-medium text-[var(--foreground)]/70 mt-0.5">GeoJSON polygon spatial risk score mapping per delivery cluster</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
          {heatmap.map((h) => {
            const riskColors = {
              CRITICAL_RISK: 'bg-[var(--destructive)]/15 border-[var(--destructive)]/40 text-[var(--destructive)]',
              HIGH_RISK: 'bg-[var(--accent)]/20 border-[var(--accent)]/40 text-[var(--accent)]',
              MODERATE_RISK: 'bg-[var(--secondary)] border-[var(--border)] text-[var(--foreground)]',
              LOW_RISK: 'bg-[var(--primary)]/15 border-[var(--primary)]/40 text-[var(--primary)]'
            };

            return (
              <div
                key={h.zoneName}
                className={`p-3 sm:p-4 rounded-[calc(var(--radius)*0.6)] border shadow-sm space-y-2.5 ${riskColors[h.heatLevel] || riskColors.MODERATE_RISK}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-[var(--foreground)] truncate">{h.zoneName}</span>
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold uppercase bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]">
                    {h.zoneRiskScore}/100
                  </span>
                </div>
                <div className="space-y-1 text-[10px] sm:text-xs font-medium">
                  <div className="flex justify-between text-[var(--foreground)]/80">
                    <span>Density:</span>
                    <strong className="font-mono text-[var(--foreground)]">{h.claimsDensityScore}/sqkm</strong>
                  </div>
                  <div className="flex justify-between text-[var(--foreground)]/80">
                    <span>Prob:</span>
                    <strong className="font-mono text-[var(--foreground)] font-bold">{h.disruptionProb}%</strong>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-[var(--border)] text-[9px] font-mono text-[var(--foreground)]/60 truncate">
                  GeoJSON ({h.coordinates?.length || 5} Vertices)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disruption Type Visual Breakdown Row */}
      <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <PieChart className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--foreground)] font-sans">Parametric Claims Breakdown by Event Type</h3>
        </div>

        {/* 3-col on mobile (tight), 5-col sm+ */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 text-center">
          {[
            { emoji: '🌧️', label: 'Rain', value: claimsByDisruption?.rain || 0, color: 'text-[var(--primary)]' },
            { emoji: '🔥', label: 'Heat', value: claimsByDisruption?.heat || 0, color: 'text-[var(--accent)]' },
            { emoji: '😷', label: 'AQI', value: claimsByDisruption?.aqi || 0, color: 'text-[var(--destructive)]' },
            { emoji: '🌊', label: 'Flood', value: claimsByDisruption?.flood || 0, color: 'text-[var(--primary)]' },
            { emoji: '🚨', label: 'Curfew', value: claimsByDisruption?.curfew || 0, color: 'text-[var(--accent)]', fullWidth: true },
          ].map(({ emoji, label, value, color, fullWidth }) => (
            <div
              key={label}
              className={`p-2.5 sm:p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)] ${
                fullWidth ? 'col-span-3 sm:col-span-1 flex items-center justify-center gap-4 sm:flex-col sm:gap-0' : ''
              }`}
            >
              <div>
                <div className="text-base sm:text-lg leading-none mb-1">{emoji}</div>
                <p className="text-[9px] sm:text-[10px] font-bold text-[var(--foreground)]/70 uppercase tracking-wide">{label}</p>
              </div>
              <p className={`text-xl sm:text-2xl font-extrabold mt-0.5 sm:mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fraud Attack Simulator Bar */}
      <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-3">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[var(--destructive)] shrink-0" />
            <h3 className="text-sm font-bold text-[var(--foreground)] font-sans leading-snug">Simulate Fraud Attack Vectors</h3>
          </div>
          <span className="text-xs font-bold text-[var(--foreground)]/70 ml-6 sm:ml-0">
            Active: <strong className="text-[var(--destructive)] uppercase">{activeFraudScenario.replace(/_/g, ' ')}</strong>
          </span>
        </div>

        {/* 1 col mobile → 2 col xs → 4 col sm+ */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleSimulateFraud('normal')}
            className={`py-3 px-3 rounded-[calc(var(--radius)*0.5)] border text-xs font-bold transition-all active:scale-95 ${
              activeFraudScenario === 'normal'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-sm'
                : 'bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--ring)]'
            }`}
          >
            ✅ Normal Genuine Claim
          </button>

          <button
            onClick={() => handleSimulateFraud('gps_spoofing')}
            className={`py-3 px-3 rounded-[calc(var(--radius)*0.5)] border text-xs font-bold transition-all active:scale-95 ${
              activeFraudScenario === 'gps_spoofing'
                ? 'bg-[var(--destructive)] text-white border-[var(--destructive)] shadow-sm'
                : 'bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--destructive)]'
            }`}
          >
            🚨 GPS Spoofing <span className="opacity-60">(+25)</span>
          </button>

          <button
            onClick={() => handleSimulateFraud('fake_weather')}
            className={`py-3 px-3 rounded-[calc(var(--radius)*0.5)] border text-xs font-bold transition-all active:scale-95 ${
              activeFraudScenario === 'fake_weather'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                : 'bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]'
            }`}
          >
            🚴 Fake Weather Ride <span className="opacity-60">(+30)</span>
          </button>

          <button
            onClick={() => handleSimulateFraud('coordinated_ring')}
            className={`py-3 px-3 rounded-[calc(var(--radius)*0.5)] border text-xs font-bold transition-all active:scale-95 ${
              activeFraudScenario === 'coordinated_ring'
                ? 'bg-[var(--destructive)] text-white border-[var(--destructive)] shadow-sm'
                : 'bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--destructive)]'
            }`}
          >
            🌐 Coordinated Ring <span className="opacity-60">(+35)</span>
          </button>
        </div>
      </div>

      {/* Fraud Queue Table with Evidence Drill-Down */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-md">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] flex items-center gap-2 font-sans">
              <ShieldAlert className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>Fraud Review Queue
                <span className="text-[10px] sm:text-xs font-semibold text-[var(--muted-foreground)] ml-1.5">(Score 31–100)</span>
              </span>
            </h3>
            <p className="text-[10px] sm:text-xs font-medium text-[var(--foreground)]/70 mt-0.5 ml-6">Under-Review &amp; Blocked claims requiring telemetry inspection</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="shrink-0 p-2 rounded-[calc(var(--radius)*0.4)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--secondary-foreground)] transition-colors border border-[var(--border)]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {fraudQueue.length === 0 ? (
          <div className="p-8 text-center text-[var(--foreground)]/70 text-xs font-medium">
            No claims in fraud queue needing review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--secondary)] text-[var(--foreground)] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3">Claim ID & Worker</th>
                  <th className="px-4 py-3">Fraud Score</th>
                  <th className="px-4 py-3">Claim State</th>
                  <th className="px-4 py-3">Payout Amount</th>
                  <th className="px-4 py-3">Telemetry Evidence</th>
                  <th className="px-4 py-3">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {fraudQueue.map((c) => (
                  <tr key={c._id} className="hover:bg-[var(--secondary)]/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div className="font-bold text-[var(--foreground)]">{c._id}</div>
                      <div className="text-[var(--foreground)]/75">{c.workerName || c.workerMobile || 'Worker'}</div>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        c.fraudRiskScore >= 71
                          ? 'bg-[var(--destructive)]/15 text-[var(--destructive)] border border-[var(--destructive)]/40'
                          : 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/40'
                      }`}>
                        {c.fraudRiskScore}/100
                      </span>
                    </td>

                    <td className="px-4 py-3 font-extrabold uppercase text-[10px]">
                      <span className={`px-2 py-0.5 rounded border ${
                        c.claimState === 'Blocked'
                          ? 'bg-[var(--destructive)]/15 text-[var(--destructive)] border-[var(--destructive)]/40'
                          : 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/40'
                      }`}>
                        {c.claimState}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-extrabold text-[var(--primary)] text-sm">
                      ₹{c.payoutAmount}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedClaimEvidence(c)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-[calc(var(--radius)*0.4)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--secondary-foreground)] border border-[var(--border)] font-bold text-[11px] transition-colors"
                      >
                        <FileSearch className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span>Inspect Evidence</span>
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleResolveClaim(c._id, 'approve')}
                          className="px-3 py-1 rounded-[calc(var(--radius)*0.4)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:brightness-110 transition-all text-[11px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleResolveClaim(c._id, 'reject')}
                          className="px-3 py-1 rounded-[calc(var(--radius)*0.4)] bg-[var(--destructive)]/20 hover:bg-[var(--destructive)]/30 text-[var(--destructive)] border border-[var(--destructive)]/40 font-bold transition-all text-[11px]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[var(--card)] border-2 border-[var(--border)] rounded-[var(--radius)] p-6 shadow-2xl space-y-4 text-[var(--card-foreground)]">
            <button
              onClick={() => setSelectedClaimEvidence(null)}
              className="absolute top-4 right-4 text-[var(--foreground)]/70 hover:text-[var(--foreground)] p-1.5 rounded-[calc(var(--radius)*0.4)] hover:bg-[var(--muted)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <FileSearch className="w-6 h-6 text-[var(--primary)]" />
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Telemetry & Fraud Risk Evidence Bundle</h3>
                <p className="text-xs text-[var(--foreground)]/80">Claim ID: {selectedClaimEvidence._id} | Risk Score: <strong className="text-[var(--accent)]">{selectedClaimEvidence.fraudRiskScore}/100</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)]">
                <div className="font-bold text-[var(--foreground)] flex items-center gap-2 mb-1">
                  <Compass className="w-4 h-4 text-[var(--primary)]" />
                  <span>GPS Movement & Speed Logs</span>
                </div>
                <p className="text-[var(--foreground)]/85 font-mono text-[11px] leading-relaxed">
                  Speed: {selectedClaimEvidence.evidence?.gpsEvidence?.detectedSpeedKmph} km/h<br />
                  Fix: Static inside disruption zone ({selectedClaimEvidence.evidence?.gpsEvidence?.staticDurationMins}m)<br />
                  Status: <strong className="text-[var(--foreground)] font-bold">{selectedClaimEvidence.evidence?.gpsEvidence?.status}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)]">
                <div className="font-bold text-[var(--foreground)] flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-[var(--primary)]" />
                  <span>Platform Delivery Telemetry</span>
                </div>
                <p className="text-[var(--foreground)]/85 font-mono text-[11px] leading-relaxed">
                  Completed Deliveries: {selectedClaimEvidence.evidence?.platformEvidence?.ordersCompletedInWindow} orders<br />
                  Platform: {selectedClaimEvidence.evidence?.platformEvidence?.platformName}<br />
                  Status: <strong className="text-[var(--foreground)] font-bold">{selectedClaimEvidence.evidence?.platformEvidence?.status}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)]">
                <div className="font-bold text-[var(--foreground)] flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-[var(--accent)]" />
                  <span>Device Hardware Fingerprint</span>
                </div>
                <p className="text-[var(--foreground)]/85 font-mono text-[11px] leading-relaxed">
                  Fingerprint ID: {selectedClaimEvidence.evidence?.deviceEvidence?.fingerprintId}<br />
                  Duplicate Accounts: {selectedClaimEvidence.evidence?.deviceEvidence?.associatedWorkerAccounts} workers<br />
                  Status: <strong className="text-[var(--accent)] font-bold">{selectedClaimEvidence.evidence?.deviceEvidence?.isDuplicateDevice ? 'DUPLICATE_DEVICE_FLAG' : 'UNIQUE'}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)]">
                <div className="font-bold text-[var(--foreground)] flex items-center gap-2 mb-1">
                  <Wifi className="w-4 h-4 text-[var(--destructive)]" />
                  <span>Network Subnet & Ring Graph</span>
                </div>
                <p className="text-[var(--foreground)]/85 font-mono text-[11px] leading-relaxed">
                  Subnet IP: {selectedClaimEvidence.evidence?.networkEvidence?.subnetIp}<br />
                  Cluster Size: {selectedClaimEvidence.evidence?.networkEvidence?.clusterClaimsCount} claims in 10m<br />
                  Status: <strong className="text-[var(--destructive)] font-bold">{selectedClaimEvidence.evidence?.networkEvidence?.isClusterAttacked ? 'RING_ATTACK_DETECTED' : 'CLEAN'}</strong>
                </p>
              </div>
            </div>

            {/* Evidence modal action buttons — stack on mobile */}
            <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => handleResolveClaim(selectedClaimEvidence._id, 'reject')}
                className="px-4 py-3 xs:py-2.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--destructive)]/20 hover:bg-[var(--destructive)]/30 text-[var(--destructive)] border border-[var(--destructive)]/40 font-extrabold text-xs transition-colors text-center"
              >
                Reject &amp; Uphold Block
              </button>

              <button
                onClick={() => handleResolveClaim(selectedClaimEvidence._id, 'approve')}
                className="px-4 py-3 xs:py-2.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-xs shadow-md hover:brightness-110 transition-all text-center"
              >
                Approve &amp; Dispatch ₹{selectedClaimEvidence.payoutAmount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone Threshold Configuration Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-md">
        <div className="p-4 sm:p-5 border-b border-[var(--border)]">
          <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] font-sans">Zone Management &amp; Premium Band Configurator</h3>
          <p className="text-[10px] sm:text-xs font-medium text-[var(--foreground)]/70 mt-0.5">Configure disruption trigger thresholds per geographic polygon zone</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-[var(--foreground)]/70">Loading zone configurations...</p>
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="block sm:hidden divide-y divide-[var(--border)]">
              {zones.map((z) => {
                const live = z.liveWeather || {};
                const thresholds = z.triggerThresholds || {};
                return (
                  <div key={z._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-[var(--foreground)]">{z.zoneName}</div>
                        <div className="text-[10px] font-semibold text-[var(--foreground)]/60">{z.city}</div>
                      </div>
                      <div className="text-[10px] font-mono font-bold text-right">
                        <div className="text-[var(--primary)]">🌧️ {live.rainMmPerHour || 0} mm/h</div>
                        <div className="text-[var(--accent)]">🔥 {live.heatTempCelsius || 30}°C</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-[var(--foreground)]/60 uppercase tracking-wide block mb-1">Rain (mm/h)</label>
                        <input
                          type="number"
                          value={editingThresholds[z._id]?.rainMmPerHour ?? thresholds.rainMmPerHour}
                          onChange={(e) => handleThresholdChange(z._id, 'rainMmPerHour', e.target.value)}
                          className="w-full px-2 py-2 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.3)] text-[var(--foreground)] font-mono text-xs font-bold focus:border-[var(--ring)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-[var(--foreground)]/60 uppercase tracking-wide block mb-1">Heat (°C)</label>
                        <input
                          type="number"
                          value={editingThresholds[z._id]?.heatTempCelsius ?? thresholds.heatTempCelsius}
                          onChange={(e) => handleThresholdChange(z._id, 'heatTempCelsius', e.target.value)}
                          className="w-full px-2 py-2 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.3)] text-[var(--foreground)] font-mono text-xs font-bold focus:border-[var(--ring)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-[var(--foreground)]/60 uppercase tracking-wide block mb-1">AQI</label>
                        <input
                          type="number"
                          value={editingThresholds[z._id]?.aqiThreshold ?? thresholds.aqiThreshold}
                          onChange={(e) => handleThresholdChange(z._id, 'aqiThreshold', e.target.value)}
                          className="w-full px-2 py-2 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.3)] text-[var(--foreground)] font-mono text-xs font-bold focus:border-[var(--ring)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveThresholds(z)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs hover:brightness-110 shadow-sm active:scale-95 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Zone Thresholds</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--secondary)] text-[var(--foreground)] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-3">Zone &amp; City</th>
                    <th className="px-4 py-3">Live Telemetry</th>
                    <th className="px-4 py-3">Rain (mm/h)</th>
                    <th className="px-4 py-3">Heat (°C)</th>
                    <th className="px-4 py-3">AQI</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                  {zones.map((z) => {
                    const live = z.liveWeather || {};
                    const thresholds = z.triggerThresholds || {};
                    return (
                      <tr key={z._id} className="hover:bg-[var(--secondary)]/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-[var(--foreground)]">{z.zoneName}</div>
                          <div className="text-[11px] font-semibold text-[var(--foreground)]/75">{z.city}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] font-bold">
                          <span className="text-[var(--primary)]">🌧️ {live.rainMmPerHour || 0} mm/h</span> |{' '}
                          <span className="text-[var(--accent)]">🔥 {live.heatTempCelsius || 30}°C</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editingThresholds[z._id]?.rainMmPerHour ?? thresholds.rainMmPerHour}
                            onChange={(e) => handleThresholdChange(z._id, 'rainMmPerHour', e.target.value)}
                            className="w-16 px-2.5 py-1.5 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.3)] text-[var(--foreground)] font-mono text-xs font-bold focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editingThresholds[z._id]?.heatTempCelsius ?? thresholds.heatTempCelsius}
                            onChange={(e) => handleThresholdChange(z._id, 'heatTempCelsius', e.target.value)}
                            className="w-16 px-2.5 py-1.5 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.3)] text-[var(--foreground)] font-mono text-xs font-bold focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editingThresholds[z._id]?.aqiThreshold ?? thresholds.aqiThreshold}
                            onChange={(e) => handleThresholdChange(z._id, 'aqiThreshold', e.target.value)}
                            className="w-16 px-2.5 py-1.5 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.3)] text-[var(--foreground)] font-mono text-xs font-bold focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleSaveThresholds(z)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[calc(var(--radius)*0.3)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold transition-all text-xs hover:brightness-110 shadow-sm"
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
          </>
        )}
      </div>
    </div>
  );
}
