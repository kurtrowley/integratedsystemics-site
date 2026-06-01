// ME/CFS Population Outbreak Simulator
// Models a viral outbreak through a community and tracks post-viral ME/CFS development.
// Individual risk factors are drawn from published epidemiological research.
// CFS probability formula based on: Wessely et al., Jason et al., Tomas & Newton review 2018.

// ─── Name pools ────────────────────────────────────────────────────────────────
const NF = ['Sarah','Emma','Olivia','Ava','Isabella','Sophia','Mia','Charlotte',
  'Amelia','Harper','Evelyn','Abigail','Emily','Elizabeth','Sofia','Madison',
  'Scarlett','Victoria','Luna','Grace','Chloe','Penelope','Layla','Riley',
  'Zoey','Nora','Lily','Eleanor','Hannah','Lillian','Aubrey','Hazel','Violet',
  'Aurora','Savannah','Audrey','Brooklyn','Bella','Claire','Skylar'];
const NM = ['Liam','Noah','Oliver','Elijah','James','William','Benjamin','Lucas',
  'Henry','Alexander','Mason','Ethan','Daniel','Jacob','Logan','Jackson',
  'Sebastian','Jack','Aiden','Owen','Samuel','Ryan','Nathan','Caleb','Isaiah',
  'Matthew','Eli','Gabriel','Julian','Wyatt','Dylan','Luke','Hunter','Isaac',
  'Grayson','David','Andrew','Josiah','Chris','Marcus'];

// ─── Status constants ───────────────────────────────────────────────────────────
export const STATUS = {
  HEALTHY:    'healthy',
  EXPOSED:    'exposed',
  INFECTIOUS: 'infectious',
  RECOVERING: 'recovering',
  RECOVERED:  'recovered',
  LONG_COVID: 'long_covid',
  CFS:        'cfs',
  SEVERE_CFS: 'severe_cfs',
};

export const STATUS_LABEL = {
  healthy:    'Healthy',
  exposed:    'Exposed',
  infectious: 'Infectious (acute)',
  recovering: 'Recovering',
  recovered:  'Fully recovered',
  long_covid: 'Long COVID / PVFS',
  cfs:        'ME/CFS',
  severe_cfs: 'Severe ME/CFS',
};

// RGB triples — interpolated during transitions
const STATUS_RGB = {
  healthy:    [50, 80, 96],
  exposed:    [170, 140, 30],
  infectious: [200, 80, 30],
  recovering: [100, 140, 70],
  recovered:  [50, 140, 100],
  long_covid: [180, 110, 40],
  cfs:        [140, 28, 58],
  severe_cfs: [70,  6, 28],
};

// ─── Person ─────────────────────────────────────────────────────────────────────
class Person {
  constructor(id, row, col, isViewpoint = false) {
    this.id  = id;
    this.row = row;
    this.col = col;
    this.isViewpoint = isViewpoint;

    // Demographics
    this.sex = Math.random() < 0.51 ? 'F' : 'M';
    this.age = 18 + Math.floor(Math.random() * 62);
    const pool = this.sex === 'F' ? NF : NM;
    this.name = isViewpoint ? 'You' : pool[Math.floor(Math.random() * pool.length)];

    // ── Core risk factors ───────────────────────────────────────────
    this.susceptibility       = Math.random();
    this.priorEBV             = Math.random() < 0.90;
    this.baselineStress       = Math.random();
    this.immuneFunction       = 0.35 + Math.random() * 0.65;
    this.sleepQuality         = Math.random();
    this.economicStress       = Math.random();
    this.pollutionExp         = Math.random();
    this.socialSupport        = Math.random();
    this.priorConditions      = Math.random() < 0.30 ? Math.random() : Math.random() * 0.3;

    // ── Neurological profile ────────────────────────────────────────
    // ~18% significant neurodivergence (ADHD ~10%, autism ~3%, other ~5%)
    this.neurodivergence      = Math.random() < 0.18 ? 0.35 + Math.random() * 0.65 : Math.random() * 0.2;
    // Ongoing emotional stress load (distinct from accumulated trauma history)
    this.emotionalStressLoad  = Math.random();
    // Mechanical brainstem load: Chiari, CCI, upper cervical — rare but high-impact
    this.mechanicalBrainstemLoad = Math.random() < 0.07 ? 0.4 + Math.random() * 0.6 : Math.random() * 0.12;

    // ── Systemic health ─────────────────────────────────────────────
    this.digestiveHealth      = Math.random() < 0.20 ? 0.4 + Math.random() * 0.6 : Math.random() * 0.4;
    this.metabolicHealth      = Math.random() < 0.25 ? 0.4 + Math.random() * 0.6 : Math.random() * 0.4;
    this.generalFitness       = Math.random();  // 0=poor, 1=excellent (protective when high)
    this.dietQuality          = Math.random();  // 0=poor, 1=excellent (protective when high)

    // ── Personal environmental exposures ────────────────────────────
    this.moldExposure         = Math.random() < 0.12 ? 0.3 + Math.random() * 0.7 : Math.random() * 0.15;
    this.chemicalExposure     = Math.random() < 0.10 ? 0.3 + Math.random() * 0.7 : Math.random() * 0.12;

    // ── Prior infection history ─────────────────────────────────────
    this.priorHHV6            = Math.random() < 0.95;
    this.priorCMV             = Math.random() < 0.60;
    this.priorLyme            = Math.random() < 0.08;
    this.priorMycoplasma      = Math.random() < 0.30;

    // Assigned when infected (not a pre-existing factor)
    this.autonomicAcute       = 0;

    // Viewpoint character: skewed toward at-risk profile for narrative tension
    if (isViewpoint) {
      this.sex                    = 'F';
      this.age                    = 35 + Math.floor(Math.random() * 15);
      this.susceptibility         = 0.45 + Math.random() * 0.45;
      this.priorEBV               = true;
      this.priorHHV6              = true;
      this.baselineStress         = 0.35 + Math.random() * 0.45;
      this.emotionalStressLoad    = 0.30 + Math.random() * 0.45;
      this.immuneFunction         = 0.25 + Math.random() * 0.45;
      this.sleepQuality           = 0.20 + Math.random() * 0.50;
      this.priorConditions        = 0.15 + Math.random() * 0.40;
      this.digestiveHealth        = 0.20 + Math.random() * 0.50;
      this.neurodivergence        = Math.random() < 0.25 ? 0.3 + Math.random() * 0.5 : Math.random() * 0.2;
      this.moldExposure           = Math.random() * 0.3;
      this.chemicalExposure       = Math.random() * 0.2;
    }

    // ── Simulation state ────────────────────────────────────────────
    this.status        = STATUS.HEALTHY;
    this.exposedDay    = null;
    this.infectDay     = null;   // becomes infectious on this day
    this.acuteEndDay   = null;   // acute phase ends
    this.cfsDay        = null;   // ME/CFS emerges (null = won't develop)
    this.outcome       = null;   // 'recovered' | 'long_covid' | 'cfs' | 'severe_cfs'
    this.illnessSeverity = 0;
    this.cfsRisk       = 0;
    this.symptoms      = null;

    // Visual
    this.colorT        = 0;      // lerp progress between old/new status colors
    this.prevRGB       = [...STATUS_RGB.healthy];
    this.currRGB       = [...STATUS_RGB.healthy];
    this.pulseOffset   = Math.random() * Math.PI * 2;
    this.flashTimer    = 0;      // transmission flash
  }

  // ── Research-based CFS probability ──────────────────────────────
  // Uses an additive weighted risk score to avoid multiplicative compounding.
  // Calibrated so: pathogenSeverity=0.0 → ~2–3% (influenza AHR data)
  //                pathogenSeverity=0.5 → ~11–12% (Dubbo benchmark; Chicago mono)
  //                pathogenSeverity=1.0 → ~24–27% (SARS Hong Kong 4-year follow-up)
  // Weights set so the average person scores ≈ 0.50, giving p ≈ sex-specific base rate.
  _computeCFSRisk(severity, env) {
    // Pathogen severity scales sex-specific base probability.
    // Female base 15%, male base 6.5% → population average ~11% at pathogenSeverity=0.5.
    const pathogenMult = 0.20 + (env.pathogenSeverity ?? 0.5) * 1.60;
    const base = (this.sex === 'F' ? 0.150 : 0.065) * pathogenMult;

    // Prior viral history bonus
    const priorViralBonus =
      (this.priorHHV6       ? 0.035 : 0) +  // HHV-6 reactivation risk
      (this.priorCMV        ? 0.025 : 0) +  // cumulative herpesvirus burden
      (this.priorLyme       ? 0.070 : 0) +  // PTLDS/ME/CFS overlap (strong)
      (this.priorMycoplasma ? 0.035 : 0);   // Nicolson: elevated in ME/CFS

    const agePeak  = this.age >= 35 && this.age <= 64 ? 0.040 :
                     this.age >= 25 && this.age < 35  ? 0.010 :
                     this.age < 18                    ?-0.080 : 0;
    const envAdj   = (env.economicStress      ?? 0.3) * 0.012
                   + (env.pollution           ?? 0.3) * 0.008
                   - (env.healthcareAccess    ?? 0.5) * 0.012
                   - (env.socialInfrastructure?? 0.5) * 0.006;

    // Raw additive score — all weights calibrated so average person scores ~0.674.
    // After normalization (÷1.35) this maps to ~0.50, keeping p ≈ base rate.
    const rawScore =
      severity                    * 0.250 + // most replicated predictor (all studies)
      this.autonomicAcute         * 0.200 + // Chicago mono: strongest single predictor
      this.priorConditions        * 0.100 + // prior autoimmune/metabolic/psychiatric
      (this.priorEBV ? 0.063 : 0)         + // EBV seropositivity / reactivation risk
      this.baselineStress         * 0.080 + // accumulated stress/trauma (Wessely 1995)
      this.susceptibility         * 0.060 + // HLA/genetic susceptibility
      (1 - this.sleepQuality)     * 0.060 + // impaired immune clearance
      (1 - this.immuneFunction)   * 0.050 + // lower immune baseline
      this.economicStress         * 0.040 + // delayed care, poor recovery conditions
      this.pollutionExp           * 0.030 + // environmental toxin burden
      (1 - this.socialSupport)    * 0.040 + // social support protective (Buchwald 2000)
      // ── Neurological profile ─────────────────────────────────────
      this.neurodivergence        * 0.040 + // ANS dysregulation in ADHD/autism
      this.emotionalStressLoad    * 0.060 + // ongoing HPA axis priming
      this.mechanicalBrainstemLoad* 0.080 + // structural brainstem compression
      // ── Systemic health ──────────────────────────────────────────
      this.digestiveHealth        * 0.045 + // gut-brain axis dysfunction
      this.metabolicHealth        * 0.050 + // mitochondrial/metabolic compromise
      (1 - this.generalFitness)   * 0.030 + // lower fitness → reduced immune resilience
      (1 - this.dietQuality)      * 0.025 + // inflammatory diet burden
      // ── Personal environmental exposures ─────────────────────────
      (this.moldExposure     ?? 0) * 0.035 + // mycotoxin immune burden
      (this.chemicalExposure ?? 0) * 0.030 + // chemical/oxidative stress load
      // ── Prior viral history ───────────────────────────────────────
      priorViralBonus                      +
      agePeak                              +
      envAdj;

    // Normalize: avg rawScore ≈ 0.674 → ÷1.35 → 0.50 → multiplier 1.0 → p = base
    const score = Math.min(1, rawScore / 1.35);

    return Math.min(Math.max(base * (0.40 + score * 1.20), 0.01), 0.92);
  }

  expose(day) {
    if (this.status !== STATUS.HEALTHY) return false;
    this.status        = STATUS.EXPOSED;
    this.exposedDay    = day;
    this.infectDay     = day + 3 + Math.floor(Math.random() * 4); // 3–6d incubation
    this._transitionColor();
    return true;
  }

  update(day, env) {
    switch (this.status) {
      case STATUS.EXPOSED:
        if (day >= this.infectDay) {
          this.status          = STATUS.INFECTIOUS;
          this.illnessSeverity = 0.15 + Math.random() * 0.85;
          // Autonomic severity during acute phase: correlated with severity
          // but independently variable. Chicago mono study: this is the
          // strongest single predictor of ME/CFS conversion.
          this.autonomicAcute  = Math.min(1, this.illnessSeverity * (0.4 + Math.random() * 0.8));
          this.cfsRisk         = this._computeCFSRisk(this.illnessSeverity, env);
          this.acuteEndDay     = day + 7 + Math.floor(Math.random() * 8);
          this._transitionColor();
        }
        break;

      case STATUS.INFECTIOUS:
        if (day >= this.acuteEndDay) {
          this.status = STATUS.RECOVERING;
          const r = Math.random();
          if (r < this.cfsRisk) {
            const severe     = Math.random() < (this.cfsRisk > 0.55 ? 0.45 : 0.2);
            this.outcome     = severe ? 'severe_cfs' : 'cfs';
            // ME/CFS emerges 60–180 days post-infection (Carruthers et al., 2011)
            this.cfsDay      = day + 60 + Math.floor(Math.random() * 120);
          } else if (r < this.cfsRisk + 0.12) {
            this.outcome     = 'long_covid';
            this.cfsDay      = day + 21 + Math.floor(Math.random() * 60);
          } else {
            this.outcome     = 'recovered';
            this.cfsDay      = null;
          }
          this._transitionColor();
        }
        break;

      case STATUS.RECOVERING:
        if (this.cfsDay && day >= this.cfsDay) {
          this.status = this.outcome === 'cfs'        ? STATUS.CFS :
                        this.outcome === 'severe_cfs' ? STATUS.SEVERE_CFS :
                        STATUS.LONG_COVID;
          this._assignSymptoms();
          this._transitionColor();
        } else if (!this.cfsDay && day >= (this.acuteEndDay + 21 + Math.floor(Math.random()*14))) {
          this.status  = STATUS.RECOVERED;
          this._transitionColor();
        }
        break;

      case STATUS.LONG_COVID:
        // Gradual recovery following the decay curve observed in Dubbo/Chicago studies:
        // ~40–46% of Long COVID cases recover per 6-month window.
        // p(recovery/day) ≈ 0.003 → median recovery ~8 months;
        // modulated by immune function, social support, and stress load.
        // ME/CFS cases (hasCFS) do NOT recover in this model — they represent
        // the hard floor that persists at 4% of originally infected at 24 months.
        {
          const pRecov = Math.max(0.0005,
            (0.003 + this.immuneFunction * 0.002 - this.baselineStress * 0.001)
            * (0.5 + this.socialSupport * 0.5));
          if (Math.random() < pRecov) {
            this.status = STATUS.RECOVERED;
            this.symptoms = null;
            this._transitionColor();
          }
        }
        break;
    }

    // Color lerp
    if (this.colorT < 1) this.colorT = Math.min(1, this.colorT + 0.04);
    if (this.flashTimer > 0) this.flashTimer--;
  }

  _transitionColor() {
    const rgb = STATUS_RGB[this.status];
    this.prevRGB = this._lerpedColor();
    this.currRGB = [...rgb];
    this.colorT  = 0;
  }

  _lerpedColor() {
    const t = this.colorT;
    return this.prevRGB.map((v, i) => Math.round(v + (this.currRGB[i] - v) * t));
  }

  get color() {
    const [r, g, b] = this._lerpedColor();
    return `rgb(${r},${g},${b})`;
  }

  get colorBright() {
    const [r, g, b] = this._lerpedColor();
    return `rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`;
  }

  _assignSymptoms() {
    const s = this.outcome === 'severe_cfs' ? 0.65 + Math.random() * 0.35
                                             : 0.28 + Math.random() * 0.52;
    this.symptoms = {
      fatigue:   s,
      pem:       s * (0.8 + Math.random() * 0.4),   // post-exertional malaise — hallmark
      cognitive: s * (0.5 + Math.random() * 0.5),   // brain fog
      autonomic: s * (0.4 + Math.random() * 0.6),   // POTS/dysautonomia
      pain:      s * (0.3 + Math.random() * 0.7),
      sleep:     s * (0.5 + Math.random() * 0.5),
      brainstem: s * (0.45 + Math.random() * 0.55), // brainstem dysfunction index
      hpa:       s * (0.4 + Math.random() * 0.5),   // HPA axis blunting
      vagal:     s * (0.5 + Math.random() * 0.5),   // vagal dysregulation
    };
  }

  get hasCFS()     { return this.status === STATUS.CFS || this.status === STATUS.SEVERE_CFS; }
  get isInfected() { return [STATUS.EXPOSED, STATUS.INFECTIOUS, STATUS.RECOVERING].includes(this.status); }
  get isContagious(){ return this.status === STATUS.INFECTIOUS; }
}

// ─── Main Simulation Class ──────────────────────────────────────────────────────
export class MECFSPopulationSim {
  constructor(canvas, detailEl, statsEl, content = null) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.detailEl = detailEl;
    this.statsEl  = statsEl;
    this.content  = content; // JSON content for labels and narratives

    this.COLS = 10;
    this.ROWS = 10;
    this.day  = 0;
    this.running   = false;
    this.speed     = 2;          // days per frame
    this.frameSkip = 1;

    this.env = {
      r0:                  3.0,
      pathogenSeverity:    0.5,  // 0=influenza-like, 0.5=EBV/COVID moderate, 1.0=SARS-like
      economicStress:      0.3,
      pollution:           0.3,
      healthcareAccess:    0.5,
      socialInfrastructure:0.5,
    };

    this.selected  = null;       // selected person id
    this.flashes   = [];         // [{x1,y1,x2,y2,t}] transmission lines

    this._init();
    this._bindMouse();
  }

  _init() {
    this.population = [];
    const vpRow = 4, vpCol = 4; // viewpoint near center
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const id = r * this.COLS + c;
        const vp = r === vpRow && c === vpCol;
        this.population.push(new Person(id, r, c, vp));
      }
    }
    this.day     = 0;
    this.running = false;
    this.selected = null;
    this.flashes = [];

    // Patient zero — random, not the viewpoint character
    const candidates = this.population.filter(p => !p.isViewpoint);
    const pz = candidates[Math.floor(Math.random() * candidates.length)];
    pz.status          = STATUS.INFECTIOUS;
    pz.infectDay       = 0;
    pz.acuteEndDay     = 12 + Math.floor(Math.random() * 6);
    pz.illnessSeverity = 0.5 + Math.random() * 0.5;
    pz.cfsRisk         = pz._computeCFSRisk(pz.illnessSeverity, this.env);
    pz._transitionColor();

    this._updateDetail();
    this._updateStats();
  }

  _cellSize() {
    return Math.min(this.canvas.width, this.canvas.height) / Math.max(this.COLS, this.ROWS);
  }

  _personPos(p) {
    const cs = this._cellSize();
    const ox = (this.canvas.width  - this.COLS * cs) / 2;
    const oy = (this.canvas.height - this.ROWS * cs) / 2;
    return {
      x: ox + p.col * cs + cs / 2,
      y: oy + p.row * cs + cs / 2,
      r: cs * 0.36,
    };
  }

  _bindMouse() {
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.canvas.width  / rect.width);
      const my = (e.clientY - rect.top)  * (this.canvas.height / rect.height);
      this.population.forEach(p => {
        const pos = this._personPos(p);
        p.hovered = Math.hypot(mx - pos.x, my - pos.y) < pos.r;
      });
    });

    this.canvas.addEventListener('click', e => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.canvas.width  / rect.width);
      const my = (e.clientY - rect.top)  * (this.canvas.height / rect.height);
      let hit = null;
      for (const p of this.population) {
        const pos = this._personPos(p);
        if (Math.hypot(mx - pos.x, my - pos.y) < pos.r) { hit = p; break; }
      }
      this.selected = hit ? hit.id : null;
      this._updateDetail();
    });
  }

  // ── Simulation step ─────────────────────────────────────────────
  step() {
    const steps = Math.round(this.speed);
    for (let s = 0; s < steps; s++) {
      this.day++;
      this._spread();
      for (const p of this.population) p.update(this.day, this.env);
    }
    this._updateStats();
    if (this.selected !== null) this._updateDetail();
  }

  _spread() {
    const mode = this.env.transmission || 'respiratory';

    if (mode === 'environmental') {
      // Environmental / vector-borne exposure: on days 1–3 expose community members
      // directly, simulating a community-wide event (mold bloom, chemical spill, etc.)
      if (this.day <= 3) {
        const pExpose = Math.min(0.95, 0.55 + this.env.pollution * 0.25);
        for (const p of this.population) {
          if (p.status === STATUS.HEALTHY && Math.random() < pExpose) {
            p.expose(this.day);
          }
        }
      }
      this.flashes = this.flashes.filter(f => f.t-- > 0);
      return;
    }

    if (mode === 'mixed') {
      // Natural disaster: environmental exposure on day 1 + some person-to-person
      if (this.day <= 2) {
        for (const p of this.population) {
          if (p.status === STATUS.HEALTHY && Math.random() < 0.45) p.expose(this.day);
        }
      }
    }

    // Standard person-to-person transmission (respiratory / contact)
    const contagious = this.population.filter(p => p.isContagious);
    if (!contagious.length) { this.flashes = this.flashes.filter(f => f.t-- > 0); return; }
    const pPerContact = (this.env.r0 || 3) / (8 * 11);

    for (const inf of contagious) {
      const neighbors = this._neighbors(inf);
      for (const nb of neighbors) {
        if (nb.status !== STATUS.HEALTHY) continue;
        const pTransmit = pPerContact * (1.5 - nb.immuneFunction * 0.6)
                                       * (1 + this.env.pollution * 0.1);
        if (Math.random() < pTransmit) {
          if (nb.expose(this.day)) {
            const a = this._personPos(inf);
            const b = this._personPos(nb);
            this.flashes.push({ x1:a.x, y1:a.y, x2:b.x, y2:b.y, t:18 });
          }
        }
      }
    }
    this.flashes = this.flashes.filter(f => f.t-- > 0);
  }

  _neighbors(p) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const r = p.row + dr, c = p.col + dc;
        if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS)
          out.push(this.population[r * this.COLS + c]);
      }
    }
    return out;
  }

  // ── Rendering ───────────────────────────────────────────────────
  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#060f16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Transmission flashes
    for (const f of this.flashes) {
      const a = f.t / 18;
      ctx.beginPath();
      ctx.moveTo(f.x1, f.y1);
      ctx.lineTo(f.x2, f.y2);
      ctx.strokeStyle = `rgba(220,100,30,${a * 0.7})`;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    // People
    const t = performance.now() / 1000;
    for (const p of this.population) {
      const pos = this._personPos(p);
      this._drawPerson(p, pos, t);
    }

    // Day label
    ctx.fillStyle = 'rgba(180,210,220,0.55)';
    ctx.font      = `bold ${Math.round(canvas.width * 0.028)}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`Day ${this.day}`, 12, 22);

    // Phase label
    const phase = this.day === 0 ? 'Pre-outbreak' :
                  this.day < 30  ? 'Acute spread' :
                  this.day < 90  ? 'Resolving' :
                  this.day < 180 ? 'Post-viral window' : 'Chronic phase';
    ctx.fillStyle = 'rgba(140,185,200,0.45)';
    ctx.font      = `${Math.round(canvas.width * 0.02)}px Inter, sans-serif`;
    ctx.fillText(phase, 12, 38);
    ctx.textAlign = 'start';
  }

  _drawPerson(p, pos, t) {
    const { ctx } = this;
    const { x, y, r } = pos;
    const pulse = p.isContagious
      ? 1 + Math.sin(t * 4 + p.pulseOffset) * 0.12
      : p.status === STATUS.EXPOSED
      ? 1 + Math.sin(t * 2.5 + p.pulseOffset) * 0.07
      : 1;
    const dr = r * pulse;

    // Viewpoint ring
    if (p.isViewpoint) {
      ctx.beginPath();
      ctx.arc(x, y, dr + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,220,80,0.7)';
      ctx.lineWidth   = 2;
      ctx.stroke();
    }

    // Selection ring
    if (p.id === this.selected) {
      ctx.beginPath();
      ctx.arc(x, y, dr + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,200,255,0.9)';
      ctx.lineWidth   = 2.5;
      ctx.stroke();
    }

    // Hover glow
    if (p.hovered || p.id === this.selected) {
      ctx.beginPath();
      ctx.arc(x, y, dr + 8, 0, Math.PI * 2);
      const [r2, g2, b2] = p._lerpedColor();
      const grd = ctx.createRadialGradient(x, y, dr, x, y, dr + 8);
      grd.addColorStop(0, `rgba(${r2},${g2},${b2},0.3)`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // Main circle
    const [rc, gc, bc] = p._lerpedColor();
    const grd = ctx.createRadialGradient(x - dr*0.3, y - dr*0.3, dr*0.05, x, y, dr);
    grd.addColorStop(0, `rgb(${Math.min(255,rc+55)},${Math.min(255,gc+55)},${Math.min(255,bc+55)})`);
    grd.addColorStop(1, `rgb(${rc},${gc},${bc})`);
    ctx.beginPath();
    ctx.arc(x, y, dr, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // CFS indicator: faint cross marks fatigue
    if (p.hasCFS) {
      const m = dr * 0.45;
      ctx.strokeStyle = 'rgba(255,180,180,0.55)';
      ctx.lineWidth   = 1.2;
      ctx.beginPath(); ctx.moveTo(x-m, y); ctx.lineTo(x+m, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y-m); ctx.lineTo(x, y+m); ctx.stroke();
    }

    // Viewpoint "YOU" label
    if (p.isViewpoint) {
      ctx.fillStyle = 'rgba(255,220,80,0.9)';
      ctx.font      = `bold ${Math.round(r * 0.55)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('YOU', x, y + r + 12);
      ctx.textAlign = 'start';
    }

    // Name tooltip on hover
    if (p.hovered && !p.isViewpoint) {
      ctx.fillStyle = 'rgba(200,225,235,0.85)';
      ctx.font      = `${Math.round(r * 0.5)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.name, x, y - r - 5);
      ctx.textAlign = 'start';
    }
  }

  // ── Stats panel ─────────────────────────────────────────────────
  _updateStats() {
    if (!this.statsEl) return;
    const pop = this.population;
    const count = s => pop.filter(p => p.status === s).length;
    const cfsTotal  = count(STATUS.CFS) + count(STATUS.SEVERE_CFS);
    const infected  = pop.filter(p => p.isInfected).length;
    const resolved  = pop.filter(p => p.status !== STATUS.HEALTHY && !p.isInfected).length;
    const L = this.content?.stats_labels || {};

    const pill = (label, val, color='') =>
      `<div class="stat-pill"><span>${label}</span><span${color ? ` style="color:${color}"` : ''}>${val}</span></div>`;

    this.statsEl.innerHTML =
      pill(L.day      || 'Day',         this.day) +
      pill(L.healthy  || 'Healthy',     count(STATUS.HEALTHY)) +
      pill(L.active   || 'Active',      infected) +
      pill(L.recovered|| 'Recovered',   count(STATUS.RECOVERED)) +
      pill(L.long_covid||'Long COVID',  count(STATUS.LONG_COVID)) +
      pill(L.cfs      || 'ME/CFS',      cfsTotal, '#e05070') +
      pill(L.cfs_rate || 'CFS rate',    resolved > 0 ? ((cfsTotal/resolved*100).toFixed(1)+'%') : '—', '#e05070') +
      pill(L.severe_cfs||'Severe CFS',  count(STATUS.SEVERE_CFS), '#c03050');
  }

  // ── Detail panel ─────────────────────────────────────────────────
  _updateDetail() {
    if (!this.detailEl) return;
    if (this.selected === null) {
      const hint = this.content?.detail?.click_hint || 'Click any person to see their profile.';
      this.detailEl.innerHTML = `<p class="detail-hint">${hint}</p>`;
      return;
    }
    const p = this.population[this.selected];
    const isCFS = p.hasCFS;
    const riskPct = (p.cfsRisk * 100).toFixed(0);

    const bar = (val, color='#3a8fa8') =>
      `<div class="factor-bar-wrap"><div class="factor-bar" style="width:${(val*100).toFixed(0)}%;background:${color}"></div></div>`;

    const symptomBlock = p.symptoms ? `
      <div class="detail-sub">Symptom profile</div>
      ${[
        ['Fatigue / energy envelope', p.symptoms.fatigue],
        ['Post-exertional malaise',   p.symptoms.pem,    '#d44'],
        ['Cognitive / brain fog',     p.symptoms.cognitive],
        ['Autonomic dysregulation',   p.symptoms.autonomic],
        ['Pain',                      p.symptoms.pain],
        ['Sleep disruption',          p.symptoms.sleep],
      ].map(([lbl, val, col='#3a8fa8']) =>
        `<div class="factor-row"><span>${lbl}</span>${bar(val, col)}</div>`
      ).join('')}
      <div id="brainstem-wrap">
        <div class="detail-sub" style="margin-top:14px">Brainstem / ANS disruption</div>
        <canvas id="brainstemCanvas" width="240" height="200"></canvas>
      </div>
    ` : '';

    const narrativeLine = p.isViewpoint
      ? this._viewpointNarrative(p)
      : `<div class="detail-narrative">${this._personNarrative(p)}</div>`;

    this.detailEl.innerHTML = `
      <div class="detail-name ${p.isViewpoint ? 'vp' : ''}">${p.name}</div>
      <div class="detail-status" style="color:${this._statusTextColor(p.status)}">${STATUS_LABEL[p.status]}</div>
      ${narrativeLine}

      ${this._detailGrid(p, isCFS, riskPct)}
      ${this._riskFactorRows(p, bar)}

      ${symptomBlock}
    `;

    // Draw brainstem diagram if applicable
    if (p.symptoms) {
      requestAnimationFrame(() => {
        const bc = document.getElementById('brainstemCanvas');
        if (bc) drawBrainstemDiagram(bc, p.symptoms);
      });
    }
  }

  _detailGrid(p, isCFS, riskPct) {
    const L = this.content?.detail?.labels || {};
    return `<div class="detail-grid">
      <div><span class="detail-label">${L.age||'Age'}</span><span>${p.age}</span></div>
      <div><span class="detail-label">${L.sex||'Sex'}</span><span>${p.sex==='F'?(L.sex_female||'Female'):(L.sex_male||'Male')}</span></div>
      <div><span class="detail-label">${L.prior_ebv||'Prior EBV'}</span><span>${p.priorEBV?(L.ebv_yes||'Yes'):(L.ebv_no||'No')}</span></div>
      <div><span class="detail-label">${L.cfs_risk||'CFS risk'}</span>
        <span style="color:${isCFS?'#e05070':'#7aab8a'}">${p.cfsRisk>0?riskPct+'%':(L.pending||'Pending')}</span></div>
    </div>`;
  }

  _riskFactorRows(p, bar) {
    const L  = this.content?.detail?.labels || {};
    const lb = this.content?.detail?.risk_factor_labels || [];
    const g  = i => lb[i] || '';
    const bool = v => bar(v ? 0.92 : 0.06, v ? '#c05030' : '#3a5a4a');

    const sections = [
      { heading: 'Core', rows: [
        [g(0)||'Genetic susceptibility',     p.susceptibility],
        [g(1)||'Chronic stress / trauma',    p.baselineStress],
        [g(2)||'Pre-existing conditions',    p.priorConditions,  '#9a5030'],
        [g(3)||'Immune function (low)',       1-p.immuneFunction, '#c06030'],
        [g(4)||'Poor sleep quality',         1-p.sleepQuality,   '#c06030'],
        [g(5)||'Economic stress',            p.economicStress,   '#c06030'],
        [g(6)||'Pollution exposure',         p.pollutionExp,     '#8a6030'],
        [g(7)||'Social support (low)',       1-p.socialSupport,  '#8a6030'],
      ]},
      { heading: 'Neurological', rows: [
        [g(8) ||'Neurodivergence',           p.neurodivergence,             '#6a50a0'],
        [g(9) ||'Emotional stress load',     p.emotionalStressLoad,         '#8a5080'],
        [g(10)||'Brainstem load (structural)',p.mechanicalBrainstemLoad,    '#a04060'],
      ]},
      { heading: 'Systemic health', rows: [
        [g(11)||'Digestive health (poor)',   p.digestiveHealth,             '#7a6030'],
        [g(12)||'Metabolic health (poor)',   p.metabolicHealth,             '#8a5020'],
        [g(13)||'Low fitness',               1-(p.generalFitness??0.5),    '#6a7030'],
        [g(14)||'Poor diet quality',         1-(p.dietQuality??0.5),       '#6a6830'],
      ]},
    ];

    let html = '';
    for (const sec of sections) {
      html += `<div class="detail-sub" style="margin-top:6px">${sec.heading}</div>`;
      for (const [lbl, val, col] of sec.rows)
        html += `<div class="factor-row"><span>${lbl}</span>${bar(val, col||'#3a8fa8')}</div>`;
    }

    // Prior infection history as boolean pills
    html += `<div class="detail-sub" style="margin-top:6px">Prior infections</div>`;
    const viralHistory = [
      ['EBV',        p.priorEBV],
      ['HHV-6',      p.priorHHV6],
      ['CMV',        p.priorCMV],
      ['Lyme',       p.priorLyme],
      ['Mycoplasma', p.priorMycoplasma],
    ];
    html += `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">` +
      viralHistory.map(([name, val]) =>
        `<span style="font-size:.72rem;padding:2px 8px;border-radius:999px;
          background:${val ? 'rgba(192,80,48,.25)' : 'rgba(80,80,80,.15)'};
          border:1px solid ${val ? 'rgba(192,80,48,.5)' : 'var(--line)'};
          color:${val ? '#e08060' : 'var(--muted)'}">${name}</span>`
      ).join('') + `</div>`;

    if (p.autonomicAcute > 0) {
      html += `<div class="detail-sub" style="margin-top:6px">${L.acute_factors||'Acute phase markers'}</div>
        <div class="factor-row"><span>${L.autonomic_acute||'Autonomic involvement'}</span>${bar(p.autonomicAcute,'#c03060')}</div>
        <div class="factor-row"><span>${L.illness_severity||'Illness severity'}</span>${bar(p.illnessSeverity,'#a04020')}</div>`;
    }
    return html;
  }

  _statusTextColor(status) {
    const [r,g,b] = STATUS_RGB[status];
    return `rgb(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)})`;
  }

  _personNarrative(p) {
    const narr = this.content?.narratives?.generic;
    if (narr?.[p.status]) return narr[p.status].replace(/\{name\}/g, p.name);
    // Fallback if content not loaded
    const fb = {
      healthy: `${p.name} has not yet been exposed.`,
      exposed: `${p.name} was recently exposed.`,
      infectious: `${p.name} is in the acute phase and currently infectious.`,
      recovering: `${p.name} is past the acute phase.`,
      recovered: `${p.name} recovered fully.`,
      long_covid: `${p.name} has persistent post-viral symptoms.`,
      cfs: `${p.name} has developed ME/CFS.`,
      severe_cfs: `${p.name} has severe ME/CFS.`,
    };
    return fb[p.status] || '';
  }

  _viewpointNarrative(p) {
    const narr = this.content?.narratives?.viewpoint;
    const text = narr?.[p.status] || '';
    return `<div class="detail-narrative vp-narrative">${text}</div>`;
  }

  // ── Public API ──────────────────────────────────────────────────
  play()  { this.running = true; }
  pause() { this.running = false; }
  reset() { this._init(); }

  setEnv(key, val) {
    this.env[key] = +val;
    for (const p of this.population) {
      if (p.isInfected && p.illnessSeverity > 0)
        p.cfsRisk = p._computeCFSRisk(p.illnessSeverity, this.env);
    }
  }

  // Apply a full outbreak preset (from the outbreak selector)
  setOutbreak(ob) {
    this.env.r0              = ob.r0 ?? 3.0;
    this.env.pathogenSeverity= ob.pathogenSeverity ?? 0.5;
    this.env.transmission    = ob.transmission ?? 'respiratory';
    this._init(); // reset population with new parameters
  }

  // Update viewpoint character's parameters in real time
  updateViewpointParam(key, val) {
    const vp = this.population.find(p => p.isViewpoint);
    if (!vp) return;
    const boolKeys = ['priorEBV','priorHHV6','priorCMV','priorLyme','priorMycoplasma'];
    if (key === 'sex')           vp.sex = val;
    else if (key === 'age')      vp.age = Math.round(+val);
    else if (boolKeys.includes(key)) vp[key] = val; // already boolean from render
    else                         vp[key] = +val;
    if (vp.cfsRisk > 0) vp.cfsRisk = vp._computeCFSRisk(vp.illnessSeverity || 0.5, this.env);
    this._updateDetail();
  }

  getViewpointParams() {
    const vp = this.population.find(p => p.isViewpoint);
    if (!vp) return null;
    return {
      age: vp.age, sex: vp.sex,
      baselineStress: vp.baselineStress, sleepQuality: vp.sleepQuality,
      immuneFunction: vp.immuneFunction, susceptibility: vp.susceptibility,
      priorConditions: vp.priorConditions, economicStress: vp.economicStress,
      socialSupport: vp.socialSupport,
      neurodivergence: vp.neurodivergence, emotionalStressLoad: vp.emotionalStressLoad,
      mechanicalBrainstemLoad: vp.mechanicalBrainstemLoad,
      digestiveHealth: vp.digestiveHealth, metabolicHealth: vp.metabolicHealth,
      generalFitness: vp.generalFitness, dietQuality: vp.dietQuality,
      moldExposure: vp.moldExposure, chemicalExposure: vp.chemicalExposure,
      pollutionExp: vp.pollutionExp,
      priorEBV: vp.priorEBV, priorHHV6: vp.priorHHV6,
      priorCMV: vp.priorCMV, priorLyme: vp.priorLyme, priorMycoplasma: vp.priorMycoplasma,
    };
  }

  randomiseViewpoint() {
    const vp = this.population.find(p => p.isViewpoint);
    if (!vp) return;
    // Core
    vp.susceptibility          = Math.random();
    vp.baselineStress          = Math.random();
    vp.sleepQuality            = Math.random();
    vp.immuneFunction          = 0.25 + Math.random() * 0.65;
    vp.economicStress          = Math.random();
    vp.socialSupport           = Math.random();
    vp.priorConditions         = Math.random() < 0.35 ? Math.random() : Math.random() * 0.35;
    vp.age                     = 18 + Math.floor(Math.random() * 57);
    vp.sex                     = Math.random() < 0.5 ? 'F' : 'M';
    // Neurological
    vp.neurodivergence         = Math.random() < 0.18 ? 0.35 + Math.random() * 0.65 : Math.random() * 0.2;
    vp.emotionalStressLoad     = Math.random();
    vp.mechanicalBrainstemLoad = Math.random() < 0.07 ? 0.4 + Math.random() * 0.6 : Math.random() * 0.12;
    // Systemic
    vp.digestiveHealth         = Math.random() < 0.20 ? 0.4 + Math.random() * 0.6 : Math.random() * 0.4;
    vp.metabolicHealth         = Math.random() < 0.25 ? 0.4 + Math.random() * 0.6 : Math.random() * 0.4;
    vp.generalFitness          = Math.random();
    vp.dietQuality             = Math.random();
    vp.moldExposure            = Math.random() < 0.12 ? 0.3 + Math.random() * 0.6 : Math.random() * 0.15;
    vp.chemicalExposure        = Math.random() < 0.10 ? 0.3 + Math.random() * 0.6 : Math.random() * 0.12;
    vp.pollutionExp            = Math.random();
    // Prior infections
    vp.priorEBV                = Math.random() < 0.90;
    vp.priorHHV6               = Math.random() < 0.95;
    vp.priorCMV                = Math.random() < 0.60;
    vp.priorLyme               = Math.random() < 0.08;
    vp.priorMycoplasma         = Math.random() < 0.30;
    this._updateDetail();
  }

  resize(w, h) {
    this.canvas.width  = w;
    this.canvas.height = h;
    this.draw();
  }

  get isRunning() { return this.running; }
}

// ─── Brainstem Diagram ──────────────────────────────────────────────────────────
// Draws a simplified anatomical diagram showing ME/CFS nervous system disruption.
// Based on the dorsal vagal / allostatic disruption hypothesis (Porges, Naviaux, VanElzakker).
function drawBrainstemDiagram(canvas, symptoms) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(10,20,30,0.0)';
  ctx.fillRect(0, 0, W, H);

  // Helper: node circle
  const node = (x, y, r, activation, label, sublabel='') => {
    // activation: 0=normal(teal), >0=hyperactive(red), <0=hypoactive(blue)
    const col = activation > 0.3
      ? `rgba(${Math.round(180 + activation*60)},${Math.round(40-activation*20)},40,0.9)`
      : activation < -0.3
      ? `rgba(40,80,${Math.round(160+(-activation)*80)},0.9)`
      : `rgba(40,120,140,0.85)`;
    const grd = ctx.createRadialGradient(x-r*0.3, y-r*0.3, r*0.05, x, y, r);
    grd.addColorStop(0, col.replace('0.9', '1').replace('0.85','1'));
    grd.addColorStop(1, col);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = grd; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `bold ${Math.round(r*0.55)}px Inter,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x, sublabel ? y-3 : y);
    if (sublabel) {
      ctx.font = `${Math.round(r*0.42)}px Inter,sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(sublabel, x, y+9);
    }
    ctx.textBaseline = 'alphabetic';
  };

  // Helper: connection line
  const conn = (x1,y1,x2,y2, disrupted=false, alpha=0.4) => {
    ctx.beginPath();
    ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.strokeStyle = `rgba(140,180,190,${alpha})`;
    ctx.lineWidth   = disrupted ? 1 : 1.5;
    ctx.setLineDash(disrupted ? [3,4] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const s = symptoms;
  // Map symptom scores → activation values
  // positive = hyperactivated, negative = hypoactivated
  const dvcAct   =  s.brainstem * 0.9;    // DVC: hyperactivated (shutdown)
  const hpaAct   = -s.hpa * 0.8;          // HPA: blunted/hypoactivated
  const lcAct    =  s.autonomic * 0.5;    // LC: dysregulated
  const ntsAct   =  s.brainstem * 0.6;    // NTS: disrupted input
  const vagalAct =  s.vagal * 0.7;        // Vagus: dysregulated

  // Layout positions
  const cx = W / 2;
  const hypoY = 28, brainstemY = 82, midY = 120, lowY = 158, bodyY = 192;

  // Connections first (behind nodes)
  conn(cx,      hypoY+14,  cx,      brainstemY-14,  s.hpa > 0.4,    0.35); // HPA → brainstem
  conn(cx-28,   brainstemY+12, cx-35, midY-10,       s.brainstem>0.4, 0.4);
  conn(cx+5,    brainstemY+12, cx+5,  midY-10,        s.brainstem>0.3, 0.4);
  conn(cx+35,   brainstemY+12, cx+40, midY-10,        s.autonomic>0.3, 0.4);
  conn(cx-35,   midY+10,    cx-35,  lowY-10,         s.vagal>0.4,     0.4); // DVC → vagus
  conn(cx-35,   lowY+12,    cx-15,  bodyY-4,         s.vagal>0.5,     0.35);
  conn(cx+40,   midY+10,    cx+40,  lowY-10,         s.autonomic>0.4, 0.35);

  // Nodes
  node(cx,    hypoY,       22, hpaAct,   'HPA', 'cortisol');
  node(cx,    brainstemY,  22, (dvcAct+lcAct)/2*0.5, 'BStem', 'core');
  node(cx-35, midY,        16, ntsAct,   'NTS');
  node(cx+5,  midY,        16, dvcAct,   'DVC');    // dorsal vagal complex
  node(cx+40, midY,        16, lcAct,    'LC');     // locus coeruleus
  node(cx-35, lowY,        14, vagalAct, 'Vagus');

  // Body endpoint
  ctx.beginPath(); ctx.arc(cx-15, bodyY, 10, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(30,50,60,0.7)'; ctx.fill();
  ctx.fillStyle = 'rgba(120,160,170,0.6)';
  ctx.font = '9px Inter,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('Body', cx-15, bodyY);
  ctx.textBaseline='alphabetic';

  // Legend
  const legend = [
    ['Hyperactive', 'rgba(220,60,60,0.8)'],
    ['Normal',      'rgba(40,120,140,0.8)'],
    ['Blunted',     'rgba(60,100,200,0.8)'],
  ];
  legend.forEach(([lbl, col], i) => {
    ctx.fillStyle = col;
    ctx.fillRect(4, H - 14 - i*14, 8, 8);
    ctx.fillStyle = 'rgba(180,200,210,0.7)';
    ctx.font = '9px Inter,sans-serif'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(lbl, 16, H - 7 - i*14);
  });
  ctx.textAlign='start';
}
