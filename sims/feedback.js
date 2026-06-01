/**
 * Feedback Loop Simulator — stock-and-flow dynamics.
 * Shows how reinforcing (R) and balancing (B) loops interact over time.
 * The canonical system dynamics building block.
 */
export const FeedbackSim = {
  id:    'feedback',
  label: 'Feedback Loops',
  description: 'Reinforcing loops amplify change (exponential growth or collapse). Balancing loops resist change and seek equilibrium. Most complex systems — economies, ecosystems, organisations, bodies — are networks of both. This sim shows how their relative strength shapes the trajectory.',
  params: {
    reinforce:  { label: 'Reinforcing gain', min: 0,   max: 0.2, step: 0.005, default: 0.08  },
    balance:    { label: 'Balancing gain',   min: 0,   max: 0.5, step: 0.01,  default: 0.15  },
    target:     { label: 'Target / goal',    min: 10,  max: 200, step: 5,     default: 100   },
    noise:      { label: 'Noise',            min: 0,   max: 3,   step: 0.1,   default: 0.5   },
  },

  init(canvas) {
    this.w = canvas.width;
    this.h = canvas.height;
    this._p = { ...Object.fromEntries(Object.entries(this.params).map(([k,v]) => [k, v.default])) };
    this._reset();
  },

  _reset() {
    this.stock  = 20;
    this.history = [20];
    this.t = 0;
  },

  step() {
    const { reinforce, balance, target, noise } = this._p;
    const n = (Math.random() - 0.5) * noise * 2;
    const inflow  = this.stock * reinforce;
    const outflow = (this.stock - target) * balance;
    this.stock += inflow - outflow + n;
    this.stock  = Math.max(0, this.stock);
    this.history.push(this.stock);
    const maxLen = Math.floor(this.w * 1.2);
    if (this.history.length > maxLen) this.history.shift();
    this.t++;
  },

  draw(ctx) {
    const { w, h } = this;
    ctx.fillStyle = '#040e14';
    ctx.fillRect(0, 0, w, h);

    const p  = this._p;
    const hi = this.history;
    if (hi.length < 2) return;

    // target line
    const yScale = h / Math.max(200, ...hi) * 0.85;
    const ty = h - p.target * yScale - 10;
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = 'rgba(180,155,90,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(w, ty); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(180,155,90,0.6)';
    ctx.fillText('Target', 8, ty - 5);

    // stock curve
    const xStep = w / (hi.length - 1);
    ctx.beginPath();
    for (let i = 0; i < hi.length; i++) {
      const x = i * xStep;
      const y = h - hi[i] * yScale - 10;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'hsl(190,80%,60%)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // fill under curve
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = 'rgba(58,143,168,0.08)';
    ctx.fill();

    // current value dot
    const lastY = h - hi[hi.length-1] * yScale - 10;
    ctx.beginPath();
    ctx.arc(w - 2, lastY, 5, 0, Math.PI*2);
    ctx.fillStyle = 'hsl(190,90%,72%)';
    ctx.fill();

    // labels
    ctx.fillStyle = 'rgba(220,232,238,0.5)';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Stock', 10, 18);
    ctx.fillStyle = 'rgba(220,232,238,0.85)';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(Math.round(hi[hi.length-1]), 10, 38);
  },

  resize(w, h) { this.w = w; this.h = h; },
  setParam(k, v) { this._p[k] = +v; },
  stats() {
    const hi = this.history;
    if (!hi.length) return {};
    const val = hi[hi.length-1];
    const gap = val - this._p.target;
    return {
      'Stock': Math.round(val),
      'Target': Math.round(this._p.target),
      'Gap': (gap >= 0 ? '+' : '') + Math.round(gap),
      'Steps': this.t
    };
  },
};
