// popup.js - popup logic with storage persistence
document.getElementById('apply').addEventListener('click', applyToCurrent);
document.getElementById('openNew').addEventListener('click', openInNewTab);

// Storage key for URL→title mappings
const STORAGE_KEY = 'urlTitleMappings';

function getInputs() {
  return {
    title: document.getElementById('title').value.trim(),
    url: document.getElementById('url').value.trim()
  };
}

function buildWrapperUrl(targetUrl, title) {
  const params = new URLSearchParams();
  params.set('target', targetUrl);
  params.set('title', title);
  return chrome.runtime.getURL('wrapper.html') + '?' + params.toString();
}

// Save a URL→title mapping to storage
async function saveMapping(url, title) {
  if (!url || !title) return;
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const mappings = result[STORAGE_KEY] || {};
    mappings[url] = title;
    await chrome.storage.local.set({[STORAGE_KEY]: mappings});
  } catch (e) {
    console.error('Failed to save mapping:', e);
  }
}

// Load a saved title for a URL
async function loadMapping(url) {
  if (!url) return null;
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const mappings = result[STORAGE_KEY] || {};
    return mappings[url] || null;
  } catch (e) {
    console.error('Failed to load mapping:', e);
    return null;
  }
}

// Generate a smart title for localhost URLs based on port
function generateSmartTitle(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      const port = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');
      return `localhost:${port}`;
    }
  } catch (e) {
    // Invalid URL
  }
  return url;
}

// Try to get active tab URL and fill URL field if blank and it's http(s)
chrome.tabs.query({active: true, currentWindow: true}, async tabs => {
  if (!tabs || !tabs[0]) return;
  const tab = tabs[0];
  try {
    if (/^https?:\/\//.test(tab.url) && !document.getElementById('url').value) {
      document.getElementById('url').value = tab.url;
      
      // Try to load saved mapping first
      const savedTitle = await loadMapping(tab.url);
      if (savedTitle) {
        document.getElementById('title').value = savedTitle;
      } else {
        // Generate smart title or use tab title
        const smartTitle = generateSmartTitle(tab.url);
        document.getElementById('title').value = tab.title || smartTitle;
      }
    }
  } catch (e) {
    // ignore (some internal pages may block access)
  }
});

async function applyToCurrent() {
  const {title, url} = getInputs();
  if (!url) { 
    alert('Please enter a target URL'); 
    return; 
  }
  
  const finalTitle = title || url;
  
  // Save mapping for future use
  await saveMapping(url, finalTitle);
  
  const wrapper = buildWrapperUrl(url, finalTitle);
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.update(tabs[0].id, {url: wrapper});
    window.close();
  });
}

async function openInNewTab() {
  const {title, url} = getInputs();
  if (!url) { 
    alert('Please enter a target URL'); 
    return; 
  }
  
  const finalTitle = title || url;
  
  // Save mapping for future use
  await saveMapping(url, finalTitle);
  
  const wrapper = buildWrapperUrl(url, finalTitle);
  chrome.tabs.create({url: wrapper});
  window.close();
}