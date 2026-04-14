import React, { useState, useMemo } from 'react';

const STRFeasibilityCalculator = () => {
  // Purchase & Financing
  const [purchasePrice, setPurchasePrice] = useState(350000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30);
  const [interestRate, setInterestRate] = useState(7.5);
  const [loanTermYears, setLoanTermYears] = useState(15);
  const [closingCostPercent, setClosingCostPercent] = useState(5);
  const [furnishingCost, setFurnishingCost] = useState(15000);
  
  // Property Details
  const [bedrooms, setBedrooms] = useState(2);
  const [marketType, setMarketType] = useState('consolidated');
  
  // Revenue - Seasonality Model
  const [highSeasonNightlyRate, setHighSeasonNightlyRate] = useState(180);
  const [lowSeasonNightlyRate, setLowSeasonNightlyRate] = useState(110);
  const [shoulderSeasonNightlyRate, setShoulderSeasonNightlyRate] = useState(140);
  const [highSeasonOccupancy, setHighSeasonOccupancy] = useState(75);
  const [lowSeasonOccupancy, setLowSeasonOccupancy] = useState(45);
  const [shoulderSeasonOccupancy, setShoulderSeasonOccupancy] = useState(60);
  const [highSeasonMonths, setHighSeasonMonths] = useState(4);
  const [lowSeasonMonths, setLowSeasonMonths] = useState(3);
  const [personalUseDays, setPersonalUseDays] = useState(14);
  
  // Operating Expenses
  const [propertyMgmtPercent, setPropertyMgmtPercent] = useState(20);
  const [cleaningFeePerTurn, setCleaningFeePerTurn] = useState(65);
  const [avgStayLength, setAvgStayLength] = useState(4.5);
  const [platformFeePercent, setPlatformFeePercent] = useState(3);
  const [hoaMonthly, setHoaMonthly] = useState(350);
  const [utilitiesMonthly, setUtilitiesMonthly] = useState(180);
  const [insuranceAnnual, setInsuranceAnnual] = useState(1800);
  const [propertyTaxPercent, setPropertyTaxPercent] = useState(0.15);
  const [maintenancePercent, setMaintenancePercent] = useState(1.5);
  const [permitsAnnual, setPermitsAnnual] = useState(400);
  const [marketingAnnual, setMarketingAnnual] = useState(600);
  
  const [activeTab, setActiveTab] = useState('purchase');
  
  const calculations = useMemo(() => {
    // Financing calculations
    const downPayment = purchasePrice * (downPaymentPercent / 100);
    const loanAmount = purchasePrice - downPayment;
    const closingCosts = purchasePrice * (closingCostPercent / 100);
    const totalCashInvested = downPayment + closingCosts + furnishingCost;
    
    // Monthly mortgage payment (P&I)
    const monthlyRate = (interestRate / 100) / 12;
    const numPayments = loanTermYears * 12;
    const monthlyMortgage = loanAmount > 0 
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;
    const annualDebtService = monthlyMortgage * 12;
    
    // Revenue calculations with seasonality
    const shoulderSeasonMonths = 12 - highSeasonMonths - lowSeasonMonths;
    const availableDays = 365 - personalUseDays;
    
    const highSeasonDays = (highSeasonMonths / 12) * availableDays;
    const lowSeasonDays = (lowSeasonMonths / 12) * availableDays;
    const shoulderSeasonDays = (shoulderSeasonMonths / 12) * availableDays;
    
    const highSeasonRevenue = highSeasonDays * (highSeasonOccupancy / 100) * highSeasonNightlyRate;
    const lowSeasonRevenue = lowSeasonDays * (lowSeasonOccupancy / 100) * lowSeasonNightlyRate;
    const shoulderSeasonRevenue = shoulderSeasonDays * (shoulderSeasonOccupancy / 100) * shoulderSeasonNightlyRate;
    
    const grossRentalIncome = highSeasonRevenue + lowSeasonRevenue + shoulderSeasonRevenue;
    
    // Calculate nights booked for expense calculations
    const totalNightsBooked = 
      (highSeasonDays * highSeasonOccupancy / 100) +
      (lowSeasonDays * lowSeasonOccupancy / 100) +
      (shoulderSeasonDays * shoulderSeasonOccupancy / 100);
    
    const blendedOccupancy = (totalNightsBooked / availableDays) * 100;
    const numberOfTurnovers = totalNightsBooked / avgStayLength;
    
    // Operating expenses
    const propertyManagement = grossRentalIncome * (propertyMgmtPercent / 100);
    const totalCleaningCost = numberOfTurnovers * cleaningFeePerTurn;
    const platformFees = grossRentalIncome * (platformFeePercent / 100);
    const hoaAnnual = hoaMonthly * 12;
    const utilitiesAnnual = utilitiesMonthly * 12;
    const propertyTax = purchasePrice * (propertyTaxPercent / 100);
    const maintenanceReserve = purchasePrice * (maintenancePercent / 100);
    
    const totalOperatingExpenses = 
      propertyManagement + 
      totalCleaningCost + 
      platformFees + 
      hoaAnnual + 
      utilitiesAnnual + 
      insuranceAnnual + 
      propertyTax + 
      maintenanceReserve + 
      permitsAnnual + 
      marketingAnnual;
    
    // Net Operating Income (NOI) - before debt service
    const noi = grossRentalIncome - totalOperatingExpenses;
    
    // Cash Flow - after debt service
    const annualCashFlow = noi - annualDebtService;
    const monthlyCashFlow = annualCashFlow / 12;
    
    // ROI Metrics
    const capRate = (noi / purchasePrice) * 100;
    const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
    const grossYield = (grossRentalIncome / purchasePrice) * 100;
    const netYield = (noi / purchasePrice) * 100;
    
    // Expense ratio
    const expenseRatio = (totalOperatingExpenses / grossRentalIncome) * 100;
    
    // Break-even analysis
    const breakEvenOccupancy = totalOperatingExpenses > 0 
      ? ((totalOperatingExpenses + annualDebtService) / grossRentalIncome) * blendedOccupancy
      : 0;
    
    // Market stability adjustment
    const stabilityMultiplier = marketType === 'consolidated' ? 1.0 : 
                               marketType === 'emerging' ? 0.9 : 0.75;
    const adjustedCashFlow = annualCashFlow * stabilityMultiplier;
    
    return {
      // Financing
      downPayment,
      loanAmount,
      closingCosts,
      totalCashInvested,
      monthlyMortgage,
      annualDebtService,
      
      // Revenue
      grossRentalIncome,
      highSeasonRevenue,
      lowSeasonRevenue,
      shoulderSeasonRevenue,
      totalNightsBooked,
      blendedOccupancy,
      numberOfTurnovers,
      
      // Expenses
      propertyManagement,
      totalCleaningCost,
      platformFees,
      hoaAnnual,
      utilitiesAnnual,
      propertyTax,
      maintenanceReserve,
      totalOperatingExpenses,
      expenseRatio,
      
      // Returns
      noi,
      annualCashFlow,
      monthlyCashFlow,
      capRate,
      cashOnCash,
      grossYield,
      netYield,
      breakEvenOccupancy,
      adjustedCashFlow,
      stabilityMultiplier
    };
  }, [
    purchasePrice, downPaymentPercent, interestRate, loanTermYears, closingCostPercent, furnishingCost,
    highSeasonNightlyRate, lowSeasonNightlyRate, shoulderSeasonNightlyRate,
    highSeasonOccupancy, lowSeasonOccupancy, shoulderSeasonOccupancy,
    highSeasonMonths, lowSeasonMonths, personalUseDays,
    propertyMgmtPercent, cleaningFeePerTurn, avgStayLength, platformFeePercent,
    hoaMonthly, utilitiesMonthly, insuranceAnnual, propertyTaxPercent,
    maintenancePercent, permitsAnnual, marketingAnnual, marketType
  ]);
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };
  
  const formatPercent = (val) => val.toFixed(2) + '%';
  
  const InputGroup = ({ label, value, onChange, prefix, suffix, min, max, step = 1, tooltip }) => (
    <div className="mb-4">
      <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
        {tooltip && (
          <span className="ml-1.5 text-amber-400 cursor-help" title={tooltip}>ⓘ</span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className={`w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 text-white font-medium focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all ${prefix ? 'pl-8' : 'pl-3'} ${suffix ? 'pr-12' : 'pr-3'}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">{suffix}</span>
        )}
      </div>
    </div>
  );
  
  const MetricCard = ({ label, value, subtext, highlight, warning }) => (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30' : warning ? 'bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/30' : 'bg-slate-800/30 border-slate-700/50'}`}>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-amber-400' : warning ? 'text-red-400' : 'text-white'}`}>{value}</div>
      {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
    </div>
  );
  
  const Tab = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${active ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
    >
      {label}
    </button>
  );
  
  const getROIVerdict = (cashOnCash, capRate) => {
    if (cashOnCash >= 8 && capRate >= 6) return { text: 'Strong Investment', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (cashOnCash >= 5 && capRate >= 4) return { text: 'Moderate Returns', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (cashOnCash >= 0) return { text: 'Lifestyle Play', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    return { text: 'Negative Cash Flow', color: 'text-red-400', bg: 'bg-red-500/20' };
  };
  
  const verdict = getROIVerdict(calculations.cashOnCash, calculations.capRate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@700&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Space Mono', monospace" }}>
              STR Feasibility Calculator
            </h1>
            <p className="text-slate-400 text-sm">Riviera Maya & Mexico Beach Markets • True Net ROI Modeling</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 p-1 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <Tab id="purchase" label="Purchase & Finance" active={activeTab === 'purchase'} onClick={setActiveTab} />
            <Tab id="revenue" label="Revenue & Seasonality" active={activeTab === 'revenue'} onClick={setActiveTab} />
            <Tab id="expenses" label="Operating Expenses" active={activeTab === 'expenses'} onClick={setActiveTab} />
          </div>
          
          {/* Tab Content */}
          <div className="bg-slate-800/20 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
            {activeTab === 'purchase' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs">1</span>
                    Acquisition Costs
                  </h3>
                  <InputGroup label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" min={50000} step={5000} />
                  <InputGroup label="Down Payment" value={downPaymentPercent} onChange={setDownPaymentPercent} suffix="%" min={0} max={100} step={5} tooltip="Typical range: 20-30% for investment properties in Mexico" />
                  <InputGroup label="Closing Costs" value={closingCostPercent} onChange={setClosingCostPercent} suffix="%" min={0} max={15} step={0.5} tooltip="Mexico typically 4-6% including notary, taxes, and legal fees" />
                  <InputGroup label="Furnishing & Setup" value={furnishingCost} onChange={setFurnishingCost} prefix="$" min={0} step={1000} tooltip="$9-15k typical for 2BR vacation rental" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs">2</span>
                    Financing Terms
                  </h3>
                  <InputGroup label="Interest Rate" value={interestRate} onChange={setInterestRate} suffix="%" min={0} max={20} step={0.25} tooltip="Mexico financing typically 7-10%" />
                  <InputGroup label="Loan Term" value={loanTermYears} onChange={setLoanTermYears} suffix="yrs" min={5} max={30} step={5} />
                  <InputGroup label="Bedrooms" value={bedrooms} onChange={setBedrooms} min={1} max={10} />
                  
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                      Market Type
                      <span className="ml-1.5 text-amber-400 cursor-help" title="Consolidated markets have stable demand; emerging/speculative have higher risk">ⓘ</span>
                    </label>
                    <select 
                      value={marketType} 
                      onChange={(e) => setMarketType(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-medium focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    >
                      <option value="consolidated">Consolidated (Akumal, Puerto Aventuras, Playacar)</option>
                      <option value="emerging">Emerging (Tulum Centro, New Developments)</option>
                      <option value="speculative">Speculative (Remote/Pre-construction)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'revenue' && (
              <div>
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                  <h4 className="text-amber-400 font-medium mb-2">📅 Seasonality Model</h4>
                  <p className="text-sm text-slate-400">The Riviera Maya has distinct seasons. Model realistic occupancy by season for accurate projections.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <h4 className="text-emerald-400 font-medium mb-3">🌴 High Season</h4>
                    <p className="text-xs text-slate-500 mb-3">Dec-Mar peak tourism</p>
                    <InputGroup label="Nightly Rate" value={highSeasonNightlyRate} onChange={setHighSeasonNightlyRate} prefix="$" min={50} step={10} />
                    <InputGroup label="Occupancy" value={highSeasonOccupancy} onChange={setHighSeasonOccupancy} suffix="%" min={0} max={100} step={5} />
                    <InputGroup label="Months" value={highSeasonMonths} onChange={setHighSeasonMonths} min={1} max={6} />
                  </div>
                  
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                    <h4 className="text-amber-400 font-medium mb-3">🌤️ Shoulder Season</h4>
                    <p className="text-xs text-slate-500 mb-3">Spring/Fall moderate</p>
                    <InputGroup label="Nightly Rate" value={shoulderSeasonNightlyRate} onChange={setShoulderSeasonNightlyRate} prefix="$" min={50} step={10} />
                    <InputGroup label="Occupancy" value={shoulderSeasonOccupancy} onChange={setShoulderSeasonOccupancy} suffix="%" min={0} max={100} step={5} />
                    <div className="text-center text-sm text-slate-500 py-2">
                      Auto: {12 - highSeasonMonths - lowSeasonMonths} months
                    </div>
                  </div>
                  
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <h4 className="text-blue-400 font-medium mb-3">🌧️ Low Season</h4>
                    <p className="text-xs text-slate-500 mb-3">Summer slower period</p>
                    <InputGroup label="Nightly Rate" value={lowSeasonNightlyRate} onChange={setLowSeasonNightlyRate} prefix="$" min={50} step={10} />
                    <InputGroup label="Occupancy" value={lowSeasonOccupancy} onChange={setLowSeasonOccupancy} suffix="%" min={0} max={100} step={5} />
                    <InputGroup label="Months" value={lowSeasonMonths} onChange={setLowSeasonMonths} min={1} max={6} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <InputGroup label="Personal Use Days" value={personalUseDays} onChange={setPersonalUseDays} suffix="days" min={0} max={365} tooltip="Days you block for personal use" />
                  <InputGroup label="Average Stay Length" value={avgStayLength} onChange={setAvgStayLength} suffix="nights" min={1} max={30} step={0.5} tooltip="Used to calculate turnovers for cleaning" />
                </div>
              </div>
            )}
            
            {activeTab === 'expenses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Revenue-Based Costs</h3>
                  <InputGroup 
                    label="Property Management" 
                    value={propertyMgmtPercent} 
                    onChange={setPropertyMgmtPercent} 
                    suffix="%" 
                    min={0} 
                    max={40} 
                    step={1}
                    tooltip="Mexico full-service: 15-25%. Basic: 10-15%"
                  />
                  <InputGroup 
                    label="Platform Fees (Airbnb/VRBO)" 
                    value={platformFeePercent} 
                    onChange={setPlatformFeePercent} 
                    suffix="%" 
                    min={0} 
                    max={20} 
                    step={0.5}
                    tooltip="Host-only pricing ~3%, split ~14-16%"
                  />
                  <InputGroup 
                    label="Cleaning Fee (per turnover)" 
                    value={cleaningFeePerTurn} 
                    onChange={setCleaningFeePerTurn} 
                    prefix="$" 
                    min={0} 
                    step={5}
                    tooltip="Can often pass to guests"
                  />
                  
                  <h3 className="text-lg font-semibold text-white mb-4 mt-6">Monthly Fixed Costs</h3>
                  <InputGroup label="HOA / Condo Fees" value={hoaMonthly} onChange={setHoaMonthly} prefix="$" min={0} step={25} tooltip="Gated communities: $200-500/mo typical" />
                  <InputGroup label="Utilities (Electric, Water, Gas, Internet)" value={utilitiesMonthly} onChange={setUtilitiesMonthly} prefix="$" min={0} step={10} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Annual Fixed Costs</h3>
                  <InputGroup label="Insurance" value={insuranceAnnual} onChange={setInsuranceAnnual} prefix="$" min={0} step={100} />
                  <InputGroup label="Property Tax (Predial)" value={propertyTaxPercent} onChange={setPropertyTaxPercent} suffix="%" min={0} max={3} step={0.05} tooltip="Mexico: ~0.1-0.2% of assessed value" />
                  <InputGroup label="Permits & Licenses" value={permitsAnnual} onChange={setPermitsAnnual} prefix="$" min={0} step={50} />
                  <InputGroup label="Marketing & Photography" value={marketingAnnual} onChange={setMarketingAnnual} prefix="$" min={0} step={100} />
                  
                  <h3 className="text-lg font-semibold text-white mb-4 mt-6">Reserves</h3>
                  <InputGroup 
                    label="Maintenance Reserve" 
                    value={maintenancePercent} 
                    onChange={setMaintenancePercent} 
                    suffix="%" 
                    min={0} 
                    max={5} 
                    step={0.25}
                    tooltip="1-2% of property value annually recommended"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Results Panel */}
        <div className="space-y-4">
          {/* Verdict */}
          <div className={`${verdict.bg} border border-slate-700/50 rounded-2xl p-5 text-center`}>
            <div className={`text-2xl font-bold ${verdict.color}`} style={{ fontFamily: "'Space Mono', monospace" }}>
              {verdict.text}
            </div>
            <div className="text-sm text-slate-400 mt-1">Based on Cash-on-Cash & Cap Rate</div>
            {marketType !== 'consolidated' && (
              <div className="mt-2 text-xs text-amber-400">
                ⚠️ {marketType === 'emerging' ? '10%' : '25%'} risk adjustment applied
              </div>
            )}
          </div>
          
          {/* Key Metrics */}
          <div className="bg-slate-800/20 backdrop-blur border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Key Returns</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard 
                label="Cash-on-Cash" 
                value={formatPercent(calculations.cashOnCash)}
                subtext="Return on cash invested"
                highlight={calculations.cashOnCash >= 8}
                warning={calculations.cashOnCash < 0}
              />
              <MetricCard 
                label="Cap Rate" 
                value={formatPercent(calculations.capRate)}
                subtext="NOI ÷ Purchase Price"
                highlight={calculations.capRate >= 6}
              />
              <MetricCard 
                label="Monthly Cash Flow" 
                value={formatCurrency(calculations.monthlyCashFlow)}
                subtext="After all expenses"
                warning={calculations.monthlyCashFlow < 0}
              />
              <MetricCard 
                label="Annual Cash Flow" 
                value={formatCurrency(calculations.annualCashFlow)}
                subtext="Net after debt service"
                warning={calculations.annualCashFlow < 0}
              />
            </div>
          </div>
          
          {/* Revenue Breakdown */}
          <div className="bg-slate-800/20 backdrop-blur border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Revenue Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Gross Rental Income</span>
                <span className="text-white font-bold">{formatCurrency(calculations.grossRentalIncome)}</span>
              </div>
              <div className="text-xs text-slate-500 pl-4 space-y-1">
                <div className="flex justify-between">
                  <span>↳ High Season</span>
                  <span>{formatCurrency(calculations.highSeasonRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>↳ Shoulder Season</span>
                  <span>{formatCurrency(calculations.shoulderSeasonRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>↳ Low Season</span>
                  <span>{formatCurrency(calculations.lowSeasonRevenue)}</span>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                <span className="text-slate-400">Blended Occupancy</span>
                <span className="text-amber-400 font-bold">{formatPercent(calculations.blendedOccupancy)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nights Booked</span>
                <span className="text-white">{Math.round(calculations.totalNightsBooked)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Turnovers (for cleaning)</span>
                <span className="text-white">{Math.round(calculations.numberOfTurnovers)}</span>
              </div>
            </div>
          </div>
          
          {/* Expense Breakdown */}
          <div className="bg-slate-800/20 backdrop-blur border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Expense Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Property Management</span>
                <span className="text-white">{formatCurrency(calculations.propertyManagement)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cleaning</span>
                <span className="text-white">{formatCurrency(calculations.totalCleaningCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform Fees</span>
                <span className="text-white">{formatCurrency(calculations.platformFees)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HOA</span>
                <span className="text-white">{formatCurrency(calculations.hoaAnnual)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Utilities</span>
                <span className="text-white">{formatCurrency(calculations.utilitiesAnnual)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Insurance</span>
                <span className="text-white">{formatCurrency(insuranceAnnual)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Property Tax</span>
                <span className="text-white">{formatCurrency(calculations.propertyTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maintenance Reserve</span>
                <span className="text-white">{formatCurrency(calculations.maintenanceReserve)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Permits & Marketing</span>
                <span className="text-white">{formatCurrency(permitsAnnual + marketingAnnual)}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                <span className="text-slate-300">Total Operating Expenses</span>
                <span className="text-red-400">{formatCurrency(calculations.totalOperatingExpenses)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Expense Ratio</span>
                <span className="text-slate-400">{formatPercent(calculations.expenseRatio)} of gross</span>
              </div>
            </div>
          </div>
          
          {/* Investment Summary */}
          <div className="bg-slate-800/20 backdrop-blur border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Investment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Down Payment</span>
                <span className="text-white">{formatCurrency(calculations.downPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Closing Costs</span>
                <span className="text-white">{formatCurrency(calculations.closingCosts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Furnishing</span>
                <span className="text-white">{formatCurrency(furnishingCost)}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                <span className="text-slate-300">Total Cash Invested</span>
                <span className="text-amber-400">{formatCurrency(calculations.totalCashInvested)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Monthly Mortgage (P&I)</span>
                <span className="text-white">{formatCurrency(calculations.monthlyMortgage)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">NOI (before debt)</span>
                <span className="text-emerald-400 font-medium">{formatCurrency(calculations.noi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Break-even Occupancy</span>
                <span className="text-white">{formatPercent(Math.min(calculations.breakEvenOccupancy, 100))}</span>
              </div>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="text-xs text-slate-500 p-4 bg-slate-900/50 rounded-xl">
            <strong className="text-slate-400">Disclaimer:</strong> This calculator provides estimates for educational purposes only. 
            Actual returns may vary. Gone are the days of 8-10% ROI—most owners now cover operating expenses with modest returns. 
            Focus on lifestyle benefits alongside investment potential. Always consult qualified professionals before investing.
          </div>
        </div>
      </div>
    </div>
  );
};

export default STRFeasibilityCalculator;
