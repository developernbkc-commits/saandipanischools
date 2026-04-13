const DEFAULT_PAGES = [
  { title: 'Home', url: '/', section: 'home', description: 'Main brand entry point' },
  { title: 'About', url: '/about/', section: 'about', description: 'Vision, leadership, and governance' },
  { title: 'Montessori', url: '/montessori/', section: 'montessori', description: 'Maria Montessori at the core' },
  { title: 'Programs', url: '/programs/', section: 'programs', description: 'Program pathways and age fit' },
  { title: 'Admissions', url: '/admissions/', section: 'admissions', description: 'Admissions journey' },
  { title: 'Campus', url: '/campus/', section: 'campus', description: 'Poranki, Vijayawada story' },
  { title: 'Families', url: '/families/', section: 'families', description: 'School-home partnership' },
  { title: 'Journal', url: '/journal/', section: 'journal', description: 'Articles and Montessori guidance' },
  { title: 'Contact', url: '/contact/', section: 'contact', description: 'Phone, email, and enquiry routes' },
  { title: 'Sitemap', url: '/sitemap/', section: 'sitemap', description: 'Complete site map' }
];

const SECTION_COLORS = {
  home: '#0fb5ae',
  about: '#d8ab34',
  montessori: '#0fb5ae',
  programs: '#ff8f70',
  admissions: '#ff8f70',
  campus: '#0fb5ae',
  families: '#6b6ce4',
  journal: '#d8ab34',
  contact: '#0c2346',
  sitemap: '#6b6ce4',
  misc: '#0c2346'
};

let SEARCH_INDEX = DEFAULT_PAGES;

function normalizeInternalHref(href) {
  if (!href) return null;
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return null;
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    let path = url.pathname;
    if (!path.endsWith('/') && !path.endsWith('.html')) path += '/';
    return path;
  } catch {
    return null;
  }
}

function currentPath() {
  return normalizeInternalHref(window.location.pathname) || '/';
}

function setBodyRouteData() {
  const path = currentPath();
  const parts = path.split('/').filter(Boolean);
  const section = parts[0] || 'home';
  document.body.dataset.section = section;
  document.body.dataset.depth = String(parts.length);
}

function initMenu() {
  const header = document.querySelector('header.site-header');
  const button = document.querySelector('[data-menu-button]');
  if (!header || !button) return;
  button.addEventListener('click', () => {
    const open = !header.classList.contains('open');
    header.classList.toggle('open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

function initScrollStates() {
  const header = document.querySelector('header.site-header');
  let progress = document.querySelector('.scroll-progress');
  if (!progress) {
    progress = document.createElement('div');
    progress.className = 'scroll-progress';
    document.body.appendChild(progress);
  }
  const update = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
    progress.style.width = `${pct}%`;
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

function initFaq() {
  document.querySelectorAll('.faq-item button').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = item.classList.contains('open');
      item.classList.toggle('open', !open);
      btn.setAttribute('aria-expanded', !open ? 'true' : 'false');
      const mark = btn.querySelector('span:last-child');
      if (mark) mark.textContent = !open ? '+' : '+';
    });
  });
}

async function loadSearchIndex() {
  try {
    const response = await fetch('/assets/data/search-index.json');
    if (!response.ok) throw new Error('Search index unavailable');
    const data = await response.json();
    if (Array.isArray(data) && data.length) SEARCH_INDEX = data;
  } catch {
    SEARCH_INDEX = DEFAULT_PAGES;
  }
}

function injectSearchButtons(openSearch) {
  const desktopNav = document.querySelector('.desktop-nav');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const createButton = (mobile = false) => {
    const btn = document.createElement(mobile ? 'button' : 'button');
    btn.type = 'button';
    btn.className = 'nav-search';
    btn.innerHTML = mobile
      ? '<span>Search the site</span><span class="search-kbd">⌘K</span>'
      : '<span>Search</span><span class="search-kbd">⌘K</span>';
    btn.addEventListener('click', openSearch);
    return btn;
  };

  if (desktopNav && !desktopNav.querySelector('.nav-search')) {
    const btn = createButton(false);
    const cta = desktopNav.querySelector('.cta-nav');
    if (cta) desktopNav.insertBefore(btn, cta);
    else desktopNav.appendChild(btn);
  }
  if (mobileDrawer && !mobileDrawer.querySelector('.nav-search')) {
    mobileDrawer.appendChild(createButton(true));
  }
}

function buildSearchModal() {
  const modal = document.createElement('div');
  modal.className = 'search-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <button class="search-backdrop" aria-label="Close search"></button>
    <div class="search-dialog" role="dialog" aria-modal="true" aria-label="Search the Saandipani website">
      <div class="search-head">
        <div class="search-title">
          <strong>Search the Saandipani website</strong>
          <span>Fast access to Montessori, admissions, campus, family guidance, and deep pages.</span>
        </div>
        <button class="search-close" type="button" aria-label="Close search">×</button>
      </div>
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"></circle><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>
        <input type="text" placeholder="Search Montessori, admissions, family FAQ, Poranki campus…" aria-label="Search site">
        <div class="search-shortcuts">Press Esc to close</div>
      </div>
      <div class="search-results"></div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function scoreEntry(entry, query) {
  if (!query) return 1;
  const haystack = [entry.title, entry.heading, entry.description, entry.section, ...(entry.keywords || [])]
    .join(' ')
    .toLowerCase();
  const q = query.toLowerCase().trim();
  if (!haystack.includes(q)) return 0;
  let score = 1;
  if ((entry.title || '').toLowerCase().includes(q)) score += 6;
  if ((entry.heading || '').toLowerCase().includes(q)) score += 4;
  if ((entry.section || '').toLowerCase().includes(q)) score += 2;
  const tokens = q.split(/\s+/).filter(Boolean);
  tokens.forEach(token => {
    if (haystack.includes(token)) score += 1;
  });
  if (entry.url === currentPath()) score -= 1;
  return score;
}

function initSearch() {
  const modal = buildSearchModal();
  const input = modal.querySelector('input');
  const results = modal.querySelector('.search-results');
  const open = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 30);
    renderResults(input.value);
  };
  const close = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  injectSearchButtons(open);

  const renderResults = (query = '') => {
    const entries = SEARCH_INDEX
      .map(entry => ({ entry, score: scoreEntry(entry, query) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, query ? 10 : 8)
      .map(item => item.entry);

    if (!entries.length) {
      results.innerHTML = '<div class="search-empty">No pages matched that search yet. Try Montessori, admissions, families, campus, or parent guide.</div>';
      return;
    }

    results.innerHTML = entries.map(entry => `
      <a class="search-item" href="${entry.url}">
        <div class="search-meta">
          <span class="search-chip">${entry.section || 'page'}</span>
          <span class="micro">${entry.url}</span>
        </div>
        <strong>${entry.heading || entry.title}</strong>
        <p>${entry.description || 'Explore this section of the Saandipani website.'}</p>
      </a>
    `).join('');
  };

  modal.querySelector('.search-backdrop').addEventListener('click', close);
  modal.querySelector('.search-close').addEventListener('click', close);
  input.addEventListener('input', () => renderResults(input.value));
  modal.addEventListener('click', event => {
    const item = event.target.closest('.search-item');
    if (item) close();
  });

  window.addEventListener('keydown', event => {
    const isMeta = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
    const isSlash = event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (isMeta || isSlash) {
      event.preventDefault();
      open();
    }
    if (event.key === 'Escape' && modal.classList.contains('open')) close();
  });
}

function collectGraphData() {
  const current = {
    id: currentPath(),
    url: currentPath(),
    label: (document.querySelector('h1')?.textContent || document.title || 'Saandipani').trim().replace(/\s+/g, ' '),
    section: document.body.dataset.section || 'home',
    current: true
  };

  const map = new Map([[current.id, current]]);
  const selectors = [
    '.breadcrumbs a[href^="/"]',
    '.hero-actions a[href^="/"]',
    '.section-nav a[href^="/"]',
    '.related-links a[href^="/"]',
    '.desktop-nav a[href^="/"]',
    '.band a[href^="/"]',
    '.footer-col a[href^="/"]'
  ];

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach(anchor => {
      const url = normalizeInternalHref(anchor.getAttribute('href'));
      if (!url || map.has(url) || map.size >= 11) return;
      const label = (anchor.querySelector('strong')?.textContent || anchor.textContent || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 32);
      if (!label) return;
      const section = url.split('/').filter(Boolean)[0] || 'home';
      map.set(url, { id: url, url, label, section, current: false });
    });
    if (map.size >= 11) break;
  }

  DEFAULT_PAGES.forEach(entry => {
    if (map.size >= 11) return;
    if (!map.has(entry.url)) map.set(entry.url, { id: entry.url, url: entry.url, label: entry.title, section: entry.section, current: false });
  });

  const nodes = Array.from(map.values());
  const links = [];
  nodes.filter(node => !node.current).forEach(node => {
    links.push({ source: current.id, target: node.id, strength: 0.028 });
  });

  const breadcrumbLinks = Array.from(document.querySelectorAll('.breadcrumbs a[href^="/"]'))
    .map(a => normalizeInternalHref(a.getAttribute('href')))
    .filter(Boolean);
  breadcrumbLinks.forEach((url, index) => {
    if (breadcrumbLinks[index + 1]) links.push({ source: url, target: breadcrumbLinks[index + 1], strength: 0.035 });
  });

  const sectionRoot = nodes.find(node => !node.current && node.section === current.section);
  if (sectionRoot) {
    nodes.forEach(node => {
      if (!node.current && node.id !== sectionRoot.id && node.section === current.section) {
        links.push({ source: sectionRoot.id, target: node.id, strength: 0.02 });
      }
    });
  }

  return { nodes, links };
}

function simulateGraph(nodes, links, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const padding = 24;

  nodes.forEach((node, index) => {
    const ring = node.current ? 0 : 1 + (index % 2);
    const angle = (Math.PI * 2 * index) / Math.max(1, nodes.length - 1);
    node.x = node.current ? centerX : centerX + Math.cos(angle) * (ring === 1 ? width * 0.26 : width * 0.36);
    node.y = node.current ? centerY : centerY + Math.sin(angle) * (ring === 1 ? height * 0.22 : height * 0.32);
    node.vx = 0;
    node.vy = 0;
    node.r = node.current ? 20 : 12;
    node.fixed = node.current;
  });

  const byId = new Map(nodes.map(node => [node.id, node]));

  for (let step = 0; step < 260; step += 1) {
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = (a.r + b.r) * 3.8;
        const force = Math.min(55, (minDist * minDist) / dist) * 0.00075;
        dx /= dist;
        dy /= dist;
        if (!a.fixed) {
          a.vx -= dx * force;
          a.vy -= dy * force;
        }
        if (!b.fixed) {
          b.vx += dx * force;
          b.vy += dy * force;
        }
      }
    }

    links.forEach(link => {
      const a = byId.get(link.source);
      const b = byId.get(link.target);
      if (!a || !b) return;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const desired = a.current || b.current ? Math.min(width, height) * 0.28 : Math.min(width, height) * 0.22;
      const force = (dist - desired) * (link.strength || 0.02);
      dx /= dist;
      dy /= dist;
      if (!a.fixed) {
        a.vx += dx * force;
        a.vy += dy * force;
      }
      if (!b.fixed) {
        b.vx -= dx * force;
        b.vy -= dy * force;
      }
    });

    nodes.forEach(node => {
      if (node.fixed) return;
      node.vx += (centerX - node.x) * 0.0009;
      node.vy += (centerY - node.y) * 0.0009;
      node.vx *= 0.92;
      node.vy *= 0.92;
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    });
  }

  return { nodes, links };
}

function shortLabel(label) {
  if (label.length <= 18) return label;
  return `${label.slice(0, 16)}…`;
}

function renderConstellation(card, graph) {
  const stage = card.querySelector('.constellation-stage');
  if (!stage) return;

  const width = Math.max(320, stage.clientWidth || 360);
  const height = Math.max(280, stage.clientHeight || 300);
  const simulated = simulateGraph(
    graph.nodes.map(node => ({ ...node })),
    graph.links.map(link => ({ ...link })),
    width,
    height
  );

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Connected Saandipani journey map');

  simulated.links.forEach(link => {
    const source = simulated.nodes.find(node => node.id === link.source);
    const target = simulated.nodes.find(node => node.id === link.target);
    if (!source || !target) return;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', source.x);
    line.setAttribute('y1', source.y);
    line.setAttribute('x2', target.x);
    line.setAttribute('y2', target.y);
    line.setAttribute('class', 'constellation-link');
    svg.appendChild(line);
  });

  simulated.nodes.forEach(node => {
    const group = document.createElementNS(ns, 'a');
    group.setAttributeNS('http://www.w3.org/1999/xlink', 'href', node.url);
    group.setAttribute('class', `constellation-node${node.current ? ' current' : ''}`);
    group.setAttribute('aria-label', node.label);

    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', node.r);
    circle.setAttribute('fill', node.current ? '#0c2346' : (SECTION_COLORS[node.section] || SECTION_COLORS.misc));
    group.appendChild(circle);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', node.x);
    label.setAttribute('y', node.y + node.r + 16);
    label.setAttribute('text-anchor', 'middle');
    label.textContent = shortLabel(node.label);
    group.appendChild(label);

    svg.appendChild(group);
  });

  stage.innerHTML = '';
  stage.appendChild(svg);
}

function injectConstellationCards() {
  document.querySelectorAll('[data-enhance-graph="true"]').forEach(panel => {
    if (panel.querySelector('.constellation-card')) return;
    const graph = collectGraphData();
    const currentSection = document.body.dataset.section || 'home';
    const card = document.createElement('section');
    card.className = 'constellation-card';
    card.innerHTML = `
      <div class="constellation-head">
        <div>
          <div class="panel-title">Connected journey</div>
          <h3>Force-directed exploration</h3>
          <p>Every node is a related page or next step. Click any node to continue through the Saandipani story.</p>
        </div>
        <button type="button" class="constellation-mini">Search pages</button>
      </div>
      <div class="constellation-stage"></div>
      <div class="constellation-caption">
        <span class="constellation-badge">${currentSection}</span>
        <span class="constellation-badge">No orphan routes</span>
        <span class="constellation-badge">Deep-link ready</span>
      </div>
    `;
    panel.appendChild(card);
    card.querySelector('.constellation-mini').addEventListener('click', () => {
      document.querySelector('.nav-search')?.click();
    });
    renderConstellation(card, graph);
  });
}

function initReveal() {
  const targets = document.querySelectorAll('.hero-card, .surface, .card, .band, .quote-strip, .story-row, .contact-item, .faq-item, .constellation-card');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => {
    el.setAttribute('data-reveal', '');
    observer.observe(el);
  });
}

function injectFloatingDock() {
  if (document.querySelector('.floating-dock')) return;
  const dock = document.createElement('div');
  dock.className = 'floating-dock';
  dock.innerHTML = `
    <a class="dock-primary" href="/admissions/enquiry/">Enquire now</a>
    <button class="dock-secondary" type="button">Search</button>
  `;
  dock.querySelector('button').addEventListener('click', () => {
    document.querySelector('.nav-search')?.click();
  });
  document.body.appendChild(dock);
}

document.addEventListener('DOMContentLoaded', async () => {
  setBodyRouteData();
  initMenu();
  initScrollStates();
  initFaq();
  await loadSearchIndex();
  initSearch();
  injectConstellationCards();
  injectFloatingDock();
  initReveal();
});
