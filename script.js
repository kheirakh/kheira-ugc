(function () {
  // ================================================================
  // 1. CONTENU : lu dans content.json (modifié depuis Pages CMS)
  // ================================================================
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Les chemins enregistrés par Pages CMS peuvent commencer par "/" : on les rend relatifs
  function src(p) { return String(p || '').replace(/^\/+/, ''); }
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  // Garde le point d'exclamation / d'interrogation collé au mot
  function nbsp(s) { return esc(s).replace(/ ([!?:;»])/g, '&nbsp;$1'); }

  var ICON = {
    mail: '<svg><use href="#i-mail"/></svg>',
    ig: '<svg><use href="#i-ig"/></svg>',
    tt: '<svg><use href="#i-tt"/></svg>'
  };

  function render(c) {
    document.querySelectorAll('[data-txt]').forEach(function (el) {
      var v = get(c, el.getAttribute('data-txt'));
      if (v != null && v !== '') el.innerHTML = nbsp(v);
    });
    document.querySelectorAll('[data-img]').forEach(function (el) {
      var v = get(c, el.getAttribute('data-img'));
      if (v) el.src = src(v);
    });

    var L = c.liens || {};
    var ig = String(L.instagram || '').replace(/^@/, '');
    var tt = String(L.tiktok || '').replace(/^@/, '');
    var hero = '', contact = '';
    if (L.email) {
      hero += '<a class="pill" href="mailto:' + esc(L.email) + '"><span class="pill__icon">' + ICON.mail + '</span>' + esc(L.email) + '</a>';
      contact += '<a href="mailto:' + esc(L.email) + '"><span class="round round--dark">' + ICON.mail + '</span>' + esc(L.email) + '</a>';
    }
    if (ig) {
      hero += '<a class="pill" href="https://www.instagram.com/' + esc(ig) + '" target="_blank" rel="noopener"><span class="pill__icon">' + ICON.ig + '</span>Instagram</a>';
      contact += '<a href="https://www.instagram.com/' + esc(ig) + '" target="_blank" rel="noopener"><span class="round round--dark">' + ICON.ig + '</span>Instagram · @' + esc(ig) + '</a>';
    }
    if (tt) {
      hero += '<a class="pill" href="https://www.tiktok.com/@' + esc(tt) + '" target="_blank" rel="noopener"><span class="pill__icon">' + ICON.tt + '</span>TikTok</a>';
      contact += '<a href="https://www.tiktok.com/@' + esc(tt) + '" target="_blank" rel="noopener"><span class="round round--dark">' + ICON.tt + '</span>TikTok · @' + esc(tt) + '</a>';
    }
    document.getElementById('heroLinks').innerHTML = hero;
    document.getElementById('contactLinks').innerHTML = contact;

    var ab = (c.apropos && c.apropos.paragraphes) || [];
    document.getElementById('aboutList').innerHTML = ab.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');

    var un = (c.univers && c.univers.liste) || [];
    document.getElementById('univers').innerHTML = un.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');

    var cats = ((c.portfolio && c.portfolio.categories) || []).filter(function (k) { return k && k.nom; });
    document.getElementById('tabs').innerHTML = cats.map(function (k, i) {
      return '<button class="tab' + (i === 0 ? ' is-active' : '') + '" data-filter="cat' + i + '" role="tab">' + esc(k.nom) + '</button>';
    }).join('');
    var cards = '';
    cats.forEach(function (k, i) {
      (k.videos || []).forEach(function (v) {
        if (!v || !v.video) return;
        var poster = v.image ? ' poster="' + esc(src(v.image)) + '"' : '';
        var file = esc(src(v.video)) + (v.image ? '' : '#t=0.1');
        cards += '<article class="vcard" data-cat="cat' + i + '"><div class="vcard__media"><video src="' + file + '"' + poster +
          ' muted loop playsinline preload="' + (v.image ? 'none' : 'metadata') + '"></video><span class="play" aria-hidden="true"></span></div>' +
          '<h3>' + esc(v.titre) + '</h3><p>' + esc(v.marque) + '</p></article>';
      });
    });
    document.getElementById('carousel').innerHTML = cards;

    function grid(id, list, alt) {
      document.getElementById(id).innerHTML = (list || []).filter(Boolean).map(function (p, i) {
        // une photo peut être un simple chemin, ou { image, marque } (Photos UGC)
        var img = typeof p === 'string' ? p : p.image;
        var marque = typeof p === 'string' ? '' : (p.marque || '');
        if (!img) return '';
        return '<figure class="reveal' + (marque ? ' has-marque' : '') + '"><img src="' + esc(src(img)) + '" alt="' + (marque ? esc(marque) : alt + ' ' + (i + 1)) + '" loading="lazy">' +
          (marque ? '<figcaption class="pgrid__marque">' + esc(marque) + '</figcaption>' : '') + '</figure>';
      }).join('');
    }
    grid('grid9', c.photographie && c.photographie.photos, 'Photographie');
    grid('gridUgc', c.photos_ugc && c.photos_ugc.photos, 'Photo UGC');
  }

  // ================================================================
  // 2. INTERACTIONS
  // ================================================================
  function init() {
    // Menu mobile
    var nav = document.getElementById('nav');
    var burger = document.getElementById('burger');
    function closeMenu() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('#navLinks a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) closeMenu(); });

    // Vidéos : survol sur ordinateur, tap sur mobile, une seule à la fois
    var cards = Array.prototype.slice.call(document.querySelectorAll('.vcard'));
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    function stop(card) { card.querySelector('video').pause(); card.classList.remove('is-playing'); }
    function play(card) {
      cards.forEach(function (c) { if (c !== card) stop(c); });
      var v = card.querySelector('video');
      var p = v.play();
      card.classList.add('is-playing');
      if (p && p.catch) p.catch(function () { card.classList.remove('is-playing'); });
    }
    cards.forEach(function (card) {
      var media = card.querySelector('.vcard__media');
      var v = card.querySelector('video');
      if (canHover) {
        media.addEventListener('mouseenter', function () { play(card); });
        media.addEventListener('mouseleave', function () { stop(card); });
        media.addEventListener('click', function () { v.muted = !v.muted; if (v.paused) play(card); });
      } else {
        media.addEventListener('click', function () {
          if (card.classList.contains('is-playing')) stop(card);
          else { v.muted = false; play(card); }
        });
      }
    });

    // Carrousel + onglets
    var car = document.getElementById('carousel');
    var prev = document.getElementById('carPrev');
    var next = document.getElementById('carNext');
    function stepSize() {
      var first = cards.filter(function (c) { return !c.classList.contains('is-hidden'); })[0];
      if (!first) return car.clientWidth;
      var gap = parseFloat(getComputedStyle(car).columnGap) || 0;
      return first.getBoundingClientRect().width + gap;
    }
    function updateArrows() {
      var max = car.scrollWidth - car.clientWidth - 2;
      prev.disabled = car.scrollLeft <= 2;
      next.disabled = car.scrollLeft >= max;
      prev.parentNode.style.visibility = (prev.disabled && next.disabled) ? 'hidden' : '';
    }
    prev.addEventListener('click', function () { car.scrollBy({ left: -stepSize(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { car.scrollBy({ left: stepSize(), behavior: 'smooth' }); });
    car.addEventListener('scroll', function () { window.requestAnimationFrame(updateArrows); }, { passive: true });
    window.addEventListener('resize', updateArrows);

    var tabs = document.querySelectorAll('.tab');
    function filter(cat) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-filter') === cat;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on);
      });
      cards.forEach(function (c) {
        var show = c.getAttribute('data-cat') === cat;
        if (!show) stop(c);
        c.classList.toggle('is-hidden', !show);
      });
      car.style.scrollBehavior = 'auto';
      car.scrollLeft = 0;
      car.style.scrollBehavior = '';
      updateArrows();
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { filter(t.getAttribute('data-filter')); }); });
    var first = document.querySelector('.tab.is-active') || tabs[0];
    if (first) filter(first.getAttribute('data-filter')); else updateArrows();

    // Apparition au scroll
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: 0.1 });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }

    document.getElementById('year').textContent = new Date().getFullYear();
  }

  // Charge content.json ; si le fichier est introuvable (ouverture directe du fichier), le contenu écrit dans index.html reste affiché
  fetch('content.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (c) { try { render(c); } catch (e) { console.error('content.json :', e); } })
    .catch(function (e) { console.warn('content.json non chargé, contenu par défaut affiché.', e); })
    .then(function () { document.documentElement.classList.remove('is-loading'); })
    .then(init);
})();
