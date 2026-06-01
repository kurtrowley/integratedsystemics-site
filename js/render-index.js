// Renders index.html from content/index.json.
// Edit content/index.json to change all page text — do not edit index.html directly.

const e = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls)  el.className   = cls;
  if (html) el.innerHTML   = html;
  return el;
};
const txt = (tag, cls, text) => {
  const el = document.createElement(tag);
  if (cls)  el.className   = cls;
  el.textContent = text;
  return el;
};

function renderBrand(c) {
  document.querySelectorAll('[data-slot="brand"]').forEach(el => el.textContent = c.site.brand);
  document.title = c.site.brand;
}

function renderNav(c) {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  // Preserve any non-link children (e.g. the theme toggle button)
  const preserved = [...nav.children].filter(el => el.tagName !== 'A');
  nav.innerHTML = '';
  c.nav.forEach(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    nav.appendChild(a);
  });
  preserved.forEach(el => nav.appendChild(el));
}

function renderHero(c) {
  const h = c.hero;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setH = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

  set('heroEyebrow', h.eyebrow);
  set('heroHeadline', h.headline);
  set('heroLede', h.lede);

  const pa = document.getElementById('heroCTAPrimary');
  if (pa) { pa.textContent = h.cta_primary.text; pa.href = h.cta_primary.href; }
  const sa = document.getElementById('heroCTASecondary');
  if (sa) { sa.textContent = h.cta_secondary.text; sa.href = h.cta_secondary.href; }

  set('heroAsideKicker',  h.aside_kicker);
  set('heroAsideSummary', h.aside_summary);

  const statsEl = document.getElementById('heroStats');
  if (statsEl) {
    statsEl.innerHTML = '';
    h.aside_stats.forEach(s => {
      const d = document.createElement('div');
      d.className = 'stat';
      d.innerHTML = `<strong>${s.label}</strong><span>${s.body}</span>`;
      statsEl.appendChild(d);
    });
  }
}

function renderSection(sec, el) {
  const hEl = el.querySelector('[data-slot="section-heading"]');
  const bEl = el.querySelector('[data-slot="section-body"]');
  if (hEl) hEl.textContent = sec.heading;
  if (bEl) bEl.textContent = sec.body;

  if (sec.type === 'cards' || sec.type === 'steps') {
    const grid = el.querySelector('[data-slot="grid"]');
    if (!grid) return;
    grid.innerHTML = '';
    if (sec.type === 'cards') {
      grid.className = 'grid three-up';
      sec.items.forEach(item =>
        grid.appendChild(e('article', 'card', `<h3>${item.heading}</h3><p>${item.body}</p>`)));
    } else {
      grid.className = 'grid four-up';
      sec.items.forEach(item =>
        grid.appendChild(e('article', 'step',
          `<span>${item.number}</span><h3>${item.heading}</h3><p>${item.body}</p>`)));
    }
  }

  if (sec.type === 'sim') {
    const link = el.querySelector('[data-slot="sim-link"]');
    if (link && sec.featured_link) {
      link.textContent = sec.featured_link.text;
      link.href        = sec.featured_link.href;
    }
    const tabs = el.querySelectorAll('.sim-tab');
    if (sec.sims) {
      sec.sims.forEach((sim, i) => {
        if (tabs[i]) { tabs[i].dataset.sim = sim.id; tabs[i].textContent = sim.label; }
      });
    }
  }
}

function renderSections(c) {
  c.sections.forEach(sec => {
    const el = document.getElementById(sec.id);
    if (!el) return;
    renderSection(sec, el);
  });
}

function renderFooter(c) {
  const f = c.footer;
  const brand = document.getElementById('footerBrand');
  const tag   = document.getElementById('footerTagline');
  if (brand) brand.textContent = f.brand;
  if (tag)   tag.textContent   = f.tagline;
}

export async function renderIndex() {
  const resp = await fetch('./content/index.json');
  const c    = await resp.json();
  renderBrand(c);
  renderNav(c);
  renderHero(c);
  renderSections(c);
  renderFooter(c);
}
