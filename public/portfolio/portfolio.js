/* Bedigy · Portfolio — efectos y comportamiento */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };

  /* ---------- navegación ---------- */
  var nav = $('.nav'), burger = $('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var o = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      d.body.style.overflow = o ? 'hidden' : '';
    });
    $$('.menu a, .nav-cta').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); d.body.style.overflow = ''; }); });
  }
  var links = $$('.menu a'), secs = links.map(function (a) { return $(a.getAttribute('href')); });
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var i = secs.indexOf(e.target);
      links.forEach(function (a, k) { a.classList.toggle('on', k === i); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(function (s) { if (s) spy.observe(s); });

  /* ---------- revelados ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-r],.rise,.mega,.h2,.h3').forEach(function (el) { io.observe(el); });

  /* ---------- contadores ---------- */
  var fmt = function (v, dec, suf) { return v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, to = parseFloat(el.getAttribute('data-to')), dec = parseInt(el.getAttribute('data-dec') || '0', 10), suf = el.getAttribute('data-suf') || '';
      if (reduce) { el.textContent = fmt(to, dec, suf); return; }
      var t0 = performance.now(), dur = 1800;
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - p, 3));
        el.textContent = fmt(v, dec, suf);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.6 });
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
  }, { threshold: 0.2, rootMargin: '100px 0px' });
  $$('video[data-src]').forEach(function (v) { v.muted = true; vio.observe(v); });
  $$('.snd').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = $('video', b.parentNode); v.muted = !v.muted;
      b.firstChild.textContent = v.muted ? '🔇' : '🔊';
      b.setAttribute('aria-label', v.muted ? 'Activar el sonido' : 'Silenciar');
      if (!v.muted) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    });
  });

  /* ---------- luz del cursor y botones magnéticos ---------- */
  if (fine && !reduce) {
    var gx = 0, gy = 0, gt = false;
    addEventListener('pointermove', function (e) {
      gx = e.clientX; gy = e.clientY;
      if (!gt) { gt = true; requestAnimationFrame(function () { gt = false; root.style.setProperty('--gx', gx + 'px'); root.style.setProperty('--gy', gy + 'px'); }); }
    }, { passive: true });
    $$('.btn,.nav-cta').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.16) + 'px');
        b.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.26) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }

  /* ---------- scroll: progreso, nav y parallax ---------- */
  var par = $$('[data-speed]'), ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, h = root.scrollHeight - innerHeight;
    root.style.setProperty('--prog', h > 0 ? (y / h).toFixed(4) : 0);
    nav.classList.toggle('solid', y > 30);
    root.style.setProperty('--sy', Math.min(y, innerHeight * 1.2));
    if (reduce) return;
    var vh = innerHeight;
    par.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) return;
      var c = (r.top + r.height / 2 - vh / 2) / vh, s = parseFloat(el.getAttribute('data-speed')) || 0.1;
      el.style.translate = '0 ' + (c * s * -150).toFixed(1) + 'px';
    });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); frame();

  /* ---------- carrusel de marcas, logo por logo ---------- */
  (function () {
    var sl = $('.slider'); if (!sl) return;
    var track = $('.track', sl), cap = $('.cap', sl), base = $$('.lg', track), N = base.length;
    if (!N) return;
    for (var k = 0; k < 2; k++) base.forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.querySelector('img').alt = ''; track.appendChild(c); });
    var all = $$('.lg', track), idx = N, timer = null, busy = false;
    function pos(noTrans) {
      var li = all[idx];
      track.classList.toggle('nt', !!noTrans);
      track.style.transform = 'translateX(' + (sl.clientWidth / 2 - (li.offsetLeft + li.offsetWidth / 2)) + 'px)';
      all.forEach(function (x, i) { var dd = Math.abs(i - idx); x.classList.toggle('on', dd === 0); x.classList.toggle('n1', dd === 1); });
      cap.textContent = base[idx % N].querySelector('img').alt;
      if (noTrans) { void track.offsetWidth; track.classList.remove('nt'); }
    }
    function go(n) {
      idx += n; pos(false); busy = true;
      setTimeout(function () {
        busy = false;
        if (idx >= 2 * N) { idx -= N; pos(true); } else if (idx < N) { idx += N; pos(true); }
      }, reduce ? 0 : 980);
    }
    function play() { stop(); if (!reduce) timer = setInterval(function () { if (!busy && !d.hidden) go(1); }, 2300); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    $('.next', sl).addEventListener('click', function () { if (!busy) go(1); play(); });
    $('.prev', sl).addEventListener('click', function () { if (!busy) go(-1); play(); });
    sl.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(1); play(); } else if (e.key === 'ArrowLeft') { go(-1); play(); } });
    sl.addEventListener('pointerenter', stop); sl.addEventListener('pointerleave', play);
    var sx = null;
    sl.addEventListener('pointerdown', function (e) { sx = e.clientX; stop(); });
    addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40 && !busy) go(dx < 0 ? 1 : -1); play(); });
    addEventListener('resize', function () { pos(true); });
    var vis = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) play(); else stop(); }); }, { threshold: 0.2 });
    vis.observe(sl);
    var imgs = $$('img', track), left = imgs.length;
    function ready() { pos(true); }
    imgs.forEach(function (im) { im.loading = 'eager'; if (im.complete) { if (--left === 0) ready(); } else im.addEventListener('load', function () { if (--left === 0) ready(); }); im.addEventListener('error', function () { if (--left === 0) ready(); }); });
    pos(true);
  })();

  /* ---------- visor de imágenes ---------- */
  var lb = $('.lb'), lbi = $('img', lb), list = [], cur = 0, lastFocus = null;
  function listFor(el) {
    var c = el.closest('[data-gal],.app-vis') || d, seen = {}, out = [];
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
  function close() { lb.classList.remove('on'); d.body.style.overflow = ''; lbi.removeAttribute('src'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  $$('[data-lb]').forEach(function (el) {
    el.addEventListener('click', function () { open(el); });
    if (!el.closest('[aria-hidden="true"]')) {
      el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button');
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); } });
    }
  });
  $('.x', lb).addEventListener('click', close);
  $('.pv-b', lb).addEventListener('click', function () { show(cur - 1); });
  $('.nx-b', lb).addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  addEventListener('keydown', function (e) {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1);
  });
  var tx = 0;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); }, { passive: true });
})();
