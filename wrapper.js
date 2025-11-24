// wrapper.js - extracted from wrapper.html to comply with Manifest V3 CSP (no inline scripts)
(function(){
  try {
    const params = new URLSearchParams(location.search);
    const target = params.get('target') || '';
    const title = params.get('title') || target || 'Wrapped tab';

    // Set the document title (this is the key feature!)
    document.title = title;
    
    // Safely set text content to avoid XSS
    const titleElm = document.getElementById('titleElm');
    const urlElm = document.getElementById('urlElm');
    const container = document.getElementById('container');
    
    if (!titleElm || !urlElm || !container) {
      console.error('Required DOM elements not found');
      return;
    }
    
    titleElm.textContent = title;

    // Replace the url element content with an editable input + copy button + reload
    urlElm.textContent = '';
    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy';
    copyBtn.title = 'Copy URL';
    copyBtn.textContent = 'Copy';
    urlElm.appendChild(copyBtn);

    // URL input (editable)
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.value = target;
    urlInput.setAttribute('aria-label', 'Wrapped URL');
    urlElm.appendChild(urlInput);

    // (Removed the explicit 'Open' button — URL will update on Enter or on blur)

    // Declare iframe and related variables early so they can be referenced in functions below
    let iframe = null;
    let iframeLoaded = false;
    let urlInputDebounceTimer = null;

    // Copy behavior
    copyBtn.addEventListener('click', async () => {
      const text = urlInput.value;
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
      } catch (error__) {
        console.debug('navigator.clipboard.writeText failed, using fallback selection', error__);
        // Fallback (best-effort for older browsers): select the text and prompt user to press Ctrl/Cmd+C
        const ta = document.createElement('textarea');
        ta.value = text;
        // keep textarea off-screen to avoid layout shift
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        try {
          ta.select();
          copyBtn.textContent = 'Press Ctrl+C';
        } catch (error__) {
          console.warn('Copy fallback selection failed', error__);
        }
        // remove textarea after short delay and restore button text
        setTimeout(() => {
          ta.remove?.();
          copyBtn.textContent = 'Copy';
        }, 3500);
      }
    });

    // Helper to set iframe src safely
    function setIframeSrc(newUrl) {
      if (!iframe) return; // Guard against calling before iframe is created
      // rough validation: if missing protocol, add http://
      let resolved = newUrl.trim();
      if (!/^https?:\/\//i.test(resolved)) {
        resolved = 'http://' + resolved;
      }
      iframeLoaded = false;
      iframe.src = resolved;
      urlInput.value = resolved;
    }

    // Debounce helper for URL input changes
    function debounceUrlUpdate() {
      if (urlInputDebounceTimer) {
        clearTimeout(urlInputDebounceTimer);
        urlInputDebounceTimer = null;
      }
      urlInputDebounceTimer = setTimeout(() => {
        if (iframe && urlInput && urlInput.value && urlInput.value !== iframe.src) {
          setIframeSrc(urlInput.value);
        }
        urlInputDebounceTimer = null;
      }, 300);
    }

    // Open / reload behavior: Enter key or blur will update iframe
    urlInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        // Clear any pending debounce timer when user presses Enter
        if (urlInputDebounceTimer) {
          clearTimeout(urlInputDebounceTimer);
          urlInputDebounceTimer = null;
        }
        setIframeSrc(urlInput.value);
      }
    });
    urlInput.addEventListener('blur', () => {
      // Clear any pending debounce timer on blur
      if (urlInputDebounceTimer) {
        clearTimeout(urlInputDebounceTimer);
        urlInputDebounceTimer = null;
      }
      // on blur, apply the URL so the field is 'workable'
      if (iframe && urlInput.value && urlInput.value !== iframe.src) {
        setIframeSrc(urlInput.value);
      }
    });
    // Add input event listener with debounce for automatic updates
    urlInput.addEventListener('input', () => {
      debounceUrlUpdate();
    });

    // Listen for location updates posted from content script (in the iframe)
    window.addEventListener('message', (ev) => {
      try {
        // Accept messages only from localhost origins (content script runs only on localhost)
        const allowedPrefixes = ['http://localhost', 'https://localhost', 'http://127.0.0.1', 'https://127.0.0.1'];
        const origin = ev.origin || '';
        if (!allowedPrefixes.some(p => origin.startsWith(p))) return;

        const data = ev.data;
        if (data?.type === 'wrapper:location' && typeof data.href === 'string') {
          // Clear any pending debounce timer when receiving location update from content script
          if (urlInputDebounceTimer) {
            clearTimeout(urlInputDebounceTimer);
            urlInputDebounceTimer = null;
          }
          // Update the input but do not force navigation unless user acts
          if (urlInput.value !== data.href) {
            urlInput.value = data.href;
          }
          // If the content script provided a favicon url, set it as the document head favicon
          if (typeof data.favicon === 'string' && data.favicon) {
            setHeadFavicon(data.favicon);
          }
          // Hide access hint because we successfully received a message
          const accessHint = document.getElementById('accessHint');
          if (accessHint) accessHint.style.display = 'none';
        }
      } catch (error__) {
        console.debug('message handler error', error__);
      }
    });

    // If we don't receive a content-sync message within X ms for a localhost target, show access hint
    const ACCESS_HINT_TIMEOUT_MS = 2000;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(urlInput.value)) {
      const accessHint = document.getElementById('accessHint');
      let gotMessage = false;
      const onMessage = () => { gotMessage = true; if (accessHint) accessHint.style.display = 'none'; };
      window.addEventListener('message', onMessage, { once: true });
      setTimeout(() => {
        if (!gotMessage && accessHint) {
          accessHint.style.display = 'inline-block';
        }
      }, ACCESS_HINT_TIMEOUT_MS);
    }

    // Set document head favicon (best-effort). Browser may still choose extension icon for extension pages.
    function setHeadFavicon(src) {
      try {
        if (!src) return;
        let linkEl = document.querySelector('link[rel~="icon"]');
        if (!linkEl) {
          linkEl = document.createElement('link');
          linkEl.rel = 'icon';
          document.head.appendChild(linkEl);
        }
        linkEl.href = src;
      } catch (e) {
        console.debug('setHeadFavicon failed', e);
      }
    }

    // Try probe a few favicon locations for the initial target and set head favicon
    try {
      const urlObj = new URL(target);
      const faviconCandidates = [urlObj.origin + '/favicon.ico', urlObj.origin + '/favicon.png', urlObj.origin + '/favicon.ico?v=1'];
      (function tryFavicon(list) {
        if (!list.length) return;
        const candidate = list.shift();
        const img = new Image();
        img.onload = function() {
          setHeadFavicon(candidate);
        };
        img.onerror = function() {
          tryFavicon(list);
        };
        img.src = candidate;
      })(faviconCandidates.slice());
    } catch (error__) {
      console.debug('Invalid target URL for favicon detection', error__);
    }

    if (!target) {
      const notice = document.createElement('div');
      notice.className = 'notice';
      notice.textContent = 'No target URL provided. Please use the extension popup to set a URL and title.';
      container.appendChild(notice);
      return;
    }

    // Create and append the iframe
    iframe = document.createElement('iframe');
    iframe.id = 'frame';
    iframe.src = target;
    
    // Track if iframe loaded successfully
    iframe.addEventListener('load', () => {
      iframeLoaded = true;
      // Try to sync the visible URL with actual iframe location when same-origin
      try {
        const current = iframe.contentWindow.location.href;
        if (current && urlInput.value !== current) {
          // Clear any pending debounce timer when iframe loads
          if (urlInputDebounceTimer) {
            clearTimeout(urlInputDebounceTimer);
            urlInputDebounceTimer = null;
          }
          urlInput.value = current;
        }
      } catch (error__) {
        console.debug('Unable to read iframe location (cross-origin)', error__);
      }
    });

    container.appendChild(iframe);

    // Add fallback notice for when iframe is blocked or fails to load
    const IFRAME_LOAD_TIMEOUT_MS = 2000;
    setTimeout(() => {
      if (!iframeLoaded) {
        const fallback = document.createElement('div');
        fallback.className = 'notice';
        
        const strong = document.createElement('strong');
        strong.textContent = 'Note:';
        fallback.appendChild(strong);
        
        fallback.appendChild(document.createTextNode(' The page content may not be visible in this frame due to:'));
        
        const ul = document.createElement('ul');
        ul.style.margin = '8px 0';
        ul.style.paddingLeft = '20px';
        
        const li1 = document.createElement('li');
        li1.textContent = 'The target service is currently unavailable';
        ul.appendChild(li1);
        
        const li2 = document.createElement('li');
        li2.textContent = 'Security headers (X-Frame-Options or CSP) preventing embedding';
        ul.appendChild(li2);
        
        fallback.appendChild(ul);
        
        const errorHint = document.createElement('div');
        errorHint.className = 'error-hint';
        errorHint.textContent = '💡 Your custom tab title "' + title + '" is still visible!';
        
        const br = document.createElement('br');
        errorHint.appendChild(br);
        
        errorHint.appendChild(document.createTextNode('To access the content directly: '));
        
        const link = document.createElement('a');
        link.href = target;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Open ' + target + ' in a new tab';
        errorHint.appendChild(link);
        
        fallback.appendChild(errorHint);
        container.appendChild(fallback);
      }
    }, IFRAME_LOAD_TIMEOUT_MS);

    // Periodically attempt to sync iframe location when same-origin (best-effort)
    // Use shorter interval for better responsiveness
    const SYNC_INTERVAL_MS = 500;
    const syncHandle = setInterval(() => {
      try {
        if (iframe?.contentWindow?.location) {
          const current = iframe.contentWindow.location.href;
          if (current && urlInput.value !== current) {
            // Clear any pending debounce timer when syncing from iframe
            if (urlInputDebounceTimer) {
              clearTimeout(urlInputDebounceTimer);
              urlInputDebounceTimer = null;
            }
            urlInput.value = current;
          }
        }
      } catch (error__) {
        // Expected for cross-origin iframes; content_sync.js handles those
        console.debug('Periodic iframe sync skipped (cross-origin)', error__);
      }
    }, SYNC_INTERVAL_MS);

    // Clear interval on unload
    window.addEventListener('unload', () => {
      clearInterval(syncHandle);
      if (urlInputDebounceTimer) {
        clearTimeout(urlInputDebounceTimer);
      }
    });
    } catch (error) {
      console.error('Error in wrapper script:', error);
      // Fallback: at least update the title even if other things fail
      try {
        const titleElm = document.getElementById('titleElm');
        if (titleElm?.textContent === '...') {
          titleElm.textContent = 'Error loading wrapper';
        }
      } catch (error__) {
        console.debug('Fallback title update failed', error__);
      }
  }
})();
