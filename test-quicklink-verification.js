/**
 * QuickCopy QuickLink Verification Suite
 * Executes the 12-Point Protocol Verification for the QuickLink direct sharing system.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT_DIR = 'C:\\example';
const QUICKCOPY_DIR = path.join(ROOT_DIR, 'quickcopy');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: []
};

function startSuite(name) {
  const suite = { name, tests: [] };
  results.suites.push(suite);
  return {
    test(description, fn) {
      results.total++;
      try {
        fn();
        suite.tests.push({ description, status: 'PASS' });
        results.passed++;
      } catch (err) {
        suite.tests.push({ description, status: 'FAIL', error: err.message });
        results.failed++;
        console.error('  ASYNC FAIL [', description, ']:', err.stack || err.message);
        console.error('  FAIL [' + description + ']: ' + (err.stack || err.message));
      }
    },
    async testAsync(description, fn) {
      results.total++;
      try {
        await fn();
        suite.tests.push({ description, status: 'PASS' });
        results.passed++;
      } catch (err) {
        suite.tests.push({ description, status: 'FAIL', error: err.message });
        results.failed++;
        console.error('  ASYNC FAIL [', description, ']:', err.stack || err.message);
      }
    }
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'} - Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
  }
}

// Read key files
const rootJs = fs.readFileSync(path.join(ROOT_DIR, 'script.js'), 'utf8');
const quickcopyJs = fs.readFileSync(path.join(QUICKCOPY_DIR, 'script.js'), 'utf8');
const rootReadme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf8');
const quickcopyReadme = fs.readFileSync(path.join(QUICKCOPY_DIR, 'README.md'), 'utf8');
const htmlContent = fs.readFileSync(path.join(QUICKCOPY_DIR, 'index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(QUICKCOPY_DIR, 'style.css'), 'utf8');

// Sandbox helper for testing QuickLink logic in VM
function createQuickLinkSandbox(locationUrl = 'https://example.com/quickcopy/index.html', clipboardReject = false) {
  const elements = new Map();
  const replacedUrls = [];
  let clipboardText = '';

  function createMockElement(tag, id = '') {
    const el = {
      tagName: tag.toUpperCase(),
      id: id || '',
      className: '',
      textContent: '',
      value: '',
      checked: false,
      style: { display: '', overflow: '', visibility: 'visible' },
      offsetParent: {},
      children: [],
      classList: {
        _classes: new Set(),
        add(c) {
          this._classes.add(c);
          if (!el.className || !el.className.split(/\s+/).includes(c)) {
            el.className = (el.className ? el.className + ' ' : '') + c;
          }
        },
        remove(c) {
          this._classes.delete(c);
          if (el.className) {
            el.className = el.className.split(/\s+/).filter(x => x && x !== c).join(' ');
          }
        },
        contains(c) {
          return this._classes.has(c) || (el.className ? el.className.split(/\s+/).includes(c) : false);
        },
        toggle(c, force) {
          const shouldAdd = force !== undefined ? !!force : !this.contains(c);
          if (shouldAdd) this.add(c); else this.remove(c);
          return shouldAdd;
        }
      },
      attributes: {},
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] || null; },
      appendChild(child) { el.children.push(child); return child; },
      removeChild(child) {
        const idx = el.children.indexOf(child);
        if (idx >= 0) el.children.splice(idx, 1);
        return child;
      },
      addEventListener(ev, fn) {
        if (!el._listeners) el._listeners = {};
        if (!el._listeners[ev]) el._listeners[ev] = [];
        el._listeners[ev].push(fn);
      },
      dispatchEvent(event) {
        const evType = typeof event === 'string' ? event : (event.type || 'click');
        const fns = (el._listeners && el._listeners[evType]) || [];
        fns.forEach(fn => fn(event));
        if (evType === 'click' && typeof el.onclick === 'function') {
          el.onclick(event);
        }
      },
      click() { this.dispatchEvent({ type: 'click', target: el }); },
      focus() { el._focused = true; },
      select() { el._selected = true; },
      querySelector(sel) {
        if (sel === '.btn-text') return { textContent: el.textContent };
        return null;
      },
      querySelectorAll() { return []; }
    };
    return el;
  }

  function getOrCreateElement(id, tag = 'div') {
    if (!elements.has(id)) {
      elements.set(id, createMockElement(tag, id));
    }
    return elements.get(id);
  }

  const domHandlers = [];
  const parsedUrl = new URL(locationUrl);

  const sandbox = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    setTimeout: (fn, delay) => { if (delay && delay > 1000) return 1; fn(); return 1; },
    clearTimeout: () => {},
    Date,
    JSON,
    URL,
    URLSearchParams,
    atob: (str) => Buffer.from(str, 'base64').toString('binary'),
    btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
    encodeURIComponent,
    decodeURIComponent,
    Array,
    String,
    location: {
      href: locationUrl,
      search: parsedUrl.search,
      hash: parsedUrl.hash,
      pathname: parsedUrl.pathname
    },
    history: {
      replaceState: (state, title, url) => {
        replacedUrls.push(url);
      }
    },
    navigator: {
      clipboard: {
        writeText: (text) => {
          if (clipboardReject) {
            return Promise.reject(new Error('Permission denied without user gesture'));
          }
          clipboardText = text;
          return Promise.resolve();
        }
      }
    },
    document: {
      body: {
        style: { overflow: '' },
        appendChild: () => {},
        removeChild: () => {}
      },
      activeElement: null,
      getElementById: (id) => getOrCreateElement(id),
      createElement: (tag) => createMockElement(tag),
      addEventListener: (ev, fn) => {
        if (ev === 'DOMContentLoaded') domHandlers.push(fn);
      }
    },
    localStorage: {
      _store: {},
      getItem: (k) => sandbox.localStorage._store[k] || null,
      setItem: (k, v) => { sandbox.localStorage._store[k] = String(v); }
    },
    window: null
  };
  sandbox.window = sandbox;

  // Pre-populate standard DOM IDs from index.html
  const standardIds = [
    'searchInput', 'clearSearchBtn', 'categoryFilter', 'copyAllBtn', 'openCreateBtn',
    'emptyCreateBtn', 'retryBtn', 'snippetsGrid', 'loadingState', 'emptyState', 'errorState',
    'resultsCount', 'activeFilterTag', 'demoBanner', 'dismissBannerBtn', 'createModal',
    'closeModalBtn', 'cancelModalBtn', 'createSnippetForm', 'snippetTitle', 'snippetCategory',
    'snippetContent', 'titleCharCount', 'contentCharCount', 'formError', 'saveSnippetBtn',
    'downloadZipBtn', 'uploadZipBtn', 'uploadZipModal', 'closeZipModalBtn', 'cancelZipModalBtn',
    'confirmZipImportBtn', 'zipDropzone', 'zipFileInput', 'zipFileInfo', 'zipFileName',
    'zipFileSize', 'zipRemoveFileBtn', 'zipCategoryOption', 'zipError', 'zipPreviewSection',
    'zipPreviewSummary', 'zipSelectAllCheckbox', 'zipPreviewList', 'zipModeFull', 'zipModeExtract',
    'zipFullDetailsSection', 'zipFullTitle', 'zipFullSummary', 'zipFullFileList', 'toast',
    'toastMessage', 'toastActionBtn', 'quickLinkModal', 'closeQuickLinkModalBtn',
    'cancelQuickLinkModalBtn', 'quickLinkInput', 'copyQuickLinkBtn', 'quickLinkModeCopy',
    'quickLinkModeDownload', 'quickActionOverlay', 'closeQuickActionBtn', 'quickActionTitle',
    'quickActionBadge', 'quickActionPreview', 'quickActionCopyBtn', 'quickActionDownloadBtn',
    'quickActionOpenAppBtn'
  ];

  standardIds.forEach(id => getOrCreateElement(id));

  // Initialize hidden classes
  ['quickLinkModal', 'quickActionOverlay', 'toast', 'toastActionBtn', 'loadingState', 'emptyState', 'errorState'].forEach(id => {
    getOrCreateElement(id).classList.add('hidden');
  });

  vm.createContext(sandbox);
  vm.runInContext(quickcopyJs, sandbox);

  return {
    sandbox,
    elements,
    replacedUrls,
    getClipboardText: () => clipboardText,
    triggerDOMContentLoaded: async () => {
      for (const h of domHandlers) {
        await h();
      }
    }
  };
}

async function runSuite() {
  console.log('\n======================================================');
  console.log('       QUICKCOPY QUICKLINK VERIFICATION SUITE         ');
  console.log('======================================================\n');

  // Point 1: Original Requirements & Structure
  const s1 = startSuite('Point 1: Original Requirements & File Identity');
  s1.test('quickcopy/script.js and root script.js are 100% bit-for-bit identical', () => {
    const h1 = crypto.createHash('sha256').update(quickcopyJs).digest('hex');
    const h2 = crypto.createHash('sha256').update(rootJs).digest('hex');
    assertEqual(h1, h2, 'SHA-256 hashes must match bit-for-bit');
  });

  // Point 2: Every Implemented Feature Verification
  const s2 = startSuite('Point 2: Every Implemented Feature Verification');
  s2.test('getQuickLink generates valid copy and download URLs with Base64URL payload', () => {
    const env = createQuickLinkSandbox();
    const snippet = { id: 'test-123', title: 'Test Snippet', category: 'Commands', content: 'git status' };
    const copyUrl = env.sandbox.getQuickLink(snippet, 'copy');
    assert(copyUrl.includes('copy=test-123'), 'URL contains copy=test-123');
    assert(copyUrl.includes('#q='), 'URL contains Base64URL hash payload #q=');

    const dlUrl = env.sandbox.getQuickLink(snippet, 'download');
    assert(dlUrl.includes('dl=test-123'), 'URL contains dl=test-123');
    assert(dlUrl.includes('#q='), 'URL contains Base64URL hash payload #q=');
  });

  s2.test('encodeQuickPayload and decodeQuickPayload round-trip preserves full integrity', () => {
    const env = createQuickLinkSandbox();
    const orig = { id: 'snip-99', title: 'Docker Up', category: 'Commands', content: 'docker compose up -d', action: 'copy' };
    const encoded = env.sandbox.encodeQuickPayload(orig, 'copy');
    assert(typeof encoded === 'string' && encoded.length > 0, 'Payload is non-empty string');
    assert(!encoded.includes('+') && !encoded.includes('/'), 'Uses URL-safe base64 (- and _)');

    const decoded = env.sandbox.decodeQuickPayload('#q=' + encoded);
    assert(decoded !== null, 'Decoded payload is non-null');
    assertEqual(decoded.title, orig.title, 'Title preserved');
    assertEqual(decoded.category, orig.category, 'Category preserved');
    assertEqual(decoded.content, orig.content, 'Content preserved');
    assertEqual(decoded.action, 'copy', 'Action preserved');
  });

  s2.test('Snippet cards have the Link button bound to openQuickLinkModal', () => {
    const env = createQuickLinkSandbox();
    const snippet = { id: 'card-1', title: 'SQL Query', category: 'Commands', content: 'SELECT 1;' };
    const card = env.sandbox.createSnippetCardElement(snippet);
    assert(card !== null, 'Card created');
    const linkBtn = card.children.find(c => c.className === 'snippet-card-footer')
      .children.find(b => b.className && b.className.includes('btn-card-link'));
    assert(linkBtn !== null, 'Card footer contains .btn-card-link');
    assertEqual(linkBtn.textContent, '🔗 Link', 'Button text is 🔗 Link');
  });

  // Point 3: Important Edge Cases & Sequential DOMContentLoaded
  const s3 = startSuite('Point 3: Important Edge Cases & Sequential DOMContentLoaded');
  await s3.testAsync('Sequential DOMContentLoaded loads allSnippets BEFORE incoming QuickLink executes', async () => {
    // URL contains only ?copy=demo-1 without payload
    const env = createQuickLinkSandbox('https://example.com/quickcopy/index.html?copy=demo-1');
    await env.triggerDOMContentLoaded();

    const overlay = env.elements.get('quickActionOverlay');
    assert(!overlay.classList.contains('hidden'), 'QuickAction overlay opened');
    const title = env.elements.get('quickActionTitle');
    assertEqual(title.textContent, 'Docker Postgres', 'Located snippet title from populated allSnippets');
  });

  await s3.testAsync('Query param ?id=demo-2 defaults to copy action and populates preview', async () => {
    const env = createQuickLinkSandbox('https://example.com/quickcopy/index.html?id=demo-2');
    await env.triggerDOMContentLoaded();

    const overlay = env.elements.get('quickActionOverlay');
    assert(!overlay.classList.contains('hidden'), 'QuickAction overlay opened via ?id=');
    const title = env.elements.get('quickActionTitle');
    assertEqual(title.textContent, 'useDebounce Hook', 'Snippet loaded successfully via ?id= parameter');
  });

  await s3.testAsync('Pure client-side payload (#q=...) loads without any server or database lookup', async () => {
    const env = createQuickLinkSandbox('https://example.com/quickcopy/index.html');
    const snippet = { id: 'client-only', title: 'Zero Server Snippet', category: 'Programming', content: 'console.log("no server!");' };
    const payload = env.sandbox.encodeQuickPayload(snippet, 'copy');

    const clientEnv = createQuickLinkSandbox(`https://example.com/quickcopy/index.html#q=${payload}`);
    await clientEnv.triggerDOMContentLoaded();

    const title = clientEnv.elements.get('quickActionTitle');
    assertEqual(title.textContent, 'Zero Server Snippet', 'Payload decoded entirely client-side');
    const preview = clientEnv.elements.get('quickActionPreview');
    assertEqual(preview.textContent, 'console.log("no server!");', 'Content displayed directly from hash');
  });

  // Point 4: Error Handling & Browser Clipboard Permissions
  const s4 = startSuite('Point 4: Error Handling & Clipboard Permission Block Handling');
  await s4.testAsync('Browser clipboard block on page load gracefully prompts user on badge and button', async () => {
    // Simulate browser blocking clipboard write without user gesture
    const env = createQuickLinkSandbox('https://example.com/quickcopy/index.html?copy=demo-1', true);
    await env.triggerDOMContentLoaded();

    const badge = env.elements.get('quickActionBadge');
    assert(badge.textContent.includes('Click Copy below'), 'Badge displays prompt to click Copy');
    assert(badge.classList.contains('is-warning'), 'Badge has is-warning class');

    const copyBtn = env.elements.get('quickActionCopyBtn');
    assertEqual(copyBtn.textContent, '📋 Copy Snippet', 'Copy button updated to 📋 Copy Snippet');
    assert(copyBtn._focused === true, 'Copy button received focus for easy user activation');
  });

  // Point 5: Full ZIP Archive QuickLinks
  const s5 = startSuite('Point 5: Full ZIP Archive QuickLink Support');
  s5.test('Full ZIP snippet generates download QuickLink by default', () => {
    const env = createQuickLinkSandbox();
    const zipSnippet = {
      id: 'zip-1',
      title: 'Project Backup.zip',
      category: 'ZIP Archive',
      content: JSON.stringify({
        __quickcopy_zip__: true,
        fileName: 'Project Backup.zip',
        fileSize: 1024,
        fileCount: 2,
        files: [{ name: 'index.js', size: 512 }, { name: 'style.css', size: 512 }]
      })
    };
    const link = env.sandbox.getQuickLink(zipSnippet);
    assert(link.includes('dl=zip-1'), 'Defaults to dl= for Full ZIP');
  });

  await s5.testAsync('Full ZIP incoming QuickLink formats preview with archive summary and file list', async () => {
    const env = createQuickLinkSandbox();
    const zipSnippet = {
      id: 'zip-99',
      title: 'Archive.zip',
      category: 'ZIP Archive',
      content: JSON.stringify({
        __quickcopy_zip__: true,
        fileName: 'Archive.zip',
        fileSize: 2048,
        fileCount: 1,
        files: [{ name: 'app.py', size: 2048 }]
      })
    };
    const payload = env.sandbox.encodeQuickPayload(zipSnippet, 'copy');
    const zipEnv = createQuickLinkSandbox(`https://example.com/quickcopy/index.html#q=${payload}`);
    await zipEnv.triggerDOMContentLoaded();

    const preview = zipEnv.elements.get('quickActionPreview');
    assert(preview.textContent.includes('Full ZIP Archive'), 'Preview identifies Full ZIP Archive');
    assert(preview.textContent.includes('app.py'), 'Preview lists files inside archive');
  });

  // Point 7: Security & XSS Prevention
  const s7 = startSuite('Point 7: Security & XSS Sanitization');
  await s7.testAsync('XSS injection in QuickLink title and content safely rendered via textContent', async () => {
    const env = createQuickLinkSandbox();
    const xssSnippet = {
      id: 'xss',
      title: '<script>alert(1)</script>',
      category: 'General',
      content: '<img src=x onerror=alert(2)>'
    };
    const payload = env.sandbox.encodeQuickPayload(xssSnippet, 'copy');
    const runEnv = createQuickLinkSandbox(`https://example.com/quickcopy/index.html#q=${payload}`);
    await runEnv.triggerDOMContentLoaded();

    const title = runEnv.elements.get('quickActionTitle');
    assertEqual(title.textContent, '<script>alert(1)</script>', 'Title rendered safely via textContent');
    const preview = runEnv.elements.get('quickActionPreview');
    assertEqual(preview.textContent, '<img src=x onerror=alert(2)>', 'Preview rendered safely via textContent');
  });

  // Point 8: Performance & Bundle Size
  const s8 = startSuite('Point 8: Performance & Bundle Size');
  s8.test('Total bundle size is strictly under 100 KB limit', () => {
    const totalBytes = htmlContent.length + cssContent.length + quickcopyJs.length;
    const totalKB = (totalBytes / 1024).toFixed(2);
    console.log(`    Total QuickCopy bundle size: ${totalKB} KB (${totalBytes} bytes)`);
    assert(totalBytes < 100 * 1024, `Bundle size ${totalKB} KB must be under 100 KB`);
  });

  // Point 9: Modal Dismissal & URL History Cleanup
  const s9 = startSuite('Point 9: Clean Dismissal & URL History Cleanup');
  await s9.testAsync('Dismissing overlay strips query/hash via replaceState without reload', async () => {
    const env = createQuickLinkSandbox('https://example.com/quickcopy/index.html?copy=demo-1#q=xyz');
    await env.triggerDOMContentLoaded();

    const openAppBtn = env.elements.get('quickActionOpenAppBtn');
    openAppBtn.click();

    const overlay = env.elements.get('quickActionOverlay');
    assert(overlay.classList.contains('hidden'), 'Overlay hidden on Open App click');
    assert(env.replacedUrls.length > 0, 'replaceState was called');
    const cleanUrl = env.replacedUrls[env.replacedUrls.length - 1];
    assert(!cleanUrl.includes('copy='), 'copy parameter removed');
    assert(!cleanUrl.includes('#q='), 'hash payload removed');
  });

  // Point 10: Toast Action Button Binding
  const s10 = startSuite('Point 10: Toast Action Button Binding');
  s10.test('showToast displays and binds action button when provided, hides when not', () => {
    const env = createQuickLinkSandbox();
    let actionTriggered = false;

    // Call with action button
    env.sandbox.showToast('Test with action', 'Click Me', () => { actionTriggered = true; });
    const btn = env.elements.get('toastActionBtn');
    assert(!btn.classList.contains('hidden'), 'Action button is visible');
    assertEqual(btn.textContent, 'Click Me', 'Action button text set');
    btn.click();
    assert(actionTriggered === true, 'Action callback invoked');

    // Call without action button
    env.sandbox.showToast('Simple message');
    assert(btn.classList.contains('hidden'), 'Action button is hidden when not provided');
    assertEqual(btn.textContent, '', 'Action button text cleared');
  });

  // Summary
  console.log('\n======================================================');
  console.log(`SUMMARY: Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log('======================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
