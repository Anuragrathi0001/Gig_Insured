import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';
import FloatingGlobeWidget from '@/components/FloatingGlobeWidget';
import DotPattern from '@/components/ui/dot-pattern';

const SCENARIOS = [
  {
    id: 'rain',
    pngIcon: '/icons/weather-rain.png',
    title: 'Rain',
    zone: 'Active in your delivery zone',
    step1Title: 'Torrential Rain',
    step1Badge: 'Orders Paused',
    payout: '450',
    borderColor: 'border-sky-500/30',
    withoutInsured: [
      { icon: '/icons/weather-rain.png', text: 'Downpour halts orders for 4 hours' },
      { icon: '/icons/pro-clock.png', text: 'Waiting under flyover with 0 orders' },
      { isLoss: true, text: '₹0 earned · Shift earnings lost' }
    ],
    withInsured: [
      { icon: '/icons/radar-detect.png', text: 'Sensors detect downpour & order drop' },
      { icon: '/icons/instant-payout.png', text: 'Instant UPI payout credited directly' },
      { isGain: true, text: '₹450 protected · Zero paperwork' }
    ]
  },
  {
    id: 'heat',
    pngIcon: '/icons/weather-heat.png',
    title: 'Heat',
    zone: 'Active in your delivery zone',
    step1Title: '44°C Heatwave',
    step1Badge: 'Riding Unsafe',
    payout: '350',
    borderColor: 'border-amber-500/30',
    withoutInsured: [
      { icon: '/icons/weather-heat.png', text: 'Heat advisory halts 2-wheeler deliveries' },
      { icon: '/icons/pro-clock.png', text: 'Forced off the road during afternoon' },
      { isLoss: true, text: '₹0 earned · Shift income lost' }
    ],
    withInsured: [
      { icon: '/icons/radar-detect.png', text: 'Weather telemetry confirms 44°C breach' },
      { icon: '/icons/instant-payout.png', text: 'Disruption allowance sent to UPI' },
      { isGain: true, text: '₹350 protected · Zero paperwork' }
    ]
  },
  {
    id: 'flood',
    pngIcon: '/icons/weather-flood.png',
    title: 'Floods',
    zone: 'Active in your delivery zone',
    step1Title: 'Waterlogged',
    step1Badge: 'Streets Blocked',
    payout: '500',
    borderColor: 'border-cyan-500/30',
    withoutInsured: [
      { icon: '/icons/weather-flood.png', text: 'Road waterlogged, bike routes blocked' },
      { icon: '/icons/pro-clock.png', text: 'Orders cancelled across delivery grid' },
      { isLoss: true, text: '₹0 earned · Shift incentives lost' }
    ],
    withInsured: [
      { icon: '/icons/radar-detect.png', text: 'Civic flood sensors verify street blockage' },
      { icon: '/icons/instant-payout.png', text: 'Direct instant settlement to linked UPI' },
      { isGain: true, text: '₹500 protected · Zero paperwork' }
    ]
  }
];

const HERO_LINE_1 = "Weather stops deliveries.";
const HERO_LINE_2 = "Not your income.";
const HERO_PARAGRAPH = "Instant UPI payout whenever heavy rain, heatwaves, or flooded roads stop orders. Zero claim forms.";

function TypewriterHero({ isMobile = false, onComplete, isComplete = false }) {
  const [line1, setLine1] = useState(isComplete ? HERO_LINE_1 : "");
  const [line2, setLine2] = useState(isComplete ? HERO_LINE_2 : "");
  const [paragraph, setParagraph] = useState(isComplete ? HERO_PARAGRAPH : "");
  const [phase, setPhase] = useState(isComplete ? 4 : 1); // 1 = line1, 2 = line2, 3 = paragraph, 4 = done

  useEffect(() => {
    if (isComplete) {
      setLine1(HERO_LINE_1);
      setLine2(HERO_LINE_2);
      setParagraph(HERO_PARAGRAPH);
      setPhase(4);
      return;
    }

    let isMounted = true;
    let timer;

    setLine1("");
    setLine2("");
    setParagraph("");
    setPhase(1);

    let i = 0;
    let j = 0;
    let k = 0;

    const typeLine1 = () => {
      if (!isMounted) return;
      if (i <= HERO_LINE_1.length) {
        setLine1(HERO_LINE_1.slice(0, i));
        i++;
        timer = setTimeout(typeLine1, 35);
      } else {
        setPhase(2);
        timer = setTimeout(typeLine2, 180);
      }
    };

    const typeLine2 = () => {
      if (!isMounted) return;
      if (j <= HERO_LINE_2.length) {
        setLine2(HERO_LINE_2.slice(0, j));
        j++;
        timer = setTimeout(typeLine2, 45);
      } else {
        setPhase(3);
        timer = setTimeout(typeParagraph, 220);
      }
    };

    const typeParagraph = () => {
      if (!isMounted) return;
      if (k <= HERO_PARAGRAPH.length) {
        setParagraph(HERO_PARAGRAPH.slice(0, k));
        k++;
        timer = setTimeout(typeParagraph, 16);
      } else {
        setPhase(4);
        timer = setTimeout(() => {
          if (isMounted) {
            onComplete?.();
          }
        }, 250);
      }
    };

    timer = setTimeout(typeLine1, 80);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isComplete]); // Run once on mount or when isComplete changes

  const handleSkip = () => {
    if (phase !== 4) {
      setLine1(HERO_LINE_1);
      setLine2(HERO_LINE_2);
      setParagraph(HERO_PARAGRAPH);
      setPhase(4);
      onComplete?.();
    }
  };

  const headingClasses = isMobile
    ? "text-3xl font-black tracking-tight leading-[1.2] px-2"
    : "text-4xl md:text-5xl font-black tracking-tight leading-[1.15]";

  const paragraphClasses = isMobile
    ? "text-sm text-[var(--foreground)]/80 max-w-xs mx-auto leading-relaxed px-2 mt-4"
    : "text-base text-[var(--foreground)]/80 max-w-md mx-auto leading-relaxed mt-4";

  return (
    <div
      className="relative w-full cursor-pointer sm:cursor-default"
      onClick={handleSkip}
      title={isMobile && phase !== 4 ? "Tap to skip animation" : undefined}
    >
      {/* Invisible skeleton that permanently locks the full layout and height from frame 0 */}
      <div className="invisible select-none pointer-events-none aria-hidden" aria-hidden="true">
        <h1 className={headingClasses}>
          <span className="block">{HERO_LINE_1}</span>
          <span className="block">{HERO_LINE_2}</span>
        </h1>
        <p className={paragraphClasses}>
          {HERO_PARAGRAPH}
        </p>
      </div>

      {/* Visible typewriter overlay that fills the exact locked area without shifting anything below */}
      <div className="absolute inset-0 flex flex-col justify-start">
        <h1 className={`${headingClasses} text-[var(--foreground)]`}>
          <span className="block">
            {line1}
            {phase === 1 && <span className="typewriter-cursor" />}
          </span>
          <span className="block text-[var(--primary)] font-black">
            {line2}
            {phase === 2 && <span className="typewriter-cursor" />}
          </span>
        </h1>

        <p className={paragraphClasses}>
          {paragraph}
          {(phase === 3 || phase === 4) && <span className="typewriter-cursor" />}
        </p>
      </div>
    </div>
  );
}

function ScenarioTabs({ selectedScenario, onSelectScenario, isMobile = false }) {
  const activeIndex = Math.max(0, SCENARIOS.findIndex((s) => s.id === selectedScenario.id));

  return (
    <div className={`relative flex rounded-full bg-[var(--card)] border border-[var(--border)] shadow-xs overflow-hidden mx-auto w-full select-none ${
      isMobile ? 'p-1 max-w-sm' : 'p-1 max-w-md'
    }`}>
      {/* Smooth Fluid Gliding Pill Indicator */}
      <div
        className="absolute rounded-full bg-[var(--primary)] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          top: '4px',
          bottom: '4px',
          width: 'calc((100% - 8px) / 3)',
          transform: `translateX(calc(${activeIndex} * 100%))`,
          left: '4px'
        }}
      />

      {SCENARIOS.map((s) => {
        const isSelected = selectedScenario.id === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectScenario(s)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 rounded-full text-center cursor-pointer transition-colors duration-200 ${
              isSelected
                ? 'text-[var(--primary-foreground)] font-extrabold'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-semibold'
            }`}
          >
            <img
              src={s.pngIcon}
              alt={s.title}
              className={`w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0 transition-all duration-300 ${
                isSelected ? 'scale-110 drop-shadow-sm' : 'opacity-70 scale-95 hover:opacity-100'
              }`}
            />
            <span className="text-xs leading-none">{s.title}</span>
          </button>
        );
      })}
    </div>
  );
}

function VisualProtectionFlow({ scenario, isMobile = false }) {
  if (isMobile) {
    return (
      <div className={`rounded-xl bg-[var(--card)] border ${scenario.borderColor} p-2.5 shadow-xs space-y-2 transition-colors duration-500`}>
        {/* Top Header */}
        <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-[var(--border)]">
          <div key={scenario.title} className="flex items-center gap-1.5 font-bold text-[var(--foreground)] animate-scenario-switch">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
            <span>{scenario.title} Disruption Protection</span>
          </div>
          <span className="text-[9px] font-bold text-[var(--accent)] dark:text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/20 flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            100% Automated
          </span>
        </div>

        {/* 3 Graphical Connected Stages */}
        <div className="flex items-center gap-1.5 justify-between">
          {/* Stage 1: Weather Event */}
          <div className="flex-1 min-w-0 rounded-xl bg-[var(--background)]/75 border border-[var(--border)] p-2 flex flex-col items-center text-center justify-between space-y-1 shadow-xs">
            <span className="w-4.5 h-4.5 rounded-full bg-[var(--secondary)] text-[9.5px] font-black text-[var(--foreground)] flex items-center justify-center">
              1
            </span>
            <div className="w-8.5 h-8.5 rounded-lg bg-[var(--card)] border border-[var(--border)] flex items-center justify-center p-1 shadow-xs overflow-hidden">
              <img key={scenario.pngIcon} src={scenario.pngIcon} alt="" className="w-full h-full object-contain animate-icon-pop" />
            </div>
            <div key={scenario.step1Title} className="animate-scenario-switch w-full">
              <div className="text-[11px] font-black text-[var(--foreground)] leading-tight truncate">
                {scenario.step1Title}
              </div>
              <div className="text-[9px] text-[var(--destructive)] font-bold mt-0.5 leading-none truncate">
                {scenario.step1Badge}
              </div>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]/50 shrink-0" />

          {/* Stage 2: Automated Sensor */}
          <div className="flex-1 min-w-0 rounded-xl bg-[var(--background)]/75 border border-[var(--primary)]/30 p-2 flex flex-col items-center text-center justify-between space-y-1 shadow-xs">
            <span className="w-4.5 h-4.5 rounded-full bg-[var(--primary)]/20 text-[9.5px] font-black text-[var(--accent)] dark:text-[var(--primary)] flex items-center justify-center">
              2
            </span>
            <div className="w-8.5 h-8.5 rounded-lg bg-[var(--card)] border border-[var(--primary)]/30 flex items-center justify-center p-1 shadow-xs overflow-hidden">
              <img src="/icons/radar-detect.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div className="w-full">
              <div className="text-[11px] font-black text-[var(--foreground)] leading-tight truncate">
                Auto-Detect
              </div>
              <div className="text-[9px] text-[var(--accent)] dark:text-[var(--primary)] font-bold mt-0.5 leading-none truncate">
                0 Claim Forms
              </div>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]/50 shrink-0" />

          {/* Stage 3: Instant UPI Payout */}
          <div className="flex-1 min-w-0 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/40 p-2 flex flex-col items-center text-center justify-between space-y-1 shadow-xs">
            <span className="w-4.5 h-4.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[9.5px] font-black flex items-center justify-center">
              3
            </span>
            <div className="w-8.5 h-8.5 rounded-lg bg-[var(--card)] border border-[var(--primary)]/40 flex items-center justify-center p-1 shadow-xs overflow-hidden">
              <img src="/icons/instant-payout.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div className="w-full">
              <div key={scenario.payout} className="text-xs font-black font-mono text-[var(--primary)] leading-tight animate-icon-pop">
                +₹{scenario.payout}
              </div>
              <div className="text-[9px] text-[var(--foreground)] font-bold mt-0.5 leading-none truncate">
                Instant UPI
              </div>
            </div>
          </div>
        </div>

        {/* Footer Assurance */}
        <div className="pt-1.5 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {scenario.zone}
          </span>
          <span className="text-[var(--accent)] dark:text-[var(--primary)] font-bold">
            Direct to bank · Under 60 sec
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-[var(--card)] border ${scenario.borderColor} p-3 sm:p-4.5 shadow-sm space-y-3 transition-colors duration-500`}>
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--border)]">
        <div key={scenario.title} className="flex items-center gap-1.5 font-extrabold text-[var(--foreground)] animate-scenario-switch">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
          <span>{scenario.title} Disruption Protection</span>
        </div>
        <span className="text-[10px] sm:text-[10.5px] font-bold text-[var(--accent)] dark:text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full border border-[var(--primary)]/20 flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          100% Automated
        </span>
      </div>

      {/* 3 Graphical Connected Stages */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 justify-between">
        {/* Stage 1: Weather Event */}
        <div className="flex-1 min-w-0 rounded-xl bg-[var(--background)]/75 border border-[var(--border)] p-2 sm:p-3 flex flex-col items-center text-center justify-between space-y-1.5 shadow-xs">
          <span className="w-5 h-5 rounded-full bg-[var(--secondary)] text-[10px] font-black text-[var(--foreground)] flex items-center justify-center">
            1
          </span>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center p-1.5 shadow-xs overflow-hidden">
            <img key={scenario.pngIcon} src={scenario.pngIcon} alt="" className="w-full h-full object-contain animate-icon-pop" />
          </div>
          <div key={scenario.step1Title} className="animate-scenario-switch">
            <div className="text-[11px] sm:text-xs font-black text-[var(--foreground)] leading-tight truncate">
              {scenario.step1Title}
            </div>
            <div className="text-[9px] sm:text-[10px] text-[var(--destructive)] font-bold mt-0.5">
              {scenario.step1Badge}
            </div>
          </div>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]/50 shrink-0" />

        {/* Stage 2: Automated Sensor */}
        <div className="flex-1 min-w-0 rounded-xl bg-[var(--background)]/75 border border-[var(--primary)]/30 p-2 sm:p-3 flex flex-col items-center text-center justify-between space-y-1.5 shadow-xs">
          <span className="w-5 h-5 rounded-full bg-[var(--primary)]/20 text-[10px] font-black text-[var(--accent)] dark:text-[var(--primary)] flex items-center justify-center">
            2
          </span>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--card)] border border-[var(--primary)]/30 flex items-center justify-center p-1.5 shadow-xs overflow-hidden">
            <img src="/icons/radar-detect.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-black text-[var(--foreground)] leading-tight">
              Auto-Detect
            </div>
            <div className="text-[9px] sm:text-[10px] text-[var(--accent)] dark:text-[var(--primary)] font-bold mt-0.5">
              0 Claim Forms
            </div>
          </div>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]/50 shrink-0" />

        {/* Stage 3: Instant UPI Payout */}
        <div className="flex-1 min-w-0 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/40 p-2 sm:p-3 flex flex-col items-center text-center justify-between space-y-1.5 shadow-xs">
          <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-black flex items-center justify-center">
            3
          </span>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--card)] border border-[var(--primary)]/40 flex items-center justify-center p-1.5 shadow-xs overflow-hidden">
            <img src="/icons/instant-payout.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div>
            <div key={scenario.payout} className="text-xs sm:text-sm font-black font-mono text-[var(--primary)] leading-tight animate-icon-pop">
              +₹{scenario.payout}
            </div>
            <div className="text-[9px] sm:text-[10px] text-[var(--foreground)] font-bold mt-0.5">
              Instant UPI
            </div>
          </div>
        </div>
      </div>

      {/* Footer Assurance */}
      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10.5px] text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {scenario.zone}
        </span>
        <span className="text-[var(--accent)] dark:text-[var(--primary)] font-bold">
          Direct to bank · Under 60 sec
        </span>
      </div>
    </div>
  );
}

export default function LandingPage({ onLogin, loading }) {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [notifTrigger, setNotifTrigger] = useState(0);
  const [mobileStep, setMobileStep] = useState(1); // 1, 2, or 3 on mobile
  const [isHeroAnimComplete, setIsHeroAnimComplete] = useState(false);
  const [isEncapsulated, setIsEncapsulated] = useState(false);

  // Touch gesture swipe support
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Trigger only if horizontal swipe exceeds 40px and dominates over vertical scroll
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 40) {
      if (deltaX < 0 && mobileStep < 3) {
        setMobileStep((prev) => prev + 1);
      } else if (deltaX > 0 && mobileStep > 1) {
        setMobileStep((prev) => prev - 1);
      }
    }
  };

  const handleGetStarted = () => {
    if (isEncapsulated) return;
    setIsEncapsulated(true);
    setTimeout(() => {
      setMobileStep(2);
      setTimeout(() => setIsEncapsulated(false), 400);
    }, 320);
  };

  const handleSelectScenario = (scenario) => {
    setSelectedScenario(scenario);
    setNotifTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full min-h-[calc(100vh-60px)] bg-[var(--background)] relative overflow-hidden">

      {/* Ambient Dot Pattern Background that smoothly fades to opaque background going to the corners */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 75%)',
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 75%)',
        }}
      >
        <DotPattern
          width={24}
          height={24}
          cx={1.3}
          cy={1.3}
          cr={1.3}
          className="w-[120%] h-[120%] -top-[10%] -left-[10%] fill-neutral-800/40 dark:fill-neutral-300/30 animate-dot-drift"
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          MOBILE CSS: MULTI-PAGE ONBOARDING FLOW (sm:hidden)
         ══════════════════════════════════════════════════════════ */}
      <div
        className="block sm:hidden w-full max-w-md mx-auto px-3 py-3 min-h-[calc(100vh-60px)] flex flex-col justify-between relative z-10 select-none overflow-hidden"
        style={{ contain: 'layout paint' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Hardware-Accelerated 60FPS Native CSS Slider Viewport */}
        <div className="flex-1 w-full overflow-hidden flex flex-col">
          <div
            className="flex w-full flex-1 will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform: `translate3d(-${(mobileStep - 1) * 100}%, 0, 0)`,
              WebkitTransform: `translate3d(-${(mobileStep - 1) * 100}%, 0, 0)`,
              touchAction: 'pan-y',
            }}
          >
            {/* ── Slide 1: Pure Centered Hero Text + Arrow ── */}
            <div
              className={`w-full shrink-0 flex flex-col items-center justify-center text-center space-y-6 py-6 my-auto px-1 ${
                mobileStep === 1 ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              <TypewriterHero
                isMobile
                onComplete={() => setIsHeroAnimComplete(true)}
                isComplete={isHeroAnimComplete}
              />

              {/* Down/Next "Get Started" Capsule Button to Page 2 - Revealed only after typewriter finishes */}
              <div
                className={`pt-4 flex flex-col items-center gap-2.5 transition-all duration-700 ease-out ${
                  isHeroAnimComplete
                    ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                    : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                }`}
              >
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className={`relative inline-flex items-center p-[3px] pr-4 rounded-full cursor-pointer select-none overflow-hidden active:scale-[0.97] transition-all duration-300 shadow-md ${
                    isEncapsulated
                      ? 'bg-[#EDEDED] border border-[#D1D5DB]'
                      : 'bg-[#0A0A0A] dark:bg-black border border-neutral-800 dark:border-neutral-700 shadow-black/15'
                  }`}
                  aria-label="Get Started"
                >
                  {/* Expanding White Pill Background */}
                  <div
                    className="absolute rounded-full bg-[#EDEDED] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                    style={{
                      top: isEncapsulated ? '0px' : '3px',
                      bottom: isEncapsulated ? '0px' : '3px',
                      left: isEncapsulated ? '0px' : '3px',
                      width: isEncapsulated ? '100%' : '32px',
                    }}
                  />

                  {/* Arrow Icon in Circle Position */}
                  <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4 text-black stroke-[2.2]" />
                  </div>

                  {/* "Get Started" Label */}
                  <span
                    className={`relative z-10 pl-2 text-[13px] font-bold tracking-tight transition-colors duration-200 ${
                      isEncapsulated ? 'text-black' : 'text-white'
                    }`}
                  >
                    Get Started
                  </span>
                </button>
              </div>
            </div>

            {/* ── Slide 2: Simulator & The Difference (Rich & Balanced) ── */}
            <div
              className={`w-full shrink-0 flex flex-col justify-between pt-1 pb-1 px-1 ${
                mobileStep === 2 ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              {/* Top & Center Content Group */}
              <div className="space-y-3">
                {/* Page 2 Header */}
                <div className="text-center space-y-0.5 pt-1 pb-2">
                  <h2 className="text-xl font-black text-[var(--foreground)] tracking-tight">
                    See How It Works
                  </h2>
                  <p className="text-xs font-bold text-[var(--accent)] dark:text-[var(--primary)]">
                    Live Doppler Radar · City Grid Active
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)] max-w-xs mx-auto leading-tight">
                    Tap a weather condition below to simulate automatic income protection.
                  </p>
                </div>

                {/* Capsule Scenario Tabs with Fluid Sliding Indicator */}
                <ScenarioTabs
                  selectedScenario={selectedScenario}
                  onSelectScenario={handleSelectScenario}
                  isMobile
                />

                {/* Compact Interactive Weather Protection Flow */}
                <VisualProtectionFlow
                  scenario={selectedScenario}
                  isMobile
                />

                {/* The Difference Section (Shifted lower with pt-5) */}
                <div className="pt-5 space-y-2">
                  <div className="text-center">
                    <span className="text-[13px] font-black uppercase tracking-wider text-[var(--foreground)]">
                      The Difference
                    </span>
                  </div>

                  {/* 2-Column Comparison Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Without Insured Card (Red Box) */}
                    <div className="p-2.5 rounded-xl bg-[var(--card)] border border-red-500/30 dark:border-red-500/25 flex flex-col justify-between space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                          <X className="w-3 h-3 text-red-500 stroke-[2.5]" />
                        </div>
                        <span className="text-[11.5px] font-bold text-[var(--foreground)] leading-none">Without</span>
                      </div>
                      <div className="space-y-1.5">
                        {selectedScenario.withoutInsured.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <span className={`text-[10.5px] leading-snug ${
                              item.isLoss
                                ? 'text-red-600 dark:text-red-400 font-bold'
                                : 'text-[var(--foreground)]/80 dark:text-[var(--foreground)]/75'
                            }`}>
                              • {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* With Insured Card (Green Box) */}
                    <div className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--accent)]/35 dark:border-[var(--primary)]/30 flex flex-col justify-between space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
                        </div>
                        <span className="text-[11.5px] font-bold text-[var(--foreground)] leading-none">With Insured</span>
                      </div>
                      <div className="space-y-1.5">
                        {selectedScenario.withInsured.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <span className={`text-[10.5px] leading-snug ${
                              item.isGain
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'text-[var(--foreground)]/80 dark:text-[var(--foreground)]/75'
                            }`}>
                              • {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation buttons: Back and Next Arrow anchored at bottom */}
              <div className="pt-2 mb-20 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className="w-20 h-9 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-semibold text-[var(--foreground)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileStep(3)}
                  className="w-20 h-9 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-md cursor-pointer active:scale-95 border border-[var(--border)]"
                  aria-label="Next step"
                >
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            </div>

            {/* ── Slide 3: 3 Steps & Final Google Sign In (Rich & Balanced) ── */}
            <div
              className={`w-full shrink-0 flex flex-col justify-between pt-1 pb-1 px-1 ${
                mobileStep === 3 ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              {/* Top Content Group */}
              <div className="space-y-3">
                {/* Header */}
                <div className="text-center space-y-0.5 pt-1 pb-3">
                  <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight">
                    3 Simple Steps
                  </h3>
                  <p className="text-xs font-bold text-[var(--accent)] dark:text-[var(--primary)]">
                    Simple &amp; Automated Protection
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)] max-w-xs mx-auto leading-tight">
                    Setup takes 60 seconds. Instant protection starts immediately.
                  </p>
                </div>

                {/* 3 Steps Cards */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center gap-3.5 shadow-xs">
                    <div className="w-11 h-11 rounded-xl bg-[var(--background)]/80 border border-[var(--border)] flex items-center justify-center p-2 shrink-0 shadow-xs">
                      <img src="/icons/join-team.png" alt="" className="w-full h-full object-contain dark:invert" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-extrabold text-[var(--foreground)]">1. Quick Join</span>
                        <span className="text-[10.5px] text-[var(--muted-foreground)] font-semibold">Takes 60s</span>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] leading-snug mt-0.5">Sign in with Google and link your UPI ID.</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center gap-3.5 shadow-xs">
                    <div className="w-11 h-11 rounded-xl bg-[var(--background)]/80 border border-[var(--border)] flex items-center justify-center p-2 shrink-0 shadow-xs">
                      <img src="/icons/radar-detect.png" alt="" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-extrabold text-[var(--foreground)]">2. Radar Tracking</span>
                        <span className="text-[10.5px] text-[var(--muted-foreground)] font-semibold">24/7 Auto</span>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] leading-snug mt-0.5">Sensors detect rain, heatwaves, and road floods.</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center gap-3.5 shadow-xs">
                    <div className="w-11 h-11 rounded-xl bg-[var(--background)]/80 border border-[var(--border)] flex items-center justify-center p-2 shrink-0 shadow-xs">
                      <img src="/icons/instant-payout.png" alt="" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-extrabold text-[var(--foreground)]">3. Direct Payout</span>
                        <span className="text-[10.5px] text-[var(--muted-foreground)] font-semibold">0 Forms</span>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] leading-snug mt-0.5">Instant cash transferred directly to your bank.</div>
                    </div>
                  </div>
                </div>

                {/* Partner Platforms Chips */}
                <div className="space-y-2.5 text-center pt-3.5">
                  <span className="block text-[10.5px] font-black uppercase tracking-wider text-[var(--accent)] dark:text-[var(--primary)]">
                    Built For Delivery Partners At
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                    {['Zomato', 'Swiggy', 'Zepto', 'Blinkit', 'Porter'].map((platform) => (
                      <span
                        key={platform}
                        className="px-2.5 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[10.5px] font-bold text-[var(--foreground)] shadow-xs"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                  <div className="pt-0.5">
                    <span className="px-3 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[10px] font-medium text-[var(--muted-foreground)] inline-flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                      + More platform support coming soon
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom CTA Group */}
              <div className="space-y-2.5 pt-2 mb-20">
                {/* Micro-Trust Highlights */}
                <div className="text-center text-[10.5px] text-[var(--muted-foreground)]">
                  <span>Zero Paperwork · Instant UPI Payouts · Cancel Anytime</span>
                </div>

                {/* FINAL GOOGLE SIGN IN BUTTON AT THE LAST PAGE */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onLogin}
                    disabled={loading}
                    className="w-full py-3 px-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-sm shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-[var(--border)] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                      </svg>
                    )}
                    <span>{loading ? 'Connecting...' : 'Get Protected with Google'}</span>
                  </button>

                  <p className="text-[10.5px] text-[var(--muted-foreground)]">
                    ₹15 / week · Takes 60 seconds · Direct UPI
                  </p>
                </div>

                {/* Back button */}
                <div className="pt-0.5 flex items-center justify-start">
                  <button
                    type="button"
                    onClick={() => setMobileStep(2)}
                    className="w-20 h-9 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-semibold text-[var(--foreground)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Step Indicator Dots for Mobile (Safari-Safe Reset) ── */}
        <div className="pt-2 pb-2 flex items-center justify-center gap-1.5 shrink-0">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => setMobileStep(step)}
              className={`block cursor-pointer transition-all shrink-0 border-0 outline-none ${mobileStep === step
                  ? 'w-5 h-2 bg-[var(--primary)] rounded-full'
                  : 'w-2 h-2 bg-[var(--muted-foreground)]/30 rounded-full hover:bg-[var(--muted-foreground)]/50'
                }`}
              style={{
                padding: 0,
                margin: 0,
                minHeight: 'unset',
                minWidth: 'unset',
                border: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
              aria-label={`Go to step ${step}`}
            />
          ))}
        </div>

      </div>


      {/* ══════════════════════════════════════════════════════════
          DESKTOP CSS: UNIFIED FULL LANDING PAGE (hidden sm:block)
         ══════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block w-full max-w-xl mx-auto px-6 py-10 space-y-12 relative z-20">

        {/* Desktop Hero */}
        <div className="text-center space-y-4 animate-fadeIn">
          <TypewriterHero />
        </div>

        {/* Desktop Disruption Simulator with Fluid Sliding Indicator */}
        <div className="space-y-3">
          <ScenarioTabs
            selectedScenario={selectedScenario}
            onSelectScenario={handleSelectScenario}
          />

          {/* Desktop 3-Step Graphical Flow */}
          <VisualProtectionFlow scenario={selectedScenario} />
        </div>

        {/* Desktop Comparison */}
        <div className="space-y-3">
          <h3 className="text-center text-base font-extrabold uppercase tracking-wider text-[var(--foreground)]">
            The Difference
          </h3>

          <div key={selectedScenario.id} className="grid grid-cols-2 gap-3 animate-scenario-switch">
            <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--destructive)]/30 dark:border-[var(--destructive)]/25 space-y-2">
              <div className="flex items-center gap-1.5 text-[var(--destructive)] font-bold text-xs">
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>Without Gig Insured</span>
              </div>
              <ul className="text-xs text-[var(--foreground)]/80 dark:text-[var(--foreground)]/80 space-y-1.5 pl-1">
                {selectedScenario.withoutInsured.map((item, idx) => (
                  <li key={idx} className={item.isLoss ? 'font-bold text-[var(--destructive)] pt-0.5' : ''}>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--primary)]/40 dark:border-[var(--primary)]/30 space-y-2">
              <div className="flex items-center gap-1.5 text-[var(--accent)] dark:text-[var(--primary)] font-bold text-xs">
                <Check className="w-4 h-4 stroke-[2.5] text-[var(--primary)]" />
                <span>With Gig Insured</span>
              </div>
              <ul className="text-xs text-[var(--foreground)]/80 dark:text-[var(--foreground)]/80 space-y-1.5 pl-1">
                {selectedScenario.withInsured.map((item, idx) => (
                  <li key={idx} className={item.isGain ? 'font-bold text-[var(--primary)] pt-0.5' : ''}>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Desktop 3 Steps */}
        <div className="space-y-3 pt-2 border-t border-[var(--border)]">
          <h3 className="text-center text-xs font-bold text-[var(--foreground)]">
            3 Simple Steps
          </h3>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] space-y-1">
              <img src="/icons/join-team.png" alt="" className="w-7 h-7 mx-auto object-contain dark:invert" />
              <div className="text-xs font-bold text-[var(--foreground)]">1. Join</div>
              <div className="text-[10px] text-[var(--muted-foreground)]">Link UPI in 60s</div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] space-y-1">
              <img src="/icons/radar-detect.png" alt="" className="w-7 h-7 mx-auto object-contain" />
              <div className="text-xs font-bold text-[var(--foreground)]">2. Track</div>
              <div className="text-[10px] text-[var(--muted-foreground)]">24/7 radar sensors</div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] space-y-1">
              <img src="/icons/instant-payout.png" alt="" className="w-7 h-7 mx-auto object-contain" />
              <div className="text-xs font-bold text-[var(--foreground)]">3. Payout</div>
              <div className="text-[10px] text-[var(--muted-foreground)]">Instant UPI cash</div>
            </div>
          </div>
        </div>

        {/* Desktop Final CTA: Get Protected with Google */}
        <div className="pt-2 flex flex-col items-center gap-2.5">
          <button
            onClick={onLogin}
            disabled={loading}
            className="w-auto px-8 py-3.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-base shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-[var(--border)] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            )}
            <span>{loading ? 'Connecting...' : 'Get Protected with Google'}</span>
          </button>

          <p className="text-xs text-[var(--muted-foreground)]">
            ₹15 / week · Takes 60 seconds · Direct UPI
          </p>
        </div>

        {/* Desktop Footer */}
        <div className="text-center text-[11px] text-[var(--muted-foreground)] pt-2 space-y-1">
          <p>Built for delivery partners at Zomato, Swiggy, Zepto & Blinkit.</p>
          <p className="text-[10px] opacity-70">Automatic weather income protection. No claim forms required.</p>
        </div>

      </div>


      {/* Floating 3D Radar Globe in Bottom-Right Corner */}
      <FloatingGlobeWidget />

      {/* CSS Animations */}
      <style>{`
        @keyframes notifPop {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .typewriter-cursor {
          display: inline-block;
          width: 2.5px;
          height: 0.85em;
          background-color: var(--primary);
          margin-left: 2px;
          vertical-align: -0.05em;
          animation: cursorBlink 0.75s step-start infinite;
        }
        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
