// Renders sims.html dynamic content from content/mecfs-sim.json.
// Edit content/mecfs-sim.json to change all page text.

export async function loadSimContent() {
  const resp = await fetch('./content/mecfs-sim.json');
  return await resp.json();
}

export function renderSimPage(c) {
  // Title / brand
  document.title = c.page.title;
  document.querySelectorAll('[data-slot="brand"]').forEach(el => el.textContent = c.site.brand);
  document.querySelectorAll('[data-slot="brand-short"]').forEach(el => el.textContent = c.site.brand_short);
  document.querySelectorAll('[data-slot="breadcrumb"]').forEach(el => el.textContent = c.page.breadcrumb);

  // Toolbar hint
  const hint = document.getElementById('toolbarHint');
  if (hint) hint.textContent = c.toolbar.hint;

  // Legend
  const legendEl = document.getElementById('legendEl');
  if (legendEl) {
    const hdr = legendEl.querySelector('div');
    legendEl.innerHTML = '';
    if (hdr) legendEl.appendChild(hdr);
    else {
      const h = document.createElement('div');
      h.style.cssText = 'font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:4px';
      h.textContent = 'Status key';
      legendEl.appendChild(h);
    }
    c.legend.forEach(item => {
      const row = document.createElement('div');
      row.className = 'legend-row';
      row.innerHTML = `<div class="legend-dot" style="background:${item.color}"></div>${item.label}`;
      legendEl.appendChild(row);
    });
  }

  // Environment controls
  const virusSection = document.getElementById('envVirusSection');
  const stressorSection = document.getElementById('envStressorSection');
  const envFooter = document.getElementById('envFooterNote');

  if (virusSection)   virusSection.querySelector('h4').textContent   = c.environment.virus_section;
  if (stressorSection) stressorSection.querySelector('h4').textContent = c.environment.stressors_section;
  if (envFooter) envFooter.textContent = c.environment.footer_note;

  const envBody = document.getElementById('envControls');
  if (envBody) {
    // Clear existing inputs and rebuild from JSON
    envBody.innerHTML = '';
    const virusDiv = document.createElement('div');
    virusDiv.className = 'env-section';
    virusDiv.innerHTML = `<h4>${c.environment.virus_section}</h4>`;
    const stressDiv = document.createElement('div');
    stressDiv.className = 'env-section';
    stressDiv.style.marginTop = '12px';
    stressDiv.innerHTML = `<h4>${c.environment.stressors_section}</h4>`;

    // Build a section map from the controls
    const sections = {};
    c.environment.controls.forEach(ctrl => {
      const sec = ctrl.section;
      if (!sections[sec]) {
        let div;
        if (sec === 'virus')    div = virusDiv;
        else if (sec === 'pathogen') {
          div = document.createElement('div');
          div.className = 'env-section';
          div.style.marginTop = '12px';
          div.innerHTML = `<h4>${c.environment.pathogen_section || 'Pathogen type'}</h4>`;
        }
        else {
          div = stressDiv;
        }
        sections[sec] = div;
      }
      const row = document.createElement('div');
      row.className = 'env-row';
      row.innerHTML = `
        <label>${ctrl.label} <span id="v-${ctrl.key}">${ctrl.default}</span></label>
        <input type="range" data-env="${ctrl.key}"
               min="${ctrl.min}" max="${ctrl.max}"
               step="${ctrl.step}" value="${ctrl.default}" />
        ${ctrl.note ? `<div style="font-size:.72rem;color:var(--muted);margin-top:2px;opacity:.7">${ctrl.note}</div>` : ''}`;
      sections[sec].appendChild(row);
    });
    // Append sections in order: virus, pathogen (if any), stressors
    envBody.appendChild(virusDiv);
    if (sections.pathogen) envBody.appendChild(sections.pathogen);
    envBody.appendChild(stressDiv);

    const note = document.createElement('p');
    note.style.cssText = 'font-size:.78rem;color:var(--muted);margin-top:12px;line-height:1.5';
    note.textContent = c.environment.footer_note;
    envBody.appendChild(note);
  }

  // About tab
  const aboutBody = document.getElementById('aboutBody');
  if (aboutBody && c.about) {
    aboutBody.innerHTML = `<h3 style="margin-top:0">${c.about.heading}</h3>`;
    c.about.sections.forEach(sec => {
      const h = document.createElement('h3');
      h.textContent = sec.heading;
      aboutBody.appendChild(h);
      if (sec.list) {
        const ul = document.createElement('ul');
        sec.list.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        });
        aboutBody.appendChild(ul);
      }
      if (sec.body) {
        const p = document.createElement('p');
        p.innerHTML = sec.body;
        if (sec.style) p.className = sec.style;
        aboutBody.appendChild(p);
      }
      if (sec.detail) {
        const p2 = document.createElement('p');
        p2.textContent = sec.detail;
        aboutBody.appendChild(p2);
      }
    });
  }
}

// Returns narrative text for a person given their status and whether they are the viewpoint char.
export function getNarrative(c, status, name, isViewpoint) {
  const template = isViewpoint
    ? c.narratives.viewpoint[status]
    : c.narratives.generic[status];
  return (template || '').replace(/\{name\}/g, name);
}
