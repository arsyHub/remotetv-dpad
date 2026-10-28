/**
 * RemoteTV D-Pad - Internationalization (i18n) Module
 * Supports Indonesian ('id') and English ('en') with automatic browser detection ('auto')
 */

var I18N = {
  id: {
    // App & Header
    appTitle: 'RemoteTV D-Pad',
    appSubtitle: 'Android TV Navigation',
    masterStatusActive: 'Aktif',
    masterStatusInactive: 'Nonaktif',
    masterSwitchAriaLabel: 'Aktifkan remot TV secara global',

    // Tabs
    tabsNavAriaLabel: 'Navigasi Menu',
    tabSettings: 'Pengaturan',
    tabGuide: 'Panduan',

    // Card 1: Situs Ini
    cardSiteTitle: 'Situs Ini',
    siteToggleLabel: 'Aktifkan di situs ini',
    siteToggleAriaLabel: 'Aktifkan di situs ini',
    siteDescInitial: 'Navigasi remot bekerja pada tab aktif',
    siteDescActive: 'Navigasi remot bekerja pada situs ini',
    siteDescDisabled: 'Remot dinonaktifkan khusus untuk situs ini',
    siteUnsupported: 'Halaman ini tidak didukung',
    siteDescUnsupported: 'Remot hanya aktif di halaman web (http/https)',
    loading: 'Memuat...',

    // Card 2: Fitur Remot
    featuresSectionTitle: 'Fitur Remot',
    featSoundLabel: 'Efek Suara Navigasi',
    featSoundDesc: 'Bunyi klik halus saat berpindah elemen',
    featSoundAriaLabel: 'Efek suara navigasi',

    featOsdLabel: 'Tampilan OSD Video',
    featOsdDesc: 'Indikator layar saat volume & seek berubah',
    featOsdAriaLabel: 'Tampilan OSD video',

    featAutoSkipLabel: 'Auto-Skip Iklan & Intro',
    featAutoSkipDesc: 'Otomatis lewati iklan video jika tersedia',
    featAutoSkipAriaLabel: 'Auto-skip iklan dan intro',

    featFocusMemoryLabel: 'Ingat Posisi Fokus Terakhir',
    featFocusMemoryDesc: 'Kembalikan fokus elemen saat tombol kembali',
    featFocusMemoryAriaLabel: 'Ingat posisi fokus terakhir',

    featAutoHideFocusLabel: 'Sembunyikan Fokus Otomatis',
    featAutoHideFocusDesc: 'Hilangkan kotak fokus saat video diputar',
    featAutoHideFocusAriaLabel: 'Sembunyikan fokus otomatis saat menonton',

    featTabSwitcherLabel: 'Pindah Tab',
    featTabSwitcherDesc: 'T = daftar tab, [ dan ] = tab sebelumnya / berikutnya',
    featTabSwitcherAriaLabel: 'Pindah tab dengan keyboard',

    // Card 3: Kontrol Video
    videoSectionTitle: 'Kontrol Video',
    seekLabel: 'Lompatan Waktu (Seek)',
    seekAriaLabel: 'Durasi lompatan waktu',
    seekUnit: '{val} dtk',
    seek5: '5 dtk',
    seek10: '10 dtk',
    seek15: '15 dtk',
    seek30: '30 dtk',
    volumeLabel: 'Langkah Volume',
    volumeAriaLabel: 'Besar langkah volume',
    volumeUnit: '{val} %',
    vol5: '5 %',
    vol10: '10 %',
    vol20: '20 %',

    // Card 4: Warna Fokus
    colorSectionTitle: 'Warna Fokus',
    colorSwatchesAriaLabel: 'Pilihan warna ring fokus',
    colorCyanAria: 'Warna Cyan (#00e5ff)',
    colorGreenAria: 'Warna Hijau Terang (#76ff03)',
    colorYellowAria: 'Warna Kuning (#ffea00)',
    colorPinkAria: 'Warna Merah Muda (#ff4081)',
    colorPurpleAria: 'Warna Ungu Pastel (#b388ff)',
    colorWhiteAria: 'Warna Putih (#ffffff)',
    previewLabel: 'Pratinjau Ring Fokus:',
    mockFocusTag: 'FOKUS AKTIF',

    // Card 5: Bahasa
    languageSectionTitle: 'Bahasa',
    languageAriaLabel: 'Pilihan bahasa antarmuka',
    langAuto: 'Otomatis',
    langId: 'Indonesia',
    langEn: 'English',

    // Footer
    btnDonate: 'Traktir Kopi',
    donateNote: 'Gratis & open source. Dukung pengembangan jika bermanfaat.',
    btnReset: 'Reset ke Default',
    btnResetConfirm: 'Yakin ingin reset? Klik lagi',
    syncNote: 'Pengaturan disinkronkan ke akun Chrome Anda',

    // Tab 2: Panduan - Section 1
    guideNavTitle: 'Navigasi D-Pad',
    guideNavArrows: 'Pindah antar thumbnail / tombol (satu card = satu perhentian terdekat)',
    guideNavEnter: 'OK / Klik elemen yang sedang disorot fokus',
    guideNavBackspace: 'Kembali (keluar dari fullscreen atau kembali ke halaman web sebelumnya)',

    // Tab 2: Panduan - Section 2
    guideModeTitle: 'Mode Navigasi & Video',
    guideModeIntro: 'Remot memiliki dua mode operasi:',
    guideModePage: 'Navigasi Halaman (Default)',
    guideModeVideo: 'Kontrol Video',
    guideModeTabP: 'Berpindah langsung antara Mode Navigasi & Kontrol Video',
    guideVideoActiveTitle: 'Saat Mode Kontrol Video Aktif:',
    guideVideoArrows: 'Mundur / Maju video sesuai pengaturan detik',
    guideVideoVolume: 'Naikkan / Turunkan volume suara',
    guideVideoPlayPause: 'Putar atau jeda video (Play / Pause)',

    // Tab 2: Panduan - Section 3
    guideShortcutsTitle: 'Tombol Pintasan Cepat',
    guideKeyF: 'Beralih Layar Penuh (Fullscreen)',
    guideKeyM: 'Bisu atau Aktifkan Suara (Mute / Unmute)',
    guideKeyC: 'Nyalakan atau Matikan Subtitle / Teks (CC)',
    guideKeyS: 'Buka dan fokus langsung ke Kolom Pencarian',
    guideKeyT: 'Buka daftar tab: ↑ ↓ pilih, Enter pindah, Delete tutup tab, Esc batal',
    guideKeyBrackets: 'Langsung ke tab sebelumnya / berikutnya',
    guideKeyEsc: 'Keluar dari kolom ketik / tutup popup modal',

    // Tab 2: Panduan - Section 4
    guideTipsTitle: 'Tips Penggunaan Remot',
    guideTip1Pre: 'Tekan',
    guideTip1Post: 'pada kolom input teks untuk mulai mengetik kata kunci.',
    guideTip2Pre: 'Tekan',
    guideTip2Mid: 'atau tombol panah',
    guideTip2Post: 'saat selesai mengetik untuk kembali ke navigasi D-Pad.',
    guideTip3Pre: 'Posisi fokus Anda akan pulih secara otomatis saat kembali menggunakan',
    guideTip3Post: '.',
    guideTip4: 'Bar kontrol player video tetap tampil otomatis selama fokus D-Pad berada di tombol pemutar.',
    wordOr: 'atau',

    // Toasts
    toastSaved: 'Tersimpan ✓',
    toastRemoteEnabled: 'Remot Diaktifkan ✓',
    toastRemoteDisabled: 'Remot Dinonaktifkan',
    toastSiteActive: 'Aktif di situs ini ✓',
    toastSiteDisabled: 'Nonaktif di situs ini',
    toastSeek: 'Seek: {val} dtk ✓',
    toastVolume: 'Volume: {val}% ✓',
    toastColorUpdated: 'Warna diperbarui ✓',
    toastReset: 'Pengaturan direset ✓',
    toastLanguageUpdated: 'Bahasa diperbarui ✓'
  },

  en: {
    // App & Header
    appTitle: 'RemoteTV D-Pad',
    appSubtitle: 'Android TV Navigation',
    masterStatusActive: 'Active',
    masterStatusInactive: 'Inactive',
    masterSwitchAriaLabel: 'Enable TV remote globally',

    // Tabs
    tabsNavAriaLabel: 'Menu Navigation',
    tabSettings: 'Settings',
    tabGuide: 'Guide',

    // Card 1: This Site
    cardSiteTitle: 'This Site',
    siteToggleLabel: 'Enable on this site',
    siteToggleAriaLabel: 'Enable on this site',
    siteDescInitial: 'Remote navigation works on active tab',
    siteDescActive: 'Remote navigation works on this site',
    siteDescDisabled: 'Remote disabled specifically for this site',
    siteUnsupported: 'This page is not supported',
    siteDescUnsupported: 'Remote is only active on web pages (http/https)',
    loading: 'Loading...',

    // Card 2: Remote Features
    featuresSectionTitle: 'Remote Features',
    featSoundLabel: 'Navigation Sound Effects',
    featSoundDesc: 'Subtle click sound when moving between elements',
    featSoundAriaLabel: 'Navigation sound effects',

    featOsdLabel: 'Video OSD Display',
    featOsdDesc: 'On-screen indicator when volume & seek change',
    featOsdAriaLabel: 'Video OSD display',

    featAutoSkipLabel: 'Auto-Skip Ads & Intro',
    featAutoSkipDesc: 'Automatically skip video ads when available',
    featAutoSkipAriaLabel: 'Auto-skip ads and intro',

    featFocusMemoryLabel: 'Remember Last Focus Position',
    featFocusMemoryDesc: 'Restore element focus on back button',
    featFocusMemoryAriaLabel: 'Remember last focus position',

    featAutoHideFocusLabel: 'Auto-Hide Focus',
    featAutoHideFocusDesc: 'Hide focus outline while video is playing',
    featAutoHideFocusAriaLabel: 'Auto-hide focus while watching',

    featTabSwitcherLabel: 'Tab Switcher',
    featTabSwitcherDesc: 'T = tab list, [ and ] = previous / next tab',
    featTabSwitcherAriaLabel: 'Switch tabs with keyboard',

    // Card 3: Video Controls
    videoSectionTitle: 'Video Controls',
    seekLabel: 'Seek Duration',
    seekAriaLabel: 'Seek duration',
    seekUnit: '{val} sec',
    seek5: '5 sec',
    seek10: '10 sec',
    seek15: '15 sec',
    seek30: '30 sec',
    volumeLabel: 'Volume Step',
    volumeAriaLabel: 'Volume step size',
    volumeUnit: '{val} %',
    vol5: '5 %',
    vol10: '10 %',
    vol20: '20 %',

    // Card 4: Focus Color
    colorSectionTitle: 'Focus Color',
    colorSwatchesAriaLabel: 'Focus ring color selection',
    colorCyanAria: 'Cyan color (#00e5ff)',
    colorGreenAria: 'Bright Green color (#76ff03)',
    colorYellowAria: 'Yellow color (#ffea00)',
    colorPinkAria: 'Pink color (#ff4081)',
    colorPurpleAria: 'Pastel Purple color (#b388ff)',
    colorWhiteAria: 'White color (#ffffff)',
    previewLabel: 'Focus Ring Preview:',
    mockFocusTag: 'FOCUS ACTIVE',

    // Card 5: Language
    languageSectionTitle: 'Language',
    languageAriaLabel: 'Interface language selection',
    langAuto: 'Auto',
    langId: 'Indonesia',
    langEn: 'English',

    // Footer
    btnDonate: 'Buy Me a Coffee',
    donateNote: 'Free & open source. Support development if you find it useful.',
    btnReset: 'Reset to Default',
    btnResetConfirm: 'Are you sure? Click again',
    syncNote: 'Settings are synced to your Chrome account',

    // Tab 2: Guide - Section 1
    guideNavTitle: 'D-Pad Navigation',
    guideNavArrows: 'Move between thumbnails / buttons (one card = nearest stop)',
    guideNavEnter: 'OK / Click the currently focused element',
    guideNavBackspace: 'Back (exit fullscreen or return to previous web page)',

    // Tab 2: Guide - Section 2
    guideModeTitle: 'Navigation & Video Modes',
    guideModeIntro: 'The remote has two operating modes:',
    guideModePage: 'Page Navigation (Default)',
    guideModeVideo: 'Video Control',
    guideModeTabP: 'Switch directly between Navigation & Video Control Modes',
    guideVideoActiveTitle: 'When Video Control Mode is Active:',
    guideVideoArrows: 'Seek backward / forward by configured seconds',
    guideVideoVolume: 'Increase / Decrease audio volume',
    guideVideoPlayPause: 'Play or pause video (Play / Pause)',

    // Tab 2: Guide - Section 3
    guideShortcutsTitle: 'Quick Shortcuts',
    guideKeyF: 'Toggle Fullscreen',
    guideKeyM: 'Mute or Unmute Audio',
    guideKeyC: 'Turn Subtitles / Captions On or Off (CC)',
    guideKeyS: 'Open and focus directly on Search Box',
    guideKeyT: 'Open tab list: ↑ ↓ select, Enter switch, Delete close tab, Esc cancel',
    guideKeyBrackets: 'Jump directly to previous / next tab',
    guideKeyEsc: 'Exit input field / close modal popup',

    // Tab 2: Guide - Section 4
    guideTipsTitle: 'Remote Usage Tips',
    guideTip1Pre: 'Press',
    guideTip1Post: 'on any text input field to start typing keywords.',
    guideTip2Pre: 'Press',
    guideTip2Mid: 'or arrow key',
    guideTip2Post: 'when finished typing to return to D-Pad navigation.',
    guideTip3Pre: 'Your focus position will be automatically restored when going back using',
    guideTip3Post: '.',
    guideTip4: 'Video player controls remain visible automatically while D-Pad focus is on player buttons.',
    wordOr: 'or',

    // Toasts
    toastSaved: 'Saved ✓',
    toastRemoteEnabled: 'Remote Enabled ✓',
    toastRemoteDisabled: 'Remote Disabled',
    toastSiteActive: 'Active on this site ✓',
    toastSiteDisabled: 'Disabled on this site',
    toastSeek: 'Seek: {val} sec ✓',
    toastVolume: 'Volume: {val}% ✓',
    toastColorUpdated: 'Color updated ✓',
    toastReset: 'Settings reset ✓',
    toastLanguageUpdated: 'Language updated ✓'
  }
};

var currentResolvedLang = 'id';

function resolveLanguage(lang) {
  if (lang === 'id' || lang === 'en') {
    return lang;
  }
  var nav = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language.toLowerCase() : '';
  return nav.startsWith('id') ? 'id' : 'en';
}

function t(key, params) {
  var dict = (I18N && I18N[currentResolvedLang]) || (I18N && I18N.id) || {};
  var str = dict[key] !== undefined ? dict[key] : ((I18N && I18N.id && I18N.id[key]) !== undefined ? I18N.id[key] : key);
  if (params && typeof params === 'object') {
    var keys = Object.keys(params);
    for (var i = 0; i < keys.length; i++) {
      var pKey = keys[i];
      str = str.replace(new RegExp('\\{' + pKey + '\\}', 'g'), params[pKey]);
    }
  }
  return str;
}

function applyLanguage(lang) {
  var resolved = resolveLanguage(lang);
  currentResolvedLang = resolved;

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = resolved;
    var dict = (I18N && I18N[resolved]) || (I18N && I18N.id) || {};

    var textElements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textElements.length; i++) {
      var el = textElements[i];
      var key = el.getAttribute('data-i18n');
      if (key && dict[key] !== undefined) {
        el.textContent = dict[key];
      }
    }

    var ariaElements = document.querySelectorAll('[data-i18n-aria]');
    for (var j = 0; j < ariaElements.length; j++) {
      var aEl = ariaElements[j];
      var aKey = aEl.getAttribute('data-i18n-aria');
      if (aKey && dict[aKey] !== undefined) {
        aEl.setAttribute('aria-label', dict[aKey]);
      }
    }

    var titleElements = document.querySelectorAll('[data-i18n-title]');
    for (var k = 0; k < titleElements.length; k++) {
      var tEl = titleElements[k];
      var tKey = tEl.getAttribute('data-i18n-title');
      if (tKey && dict[tKey] !== undefined) {
        tEl.setAttribute('title', dict[tKey]);
      }
    }
  }

  return resolved;
}

// Export for global access
if (typeof window !== 'undefined') {
  window.I18N = I18N;
  window.resolveLanguage = resolveLanguage;
  window.t = t;
  window.applyLanguage = applyLanguage;
}
if (typeof globalThis !== 'undefined') {
  globalThis.I18N = I18N;
  globalThis.resolveLanguage = resolveLanguage;
  globalThis.t = t;
  globalThis.applyLanguage = applyLanguage;
}
