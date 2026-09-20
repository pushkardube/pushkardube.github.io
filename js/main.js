/**
 * Main JavaScript — Navbar, Mobile Menu, Scroll Reveal, Active Links
 */

(function () {
  'use strict';

  // ── Theme toggle (dark/light) ──────────────────────────────────
  (function () {
    var root = document.documentElement;
    var btn = document.getElementById('themeToggle');
    function current() { return root.getAttribute('data-theme') || 'light'; }
    function apply(t) {
      root.setAttribute('data-theme', t);
      try { localStorage.setItem('theme', t); } catch (e) {}
      window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
    }
    if (btn) btn.addEventListener('click', function () { apply(current() === 'dark' ? 'light' : 'dark'); });
  })();

  // ── Navbar scroll detection ──────────────────────────────────────
  const navbar = document.querySelector('.navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  // ── Mobile menu toggle ───────────────────────────────────────────
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isOpen);
      navLinks.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
      });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
        navToggle.focus();
      }
    });
  }

  // ── Active nav link highlighting ─────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

  if (sections.length && navItems.length) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navItems.forEach(function (item) {
              item.classList.remove('active');
              if (item.getAttribute('href') === '#' + id) {
                item.classList.add('active');
              }
            });
          }
        });
      },
      {
        rootMargin: '-20% 0px -80% 0px',
      }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  // ── Scroll reveal animations ─────────────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');

  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    // Show everything immediately
    revealElements.forEach(function (el) {
      el.classList.add('revealed');
    });
  } else if (revealElements.length) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // ── Smooth scroll fallback ───────────────────────────────────────
  if (!('scrollBehavior' in document.documentElement.style)) {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
})();

// ── UWB Localizer: anchors around the page, cursor = tag ─────────
// Occasionally the tag is glitched inward by a simulated Ghost Peak attack
//   • Ghost Peak — reduces a range, glitching the tag's position inward
(function () {
  const canvas = document.getElementById('uwbLocalizer');
  const posEl = document.getElementById('uwbPos');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  var CY, GR, INK, SUB, LINE, RING, DLBL, HALO, isLight;
  function readColors() {
    var s = getComputedStyle(document.documentElement);
    CY = (s.getPropertyValue('--accent-start') || '#2de2d6').trim();
    GR = (s.getPropertyValue('--accent-end') || '#37e06b').trim();
    isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      INK = '#08312c';                // reticle / coordinate text
      SUB = 'rgba(10,70,64,.95)';     // anchor labels
      LINE = 'rgba(9,90,82,.65)';     // ranging line — darker so it reads on greige
      RING = '9,90,82';               // anchor rings + pulse dots
      DLBL = '#075048';               // distance numbers (solid dark teal)
      HALO = 'rgba(246,241,232,.95)'; // outline matches the warm bg
    } else {
      INK = '#eafffb';
      SUB = 'rgba(159,180,184,.8)';
      LINE = 'rgba(45,226,214,.28)';
      RING = '45,226,214';
      DLBL = 'rgba(120,240,225,.9)';
      HALO = 'rgba(7,11,18,.85)';
    }
  }
  // draw text with a contrasting outline so it reads over anything
  function label(txt, x, y, color, size) {
    ctx.font = (size || 10) + 'px "JetBrains Mono", monospace';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = HALO;
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
  }
  readColors();
  window.addEventListener('themechange', readColors);
  const RED = '#ff5a72';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // grid: viewport maps to GRID_W × GRID_H metres
  const GRID_W = 12, GRID_H = 8;
  // anchors at fixed viewport fractions
  const anchors = [
    { id: 'A0', fx: 0.06, fy: 0.15 },
    { id: 'A1', fx: 0.94, fy: 0.13 },
    { id: 'A2', fx: 0.05, fy: 0.86 },
    { id: 'A3', fx: 0.95, fy: 0.90 },
  ];

  let W, H, dpr, t = 0;
  const tag = { x: 0, y: 0, tx: 0, ty: 0, has: false };
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    anchors.forEach(a => { a.x = a.fx * W; a.y = a.fy * H; a.cx = a.fx * GRID_W; a.cy = a.fy * GRID_H; });
    if (!tag.has) { tag.x = tag.tx = W / 2; tag.y = tag.ty = H * 0.42; }
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('pointermove', e => {
    tag.tx = e.clientX; tag.ty = e.clientY; tag.has = true;
  }, { passive: true });

  const toM = (px, axis) => (axis === 'x' ? px / W * GRID_W : px / H * GRID_H);

  // ── attack scheduler (Ghost Peak: a sudden distance reduction) ──
  let ghost = null;  // { i, until, mag }
  let nextGhost = 1000; // first Ghost Peak fires ~1s after the page loads
  function schedule(now) {
    if (reduce) return;
    if (!ghost && now > nextGhost) {
      // ghost peak reduces the range to a random anchor
      const i = (Math.random() * anchors.length) | 0;
      ghost = { i, until: now + 2200 + Math.random() * 1600, mag: 0.28 + Math.random() * 0.22 };
      nextGhost = now + 11000 + Math.random() * 9000;
    }
    if (ghost && now > ghost.until) { ghost = null; }
  }

  function anchorNode(a, jammed) {
    const col = jammed ? RED : CY;
    // pulse ring
    const pr = ((t + a.fx * 120) % 90) / 90;
    ctx.strokeStyle = jammed
      ? `rgba(255,90,114,${0.4 * (1 - pr)})`
      : `rgba(${RING},${0.4 * (1 - pr)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(a.x, a.y, 6 + pr * 20, 0, 6.2832); ctx.stroke();
    // node
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = jammed ? 16 : 12;
    ctx.beginPath(); ctx.arc(a.x, a.y, 4.5, 0, 6.2832); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = jammed ? 'rgba(255,90,114,.6)' : `rgba(${RING},.6)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(a.x, a.y, 8.5, 0, 6.2832); ctx.stroke();
    // label
    const txt = jammed ? `${a.id} ✕ UWBAD JAM` : `${a.id} ⟨${a.cx.toFixed(1)},${a.cy.toFixed(1)}⟩`;
    ctx.textBaseline = 'middle';
    label(txt, a.fx < 0.5 ? a.x + 12 : a.x - 12 - ctx.measureText(txt).width, a.y, jammed ? RED : SUB, 10);
  }

  function rangingLine(a, gx, gy, attacked) {
    const col = attacked ? RED : CY;
    // dashed pulse travelling from anchor to tag
    const dx = gx - a.x, dy = gy - a.y, len = Math.hypot(dx, dy);
    ctx.save();
    ctx.strokeStyle = attacked ? 'rgba(255,90,114,.55)' : LINE;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([3, 5]);
    ctx.lineDashOffset = -(t * 1.4) % 8;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(gx, gy); ctx.stroke();
    ctx.restore();
    // travelling pulse dot
    const pp = ((t * 0.9 + a.fx * 60) % 60) / 60;
    ctx.fillStyle = attacked ? 'rgba(255,90,114,.9)' : `rgba(${RING},.85)`;
    ctx.beginPath(); ctx.arc(a.x + dx * pp, a.y + dy * pp, 2, 0, 6.2832); ctx.fill();
    // distance label at midpoint
    const dm = Math.hypot(toM(dx, 'x'), toM(dy, 'y'));
    ctx.textBaseline = 'middle';
    label((attacked ? '↓' : '') + dm.toFixed(2) + ' m', a.x + dx * 0.55, a.y + dy * 0.55, attacked ? '#ff5a72' : DLBL, 10);
  }

  function reticle(gx, gy, glitch) {
    const col = glitch ? RED : CY;
    if (glitch) { // duplicated offset "ghost" copy
      ctx.strokeStyle = 'rgba(255,90,114,.5)';
      const ox = (Math.random() - 0.5) * 8, oy = (Math.random() - 0.5) * 8;
      ctx.beginPath(); ctx.arc(gx + ox, gy + oy, 9, 0, 6.2832); ctx.stroke();
    }
    ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.shadowColor = col; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(gx, gy, 9, 0, 6.2832); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx - 15, gy); ctx.lineTo(gx - 4, gy);
    ctx.moveTo(gx + 4, gy); ctx.lineTo(gx + 15, gy);
    ctx.moveTo(gx, gy - 15); ctx.lineTo(gx, gy - 4);
    ctx.moveTo(gx, gy + 4); ctx.lineTo(gx, gy + 15);
    ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(gx, gy, 2, 0, 6.2832); ctx.fill();
    ctx.shadowBlur = 0;
    // coordinate label
    const xm = toM(gx, 'x').toFixed(2), ym = toM(gy, 'y').toFixed(2);
    ctx.textBaseline = 'top';
    label((glitch ? 'GHOST PEAK ' : 'TAG ') + `⟨${xm}, ${ym}⟩`, gx + 16, gy + 12, glitch ? RED : INK, 11);
  }

  function frame() {
    const now = performance.now();
    schedule(now);
    ctx.clearRect(0, 0, W, H);
    // filter the tag toward the cursor (a real ranging filter lags a little)
    tag.x += (tag.tx - tag.x) * 0.18;
    tag.y += (tag.ty - tag.y) * 0.18;

    // displayed tag: ghost peak pulls it toward the attacked anchor + jitter
    let gx = tag.x, gy = tag.y, glitch = false;
    if (ghost) {
      const a = anchors[ghost.i];
      gx = tag.x + (a.x - tag.x) * ghost.mag + (Math.random() - 0.5) * 10;
      gy = tag.y + (a.y - tag.y) * ghost.mag + (Math.random() - 0.5) * 10;
      glitch = true;
    }

    anchors.forEach((a, i) => rangingLine(a, gx, gy, ghost && ghost.i === i));
    anchors.forEach((a) => anchorNode(a, false));
    reticle(gx, gy, glitch);

    // HUD
    if (posEl) {
      const xm = toM(gx, 'x').toFixed(2), ym = toM(gy, 'y').toFixed(2);
      if (glitch) posEl.innerHTML = `<span style="color:${RED}">⚠ GHOST PEAK · d↓ ⟨${xm}, ${ym}⟩ m</span>`;
      else posEl.textContent = `TAG ⟨${xm}, ${ym}⟩ m · ${anchors.length} anchors locked`;
    }

    t += 1;
  }

  if (reduce) { frame(); return; }
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) loop(); });
  function loop() { if (!running) return; frame(); requestAnimationFrame(loop); }
  loop();
})();

// ── Command palette (⌘K) ─────────────────────────────────────────
(function () {
  const overlay = document.getElementById('cmdk');
  const input = document.getElementById('cmdkInput');
  const list = document.getElementById('cmdkList');
  const btn = document.getElementById('cmdkBtn');
  if (!overlay || !input || !list) return;

  const go = (sel) => { const el = document.querySelector(sel); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  function jumpCard(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1600);
  }
  function toggleTheme() {
    const root = document.documentElement;
    const t = (root.getAttribute('data-theme') || 'light') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }

  // static actions
  const actions = [
    { g: 'Navigate', ic: '§', label: 'About', meta: '01', run: () => go('#about') },
    { g: 'Navigate', ic: '§', label: 'Skills & Résumé', meta: '02', run: () => go('#skills') },
    { g: 'Navigate', ic: '§', label: 'Projects', meta: '03', run: () => go('#projects') },
    { g: 'Navigate', ic: '§', label: 'Contact', meta: '04', run: () => go('#contact') },
    { g: 'Actions', ic: '⤓', label: 'Download résumé (PDF)', run: () => window.open('assets/Pushkar_Dube_CV.pdf', '_blank') },
    { g: 'Actions', ic: '◐', label: 'Toggle dark / light theme', run: toggleTheme },
    { g: 'Links', ic: '↗', label: 'GitHub — @pushkardube', run: () => window.open('https://github.com/pushkardube', '_blank') },
    { g: 'Links', ic: '✉', label: 'Email me', run: () => { window.location.href = 'mailto:ppdube_b24@et.vjti.ac.in'; } },
  ];
  // dynamic project entries
  document.querySelectorAll('.project-card').forEach(card => {
    const h = card.querySelector('h3'); if (!h) return;
    const name = h.textContent.replace(/\s+/g, ' ').trim();
    let id = card.id;
    if (!id) { id = 'proj-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); card.id = id; }
    let cat = card.closest('.projects-grid');
    actions.push({ g: 'Projects', ic: '▸', label: name, run: () => jumpCard(id) });
  });

  let filtered = actions.slice(), active = 0;
  function render() {
    if (!filtered.length) { list.innerHTML = '<div class="cmdk-empty">No matches.</div>'; return; }
    let html = '', lastG = null;
    filtered.forEach((a, i) => {
      if (a.g !== lastG) { html += `<div class="cmdk-group-label">${a.g}</div>`; lastG = a.g; }
      html += `<div class="cmdk-item${i === active ? ' active' : ''}" data-i="${i}">
        <span class="ic">${a.ic}</span><span>${a.label}</span>${a.meta ? `<span class="meta">${a.meta}</span>` : ''}</div>`;
    });
    list.innerHTML = html;
  }
  function filter() {
    const q = input.value.trim().toLowerCase();
    filtered = q ? actions.filter(a => (a.label + ' ' + a.g).toLowerCase().includes(q)) : actions.slice();
    active = 0; render();
  }
  function open() {
    overlay.classList.add('open'); input.value = ''; filter();
    setTimeout(() => input.focus(), 20);
  }
  function close() { overlay.classList.remove('open'); }
  function exec(i) { const a = filtered[i]; if (!a) return; close(); setTimeout(a.run, 60); }

  btn && btn.addEventListener('click', open);
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.classList.contains('open') ? close() : open(); return; }
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); render(); scrollActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(); scrollActive(); }
    else if (e.key === 'Enter') { e.preventDefault(); exec(active); }
  });
  function scrollActive() { const el = list.querySelector('.cmdk-item.active'); if (el) el.scrollIntoView({ block: 'nearest' }); }
  input.addEventListener('input', filter);
  list.addEventListener('click', e => { const it = e.target.closest('.cmdk-item'); if (it) exec(+it.dataset.i); });
  list.addEventListener('mousemove', e => { const it = e.target.closest('.cmdk-item'); if (it && +it.dataset.i !== active) { active = +it.dataset.i; render(); } });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
})();
