
const SECTION_COLORS = {
  home: '#11b8b1',
  about: '#d9ab39',
  montessori: '#11b8b1',
  programs: '#f68a72',
  admissions: '#f68a72',
  campus: '#11b8b1',
  families: '#7a70f2',
  journal: '#d9ab39',
  contact: '#0c2346',
  sitemap: '#7a70f2',
  misc: '#0c2346'
};

let SEARCH_INDEX = [];
const FALLBACK_SEARCH = [
  { title: 'Home', heading: 'Saandipani International Schools', url: '/', section: 'home', description: 'Complete Maria Montessori concept school in Poranki, Vijayawada.' }
];

function normalizeInternalHref(href) {
  if (!href) return null;
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return null;
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    let pathname = url.pathname;
    if (!pathname.endsWith('/') && !pathname.endsWith('.html')) pathname += '/';
    return pathname || '/';
  } catch {
    return null;
  }
}

function currentPath() {
  return normalizeInternalHref(window.location.pathname) || '/';
}

function setRouteData() {
  const path = currentPath();
  const parts = path.split('/').filter(Boolean);
  document.body.dataset.section = parts[0] || document.body.dataset.section || 'home';
  document.body.dataset.depth = String(parts.length);
}

function setActiveNav() {
  const path = currentPath();
  document.querySelectorAll('a[href^="/"]').forEach(link => {
    const href = normalizeInternalHref(link.getAttribute('href'));
    if (!href) return;
    const active = href === path || (href !== '/' && path.startsWith(href) && href.split('/').filter(Boolean).length === 1);
    if (active) link.classList.add('active');
  });
}

function initMenu() {
  const header = document.querySelector('.site-header');
  const button = document.querySelector('[data-menu-button]');
  if (!header || !button) return;
  button.addEventListener('click', () => {
    const open = !header.classList.contains('open');
    header.classList.toggle('open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

function initScrollProgress() {
  let progress = document.querySelector('.scroll-progress');
  if (!progress) {
    progress = document.createElement('div');
    progress.className = 'scroll-progress';
    document.body.appendChild(progress);
  }
  const header = document.querySelector('.site-header');
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    progress.style.width = pct + '%';
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

async function loadSearchIndex() {
  try {
    const response = await fetch('/assets/data/search-index.json');
    if (!response.ok) throw new Error('Search index unavailable');
    const data = await response.json();
    if (Array.isArray(data) && data.length) {
      SEARCH_INDEX = data;
      return;
    }
  } catch {}
  SEARCH_INDEX = FALLBACK_SEARCH;
}

function scoreEntry(entry, query) {
  if (!query) return 1;
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  const hay = [entry.title, entry.heading, entry.description, entry.section, ...(entry.keywords || [])].join(' ').toLowerCase();
  if (!hay.includes(q)) {
    const tokens = q.split(/\s+/).filter(Boolean);
    if (!tokens.every(token => hay.includes(token))) return 0;
  }
  let score = 0;
  if ((entry.title || '').toLowerCase().includes(q)) score += 8;
  if ((entry.heading || '').toLowerCase().includes(q)) score += 6;
  if ((entry.description || '').toLowerCase().includes(q)) score += 3;
  if ((entry.section || '').toLowerCase().includes(q)) score += 2;
  q.split(/\s+/).filter(Boolean).forEach(token => {
    if (hay.includes(token)) score += 1;
  });
  if (entry.url === currentPath()) score -= 1;
  return score;
}

function buildSearchModal() {
  const modal = document.createElement('div');
  modal.className = 'search-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <button class="search-backdrop" aria-label="Close search"></button>
    <div class="search-dialog" role="dialog" aria-modal="true" aria-label="Search Saandipani International Schools">
      <div class="search-head">
        <div>
          <strong>Search Saandipani International Schools</strong>
          <span>Find Montessori, programs, admissions, campus guidance, and contact routes in seconds.</span>
        </div>
        <button class="search-close" type="button" aria-label="Close search">×</button>
      </div>
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"></circle><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>
        <input type="text" placeholder="Search Montessori, admissions, families, campus…" aria-label="Search the school website">
        <div class="search-shortcuts">Press Esc to close</div>
      </div>
      <div class="search-results"></div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function initSearch() {
  const modal = buildSearchModal();
  const input = modal.querySelector('input');
  const results = modal.querySelector('.search-results');
  const openSearch = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 20);
    renderResults(input.value);
  };
  const closeSearch = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  const renderResults = (query='') => {
    const matches = SEARCH_INDEX
      .map(entry => ({ entry, score: scoreEntry(entry, query) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, query ? 12 : 8)
      .map(item => item.entry);
    if (!matches.length) {
      results.innerHTML = '<div class="search-empty">No results yet for that search. Try Montessori, admissions, programs, campus, or contact.</div>';
      return;
    }
    results.innerHTML = matches.map(entry => `
      <a class="search-item" href="${entry.url}">
        <div class="search-meta">
          <span class="search-chip">${entry.section || 'page'}</span>
          <span class="micro">${entry.url}</span>
        </div>
        <strong>${entry.heading || entry.title}</strong>
        <p>${entry.description || 'Explore this part of Saandipani International Schools.'}</p>
      </a>
    `).join('');
  };
  document.querySelectorAll('[data-open-search]').forEach(btn => {
    btn.addEventListener('click', openSearch);
  });
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-search]');
    if (trigger) {
      event.preventDefault();
      openSearch();
    }
  });
  modal.querySelector('.search-close').addEventListener('click', closeSearch);
  modal.querySelector('.search-backdrop').addEventListener('click', closeSearch);
  modal.addEventListener('click', event => {
    if (event.target.closest('.search-item')) closeSearch();
  });
  input.addEventListener('input', () => renderResults(input.value));
  window.addEventListener('keydown', event => {
    const openKey = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
    const slash = event.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
    if (openKey || slash) {
      event.preventDefault();
      openSearch();
    }
    if (event.key === 'Escape' && modal.classList.contains('open')) closeSearch();
  });
}

function initFaq() {
  document.querySelectorAll('.faq-item button').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const open = item.classList.contains('open');
      item.classList.toggle('open', !open);
      button.setAttribute('aria-expanded', !open ? 'true' : 'false');
      const mark = button.querySelector('.mark');
      if (mark) mark.textContent = !open ? '–' : '+';
    });
  });
}

function initReveal() {
  const targets = document.querySelectorAll('.hero-shell, .signature-card, .split-panel, .directory-card, .faq-item, .link-card, .force-card, .sitemap-group, .gallery-note');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
  targets.forEach(el => {
    el.setAttribute('data-reveal', '');
    observer.observe(el);
  });
}

function initTooltips() {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);
  let active = null;
  const show = (event) => {
    const target = event.currentTarget;
    const text = target.getAttribute('data-tip');
    if (!text) return;
    active = target;
    tooltip.textContent = text;
    tooltip.classList.add('show');
    position();
  };
  const hide = () => {
    active = null;
    tooltip.classList.remove('show');
  };
  const position = () => {
    if (!active) return;
    const rect = active.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();
    const top = Math.max(12, rect.top - ttRect.height - 10);
    let left = rect.left + rect.width / 2 - ttRect.width / 2;
    left = Math.max(12, Math.min(window.innerWidth - ttRect.width - 12, left));
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  };
  document.querySelectorAll('[data-tip]').forEach(target => {
    target.addEventListener('mouseenter', show);
    target.addEventListener('mouseleave', hide);
    target.addEventListener('focus', show);
    target.addEventListener('blur', hide);
  });
  window.addEventListener('scroll', position, { passive: true });
  window.addEventListener('resize', position);
}

function injectFloatingDock() {
  if (document.querySelector('.floating-dock')) return;
  const dock = document.createElement('div');
  dock.className = 'floating-dock';
  dock.innerHTML = `
    <a href="/admissions/enquiry/" class="dock-primary" data-tip="Open the admissions enquiry form">Enquire now</a>
    <button type="button" class="dock-secondary" data-open-search data-tip="Search the school website">Search</button>
  `;
  document.body.appendChild(dock);
}

function injectNavTip() {
  const key = 'saandipani-nav-tip-v3-dismissed';
  if (window.localStorage.getItem(key) === 'yes') return;
  const tip = document.createElement('aside');
  tip.className = 'nav-tip';
  tip.innerHTML = `
    <button class="tip-close" aria-label="Close tip">×</button>
    <strong>Navigation tip</strong>
    <p>Use the page guide below the hero, or press <strong>/</strong> to search instantly across Montessori, programs, admissions, campus, and contact.</p>
    <div class="nav-tip-actions">
      <button type="button" class="tip-chip" data-open-search>Search</button>
      <a href="/sitemap/" class="tip-chip">Sitemap</a>
    </div>
  `;
  document.body.appendChild(tip);
  tip.querySelector('.tip-close').addEventListener('click', () => {
    window.localStorage.setItem(key, 'yes');
    tip.remove();
  });
}

function shortLabel(label) {
  if (label.length <= 18) return label;
  return `${label.slice(0, 16)}…`;
}

function collectNodes(element) {
  const current = currentPath();
  const related = (element.getAttribute('data-related') || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  const rootPages = ['/', '/about/', '/montessori/', '/programs/', '/admissions/', '/campus/', '/families/', '/journal/', '/contact/'];
  const wanted = Array.from(new Set([current, ...related, ...rootPages])).slice(0, 12);
  return wanted
    .map(url => SEARCH_INDEX.find(entry => entry.url === url) || { url, title: url === '/' ? 'Home' : url.replaceAll('/', ' ').trim(), heading: '', section: (url.split('/').filter(Boolean)[0] || 'home') })
    .map(entry => ({
      id: entry.url,
      url: entry.url,
      label: (entry.heading || entry.title || 'Saandipani').replace(/\s+/g, ' ').trim(),
      section: entry.section || 'misc',
      current: entry.url === current,
      x: 0, y: 0, vx: 0, vy: 0, radius: entry.url === current ? 16 : 11
    }));
}

function buildLinks(nodes) {
  const current = nodes.find(node => node.current);
  const links = [];
  if (current) {
    nodes.forEach(node => {
      if (node.id !== current.id) links.push({ source: current.id, target: node.id, strength: 0.025 });
    });
  }
  const bySection = {};
  nodes.forEach(node => {
    bySection[node.section] = bySection[node.section] || [];
    bySection[node.section].push(node);
  });
  Object.values(bySection).forEach(group => {
    for (let i = 0; i < group.length - 1; i += 1) {
      links.push({ source: group[i].id, target: group[i + 1].id, strength: 0.016 });
    }
  });
  return links;
}

function initForceMaps() {
  document.querySelectorAll('[data-force-map]').forEach(stage => {
    const canvas = document.createElement('canvas');
    stage.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;
    let hoverNode = null;
    const nodes = collectNodes(stage);
    const links = buildLinks(nodes);
    const index = new Map(nodes.map(node => [node.id, node]));

    function resize() {
      const rect = stage.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width));
      height = Math.max(260, Math.floor(rect.height));
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      const centerX = width / 2;
      const centerY = height / 2;
      nodes.forEach((node, i) => {
        const ring = node.current ? 0 : 1 + (i % 2);
        const angle = (Math.PI * 2 * i) / Math.max(1, nodes.length - 1);
        node.x = node.current ? centerX : centerX + Math.cos(angle) * (ring === 1 ? width * 0.22 : width * 0.32);
        node.y = node.current ? centerY : centerY + Math.sin(angle) * (ring === 1 ? height * 0.18 : height * 0.28);
        node.vx = 0;
        node.vy = 0;
      });
    }

    function physics() {
      const centerX = width / 2;
      const centerY = height / 2;
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = (a.radius + b.radius) * 4.2;
          const repel = (minDist * minDist) / dist * 0.00045;
          dx /= dist; dy /= dist;
          if (!a.current) { a.vx -= dx * repel; a.vy -= dy * repel; }
          if (!b.current) { b.vx += dx * repel; b.vy += dy * repel; }
        }
      }
      links.forEach(link => {
        const a = index.get(link.source);
        const b = index.get(link.target);
        if (!a || !b) return;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ideal = a.current || b.current ? Math.min(width, height) * 0.28 : Math.min(width, height) * 0.22;
        const force = (dist - ideal) * (link.strength || 0.02);
        dx /= dist; dy /= dist;
        if (!a.current) { a.vx += dx * force; a.vy += dy * force; }
        if (!b.current) { b.vx -= dx * force; b.vy -= dy * force; }
      });
      nodes.forEach(node => {
        if (node.current) return;
        node.vx += (centerX - node.x) * 0.00035;
        node.vy += (centerY - node.y) * 0.00035;
        node.vx *= 0.93;
        node.vy *= 0.93;
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(24, Math.min(width - 24, node.x));
        node.y = Math.max(24, Math.min(height - 24, node.y));
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.lineWidth = 1;
      links.forEach(link => {
        const a = index.get(link.source);
        const b = index.get(link.target);
        if (!a || !b) return;
        const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        gradient.addColorStop(0, (SECTION_COLORS[a.section] || SECTION_COLORS.misc) + '66');
        gradient.addColorStop(1, (SECTION_COLORS[b.section] || SECTION_COLORS.misc) + '33');
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.fillStyle = node.current ? '#0c2346' : (SECTION_COLORS[node.section] || SECTION_COLORS.misc);
        ctx.shadowBlur = hoverNode === node ? 18 : 10;
        ctx.shadowColor = 'rgba(12,35,70,.18)';
        ctx.arc(node.x, node.y, hoverNode === node ? node.radius + 1.2 : node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#24324f';
        ctx.font = `600 ${node.current ? 13 : 12}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(shortLabel(node.label), node.x, node.y + node.radius + 12);
      });
      ctx.restore();
    }

    function frame() {
      physics();
      draw();
      requestAnimationFrame(frame);
    }

    function locate(event) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      hoverNode = nodes.find(node => Math.hypot(node.x - x, node.y - y) <= node.radius + 8) || null;
      canvas.style.cursor = hoverNode ? 'pointer' : 'default';
    }

    canvas.addEventListener('mousemove', locate);
    canvas.addEventListener('mouseleave', () => {
      hoverNode = null;
      canvas.style.cursor = 'default';
    });
    canvas.addEventListener('click', event => {
      locate(event);
      if (hoverNode) window.location.href = hoverNode.url;
    });

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setRouteData();
  setActiveNav();
  initMenu();
  initScrollProgress();
  await loadSearchIndex();
  injectFloatingDock();
  injectNavTip();
  initSearch();
  initFaq();
  initReveal();
  initTooltips();
  initForceMaps();
});
