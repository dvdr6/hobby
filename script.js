/* ──────────────────────────────────────────
   CryptoTrack – script.js
────────────────────────────────────────── */

/* ── Sample Holdings Data ── */
const holdings = [
  { id: 'bitcoin',   name: 'Bitcoin',   symbol: 'BTC', amount: 0.85,  icon: '₿',  iconBg: '#f7931a22', iconColor: '#f7931a' },
  { id: 'ethereum',  name: 'Ethereum',  symbol: 'ETH', amount: 4.20,  icon: 'Ξ',  iconBg: '#627eea22', iconColor: '#627eea' },
  { id: 'solana',    name: 'Solana',    symbol: 'SOL', amount: 42,    icon: '◎',  iconBg: '#9945ff22', iconColor: '#9945ff' },
  { id: 'cardano',   name: 'Cardano',   symbol: 'ADA', amount: 9500,  icon: '₳',  iconBg: '#0033ad22', iconColor: '#4a90e2' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX',amount: 88,    icon: 'A',  iconBg: '#e8414222', iconColor: '#e84142' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK',amount: 320,   icon: '⬡',  iconBg: '#375bd222', iconColor: '#375bd2' },
  { id: 'polkadot',  name: 'Polkadot',  symbol: 'DOT', amount: 410,   icon: '●',  iconBg: '#e6007a22', iconColor: '#e6007a' },
  { id: 'dogecoin',  name: 'Dogecoin',  symbol: 'DOGE',amount: 15000, icon: 'Ð',  iconBg: '#c2a63322', iconColor: '#c2a633' },
];

/* ── Base prices & 24h changes (realistic snapshot) ── */
const baseData = {
  bitcoin:   { price: 67420.50, change24h:  2.34 },
  ethereum:  { price:  3512.80, change24h:  1.87 },
  solana:    { price:   178.40, change24h:  5.62 },
  cardano:   { price:     0.612,change24h: -1.45 },
  avalanche: { price:    41.20, change24h:  3.18 },
  chainlink: { price:    18.75, change24h: -2.67 },
  polkadot:  { price:     9.34, change24h: -0.89 },
  dogecoin:  { price:     0.183,change24h:  7.41 },
};

/* ── Generate sparkline history (7 data points) ── */
function generateSparkline(basePrice, change24h) {
  const points = [];
  let p = basePrice * (1 - (change24h / 100) * 0.9);
  for (let i = 0; i < 7; i++) {
    const jitter = (Math.random() - 0.48) * basePrice * 0.018;
    p += jitter;
    points.push(Math.max(0, p));
  }
  points.push(basePrice); // end at current
  return points;
}

/* ── Live state ── */
let coins = holdings.map(h => ({
  ...h,
  price:    baseData[h.id].price,
  change24h:baseData[h.id].change24h,
  sparkline:generateSparkline(baseData[h.id].price, baseData[h.id].change24h),
  prevPrice:null,
}));

let searchQuery = '';
let highlightedSlice = -1;

/* ── Format helpers ── */
const fmt$ = (n, decimals = 2) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtPct = (n) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

function coinValue(c) { return c.price * c.amount; }

/* ───────────────────────────────────────────
   SPARKLINE RENDERER
─────────────────────────────────────────── */
function drawSparkline(canvas, data, isGain) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 6) - 3,
  }));

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  if (isGain) {
    grad.addColorStop(0, 'rgba(34,197,94,.35)');
    grad.addColorStop(1, 'rgba(34,197,94,.01)');
  } else {
    grad.addColorStop(0, 'rgba(239,68,68,.35)');
    grad.addColorStop(1, 'rgba(239,68,68,.01)');
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = isGain ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // End dot
  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = isGain ? '#22c55e' : '#ef4444';
  ctx.fill();
}

/* ───────────────────────────────────────────
   TABLE RENDERER
─────────────────────────────────────────── */
function renderTable() {
  const tbody = document.getElementById('coinTableBody');
  const filtered = coins.filter(c =>
    c.name.toLowerCase().includes(searchQuery) ||
    c.symbol.toLowerCase().includes(searchQuery)
  );

  // Remove rows not in filtered
  const existingIds = [...tbody.querySelectorAll('tr')].map(r => r.dataset.id);
  const filteredIds  = filtered.map(c => c.id);

  existingIds.forEach(id => {
    if (!filteredIds.includes(id)) {
      const row = tbody.querySelector(`tr[data-id="${id}"]`);
      if (row) row.remove();
    }
  });

  filtered.forEach((coin, idx) => {
    const isGain = coin.change24h >= 0;
    const val    = coinValue(coin);
    let row      = tbody.querySelector(`tr[data-id="${coin.id}"]`);

    if (!row) {
      row = document.createElement('tr');
      row.dataset.id = coin.id;
      row.innerHTML = `
        <td class="rank-cell">${idx + 1}</td>
        <td>
          <div class="coin-cell">
            <div class="coin-icon" style="background:${coin.iconBg};color:${coin.iconColor}">${coin.icon}</div>
            <div>
              <div class="coin-name">${coin.name}</div>
              <div class="coin-symbol">${coin.symbol}</div>
            </div>
          </div>
        </td>
        <td class="price-cell price-val">${fmt$(coin.price, coin.price < 1 ? 4 : 2)}</td>
        <td><span class="change-pill ${isGain ? 'gain' : 'loss'}">${isGain ? '▲' : '▼'} ${Math.abs(coin.change24h).toFixed(2)}%</span></td>
        <td>
          <div>${coin.amount.toLocaleString()} ${coin.symbol}</div>
          <div class="holdings-amount">${fmt$(val)}</div>
        </td>
        <td class="value-cell">${fmt$(val)}</td>
        <td><canvas class="sparkline" width="90" height="38"></canvas></td>
      `;
      tbody.appendChild(row);

      const canvas = row.querySelector('canvas.sparkline');
      drawSparkline(canvas, coin.sparkline, isGain);
    } else {
      // Update only changed cells
      const priceCell = row.querySelector('.price-val');
      const newPrice  = fmt$(coin.price, coin.price < 1 ? 4 : 2);
      if (priceCell.textContent !== newPrice) {
        const dir = coin.price > (coin.prevPrice || coin.price) ? 'gain' : 'loss';
        priceCell.textContent = newPrice;
        priceCell.classList.remove('flash-gain', 'flash-loss');
        void priceCell.offsetWidth;
        priceCell.classList.add(`flash-${dir}`);
      }
      row.querySelector('.value-cell').textContent = fmt$(val);
      row.querySelector('.holdings-amount').textContent = fmt$(val);

      const pill = row.querySelector('.change-pill');
      pill.className = `change-pill ${isGain ? 'gain' : 'loss'}`;
      pill.innerHTML = `${isGain ? '▲' : '▼'} ${Math.abs(coin.change24h).toFixed(2)}%`;
    }
  });
}

/* ───────────────────────────────────────────
   PIE CHART
─────────────────────────────────────────── */
const PIE_COLORS = [
  '#6c63ff','#00d4aa','#f7931a','#e6007a',
  '#22c55e','#375bd2','#e84142','#c2a633',
];

function drawPie(highlightIdx = -1) {
  const canvas = document.getElementById('pieChart');
  const ctx    = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const outerR = 90, innerR = 52;
  ctx.clearRect(0, 0, W, H);

  const total = coins.reduce((s, c) => s + coinValue(c), 0);
  const slices = coins.map((c, i) => ({
    pct:   coinValue(c) / total,
    color: PIE_COLORS[i % PIE_COLORS.length],
    coin:  c,
  }));

  let startAngle = -Math.PI / 2;
  slices.forEach((sl, i) => {
    const sweep = sl.pct * Math.PI * 2;
    const isHL  = i === highlightIdx;
    const r     = isHL ? outerR + 8 : outerR;
    const hOff  = isHL ? 6 : 0;
    const midA  = startAngle + sweep / 2;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(midA) * hOff, cy + Math.sin(midA) * hOff);
    ctx.arc(
      cx + Math.cos(midA) * hOff,
      cy + Math.sin(midA) * hOff,
      r, startAngle, startAngle + sweep
    );
    ctx.arc(
      cx + Math.cos(midA) * hOff,
      cy + Math.sin(midA) * hOff,
      innerR, startAngle + sweep, startAngle, true
    );
    ctx.closePath();

    // Shadow / glow on highlight
    if (isHL) {
      ctx.shadowColor = sl.color;
      ctx.shadowBlur  = 18;
    }
    ctx.fillStyle = sl.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Gap
    ctx.strokeStyle = '#0d0f14';
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    startAngle += sweep;
  });

  // Center label
  const centerVal  = document.getElementById('pieCenterValue');
  const centerName = document.getElementById('pieCenterName');
  if (highlightIdx >= 0) {
    const sl = slices[highlightIdx];
    centerVal.textContent  = (sl.pct * 100).toFixed(1) + '%';
    centerName.textContent = sl.coin.symbol;
  } else {
    centerVal.textContent  = fmt$(total, 0);
    centerName.textContent = 'Total';
  }
}

function renderLegend() {
  const total  = coins.reduce((s, c) => s + coinValue(c), 0);
  const legend = document.getElementById('pieLegend');
  legend.innerHTML = '';
  coins.forEach((c, i) => {
    const pct = (coinValue(c) / total * 100).toFixed(1);
    const li  = document.createElement('li');
    li.className = 'legend-item';
    li.innerHTML = `
      <div class="legend-dot-name">
        <span class="legend-dot" style="background:${PIE_COLORS[i % PIE_COLORS.length]}"></span>
        <span>${c.symbol}</span>
      </div>
      <span class="legend-pct">${pct}%</span>
    `;
    li.addEventListener('mouseenter', () => { highlightedSlice = i; drawPie(i); });
    li.addEventListener('mouseleave', () => { highlightedSlice = -1; drawPie(-1); });
    legend.appendChild(li);
  });

  // Pie canvas hover
  const canvas = document.getElementById('pieChart');
  canvas.onmousemove = (e) => {
    const rect  = canvas.getBoundingClientRect();
    const mx    = e.clientX - rect.left - canvas.width / 2;
    const my    = e.clientY - rect.top  - canvas.height / 2;
    const dist  = Math.sqrt(mx * mx + my * my);
    if (dist < 52 || dist > 100) { if (highlightedSlice !== -1) { highlightedSlice = -1; drawPie(-1); } return; }
    let angle   = Math.atan2(my, mx) - (-Math.PI / 2);
    if (angle < 0) angle += Math.PI * 2;
    const total = coins.reduce((s, c) => s + coinValue(c), 0);
    let acc = 0, idx = -1;
    coins.forEach((c, i) => {
      const sweep = (coinValue(c) / total) * Math.PI * 2;
      if (angle >= acc && angle < acc + sweep) idx = i;
      acc += sweep;
    });
    if (idx !== highlightedSlice) { highlightedSlice = idx; drawPie(idx); }
  };
  canvas.onmouseleave = () => { highlightedSlice = -1; drawPie(-1); };
}

/* ───────────────────────────────────────────
   BAR CHART (24h)
─────────────────────────────────────────── */
function renderBars() {
  const list     = document.getElementById('barList');
  const maxAbs   = Math.max(...coins.map(c => Math.abs(c.change24h)));
  list.innerHTML = '';

  const sorted = [...coins].sort((a, b) => b.change24h - a.change24h);
  sorted.forEach(c => {
    const isGain = c.change24h >= 0;
    const fillW  = (Math.abs(c.change24h) / maxAbs) * 100;
    const div    = document.createElement('div');
    div.className = 'bar-item';
    div.innerHTML = `
      <div class="bar-meta">
        <span class="bar-symbol">${c.symbol}</span>
        <span class="bar-pct ${isGain ? 'gain' : 'loss'}">${fmtPct(c.change24h)}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill ${isGain ? 'gain' : 'loss'}" style="width:${fillW}%"></div>
      </div>
    `;
    list.appendChild(div);
  });
}

/* ───────────────────────────────────────────
   SUMMARY CARDS
─────────────────────────────────────────── */
function renderSummary() {
  const total   = coins.reduce((s, c) => s + coinValue(c), 0);
  const change$ = coins.reduce((s, c) => {
    const prev  = c.price / (1 + c.change24h / 100);
    return s + (c.price - prev) * c.amount;
  }, 0);

  document.getElementById('totalValue').textContent    = fmt$(total, 0);
  const sub = document.getElementById('totalChange');
  sub.textContent  = (change$ >= 0 ? '+' : '') + fmt$(change$, 0) + ' today';
  sub.className    = 'summary-sub ' + (change$ >= 0 ? 'gain' : 'loss');

  const best  = [...coins].sort((a, b) => b.change24h - a.change24h)[0];
  const worst = [...coins].sort((a, b) => a.change24h - b.change24h)[0];

  document.getElementById('bestCoin').textContent   = best.name;
  document.getElementById('bestChange').textContent = fmtPct(best.change24h);
  document.getElementById('worstCoin').textContent  = worst.name;
  document.getElementById('worstChange').textContent= fmtPct(worst.change24h);
  document.getElementById('holdingsCount').textContent = coins.length + ' coins';
}

/* ───────────────────────────────────────────
   FULL RENDER
─────────────────────────────────────────── */
function renderAll() {
  renderSummary();
  renderTable();
  drawPie(highlightedSlice);
  renderLegend();
  renderBars();
}

/* ───────────────────────────────────────────
   LIVE PRICE SIMULATION
─────────────────────────────────────────── */
function tickPrices() {
  coins = coins.map(c => {
    const prevPrice = c.price;
    // Small random walk ±0.4%
    const delta   = (Math.random() - 0.495) * c.price * 0.004;
    const newPrice = Math.max(0.0001, c.price + delta);
    // Drift change24h slightly
    const changeDrift = (Math.random() - 0.5) * 0.05;
    const newChange   = Math.max(-30, Math.min(30, c.change24h + changeDrift));
    // Update sparkline (shift + push)
    const newSparkline = [...c.sparkline.slice(1), newPrice];
    return { ...c, prevPrice, price: newPrice, change24h: newChange, sparkline: newSparkline };
  });

  renderSummary();
  renderTable();
  drawPie(highlightedSlice);
  renderBars();

  // Re-draw sparklines
  const tbody = document.getElementById('coinTableBody');
  coins.forEach(c => {
    const row = tbody.querySelector(`tr[data-id="${c.id}"]`);
    if (!row) return;
    const canvas = row.querySelector('canvas.sparkline');
    if (canvas) drawSparkline(canvas, c.sparkline, c.change24h >= 0);
  });

  // Update timestamp
  document.getElementById('lastUpdated').textContent =
    'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/* ───────────────────────────────────────────
   SEARCH
─────────────────────────────────────────── */
document.getElementById('searchInput').addEventListener('input', function () {
  searchQuery = this.value.toLowerCase().trim();
  renderTable();
});

/* ───────────────────────────────────────────
   INIT
─────────────────────────────────────────── */
renderAll();
setInterval(tickPrices, 2500);
