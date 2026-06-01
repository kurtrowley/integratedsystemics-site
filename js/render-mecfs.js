// Renders sims.html dynamic content from content/mecfs-sim.json.
// Edit content/mecfs-sim.json to change all page text.

export async function loadSimContent() {
  const resp = await fetch('./content/mecfs-sim.json');
  return await resp.json();
}

export function renderSimPage(c, simRef) {
  document.title = c.page.title;
  document.querySelectorAll('[data-slot="brand"]').forEach(el => el.textContent = c.site.brand);
  document.querySelectorAll('[data-slot="brand-short"]').forEach(el => el.textContent = c.site.brand_short);
  document.querySelectorAll('[data-slot="breadcrumb"]').forEach(el => el.textContent = c.page.breadcrumb);

  const hint = document.getElementById('toolbarHint');
  if (hint) hint.textContent = c.toolbar.hint;

  renderLegend(c);
  renderOutbreaks(c, simRef);
  renderEnvironment(c, simRef);
  renderYouProfile(c, simRef);
  renderAbout(c);
}

// ── Legend ────────────────────────────────────────────────────────────────
function renderLegend(c) {
  const el = document.getElementById('legendEl');
  if (!el) return;
  el.innerHTML = '<div class="legend-hdr">Status key</div>';
  c.legend.forEach(item => {
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `<div class="legend-dot" style="background:${item.color}"></div>${item.label}`;
    el.appendChild(row);
  });
}

// ── Outbreak selector ────────────────────────────────────────────────────
function renderOutbreaks(c, simRef) {
  const wrap = document.getElementById('outbreakGrid');
  if (!wrap || !c.outbreaks) return;
  wrap.innerHTML = '';

  const CATEGORY_COLOR = {
    'Respiratory virus': '#2a5a6a',
    'Viral':             '#2a4a6a',
    'Viral (vector)':    '#2a3a5a',
    'Bacterial':         '#4a3a2a',
    'Bacterial (tick)':  '#4a4a2a',
    'Environmental':     '#2a4a3a',
    'Environmental (mixed)': '#3a4a3a',
  };

  c.outbreaks.forEach((ob, idx) => {
    const card = document.createElement('div');
    card.className = 'outbreak-card' + (idx === 0 ? ' active' : '');
    card.dataset.id = ob.id;
    const catColor = CATEGORY_COLOR[ob.category] || '#2a3a4a';
    card.innerHTML = `
      <div class="ob-label">${ob.label}</div>
      <div class="ob-cat" style="background:${catColor}">${ob.category}</div>
      <div class="ob-desc">${ob.desc}</div>`;
    card.addEventListener('click', () => {
      wrap.querySelectorAll('.outbreak-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      if (simRef?.current) simRef.current.setOutbreak(ob);
    });
    wrap.appendChild(card);
  });

  // Apply default outbreak on next tick (after sim is ready)
  if (c.outbreaks[0]) {
    setTimeout(() => simRef?.current?.setOutbreak(c.outbreaks[0]), 100);
  }
}

// ── Environment stressors ────────────────────────────────────────────────
function renderEnvironment(c, simRef) {
  const wrap = document.getElementById('envControls');
  if (!wrap) return;
  wrap.innerHTML = `<div class="env-section"><h4>${c.environment.stressors_section}</h4></div>`;
  const sec = wrap.querySelector('.env-section');

  c.environment.controls.forEach(ctrl => {
    const row = document.createElement('div');
    row.className = 'env-row';
    row.innerHTML = `
      <label>${ctrl.label} <span id="v-${ctrl.key}">${ctrl.default}</span></label>
      <input type="range" data-env="${ctrl.key}"
             min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${ctrl.default}" />`;
    sec.appendChild(row);
  });

  const note = document.createElement('p');
  note.style.cssText = 'font-size:.78rem;color:var(--muted);margin-top:12px;line-height:1.5';
  note.textContent = c.environment.footer_note;
  wrap.appendChild(note);
}

// ── YOU profile ───────────────────────────────────────────────────────────
export function renderYouProfile(c, simRef) {
  const wrap = document.getElementById('youProfileBody');
  if (!wrap || !c.you_profile) return;

  const prof = c.you_profile;
  wrap.innerHTML = `<p class="you-desc">${prof.description}</p>`;

  prof.fields.forEach(field => {
    if (field.type === 'section_header') {
      const hdr = document.createElement('div');
      hdr.className = 'you-section-hdr';
      hdr.textContent = field.label;
      wrap.appendChild(hdr);
      return;
    }

    const row = document.createElement('div');
    row.className = 'env-row';

    if (field.type === 'range') {
      const dispVal = field.key === 'age' ? field.default : (+field.default).toFixed(2);
      row.innerHTML = `
        <label>${field.label} <span id="yv-${field.key}">${dispVal}</span></label>
        <input type="range" data-you="${field.key}"
               min="${field.min}" max="${field.max}" step="${field.step || 0.05}"
               value="${field.default}" />
        ${field.note ? `<div class="you-note">${field.note}</div>` : ''}`;
    } else if (field.type === 'toggle') {
      const opts = field.options;
      const first = field.default === opts[0] || field.default === true;
      row.innerHTML = `
        <label>${field.label}</label>
        <div class="you-toggle" data-you="${field.key}">
          <button class="you-opt ${first ? 'active' : ''}" data-val="${opts[0]}">${opts[0]}</button>
          <button class="you-opt ${!first ? 'active' : ''}" data-val="${opts[1]}">${opts[1]}</button>
        </div>
        ${field.note ? `<div class="you-note">${field.note}</div>` : ''}`;
    }
    wrap.appendChild(row);
  });

  // Reset button
  const resetBtn = document.createElement('button');
  resetBtn.className = 'tb-btn';
  resetBtn.style.marginTop = '12px';
  resetBtn.textContent = prof.reset_label || 'Randomise';
  resetBtn.addEventListener('click', () => {
    if (simRef?.current) simRef.current.randomiseViewpoint();
    refreshYouDisplay(c, simRef);
  });
  wrap.appendChild(resetBtn);

  // Wire inputs
  wrap.querySelectorAll('input[data-you]').forEach(inp => {
    inp.addEventListener('input', () => {
      const key = inp.dataset.you;
      const val = +inp.value;
      const disp = document.getElementById('yv-' + key);
      if (disp) disp.textContent = key === 'age' ? val : val.toFixed(2);
      if (simRef?.current) simRef.current.updateViewpointParam(key, val);
    });
  });

  wrap.querySelectorAll('.you-toggle').forEach(tog => {
    tog.querySelectorAll('.you-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        tog.querySelectorAll('.you-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const key    = tog.dataset.you;
        const rawVal = btn.dataset.val;
        const boolKeys = ['priorEBV','priorHHV6','priorCMV','priorLyme','priorMycoplasma'];
        let val;
        if (rawVal === 'Female') val = 'F';
        else if (rawVal === 'Male') val = 'M';
        else if (boolKeys.includes(key)) val = rawVal === 'Yes';
        else val = rawVal;
        if (simRef?.current) simRef.current.updateViewpointParam(key, val);
      });
    });
  });
}

function refreshYouDisplay(c, simRef) {
  const vp = simRef?.current?.getViewpointParams();
  if (!vp) return;
  c.you_profile.fields.forEach(field => {
    if (field.type === 'range') {
      const inp = document.querySelector(`input[data-you="${field.key}"]`);
      const disp = document.getElementById('yv-' + field.key);
      if (inp && vp[field.key] !== undefined) {
        inp.value = vp[field.key];
        if (disp) disp.textContent = field.key === 'age' ? vp[field.key] : (+vp[field.key]).toFixed(2);
      }
    } else if (field.type === 'toggle') {
      const tog = document.querySelector(`.you-toggle[data-you="${field.key}"]`);
      if (tog) {
        const val = vp[field.key];
        tog.querySelectorAll('.you-opt').forEach(btn => {
          const match = (val === true && btn.dataset.val === 'Yes') ||
                        (val === false && btn.dataset.val === 'No') ||
                        (val === 'F' && btn.dataset.val === 'Female') ||
                        (val === 'M' && btn.dataset.val === 'Male');
          btn.classList.toggle('active', match);
        });
      }
    }
  });
}

// ── About tab ────────────────────────────────────────────────────────────
function renderAbout(c) {
  const el = document.getElementById('aboutBody');
  if (!el || !c.about) return;
  el.innerHTML = `<h3 style="margin-top:0">${c.about.heading}</h3>`;
  c.about.sections.forEach(sec => {
    const h = document.createElement('h3');
    h.textContent = sec.heading;
    el.appendChild(h);
    if (sec.list) {
      const ul = document.createElement('ul');
      sec.list.forEach(item => {
        const li = document.createElement('li'); li.textContent = item; ul.appendChild(li);
      });
      el.appendChild(ul);
    }
    if (sec.body) {
      const p = document.createElement('p');
      p.innerHTML = sec.body;
      if (sec.style) p.className = sec.style;
      el.appendChild(p);
    }
    if (sec.detail) {
      const p2 = document.createElement('p'); p2.textContent = sec.detail; el.appendChild(p2);
    }
  });
}

export function getNarrative(c, status, name, isViewpoint) {
  const tmpl = isViewpoint
    ? c.narratives.viewpoint[status]
    : c.narratives.generic[status];
  return (tmpl || '').replace(/\{name\}/g, name);
}
