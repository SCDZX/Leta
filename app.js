/* ============================================================
   Leta — project page behaviour
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */

  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');

  function systemTheme() {
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggle.addEventListener('click', function () {
    var next = (root.dataset.theme || systemTheme()) === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('leta-theme', next); } catch (e) {}
  });

  /* ---------- header shadow on scroll ---------- */

  var header = document.querySelector('.site-header');
  var onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 8);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- build comparison cards ---------- */

  var grid = document.getElementById('grid');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var EXPAND_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M14 4h6v6M10 20H4v-6M20 4l-7.5 7.5M4 20l7.5-7.5" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function cardHTML(c, i) {
    var num = String(i + 1).padStart(2, '0');
    var title = esc(c.title);
    return (
      '<article class="card">' +
        '<div class="card-head">' +
          '<div>' +
            '<p class="card-num">Case ' + num + '</p>' +
            '<h3>' + title + '</h3>' +
          '</div>' +
          '<button class="expand" type="button" data-id="' + esc(c.id) + '" ' +
            'aria-label="Open ' + title + ' in a larger view">' + EXPAND_ICON +
          '</button>' +
        '</div>' +
        '<div class="card-prompt">' +
          '<p>' + esc(c.summary) + '</p>' +
          '<details>' +
            '<summary>Full prompt</summary>' +
            '<p class="full">' + esc(c.prompt) + '</p>' +
          '</details>' +
        '</div>' +
        '<div class="pair">' +
          '<div class="tile">' +
            '<span class="tag leta">Leta <em>ours</em></span>' +
            '<video data-src="' + esc(c.leta) + '" muted loop playsinline ' +
              'preload="none" aria-label="Leta result for ' + title + '"></video>' +
          '</div>' +
          '<div class="tile">' +
            '<span class="tag dmd">DMD <em>baseline</em></span>' +
            '<video data-src="' + esc(c.dmd) + '" muted loop playsinline ' +
              'preload="none" aria-label="DMD baseline result for ' + title + '"></video>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  grid.innerHTML = CASES.map(cardHTML).join('');

  /* ---------- play videos only while visible ----------
     `data-src` keeps the 20 pairs from all requesting at once; each
     source is attached the first time its card nears the viewport. */

  var videos = Array.prototype.slice.call(grid.querySelectorAll('video'));

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (!v.src && v.dataset.src) v.src = v.dataset.src;
          if (!reduceMotion) { var p = v.play(); if (p) p.catch(function () {}); }
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { rootMargin: '150px 0px', threshold: 0.25 });

    videos.forEach(function (v) { io.observe(v); });
  } else {
    videos.forEach(function (v) { v.src = v.dataset.src; });
  }

  /* ---------- modal ---------- */

  var modal = document.getElementById('modal');
  var mTitle = document.getElementById('modal-title');
  var mPrompt = document.getElementById('modal-prompt');
  var mLeta = document.getElementById('modal-leta');
  var mDmd = document.getElementById('modal-dmd');
  var lastFocus = null;

  function openModal(c) {
    lastFocus = document.activeElement;
    mTitle.textContent = c.title;
    mPrompt.textContent = c.prompt;
    mLeta.src = c.leta;
    mDmd.src = c.dmd;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
    if (!reduceMotion) {
      [mLeta, mDmd].forEach(function (v) { var p = v.play(); if (p) p.catch(function () {}); });
    }
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    [mLeta, mDmd].forEach(function (v) {
      v.pause();
      v.removeAttribute('src');
      v.load();
    });
    if (lastFocus) lastFocus.focus();
  }

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-id]');
    if (!btn) return;
    var c = CASES.find(function (x) { return String(x.id) === btn.dataset.id; });
    if (c) openModal(c);
  });

  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;

    if (e.key === 'Escape') { closeModal(); return; }

    // Keep tab focus inside the dialog while it is open.
    if (e.key !== 'Tab') return;
    var focusable = modal.querySelectorAll('button, video[controls], [href]');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---------- pending links ----------
     The paper is not released yet, so those buttons carry an empty href.
     Swallow the click so the browser does not reload the page. */

  document.querySelectorAll('[data-pending]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------- nav: smooth top link + current section ---------- */

  document.querySelectorAll('a[href="#top"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.hash); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.toggleAttribute('aria-current', a.hash === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- copy BibTeX ---------- */

  var copyBtn = document.getElementById('copy-cite');
  copyBtn.addEventListener('click', function () {
    var text = document.getElementById('cite-text').textContent;
    var done = function () {
      copyBtn.textContent = 'Copied';
      copyBtn.classList.add('ok');
      setTimeout(function () {
        copyBtn.textContent = copyBtn.dataset.label;
        copyBtn.classList.remove('ok');
      }, 1600);
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(done, function () {
        copyBtn.textContent = 'Press ⌘C';
      });
    } else {
      var sel = window.getSelection();
      var range = document.createRange();
      range.selectNodeContents(document.getElementById('cite-text'));
      sel.removeAllRanges();
      sel.addRange(range);
      copyBtn.textContent = 'Press ⌘C';
    }
  });
})();
