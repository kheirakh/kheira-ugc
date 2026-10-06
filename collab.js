(function () {
  // Espace marques : contenu dans collab.json (admin « Espace marques »), email dans content.json (Mes liens)
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nbsp(s) { return esc(s).replace(/ ([!?:;»%€])/g, '&nbsp;$1'); }
  function get(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function list(x) { return (x || []).filter(function (v) { return v && (typeof v !== 'object' || Object.keys(v).some(function (k) { return v[k]; })); }); }
  function $(id) { return document.getElementById(id); }
  var CHECK = '<svg class="check" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  var MAIL = 'helloookheira@gmail.com';
  var C = {};

  function items(arr, compact) {
    return list(arr).map(function (it) {
      return '<li class="cl-item">' +
        '<div class="cl-item__row"><span class="cl-item__name">' + nbsp(it.nom) + (it.badge ? ' <em class="cl-badge">' + esc(it.badge) + '</em>' : '') + '</span>' +
        '<span class="cl-item__dots" aria-hidden="true"></span><strong class="cl-item__price">' + nbsp(it.prix) + '</strong></div>' +
        (!compact && it.texte ? '<p>' + esc(it.texte) + '</p>' : '') + '</li>';
    }).join('');
  }
  function opts(arr, first) {
    return '<option value="">' + esc(first || 'Choisir…') + '</option>' + list(arr).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('');
  }

  // Une adresse email dans un texte devient cliquable (ouvre la boîte mail)
  function mailLink(html) {
    return html.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, function (m) { return '<a class="cl-mail" href="mailto:' + m + '">' + m + '</a>'; });
  }
  function render(c) {
    C = c;
    document.querySelectorAll('[data-c]').forEach(function (el) {
      var v = get(c, el.getAttribute('data-c'));
      if (v != null && v !== '') el.innerHTML = nbsp(v); else if (!el.textContent.trim()) el.hidden = true;
    });
    document.querySelectorAll('[data-ci]').forEach(function (el) {
      var v = get(c, el.getAttribute('data-ci'));
      var nv = String(v || '').replace(/^\/+/, '');
      if (!nv) { el.closest('figure').hidden = true; return; }
      if (el.getAttribute('src') !== nv) el.src = nv; // ne recharge pas si c'est déjà la bonne photo
    });
    var gal = list((c.galerie || {}).photos).map(function (g) { return typeof g === 'string' ? { image: g } : g; }).filter(function (g) { return g.image; });
    $('clGal').innerHTML = gal.map(function (g) {
      var pos = /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(String(g.cadrage || '').trim()) ? ' style="object-position:' + g.cadrage.trim() + '"' : '';
      return '<figure' + (g.marque ? ' class="has-marque"' : '') + '><img src="' + esc(String(g.image).replace(/^\/+/, '')) + '" alt="' + esc(g.marque || '') + '" loading="lazy"' + pos + '>' +
        (g.marque ? '<figcaption class="pgrid__marque">' + esc(g.marque) + '</figcaption>' : '') + '</figure>';
    }).join('');
    if (!gal.length) $('clGal').closest('section').hidden = true;
    $('clSteps').innerHTML = list((c.deroule || {}).etapes).map(function (e, i) {
      return '<li><span class="cl-step__n">' + ('0' + (i + 1)).slice(-2) + '</span><h3>' + esc(e.titre) + '</h3><p>' + mailLink(esc(e.texte)) + '</p></li>';
    }).join('');
    var t = c.tarifs || {};
    $('clInfluence').innerHTML = items((t.influence || {}).items);
    $('clUgc').innerHTML = items((t.ugc || {}).items);
    // même nombre de lignes dans les 2 cartes (titre + sous-titre + formules) pour qu'elles soient alignées
    var rows = 2 + Math.max(list((t.influence || {}).items).length, list((t.ugc || {}).items).length);
    document.querySelector('.cl-menu').style.setProperty('--rows', rows);
    $('clInfos').innerHTML = list((c.savoir || {}).items).filter(function (q) { return q.question; }).map(function (q) {
      var lignes = list(q.lignes);
      return '<details class="qa"><summary>' + nbsp(q.question) + '<span class="qa__plus" aria-hidden="true"></span></summary>' +
        (q.reponse ? '<p>' + esc(q.reponse) + '</p>' : '') +
        (lignes.length ? (lignes.every(function (l) { return String(l).length <= 24; })
          ? '<ul class="cl-lines">' + lignes.map(function (l) { return '<li>' + nbsp(l) + '</li>'; }).join('') + '</ul>'
          : '<ul class="cl-checks cl-checks--in">' + lignes.map(function (l) { return '<li>' + CHECK + '<span>' + nbsp(l) + '</span></li>'; }).join('') + '</ul>') : '') + '</details>';
    }).join('');

    var b = c.brief || {};
    $('sType').innerHTML = opts(b.types);
    // Formules classées : « Collab · Reel Instagram · 350 € », « UGC · Vidéo UGC · 180 € »
    function group(card) {
      card = card || {};
      var pre = card.prefixe ? card.prefixe + ' · ' : '';
      var o = list(card.items).map(function (x) { var v = pre + x.nom + (x.prix ? ' · ' + x.prix : ''); return '<option>' + esc(v) + '</option>'; }).join('');
      return o ? '<optgroup label="' + esc(card.titre || '') + '">' + o + '</optgroup>' : '';
    }
    $('sFormule').innerHTML = '<option value="">Choisir…</option>' + group(t.influence) + group(t.ugc) + '<option>Je ne sais pas encore</option>';
  }

  function init() {
    // Lien personnalisé : kheirakh.com/collab?pour=Nom de la marque
    try {
      var pour = new URLSearchParams(location.search).get('pour');
      if (pour) {
        pour = pour.slice(0, 60);
        var p = $('pour'); p.textContent = 'Proposition pour ' + pour; p.hidden = false;
        $('fMarque').value = pour;
        document.title = 'Espace marques · ' + pour + ' | Kheira';
      }
    } catch (e) {}

    // FAQ : une seule question ouverte à la fois
    document.addEventListener('toggle', function (e) {
      var d = e.target;
      if (!d.classList || !d.classList.contains('qa') || !d.open) return;
      d.parentNode.querySelectorAll('.qa[open]').forEach(function (o) { if (o !== d) o.open = false; });
    }, true);

    // Étapes : apparition une à une au scroll
    var steps = $('clSteps');
    if (steps && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      steps.classList.add('is-anim');
      var so = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        steps.classList.add('is-in'); so.disconnect();
        setTimeout(function () { steps.classList.add('is-done'); }, 1200);
      }, { threshold: .15 });
      so.observe(steps);
    }

    // Menu mobile
    var nav = $('nav'), burger = $('burger');
    function closeMenu() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
    burger.addEventListener('click', function () { burger.setAttribute('aria-expanded', nav.classList.toggle('is-open')); });
    document.querySelectorAll('#navLinks a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) closeMenu(); });

    // Bouton remonter
    var top = $('toTop');
    function onScroll() { top.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8); }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    top.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    $('year').textContent = new Date().getFullYear();

    // Calendriers : pas de date passée
    var n = new Date(), today = n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2);
    document.querySelectorAll('.js-date').forEach(function (d) { d.min = today; });
    function frDate(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (v || ''); }

    // Envoi du brief (FormSubmit, même email que le formulaire du site)
    var form = $('clForm'), msg = $('clMsg'), btn = form.querySelector('button[type=submit]');
    // Lien du site ou d'Instagram : uniquement une adresse web
    var site = $('fSite'), siteErr = $('siteErr');
    var URLRE = /^(https?:\/\/)?(www\.)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;
    function checkSite() {
      var v = site.value.trim(), ok = !v || URLRE.test(v);
      site.setCustomValidity(ok ? '' : 'lien');
      siteErr.hidden = ok;
      return ok;
    }
    site.addEventListener('input', function () { if (!siteErr.hidden) checkSite(); });
    site.addEventListener('blur', checkSite);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = 'brief__msg';
      checkSite();
      if (!form.checkValidity()) {
        form.classList.add('was-checked');
        msg.textContent = siteErr.hidden ? 'Merci de remplir les champs marqués d’une étoile.' : 'Le lien de ton site ou de ton Instagram n’est pas valide.';
        msg.classList.add('is-error');
        var bad = form.querySelector(':invalid'); if (bad) bad.focus();
        return;
      }
      if (form._honey.value) return;
      var d = new FormData(form);
      var data = {
        _subject: 'Nouveau brief (Espace marques) — ' + d.get('marque'), _template: 'table', _captcha: 'false', _replyto: d.get('email'),
        'Marque': d.get('marque'), 'Nom': d.get('nom'), 'Email': d.get('email'), 'Site / Instagram': (function (v) { v = String(v || '').trim(); return v && !/^https?:\/\//i.test(v) ? 'https://' + v : v; })(d.get('site')),
        'Type de collaboration': d.get('type'), 'Formule souhaitée': d.get('formule'), 'Produits': d.get('produits'),
        'Messages clés': d.get('messages'),
        'À éviter': d.get('eviter'), 'Exemples': d.get('exemples'),
        'Date de livraison / publication': frDate(d.get('date_publication')), 'Message': d.get('message')
      };
      btn.disabled = true;
      msg.textContent = 'Envoi en cours…';
      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(MAIL), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (r) {
        if (String(r.success) !== 'true') throw new Error(r.message || 'échec');
        form.reset(); form.classList.remove('was-checked');
        msg.textContent = (C.brief && C.brief.merci) || 'Merci ! Ton brief est bien envoyé.';
        msg.classList.add('is-ok');
      }).catch(function () {
        msg.innerHTML = 'Oups, l’envoi n’a pas fonctionné. Écris-moi directement à <a href="mailto:' + esc(MAIL) + '">' + esc(MAIL) + '</a>';
        msg.classList.add('is-error');
      }).then(function () { btn.disabled = false; });
    });
  }

  function load(f) { return fetch(f, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(f); return r.json(); }); }
  Promise.all([load('collab.json'), load('content.json').catch(function () { return {}; })])
    .then(function (r) {
      var mail = r[1] && r[1].liens && r[1].liens.email; if (mail) MAIL = mail;
      try { render(r[0]); } catch (e) { console.error('collab.json :', e); }
    })
    .catch(function (e) { console.warn('collab.json non chargé', e); })
    .then(function () { document.documentElement.classList.remove('is-loading'); })
    .then(init);
})();
