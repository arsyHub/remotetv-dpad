(function () {
  // ==========================================
  // 0. Pengaturan (disinkronkan dengan popup via chrome.storage.sync)
  // ==========================================
  const SETTINGS_KEY = 'tvRemoteSettings';
  const DEFAULT_SETTINGS = {
    enabled: true,
    sound: true,
    osd: true,
    autoSkip: true,
    focusMemory: true,
    autoHideFocus: true,
    tabSwitcher: true,
    language: 'id',
    seekSeconds: 10,
    volumeStep: 10,
    ringColor: '#00e5ff',
    disabledSites: []
  };
  let settings = Object.assign({}, DEFAULT_SETTINGS);

  function applySettings(stored) {
    settings = Object.assign({}, DEFAULT_SETTINGS, stored || {});
    if (!Array.isArray(settings.disabledSites)) settings.disabledSites = [];
  }

  // ==========================================
  // Bahasa (teks sumber = Indonesia, diterjemahkan ke English bila dipilih)
  // ==========================================
  const EN_TEXT = {
    'Posisi Terakhir Dipulihkan': 'Last position restored',
    'Iklan Dilewati Otomatis': 'Ad skipped automatically',
    'Intro Dilewati Otomatis': 'Intro skipped automatically',
    'Tekan Enter untuk Episode Berikutnya': 'Press Enter for next episode',
    'Tidak bisa membaca daftar tab (muat ulang ekstensi/tab)': "Can't read the tab list (reload the extension/tab)",
    'Mode Kontrol Video (Panah = Volume & Seek)': 'Video Control Mode (Arrows = Volume & Seek)',
    'Mode Navigasi Halaman (Panah = Pilih Elemen)': 'Page Navigation Mode (Arrows = Select Element)',
    'Hanya ada satu tab': 'Only one tab is open',
    'Layar Penuh': 'Fullscreen',
    'Keluar Layar Penuh': 'Exit Fullscreen',
    'Bisu (Muted)': 'Muted',
    'Suara Aktif': 'Sound On',
    'Subtitle Dinonaktifkan': 'Subtitles Off',
    'Subtitle Diaktifkan': 'Subtitles On',
    'Mode Pencarian Aktif': 'Search Mode Active',
    'Putar (Play)': 'Play',
    'Jeda (Pause)': 'Pause',
    'Pindah Tab': 'Switch Tab',
    'tab ini': 'this tab',
    '↑ ↓ pilih   •   Enter pindah   •   Delete tutup tab   •   Esc batal': '↑ ↓ select   •   Enter switch   •   Delete close tab   •   Esc cancel'
  };

  function currentLang() {
    let l = settings.language;
    if (l === 'auto') {
      l = (navigator.language || 'id').toLowerCase().startsWith('id') ? 'id' : 'en';
    }
    return l === 'en' ? 'en' : 'id';
  }

  function L(text) {
    if (currentLang() !== 'en' || typeof text !== 'string') return text;
    if (EN_TEXT[text]) return EN_TEXT[text];
    let m = /^Mundur (\d+) dtk$/.exec(text);
    if (m) return 'Rewind ' + m[1] + ' sec';
    m = /^Maju (\d+) dtk$/.exec(text);
    if (m) return 'Forward ' + m[1] + ' sec';
    return text;
  }

  function isActive() {
    return settings.enabled && !settings.disabledSites.includes(location.hostname);
  }

  function hexToRgba(hex, alpha) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return 'rgba(0, 229, 255, ' + alpha + ')';
    const n = parseInt(m[1], 16);
    return 'rgba(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ', ' + alpha + ')';
  }

  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(SETTINGS_KEY, (res) => {
        if (chrome.runtime && chrome.runtime.lastError) return;
        applySettings(res && res[SETTINGS_KEY]);
      });
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync' && changes[SETTINGS_KEY]) {
          applySettings(changes[SETTINGS_KEY].newValue);
        }
      });
    }
  } catch (_) {}

  // ==========================================
  // 1. Injeksi Style & Kotak Fokus Android TV
  // ==========================================
  function injectStyles() {
    if (document.getElementById('tv-remote-style')) return;
    const target = document.head || document.documentElement;
    if (!target) return;

    const style = document.createElement('style');
    style.id = 'tv-remote-style';
    style.textContent = `
      .tv-remote-focus {
        /* penanda saja; tampilan ring digambar oleh overlay #tv-remote-ring */
      }
      #tv-remote-ring {
        position: fixed;
        pointer-events: none;
        z-index: 2147483646;
        box-sizing: border-box;
        border: 4px solid #00e5ff;
        border-radius: 8px;
        box-shadow: 0 0 25px rgba(0, 229, 255, 0.85), inset 0 0 12px rgba(0, 229, 255, 0.25);
        transition: left 0.08s ease-out, top 0.08s ease-out, width 0.08s ease-out, height 0.08s ease-out, opacity 0.3s ease;
        display: none;
      }
      #tv-remote-tabs {
        position: fixed; inset: 0; z-index: 2147483647;
        background: rgba(5, 8, 12, 0.72); backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      }
      #tv-remote-tabs .tvt-panel {
        width: min(600px, 92vw); max-height: 78vh; display: flex; flex-direction: column;
        background: #131a24; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 18px;
        box-shadow: 0 24px 70px rgba(0,0,0,0.7); padding: 18px; color: #fff;
      }
      #tv-remote-tabs .tvt-title { font-size: 18px; font-weight: 700; margin: 0 4px 12px; }
      #tv-remote-tabs .tvt-list { overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: 4px; }
      #tv-remote-tabs .tvt-item {
        display: flex; align-items: center; gap: 14px; padding: 10px 14px;
        border-radius: 12px; background: #1b2431; border: 2px solid transparent;
      }
      #tv-remote-tabs .tvt-item.tvt-current .tvt-sub { color: #9bb0c7; }
      #tv-remote-tabs .tvt-item.tvt-selected {
        background: #223044; border-color: var(--tvt-accent, #00e5ff);
        box-shadow: 0 0 18px var(--tvt-glow, rgba(0,229,255,0.6));
      }
      #tv-remote-tabs .tvt-icon {
        width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0; background: #2b3a50;
        display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; overflow: hidden;
      }
      #tv-remote-tabs .tvt-icon img { width: 22px; height: 22px; }
      #tv-remote-tabs .tvt-info { min-width: 0; }
      #tv-remote-tabs .tvt-name { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #tv-remote-tabs .tvt-sub { font-size: 12px; color: #7f93ab; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #tv-remote-tabs .tvt-hint { margin: 12px 4px 0; font-size: 12px; color: #7f93ab; text-align: center; }
      .tv-remote-idle #tv-remote-ring {
        opacity: 0;
      }
      .tv-remote-idle,
      .tv-remote-idle video,
      .tv-remote-idle .html5-video-player,
      .tv-remote-idle [data-uia="video-canvas"] {
        cursor: none !important;
      }
      /* Paksa control bar player tetap tampil saat fokus D-Pad ada di dalamnya */
      .tv-remote-keep-controls .ytp-chrome-bottom,
      .tv-remote-keep-controls .ytp-chrome-top,
      .tv-remote-keep-controls .ytp-gradient-bottom,
      .tv-remote-keep-controls .ytp-gradient-top {
        opacity: 1 !important;
        display: block !important;
        visibility: visible !important;
      }
      .tv-remote-keep-controls.ytp-autohide .ytp-chrome-bottom {
        opacity: 1 !important;
      }
    `;
    target.appendChild(style);
  }
  injectStyles();
  if (!document.getElementById('tv-remote-style')) {
    document.addEventListener('DOMContentLoaded', injectStyles);
  }

  // ==========================================
  // 2. Efek Suara Navigasi (Web Audio API)
  // ==========================================
  let audioCtx = null;
  function getAudioContext() {
    try {
      if (!audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          audioCtx = new AudioCtxClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch (_) {}
    return audioCtx;
  }

  // Siapkan AudioContext sedini mungkin pada interaksi pengguna (kebijakan autoplay Chrome)
  ['keydown', 'pointerdown', 'mousedown', 'click'].forEach((evt) => {
    window.addEventListener(evt, () => { getAudioContext(); }, true);
  });

  function beep(ctx, startFreq, endFreq, duration, peakGain, wave) {
    const now = ctx.currentTime + 0.005;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq !== startFreq) {
      osc.frequency.linearRampToValueAtTime(endFreq, now + duration);
    }
    // Envelope halus (attack singkat, release) agar terdengar jelas tanpa "klik"
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.008);
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playSound(type) {
    if (!settings.sound || !isActive()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const run = () => {
        if (type === 'move') {
          beep(ctx, 520, 700, 0.06, 0.22, 'sine');
        } else if (type === 'select') {
          beep(ctx, 600, 900, 0.12, 0.28, 'triangle');
        } else if (type === 'back') {
          beep(ctx, 520, 320, 0.1, 0.25, 'sine');
        } else if (type === 'action') {
          beep(ctx, 700, 700, 0.07, 0.22, 'sine');
        }
      };
      if (ctx.state === 'running') {
        run();
      } else {
        ctx.resume().then(run).catch(() => {});
      }
    } catch (_) {}
  }
  // ==========================================
  // 3. On-Screen Display (OSD) ala Android TV
  // ==========================================
  let osdEl = null;
  let osdTimer = null;

  function ensureOSDContainer() {
    if (!osdEl) {
      osdEl = document.createElement('div');
      osdEl.id = 'tv-remote-osd';
      osdEl.style.cssText = `
        position: fixed;
        top: 36px;
        right: 36px;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        background: rgba(15, 20, 28, 0.92);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1.5px solid rgba(0, 229, 255, 0.45);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 18px rgba(0, 229, 255, 0.3);
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.3px;
        pointer-events: none;
        opacity: 0;
        transform: translateY(-10px) scale(0.96);
        transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      `;
    }
    const targetParent = document.fullscreenElement || document.body || document.documentElement;
    if (targetParent && osdEl.parentNode !== targetParent) {
      targetParent.appendChild(osdEl);
    }
    return osdEl;
  }

  function showOSD(icon, text, progress = null) {
    if (!settings.osd || !isActive()) return;
    text = L(text);
    try {
      const el = ensureOSDContainer();
      if (!el) return;

      let progressBarHtml = '';
      if (typeof progress === 'number' && !isNaN(progress)) {
        const clampProg = Math.max(0, Math.min(100, Math.round(progress)));
        progressBarHtml = `
          <div style="width: 100px; height: 6px; background: rgba(255, 255, 255, 0.2); border-radius: 3px; overflow: hidden; margin-left: 6px; flex-shrink: 0;">
            <div style="width: ${clampProg}%; height: 100%; background: #00e5ff; border-radius: 3px; box-shadow: 0 0 8px #00e5ff; transition: width 0.12s ease;"></div>
          </div>
        `;
      }

      el.innerHTML = `
        <span style="font-size: 20px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon}</span>
        <span style="white-space: nowrap; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${text}</span>
        ${progressBarHtml}
      `;

      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) scale(1)';
      });

      if (osdTimer) clearTimeout(osdTimer);
      osdTimer = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px) scale(0.96)';
      }, 1600);
    } catch (_) {}
  }

  // ==========================================
  // 4. State & Helper URL / Watch Detection
  // ==========================================
  let currentFocus = null;
  let lastUrl = location.href;
  let isUserTyping = false;

  function checkWatchUrl() {
    const path = location.pathname;
    const host = location.hostname;
    return (host.includes('youtube.com') && (path.startsWith('/watch') || path.startsWith('/shorts'))) ||
           (host.includes('netflix.com') && path.startsWith('/watch'));
  }

  // Default: Mode Navigasi Halaman. Mode Kontrol Video hanya aktif jika pengguna menekan Tab / P.
  let isPlayerControlMode = false;

  document.addEventListener('fullscreenchange', () => {
    const targetParent = document.fullscreenElement || document.body || document.documentElement;
    if (osdEl && targetParent && osdEl.parentNode !== targetParent) {
      targetParent.appendChild(osdEl);
    }

  });

  // ==========================================
  // 5. Auto-Hide Idle Timer saat Menonton
  // ==========================================
  let idleTimer = null;

  function isAnyVideoPlaying() {
    const videos = document.querySelectorAll('video');
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (!v.paused && !v.ended && v.currentTime > 0) {
        return true;
      }
    }
    return false;
  }

  function resetIdleTimer() {
    if (document.documentElement.classList.contains('tv-remote-idle')) {
      document.documentElement.classList.remove('tv-remote-idle');
    }
    if (idleTimer) clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
      if (!settings.autoHideFocus || !isActive()) return;
      if (keepPlayer) return;
      if (isAnyVideoPlaying()) {
        document.documentElement.classList.add('tv-remote-idle');
      }
    }, 3000);
  }

  window.addEventListener('keydown', resetIdleTimer, true);
  window.addEventListener('mousemove', resetIdleTimer, true);
  window.addEventListener('pointerdown', resetIdleTimer, true);

  // ==========================================
  // 6. Ingat Posisi Fokus Terakhir (Focus History)
  // ==========================================
  const FOCUS_STORAGE_KEY = 'tv_remote_focus_memory';

  function saveFocusHistory() {
    if (!currentFocus || !settings.focusMemory || !isActive()) return;
    try {
      let raw = sessionStorage.getItem(FOCUS_STORAGE_KEY);
      let memory = raw ? JSON.parse(raw) : {};

      const tag = currentFocus.tagName.toLowerCase();
      let href = currentFocus.getAttribute('href');
      if (!href) {
        const innerLink = currentFocus.querySelector('a[href]');
        if (innerLink) href = innerLink.getAttribute('href');
      }

      const text = (currentFocus.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);

      memory[location.href] = {
        href: href || null,
        text: text || null,
        tag: tag,
        scrollY: Math.round(window.scrollY),
        time: Date.now()
      };

      const keys = Object.keys(memory);
      if (keys.length > 50) {
        delete memory[keys[0]];
      }

      sessionStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(memory));
    } catch (_) {}
  }

  let restoreToken = 0;

  function restoreFocusHistory() {
    if (!settings.focusMemory || !isActive()) return;
    try {
      const raw = sessionStorage.getItem(FOCUS_STORAGE_KEY);
      if (!raw) return;
      const memory = JSON.parse(raw);
      const saved = memory[location.href];
      if (!saved) return;

      const token = ++restoreToken;
      const startUrl = location.href;
      let scrolled = false;
      let tries = 0;

      function findMatch() {
        // Cari langsung di seluruh dokumen (tidak dibatasi viewport)
        if (saved.href) {
          const anchors = document.querySelectorAll('a[href]');
          for (const a of anchors) {
            if (a.getAttribute('href') !== saved.href) continue;
            const r = a.getBoundingClientRect();
            if (r.width < 10 || r.height < 10) continue;
            return a;
          }
        }
        if (saved.text && saved.text.length > 3) {
          const cands = document.querySelectorAll(NAVIGABLE_SELECTOR);
          for (const el of cands) {
            const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
            if (txt === saved.text && el.tagName.toLowerCase() === saved.tag) {
              const r = el.getBoundingClientRect();
              if (r.width >= 10 && r.height >= 10) return el;
            }
          }
        }
        return null;
      }

      function attempt() {
        // Batalkan jika sudah pindah halaman / ada restore baru / pengguna sudah navigasi sendiri
        if (token !== restoreToken || location.href !== startUrl || userNavigatedSinceRestore) return;
        tries++;

        if (!scrolled && typeof saved.scrollY === 'number' && saved.scrollY > 0) {
          window.scrollTo({ top: saved.scrollY, behavior: 'auto' });
          scrolled = true;
        }

        const matched = findMatch();
        if (matched) {
          // Pulihkan ke card induknya (bukan link judul di dalamnya)
          const card = matched.closest && matched.closest(CARD_SELECTORS);
          setFocus(card || matched);
          showOSD('🔙', 'Posisi Terakhir Dipulihkan');
          return;
        }
        if (tries < 20) setTimeout(attempt, 300);
      }

      userNavigatedSinceRestore = false;
      setTimeout(attempt, 150);
    } catch (_) {}
  }

  // Jika pengguna sudah menekan tombol panah sendiri, jangan paksa restore fokus
  let userNavigatedSinceRestore = false;
  window.addEventListener('keydown', (e) => {
    if (e.key.startsWith('Arrow')) userNavigatedSinceRestore = true;
  }, true);

  // Event navigasi internal YouTube (SPA)
  document.addEventListener('yt-navigate-finish', () => {
    lastUrl = location.href;
    // mode tidak diubah otomatis saat pindah halaman
    restoreFocusHistory();
  });

  window.addEventListener('popstate', () => {
    lastUrl = location.href;
    // mode tidak diubah otomatis saat pindah halaman
    restoreFocusHistory();
  });

  // Reset fokus jika halaman berpindah URL (SPA / navigasi)
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      isUserTyping = false;
      clearFocus();
      // mode tidak diubah otomatis saat pindah halaman
      restoreFocusHistory();
    }
  }, 300);

  // Restore fokus saat load pertama
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreFocusHistory);
  } else {
    restoreFocusHistory();
  }

  // Aktifkan mode ketik jika pengguna mengklik langsung kolom input
  window.addEventListener('pointerdown', (e) => {
    isUserTyping = isEditingText(e.target);
  }, true);

  const PLAYER_SELECTOR = '.html5-video-player, [data-uia="video-canvas"], [data-uia="controls-standard"], .watch-video';
  let keepPlayer = null;

  function releasePlayerControls() {
    if (keepPlayer) {
      keepPlayer.classList.remove('tv-remote-keep-controls');
      keepPlayer = null;
    }
  }

  // Jaga control bar player (YouTube/Netflix) tetap terlihat selama fokus berada di dalamnya
  function keepPlayerControlsVisible() {
    const player = currentFocus && currentFocus.closest ? currentFocus.closest(PLAYER_SELECTOR) : null;
    if (!player) {
      releasePlayerControls();
      return;
    }
    if (keepPlayer !== player) {
      releasePlayerControls();
      keepPlayer = player;
      player.classList.add('tv-remote-keep-controls');
    }
    player.classList.remove('ytp-autohide');
    try {
      const r = player.getBoundingClientRect();
      player.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        clientX: r.left + r.width / 2,
        clientY: r.bottom - 20
      }));
    } catch (_) {}
  }
  setInterval(keepPlayerControlsVisible, 500);

  // ==========================================
  // Ring fokus overlay & pemulihan fokus (mis. Netflix mengganti card saat di-hover/fokus)
  // ==========================================
  let ringEl = null;
  let lastRect = null;
  let lastFocusSig = null;

  function ensureRing() {
    if (!ringEl) {
      ringEl = document.createElement('div');
      ringEl.id = 'tv-remote-ring';
    }
    const parent = document.fullscreenElement || document.documentElement;
    if (parent && ringEl.parentNode !== parent) parent.appendChild(ringEl);
    return ringEl;
  }

  function updateRing() {
    const ring = ensureRing();
    if (!isActive()) {
      if (currentFocus) clearFocus();
      releasePlayerControls();
      ring.style.display = 'none';
      return;
    }
    ring.style.borderColor = settings.ringColor;
    ring.style.boxShadow = '0 0 25px ' + hexToRgba(settings.ringColor, 0.85) + ', inset 0 0 12px ' + hexToRgba(settings.ringColor, 0.25);
    if (currentFocus && currentFocus.isConnected) {
      const r = currentFocus.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        lastRect = { left: r.left, top: r.top, width: r.width, height: r.height };
        const pad = 4;
        ring.style.display = 'block';
        ring.style.left = (r.left - pad) + 'px';
        ring.style.top = (r.top - pad) + 'px';
        ring.style.width = (r.width + pad * 2) + 'px';
        ring.style.height = (r.height + pad * 2) + 'px';
        return;
      }
    }
    ring.style.display = 'none';
  }

  function rememberSig(el) {
    try {
      const a = el.matches && el.matches('a[href]') ? el : (el.querySelector && el.querySelector('a[href]'));
      lastFocusSig = {
        href: a ? a.getAttribute('href') : null,
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)
      };
    } catch (_) {}
  }

  // Jika elemen fokus terlepas dari DOM (re-render SPA), cari penggantinya
  function recoverFocus(items) {
    if (!lastRect) return false;
    const list = items || getNavigableElements();
    if (!list.length) return false;

    let target = null;
    if (lastFocusSig && lastFocusSig.href) {
      target = list.find(i => {
        const a = i.el.matches('a[href]') ? i.el : i.el.querySelector('a[href]');
        return a && a.getAttribute('href') === lastFocusSig.href;
      });
    }
    if (!target) {
      const cx = lastRect.left + lastRect.width / 2;
      const cy = lastRect.top + lastRect.height / 2;
      let best = Infinity;
      for (const i of list) {
        const d = Math.hypot(i.rect.left + i.rect.width / 2 - cx, i.rect.top + i.rect.height / 2 - cy);
        if (d < best) { best = d; target = i; }
      }
    }
    if (target) {
      setFocus(target.el);
      return true;
    }
    return false;
  }

  function ringLoop() {
    if (isActive() && currentFocus && !currentFocus.isConnected) {
      recoverFocus();
    }
    updateRing();
    requestAnimationFrame(ringLoop);
  }
  requestAnimationFrame(ringLoop);

  function clearFocus() {
    if (currentFocus) {
      currentFocus.classList.remove('tv-remote-focus');
      currentFocus = null;
    }
  }

  // ==========================================
  // 7. Auto-Skip Iklan & Intro / Next Episode
  // ==========================================
  let lastAdSkipTime = 0;
  let lastIntroSkipTime = 0;
  let lastNextEpFocusTime = 0;

  function checkAutoSkipAndFocus() {
    if (!settings.autoSkip || !isActive()) return;
    const now = Date.now();

    // 1. YouTube Skip Ad
    if (now - lastAdSkipTime > 2500) {
      const ytAdSkipSelectors = [
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-modern',
        '.ytp-skip-ad-button',
        '[id^="skip-button"] button',
        '.ytp-ad-skip-button-container button'
      ];
      for (const sel of ytAdSkipSelectors) {
        const btn = document.querySelector(sel);
        if (btn) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(btn).display !== 'none' && window.getComputedStyle(btn).visibility !== 'hidden') {
            btn.click();
            lastAdSkipTime = now;
            showOSD('⏭️', 'Iklan Dilewati Otomatis');
            break;
          }
        }
      }
    }

    // 2. Netflix Skip Intro / Recap
    if (now - lastIntroSkipTime > 2500) {
      const netflixSkipSelectors = [
        '[data-uia="player-skip-intro"]',
        '[data-uia="player-skip-recap"]',
        '[data-uia="player-skip-preplay"]',
        'button[aria-label*="Skip Intro" i]',
        'button[aria-label*="Lewati Intro" i]'
      ];
      for (const sel of netflixSkipSelectors) {
        const btn = document.querySelector(sel);
        if (btn) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(btn).display !== 'none' && window.getComputedStyle(btn).visibility !== 'hidden') {
            btn.click();
            lastIntroSkipTime = now;
            showOSD('⏭️', 'Intro Dilewati Otomatis');
            break;
          }
        }
      }
    }

    // 3. Netflix / YouTube Next Episode button
    const nextEpSelectors = [
      '[data-uia="next-episode-seamless-button"]',
      '[data-uia="next-episode-seamless-button-draining"]'
    ];
    for (const sel of nextEpSelectors) {
      const btn = document.querySelector(sel);
      if (btn) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(btn).display !== 'none' && window.getComputedStyle(btn).visibility !== 'hidden') {
          if (currentFocus !== btn && (now - lastNextEpFocusTime > 4000)) {
            setFocus(btn);
            lastNextEpFocusTime = now;
            showOSD('⏭️', 'Tekan Enter untuk Episode Berikutnya');
          }
          break;
        }
      }
    }
  }

  setInterval(checkAutoSkipAndFocus, 600);

  // ==========================================
  // 8. Helper Text Input & Actionable
  // ==========================================
  const TEXT_INPUT_TYPES = new Set(['', 'text', 'search', 'email', 'password', 'tel', 'url', 'number']);

  function isEditingText(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea') return !el.readOnly && !el.disabled;
    if (tag === 'input') {
      const type = (el.getAttribute('type') || el.type || 'text').toLowerCase();
      return TEXT_INPUT_TYPES.has(type) && !el.readOnly && !el.disabled;
    }
    return false;
  }

  function isTyping() {
    if (!isEditingText(document.activeElement)) {
      isUserTyping = false;
      return false;
    }
    return isUserTyping;
  }

  function isActionable(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'a' && el.hasAttribute('href')) return true;
    if (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'summary') return true;
    const role = el.getAttribute('role');
    if (['button', 'link', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'checkbox', 'radio', 'switch'].includes(role)) {
      return true;
    }
    return false;
  }

  // ==========================================
  // 9. Mengatur Fokus Elemen & Navigasi Universal
  // ==========================================
  function setFocus(el) {
    if (!el) return;
    clearFocus();
    currentFocus = el;
    currentFocus.classList.add('tv-remote-focus');
    isUserTyping = false;
    keepPlayerControlsVisible();
    rememberSig(el);


    if (isEditingText(el)) {
      if (document.activeElement && document.activeElement !== document.body && document.activeElement !== el) {
        try {
          document.activeElement.blur();
        } catch (_) {}
      }
    } else {
      try {
        el.focus({ preventScroll: true });
      } catch (_) {}
    }

    try {
      currentFocus.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } catch (_) {}
  }

  // Satu card thumbnail = satu perhentian D-Pad (elemen di dalamnya seperti judul, avatar, menu diabaikan)
  const CARD_SELECTORS = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-playlist-video-renderer',
    'ytd-playlist-renderer',
    'ytd-compact-playlist-renderer',
    'ytd-reel-item-renderer',
    'ytd-channel-renderer',
    'ytd-movie-renderer',
    'yt-lockup-view-model',
    'ytm-shorts-lockup-view-model',
    '.slider-item',
    '.title-card-container',
    '.title-card'
  ].join(', ');

  const NAVIGABLE_SELECTOR = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    'summary',
    'details',
    'video[controls]',
    'audio[controls]',
    '[role="button"]',
    '[role="link"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="menuitemcheckbox"]',
    '[role="menuitemradio"]',
    '[role="option"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="combobox"]',
    '[role="searchbox"]',
    '[role="treeitem"]',
    '[onclick]',
    '[tabindex]:not([tabindex="-1"])',
    CARD_SELECTORS
  ].join(', ');

  const CARD_WRAPPER_SELECTORS = CARD_SELECTORS;

  function deduplicateElements(items) {
    if (items.length <= 1) return items;

    const toRemove = new Set();
    const n = items.length;

    for (let i = 0; i < n; i++) {
      if (toRemove.has(i)) continue;
      const a = items[i];

      for (let j = i + 1; j < n; j++) {
        if (toRemove.has(j)) continue;
        const b = items[j];

        const aContainsB = a.el.contains(b.el);
        const bContainsA = b.el.contains(a.el);

        if (!aContainsB && !bContainsA) {
          const cdx = Math.abs((a.rect.left + a.rect.width / 2) - (b.rect.left + b.rect.width / 2));
          const cdy = Math.abs((a.rect.top + a.rect.height / 2) - (b.rect.top + b.rect.height / 2));
          if (cdx < 8 && cdy < 8) {
            if (isActionable(b.el) && !isActionable(a.el)) {
              toRemove.add(i);
              break;
            } else {
              toRemove.add(j);
            }
          }
          continue;
        }

        const parent = aContainsB ? a : b;
        const child = aContainsB ? b : a;
        const parentIdx = aContainsB ? i : j;
        const childIdx = aContainsB ? j : i;

        const dx = Math.abs(parent.rect.left - child.rect.left);
        const dy = Math.abs(parent.rect.top - child.rect.top);
        const dw = Math.abs(parent.rect.width - child.rect.width);
        const dh = Math.abs(parent.rect.height - child.rect.height);

        const isSameBox = dx <= 15 && dy <= 15 && (dw <= 20 || dh <= 20);
        const isCardWrapper = parent.el.matches && parent.el.matches(CARD_WRAPPER_SELECTORS);
        const childActionable = isActionable(child.el);
        const parentActionable = isActionable(parent.el);

        if (isSameBox || (isCardWrapper && childActionable && dx <= 30 && dy <= 30)) {
          if (childActionable && !parentActionable) {
            toRemove.add(parentIdx);
            if (parentIdx === i) break;
          } else if (parentActionable && !childActionable) {
            toRemove.add(childIdx);
          } else {
            const childTag = child.el.tagName.toLowerCase();
            if (childTag === 'button' || childTag === 'input' || childTag === 'select') {
              toRemove.add(parentIdx);
              if (parentIdx === i) break;
            } else {
              toRemove.add(childIdx);
            }
          }
        }
      }
    }

    return items.filter((_, idx) => !toRemove.has(idx));
  }

  function getNavigableElements() {
    const rawCandidates = document.querySelectorAll(NAVIGABLE_SELECTOR);
    const validItems = [];
    const seen = new WeakSet();

    for (let i = 0; i < rawCandidates.length; i++) {
      const el = rawCandidates[i];
      if (seen.has(el)) continue;

      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;

      const rect = el.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) continue;
      if (rect.bottom < -300 || rect.top > window.innerHeight + 500) continue;
      if (rect.right < -300 || rect.left > window.innerWidth + 500) continue;

      const tag = el.tagName.toLowerCase();
      if (tag !== 'video' && rect.width > window.innerWidth * 0.98 && rect.height > window.innerHeight * 0.95) {
        continue;
      }

      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

      // Elemen di dalam card (judul, avatar, menu) tidak jadi perhentian sendiri
      const parentCard = el.parentElement && el.parentElement.closest(CARD_SELECTORS);
      if (parentCard) continue;

      seen.add(el);
      validItems.push({ el, rect });
    }

    return deduplicateElements(validItems);
  }

  // ==========================================
  // 10. Pengendali Media HTML5 Video
  // ==========================================
  function getActiveVideo() {
    if (document.fullscreenElement) {
      if (document.fullscreenElement.tagName && document.fullscreenElement.tagName.toLowerCase() === 'video') {
        return document.fullscreenElement;
      }
      const inside = document.fullscreenElement.querySelector('video');
      if (inside) return inside;
    }
    if (currentFocus && currentFocus.tagName && currentFocus.tagName.toLowerCase() === 'video') {
      return currentFocus;
    }
    return null;
  }

  function getVideoForControl() {
    return getActiveVideo() || document.querySelector('video');
  }

  // ==========================================
  // 11. Eksekusi Elemen & Navigasi Universal
  // ==========================================
  function activateElement(el) {
    if (!el) return;

    if (isEditingText(el)) {
      isUserTyping = true;
      el.focus();
      el.click();
      return;
    }

    const tag = el.tagName.toLowerCase();

    if (tag === 'select') {
      el.focus();
      if (typeof el.showPicker === 'function') {
        try {
          el.showPicker();
        } catch (_) {
          el.click();
        }
      } else {
        el.click();
      }
      return;
    }

    if (tag === 'video' || tag === 'audio') {
      if (el.paused) {
        el.play?.();
      } else {
        el.pause?.();
      }
      return;
    }

    if (tag === 'details') {
      const summary = el.querySelector('summary');
      if (summary) {
        summary.click();
      } else {
        el.open = !el.open;
      }
      return;
    }

    const standardInteractiveTags = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary']);
    if (!standardInteractiveTags.has(tag)) {
      const innerClickable =
        el.querySelector('a#thumbnail[href], a[href*="/watch"], a[href*="/shorts/"], a[href*="/playlist"], a[href*="/title/"], a[href]') ||
        el.querySelector('button');
      if (innerClickable) {
        innerClickable.click();
        return;
      }
    }

    el.click();
  }

  function moveDirection(dir) {
    const items = getNavigableElements();

    if (items.length === 0) {
      if (dir === 'ArrowDown') {
        window.scrollBy({ top: 300, behavior: 'smooth' });
      } else if (dir === 'ArrowUp') {
        window.scrollBy({ top: -300, behavior: 'smooth' });
      }
      return;
    }

    if (currentFocus && !currentFocus.isConnected && recoverFocus(items)) {
      return;
    }

    if (!currentFocus || !document.body.contains(currentFocus)) {
      const firstVisible = items.find(i => i.rect.top >= 0 && i.rect.top < window.innerHeight && i.rect.left >= 0 && i.rect.left < window.innerWidth) || items[0];
      setFocus(firstVisible.el);
      return;
    }

    const curRect = currentFocus.getBoundingClientRect();
    if (curRect.bottom < -100 || curRect.top > window.innerHeight + 100) {
      const onScreen = items.find(i => i.rect.top >= 0 && i.rect.top < window.innerHeight && i.rect.left >= 0 && i.rect.left < window.innerWidth);
      if (onScreen) {
        setFocus(onScreen.el);
        return;
      }
    }

    const cx = curRect.left + curRect.width / 2;
    const cy = curRect.top + curRect.height / 2;

    const pick = (strictPass) => {
    let bestCandidate = null;
    let bestScore = Infinity;

    for (const item of items) {
      if (item.el === currentFocus) continue;

      const tx = item.rect.left + item.rect.width / 2;
      const ty = item.rect.top + item.rect.height / 2;
      const dx = tx - cx;
      const dy = ty - cy;

      let valid = false;
      let score = Infinity;

      // Overlap satu sumbu (baris untuk kiri/kanan, kolom untuk atas/bawah)
      const rowOverlap = Math.min(item.rect.bottom, curRect.bottom) - Math.max(item.rect.top, curRect.top);
      const colOverlap = Math.min(item.rect.right, curRect.right) - Math.max(item.rect.left, curRect.left);
      const horizontal = dir === 'ArrowLeft' || dir === 'ArrowRight';
      const aligned = horizontal ? rowOverlap > Math.min(item.rect.height, curRect.height) * 0.3
                                 : colOverlap > Math.min(item.rect.width, curRect.width) * 0.3;
      if (strictPass && !aligned) continue;
      if (!horizontal && (tx < 0 || tx > window.innerWidth)) continue;

      if (dir === 'ArrowRight' && dx > 2) {
        valid = true;
        score = dx + Math.abs(dy) * 1.2;
      } else if (dir === 'ArrowLeft' && dx < -2) {
        valid = true;
        score = Math.abs(dx) + Math.abs(dy) * 1.2;
      } else if (dir === 'ArrowDown' && dy > 2) {
        valid = true;
        score = dy + Math.abs(dx) * 1.2;
      } else if (dir === 'ArrowUp' && dy < -2) {
        valid = true;
        score = Math.abs(dy) + Math.abs(dx) * 1.2;
      }

      if (valid && score < bestScore) {
        bestScore = score;
        bestCandidate = item.el;
      }
    }
    return bestCandidate;
    };

    // Prioritas: elemen sebaris (kiri/kanan) / sekolom (atas/bawah) seperti D-Pad TV asli.
    // Jika fokus sekarang adalah card thumbnail, tidak "melompat" ke baris lain saat kiri/kanan.
    const onCard = !!(currentFocus.matches && currentFocus.matches(CARD_SELECTORS));
    const isHorizontal = dir === 'ArrowLeft' || dir === 'ArrowRight';
    let bestCandidate = pick(true);
    if (!bestCandidate && !(onCard && isHorizontal)) {
      bestCandidate = pick(false);
    }

    if (bestCandidate) {
      setFocus(bestCandidate);
    } else if (isHorizontal) {
      // Ujung baris: tetap di tempat
    } else if (dir === 'ArrowDown') {
      window.scrollBy({ top: 300, behavior: 'smooth' });
    } else if (dir === 'ArrowUp') {
      window.scrollBy({ top: -300, behavior: 'smooth' });
    }
  }

  // ==========================================
  // 11b. Pindah Tab (overlay daftar tab ala pengalih aplikasi Android TV)
  // ==========================================
  let tabSwitcher = null; // { el, listEl, tabs, index }

  function bgMessage(msg, cb) {
    try {
      chrome.runtime.sendMessage(msg, (res) => {
        if (chrome.runtime.lastError) {
          if (cb) cb(null);
          return;
        }
        if (cb) cb(res);
      });
    } catch (_) {
      if (cb) cb(null);
    }
  }

  function openTabSwitcher() {
    if (tabSwitcher) return;
    bgMessage({ type: 'tv-list-tabs' }, (res) => {
      if (!res || !res.tabs || !res.tabs.length) {
        showOSD('⚠️', 'Tidak bisa membaca daftar tab (muat ulang ekstensi/tab)');
        return;
      }
      if (tabSwitcher) return;
      const el = document.createElement('div');
      el.id = 'tv-remote-tabs';
      el.style.setProperty('--tvt-accent', settings.ringColor);
      el.style.setProperty('--tvt-glow', hexToRgba(settings.ringColor, 0.55));
      const panel = document.createElement('div');
      panel.className = 'tvt-panel';
      const title = document.createElement('div');
      title.className = 'tvt-title';
      title.textContent = '🗂️ ' + L('Pindah Tab');
      const listEl = document.createElement('div');
      listEl.className = 'tvt-list';
      const hint = document.createElement('div');
      hint.className = 'tvt-hint';
      hint.textContent = L('↑ ↓ pilih   •   Enter pindah   •   Delete tutup tab   •   Esc batal');
      panel.append(title, listEl, hint);
      el.appendChild(panel);
      (document.fullscreenElement || document.documentElement).appendChild(el);

      const activeIdx = Math.max(0, res.tabs.findIndex((x) => x.active));
      tabSwitcher = { el, listEl, tabs: res.tabs, index: activeIdx };
      renderTabSwitcher();
      playSound('action');
    });
  }

  function renderTabSwitcher() {
    if (!tabSwitcher) return;
    const { listEl, tabs, index } = tabSwitcher;
    listEl.textContent = '';
    tabs.forEach((tab, i) => {
      const row = document.createElement('div');
      row.className = 'tvt-item' + (i === index ? ' tvt-selected' : '') + (tab.active ? ' tvt-current' : '');

      const icon = document.createElement('div');
      icon.className = 'tvt-icon';
      let host = '';
      try { host = new URL(tab.url).hostname; } catch (_) {}
      icon.textContent = ((host || tab.title || '?').replace(/^www\./, '')[0] || '?').toUpperCase();
      if (tab.favIconUrl) {
        const img = document.createElement('img');
        img.src = tab.favIconUrl;
        img.alt = '';
        img.onload = () => { icon.textContent = ''; icon.appendChild(img); };
      }

      const info = document.createElement('div');
      info.className = 'tvt-info';
      const name = document.createElement('div');
      name.className = 'tvt-name';
      name.textContent = tab.title;
      const sub = document.createElement('div');
      sub.className = 'tvt-sub';
      sub.textContent = (host || tab.url) + (tab.active ? '  •  ' + L('tab ini') : '') + (tab.audible ? '  •  🔊' : '');
      info.append(name, sub);

      row.append(icon, info);
      listEl.appendChild(row);
      if (i === index) {
        row.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function closeTabSwitcher() {
    if (!tabSwitcher) return;
    tabSwitcher.el.remove();
    tabSwitcher = null;
  }

  // Mengembalikan true jika tombol dikonsumsi (selama overlay terbuka, semua tombol ditahan)
  function handleTabSwitcherKey(e) {
    e.preventDefault();
    e.stopPropagation();
    const ts = tabSwitcher;
    if (!ts) return true;
    const k = e.key;

    if (k === 'ArrowDown') {
      ts.index = (ts.index + 1) % ts.tabs.length;
      playSound('move');
      renderTabSwitcher();
    } else if (k === 'ArrowUp') {
      ts.index = (ts.index - 1 + ts.tabs.length) % ts.tabs.length;
      playSound('move');
      renderTabSwitcher();
    } else if (k === 'Enter') {
      const target = ts.tabs[ts.index];
      playSound('select');
      closeTabSwitcher();
      if (target && !target.active) {
        bgMessage({ type: 'tv-activate-tab', id: target.id });
      }
    } else if (k === 'Delete' || k === 'x' || k === 'X') {
      const target = ts.tabs[ts.index];
      if (target && ts.tabs.length > 1) {
        playSound('back');
        bgMessage({ type: 'tv-close-tab', id: target.id });
        ts.tabs.splice(ts.index, 1);
        ts.index = Math.min(ts.index, ts.tabs.length - 1);
        if (target.active) {
          closeTabSwitcher();
          return true;
        }
        renderTabSwitcher();
      }
    } else if (k === 'Escape' || k === 'Backspace' || k === 't' || k === 'T') {
      playSound('back');
      closeTabSwitcher();
    }
    return true;
  }

  // ==========================================
  // 12. Shortcut Remote Cepat (F, M, C, S / /, Tab / P)
  // ==========================================
  function handleShortcuts(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    const key = e.key.toLowerCase();

    // Mode Toggle: Tab atau P
    if (e.key === 'Tab' || key === 'p') {
      e.preventDefault();
      e.stopPropagation();
      isPlayerControlMode = !isPlayerControlMode;
      if (isPlayerControlMode) {
        clearFocus();
        showOSD('🎮', 'Mode Kontrol Video (Panah = Volume & Seek)');
      } else {
        showOSD('🧭', 'Mode Navigasi Halaman (Panah = Pilih Elemen)');
        if (!currentFocus) {
          moveDirection('ArrowDown');
        }
      }
      playSound('action');
      return true;
    }

    // Pindah Tab: T (daftar tab), [ dan ] (tab sebelumnya / berikutnya)
    if (settings.tabSwitcher) {
      if (key === 't') {
        e.preventDefault();
        e.stopPropagation();
        openTabSwitcher();
        return true;
      }
      if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        e.stopPropagation();
        const dir = e.key === ']' ? 1 : -1;
        bgMessage({ type: 'tv-cycle-tab', dir }, (res) => {
          if (!res || !res.ok) showOSD('🗂️', 'Hanya ada satu tab');
        });
        playSound('action');
        return true;
      }
    }

    // Fullscreen: F
    if (key === 'f') {
      e.preventDefault();
      e.stopPropagation();
      playSound('action');

      const ytFsBtn = document.querySelector('.ytp-fullscreen-button');
      const netflixFsBtn = document.querySelector('[data-uia="control-fullscreen-enter"], [data-uia="control-fullscreen-exit"]');

      if (ytFsBtn) {
        ytFsBtn.click();
        setTimeout(() => {
          showOSD(document.fullscreenElement ? '⛶' : '🗗', document.fullscreenElement ? 'Layar Penuh' : 'Keluar Layar Penuh');
        }, 120);
        return true;
      }

      if (netflixFsBtn) {
        netflixFsBtn.click();
        setTimeout(() => {
          showOSD(document.fullscreenElement ? '⛶' : '🗗', document.fullscreenElement ? 'Layar Penuh' : 'Keluar Layar Penuh');
        }, 120);
        return true;
      }

      if (document.fullscreenElement) {
        document.exitFullscreen?.().then(() => {
          showOSD('🗗', 'Keluar Layar Penuh');
        }).catch(() => {});
      } else {
        const target = getVideoForControl() || document.documentElement;
        target.requestFullscreen?.().then(() => {
          showOSD('⛶', 'Layar Penuh');
        }).catch(() => {});
      }
      return true;
    }

    // Mute: M
    if (key === 'm') {
      e.preventDefault();
      e.stopPropagation();
      playSound('action');

      const ytMuteBtn = document.querySelector('.ytp-mute-button');
      if (ytMuteBtn) {
        ytMuteBtn.click();
        const vid = getVideoForControl();
        const isMuted = vid ? vid.muted : true;
        showOSD(isMuted ? '🔇' : '🔊', isMuted ? 'Bisu (Muted)' : 'Suara Aktif');
        return true;
      }

      const vid = getVideoForControl();
      if (vid) {
        vid.muted = !vid.muted;
        showOSD(vid.muted ? '🔇' : '🔊', vid.muted ? 'Bisu (Muted)' : 'Suara Aktif');
      }
      return true;
    }

    // Subtitle / CC: C
    if (key === 'c') {
      e.preventDefault();
      e.stopPropagation();
      playSound('action');

      const ytSubBtn = document.querySelector('.ytp-subtitles-button');
      if (ytSubBtn) {
        ytSubBtn.click();
        showOSD('💬', 'Subtitle / CC');
        return true;
      }

      const netflixSubBtn = document.querySelector('[data-uia="control-audio-subtitle"]');
      if (netflixSubBtn) {
        netflixSubBtn.click();
        showOSD('💬', 'Subtitle / CC');
        return true;
      }

      const vid = getVideoForControl();
      if (vid && vid.textTracks && vid.textTracks.length > 0) {
        let anyShowing = false;
        for (let i = 0; i < vid.textTracks.length; i++) {
          if (vid.textTracks[i].mode === 'showing') {
            anyShowing = true;
            break;
          }
        }
        for (let i = 0; i < vid.textTracks.length; i++) {
          vid.textTracks[i].mode = anyShowing ? 'hidden' : 'showing';
        }
        showOSD('💬', anyShowing ? 'Subtitle Dinonaktifkan' : 'Subtitle Diaktifkan');
      } else {
        showOSD('💬', 'Subtitle / CC');
      }
      return true;
    }

    // Search: S atau /
    if (key === 's' || key === '/') {
      e.preventDefault();
      e.stopPropagation();
      playSound('action');

      const searchSelector = 'input[type="search"], input[name="search_query"], input[name="q"], textarea[name="q"], [role="searchbox"], input[placeholder*="Search" i], input[placeholder*="Cari" i]';

      function focusSearchInput() {
        const candidates = document.querySelectorAll(searchSelector);
        for (let i = 0; i < candidates.length; i++) {
          const input = candidates[i];
          const rect = input.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(input).display !== 'none' && window.getComputedStyle(input).visibility !== 'hidden') {
            setFocus(input);
            isUserTyping = true;
            input.focus();
            showOSD('🔍', 'Mode Pencarian Aktif');
            return true;
          }
        }
        return false;
      }

      if (focusSearchInput()) return true;

      const launcher = document.querySelector('[data-uia="search-box-launcher"], .searchTab, button[aria-label*="Search" i], button[aria-label*="Cari" i]');
      if (launcher) {
        launcher.click();
        setTimeout(() => {
          if (!focusSearchInput()) {
            showOSD('🔍', 'Mode Pencarian Aktif');
          }
        }, 150);
        return true;
      }

      return true;
    }

    return false;
  }

  // ==========================================
  // 13. Event Listener Keyboard Utama
  // ==========================================
  window.addEventListener('keydown', (e) => {
    // 0. Ekstensi dimatikan (global / situs ini): biarkan halaman menangani tombol sendiri
    if (!isActive()) {
      if (tabSwitcher) closeTabSwitcher();
      return;
    }

    // Overlay Pindah Tab terbuka: tahan semua tombol
    if (tabSwitcher) {
      handleTabSwitcherKey(e);
      return;
    }

    // 1. Jika pengguna langsung mengetik huruf/angka pada input yang auto-focus
    if (!isUserTyping && isEditingText(document.activeElement) && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      isUserTyping = true;
      return;
    }

    // 2. Mode Mengetik
    if (isTyping()) {
      if (e.key === 'Escape' || e.key === 'ArrowDown') {
        e.preventDefault();
        isUserTyping = false;
        if (document.activeElement) {
          document.activeElement.blur();
        }
        if (e.key === 'ArrowDown') {
          moveDirection('ArrowDown');
        }
        return;
      }
      if (e.key === 'Enter' && document.activeElement.tagName.toLowerCase() === 'input') {
        isUserTyping = false;
      }
      return;
    }

    // 3. Shortcut Cepat (F, M, C, S / /, Tab / P)
    if (handleShortcuts(e)) {
      return;
    }

    // 4. Tombol Backspace sebagai tombol Back Android
    if (e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      playSound('back');
      saveFocusHistory();
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
        showOSD('🗗', 'Keluar Layar Penuh');
      } else {
        window.history.back();
      }
      return;
    }

    // 5. Player Control Mode vs D-Pad Navigasi Halaman
    const vid = getVideoForControl();
    const isPlayerMode = isPlayerControlMode && vid !== null;

    if (isPlayerMode && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      const isNetflixWatch = location.hostname.includes('netflix.com') && location.pathname.includes('/watch');

      if (e.key === 'ArrowLeft') {
        if (isNetflixWatch) {
          showOSD('⏪', 'Mundur ' + settings.seekSeconds + ' dtk');
          playSound('move');
          return;
        }
        vid.currentTime = Math.max(0, vid.currentTime - settings.seekSeconds);
        showOSD('⏪', 'Mundur ' + settings.seekSeconds + ' dtk');
        playSound('move');
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.key === 'ArrowRight') {
        if (isNetflixWatch) {
          showOSD('⏩', 'Maju ' + settings.seekSeconds + ' dtk');
          playSound('move');
          return;
        }
        vid.currentTime = Math.min(vid.duration || Infinity, vid.currentTime + settings.seekSeconds);
        showOSD('⏩', 'Maju ' + settings.seekSeconds + ' dtk');
        playSound('move');
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.key === 'ArrowUp') {
        vid.volume = Math.min(1, Math.round((vid.volume + settings.volumeStep / 100) * 100) / 100);
        vid.muted = false;
        const vol = Math.round(vid.volume * 100);
        showOSD('🔊', `Volume ${vol}%`, vol);
        playSound('move');
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.key === 'ArrowDown') {
        vid.volume = Math.max(0, Math.round((vid.volume - settings.volumeStep / 100) * 100) / 100);
        const vol = Math.round(vid.volume * 100);
        showOSD(vol === 0 ? '🔇' : '🔉', `Volume ${vol}%`, vol);
        playSound('move');
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }

    // 6. Navigasi D-Pad Spasial Normal
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      playSound('move');
      moveDirection(e.key);
      return;
    }

    // 7. Tombol Enter / OK
    if (e.key === 'Enter') {
      if (isPlayerMode && (!currentFocus || currentFocus === vid)) {
        e.preventDefault();
        e.stopPropagation();
        playSound('select');
        if (vid.paused) {
          vid.play?.();
          showOSD('▶️', 'Putar (Play)');
        } else {
          vid.pause?.();
          showOSD('⏸️', 'Jeda (Pause)');
        }
        return;
      }

      if (currentFocus) {
        e.preventDefault();
        e.stopPropagation();
        playSound('select');
        saveFocusHistory();
        activateElement(currentFocus);
        return;
      }

      if (vid) {
        e.preventDefault();
        e.stopPropagation();
        playSound('select');
        if (vid.paused) {
          vid.play?.();
          showOSD('▶️', 'Putar (Play)');
        } else {
          vid.pause?.();
          showOSD('⏸️', 'Jeda (Pause)');
        }
        return;
      }
    }

    // 8. Tombol Spasi (Play/Pause media pada fullscreen atau fokus video atau player mode)
    if (e.key === ' ' || e.key === 'Spacebar') {
      if (vid && (!currentFocus || currentFocus === vid || isPlayerMode)) {
        e.preventDefault();
        e.stopPropagation();
        playSound('select');
        if (vid.paused) {
          vid.play?.();
          showOSD('▶️', 'Putar (Play)');
        } else {
          vid.pause?.();
          showOSD('⏸️', 'Jeda (Pause)');
        }
        return;
      }
    }
  }, true);
})();
