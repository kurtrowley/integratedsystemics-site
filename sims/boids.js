/**
 * Boids — emergent flocking from three local rules.
 * No agent knows the global pattern; the flock emerges from separation,
 * alignment, and cohesion applied individually by each agent.
 */
export const BoidsSim = {
  id:    'boids',
  label: 'Emergence / Flocking',
  description: 'Each agent follows three simple local rules: avoid neighbours, align with nearby headings, and move toward nearby centres. No agent sees the global pattern — the flock emerges from purely local interactions. A model for how complex order arises without central control.',
  params: {
    count:     { label: 'Agents',     min: 20,  max: 300, step: 10,  default: 120  },
    separation:{ label: 'Separation', min: 0.1, max: 5,   step: 0.1, default: 1.5  },
    alignment: { label: 'Alignment',  min: 0,   max: 2,   step: 0.05,default: 0.9  },
    cohesion:  { label: 'Cohesion',   min: 0,   max: 2,   step: 0.05,default: 0.8  },
    speed:     { label: 'Speed',      min: 0.5, max: 4,   step: 0.1, default: 2    },
  },

  init(canvas) {
    this.w = canvas.width;
    this.h = canvas.height;
    this._p = { ...Object.fromEntries(Object.entries(this.params).map(([k,v]) => [k, v.default])) };
    this._spawn();
  },

  _spawn() {
    const n = Math.round(this._p.count);
    this.boids = Array.from({ length: n }, () => ({
      x:  Math.random() * this.w,
      y:  Math.random() * this.h,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }));
    this.t = 0;
  },

  step() {
    const { separation, alignment, cohesion, speed } = this._p;
    const SEP_R = 28, VIS_R = 80;
    const bs = this.boids;

    for (const b of bs) {
      let sx=0,sy=0, ax=0,ay=0, cx=0,cy=0, near=0, vis=0;

      for (const o of bs) {
        if (o === b) continue;
        const dx = o.x-b.x, dy = o.y-b.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < SEP_R*SEP_R) { const d=Math.sqrt(d2)||1; sx -= dx/d; sy -= dy/d; near++; }
        if (d2 < VIS_R*VIS_R) { ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; vis++; }
      }

      if (near) { b.vx += sx/near * separation * 0.1; b.vy += sy/near * separation * 0.1; }
      if (vis)  { b.vx += (ax/vis - b.vx) * alignment * 0.05;
                  b.vy += (ay/vis - b.vy) * alignment * 0.05;
                  b.vx += (cx/vis - b.x)  * cohesion  * 0.001;
                  b.vy += (cy/vis - b.y)  * cohesion  * 0.001; }

      const spd = Math.hypot(b.vx, b.vy) || 1;
      const target = speed;
      b.vx = b.vx/spd * target;
      b.vy = b.vy/spd * target;

      b.x = (b.x + b.vx + this.w) % this.w;
      b.y = (b.y + b.vy + this.h) % this.h;
    }
    this.t++;
  },

  draw(ctx) {
    ctx.fillStyle = 'rgba(4,14,20,0.35)';
    ctx.fillRect(0, 0, this.w, this.h);

    for (const b of this.boids) {
      const angle = Math.atan2(b.vy, b.vx);
      const spd   = Math.hypot(b.vx, b.vy);
      const hue   = 160 + spd * 30;

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, 3);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-5, -3);
      ctx.closePath();
      ctx.fillStyle = `hsl(${hue},70%,65%)`;
      ctx.fill();
      ctx.restore();
    }
  },

  resize(w, h) { this.w = w; this.h = h; },
  setParam(k, v) {
    this._p[k] = +v;
    if (k === 'count') this._spawn();
  },
  stats() {
    if (!this.boids?.length) return {};
    const speeds = this.boids.map(b => Math.hypot(b.vx, b.vy));
    const avg = (speeds.reduce((a,b)=>a+b,0)/speeds.length).toFixed(2);
    return { 'Agents': this.boids.length, 'Avg speed': avg, 'Steps': this.t };
  },
};
