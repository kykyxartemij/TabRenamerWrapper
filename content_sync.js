// content_sync.js
// Injected into matching pages (localhost) to notify the parent frame about location changes.
(function(){
  try {
    function notify() {
      // Gather favicon from page if present and resolve it
      let favicon = null;
      try {
        const el = document.querySelector('link[rel~="icon"]') || document.querySelector('link[rel*="icon"]');
        if (el?.href) favicon = (new URL(el.href, location.href)).href;
      } catch (error__) {
        console.debug('favicon detection failed', error__);
      }
      if (!favicon) {
        try { favicon = location.origin + '/favicon.ico'; } catch (error__) { console.debug('favicon default failed', error__); }
      }

      // Post message to parent; targetOrigin '*' used because extension origin is unknown here.
      // parent is the wrapper page; use '*' here but wrapper will validate origin
      window.parent.postMessage({ type: 'wrapper:location', href: location.href, favicon }, '*');
    }

    // Monkey-patch history methods
    const _push = history.pushState;
    history.pushState = function() {
      const res = _push.apply(this, arguments);
      notify();
      return res;
    };

    const _replace = history.replaceState;
    history.replaceState = function() {
      const res = _replace.apply(this, arguments);
      notify();
      return res;
    };

    globalThis.addEventListener('popstate', notify);

    // Initial notify
    notify();
  } catch (e) {
    // defensive
    console.debug('content_sync failed', e);
  }
})();
