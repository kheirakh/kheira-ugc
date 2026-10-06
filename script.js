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

  // ================================================================
  // LANGUE : français par défaut ; anglais avec ?lang=en ou le bouton EN
  // Les textes anglais sont dans en.json (modifiable dans l'admin)
  // ================================================================
  var LANG = 'fr';
  try {
    var qs = new URLSearchParams(location.search).get('lang');
    if (qs === 'en' || qs === 'fr') { LANG = qs; try { localStorage.setItem('kh_lang', qs); } catch (e) {} }
    else { try { if (localStorage.getItem('kh_lang') === 'en') LANG = 'en'; } catch (e) {} }
  } catch (e) {}

  var UI = {
    fr: {
      nav_accueil: 'Accueil', nav_apropos: 'À propos', nav_portfolio: 'Portfolio', nav_photographie: 'Photos', nav_materiel: 'Matériel',
      nav_collaborations: 'Collaborations', nav_prestations: 'Prestations', nav_formation: 'Formation', nav_contact: 'Contact', nav_faq: 'FAQ', nav_brief: 'Travaillons ensemble', nav_hello: 'Hello les marques', nav_choisir: 'Comment choisir\u00a0?',
      droits: 'Tous droits réservés', modalites: 'Modalités', lang_btn: 'EN', lang_aria: 'Read in English',
      f_nom: 'Nom et prénom', f_marque: 'Marque', f_email: 'Email', f_site: 'Site ou Instagram de la marque', f_type: 'Type de contenu',
      f_budget: 'Budget', f_delai: 'Date de livraison souhaitée', f_message: 'Ton projet en quelques mots', f_choisir: 'Choisir…',
      f_envoi: 'Envoi en cours…', f_manque: 'Merci de remplir les champs obligatoires.', f_erreur: 'Oups, l’envoi n’a pas fonctionné. Écris-moi directement à ',
      f_merci: 'Merci ! Ta demande est bien envoyée, je reviens vers toi très vite.'
    },
    en: {
      nav_accueil: 'Home', nav_apropos: 'About', nav_portfolio: 'Portfolio', nav_photographie: 'Photos', nav_materiel: 'Gear',
      nav_collaborations: 'Brands', nav_prestations: 'Services', nav_formation: 'Course', nav_contact: 'Contact', nav_faq: 'FAQ', nav_brief: 'Let’s work together', nav_hello: 'Hello brands', nav_choisir: 'How to choose?',
      droits: 'All rights reserved', modalites: 'Terms', lang_btn: 'FR', lang_aria: 'Lire en français',
      f_nom: 'Full name', f_marque: 'Brand', f_email: 'Email', f_site: 'Brand website or Instagram', f_type: 'Type of content',
      f_budget: 'Budget', f_delai: 'Desired delivery date', f_message: 'Your project in a few words', f_choisir: 'Select…',
      f_envoi: 'Sending…', f_manque: 'Please fill in the required fields.', f_erreur: 'Oops, the form could not be sent. Email me directly at ',
      f_merci: 'Thank you! Your request has been sent, I will get back to you very soon.'
    }
  };
  function t(k) { return (UI[LANG] && UI[LANG][k]) || UI.fr[k] || ''; }

  // Fusionne les textes anglais par-dessus le contenu français (les listes élément par élément)
  function merge(base, over) {
    if (over == null || over === '') return base;
    if (Array.isArray(base) && Array.isArray(over)) {
      return base.map(function (b, i) { return i < over.length ? merge(b, over[i]) : b; });
    }
    if (base && typeof base === 'object' && over && typeof over === 'object' && !Array.isArray(over)) {
      var r = {};
      Object.keys(base).forEach(function (k) { r[k] = base[k]; });
      Object.keys(over).forEach(function (k) { r[k] = k in base ? merge(base[k], over[k]) : over[k]; });
      return r;
    }
    return typeof over === 'object' ? base : over;
  }

  var CONTENT = {};

  function render(c) {
    CONTENT = c;
    document.documentElement.lang = LANG;
    document.querySelectorAll('[data-ui]').forEach(function (el) { var v = t(el.getAttribute('data-ui')); if (v) el.textContent = v; });
    var lb = document.getElementById('langBtn');
    var FLAG = {
      EN: '<svg class="flag" viewBox="0 0 60 30" aria-hidden="true"><clipPath id="fgb"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="fgb2"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#fgb)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#fgb2)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>',
      FR: '<svg class="flag" viewBox="0 0 3 2" aria-hidden="true"><path fill="#002654" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#CE1126" d="M2 0h1v2H2z"/></svg>'
    };
    if (lb) { lb.innerHTML = FLAG[t('lang_btn')] + '<span>' + t('lang_btn') + '</span>'; lb.setAttribute('aria-label', t('lang_aria')); }

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
    var kit = L.media_kit ? src(L.media_kit) : '';
    var kitTxt = L.media_kit_texte || 'Media kit';
    var DL = '<svg class="arrow" viewBox="0 0 24 24"><path d="M12 4v13M6 11l6 6 6-6M5 20h14"/></svg>';
    if (kit) {
      hero += '<a class="pill pill--kit" href="' + esc(kit) + '" target="_blank" rel="noopener"><span class="pill__icon">' + DL + '</span>' + esc(kitTxt) + '</a>';
      contact += '<a href="' + esc(kit) + '" target="_blank" rel="noopener"><span class="round round--dark">' + DL + '</span>' + esc(kitTxt) + '</a>';
    }
    var bk = document.getElementById('briefKit');
    if (bk) { if (kit) { bk.href = kit; bk.hidden = false; } else { bk.hidden = true; } }
    document.getElementById('heroLinks').innerHTML = hero;
    document.getElementById('contactLinks').innerHTML = contact;

    var ab = (c.apropos && c.apropos.paragraphes) || [];
    document.getElementById('aboutList').innerHTML = ab.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');

    var CHECK = '<svg class="check" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
    function checks(list) { return (list || []).filter(Boolean).map(function (t) { return '<li>' + CHECK + '<span>' + esc(t) + '</span></li>'; }).join(''); }
    var kg = document.getElementById('kitGroups');
    if (kg && c.materiel && c.materiel.groupes) {
      kg.innerHTML = c.materiel.groupes.filter(function (g) { return g && (g.titre || (g.items || []).length); }).map(function (g) {
        return '<div class="kit__group">' + (g.titre ? '<h3>' + esc(g.titre) + '</h3>' : '') + '<ul>' + checks(g.items) + '</ul></div>';
      }).join('');
    }
    var of = document.getElementById('offers');
    if (of && c.prestations && c.prestations.cartes) {
      of.innerHTML = c.prestations.cartes.filter(Boolean).map(function (k, i) {
        return '<article class="offer"><span class="offer__num">0' + (i + 1) + '</span><h3>' + esc(k.titre) + '</h3>' +
          (k.sous_titre ? '<p class="offer__sub">' + esc(k.sous_titre) + '</p>' : '') +
          (k.description ? '<p>' + esc(k.description) + '</p>' : '') +
          '<ul>' + checks(k.points) + '</ul>' +
          (k.modalites ? '<div class="offer__mod"><strong>' + esc(t('modalites')) + '</strong><p>' + esc(k.modalites) + '</p></div>' : '') + '</article>';
      }).join('');
    }

    if (c.formation) {
      [['fBtn1', 'lien'], ['fBtn2', 'lien_2']].forEach(function (b) {
        var el = document.getElementById(b[0]); if (!el) return;
        var u = String(c.formation[b[1]] || '');
        var t = c.formation[b[0] === 'fBtn1' ? 'bouton' : 'bouton_2'];
        if (/^https?:\/\//.test(u)) el.href = u;
        el.style.display = (t && String(t).trim()) ? '' : 'none';
      });
    }

    // Chiffres clés
    var st = ((c.chiffres && c.chiffres.liste) || []).filter(function (x) { return x && x.chiffre; });
    var stSec = document.getElementById('chiffres');
    if (stSec) {
      stSec.hidden = !st.length;
      document.getElementById('statsList').innerHTML = st.map(function (x) {
        return '<li><strong>' + esc(x.chiffre) + '</strong><span>' + esc(x.libelle) + '</span></li>';
      }).join('');
    }
    // Avis des marques
    var av = ((c.avis && c.avis.liste) || []).filter(function (x) { return x && x.texte; });
    var avSec = document.getElementById('avis');
    if (avSec) {
      avSec.hidden = !av.length;
      document.getElementById('reviewsList').innerHTML = av.map(function (x) {
        return '<figure class="review"><span class="review__q" aria-hidden="true">“</span><blockquote>' + esc(x.texte) + '</blockquote>' +
          '<figcaption><strong>' + esc(x.nom) + '</strong>' + (x.marque ? '<span>' + esc(x.marque) + '</span>' : '') + '</figcaption></figure>';
      }).join('');
    }
    // FAQ
    var fq = ((c.faq && c.faq.questions) || []).filter(function (x) { return x && x.question; });
    var fqSec = document.getElementById('faq');
    if (fqSec) {
      fqSec.hidden = !fq.length;
      document.getElementById('faqList').innerHTML = fq.map(function (x, i) {
        return '<details class="qa"><summary>' + nbsp(x.question) + '<span class="qa__plus" aria-hidden="true"></span></summary><p>' + esc(x.reponse) + '</p></details>';
      }).join('');
    }
    // Formulaire : listes déroulantes
    var B = c.brief || {};
    function opts(list) {
      return '<option value="">' + esc(t('f_choisir')) + '</option>' + (list || []).filter(Boolean).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('');
    }
    var fT = document.getElementById('fType'), fB = document.getElementById('fBudget');
    if (fT) fT.innerHTML = opts(B.types);
    if (fB) fB.innerHTML = opts(B.budgets);

    var co = (c.collaborations && c.collaborations.marques) || [];
    var coEl = document.getElementById('collabs');
    var coSec = document.getElementById('collaborations');
    if (coSec && c.collaborations && c.collaborations.photo_fond) {
      coSec.style.backgroundImage = 'linear-gradient(rgba(43,29,21,.45),rgba(43,29,21,.45)),url("' + src(c.collaborations.photo_fond).replace(/"/g, '%22') + '")';
      coSec.classList.add('has-photo');
    }
    if (coEl && c.collaborations) coEl.innerHTML = co.filter(Boolean).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');

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
        // point focal choisi dans l'admin (ex. "50% 0%" = garder le haut)
        var cadrage = typeof p === 'string' ? '' : String(p.cadrage || '').replace(/\s+/g, ' ').trim();
        var pos = /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(cadrage) ? ' style="object-position:' + cadrage + '"' : '';
        if (!img) return '';
        return '<figure class="reveal' + (marque ? ' has-marque' : '') + '"><img src="' + esc(src(img)) + '" alt="' + (marque ? esc(marque) : alt + ' ' + (i + 1)) + '" loading="lazy"' + pos + '>' +
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

    // Bouton de langue
    var lb = document.getElementById('langBtn');
    if (lb) lb.addEventListener('click', function () {
      var next = LANG === 'en' ? 'fr' : 'en';
      try { localStorage.setItem('kh_lang', next); } catch (e) {}
      var u = new URL(location.href);
      u.searchParams.set('lang', next);
      location.href = u.toString();
    });

    // Formulaire « Travaillons ensemble » : envoyé par FormSubmit vers l'email de « Mes liens »
    var form = document.getElementById('briefForm');
    if (form) {
      var msg = document.getElementById('briefMsg');
      var btn = form.querySelector('button[type=submit]');
      var mail = (CONTENT.liens && CONTENT.liens.email) || 'helloookheira@gmail.com';
      // calendrier : pas de date passée
      var fd = document.getElementById('fDelai');
      if (fd) { var n = new Date(); fd.min = n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }
      function frDate(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (v || ''); }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        msg.className = 'brief__msg';
        if (!form.checkValidity()) {
          form.classList.add('was-checked');
          msg.textContent = t('f_manque');
          msg.classList.add('is-error');
          var bad = form.querySelector(':invalid'); if (bad) bad.focus();
          return;
        }
        if (form._honey.value) return;
        var d = new FormData(form);
        var data = {
          _subject: 'Nouvelle demande de collaboration — ' + d.get('marque'),
          _template: 'table', _captcha: 'false', _replyto: d.get('email'),
          'Nom': d.get('nom'), 'Marque': d.get('marque'), 'Email': d.get('email'), 'Site / Instagram': d.get('site'),
          'Type de contenu': d.get('type'), 'Budget': d.get('budget'), 'Date souhaitée': frDate(d.get('delai')),
          'Message': d.get('message'), 'Langue du site': LANG.toUpperCase()
        };
        btn.disabled = true;
        msg.textContent = t('f_envoi');
        fetch('https://formsubmit.co/ajax/' + encodeURIComponent(mail), {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data)
        }).then(function (r) { return r.json(); }).then(function (r) {
          if (String(r.success) !== 'true') throw new Error(r.message || 'échec');
          form.reset(); form.classList.remove('was-checked');
          msg.textContent = (CONTENT.brief && CONTENT.brief.merci) || t('f_merci');
          msg.classList.add('is-ok');
        }).catch(function (err) {
          // 1re utilisation : FormSubmit demande d'activer le formulaire (email « Activate Form » reçu par Kheira)
          if (/activat/i.test(String(err && err.message))) {
            msg.textContent = LANG === 'en' ? 'This form is being activated, please email me directly in the meantime.' : 'Formulaire en cours d’activation : regarde ta boîte mail (et les spams) pour l’email FormSubmit « Activate Form ».';
            msg.classList.add('is-error');
            return;
          }
          msg.innerHTML = esc(t('f_erreur')) + '<a href="mailto:' + esc(mail) + '">' + esc(mail) + '</a>';
          msg.classList.add('is-error');
        }).then(function () { btn.disabled = false; });
      });
    }

    // Vidéos : aperçu muet au survol (ordinateur) ; clic ou tap = lecture en grand (pop-up)
    var cards = Array.prototype.slice.call(document.querySelectorAll('.vcard'));
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    function stop(card) { var v = card.querySelector('video'); v.pause(); card.classList.remove('is-playing'); }
    function preview(card) {
      cards.forEach(function (c) { if (c !== card) stop(c); });
      var v = card.querySelector('video');
      v.muted = true;
      var p = v.play();
      card.classList.add('is-playing');
      if (p && p.catch) p.catch(function () { card.classList.remove('is-playing'); });
    }

    // Pop-up vidéo
    var box = document.createElement('div');
    box.className = 'vbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<div class="vbox__inner"><button class="vbox__close" aria-label="Fermer la vidéo">&times;</button>' +
      '<video class="vbox__video" controls playsinline></video><p class="vbox__marque"></p></div>';
    document.body.appendChild(box);
    var boxVideo = box.querySelector('video');
    function openBox(card) {
      cards.forEach(stop);
      var v = card.querySelector('video');
      boxVideo.src = v.getAttribute('src').replace('#t=0.1', '');
      if (v.getAttribute('poster')) boxVideo.setAttribute('poster', v.getAttribute('poster')); else boxVideo.removeAttribute('poster');
      box.querySelector('.vbox__marque').textContent = (card.querySelector('p') || {}).textContent || '';
      box.classList.add('is-open');
      document.documentElement.classList.add('vbox-open');
      boxVideo.muted = false;
      var p = boxVideo.play();
      if (p && p.catch) p.catch(function () {});
      box.querySelector('.vbox__close').focus({ preventScroll: true });
    }
    function closeBox() {
      if (!box.classList.contains('is-open')) return;
      boxVideo.pause();
      boxVideo.removeAttribute('src');
      boxVideo.load();
      box.classList.remove('is-open');
      document.documentElement.classList.remove('vbox-open');
    }
    box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('.vbox__close')) closeBox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBox(); });

    cards.forEach(function (card) {
      var media = card.querySelector('.vcard__media');
      if (canHover) {
        media.addEventListener('mouseenter', function () { preview(card); });
        media.addEventListener('mouseleave', function () { stop(card); });
      }
      media.addEventListener('click', function () { openBox(card); });
    });

    // Carrousel : toutes les vidéos sur une ligne ; l'onglet suit la vidéo affichée
    var car = document.getElementById('carousel');
    var prev = document.getElementById('carPrev');
    var next = document.getElementById('carNext');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
    function stepSize() {
      if (!cards[0]) return car.clientWidth;
      var gap = parseFloat(getComputedStyle(car).columnGap) || 0;
      return cards[0].getBoundingClientRect().width + gap;
    }
    function maxScroll() { return car.scrollWidth - car.clientWidth; }
    function updateArrows() {
      prev.disabled = car.scrollLeft <= 2;
      next.disabled = car.scrollLeft >= maxScroll() - 2;
      prev.parentNode.style.visibility = (prev.disabled && next.disabled) ? 'hidden' : '';
    }
    function setActive(cat) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-filter') === cat;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on);
      });
      // les vidéos des autres catégories passent en retrait
      cards.forEach(function (c) { c.classList.toggle('is-other', c.getAttribute('data-cat') !== cat); });
    }
    // petite étiquette de catégorie sur chaque vidéo
    cards.forEach(function (c) {
      var t = tabs.filter(function (x) { return x.getAttribute('data-filter') === c.getAttribute('data-cat'); })[0];
      if (t && !c.querySelector('.vcard__cat')) {
        var tag = document.createElement('span');
        tag.className = 'vcard__cat';
        tag.textContent = t.textContent;
        c.querySelector('.vcard__media').appendChild(tag);
      }
    });
    function cardLeft(c) { return c.getBoundingClientRect().left - car.getBoundingClientRect().left + car.scrollLeft; }
    function firstOf(cat) { return cards.filter(function (c) { return c.getAttribute('data-cat') === cat; })[0]; }
    var lock = null;
    function spy() {
      if (lock || !cards.length) return;
      var cat;
      if (car.scrollLeft >= maxScroll() - 4) {
        // tout au bout : dernière catégorie dont la 1re vidéo est visible
        var right = car.scrollLeft + car.clientWidth;
        tabs.forEach(function (t) {
          var f = firstOf(t.getAttribute('data-filter'));
          if (f && cardLeft(f) + f.offsetWidth / 2 <= right) cat = t.getAttribute('data-filter');
        });
      } else {
        var best = Infinity;
        cards.forEach(function (c) {
          var d = Math.abs(cardLeft(c) - car.scrollLeft);
          if (d < best) { best = d; cat = c.getAttribute('data-cat'); }
        });
      }
      if (cat) setActive(cat);
    }
    prev.addEventListener('click', function () { car.scrollBy({ left: -stepSize(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { car.scrollBy({ left: stepSize(), behavior: 'smooth' }); });
    car.addEventListener('scroll', function () { window.requestAnimationFrame(function () { updateArrows(); spy(); }); }, { passive: true });
    window.addEventListener('resize', function () { updateArrows(); spy(); });
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var cat = t.getAttribute('data-filter');
        var f = firstOf(cat);
        setActive(cat);
        if (!f) return;
        clearTimeout(lock);
        lock = setTimeout(function () { lock = null; }, 900);
        car.scrollTo({ left: Math.min(cardLeft(f), maxScroll()), behavior: 'smooth' });
      });
    });
    if (tabs[0]) setActive(tabs[0].getAttribute('data-filter'));
    updateArrows();

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

    // Bouton « remonter en haut » : apparaît après un peu de scroll
    var top = document.getElementById('toTop');
    if (top) {
      var onScroll = function () { top.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      top.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }
  }

  // Charge content.json ; si le fichier est introuvable (ouverture directe du fichier), le contenu écrit dans index.html reste affiché
  function load(f) { return fetch(f, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); }); }
  load('content.json')
    .then(function (c) {
      if (LANG !== 'en') return c;
      return load('en.json').then(function (en) { return merge(c, en); }).catch(function (e) { console.warn('en.json non chargé', e); return c; });
    })
    .then(function (c) { try { render(c); } catch (e) { console.error('content.json :', e); } })
    .catch(function (e) { console.warn('content.json non chargé, contenu par défaut affiché.', e); })
    .then(function () { document.documentElement.classList.remove('is-loading'); })
    .then(init);
})();
