import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Star, Menu, X, ChevronDown, Sun, Moon } from 'lucide-react'

// ─── Formatting Helpers ───────────────────────────────────────────────────────
const inr = (n) => {
  if (n == null || isNaN(n)) return '₹0'
  const abs = Math.abs(n)
  let formatted
  if (abs >= 1e7) formatted = `₹${(n / 1e7).toFixed(2)} Cr`
  else if (abs >= 1e5) formatted = `₹${(n / 1e5).toFixed(2)} L`
  else formatted = `₹${Math.round(n).toLocaleString('en-IN')}`
  return formatted
}

const inrFull = (n) => {
  if (n == null || isNaN(n)) return '₹0'
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

const pct = (n) => `${(n * 100).toFixed(1)}%`
const pctVal = (n) => `${n.toFixed(1)}%`

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, format = (v) => v, className = '' }) {
  const [display, setDisplay] = useState(value)
  const prevValue = useRef(value)
  const animRef = useRef(null)

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const start = prevValue.current
    const end = value
    const duration = 400
    const startTime = performance.now()

    const step = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * eased
      setDisplay(current)
      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        prevValue.current = end
      }
    }
    animRef.current = requestAnimationFrame(step)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [value])

  return <span className={className}>{format(display)}</span>
}

// ─── Slider Component ─────────────────────────────────────────────────────────
function Slider({ label, value, onChange, description, star = false }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[var(--text-primary)] font-medium">{label}</span>
          {star && <Star size={12} className="text-[var(--text-primary)] fill-[var(--text-primary)]" />}
        </div>
        <span className="text-sm font-mono text-[var(--text-primary)] tabular-nums w-8 text-right">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {description && (
        <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
      )}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, label, sublabel, inverse = false }) {
  const pctFill = Math.min((value / max) * 100, 100)
  const color = inverse
    ? value < 50 ? '#22C55E' : value < 75 ? '#FACC15' : '#EF4444'
    : 'var(--text-primary)'

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
        <span className="text-sm font-mono text-[var(--text-primary)]">{value.toFixed(0)}<span className="text-[var(--text-muted)]">/100</span></span>
      </div>
      {sublabel && <p className="text-xs text-[var(--text-muted)] mb-2">{sublabel}</p>}
      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pctFill}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Delta Badge ──────────────────────────────────────────────────────────────
function DeltaBadge({ delta, format = (v) => v, inverse = false }) {
  if (delta === 0) return null
  const isPositive = inverse ? delta < 0 : delta > 0
  const sign = delta > 0 ? '+' : ''
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'text-[#22C55E] bg-[#22C55E]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
      {sign}{format(delta)}
    </span>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ title, value, format, delta, deltaFormat, inverse = false, subtitle }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-end gap-2 flex-wrap">
        <AnimatedNumber value={value} format={format} className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums" />
        {delta != null && <DeltaBadge delta={delta} format={deltaFormat} inverse={inverse} />}
      </div>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">{title}</h3>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-card)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm px-4 py-3 rounded-lg shadow-xl">
      {message}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Project inputs
  const [projectName, setProjectName] = useState('Your Project')
  const [flatPrice, setFlatPrice] = useState(8000000)
  const [developerMargin, setDeveloperMargin] = useState(8)
  const [adBudget, setAdBudget] = useState(500000)
  const [brokerCommission, setBrokerCommission] = useState(2)
  const [baseCPL, setBaseCPL] = useState(3100)

  // Ads layer
  const [pixelSlider, setPixelSlider] = useState(0)
  const [retargetingSlider, setRetargetingSlider] = useState(0)
  const [landingPageSlider, setLandingPageSlider] = useState(0)

  // Response & Speed
  const [voiceAISlider, setVoiceAISlider] = useState(0)
  const [speedToLeadSlider, setSpeedToLeadSlider] = useState(0)
  const [missedCallSlider, setMissedCallSlider] = useState(0)
  const [whatsappBotSlider, setWhatsappBotSlider] = useState(0)

  // Site Visit
  const [nurtureSlider, setNurtureSlider] = useState(0)
  const [cabSlider, setCabSlider] = useState(0)
  const [videoSlider, setVideoSlider] = useState(0)
  const [objectionSlider, setObjectionSlider] = useState(0)
  const [warmTransferSlider, setWarmTransferSlider] = useState(0)

  // Booking & Brand
  const [coachingSlider, setCoachingSlider] = useState(0)
  const [afterSalesSlider, setAfterSalesSlider] = useState(0)
  const [cpPrioritisationSlider, setCpPrioritisationSlider] = useState(0)
  const [gamifiedBrokerSlider, setGamifiedBrokerSlider] = useState(0)

  // UI state
  const [toast, setToast] = useState(null)
  const [allActive, setAllActive] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)

  const showToast = (msg) => setToast(msg)

  const allSliders = [
    pixelSlider, retargetingSlider, landingPageSlider,
    voiceAISlider, speedToLeadSlider, missedCallSlider, whatsappBotSlider,
    nurtureSlider, cabSlider, videoSlider, objectionSlider, warmTransferSlider,
    coachingSlider, afterSalesSlider, cpPrioritisationSlider, gamifiedBrokerSlider
  ]

  const isAllActive = allSliders.every(s => s === 100)
  const isAllZero = allSliders.every(s => s === 0)

  const handleActivateAll = () => {
    if (isAllActive) {
      setPixelSlider(0); setRetargetingSlider(0); setLandingPageSlider(0)
      setVoiceAISlider(0); setSpeedToLeadSlider(0); setMissedCallSlider(0); setWhatsappBotSlider(0)
      setNurtureSlider(0); setCabSlider(0); setVideoSlider(0); setObjectionSlider(0); setWarmTransferSlider(0)
      setCoachingSlider(0); setAfterSalesSlider(0); setCpPrioritisationSlider(0); setGamifiedBrokerSlider(0)
    } else {
      const setters = [
        setPixelSlider, setRetargetingSlider, setLandingPageSlider,
        setVoiceAISlider, setSpeedToLeadSlider, setMissedCallSlider, setWhatsappBotSlider,
        setNurtureSlider, setCabSlider, setVideoSlider, setObjectionSlider, setWarmTransferSlider,
        setCoachingSlider, setAfterSalesSlider, setCpPrioritisationSlider, setGamifiedBrokerSlider
      ]
      setters.forEach((setter, i) => {
        setTimeout(() => setter(100), i * 50)
      })
    }
  }

  // ─── Core Calculation Engine ──────────────────────────────────────────────
  const calc = useMemo(() => {
    // Ads layer
    const cplAfterPixel = baseCPL * (1 - (pixelSlider / 100) * 0.35)
    const cplAfterRetargeting = cplAfterPixel * (1 - (retargetingSlider / 100) * 0.20)
    const finalCPL = cplAfterRetargeting

    // Lead volume
    const baseLeads = adBudget / finalCPL
    const leadsWithLandingPage = baseLeads * (1 + (landingPageSlider / 100) * 0.25)
    const referralLeads = leadsWithLandingPage * ((afterSalesSlider / 100) * 0.05)
    const totalLeads = Math.round(leadsWithLandingPage + referralLeads)

    // Connection layer
    const baseConnectionRate = 0.35
    const connectionBoost =
      (voiceAISlider / 100) * 0.18 +
      (speedToLeadSlider / 100) * 0.30 +
      (missedCallSlider / 100) * 0.08 +
      (whatsappBotSlider / 100) * 0.12

    const finalConnectionRate = Math.min(baseConnectionRate + connectionBoost, 0.95)
    const connectedLeads = Math.round(totalLeads * finalConnectionRate)

    const baseWastedCallPct = 0.65
    const wastedCallReduction = (whatsappBotSlider / 100) * 0.40
    const finalWastedCallPct = Math.max(baseWastedCallPct - wastedCallReduction, 0.15)

    // Site visit layer
    const baseVisitRate = 0.12
    const visitBoost =
      (nurtureSlider / 100) * 0.22 +
      (cabSlider / 100) * 0.10 +
      (videoSlider / 100) * 0.15 +
      (objectionSlider / 100) * 0.12 +
      (warmTransferSlider / 100) * 0.20

    const finalVisitRate = Math.min(baseVisitRate + visitBoost, 0.85)
    const siteVisits = Math.round(connectedLeads * finalVisitRate)

    const baseShowUpRate = 0.55
    const showUpBoost = (cabSlider / 100) * 0.10 + (videoSlider / 100) * 0.08
    const finalShowUpRate = Math.min(baseShowUpRate + showUpBoost, 0.95)
    const actualVisits = Math.round(siteVisits * finalShowUpRate)
    const costPerVisit = adBudget / Math.max(actualVisits, 1)

    // Booking layer
    const baseBookingRate = 0.08
    const bookingBoost = (coachingSlider / 100) * 0.10
    const finalBookingRate = Math.min(baseBookingRate + bookingBoost, 0.45)
    const bookings = actualVisits * finalBookingRate

    // Revenue
    const revenueFromBookings = bookings * flatPrice
    const grossMargin = revenueFromBookings * (developerMargin / 100)

    // Broker vs Direct
    const directModuleScore = (voiceAISlider + speedToLeadSlider + warmTransferSlider + videoSlider) / 400
    const baseBrokerDependency = 0.80
    const brokerDependency = Math.max(baseBrokerDependency - directModuleScore * 0.60, 0.20)
    const directBookings = bookings * (1 - brokerDependency)
    const brokerBookings = bookings * brokerDependency
    const brokerCommissionPaid = brokerBookings * flatPrice * (brokerCommission / 100)
    const commissionSaved = directBookings * flatPrice * (brokerCommission / 100)

    // Response time
    const baseResponseTime = 240
    const responseTimeReduction =
      (speedToLeadSlider / 100) * 0.85 +
      (voiceAISlider / 100) * 0.10 +
      (missedCallSlider / 100) * 0.05
    const finalResponseTime = Math.max(baseResponseTime * (1 - responseTimeReduction), 4)

    // System ROI
    const systemCost = 25000
    const netGain = grossMargin + commissionSaved - systemCost
    const roiMultiple = netGain / systemCost

    // Health scores
    const responsivenessScore = Math.min(
      (voiceAISlider * 0.30 + speedToLeadSlider * 0.40 + missedCallSlider * 0.15 + whatsappBotSlider * 0.15),
      100
    )
    const leadHealthScore = Math.min(
      finalConnectionRate * 60 + (1 - finalWastedCallPct) * 40,
      100
    )
    const brokerDependencyScore = brokerDependency * 100

    return {
      finalCPL, totalLeads, connectedLeads, finalConnectionRate, finalWastedCallPct,
      finalVisitRate, siteVisits, finalShowUpRate, actualVisits, costPerVisit,
      finalBookingRate, bookings, revenueFromBookings, grossMargin,
      brokerDependency, directBookings, brokerBookings, brokerCommissionPaid, commissionSaved,
      finalResponseTime, systemCost: 25000, netGain, roiMultiple,
      responsivenessScore, leadHealthScore, brokerDependencyScore,
      directModuleScore
    }
  }, [
    baseCPL, adBudget, flatPrice, developerMargin, brokerCommission,
    pixelSlider, retargetingSlider, landingPageSlider,
    voiceAISlider, speedToLeadSlider, missedCallSlider, whatsappBotSlider,
    nurtureSlider, cabSlider, videoSlider, objectionSlider, warmTransferSlider,
    coachingSlider, afterSalesSlider, cpPrioritisationSlider, gamifiedBrokerSlider
  ])

  // ─── Baseline (zero state) ────────────────────────────────────────────────
  const baseline = useMemo(() => {
    const baseLeads = adBudget / baseCPL
    const totalLeads = Math.round(baseLeads)
    const connectedLeads = Math.round(totalLeads * 0.35)
    const siteVisits = Math.round(connectedLeads * 0.12)
    const actualVisits = Math.round(siteVisits * 0.55)
    const bookings = actualVisits * 0.08
    const revenueFromBookings = bookings * flatPrice
    const grossMargin = revenueFromBookings * (developerMargin / 100)
    const brokerCommissionPaid = bookings * 0.80 * flatPrice * (brokerCommission / 100)
    const costPerVisit = adBudget / Math.max(actualVisits, 1)
    const netGain = grossMargin - 25000

    return {
      cpl: baseCPL, totalLeads, siteVisits: actualVisits, bookings,
      revenueFromBookings, grossMargin, brokerCommissionPaid, costPerVisit,
      netGain, connectionRate: 0.35, visitRate: 0.12, bookingRate: 0.08
    }
  }, [adBudget, flatPrice, developerMargin, brokerCommission, baseCPL])

  // ─── 90-Day Projection Data ───────────────────────────────────────────────
  const projectionData = useMemo(() => {
    const coachingCompound = coachingSlider > 0 ? 1 : 0
    return [
      {
        month: 'Month 1',
        without: baseline.bookings,
        with: calc.bookings,
        revenueWithout: baseline.revenueFromBookings / 1e5,
        revenueWith: calc.revenueFromBookings / 1e5,
      },
      {
        month: 'Month 2',
        without: baseline.bookings,
        with: calc.bookings * (1 + coachingCompound * 0.08),
        revenueWithout: baseline.revenueFromBookings / 1e5,
        revenueWith: calc.revenueFromBookings * (1 + coachingCompound * 0.08) / 1e5,
      },
      {
        month: 'Month 3',
        without: baseline.bookings,
        with: calc.bookings * (1 + coachingCompound * 0.18),
        revenueWithout: baseline.revenueFromBookings / 1e5,
        revenueWith: calc.revenueFromBookings * (1 + coachingCompound * 0.18) / 1e5,
      },
    ]
  }, [calc, baseline, coachingSlider])

  // ─── Leak Calculator (zero state vs current) ──────────────────────────────
  const leakCalc = useMemo(() => {
    const maxPossibleBookings = calc.actualVisits * 0.45
    const missedBookings = Math.max(0, maxPossibleBookings - calc.bookings)
    const missedRevenue = missedBookings * flatPrice

    return {
      leadsLostToSlowResponse: Math.round(calc.totalLeads * (1 - calc.finalConnectionRate)),
      estimatedBookingsLost: missedBookings.toFixed(1),
      revenueLost: missedRevenue
    }
  }, [calc, baseline, flatPrice])

  // ─── Number formatting helpers ────────────────────────────────────────────
  const fmtResponseTime = (mins) => {
    if (mins < 60) return `${Math.round(mins)} min`
    return `${(mins / 60).toFixed(1)} hrs`
  }

  const handleFlatPriceInput = (val) => {
    const cleaned = val.replace(/[^0-9]/g, '')
    setFlatPrice(Number(cleaned) || 0)
  }

  const handleAdBudgetInput = (val) => {
    const cleaned = val.replace(/[^0-9]/g, '')
    setAdBudget(Number(cleaned) || 0)
  }

  const handleBaseCPLInput = (val) => {
    const cleaned = val.replace(/[^0-9]/g, '')
    setBaseCPL(Number(cleaned) || 0)
  }

  const inputClass = "w-full bg-transparent border border-[var(--border-input)] rounded px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"

  return (
    <div className={`min-h-screen font-sans${!isDark ? ' light' : ''}`} style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] no-print" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div>
            <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Celiyo</span>
            <span className="hidden sm:block text-[10px] text-[var(--text-muted)] -mt-1">AI CRM ROI Simulator</span>
          </div>

          {/* Center toggles */}
          <div className="hidden md:flex items-center gap-2">
            <button className="text-sm px-3 py-1.5 rounded border border-[var(--border-accent)] text-[var(--text-primary)] bg-transparent font-medium">
              Simulator Mode
            </button>
            <button
              onClick={() => showToast('Live Mode — Coming Soon')}
              className="text-sm px-3 py-1.5 rounded border border-[var(--border-input)] text-[var(--text-muted)] bg-transparent font-medium hover:border-[var(--border-btn)] transition-colors"
            >
              Live Mode
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Dark / Light toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded border border-[var(--border-btn)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)] transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => window.print()}
              className="text-sm px-3 py-1.5 rounded border border-[var(--border-btn)] text-[var(--text-primary)] bg-transparent font-medium hover:border-[var(--border-accent)] transition-colors"
            >
              Export PDF
            </button>
            <button
              className="md:hidden p-1.5 text-[var(--text-muted)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] px-4 py-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-base)' }}>
            <button className="text-sm px-3 py-2 rounded border border-[var(--border-accent)] text-[var(--text-primary)] bg-transparent font-medium text-left">
              Simulator Mode
            </button>
            <button
              onClick={() => { showToast('Live Mode — Coming Soon'); setMobileMenuOpen(false) }}
              className="text-sm px-3 py-2 rounded border border-[var(--border-input)] text-[var(--text-muted)] bg-transparent font-medium text-left"
            >
              Live Mode
            </button>
          </div>
        )}
      </header>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-4 py-4 h-[calc(100vh-56px)] print:h-auto flex flex-col">

        {/* Print header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Celiyo — AI CRM ROI Report</h1>
          <p className="text-sm text-gray-600">{projectName} · Generated {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

          {/* ─── LEFT PANEL — INPUTS (scrollable) ─────────────────────────── */}
          <div className="w-full lg:w-[40%] overflow-y-auto no-print space-y-6 pr-1">

            {/* Section 1 — Project */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
              <SectionHeader title="Your Project" />

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Developer / Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Prestige Lakeside"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Average Flat Price (₹)</label>
                  <input
                    type="text"
                    value={flatPrice.toLocaleString('en-IN')}
                    onChange={(e) => handleFlatPriceInput(e.target.value)}
                    className={inputClass}
                    placeholder="80,00,000"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">{inr(flatPrice)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1">Developer Margin %</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={developerMargin}
                      onChange={(e) => setDeveloperMargin(Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1">Broker Commission %</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={brokerCommission}
                      onChange={(e) => setBrokerCommission(Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1">Monthly Ad Budget (₹)</label>
                    <input
                      type="text"
                      value={adBudget.toLocaleString('en-IN')}
                      onChange={(e) => handleAdBudgetInput(e.target.value)}
                      className={inputClass}
                      placeholder="5,00,000"
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-1">{inr(adBudget)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1">Base Cost Per Lead (₹)</label>
                    <input
                      type="text"
                      value={baseCPL.toLocaleString('en-IN')}
                      onChange={(e) => handleBaseCPLInput(e.target.value)}
                      className={inputClass}
                      placeholder="3,100"
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-1">{inrFull(baseCPL)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 — Ads Layer */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
              <SectionHeader title="Ads & Lead Generation" subtitle="Managed by Celiyo Ads Service" />
              <Slider label="Pixel & CAPI Integration" value={pixelSlider} onChange={setPixelSlider}
                description="Better targeting = cheaper leads" />
              <Slider label="Retargeting Campaigns" value={retargetingSlider} onChange={setRetargetingSlider}
                description="Re-engages warm audiences" />
              <Slider label="Landing Page Optimisation" value={landingPageSlider} onChange={setLandingPageSlider}
                description="More leads from same budget" />
            </div>

            {/* Section 3 — Response Layer */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
              <SectionHeader title="Speed & Response Layer" />
              <Slider label="24/7 Voice AI (Midnight Pickup)" value={voiceAISlider} onChange={setVoiceAISlider}
                description="Picks up every call within 2 rings, 24/7" />
              <Slider label="Speed to Lead (5-Min Blitz)" value={speedToLeadSlider} onChange={setSpeedToLeadSlider}
                description="WhatsApp + Call + Email within 5 minutes" star={true} />
              <Slider label="Missed Call WhatsApp Recovery" value={missedCallSlider} onChange={setMissedCallSlider}
                description="Instant WhatsApp to every missed call" />
              <Slider label="WhatsApp Qualification Bot" value={whatsappBotSlider} onChange={setWhatsappBotSlider}
                description="Scores every lead in 90 seconds" />
            </div>

            {/* Section 4 — Site Visit Layer */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
              <SectionHeader title="Site Visit Layer" />
              <Slider label="Auto Nurture Sequence" value={nurtureSlider} onChange={setNurtureSlider}
                description="Keeps prospect warm until they visit" />
              <Slider label="Cab Booking on WhatsApp" value={cabSlider} onChange={setCabSlider}
                description="One-tap cab removes the #1 no-show reason" />
              <Slider label="Personalised Video Engine" value={videoSlider} onChange={setVideoSlider}
                description="Developer says every prospect's name in a video" />
              <Slider label="Objection Handling AI" value={objectionSlider} onChange={setObjectionSlider}
                description="Live AI responses for every objection" />
              <Slider label="Warm Transfer Inbound AI" value={warmTransferSlider} onChange={setWarmTransferSlider}
                description="Hot leads transferred with full brief to closers" />
            </div>

            {/* Section 5 — Booking & Brand */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
              <SectionHeader title="Booking & Brand Layer" />
              <Slider label="Sales Coaching Intelligence" value={coachingSlider} onChange={setCoachingSlider}
                description="Weekly AI report on why deals are won and lost" />
              <Slider label="After-Sales Onboarding Journey" value={afterSalesSlider} onChange={setAfterSalesSlider}
                description="Happy buyers become referral sources" />
              <Slider label="CP Prioritisation Engine" value={cpPrioritisationSlider} onChange={setCpPrioritisationSlider}
                description="Best brokers get priority inventory access" />
              <Slider label="Gamified Broker Portal" value={gamifiedBrokerSlider} onChange={setGamifiedBrokerSlider}
                description="Brokers compete to prioritise your project" />
            </div>

            {/* Activate All */}
            <button
              onClick={handleActivateAll}
              className={`w-full py-3 rounded-lg border border-[var(--border-accent)] text-[var(--text-primary)] bg-transparent font-medium text-sm transition-all duration-200 ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-gray-900 hover:text-white'}`}
            >
              {isAllActive ? 'Reset to Zero' : 'Activate All Modules →'}
            </button>
          </div>

          {/* ─── RIGHT PANEL — METRICS ─────────────────────────────────────── */}
          <div className="w-full lg:w-[60%] overflow-y-auto space-y-4 pb-4">

            {/* Print-only summary */}
            <div className="hidden print:block text-sm mb-4">
              <p>Ad Budget: {inrFull(adBudget)} / month · Flat Price: {inr(flatPrice)} · Margin: {developerMargin}%</p>
            </div>

            {/* Row 1 — Big 4 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                title="Leads / Month"
                value={calc.totalLeads}
                format={(v) => Math.round(v).toLocaleString('en-IN')}
                delta={calc.totalLeads - baseline.totalLeads}
                deltaFormat={(v) => `+${Math.round(Math.abs(v)).toLocaleString('en-IN')}`}
              />
              <MetricCard
                title="Cost Per Lead"
                value={calc.finalCPL}
                format={(v) => inrFull(v)}
                delta={calc.finalCPL - baseline.cpl}
                deltaFormat={(v) => inrFull(Math.abs(v))}
                inverse={true}
              />
              <MetricCard
                title="Site Visits / Month"
                value={calc.actualVisits}
                format={(v) => Math.round(v).toLocaleString('en-IN')}
                delta={calc.actualVisits - baseline.siteVisits}
                deltaFormat={(v) => `+${Math.round(Math.abs(v))}`}
              />
              <MetricCard
                title="Bookings / Month"
                value={calc.bookings}
                format={(v) => v.toFixed(1)}
                delta={calc.bookings - baseline.bookings}
                deltaFormat={(v) => `+${Math.abs(v).toFixed(1)}`}
              />
            </div>

            {/* Row 2 — Efficiency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard
                title="Cost Per Visit"
                value={calc.costPerVisit}
                format={(v) => inrFull(v)}
                delta={calc.costPerVisit - baseline.costPerVisit}
                deltaFormat={(v) => inrFull(Math.abs(v))}
                inverse={true}
              />
              <MetricCard
                title="Lead → Visit %"
                value={calc.finalVisitRate * 100}
                format={(v) => `${v.toFixed(1)}%`}
                delta={(calc.finalVisitRate - baseline.visitRate) * 100}
                deltaFormat={(v) => `+${Math.abs(v).toFixed(1)}%`}
              />
              <MetricCard
                title="Visit → Booking %"
                value={calc.finalBookingRate * 100}
                format={(v) => `${v.toFixed(1)}%`}
                delta={(calc.finalBookingRate - baseline.bookingRate) * 100}
                deltaFormat={(v) => `+${Math.abs(v).toFixed(1)}%`}
              />
            </div>

            {/* Row 3 — Revenue & Savings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Projected Revenue / Month</p>
                <AnimatedNumber
                  value={calc.revenueFromBookings}
                  format={(v) => inr(v)}
                  className="text-3xl font-bold text-[var(--text-primary)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {calc.bookings.toFixed(1)} bookings × {inr(flatPrice)}
                </p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Broker Commission Saved</p>
                <AnimatedNumber
                  value={calc.commissionSaved}
                  format={(v) => inr(v)}
                  className="text-3xl font-bold text-[#22C55E]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-2">From direct lead bookings</p>
              </div>
            </div>

            {/* Row 5 — Leak Calculator */}
            <div className="bg-[var(--bg-pain)] border border-[var(--border-pain)] rounded-lg p-5">
              <p className="text-xs text-[var(--text-pain)] uppercase tracking-wider mb-4">Leads You Are Currently Losing</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    <AnimatedNumber
                      value={leakCalc.leadsLostToSlowResponse}
                      format={(v) => Math.round(v).toLocaleString('en-IN')}
                    />
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Leads lost to slow response / mo</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    <AnimatedNumber
                      value={Number(leakCalc.estimatedBookingsLost)}
                      format={(v) => v.toFixed(1)}
                    />
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Estimated bookings lost / mo</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-pain)]">
                    <AnimatedNumber
                      value={leakCalc.revenueLost}
                      format={(v) => inr(v)}
                    />
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Revenue walking out the door / mo</p>
                </div>
              </div>
            </div>

            {/* Row 6 — Response Time */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Response Time</p>
              <div className="flex items-end justify-between">
                <div>
                  <AnimatedNumber
                    value={calc.finalResponseTime}
                    format={(v) => fmtResponseTime(v)}
                    className="text-3xl font-bold text-[var(--text-primary)]"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">Avg. time to first contact</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--text-muted)]">Baseline</p>
                  <p className="text-lg font-semibold text-[var(--text-dim)]">4 hrs 40 min</p>
                </div>
              </div>
            </div>

            {/* Row 7 — ROI Summary */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">System Cost / Month</p>
                  <p className="text-lg font-semibold text-[var(--text-muted)]">₹25,000</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Your ROI</p>
                  <AnimatedNumber
                    value={calc.roiMultiple}
                    format={(v) => `${v.toFixed(1)}x`}
                    className="text-4xl font-bold text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-muted)]">
                  ₹25,000 invested →{' '}
                  <span className="text-[var(--text-primary)] font-medium">{inr(calc.netGain)}</span> net gain this month
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  One booking covers{' '}
                  <span className="text-[var(--text-primary)]">
                    {calc.bookings > 0 ? ((flatPrice * developerMargin / 100) / 25000).toFixed(1) : '—'}
                  </span> months of Celiyo
                </p>
              </div>
            </div>

            {/* Row 8 — Comparison Table */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 overflow-x-auto">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4">Before vs After Comparison</p>
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-[var(--text-muted)] font-normal pb-3 pr-4">Metric</th>
                    <th className="text-right text-[var(--text-muted)] font-normal pb-3 pr-4">Without Celiyo</th>
                    <th className="text-right text-[var(--text-muted)] font-normal pb-3 pr-4">With Celiyo</th>
                    <th className="text-right text-[var(--text-muted)] font-normal pb-3">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {[
                    { label: 'Monthly Leads', baseline: baseline.totalLeads, current: calc.totalLeads, fmt: (v) => Math.round(v).toLocaleString('en-IN'), inverse: false },
                    { label: 'Cost Per Lead', baseline: baseline.cpl, current: calc.finalCPL, fmt: inrFull, inverse: true },
                    { label: 'Site Visits', baseline: baseline.siteVisits, current: calc.actualVisits, fmt: (v) => Math.round(v), inverse: false },
                    { label: 'Bookings / Month', baseline: baseline.bookings, current: calc.bookings, fmt: (v) => v.toFixed(1), inverse: false },
                    { label: 'Revenue / Month', baseline: baseline.revenueFromBookings, current: calc.revenueFromBookings, fmt: inr, inverse: false },
                    { label: 'Broker Commission Paid', baseline: baseline.brokerCommissionPaid, current: calc.brokerCommissionPaid, fmt: inr, inverse: true },
                    { label: 'System Cost', baseline: 0, current: 25000, fmt: inrFull, inverse: true },
                    { label: 'Net Gain / Month', baseline: baseline.netGain, current: calc.netGain, fmt: inr, inverse: false },
                  ].map((row) => {
                    const delta = row.current - row.baseline
                    const isPositive = row.inverse ? delta < 0 : delta > 0
                    return (
                      <tr key={row.label}>
                        <td className="py-2.5 pr-4 text-[var(--text-muted)]">{row.label}</td>
                        <td className="py-2.5 pr-4 text-right text-[var(--text-dim)]">{row.fmt(row.baseline)}</td>
                        <td className="py-2.5 pr-4 text-right text-[var(--text-primary)] font-medium">{row.fmt(row.current)}</td>
                        <td className={`py-2.5 text-right text-xs font-medium ${isPositive ? 'text-[#22C55E]' : delta === 0 ? 'text-[var(--text-muted)]' : 'text-[#EF4444]'}`}>
                          {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${row.fmt(delta)}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Row 9 — 90-Day Projection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bookings chart */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">90-Day Bookings Projection</p>
                <p className="text-xs text-[var(--text-dim)] mb-4">Bookings per month over 3 months</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Line type="monotone" dataKey="without" stroke="var(--border-input)" strokeWidth={2} dot={false} name="Without Celiyo" />
                    <Line type="monotone" dataKey="with" stroke="var(--text-primary)" strokeWidth={2} dot={false} name="With Celiyo" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-[var(--border-input)]" />
                    <span className="text-xs text-[var(--text-dim)]">Without Celiyo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-[var(--text-primary)]" />
                    <span className="text-xs text-[var(--text-muted)]">With Celiyo</span>
                  </div>
                </div>
              </div>

              {/* Revenue chart */}
              <div className="hidden md:block bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">90-Day Revenue Projection</p>
                <p className="text-xs text-[var(--text-dim)] mb-4">Revenue in Lakhs (₹L) per month</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="withFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--text-primary)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--text-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      formatter={(v) => [`₹${v.toFixed(1)}L`, '']}
                    />
                    <Area type="monotone" dataKey="revenueWithout" stroke="var(--border-input)" strokeWidth={2} fill="none" name="Without Celiyo" />
                    <Area type="monotone" dataKey="revenueWith" stroke="var(--text-primary)" strokeWidth={2} fill="url(#withFill)" name="With Celiyo" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-[var(--border-input)]" />
                    <span className="text-xs text-[var(--text-dim)]">Without Celiyo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-[var(--text-primary)]" />
                    <span className="text-xs text-[var(--text-muted)]">With Celiyo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4 — Health Indicators (moved to end) */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4">Health Indicators</p>
              <div className="space-y-5">
                <ProgressBar
                  value={calc.responsivenessScore}
                  label="Brand Responsiveness Score"
                  sublabel="How fast your brand responds to every lead"
                />
                <ProgressBar
                  value={calc.leadHealthScore}
                  label="Lead Health Score"
                  sublabel="Connection rate + qualification quality"
                />
                <ProgressBar
                  value={calc.brokerDependencyScore}
                  label="Broker Dependency Index"
                  sublabel="Lower is better — target below 40%"
                  inverse={true}
                />
              </div>
            </div>

            {/* Print footer */}
            <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center">
              <p className="text-xs text-gray-500">Generated by Celiyo — AI CRM for Real Estate</p>
            </div>
          </div>
        </div>
      </main>

      {/* ─── MOBILE STICKY BAR ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[var(--bg-card)] border-t border-[var(--border)] px-4 py-3 no-print z-30">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-[var(--text-primary)]">
              <AnimatedNumber value={calc.bookings} format={(v) => v.toFixed(1)} />
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Bookings/mo</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--text-primary)]">
              <AnimatedNumber value={calc.revenueFromBookings} format={(v) => inr(v)} />
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Revenue/mo</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--text-primary)]">
              <AnimatedNumber value={calc.roiMultiple} format={(v) => `${v.toFixed(1)}x`} />
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">ROI</p>
          </div>
        </div>
      </div>

      {/* ─── TOAST ───────────────────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
