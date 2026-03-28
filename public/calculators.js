// ===== NITHI AI ADVANCED FINANCIAL CALCULATORS =====
const CALCS = [
  { id:'sip', icon:'📈', name:'SIP', desc:'Systematic Investment Plan' },
  { id:'lumpsum', icon:'💰', name:'Lump Sum', desc:'One-time Investment' },
  { id:'emi', icon:'🏠', name:'EMI', desc:'Loan EMI Calculator' },
  { id:'fd', icon:'🏦', name:'FD', desc:'Fixed Deposit' },
  { id:'ppf', icon:'🛡️', name:'PPF', desc:'Public Provident Fund' },
  { id:'swp', icon:'💸', name:'SWP', desc:'Systematic Withdrawal' },
  { id:'retire', icon:'🏖️', name:'Retirement', desc:'Corpus Planner' },
  { id:'tax', icon:'🧾', name:'Tax', desc:'Old vs New Regime' },
  { id:'interest', icon:'📐', name:'Interest', desc:'SI & CI Calculator' },
  { id:'convert', icon:'💱', name:'Currency', desc:'INR ↔ USD, EUR & more' }
];

let activeCalc = 'sip';

function openCalcPanel() {
  document.getElementById('calcPanel').classList.add('open');
  document.getElementById('calcOverlay').classList.add('open');
  renderCalcList();
}
function closeCalcPanel() {
  document.getElementById('calcPanel').classList.remove('open');
  document.getElementById('calcOverlay').classList.remove('open');
}

function renderCalcList() {
  const grid = document.getElementById('calcGrid');
  grid.innerHTML = CALCS.map(c => `
    <div class="calc-card ${activeCalc===c.id?'active':''}" onclick="showCalc('${c.id}')">
      <span class="calc-card-icon">${c.icon}</span>
      <span class="calc-card-name">${c.name}</span>
    </div>`).join('');
  showCalc(activeCalc);
}

// ===== RANGE SLIDER HELPER =====
function rangeField(id, label, min, max, value, step, suffix) {
  return `<div class="range-group">
    <label>${label}</label>
    <div class="range-row">
      <input type="range" id="${id}" min="${min}" max="${max}" value="${value}" step="${step}" oninput="document.getElementById('${id}Val').textContent=this.value+'${suffix}'">
      <span class="range-val" id="${id}Val">${value}${suffix}</span>
    </div></div>`;
}

function showCalc(id) {
  activeCalc = id;
  document.querySelectorAll('.calc-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.calc-card[onclick="showCalc('${id}')"]`)?.classList.add('active');
  const area = document.getElementById('calcArea');
  const forms = {
    sip: `<div class="calc-form">
      <div class="calc-section-title">Investment Details</div>
      <label>Monthly Investment (₹)</label><input type="number" id="cSipAmt" value="5000" min="500">
      ${rangeField('cSipRate','Expected Return (% p.a.)',1,30,12,0.5,'%')}
      ${rangeField('cSipYrs','Time Period (Years)',1,40,10,1,' yr')}
      <div class="calc-section-title">Advanced Options</div>
      <div class="toggle-row">
        <label>Step-up SIP (Annual Increase)</label>
        <label class="calc-toggle"><input type="checkbox" id="cSipStepUp" onchange="document.getElementById('cSipStepRow').style.display=this.checked?'flex':'none'"><span class="slider"></span></label>
      </div>
      <div id="cSipStepRow" style="display:none">
        ${rangeField('cSipStep','Annual Step-up (%)',5,50,10,5,'%')}
      </div>
      <div class="toggle-row">
        <label>Show Inflation-Adjusted Value</label>
        <label class="calc-toggle"><input type="checkbox" id="cSipInf"><span class="slider"></span></label>
      </div>
      <button class="calc-btn" onclick="calcSIP()">Calculate SIP Returns</button>
      <div id="cSipResult" class="calc-result"></div></div>`,

    lumpsum: `<div class="calc-form">
      <div class="calc-section-title">Investment Details</div>
      <label>Investment Amount (₹)</label><input type="number" id="cLsAmt" value="100000" min="1000">
      ${rangeField('cLsRate','Expected Return (% p.a.)',1,30,12,0.5,'%')}
      ${rangeField('cLsYrs','Time Period (Years)',1,40,10,1,' yr')}
      <div class="calc-section-title">Advanced Options</div>
      <div class="toggle-row">
        <label>Compare with FD (7% p.a.)</label>
        <label class="calc-toggle"><input type="checkbox" id="cLsFdComp" checked><span class="slider"></span></label>
      </div>
      <div class="toggle-row">
        <label>Show Inflation-Adjusted Value</label>
        <label class="calc-toggle"><input type="checkbox" id="cLsInf"><span class="slider"></span></label>
      </div>
      <button class="calc-btn" onclick="calcLumpSum()">Calculate Returns</button>
      <div id="cLsResult" class="calc-result"></div></div>`,

    emi: `<div class="calc-form">
      <div class="calc-section-title">Loan Details</div>
      <label>Loan Amount (₹)</label><input type="number" id="cEmiAmt" value="3000000" min="10000">
      ${rangeField('cEmiRate','Interest Rate (% p.a.)',4,20,8.5,0.1,'%')}
      ${rangeField('cEmiYrs','Loan Tenure (Years)',1,30,20,1,' yr')}
      <div class="calc-section-title">Prepayment Analysis</div>
      <div class="toggle-row">
        <label>Add Monthly Prepayment</label>
        <label class="calc-toggle"><input type="checkbox" id="cEmiPrepay" onchange="document.getElementById('cEmiPrepayRow').style.display=this.checked?'flex':'none'"><span class="slider"></span></label>
      </div>
      <div id="cEmiPrepayRow" style="display:none">
        <label>Extra Monthly Payment (₹)</label><input type="number" id="cEmiExtra" value="5000" min="0">
      </div>
      <button class="calc-btn" onclick="calcEMI()">Calculate EMI</button>
      <div id="cEmiResult" class="calc-result"></div></div>`,

    fd: `<div class="calc-form">
      <div class="calc-section-title">Deposit Details</div>
      <label>Principal Amount (₹)</label><input type="number" id="cFdAmt" value="100000" min="1000">
      ${rangeField('cFdRate','Interest Rate (% p.a.)',3,10,7,0.1,'%')}
      ${rangeField('cFdYrs','Tenure (Years)',1,10,5,1,' yr')}
      <label>Compounding</label>
      <select id="cFdComp"><option value="4">Quarterly</option><option value="12">Monthly</option><option value="2">Half-Yearly</option><option value="1">Yearly</option></select>
      <div class="calc-section-title">Tax Impact</div>
      <div class="toggle-row">
        <label>Senior Citizen (+0.5% extra rate)</label>
        <label class="calc-toggle"><input type="checkbox" id="cFdSenior"><span class="slider"></span></label>
      </div>
      <div class="toggle-row">
        <label>Calculate TDS & Post-Tax Returns</label>
        <label class="calc-toggle"><input type="checkbox" id="cFdTds" checked><span class="slider"></span></label>
      </div>
      <label>Your Tax Slab (%)</label>
      <select id="cFdSlab"><option value="0">No Tax (&lt; ₹2.5L)</option><option value="5">5%</option><option value="20">20%</option><option value="30" selected>30%</option></select>
      <button class="calc-btn" onclick="calcFD()">Calculate FD Returns</button>
      <div id="cFdResult" class="calc-result"></div></div>`,

    ppf: `<div class="calc-form">
      <div class="calc-section-title">PPF Details</div>
      <label>Yearly Investment (₹)</label><input type="number" id="cPpfAmt" value="150000" min="500" max="150000">
      ${rangeField('cPpfYrs','Duration (Years, min 15)',15,50,15,1,' yr')}
      ${rangeField('cPpfRate','Interest Rate (% p.a.)',5,10,7.1,0.1,'%')}
      <div class="calc-section-title">Options</div>
      <div class="toggle-row">
        <label>Yearly Step-up (increase annually)</label>
        <label class="calc-toggle"><input type="checkbox" id="cPpfStep" onchange="document.getElementById('cPpfStepRow').style.display=this.checked?'flex':'none'"><span class="slider"></span></label>
      </div>
      <div id="cPpfStepRow" style="display:none">
        ${rangeField('cPpfStepPct','Step-up Amount (₹/year)',5000,30000,10000,5000,'')}
      </div>
      <button class="calc-btn" onclick="calcPPF()">Calculate PPF Returns</button>
      <div id="cPpfResult" class="calc-result"></div></div>`,

    swp: `<div class="calc-form">
      <div class="calc-section-title">Withdrawal Plan</div>
      <label>Total Corpus (₹)</label><input type="number" id="cSwpAmt" value="5000000" min="100000">
      <label>Monthly Withdrawal (₹)</label><input type="number" id="cSwpWith" value="25000" min="1000">
      ${rangeField('cSwpRate','Expected Return (% p.a.)',1,18,8,0.5,'%')}
      <div class="calc-section-title">Inflation Impact</div>
      <div class="toggle-row">
        <label>Increase withdrawal for inflation</label>
        <label class="calc-toggle"><input type="checkbox" id="cSwpInf" onchange="document.getElementById('cSwpInfRow').style.display=this.checked?'flex':'none'"><span class="slider"></span></label>
      </div>
      <div id="cSwpInfRow" style="display:none">
        ${rangeField('cSwpInfRate','Annual Inflation (%)',2,10,6,0.5,'%')}
      </div>
      <button class="calc-btn" onclick="calcSWP()">Calculate SWP</button>
      <div id="cSwpResult" class="calc-result"></div></div>`,

    retire: `<div class="calc-form">
      <div class="calc-section-title">Your Profile</div>
      <div class="input-row-inline">
        <div><label>Current Age</label><input type="number" id="cRetAge" value="30" min="18" max="60"></div>
        <div><label>Retirement Age</label><input type="number" id="cRetRetAge" value="60" min="40" max="70"></div>
      </div>
      <div class="input-row-inline">
        <div><label>Life Expectancy</label><input type="number" id="cRetLife" value="85" min="65" max="100"></div>
        <div><label>Monthly Expenses (₹)</label><input type="number" id="cRetExp" value="40000" min="5000"></div>
      </div>
      <div class="calc-section-title">Assumptions</div>
      ${rangeField('cRetInf','Expected Inflation (%)',3,10,6,0.5,'%')}
      ${rangeField('cRetPre','Pre-Retirement Return (%)',8,18,12,0.5,'%')}
      ${rangeField('cRetPost','Post-Retirement Return (%)',4,12,8,0.5,'%')}
      <div class="calc-section-title">Existing Savings</div>
      <label>Current Retirement Corpus (₹)</label><input type="number" id="cRetExist" value="0" min="0">
      <label>Monthly EPF/NPS Contribution (₹)</label><input type="number" id="cRetEpf" value="0" min="0">
      <button class="calc-btn" onclick="calcRetire()">Plan My Retirement</button>
      <div id="cRetResult" class="calc-result"></div></div>`,

    tax: `<div class="calc-form">
      <div class="calc-section-title">Income Details</div>
      <label>Annual Gross Income (₹)</label><input type="number" id="cTaxInc" value="1200000" min="100000">
      <div class="calc-section-title">Old Regime Deductions</div>
      <div class="input-row-inline">
        <div><label>80C (₹)</label><input type="number" id="cTax80c" value="150000" min="0" max="150000"></div>
        <div><label>80D (₹)</label><input type="number" id="cTax80d" value="25000" min="0" max="100000"></div>
      </div>
      <div class="input-row-inline">
        <div><label>HRA Exemption (₹)</label><input type="number" id="cTaxHra" value="0" min="0"></div>
        <div><label>80E/80G/Others (₹)</label><input type="number" id="cTaxOther" value="0" min="0"></div>
      </div>
      <label>NPS 80CCD(1B) (₹, max 50k)</label><input type="number" id="cTaxNps" value="0" min="0" max="50000">
      <label>Home Loan Interest 24(b) (₹, max 2L)</label><input type="number" id="cTaxHl" value="0" min="0" max="200000">
      <button class="calc-btn" onclick="calcTax()">Compare Tax Regimes</button>
      <div id="cTaxResult" class="calc-result"></div></div>`,

    interest: `<div class="calc-form">
      <div class="calc-section-title">Interest Calculator</div>
      <label>Principal Amount (₹)</label><input type="number" id="cIntAmt" value="250000" min="100">
      ${rangeField('cIntRate','Interest Rate (% p.a.)',1,30,7.25,0.25,'%')}
      <label>Time Period</label>
      <div class="input-row-inline">
        <div><label>Years</label><input type="number" id="cIntYrs" value="3" min="0" max="50"></div>
        <div><label>Months</label><input type="number" id="cIntMo" value="6" min="0" max="11"></div>
      </div>
      <div class="calc-section-title">Interest Type</div>
      <div class="toggle-row">
        <label>Compound Interest (off = Simple)</label>
        <label class="calc-toggle"><input type="checkbox" id="cIntCI" onchange="document.getElementById('cIntCompRow').style.display=this.checked?'block':'none'"><span class="slider"></span></label>
      </div>
      <div id="cIntCompRow" style="display:none">
        <label>Compounding Frequency</label>
        <select id="cIntComp"><option value="1">Yearly</option><option value="2">Half-Yearly</option><option value="4" selected>Quarterly</option><option value="12">Monthly</option></select>
      </div>
      <div class="calc-section-title">Compare</div>
      <div class="toggle-row">
        <label>Show SI vs CI Comparison</label>
        <label class="calc-toggle"><input type="checkbox" id="cIntCompare" checked><span class="slider"></span></label>
      </div>
      <button class="calc-btn" onclick="calcInterest()">Calculate Interest</button>
      <div id="cIntResult" class="calc-result"></div></div>`,

    convert: `<div class="calc-form">
      <div class="calc-section-title">💱 Currency Converter</div>
      <label>Amount</label><input type="number" id="cConvAmt" value="100000" min="0" step="any">
      <label>From</label>
      <select id="cConvFrom">
        <option value="INR" selected>🇮🇳 INR - Indian Rupee</option>
        <option value="USD">🇺🇸 USD - US Dollar</option>
        <option value="EUR">🇪🇺 EUR - Euro</option>
        <option value="GBP">🇬🇧 GBP - British Pound</option>
        <option value="AED">🇦🇪 AED - UAE Dirham</option>
        <option value="SGD">🇸🇬 SGD - Singapore Dollar</option>
        <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
        <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
        <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
        <option value="SAR">🇸🇦 SAR - Saudi Riyal</option>
      </select>
      <label>To</label>
      <select id="cConvTo">
        <option value="INR">🇮🇳 INR - Indian Rupee</option>
        <option value="USD" selected>🇺🇸 USD - US Dollar</option>
        <option value="EUR">🇪🇺 EUR - Euro</option>
        <option value="GBP">🇬🇧 GBP - British Pound</option>
        <option value="AED">🇦🇪 AED - UAE Dirham</option>
        <option value="SGD">🇸🇬 SGD - Singapore Dollar</option>
        <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
        <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
        <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
        <option value="SAR">🇸🇦 SAR - Saudi Riyal</option>
      </select>
      <button class="calc-btn" onclick="calcConvertCurrency()">Convert Currency</button>
      <div id="cConvCurrResult" class="calc-result"></div></div>`
  };
  area.innerHTML = forms[id] || '';
}

// ===== FORMATTERS =====
function fmtINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function fmtINRCompact(n) {
  if (n >= 1e7) return '₹' + (n/1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return '₹' + (n/1e5).toFixed(2) + ' L';
  if (n >= 1e3) return '₹' + (n/1e3).toFixed(1) + 'K';
  return fmtINR(n);
}

// ===== CHART & UI HELPERS =====
function makeDonut(invested, returns, total) {
  const pct = Math.round((returns / total) * 100);
  const dash = (pct / 100) * 251.2;
  return `<div class="calc-chart">
    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" stroke-width="10"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--accent)" stroke-width="10"
      stroke-dasharray="${dash} 251.2" stroke-linecap="round" transform="rotate(-90 50 50)" style="transition:stroke-dasharray .6s"/></svg>
    <div class="calc-chart-label"><span class="calc-chart-pct">${pct}%</span><span class="calc-chart-sub">returns</span></div></div>`;
}

function makeBarChart(items) {
  const max = Math.max(...items.map(i => i.value));
  return `<div class="calc-bar-chart">${items.map(i => {
    const pct = max > 0 ? Math.round((i.value / max) * 100) : 0;
    return `<div class="calc-bar-item"><span class="calc-bar-label">${i.label}</span>
      <div class="calc-bar-track"><div class="calc-bar-fill ${i.color||'green'}" style="width:${pct}%"></div></div>
      <span class="calc-bar-amt">${fmtINRCompact(i.value)}</span></div>`;
  }).join('')}</div>`;
}

function makeStats(stats) {
  return `<div class="calc-stats">${stats.map(s =>
    `<div class="calc-stat${s.accent?' accent':''}${s.wide?' wide':''}">
      <div class="calc-stat-val">${s.value}</div>
      <div class="calc-stat-label">${s.label}</div></div>`
  ).join('')}</div>`;
}

function resultCard(items, chartHTML, askText, extraHTML) {
  const rows = items.map(i => `<div class="calc-row${i.highlight?' highlight':''}"><span class="calc-row-label">${i.label}</span><span class="calc-row-value">${i.value}</span></div>`).join('');
  return `<div class="calc-result-card" style="animation:fadeUp .4s ease">
    ${chartHTML || ''}
    ${rows}
    ${extraHTML || ''}
    <button class="calc-ask-btn" onclick="askAboutCalc(\`${askText.replace(/`/g,"'")}\`)">💬 Ask Nithi AI about this</button>
  </div>`;
}

function yearTable(title, headers, rows) {
  const ths = headers.map(h => `<th>${h}</th>`).join('');
  const trs = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<details class="calc-toggle-table"><summary>${title}</summary>
    <table class="calc-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></details>`;
}

// ===== CALCULATOR FUNCTIONS =====
function calcSIP() {
  const P = +document.getElementById('cSipAmt').value;
  const r = +document.getElementById('cSipRate').value / 100 / 12;
  const annualR = +document.getElementById('cSipRate').value;
  const n = +document.getElementById('cSipYrs').value;
  const months = n * 12;
  const stepUp = document.getElementById('cSipStepUp').checked;
  const stepPct = stepUp ? +document.getElementById('cSipStep').value / 100 : 0;
  const showInf = document.getElementById('cSipInf').checked;
  const infRate = 0.06;

  let invested = 0, bal = 0, monthly = P;
  const tableRows = [];
  for (let yr = 1; yr <= n; yr++) {
    for (let m = 0; m < 12; m++) {
      bal = (bal + monthly) * (1 + r);
      invested += monthly;
    }
    tableRows.push([yr, fmtINR(monthly), fmtINR(invested), fmtINR(bal), fmtINR(bal - invested)]);
    if (stepUp && yr < n) monthly = Math.round(monthly * (1 + stepPct));
  }
  const FV = bal;
  const returns = FV - invested;
  const wealthMultiple = (invested > 0 ? (FV / invested).toFixed(2) : 0) + 'x';
  const infAdj = showInf ? FV / Math.pow(1 + infRate, n) : 0;

  const barItems = [
    { label: 'Invested', value: invested, color: 'green' },
    { label: 'Returns', value: returns, color: 'gold' }
  ];
  if (showInf) barItems.push({ label: "Today's Value", value: infAdj, color: 'cyan' });

  const ask = `I'm investing ${fmtINR(P)}/month via SIP for ${n} years at ${annualR}% return${stepUp ? ` with ${stepPct*100}% annual step-up` : ''}. Future value: ${fmtINRCompact(FV)}. Invested: ${fmtINRCompact(invested)}, Returns: ${fmtINRCompact(returns)}. What are the best mutual fund options?`;

  let extra = makeBarChart(barItems);
  extra += makeStats([
    { label: 'Wealth Multiple', value: wealthMultiple },
    { label: 'Return %', value: ((returns/invested)*100).toFixed(1) + '%' },
    ...(showInf ? [{ label: "Today's Value", value: fmtINRCompact(infAdj) }] : []),
    ...(stepUp ? [{ label: 'Final SIP', value: fmtINR(monthly) }] : [])
  ]);
  extra += yearTable('📊 Year-by-Year Breakdown', ['Year', 'SIP/mo', 'Invested', 'Value', 'Gain'], tableRows);

  document.getElementById('cSipResult').innerHTML = resultCard([
    { label: '🎯 Future Value', value: fmtINR(FV), highlight: true },
    { label: 'Total Invested', value: fmtINR(invested) },
    { label: 'Est. Returns', value: fmtINR(returns) }
  ], makeDonut(invested, returns, FV), ask, extra);
}

function calcLumpSum() {
  const P = +document.getElementById('cLsAmt').value;
  const r = +document.getElementById('cLsRate').value / 100;
  const annualR = +document.getElementById('cLsRate').value;
  const n = +document.getElementById('cLsYrs').value;
  const showFd = document.getElementById('cLsFdComp').checked;
  const showInf = document.getElementById('cLsInf').checked;
  const infRate = 0.06;
  const fdRate = 0.07;

  const FV = P * Math.pow(1 + r, n);
  const returns = FV - P;
  const cagr = ((Math.pow(FV / P, 1 / n) - 1) * 100).toFixed(2);
  const absReturn = ((returns / P) * 100).toFixed(1);
  const fdVal = showFd ? P * Math.pow(1 + fdRate, n) : 0;
  const infAdj = showInf ? FV / Math.pow(1 + infRate, n) : 0;

  const tableRows = [];
  for (let yr = 1; yr <= n; yr++) {
    const val = P * Math.pow(1 + r, yr);
    const fdV = P * Math.pow(1 + fdRate, yr);
    tableRows.push([yr, fmtINR(val), fmtINR(val - P), showFd ? fmtINR(fdV) : '-']);
  }

  const barItems = [
    { label: 'Invested', value: P, color: 'green' },
    { label: 'Equity Value', value: FV, color: 'gold' }
  ];
  if (showFd) barItems.push({ label: 'FD Value', value: fdVal, color: 'cyan' });

  const ask = `I invested ${fmtINRCompact(P)} lump sum for ${n} years at ${annualR}%. Future value: ${fmtINRCompact(FV)}, CAGR: ${cagr}%${showFd ? `, FD comparison: ${fmtINRCompact(fdVal)}` : ''}. Which investment option is best?`;

  let extra = makeBarChart(barItems);
  const statItems = [
    { label: 'CAGR', value: cagr + '%', accent: true },
    { label: 'Absolute Return', value: absReturn + '%' }
  ];
  if (showInf) statItems.push({ label: "Today's Value", value: fmtINRCompact(infAdj) });
  if (showFd) statItems.push({ label: 'FD Gives', value: fmtINRCompact(fdVal) });
  extra += makeStats(statItems);
  extra += yearTable('📊 Year-by-Year Growth', ['Year', 'Value', 'Gain', showFd ? 'FD Value' : '-'], tableRows);
  if (showFd) extra += `<div class="calc-note">💡 Equity beats FD by <strong>${fmtINRCompact(FV - fdVal)}</strong> over ${n} years (pre-tax)</div>`;

  document.getElementById('cLsResult').innerHTML = resultCard([
    { label: '🎯 Future Value', value: fmtINR(FV), highlight: true },
    { label: 'Invested', value: fmtINR(P) },
    { label: 'Est. Returns', value: fmtINR(returns) }
  ], makeDonut(P, returns, FV), ask, extra);
}

function calcEMI() {
  const P = +document.getElementById('cEmiAmt').value;
  const annualR = +document.getElementById('cEmiRate').value;
  const r = annualR / 100 / 12;
  const n = +document.getElementById('cEmiYrs').value * 12;
  const doPrepay = document.getElementById('cEmiPrepay').checked;
  const extraPay = doPrepay ? +document.getElementById('cEmiExtra').value : 0;

  const emi = P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
  const totalNormal = emi * n;
  const interestNormal = totalNormal - P;

  // Prepayment simulation
  let bal = P, prepayMonths = 0, prepayInterest = 0;
  if (doPrepay && extraPay > 0) {
    while (bal > 0 && prepayMonths < n) {
      const intPart = bal * r;
      prepayInterest += intPart;
      const prinPart = emi + extraPay - intPart;
      bal = Math.max(0, bal - prinPart);
      prepayMonths++;
    }
  }
  const prepayTotal = doPrepay ? (emi + extraPay) * prepayMonths : 0;
  const interestSaved = doPrepay ? interestNormal - prepayInterest : 0;
  const timeSaved = doPrepay ? n - prepayMonths : 0;
  const timeSavedYrs = Math.floor(timeSaved / 12);
  const timeSavedMo = timeSaved % 12;

  // Amortization table (yearly summary)
  const amortRows = [];
  let amBal = P, yrInt = 0, yrPrin = 0;
  for (let m = 1; m <= n; m++) {
    const intP = amBal * r;
    const prinP = emi - intP;
    amBal = Math.max(0, amBal - prinP);
    yrInt += intP; yrPrin += prinP;
    if (m % 12 === 0 || m === n) {
      amortRows.push([m / 12 | 0 || 1, fmtINR(yrPrin), fmtINR(yrInt), fmtINR(amBal)]);
      yrInt = 0; yrPrin = 0;
    }
  }

  let ask = `My loan: ${fmtINRCompact(P)} at ${annualR}% for ${n/12} yrs. EMI: ${fmtINR(emi)}. Total interest: ${fmtINRCompact(interestNormal)}.`;
  if (doPrepay) ask += ` With ${fmtINR(extraPay)} prepayment, I save ${fmtINRCompact(interestSaved)} and ${timeSavedYrs}y ${timeSavedMo}m.`;
  ask += ' How can I reduce my loan burden?';

  const items = [
    { label: '🎯 Monthly EMI', value: fmtINR(emi), highlight: true },
    { label: 'Total Interest', value: fmtINR(interestNormal) },
    { label: 'Total Payment', value: fmtINR(totalNormal) },
    { label: 'Interest/Loan Ratio', value: ((interestNormal / P) * 100).toFixed(1) + '%' }
  ];

  let extra = '';
  if (doPrepay && extraPay > 0) {
    extra += `<div class="calc-section-title" style="margin-top:12px">🚀 Prepayment Impact</div>`;
    extra += makeStats([
      { label: 'Interest Saved', value: fmtINRCompact(interestSaved), accent: true },
      { label: 'Time Saved', value: `${timeSavedYrs}y ${timeSavedMo}m` },
      { label: 'New Tenure', value: `${Math.floor(prepayMonths/12)}y ${prepayMonths%12}m` },
      { label: 'Effective Payment', value: fmtINR(emi + extraPay) }
    ]);
    extra += makeBarChart([
      { label: 'Without Prepay', value: interestNormal, color: 'red' },
      { label: 'With Prepay', value: prepayInterest, color: 'green' }
    ]);
  }
  extra += yearTable('📊 Amortization Schedule', ['Year', 'Principal', 'Interest', 'Balance'], amortRows);

  document.getElementById('cEmiResult').innerHTML = resultCard(items, makeDonut(P, interestNormal, totalNormal), ask, extra);
}

function calcFD() {
  const P = +document.getElementById('cFdAmt').value;
  const isSenior = document.getElementById('cFdSenior').checked;
  const baseRate = +document.getElementById('cFdRate').value;
  const rateUsed = isSenior ? baseRate + 0.5 : baseRate;
  const r = rateUsed / 100;
  const n = +document.getElementById('cFdYrs').value;
  const comp = +document.getElementById('cFdComp').value;
  const showTds = document.getElementById('cFdTds').checked;
  const slabPct = +document.getElementById('cFdSlab').value;

  const A = P * Math.pow(1 + r / comp, comp * n);
  const interest = A - P;
  const effectiveYield = ((Math.pow(A / P, 1 / n) - 1) * 100).toFixed(2);

  // TDS & post-tax
  const annualInterest = interest / n;
  const tdsRate = annualInterest > 40000 ? 0.10 : 0;
  const totalTds = interest * tdsRate;
  const taxOnInterest = interest * (slabPct / 100);
  const postTaxReturn = interest - taxOnInterest;
  const postTaxYield = ((postTaxReturn / P / n) * 100).toFixed(2);
  const realReturn = (parseFloat(effectiveYield) - 6).toFixed(2); // inflation-adjusted

  const tableRows = [];
  for (let yr = 1; yr <= n; yr++) {
    const val = P * Math.pow(1 + r / comp, comp * yr);
    const intSoFar = val - P;
    tableRows.push([yr, fmtINR(val), fmtINR(intSoFar), showTds ? fmtINR(intSoFar * (slabPct / 100)) : '-']);
  }

  let extra = '';
  extra += makeStats([
    { label: 'Effective Yield', value: effectiveYield + '%', accent: true },
    { label: 'Rate Applied', value: rateUsed + '% p.a.' },
    ...(showTds ? [
      { label: 'Post-Tax Yield', value: postTaxYield + '% p.a.' },
      { label: 'Tax Deducted', value: fmtINR(taxOnInterest) },
      { label: 'Real Return (adj 6% infl)', value: realReturn + '%' }
    ] : [])
  ]);

  if (showTds && annualInterest > 40000) {
    extra += `<div class="calc-note">⚠️ Annual interest ${fmtINR(annualInterest)} exceeds ₹40,000 → TDS @10% will be deducted${isSenior ? ' (₹50,000 limit for senior citizens)' : ''}</div>`;
  }
  extra += yearTable('📊 Year-by-Year Growth', ['Year', 'Value', 'Interest', showTds ? 'Tax' : '-'], tableRows);

  const ask = `My FD: ${fmtINR(P)} at ${rateUsed}% for ${n} years. Maturity: ${fmtINRCompact(A)}, Interest: ${fmtINRCompact(interest)}${showTds ? `, Post-tax yield: ${postTaxYield}%` : ''}. Is FD the best option or should I consider debt funds/bonds?`;

  document.getElementById('cFdResult').innerHTML = resultCard([
    { label: '🎯 Maturity Amount', value: fmtINR(A), highlight: true },
    { label: 'Interest Earned', value: fmtINR(interest) },
    ...(showTds ? [{ label: 'Post-Tax Return', value: fmtINR(postTaxReturn) }] : [])
  ], makeDonut(P, interest, A), ask, extra);
}

function calcPPF() {
  const baseAmt = +document.getElementById('cPpfAmt').value;
  const n = +document.getElementById('cPpfYrs').value;
  const r = +document.getElementById('cPpfRate').value / 100;
  const doStep = document.getElementById('cPpfStep').checked;
  const stepAmt = doStep ? +document.getElementById('cPpfStepPct').value : 0;

  let bal = 0, invested = 0, deposit = baseAmt;
  const tableRows = [];
  for (let yr = 1; yr <= n; yr++) {
    deposit = Math.min(deposit, 150000); // PPF max cap
    bal = (bal + deposit) * (1 + r);
    invested += deposit;
    const canWithdraw = yr >= 7;
    const canLoan = yr >= 3 && yr <= 6;
    tableRows.push([yr, fmtINR(deposit), fmtINR(bal), fmtINR(bal - invested),
      canLoan ? '🔓 Loan' : canWithdraw ? '🔓 Withdraw' : '🔒 Locked']);
    if (doStep && yr < n) deposit = Math.min(deposit + stepAmt, 150000);
  }

  const interest = bal - invested;
  const effReturn = ((Math.pow(bal / invested, 1 / n) - 1) * 100).toFixed(2);

  const ask = `My PPF: ₹${baseAmt}/year for ${n} years at ${(r*100).toFixed(1)}%${doStep ? ` with ₹${stepAmt}/yr step-up (max ₹1.5L)` : ''}. Maturity: ${fmtINRCompact(bal)}, Tax-free interest: ${fmtINRCompact(interest)}. Should I max out PPF or explore ELSS?`;

  let extra = makeStats([
    { label: 'Tax-Free Interest', value: fmtINRCompact(interest), accent: true },
    { label: 'Effective CAGR', value: effReturn + '%' },
    { label: 'Total Invested', value: fmtINRCompact(invested) },
    ...(doStep ? [{ label: 'Final Deposit', value: fmtINR(deposit) }] : [])
  ]);
  extra += yearTable('📊 Year-by-Year PPF Growth', ['Year', 'Deposit', 'Balance', 'Interest', 'Access'], tableRows);
  extra += `<div class="calc-note">🛡️ PPF interest is 100% tax-free under EEE (Exempt-Exempt-Exempt) status. Lock-in: 15 years. Partial withdrawal from Year 7.</div>`;

  document.getElementById('cPpfResult').innerHTML = resultCard([
    { label: '🎯 Maturity Value', value: fmtINR(bal), highlight: true },
    { label: 'Total Invested', value: fmtINR(invested) },
    { label: 'Interest (Tax-Free)', value: fmtINR(interest) }
  ], makeDonut(invested, interest, bal), ask, extra);
}

function calcSWP() {
  const corpus = +document.getElementById('cSwpAmt').value;
  const baseMonthly = +document.getElementById('cSwpWith').value;
  const annualR = +document.getElementById('cSwpRate').value;
  const r = annualR / 100 / 12;
  const doInf = document.getElementById('cSwpInf').checked;
  const infRate = doInf ? +document.getElementById('cSwpInfRate').value / 100 : 0;

  let bal = corpus, months = 0, monthly = baseMonthly, totalWithdrawn = 0;
  const yearSnap = [];
  while (bal > 0 && months < 600) {
    bal = bal * (1 + r) - monthly;
    totalWithdrawn += monthly;
    months++;
    if (months % 12 === 0) {
      yearSnap.push([months / 12, fmtINR(monthly), fmtINR(totalWithdrawn), fmtINR(Math.max(0, bal))]);
      if (doInf) monthly = Math.round(monthly * (1 + infRate));
    }
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const lastYears = years + (rem > 0 ? 1 : 0);

  // Safe withdrawal rate check (4% rule)
  const annualWithdrawal = baseMonthly * 12;
  const safeRate = ((annualWithdrawal / corpus) * 100).toFixed(1);
  const isSafe = parseFloat(safeRate) <= 4;

  const ask = `My SWP: ${fmtINRCompact(corpus)} corpus, withdrawing ${fmtINR(baseMonthly)}/month at ${annualR}% return${doInf ? ` with ${(infRate*100)}% inflation increase` : ''}. Lasts ${years}y ${rem}m. Withdrawal rate: ${safeRate}%. Is this sustainable long-term?`;

  let extra = '';
  extra += makeStats([
    { label: 'Withdrawal Rate', value: safeRate + '%', accent: !isSafe },
    { label: 'Corpus Lasts', value: `${years}y ${rem}m` },
    { label: 'Total Withdrawn', value: fmtINRCompact(totalWithdrawn) },
    ...(doInf ? [{ label: 'Final Monthly', value: fmtINR(monthly) }] : [])
  ]);
  extra += makeBarChart([
    { label: 'Initial Corpus', value: corpus, color: 'green' },
    { label: 'Total Withdrawn', value: totalWithdrawn, color: 'gold' }
  ]);
  if (!isSafe) {
    extra += `<div class="calc-note">⚠️ Your withdrawal rate of ${safeRate}% exceeds the recommended 4% safe withdrawal rate. Consider reducing monthly withdrawal to <strong>${fmtINR(Math.round(corpus * 0.04 / 12))}</strong>/month for sustainability.</div>`;
  }
  extra += yearTable('📊 Year-by-Year SWP', ['Year', 'Monthly', 'Total Out', 'Balance'], yearSnap.slice(0, 30));

  document.getElementById('cSwpResult').innerHTML = resultCard([
    { label: '🎯 Lasts For', value: `${years} years ${rem} months`, highlight: true },
    { label: 'Total Withdrawn', value: fmtINR(totalWithdrawn) },
    { label: 'Earnings from Corpus', value: fmtINR(totalWithdrawn - corpus > 0 ? totalWithdrawn - corpus : 0) }
  ], '', ask, extra);
}

function calcRetire() {
  const age = +document.getElementById('cRetAge').value;
  const retAge = +document.getElementById('cRetRetAge').value;
  const lifeExp = +document.getElementById('cRetLife').value;
  const exp = +document.getElementById('cRetExp').value;
  const inf = +document.getElementById('cRetInf').value / 100;
  const preRet = +document.getElementById('cRetPre').value / 100;
  const postRet = +document.getElementById('cRetPost').value / 100;
  const existCorpus = +document.getElementById('cRetExist').value;
  const epfMonthly = +document.getElementById('cRetEpf').value;

  const yrsToRetire = retAge - age;
  const retYrs = lifeExp - retAge;

  // Future monthly expense at retirement
  const futureMonthly = exp * Math.pow(1 + inf, yrsToRetire);
  const futureAnnual = futureMonthly * 12;

  // Post-retirement corpus needed (PV of annuity)
  const realRate = (postRet - inf) / (1 + inf);
  const corpus = realRate > 0
    ? futureAnnual * ((1 - Math.pow(1 + realRate, -retYrs)) / realRate)
    : futureAnnual * retYrs;

  // Existing corpus grows till retirement
  const existGrown = existCorpus * Math.pow(1 + preRet, yrsToRetire);

  // EPF/NPS accumulation
  const epfR = preRet / 12;
  const epfCorpus = epfMonthly > 0
    ? epfMonthly * ((Math.pow(1 + epfR, yrsToRetire * 12) - 1) / epfR) * (1 + epfR)
    : 0;

  // Gap
  const totalExisting = existGrown + epfCorpus;
  const gap = Math.max(0, corpus - totalExisting);

  // Monthly SIP needed to fill gap
  const sipR = preRet / 12;
  const sipMonths = yrsToRetire * 12;
  const monthlySIP = gap > 0 && sipMonths > 0
    ? gap / (((Math.pow(1 + sipR, sipMonths) - 1) / sipR) * (1 + sipR))
    : 0;

  // Milestone table
  const milestoneRows = [];
  for (let yr = 5; yr <= yrsToRetire; yr += 5) {
    const futExp = exp * Math.pow(1 + inf, yr) ;
    const accum = monthlySIP > 0
      ? monthlySIP * ((Math.pow(1 + sipR, yr * 12) - 1) / sipR) * (1 + sipR)
      : 0;
    const total = existCorpus * Math.pow(1 + preRet, yr) + accum +
      (epfMonthly > 0 ? epfMonthly * ((Math.pow(1 + epfR, yr * 12) - 1) / epfR) * (1 + epfR) : 0);
    milestoneRows.push([`Age ${age + yr}`, fmtINR(futExp) + '/mo', fmtINRCompact(total), fmtINRCompact(corpus)]);
  }

  const ask = `I'm ${age}, retiring at ${retAge}, life expectancy ${lifeExp}. Monthly expense ${fmtINR(exp)} with ${(inf*100)}% inflation. Need ${fmtINRCompact(corpus)} corpus. Existing savings: ${fmtINRCompact(existCorpus)}, EPF: ${fmtINR(epfMonthly)}/mo. Gap: ${fmtINRCompact(gap)}. Need ${fmtINR(monthlySIP)} SIP/month. Help me plan.`;

  let extra = makeBarChart([
    { label: 'Corpus Needed', value: corpus, color: 'red' },
    { label: 'From Existing Savings', value: existGrown, color: 'green' },
    { label: 'From EPF/NPS', value: epfCorpus, color: 'cyan' },
    { label: 'Gap to Fill', value: gap, color: 'gold' }
  ]);
  extra += makeStats([
    { label: 'Monthly Expense (Retirement)', value: fmtINR(futureMonthly), accent: true },
    { label: 'Years to Retire', value: yrsToRetire + ' years' },
    { label: 'Retirement Duration', value: retYrs + ' years' },
    { label: 'Existing Savings (Grown)', value: fmtINRCompact(totalExisting) }
  ]);
  if (milestoneRows.length) {
    extra += yearTable('📊 Milestone Tracker', ['Age', 'Expense', 'Accumulated', 'Target'], milestoneRows);
  }
  if (gap <= 0) {
    extra += `<div class="calc-note">🎉 Great news! Your existing savings and EPF/NPS contributions are projected to be sufficient for retirement!</div>`;
  }

  document.getElementById('cRetResult').innerHTML = resultCard([
    { label: '🎯 Corpus Needed', value: fmtINRCompact(corpus), highlight: true },
    { label: 'Monthly SIP Required', value: fmtINR(monthlySIP), highlight: gap > 0 },
    { label: 'Gap to Fill', value: fmtINRCompact(gap) },
    { label: 'Post-Retire Expense/mo', value: fmtINR(futureMonthly) }
  ], '', ask, extra);
}

function calcTax() {
  const income = +document.getElementById('cTaxInc').value;
  const d80c = Math.min(+document.getElementById('cTax80c').value, 150000);
  const d80d = Math.min(+document.getElementById('cTax80d').value, 100000);
  const hra = +document.getElementById('cTaxHra').value;
  const other = +document.getElementById('cTaxOther').value;
  const nps = Math.min(+document.getElementById('cTaxNps').value, 50000);
  const hlInt = Math.min(+document.getElementById('cTaxHl').value, 200000);

  // Old regime
  const stdOld = 50000;
  const totalDeductionsOld = d80c + d80d + hra + other + nps + hlInt;
  const taxableOld = Math.max(0, income - stdOld - totalDeductionsOld);
  const { tax: oldBaseTax, breakdown: oldBreakdown } = getOldSlabBreakdown(taxableOld);
  const oldCess = oldBaseTax * 0.04;
  const oldSurcharge = calcSurcharge(income, oldBaseTax);
  const oldTotal = oldBaseTax + oldCess + oldSurcharge;

  // New regime FY 2025-26
  const stdNew = 75000;
  const taxableNew = Math.max(0, income - stdNew);
  const { tax: newBaseTax, breakdown: newBreakdown } = getNewSlabBreakdown(taxableNew);
  const newCess = newBaseTax * 0.04;
  const newSurcharge = calcSurcharge(income, newBaseTax);
  const newTotal = newBaseTax + newCess + newSurcharge;

  const savings = oldTotal - newTotal;
  const better = savings > 0 ? 'New Regime' : savings < 0 ? 'Old Regime' : 'Both Equal';
  const oldEffRate = income > 0 ? ((oldTotal / income) * 100).toFixed(2) : '0';
  const newEffRate = income > 0 ? ((newTotal / income) * 100).toFixed(2) : '0';
  const oldMonthly = Math.round((income - oldTotal) / 12);
  const newMonthly = Math.round((income - newTotal) / 12);

  // Slab breakdown tables
  function slabTable(breakdown, label) {
    const rows = breakdown.map(s => `<tr><td>${s.slab}</td><td>${s.rate}</td><td>${fmtINR(s.tax)}</td></tr>`).join('');
    return `<details class="calc-toggle-table"><summary>📋 ${label} Slab Breakdown</summary>
      <table class="calc-slab-table"><thead><tr><th>Income Slab</th><th>Rate</th><th>Tax</th></tr></thead>
      <tbody>${rows}</tbody></table></details>`;
  }

  const ask = `Income: ${fmtINRCompact(income)}. Old regime: ${fmtINR(oldTotal)} (effective ${oldEffRate}%), New regime: ${fmtINR(newTotal)} (effective ${newEffRate}%). ${better} saves ${fmtINR(Math.abs(savings))}. Deductions: 80C=${fmtINR(d80c)}, 80D=${fmtINR(d80d)}, NPS=${fmtINR(nps)}, HL=${fmtINR(hlInt)}. Which regime should I choose?`;

  let html = `<div class="calc-result-card" style="animation:fadeUp .4s ease">
    <div class="calc-tax-compare">
      <div class="calc-tax-box ${savings>=0?'':'winner'}"><h4>Old Regime</h4>
        <div class="calc-tax-amt">${fmtINR(oldTotal)}</div>
        <div class="calc-tax-sub">Taxable: ${fmtINR(taxableOld)}</div>
        <div class="calc-tax-sub">Effective: ${oldEffRate}%</div></div>
      <div class="calc-tax-vs">VS</div>
      <div class="calc-tax-box ${savings>=0?'winner':''}"><h4>New Regime</h4>
        <div class="calc-tax-amt">${fmtINR(newTotal)}</div>
        <div class="calc-tax-sub">Taxable: ${fmtINR(taxableNew)}</div>
        <div class="calc-tax-sub">Effective: ${newEffRate}%</div></div>
    </div>
    <div class="calc-row highlight"><span class="calc-row-label">💡 Better Option</span><span class="calc-row-value" style="color:var(--accent)">${better}</span></div>
    <div class="calc-row"><span class="calc-row-label">You Save</span><span class="calc-row-value">${fmtINR(Math.abs(savings))}/year</span></div>`;

  html += makeStats([
    { label: 'Old Monthly In-Hand', value: fmtINR(oldMonthly) },
    { label: 'New Monthly In-Hand', value: fmtINR(newMonthly), accent: true },
    { label: 'Old Eff. Rate', value: oldEffRate + '%' },
    { label: 'New Eff. Rate', value: newEffRate + '%' }
  ]);

  // Deductions summary
  if (totalDeductionsOld > 0) {
    html += `<div class="calc-section-title" style="margin-top:12px">📝 Old Regime Deductions Used</div>`;
    html += makeBarChart([
      { label: '80C', value: d80c, color: 'green' },
      { label: '80D', value: d80d, color: 'cyan' },
      ...(hra > 0 ? [{ label: 'HRA', value: hra, color: 'gold' }] : []),
      ...(nps > 0 ? [{ label: 'NPS 80CCD(1B)', value: nps, color: 'green' }] : []),
      ...(hlInt > 0 ? [{ label: 'Home Loan 24(b)', value: hlInt, color: 'cyan' }] : []),
      ...(other > 0 ? [{ label: 'Others', value: other, color: 'gold' }] : [])
    ]);
  }

  html += slabTable(oldBreakdown, 'Old Regime');
  html += slabTable(newBreakdown, 'New Regime');

  // Break-even note
  if (savings > 0) {
    html += `<div class="calc-note">💡 To make Old Regime cheaper, you'd need <strong>${fmtINR(Math.round(savings / 0.3))}</strong> more in deductions (at 30% slab). Consider maximizing NPS (₹50K) & Home Loan interest.</div>`;
  }

  html += `<button class="calc-ask-btn" onclick="askAboutCalc(\`${ask.replace(/`/g,"'")}\`)">💬 Ask Nithi AI about this</button></div>`;

  document.getElementById('cTaxResult').innerHTML = html;
}

// ===== TAX HELPERS =====
function calcSurcharge(income, tax) {
  if (income > 50000000) return tax * 0.37;
  if (income > 20000000) return tax * 0.25;
  if (income > 10000000) return tax * 0.15;
  if (income > 5000000) return tax * 0.10;
  return 0;
}

function getOldSlabBreakdown(t) {
  const breakdown = [];
  let tax = 0, remaining = t;
  const slabs = [
    { limit: 250000, rate: 0, label: '₹0 – ₹2.5L' },
    { limit: 500000, rate: 0.05, label: '₹2.5L – ₹5L' },
    { limit: 1000000, rate: 0.20, label: '₹5L – ₹10L' },
    { limit: Infinity, rate: 0.30, label: 'Above ₹10L' }
  ];
  let prev = 0;
  for (const s of slabs) {
    if (remaining <= prev) break;
    const taxable = Math.min(remaining, s.limit) - prev;
    const slabTax = taxable * s.rate;
    tax += slabTax;
    if (taxable > 0) breakdown.push({ slab: s.label, rate: (s.rate * 100) + '%', tax: slabTax });
    prev = s.limit;
  }
  // Rebate 87A — old regime ≤ ₹5L
  if (t <= 500000) { tax = 0; breakdown.push({ slab: 'Rebate u/s 87A', rate: '-', tax: 0 }); }
  return { tax, breakdown };
}

function getNewSlabBreakdown(t) {
  const breakdown = [];
  let tax = 0;
  const slabs = [
    { limit: 400000, rate: 0, label: '₹0 – ₹4L' },
    { limit: 800000, rate: 0.05, label: '₹4L – ₹8L' },
    { limit: 1200000, rate: 0.10, label: '₹8L – ₹12L' },
    { limit: 1600000, rate: 0.15, label: '₹12L – ₹16L' },
    { limit: 2000000, rate: 0.20, label: '₹16L – ₹20L' },
    { limit: 2400000, rate: 0.25, label: '₹20L – ₹24L' },
    { limit: Infinity, rate: 0.30, label: 'Above ₹24L' }
  ];
  let prev = 0;
  for (const s of slabs) {
    if (t <= prev) break;
    const taxable = Math.min(t, s.limit) - prev;
    const slabTax = taxable * s.rate;
    tax += slabTax;
    if (taxable > 0) breakdown.push({ slab: s.label, rate: (s.rate * 100) + '%', tax: slabTax });
    prev = s.limit;
  }
  // Rebate u/s 87A for income ≤ ₹12L
  if (t <= 1200000) { tax = 0; breakdown.push({ slab: 'Rebate u/s 87A', rate: '-', tax: 0 }); }
  return { tax, breakdown };
}

// ===== INTEREST CALCULATOR (SI & CI) =====
function calcInterest() {
  const P = +document.getElementById('cIntAmt').value;
  const annualR = +document.getElementById('cIntRate').value;
  const yrs = +document.getElementById('cIntYrs').value;
  const mos = +document.getElementById('cIntMo').value;
  const t = yrs + mos / 12;
  const isCI = document.getElementById('cIntCI').checked;
  const comp = isCI ? +document.getElementById('cIntComp').value : 1;
  const compare = document.getElementById('cIntCompare').checked;
  const r = annualR / 100;

  // Simple Interest
  const si = P * r * t;
  const siTotal = P + si;

  // Compound Interest
  const ciTotal = P * Math.pow(1 + r / comp, comp * t);
  const ci = ciTotal - P;

  const interest = isCI ? ci : si;
  const total = isCI ? ciTotal : siTotal;
  const timeLabel = (yrs > 0 ? yrs + 'y ' : '') + (mos > 0 ? mos + 'm' : '');

  // Year-by-year table
  const tableRows = [];
  const fullYrs = Math.ceil(t);
  for (let yr = 1; yr <= fullYrs; yr++) {
    const period = Math.min(yr, t);
    const siVal = P + P * r * period;
    const ciVal = P * Math.pow(1 + r / comp, comp * period);
    tableRows.push([yr > t ? timeLabel : yr, fmtINR(siVal), fmtINR(siVal - P), fmtINR(ciVal), fmtINR(ciVal - P)]);
  }

  const compNames = { 1: 'Yearly', 2: 'Half-Yearly', 4: 'Quarterly', 12: 'Monthly' };
  const ask = `Principal: ${fmtINR(P)}, Rate: ${annualR}%, Period: ${timeLabel}. ${isCI ? 'CI (' + compNames[comp] + ')' : 'SI'}: Interest = ${fmtINRCompact(interest)}, Total = ${fmtINRCompact(total)}.${compare ? ' SI: ' + fmtINRCompact(si) + ', CI: ' + fmtINRCompact(ci) + '.' : ''} Which investment gives the best interest?`;

  let extra = '';
  const statItems = [
    { label: 'Interest Type', value: isCI ? 'Compound (' + compNames[comp] + ')' : 'Simple' },
    { label: 'Effective Rate', value: isCI ? ((Math.pow(1 + r / comp, comp) - 1) * 100).toFixed(2) + '% p.a.' : annualR + '% p.a.' }
  ];

  if (compare) {
    const diff = ci - si;
    extra += makeBarChart([
      { label: 'Simple Interest', value: si, color: 'cyan' },
      { label: 'Compound Interest', value: ci, color: 'gold' }
    ]);
    statItems.push({ label: 'SI Amount', value: fmtINR(si) });
    statItems.push({ label: 'CI Amount', value: fmtINR(ci) });
    statItems.push({ label: 'CI Advantage', value: fmtINR(diff), accent: true });
  }
  extra += makeStats(statItems);
  extra += yearTable('📊 Year-by-Year Breakdown', ['Period', 'SI Total', 'SI Interest', 'CI Total', 'CI Interest'], tableRows);

  document.getElementById('cIntResult').innerHTML = resultCard([
    { label: '🎯 ' + (isCI ? 'Compound' : 'Simple') + ' Interest', value: fmtINR(interest), highlight: true },
    { label: 'Total Amount', value: fmtINR(total) },
    { label: 'Principal', value: fmtINR(P) }
  ], makeDonut(P, interest, total), ask, extra);
}

// ===== CURRENCY CONVERTER =====
// Fallback rates (updated periodically) — live rates fetched from free API
const FALLBACK_RATES = {
  USD: 83.50, EUR: 91.20, GBP: 106.50, AED: 22.73,
  SGD: 62.80, AUD: 55.10, CAD: 62.00, JPY: 0.556, SAR: 22.27, INR: 1
};

async function fetchLiveRates(base) {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    if (data.result === 'success') return data.rates;
  } catch (e) { /* fall through */ }
  return null;
}

async function calcConvertCurrency() {
  const amt = +document.getElementById('cConvAmt').value;
  const from = document.getElementById('cConvFrom').value;
  const to = document.getElementById('cConvTo').value;
  const resultEl = document.getElementById('cConvCurrResult');

  if (from === to) {
    resultEl.innerHTML = `<div class="calc-note">⚠️ From and To currencies are the same. Select different currencies.</div>`;
    return;
  }

  resultEl.innerHTML = '<div class="calc-note">⏳ Fetching live exchange rates...</div>';

  let rates = await fetchLiveRates(from);
  let isLive = !!rates;
  let converted, rate;

  if (rates && rates[to]) {
    rate = rates[to];
    converted = amt * rate;
  } else {
    // Use fallback: convert via INR as base
    const fromInINR = FALLBACK_RATES[from] || 1;
    const toInINR = FALLBACK_RATES[to] || 1;
    rate = toInINR / fromInINR;
    if (from === 'INR') rate = 1 / toInINR;
    else if (to === 'INR') rate = fromInINR;
    else rate = fromInINR / toInINR;
    converted = amt * rate;
    isLive = false;
  }

  const reverseRate = 1 / rate;
  const allCurrencies = ['INR','USD','EUR','GBP','AED','SGD','AUD','CAD','JPY','SAR'];

  // Show conversion to all currencies
  const multiItems = [];
  for (const cur of allCurrencies) {
    if (cur === from) continue;
    let curRate;
    if (rates && rates[cur]) {
      curRate = rates[cur];
    } else {
      const fromINR = FALLBACK_RATES[from] || 1;
      const toINR = FALLBACK_RATES[cur] || 1;
      if (from === 'INR') curRate = 1 / toINR;
      else if (cur === 'INR') curRate = fromINR;
      else curRate = fromINR / toINR;
    }
    const val = amt * curRate;
    const flag = {INR:'🇮🇳',USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',AED:'🇦🇪',SGD:'🇸🇬',AUD:'🇦🇺',CAD:'🇨🇦',JPY:'🇯🇵',SAR:'🇸🇦'}[cur];
    multiItems.push({ label: `${flag} ${cur}`, value: val < 1 ? val.toFixed(6) : val.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2}), highlight: cur === to });
  }

  const fmtConverted = converted < 1 ? converted.toFixed(6) : converted.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});

  const extra = makeStats([
    { label: `1 ${from} =`, value: (rate < 1 ? rate.toFixed(6) : rate.toFixed(4)) + ' ' + to, accent: true },
    { label: `1 ${to} =`, value: (reverseRate < 1 ? reverseRate.toFixed(6) : reverseRate.toFixed(4)) + ' ' + from },
    { label: 'Source', value: isLive ? '✅ Live Rate' : '⚠️ Estimated' }
  ]) + (isLive ? '' : `<div class="calc-note">⚠️ Using estimated rates. Live rates may differ. Check with your bank for exact rates.</div>`);

  const ask = `I want to convert ${amt.toLocaleString()} ${from} to ${to}. Rate: 1 ${from} = ${rate.toFixed(4)} ${to}. Converted: ${fmtConverted} ${to}. What are the best ways to transfer money internationally from India?`;

  resultEl.innerHTML = resultCard([
    { label: `🎯 ${amt.toLocaleString()} ${from} =`, value: `${fmtConverted} ${to}`, highlight: true },
    ...multiItems
  ], '', ask, extra);
}

function calcConvertRate() {
  const rate = +document.getElementById('cConvRate').value;
  const type = document.getElementById('cConvRateType').value;
  let annual, monthly, daily;

  if (type === 'annual') {
    annual = rate;
    monthly = (Math.pow(1 + rate / 100, 1 / 12) - 1) * 100;
    daily = (Math.pow(1 + rate / 100, 1 / 365) - 1) * 100;
  } else if (type === 'monthly') {
    monthly = rate;
    annual = (Math.pow(1 + rate / 100, 12) - 1) * 100;
    daily = (Math.pow(1 + rate / 100, 12 / 365) - 1) * 100;
  } else {
    daily = rate;
    annual = (Math.pow(1 + rate / 100, 365) - 1) * 100;
    monthly = (Math.pow(1 + rate / 100, 365 / 12) - 1) * 100;
  }

  const items = [
    { label: '📅 Annual Rate', value: annual.toFixed(4) + '%', highlight: type === 'annual' },
    { label: '🗓️ Monthly Rate', value: monthly.toFixed(4) + '%', highlight: type === 'monthly' },
    { label: '📆 Daily Rate', value: daily.toFixed(6) + '%', highlight: type === 'daily' }
  ];

  let extra = makeStats([
    { label: 'Conversion Method', value: 'Effective (Compound)', accent: true },
    { label: 'Simple Monthly', value: (annual / 12).toFixed(4) + '%' },
    { label: 'Simple Daily', value: (annual / 365).toFixed(6) + '%' }
  ]);
  extra += `<div class="calc-note">💡 Effective rates account for compounding. Simple rates are just annual ÷ 12 or ÷ 365.</div>`;

  document.getElementById('cConvRateResult').innerHTML = resultCard(items, '', `Convert ${rate}% ${type} rate to other frequencies. Annual: ${annual.toFixed(4)}%, Monthly: ${monthly.toFixed(4)}%, Daily: ${daily.toFixed(6)}%`, extra);
}

function askAboutCalc(text) {
  closeCalcPanel();
  const inpEl = document.getElementById('inp');
  inpEl.value = text;
  onInput(inpEl);
  sendMsg();
}
