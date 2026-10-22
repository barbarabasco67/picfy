/* Portfolio Pablo & Bárbara — efectos y comportamiento */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };

  /* ---------- navegación ---------- */
  var nav = $('.nav'), burger = $('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('.menu a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ---------- revelado al hacer scroll ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-r]').forEach(function (el) { io.observe(el); });

  /* ---------- contadores ---------- */
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, to = parseFloat(el.getAttribute('data-to')), dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var suf = el.getAttribute('data-suf') || '', t0 = performance.now(), dur = 1600;
      if (reduce) { el.textContent = to.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; return; }
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - p, 3));
        el.textContent = v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.5 });
  $$('.count').forEach(function (el) { cio.observe(el); });

  /* ---------- vídeos: solo se cargan y reproducen cuando se ven ---------- */
  var vio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } else { v.pause(); }
    });
  }, { threshold: 0.25, rootMargin: '120px 0px' });
  $$('video[data-src]').forEach(function (v) { v.muted = true; v.setAttribute('playsinline', ''); vio.observe(v); });
  $$('.mute').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = $('video', b.parentNode); v.muted = !v.muted; b.textContent = v.muted ? '🔇' : '🔊';
      b.setAttribute('aria-label', v.muted ? 'Activar sonido' : 'Silenciar');
    });
  });

  /* ---------- tarjetas con foco de luz y botones magnéticos ---------- */
  $$('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.18) + 'px');
        b.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.28) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }

  /* ---------- hero: ratón + scroll ---------- */
  var hero = $('.hero');
  if (hero && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      hero.style.setProperty('--px', x.toFixed(3)); hero.style.setProperty('--py', y.toFixed(3));
      hero.style.setProperty('--sx', (x * 60).toFixed(1));
    });
  }

  /* ---------- scroll: progreso, nav, parallax ---------- */
  var par = $$('[data-speed]'), pp = $$('.ph1'), ticking = false, bar = $('.progress');
  function frame() {
    ticking = false;
    var y = window.scrollY, h = root.scrollHeight - innerHeight;
    root.style.setProperty('--prog', h > 0 ? (y / h).toFixed(4) : 0);
    nav.classList.toggle('solid', y > 30);
    if (hero) hero.style.setProperty('--sy', Math.min(y, innerHeight * 1.2));
    if (reduce) return;
    var vh = innerHeight;
    par.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var c = (r.top + r.height / 2 - vh / 2) / vh, s = parseFloat(el.getAttribute('data-speed')) || 0.1;
      el.style.transform = 'translate3d(0,' + (c * s * -140).toFixed(1) + 'px,0)';
    });
    pp.forEach(function (el) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--pp', ((r.top + r.height / 2 - vh / 2) / vh).toFixed(3));
    });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); frame();

  /* ---------- animaciones SVG (Playbook Finder) ---------- */
  if (reduce) $$('svg').forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });

  /* ---------- visor de imágenes (navega dentro de su propia galería) ---------- */
  var lb = $('.lb'), lbi = $('img', lb), list = [], cur = 0, lastFocus = null;
  function listFor(el) {
    var c = el.closest('.gal,.md,.posters') || d, seen = {}, out = [];
    $$('[data-lb]', c).forEach(function (x) { var k = x.getAttribute('data-lb'); if (!seen[k]) { seen[k] = 1; out.push(x); } });
    return out;
  }
  function show(i) {
    cur = (i + list.length) % list.length;
    var el = list[cur]; lbi.src = el.getAttribute('data-lb'); lbi.alt = el.getAttribute('data-alt') || '';
  }
  function open(el) {
    lastFocus = d.activeElement; list = listFor(el);
    var k = el.getAttribute('data-lb'), i = 0; list.forEach(function (x, n) { if (x.getAttribute('data-lb') === k) i = n; });
    show(i); lb.classList.add('on'); d.body.style.overflow = 'hidden'; $('.x', lb).focus();
  }
  function close() { lb.classList.remove('on'); d.body.style.overflow = ''; lbi.removeAttribute('src'); if (lastFocus) lastFocus.focus(); }
  $$('[data-lb]').forEach(function (el) {
    el.addEventListener('click', function () { open(el); });
    if (!el.closest('[aria-hidden="true"]')) {
      el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button');
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); } });
    }
  });
  $('.x', lb).addEventListener('click', close);
  $('.pv', lb).addEventListener('click', function () { show(cur - 1); });
  $('.nx', lb).addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  addEventListener('keydown', function (e) {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1);
  });
  var sx = 0;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); }, { passive: true });
})();
