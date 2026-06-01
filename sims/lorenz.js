/**
 * Lorenz Attractor — deterministic chaos in 3D projected to 2D.
 * Demonstrates sensitive dependence on initial conditions.
 */
export const LorenzSim = {
  id:    'lorenz',
  label: 'Lorenz Attractor',
  description: 'A hallmark of chaos theory. Three linked differential equations produce a trajectory that never repeats — yet stays bounded in a butterfly-shaped region of phase space. Tiny differences in starting position lead to completely different futures.',
  params: {
    sigma: { label: 'σ (Prandtl)',  min: 1,   max: 28,  step: 0.1, default: 10  },
    rho:   { label: 'ρ (Rayleigh)', min: 1,   max: 60,  step: 0.1, default: 28  },
    beta:  { label: 'β (aspect)',   min: 0.1, max: 5,   step: 0.1, default: 2.667 },
    speed: { label: 'Speed',        min: 0.1, max: 5,   step: 0.1, default: 1   },
  },

  init(canvas, ctx) {
    this.w = canvas.width;
    this.h = canvas.height;
    this._p = { ...Object.fromEntries(Object.entries(this.params).map(([k,v]) => [k, v.default])) };
    this._reset();
  },

  _reset() {
    this.x =  0.1; this.y = 0; this.z = 0;
    this.x2 = 0.1001; this.y2 = 0; this.z2 = 0;
    this.trail  = [];
    this.trail2 = [];
    this.t = 0;
    this.angle = 0;
  },

  step() {
    const { sigma, rho, beta, speed } = this._p;
    const dt = 0.005 * speed;
    const steps = Math.ceil(speed * 2);

    for (let i = 0; i < steps; i++) {
      const dx = sigma * (this.y  - this.x);
      const dy = this.x  * (rho - this.z)  - this.y;
      const dz = this.x  * this.y  - beta * this.z;
      this.x += dx * dt; this.y += dy * dt; this.z += dz * dt;

      const dx2 = sigma * (this.y2 - this.x2);
      const dy2 = this.x2 * (rho - this.z2) - this.y2;
      const dz2 = this.x2 * this.y2 - beta * this.z2;
      this.x2 += dx2 * dt; this.y2 += dy2 * dt; this.z2 += dz2 * dt;
    }

    this.angle += 0.002;
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    const project = (x, y, z) => {
      const rx = x * ca - z * sa;
      const rz = x * sa + z * ca;
      const scale = Math.min(this.w, this.h) / 80;
      return [ this.w/2 + rx * scale, this.h/2 + (y - 25) * scale * -1 ];
    };

    this.trail.push(project(this.x, this.y, this.z));
    this.trail2.push(project(this.x2, this.y2, this.z2));
    if (this.trail.length  > 1800) this.trail.shift();
    if (this.trail2.length > 1800) this.trail2.shift();
    this.t++;
  },

  draw(ctx) {
    ctx.fillStyle = 'rgba(4,14,20,0.18)';
    ctx.fillRect(0, 0, this.w, this.h);

    const drawTrail = (trail, hue) => {
      for (let i = 1; i < trail.length; i++) {
        const a = i / trail.length;
        ctx.beginPath();
        ctx.moveTo(trail[i-1][0], trail[i-1][1]);
        ctx.lineTo(trail[i][0],   trail[i][1]);
        ctx.strokeStyle = `hsla(${hue},80%,65%,${a * 0.9})`;
        ctx.lineWidth = a * 1.4;
        ctx.stroke();
      }
    };

    drawTrail(this.trail,  190);
    drawTrail(this.trail2, 38);

    // divergence indicator
    if (this.trail.length && this.trail2.length) {
      const p1 = this.trail[this.trail.length-1];
      const p2 = this.trail2[this.trail2.length-1];
      ctx.beginPath();
      ctx.arc(p1[0], p1[1], 3, 0, Math.PI*2);
      ctx.fillStyle = 'hsl(190,90%,75%)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p2[0], p2[1], 3, 0, Math.PI*2);
      ctx.fillStyle = 'hsl(38,90%,70%)';
      ctx.fill();
    }
  },

  resize(w, h) { this.w = w; this.h = h; },
  setParam(k, v) { this._p[k] = +v; if (k !== 'speed') this._reset(); },
  stats() {
    if (!this.trail.length || !this.trail2.length) return {};
    const p1 = this.trail[this.trail.length-1];
    const p2 = this.trail2[this.trail2.length-1];
    const d  = Math.hypot(p1[0]-p2[0], p1[1]-p2[1]);
    return { 'σ': this._p.sigma.toFixed(1), 'ρ': this._p.rho.toFixed(1), 'Divergence': d.toFixed(1) + 'px', 'Steps': this.t };
  },
};
