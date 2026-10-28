/**
 * RemoteTV D-Pad - Popup Controller
 * Manifest V3 compatible, Internationalized (id/en/auto), Dark Android-TV theme
 */

(function () {
  'use strict';

  // ============================================================
  // 1. Konfigurasi & Default Settings
  // ============================================================
  // Tombol donasi disembunyikan selama URL kosong. Isi dengan link donasi (mis. https://buymeacoffee.com/username) untuk menampilkannya.
  const DONATE_URL = '';
  const SETTINGS_KEY = 'tvRemoteSettings';
  const DEFAULT_SETTINGS = {
    enabled: true,
    sound: true,
    osd: true,
    autoSkip: true,
    focusMemory: true,
    autoHideFocus: true,
    tabSwitcher: true,
    seekSeconds: 10,    // 5, 10, 15, 30
    volumeStep: 10,     // 5, 10, 20
    ringColor: '#00e5ff', // #00e5ff, #76ff03, #ffea00, #ff4081, #b388ff, #ffffff
    disabledSites: [],
    language: 'id'      // 'auto', 'id', 'en'
  };

  const VALID_SEEK = [5, 10, 15, 30];
  const VALID_VOLUME = [5, 10, 20];
  const VALID_COLORS = ['#00e5ff', '#76ff03', '#ffea00', '#ff4081', '#b388ff', '#ffffff'];
  const VALID_LANGUAGES = ['auto', 'id', 'en'];

  let currentSettings = Object.assign({}, DEFAULT_SETTINGS);
  let currentHostname = null;
  let isHostnameSupported = false;
  let toastTimer = null;
  let resetConfirmTimer = null;

  // Translation helper wrapper
  function t(key, params) {
    if (typeof window !== 'undefined' && typeof window.t === 'function') {
      return window.t(key, params);
    }
    return key;
  }

  // ============================================================
  // 2. Storage & Chrome API Abstraction
  // ============================================================
  const storage = {
    get(callback) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(SETTINGS_KEY, (res) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            callback(sanitizeSettings(null));
            return;
          }
          callback(sanitizeSettings(res && res[SETTINGS_KEY]));
        });
      } else {
        // Fallback browser lokal (pengujian standalone)
        try {
          const raw = localStorage.getItem(SETTINGS_KEY);
          callback(sanitizeSettings(raw ? JSON.parse(raw) : null));
        } catch (_) {
          callback(sanitizeSettings(null));
        }
      }
    },

    set(newSettings, callback) {
      const sanitized = sanitizeSettings(newSettings);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ [SETTINGS_KEY]: sanitized }, () => {
          if (callback) callback();
        });
      } else {
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitized));
        } catch (_) {}
        if (callback) callback();
      }
    }
  };

  function sanitizeSettings(data) {
    const s = Object.assign({}, DEFAULT_SETTINGS, data || {});
    if (!Array.isArray(s.disabledSites)) s.disabledSites = [];
    if (!VALID_SEEK.includes(s.seekSeconds)) s.seekSeconds = 10;
    if (!VALID_VOLUME.includes(s.volumeStep)) s.volumeStep = 10;
    if (!VALID_COLORS.includes(s.ringColor)) s.ringColor = '#00e5ff';
    if (!VALID_LANGUAGES.includes(s.language)) s.language = 'id';
    s.enabled = Boolean(s.enabled);
    s.sound = Boolean(s.sound);
    s.osd = Boolean(s.osd);
    s.autoSkip = Boolean(s.autoSkip);
    s.focusMemory = Boolean(s.focusMemory);
    s.autoHideFocus = Boolean(s.autoHideFocus);
    s.tabSwitcher = Boolean(s.tabSwitcher);
    return s;
  }

  // ============================================================
  // 3. Helper Visual & Theme
  // ============================================================
  function hexToRgba(hex, alpha) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return `rgba(0, 229, 255, ${alpha})`;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  function getPerceivedBrightness(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return 200;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  function applyAccentTheme(color) {
    const root = document.documentElement;
    root.style.setProperty('--accent', color);
    root.style.setProperty('--accent-glow', hexToRgba(color, 0.35));
    root.style.setProperty('--accent-surface', hexToRgba(color, 0.12));

    const brightness = getPerceivedBrightness(color);
    const textOnAccent = brightness > 140 ? '#07111b' : '#ffffff';
    root.style.setProperty('--accent-text', textOnAccent);

    // Update hex code display
    const codeTag = document.getElementById('ring-color-code');
    if (codeTag) codeTag.textContent = color;
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message || t('toastSaved');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 1500);
  }

  // ============================================================
  // 4. Tab Hostname Query
  // ============================================================
  function detectActiveTabHostname(callback) {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          callback(null, false);
          return;
        }
        const activeTab = tabs && tabs[0];
        if (!activeTab || !activeTab.url) {
          callback(null, false);
          return;
        }
        try {
          const url = new URL(activeTab.url);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            callback(url.hostname, true);
          } else {
            callback(url.protocol.replace(':', ''), false);
          }
        } catch (_) {
          callback(null, false);
        }
      });
    } else {
      // Preview lokal / mock
      callback('youtube.com', true);
    }
  }

  // ============================================================
  // 5. Render UI State
  // ============================================================
  function renderUI(settings) {
    // 5.0 Apply i18n dictionary to DOM attributes
    if (typeof window !== 'undefined' && typeof window.applyLanguage === 'function') {
      window.applyLanguage(settings.language);
    }

    // 5.1 Manifest Version
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
        const manifest = chrome.runtime.getManifest();
        if (manifest && manifest.version) {
          const verEl = document.getElementById('app-version');
          if (verEl) verEl.textContent = `v${manifest.version}`;
        }
      }
    } catch (_) {}

    // 5.2 Accent Theme
    applyAccentTheme(settings.ringColor);

    // 5.3 Master Switch & Status
    const masterSwitch = document.getElementById('master-switch');
    const masterStatus = document.getElementById('master-status');
    const settingsSections = document.getElementById('settings-sections');

    if (masterSwitch && masterStatus && settingsSections) {
      masterSwitch.setAttribute('aria-checked', String(settings.enabled));
      if (settings.enabled) {
        masterSwitch.classList.add('is-checked');
        masterStatus.textContent = t('masterStatusActive');
        masterStatus.classList.remove('is-off');
        settingsSections.classList.remove('is-disabled');
      } else {
        masterSwitch.classList.remove('is-checked');
        masterStatus.textContent = t('masterStatusInactive');
        masterStatus.classList.add('is-off');
        settingsSections.classList.add('is-disabled');
      }
    }

    // 5.4 Card Situs Ini
    const siteBadge = document.getElementById('site-hostname-badge');
    const siteToggle = document.getElementById('toggle-site');
    const siteDesc = document.getElementById('site-desc');

    if (siteBadge && siteToggle && siteDesc) {
      if (isHostnameSupported && currentHostname) {
        siteBadge.textContent = currentHostname;
        siteBadge.classList.remove('unsupported');
        siteToggle.disabled = false;
        siteToggle.removeAttribute('aria-disabled');

        const isSiteActive = !settings.disabledSites.includes(currentHostname);
        siteToggle.setAttribute('aria-checked', String(isSiteActive));
        siteToggle.classList.toggle('is-checked', isSiteActive);
        siteDesc.textContent = isSiteActive
          ? t('siteDescActive')
          : t('siteDescDisabled');
      } else {
        siteBadge.textContent = t('siteUnsupported');
        siteBadge.classList.add('unsupported');
        siteToggle.disabled = true;
        siteToggle.setAttribute('aria-disabled', 'true');
        siteToggle.classList.remove('is-checked');
        siteToggle.setAttribute('aria-checked', 'false');
        siteDesc.textContent = t('siteDescUnsupported');
      }
    }

    // 5.5 Card Fitur Switches
    const featureKeys = ['sound', 'osd', 'autoSkip', 'focusMemory', 'autoHideFocus', 'tabSwitcher'];
    featureKeys.forEach((key) => {
      const toggleBtn = document.querySelector(`.feature-item button[data-key="${key}"]`);
      if (toggleBtn) {
        const val = Boolean(settings[key]);
        toggleBtn.setAttribute('aria-checked', String(val));
        toggleBtn.classList.toggle('is-checked', val);
      }
    });

    // 5.6 Card Kontrol Video (Segmented)
    const seekDisplay = document.getElementById('seek-value-display');
    if (seekDisplay) seekDisplay.textContent = t('seekUnit', { val: settings.seekSeconds });

    const seekButtons = document.querySelectorAll('#seek-segmented .segment-btn');
    seekButtons.forEach((btn) => {
      const val = parseInt(btn.dataset.value, 10);
      const isSelected = (val === settings.seekSeconds);
      btn.setAttribute('aria-checked', String(isSelected));
      btn.classList.toggle('is-active', isSelected);
    });

    const volDisplay = document.getElementById('volume-value-display');
    if (volDisplay) volDisplay.textContent = t('volumeUnit', { val: settings.volumeStep });

    const volButtons = document.querySelectorAll('#volume-segmented .segment-btn');
    volButtons.forEach((btn) => {
      const val = parseInt(btn.dataset.value, 10);
      const isSelected = (val === settings.volumeStep);
      btn.setAttribute('aria-checked', String(isSelected));
      btn.classList.toggle('is-active', isSelected);
    });

    // 5.7 Card Warna Fokus (Swatches)
    const swatchButtons = document.querySelectorAll('.swatch-btn');
    swatchButtons.forEach((btn) => {
      const col = btn.dataset.color;
      const isSelected = (col.toLowerCase() === settings.ringColor.toLowerCase());
      btn.setAttribute('aria-checked', String(isSelected));
      btn.classList.toggle('is-selected', isSelected);

      // Icon color contrast
      const checkIcon = btn.querySelector('.check-icon');
      if (checkIcon) {
        const brightness = getPerceivedBrightness(col);
        checkIcon.style.color = brightness > 140 ? '#0f172a' : '#ffffff';
      }
    });

    // 5.8 Card Bahasa (Segmented)
    const langButtons = document.querySelectorAll('#language-segmented .segment-btn');
    langButtons.forEach((btn) => {
      const val = btn.dataset.value;
      const isSelected = (val === settings.language);
      btn.setAttribute('aria-checked', String(isSelected));
      btn.classList.toggle('is-active', isSelected);
    });

    // 5.9 Reset Button Text (if not currently in confirming state)
    const btnReset = document.getElementById('btn-reset');
    const btnResetText = document.getElementById('btn-reset-text');
    if (btnResetText && (!btnReset || btnReset.dataset.confirming !== 'true')) {
      btnResetText.textContent = t('btnReset');
    }
  }

  // ============================================================
  // 6. Action Handlers & Event Listeners
  // ============================================================
  function saveCurrentSettings(customToastMsg) {
    storage.set(currentSettings, () => {
      showToast(customToastMsg || t('toastSaved'));
    });
  }

  function setupEventListeners() {
    // 6.1 Tabs Switcher (Pengaturan / Panduan)
    const tabSettings = document.getElementById('tab-settings');
    const tabGuide = document.getElementById('tab-guide');
    const panelSettings = document.getElementById('panel-settings');
    const panelGuide = document.getElementById('panel-guide');

    function switchTab(activeTab, targetPanel, inactiveTab, inactivePanel) {
      activeTab.classList.add('active');
      activeTab.setAttribute('aria-selected', 'true');
      inactiveTab.classList.remove('active');
      inactiveTab.setAttribute('aria-selected', 'false');

      targetPanel.classList.add('active');
      targetPanel.removeAttribute('hidden');
      inactivePanel.classList.remove('active');
      inactivePanel.setAttribute('hidden', '');
    }

    if (tabSettings && tabGuide && panelSettings && panelGuide) {
      tabSettings.addEventListener('click', () => {
        switchTab(tabSettings, panelSettings, tabGuide, panelGuide);
      });

      tabGuide.addEventListener('click', () => {
        switchTab(tabGuide, panelGuide, tabSettings, panelSettings);
      });

      // Keyboard arrow navigation on tablist
      [tabSettings, tabGuide].forEach((tab) => {
        tab.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            if (tab === tabSettings) {
              tabGuide.focus();
              switchTab(tabGuide, panelGuide, tabSettings, panelSettings);
            } else {
              tabSettings.focus();
              switchTab(tabSettings, panelSettings, tabGuide, panelGuide);
            }
          }
        });
      });
    }

    // 6.2 Master Global Toggle
    const masterSwitch = document.getElementById('master-switch');
    if (masterSwitch) {
      masterSwitch.addEventListener('click', () => {
        currentSettings.enabled = !currentSettings.enabled;
        renderUI(currentSettings);
        saveCurrentSettings(currentSettings.enabled ? t('toastRemoteEnabled') : t('toastRemoteDisabled'));
      });
    }

    // 6.3 Site Toggle
    const siteToggle = document.getElementById('toggle-site');
    if (siteToggle) {
      siteToggle.addEventListener('click', () => {
        if (!isHostnameSupported || !currentHostname) return;

        const isCurrentlyDisabled = currentSettings.disabledSites.includes(currentHostname);
        if (isCurrentlyDisabled) {
          // Enable this site: remove from disabledSites
          currentSettings.disabledSites = currentSettings.disabledSites.filter((h) => h !== currentHostname);
        } else {
          // Disable this site: add to disabledSites
          currentSettings.disabledSites.push(currentHostname);
        }

        renderUI(currentSettings);
        const isSiteActive = !currentSettings.disabledSites.includes(currentHostname);
        saveCurrentSettings(isSiteActive ? t('toastSiteActive') : t('toastSiteDisabled'));
      });
    }

    // 6.4 Feature Toggles
    const featureButtons = document.querySelectorAll('.feature-item button[data-key]');
    featureButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (typeof currentSettings[key] === 'boolean') {
          currentSettings[key] = !currentSettings[key];
          renderUI(currentSettings);
          saveCurrentSettings();
        }
      });
    });

    // 6.5 Seek Seconds Segmented Control
    const seekButtons = document.querySelectorAll('#seek-segmented .segment-btn');
    seekButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.value, 10);
        if (VALID_SEEK.includes(val) && currentSettings.seekSeconds !== val) {
          currentSettings.seekSeconds = val;
          renderUI(currentSettings);
          saveCurrentSettings(t('toastSeek', { val }));
        }
      });
    });

    // 6.6 Volume Step Segmented Control
    const volButtons = document.querySelectorAll('#volume-segmented .segment-btn');
    volButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.value, 10);
        if (VALID_VOLUME.includes(val) && currentSettings.volumeStep !== val) {
          currentSettings.volumeStep = val;
          renderUI(currentSettings);
          saveCurrentSettings(t('toastVolume', { val }));
        }
      });
    });

    // 6.7 Color Swatches
    const swatchButtons = document.querySelectorAll('.swatch-btn');
    swatchButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        if (VALID_COLORS.includes(color) && currentSettings.ringColor !== color) {
          currentSettings.ringColor = color;
          renderUI(currentSettings);
          saveCurrentSettings(t('toastColorUpdated'));
        }
      });
    });

    // 6.8 Language Segmented Control
    const langButtons = document.querySelectorAll('#language-segmented .segment-btn');
    langButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        if (VALID_LANGUAGES.includes(val) && currentSettings.language !== val) {
          currentSettings.language = val;
          renderUI(currentSettings);
          saveCurrentSettings(t('toastLanguageUpdated'));
        }
      });
    });

    // 6.9 Reset Button (Two-step confirmation without alert())
    const btnReset = document.getElementById('btn-reset');
    const btnResetText = document.getElementById('btn-reset-text');

    if (btnReset && btnResetText) {
      btnReset.addEventListener('click', () => {
        if (btnReset.dataset.confirming === 'true') {
          // Step 2: Konfirmasi reset
          clearTimeout(resetConfirmTimer);
          delete btnReset.dataset.confirming;
          btnReset.classList.remove('btn-confirm-danger');

          // Reset settings
          currentSettings = Object.assign({}, DEFAULT_SETTINGS, {
            // Kita reset semua ke default
            disabledSites: []
          });

          renderUI(currentSettings);
          btnResetText.textContent = t('btnReset');
          saveCurrentSettings(t('toastReset'));
        } else {
          // Step 1: Minta konfirmasi
          btnReset.dataset.confirming = 'true';
          btnResetText.textContent = t('btnResetConfirm');
          btnReset.classList.add('btn-confirm-danger');

          clearTimeout(resetConfirmTimer);
          resetConfirmTimer = setTimeout(() => {
            delete btnReset.dataset.confirming;
            btnResetText.textContent = t('btnReset');
            btnReset.classList.remove('btn-confirm-danger');
          }, 3500);
        }
      });
    }

    // 6.10 Donate Button
    const btnDonate = document.getElementById('btn-donate');
    if (btnDonate && !DONATE_URL) {
      btnDonate.style.display = 'none';
      const donateNote = document.querySelector('.donate-note');
      if (donateNote) donateNote.style.display = 'none';
    } else if (btnDonate) {
      btnDonate.href = DONATE_URL;
      btnDonate.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: DONATE_URL });
        } else {
          window.open(DONATE_URL, '_blank');
        }
      });
    }

    // 6.11 Listen to External Storage Changes (sync with background / other tabs)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes[SETTINGS_KEY]) {
          currentSettings = sanitizeSettings(changes[SETTINGS_KEY].newValue);
          renderUI(currentSettings);
        }
      });
    }
  }

  // ============================================================
  // 7. Initialization
  // ============================================================
  function init() {
    setupEventListeners();

    // Deteksi hostname tab aktif
    detectActiveTabHostname((hostname, isSupported) => {
      currentHostname = hostname;
      isHostnameSupported = isSupported;

      // Ambil pengaturan yang tersimpan
      storage.get((loadedSettings) => {
        currentSettings = loadedSettings;
        renderUI(currentSettings);
      });
    });
  }

  // Jalankan saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
