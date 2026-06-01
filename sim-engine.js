/**
 * SimEngine — lightweight canvas simulation host
 * Manages render loop, parameter binding, and sim registration.
 */
export class SimEngine {
  constructor(canvasId) {
    this.canvas  = document.getElementById(canvasId);
    this.ctx     = this.canvas.getContext('2d');
    this._sims   = {};
    this._active = null;
    this._raf    = null;
    this._running = false;
    this._onStats = null;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  register(id, sim) { this._sims[id] = sim; }

  load(id) {
    this.stop();
    this._active = this._sims[id];
    if (!this._active) return;
    this._active.init(this.canvas, this.ctx);
    this.play();
  }

  play() {
    if (!this._active) return;
    this._running = true;
    const loop = (ts) => {
      if (!this._running) return;
      this._active.step(ts);
      this._active.draw(this.ctx);
      if (this._onStats) this._onStats(this._active.stats?.() ?? {});
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  pause() {
    this._running = false;
    cancelAnimationFrame(this._raf);
  }

  stop() {
    this.pause();
    if (this._active?.teardown) this._active.teardown();
    this._active = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  reset() {
    if (!this._active) return;
    const id = Object.keys(this._sims).find(k => this._sims[k] === this._active);
    this.load(id);
  }

  setParam(key, value) {
    this._active?.setParam?.(key, value);
  }

  onStats(fn) { this._onStats = fn; }

  _resize() {
    const w = this.canvas.parentElement?.clientWidth ?? 700;
    const h = Math.round(w * 0.56);
    this.canvas.width  = w;
    this.canvas.height = h;
    this._active?.resize?.(w, h);
  }

  get isRunning() { return this._running; }
}
