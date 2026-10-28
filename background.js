// Service worker: menyediakan akses tab untuk fitur Pindah Tab (content script tidak bisa mengakses chrome.tabs)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg.type !== 'string' || !sender.tab) return false;
  const windowId = sender.tab.windowId;

  if (msg.type === 'tv-list-tabs') {
    chrome.tabs.query({ windowId }, (tabs) => {
      sendResponse({
        tabs: tabs
          .sort((a, b) => a.index - b.index)
          .map((t) => ({
            id: t.id,
            title: t.title || t.url || 'Tab',
            url: t.url || '',
            favIconUrl: t.favIconUrl || '',
            active: !!t.active,
            audible: !!t.audible,
            muted: !!(t.mutedInfo && t.mutedInfo.muted)
          }))
      });
    });
    return true;
  }

  if (msg.type === 'tv-activate-tab' && typeof msg.id === 'number') {
    chrome.tabs.update(msg.id, { active: true }, () => {
      void chrome.runtime.lastError;
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'tv-close-tab' && typeof msg.id === 'number') {
    chrome.tabs.remove(msg.id, () => {
      void chrome.runtime.lastError;
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'tv-cycle-tab') {
    const dir = msg.dir === -1 ? -1 : 1;
    chrome.tabs.query({ windowId }, (tabs) => {
      tabs.sort((a, b) => a.index - b.index);
      const cur = tabs.findIndex((t) => t.active);
      if (cur < 0 || tabs.length < 2) {
        sendResponse({ ok: false });
        return;
      }
      const next = tabs[(cur + dir + tabs.length) % tabs.length];
      chrome.tabs.update(next.id, { active: true }, () => {
        void chrome.runtime.lastError;
        sendResponse({ ok: true, title: next.title || '', index: next.index + 1, total: tabs.length });
      });
    });
    return true;
  }

  return false;
});
