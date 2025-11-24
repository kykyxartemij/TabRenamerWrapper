// popup.js - simple popup logic
document.getElementById('apply').addEventListener('click', applyToCurrent);
document.getElementById('openNew').addEventListener('click', openInNewTab);

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

// Try to get active tab URL and fill URL field if blank and it's http(s)
chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  if (!tabs || !tabs[0]) return;
  const tab = tabs[0];
  try {
    if (/^https?:\/\//.test(tab.url) && !document.getElementById('url').value) {
      document.getElementById('url').value = tab.url;
      // Also optionally set a default title
      document.getElementById('title').value = tab.title || tab.url;
    }
  } catch (e) {
    // ignore (some internal pages may block access)
  }
});

function applyToCurrent() {
  const {title, url} = getInputs();
  if (!url) { alert('Введите target URL'); return; }
  const wrapper = buildWrapperUrl(url, title || url);
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.update(tabs[0].id, {url: wrapper});
    window.close();
  });
}

function openInNewTab() {
  const {title, url} = getInputs();
  if (!url) { alert('Введите target URL'); return; }
  const wrapper = buildWrapperUrl(url, title || url);
  chrome.tabs.create({url: wrapper});
  window.close();
}