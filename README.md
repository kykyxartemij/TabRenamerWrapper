# TabRenamerWrapper

> **⚠️ IMPORTANT DISCLAIMER**: This extension was **fully written by AI**. No real person was involved in its development.

## What is TabRenamerWrapper?

TabRenamerWrapper is a **simple and minimal** Chrome/Edge browser extension that lets you assign **custom tab titles** for your local development services (localhost on different ports). The custom title remains visible even when the target service is unavailable or shows a browser error page.

## The Problem

When you have many browser tabs pointing to local development services (e.g., `localhost:3000`, `localhost:3001`, etc.), several issues arise:

- After a browser restart or if the service is temporarily down, tabs often show "Page Unavailable" or a browser error page
- These error pages lose the original helpful tab titles
- You're forced to open code or documentation to figure out which tab corresponds to which service
- Browser error pages (`chrome-error://` or similar) don't allow content scripts to run, so traditional extensions cannot change the tab title

## The Solution

TabRenamerWrapper solves this by:

1. **Wrapping your target URL** in an extension-hosted HTML page
2. **Setting a custom title** on the wrapper page itself (not the embedded content)
3. **Keeping the custom title visible** even when the embedded iframe fails to load

This works because the wrapper page is hosted by the extension, so it can always set `document.title` regardless of whether the target URL is accessible.

## Features

✅ **Custom tab titles** - Set any title you want for any URL  
✅ **Smart defaults** - Auto-generates sensible titles for localhost URLs (e.g., "localhost:3000")  
✅ **Two modes** - Replace current tab or open in a new tab  
✅ **Minimal permissions** - Only requires `tabs` and `activeTab`  
✅ **Manifest V3** - Uses the latest Chrome extension format  
✅ **Error resilience** - Title stays visible even if the target is down or blocks framing  
✅ **Simple & lightweight** - No external storage, no complexity

## Installation

### From Source (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/kykyxartemij/TabRenamerWrapper.git
   cd TabRenamerWrapper
   ```

2. Open Chrome/Edge and navigate to:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked**

5. Select the `TabRenamerWrapper` directory

6. The extension is now installed! You should see the extension icon in your toolbar.

### From Chrome Web Store

_Not yet published to the Chrome Web Store_

## Usage

### Basic Usage

1. **Click the extension icon** in your browser toolbar

2. The popup will appear with two input fields:
   - **Tab title**: The custom name you want to display (e.g., "My API Server")
   - **URL to wrap**: The target URL (e.g., `http://localhost:3000`)

3. If you're on an HTTP/HTTPS page, the current tab's URL will be auto-filled

4. Choose one of two actions:
   - **Apply to current tab**: Replaces the current tab with the wrapper
   - **Open in new tab**: Opens the wrapper in a new tab

5. The tab will now show your custom title, even if the service is unavailable!

### Smart Defaults for Localhost

For localhost URLs, the extension automatically generates a smart default title based on the port number (e.g., `localhost:3000`, `localhost:8080`). You can override this with your own custom title.

### Error Page Resilience

If the target URL:
- Is temporarily down
- Returns a browser error page
- Sets `X-Frame-Options: DENY` or CSP `frame-ancestors` that blocks framing

...the wrapper page will still display your custom tab title. A helpful message will be shown with a link to open the URL directly in a new tab.

## How It Works

Traditional browser extensions cannot change tab titles on error pages because:
- Browser error pages use internal protocols (e.g., `chrome-error://`)
- Content scripts are not allowed to run on these pages
- The document is controlled by the browser, not the extension

**TabRenamerWrapper's approach:**

1. Creates an extension-hosted HTML page (`wrapper.html`)
2. Sets the custom title on this page using `document.title`
3. Embeds the target URL in an `<iframe>`
4. Even if the iframe fails to load, the wrapper page's title remains visible

```
┌─────────────────────────────────────┐
│  Tab: "My API Server"               │  ← Custom title set by wrapper.html
│  ┌───────────────────────────────┐  │
│  │ wrapper.html                  │  │  ← Extension page
│  │ ┌───────────────────────────┐ │  │
│  │ │ <iframe src="localhost:   │ │  │  ← Target URL in iframe
│  │ │  3000">                    │ │  │
│  │ │  (may fail to load)        │ │  │
│  │ └───────────────────────────┘ │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Files Structure

```
TabRenamerWrapper/
├── manifest.json       # Extension configuration (Manifest V3)
├── popup.html          # Popup UI for setting custom titles
├── popup.js            # Popup logic
├── wrapper.html        # Wrapper page that embeds target URLs
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

## Permissions

The extension requires the following permissions:

- **`tabs`**: To query and update tab information
- **`activeTab`**: To access the currently active tab's URL

**Note**: This extension does **NOT** use persistent storage. It's designed to be simple and lightweight.

## Limitations

### No Persistent Storage

This extension does not save your URL→title mappings. Each time you want to set a custom title, you'll need to:
1. Click the extension icon
2. Enter (or auto-fill) the URL
3. Enter the custom title
4. Click "Apply to current tab" or "Open in new tab"

The custom title is embedded in the wrapper URL, so as long as you keep that tab open (or bookmark it), the title will persist.

### X-Frame-Options and CSP

Some websites set HTTP headers that prevent them from being embedded in iframes:
- `X-Frame-Options: DENY` or `SAMEORIGIN`
- `Content-Security-Policy: frame-ancestors 'none'` or `'self'`

When this happens:
- The iframe will be blocked and appear blank
- **Your custom tab title will still be visible** (the main goal)
- A fallback message will show a link to open the URL directly

This is expected behavior and not a bug. The primary purpose of this extension is to maintain custom tab titles, not to bypass security restrictions.

### Browser Error Pages

If you're already on a browser error page (e.g., "Page Unavailable"), the extension cannot auto-detect the original URL because:
- Error pages use internal protocols (`chrome-error://`)
- The original URL is not accessible to extensions

**Workaround**: Manually paste the original URL into the "URL to wrap" field.

## Privacy

- **No data is sent to external servers**
- **No storage used** - everything is kept in the wrapper URL
- No analytics or tracking
- No external dependencies

## Contributing

This is an AI-generated project created for personal use. Contributions are welcome if you find bugs or want to add features:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

This project is provided "as-is" without any warranty. Feel free to use, modify, and distribute it as needed.

## Support

For issues or questions:
- Open an issue on [GitHub Issues](https://github.com/kykyxartemij/TabRenamerWrapper/issues)
- Note: Since this is an AI-generated project, support may be limited

## Acknowledgments

- This extension was fully created by AI
- Inspired by the common developer pain point of losing track of local development service tabs
- Built with Manifest V3 for modern Chrome/Edge compatibility

---

**Again, to be absolutely clear**: This extension was **fully written by AI**. No human developer was directly involved in writing the code.
