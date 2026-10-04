/* El sí de las niñas · 5º PAI — comportamiento compartido.
   Sin dependencias. Si algo falla (p. ej. almacenamiento bloqueado en navegación
   privada), la página sigue siendo legible y usable. */
(function () {
  'use strict';

  var PREFIX = '5pai:';
  var store = null;
  try { store = window.localStorage; } catch (e) { store = null; }

  function get(k) { try { return store ? store.getItem(PREFIX + k) : null; } catch (e) { return null; } }
  function set(k, v) { try { if (store) store.setItem(PREFIX + k, v); } catch (e) { /* sin guardado */ } }
  function del(k) { try { if (store) store.removeItem(PREFIX + k); } catch (e) { /* nada */ } }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- tamaño de letra ---------- */
  var sizes = [100, 112, 125, 140];
  var si = parseInt(get('fs') || '0', 10);
  if (isNaN(si) || si < 0 || si > 3) si = 0;
  function applySize() { document.documentElement.style.fontSize = sizes[si] + '%'; }
  applySize();

  /* ---------- guardado de respuestas ---------- */
  function autosize(el) {
    if (el.tagName !== 'TEXTAREA') return;
    el.style.height = 'auto';
    var h = el.scrollHeight + 2;
    if (h > 0) el.style.height = h + 'px';
  }

  function words(t) {
    var m = t.trim().match(/\S+/g);
    return m ? m.length : 0;
  }
  function updateCount(el) {
    var sel = el.getAttribute('data-count');
    if (!sel) return;
    var out = document.querySelector(sel);
    if (!out) return;
    var n = words(el.value);
    var lo = parseInt(el.getAttribute('data-min') || '0', 10);
    var hi = parseInt(el.getAttribute('data-max') || '0', 10);
    var txt = n + (n === 1 ? ' palabra' : ' palabras');
    if (lo && hi) txt += ' · objetivo: ' + lo + '–' + hi;
    out.textContent = txt;
  }

  function initFields() {
    var fields = document.querySelectorAll('[data-save]');
    for (var i = 0; i < fields.length; i++) {
      (function (el) {
        var k = el.getAttribute('data-save');
        var v = get(k);
        if (el.type === 'checkbox') {
          el.checked = v === '1';
          el.addEventListener('change', function () { set(k, el.checked ? '1' : '0'); });
        } else {
          if (v !== null) el.value = v;
          el.addEventListener('input', function () { set(k, el.value); autosize(el); updateCount(el); });
          autosize(el);
          updateCount(el);
        }
      })(fields[i]);
    }

    var clears = document.querySelectorAll('[data-clear]');
    for (var j = 0; j < clears.length; j++) {
      clears[j].addEventListener('click', function () {
        if (!window.confirm('¿Seguro que quieres borrar todo lo que has escrito en esta página? No se puede deshacer.')) return;
        var all = document.querySelectorAll('[data-save]');
        for (var n = 0; n < all.length; n++) {
          var f = all[n];
          del(f.getAttribute('data-save'));
          if (f.type === 'checkbox') f.checked = false; else { f.value = ''; autosize(f); updateCount(f); }
        }
      });
    }
  }

  /* ---------- lectura en voz alta (síntesis del navegador) ---------- */
  var speaking = false;
  function chunk(text) {
    var parts = text.replace(/\s+/g, ' ').match(/[^.!?…;:]+[.!?…;:]*/g) || [text];
    var out = [], cur = '';
    for (var i = 0; i < parts.length; i++) {
      if ((cur + parts[i]).length > 180 && cur) { out.push(cur); cur = parts[i]; } else { cur += parts[i]; }
    }
    if (cur.trim()) out.push(cur);
    return out;
  }
  function stopSpeech() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speaking = false;
    var bs = document.querySelectorAll('.listen');
    for (var i = 0; i < bs.length; i++) bs[i].textContent = 'Escuchar';
  }
  function initListen() {
    var buttons = document.querySelectorAll('.listen');
    if (!buttons.length) return;
    if (!('speechSynthesis' in window)) {
      for (var i = 0; i < buttons.length; i++) buttons[i].parentNode.removeChild(buttons[i]);
      return;
    }
    for (var j = 0; j < buttons.length; j++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          if (speaking) { stopSpeech(); return; }
          var scope = document.querySelector(btn.getAttribute('data-target'));
          if (!scope) return;
          var quotes = scope.querySelectorAll('.quote p:not(.who-only)');
          var txt = [];
          for (var q = 0; q < quotes.length; q++) txt.push(quotes[q].innerText || quotes[q].textContent);
          var pieces = chunk(txt.join(' '));
          speaking = true;
          btn.textContent = 'Parar';
          pieces.forEach(function (p, idx) {
            var u = new SpeechSynthesisUtterance(p);
            u.lang = 'es-ES';
            u.rate = 0.92;
            if (idx === pieces.length - 1) u.onend = function () { stopSpeech(); };
            window.speechSynthesis.speak(u);
          });
        });
      })(buttons[j]);
    }
    window.addEventListener('beforeunload', stopSpeech);
  }

  /* ---------- tarjetas de estudio del glosario ---------- */
  function initDeck() {
    var root = document.getElementById('deck');
    if (!root) return;
    var nodes = document.querySelectorAll('.term');
    var cards = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var cls = (n.className.match(/b-\w+/) || ['b-ideas'])[0];
      var obra = n.querySelector('.obra').textContent.replace(/^\s*En la obra:\s*/, '');
      cards.push({
        term: n.querySelector('h4').textContent,
        def: n.querySelector('.def').textContent,
        obra: obra,
        block: n.getAttribute('data-block'),
        icon: n.querySelector('svg').outerHTML,
        cls: cls
      });
    }
    var view = cards.slice(), idx = 0, face = 'front', busy = false;

    root.innerHTML =
      '<div class="deck-meta"><span id="deck-count" aria-live="polite"></span></div>' +
      '<button type="button" class="deck-card" id="deck-card"></button>' +
      '<div class="deck-controls">' +
      '<button type="button" class="btn btn-ghost" id="deck-prev">Anterior</button>' +
      '<button type="button" class="btn btn-accent" id="deck-flip">Dar la vuelta</button>' +
      '<button type="button" class="btn btn-ghost" id="deck-next">Siguiente</button>' +
      '<button type="button" class="btn btn-ghost" id="deck-shuffle">Barajar</button>' +
      '</div>';
    root.hidden = false;

    var card = document.getElementById('deck-card');
    var count = document.getElementById('deck-count');

    function render() {
      var c = view[idx];
      card.className = 'deck-card ' + c.cls + (face === 'back' ? ' is-back' : '');
      if (face === 'front') {
        card.innerHTML = c.icon + '<span class="deck-term">' + esc(c.term) + '</span><span class="deck-hint">Pulsa para ver la definición</span>';
      } else {
        card.innerHTML = '<span class="deck-term small">' + esc(c.term) + '</span><span class="deck-def">' + esc(c.def) +
          '</span><span class="deck-obra"><strong>En la obra:</strong> ' + esc(c.obra) + '</span>';
      }
      card.setAttribute('aria-label', (face === 'front' ? 'Término: ' : 'Definición de ') + c.term + '. Pulsa para dar la vuelta.');
      count.textContent = (idx + 1) + ' / ' + view.length;
    }
    function flip() {
      if (busy) return;
      busy = true;
      card.classList.add('squash');
      setTimeout(function () { face = face === 'front' ? 'back' : 'front'; render(); busy = false; }, 180);
    }
    function go(d) { face = 'front'; idx = (idx + d + view.length) % view.length; render(); }
    function shuffle() {
      for (var k = view.length - 1; k > 0; k--) {
        var r = Math.floor(Math.random() * (k + 1));
        var t = view[k]; view[k] = view[r]; view[r] = t;
      }
      idx = 0; face = 'front'; render();
    }

    card.addEventListener('click', flip);
    document.getElementById('deck-flip').addEventListener('click', flip);
    document.getElementById('deck-prev').addEventListener('click', function () { go(-1); });
    document.getElementById('deck-next').addEventListener('click', function () { go(1); });
    document.getElementById('deck-shuffle').addEventListener('click', shuffle);
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(1); } else if (e.key === 'ArrowLeft') { go(-1); }
    });

    var chips = document.querySelectorAll('.chip');
    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function () {
        var f = this.getAttribute('data-filter');
        for (var m = 0; m < chips.length; m++) chips[m].classList.remove('is-on');
        this.classList.add('is-on');
        view = f === 'all' ? cards.slice() : cards.filter(function (x) { return x.block === f; });
        idx = 0; face = 'front'; render();
      });
    }
    render();
  }

  var started = false;
  function init() {
    if (started) return;
    started = true;
    var inc = document.getElementById('fs-inc');
    var dec = document.getElementById('fs-dec');
    var pr = document.getElementById('btn-print');
    if (inc) inc.addEventListener('click', function () { if (si < 3) { si++; set('fs', String(si)); applySize(); } });
    if (dec) dec.addEventListener('click', function () { if (si > 0) { si--; set('fs', String(si)); applySize(); } });
    if (pr) pr.addEventListener('click', function () { window.print(); });
    initFields();
    initListen();
    initDeck();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
