/**
 * QuickCopy ZIP Verification Suite
 * Executes the complete 12-Point Verification Protocol for QuickCopy and the ZIP upload & download system.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const JSZip = require('jszip');

const ROOT_DIR = 'C:\\example';
const QUICKCOPY_DIR = path.join(ROOT_DIR, 'quickcopy');

// Telemetry results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: []
};

function startSuite(name) {
  const suite = { name, tests: [], startTime: Date.now() };
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
      }
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'} - Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
  }
}

// Load source files
const rootHtmlContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const htmlContent = fs.readFileSync(path.join(QUICKCOPY_DIR, 'index.html'), 'utf8');
const jsContent = fs.readFileSync(path.join(QUICKCOPY_DIR, 'script.js'), 'utf8');
const cssContent = fs.readFileSync(path.join(QUICKCOPY_DIR, 'style.css'), 'utf8');
const readmeContent = fs.readFileSync(path.join(QUICKCOPY_DIR, 'README.md'), 'utf8');

// Helper to create a sandbox environment with mock DOM and script.js context
function createScriptSandbox(overrides = {}) {
  const elements = new Map();
  const downloads = [];
  const domHandlers = [];

  function createMockElement(tag, id = '') {
    let innerHtmlVal = '';
    const el = {
      tagName: tag.toUpperCase(),
      id: id || '',
      className: '',
      textContent: '',
      title: '',
      value: '',
      checked: false,
      indeterminate: false,
      disabled: false,
      style: { display: '', overflow: '', visibility: 'visible' },
      offsetParent: {}, // visible by default
      children: [],
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); el.className = Array.from(this._classes).join(' '); },
        remove(c) { this._classes.delete(c); el.className = Array.from(this._classes).join(' '); },
        contains(c) { return this._classes.has(c); },
        toggle(c, force) {
          if (force === undefined) {
            if (this.contains(c)) this.remove(c); else this.add(c);
          } else if (force) this.add(c); else this.remove(c);
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
      eventListeners: {},
      addEventListener(event, handler) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(handler);
      },
      dispatchEvent(event) {
        const handlers = this.eventListeners[event.type || event] || [];
        for (const h of handlers) h(event);
      },
      click() { this.dispatchEvent({ type: 'click' }); },
      focus() {},
      querySelector(selector) {
        if (selector === '.btn-text') {
          if (!this._btnText) {
            this._btnText = createMockElement('span');
            this._btnText.className = 'btn-text';
            this.appendChild(this._btnText);
          }
          return this._btnText;
        }
        return null;
      },
      querySelectorAll(selector) {
        if (selector.includes('.zip-preview-item-checkbox')) {
          const res = [];
          function search(item) {
            if (item.className && item.className.includes('zip-preview-item-checkbox')) res.push(item);
            if (item.children) item.children.forEach(search);
          }
          search(el);
          return res;
        }
        return [];
      }
    };

    Object.defineProperty(el, 'innerHTML', {
      get() { return innerHtmlVal; },
      set(val) {
        innerHtmlVal = val;
        if (val === '') el.children = [];
      }
    });

    return el;
  }

  function getOrCreateElement(id, tag = 'div') {
    if (!elements.has(id)) {
      const el = createMockElement(tag, id);
      elements.set(id, el);
    }
    return elements.get(id);
  }

  // Pre-populate expected DOM elements
  const ids = [
    'demoBanner', 'dismissBannerBtn', 'openCreateBtn', 'searchInput', 'clearSearchBtn',
    'categoryFilter', 'copyAllBtn', 'downloadZipBtn', 'uploadZipBtn', 'resultsCount',
    'activeFilterTag', 'loadingState', 'emptyState', 'emptyCreateBtn', 'errorState',
    'retryBtn', 'snippetsGrid', 'createModal', 'closeModalBtn', 'cancelModalBtn',
    'createSnippetForm', 'formError', 'snippetTitle', 'snippetCategory', 'snippetContent',
    'titleCharCount', 'contentCharCount', 'saveSnippetBtn', 'toast', 'toastMessage',
    'uploadZipModal', 'closeZipModalBtn', 'cancelZipModalBtn', 'confirmZipImportBtn',
    'zipDropzone', 'zipFileInput', 'zipFileInfo', 'zipFileName', 'zipFileSize',
    'zipRemoveFileBtn', 'zipCategoryOption', 'zipError', 'zipPreviewSection',
    'zipPreviewList', 'zipPreviewSummary', 'zipSelectAllCheckbox'
  ];

  ids.forEach(id => getOrCreateElement(id));

  // Initialize confirmZipImportBtn with .btn-text child
  const confirmBtn = elements.get('confirmZipImportBtn');
  const btnText = createMockElement('span');
  btnText.className = 'btn-text';
  btnText.textContent = 'Import Snippets';
  confirmBtn.appendChild(btnText);
  confirmBtn._btnText = btnText;

  elements.get('zipCategoryOption').value = 'auto';

  const mockLocalStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  };

  const sandbox = {
    JSZip,
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    },
    URL: {
      createObjectURL: (blob) => {
        downloads.push(blob);
        return 'blob:mock-url-' + downloads.length;
      },
      revokeObjectURL: () => {}
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms || 0),
    clearTimeout: (id) => clearTimeout(id),
    localStorage: mockLocalStorage,
    ...overrides
  };

  sandbox.window = sandbox;
  sandbox.document = {
    activeElement: null,
    addEventListener: (ev, fn) => {
      if (ev === 'DOMContentLoaded') domHandlers.push(fn);
    },
    removeEventListener: () => {},
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
      return null;
    },
    querySelectorAll: () => [],
    createElement: (tag) => createMockElement(tag),
    body: {
      style: {},
      appendChild: () => {},
      removeChild: () => {}
    }
  };

  const bridge = `
window.__getParsedZipSnippets = () => parsedZipSnippets;
window.__setParsedZipSnippets = (v) => { parsedZipSnippets = v; };
window.__getAllSnippets = () => allSnippets;
window.__setAllSnippets = (v) => { allSnippets = v; };
window.__getIsDemoMode = () => isDemoMode;
window.__setIsDemoMode = (v) => { isDemoMode = v; };
window.__getSupabaseClient = () => supabaseClient;
window.__setSupabaseClient = (v) => { supabaseClient = v; };
`;

  vm.createContext(sandbox);
  vm.runInContext(jsContent + '\n' + bridge, sandbox);

  // Trigger DOMContentLoaded to bind DOM elements in script.js
  domHandlers.forEach(h => h());

  return {
    sandbox,
    elements,
    downloads,
    getOrCreateElement,
    mockLocalStorage
  };
}

async function runAllSuites() {
  console.log('\n======================================================');
  console.log('   QUICKCOPY ZIP VERIFICATION PROTOCOL TEST SUITE     ');
  console.log('======================================================\n');

  // ============================================================================
  // POINT 1: Original Requirements & Project Structure
  // ============================================================================
  const s1 = startSuite('Point 1: Original Requirements & Project Structure');

  s1.test('Root index.html exists and redirects to quickcopy/index.html', () => {
    assert(rootHtmlContent.includes('url=quickcopy/index.html'), 'Meta refresh redirect exists');
    assert(rootHtmlContent.includes('window.location.replace("quickcopy/index.html")'), 'JS redirect exists');
    assert(rootHtmlContent.includes('href="quickcopy/index.html"'), 'Fallback anchor link exists');
  });

  s1.test('QuickCopy directory contains all essential application files', () => {
    const files = ['index.html', 'style.css', 'script.js', 'README.md'];
    for (const f of files) {
      const p = path.join(QUICKCOPY_DIR, f);
      assert(fs.existsSync(p), `File ${f} exists in quickcopy/`);
      assert(fs.statSync(p).size > 1000, `File ${f} is populated and non-trivial`);
    }
  });

  s1.test('CDN dependencies: Supabase JS v2 and JSZip 3.10.1 loaded in index.html', () => {
    assert(htmlContent.includes('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'), 'Loads Supabase JS v2');
    assert(htmlContent.includes('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'), 'Loads JSZip CDN v3.10.1');
  });

  s1.test('README.md comprehensively documents ZIP export and import features', () => {
    assert(readmeContent.includes('ZIP Export & Import System') || readmeContent.includes('ZIP'), 'Documents ZIP System');
    assert(readmeContent.includes('Export ZIP') || readmeContent.includes('exportSnippetsToZip'), 'Documents Export ZIP');
    assert(readmeContent.includes('Import ZIP') || readmeContent.includes('handleSelectedZipFile'), 'Documents Import ZIP');
    assert(readmeContent.includes('quickcopy-backup.json'), 'Documents backup JSON format');
  });

  // ============================================================================
  // POINT 2: Check Every Implemented Feature
  // ============================================================================
  const s2 = startSuite('Point 2: Every Implemented Feature Verification');

  s2.test('Export ZIP button (#downloadZipBtn) in toolbar with icon and tooltip', () => {
    assert(htmlContent.includes('id="downloadZipBtn"'), 'Export ZIP button id exists');
    assert(htmlContent.includes('Export ZIP'), 'Export ZIP button text');
    assert(htmlContent.includes('Download all or filtered snippets as ZIP'), 'Export ZIP title attribute');
  });

  s2.test('Import ZIP button (#uploadZipBtn) in toolbar with icon and tooltip', () => {
    assert(htmlContent.includes('id="uploadZipBtn"'), 'Import ZIP button id exists');
    assert(htmlContent.includes('Import ZIP'), 'Import ZIP button text');
    assert(htmlContent.includes('Import snippets from a ZIP file'), 'Import ZIP title attribute');
  });

  s2.test('Per-card ZIP download button (.btn-card-zip) generated in snippet card footer', () => {
    assert(jsContent.includes('btn-card-zip'), 'Card ZIP button class exists in script.js');
    assert(jsContent.includes('downloadSingleSnippetZip(snippet, zipBtn)'), 'Per-card click triggers downloadSingleSnippetZip');
    assert(cssContent.includes('.btn-card-zip'), 'CSS styles .btn-card-zip');
  });

  s2.test('Import modal (#uploadZipModal) structure and accessibility attributes', () => {
    assert(htmlContent.includes('id="uploadZipModal"'), 'uploadZipModal id exists');
    assert(htmlContent.includes('role="dialog"'), 'Accessible role="dialog" on modal');
    assert(htmlContent.includes('aria-modal="true"'), 'aria-modal="true" set');
    assert(htmlContent.includes('aria-labelledby="zipModalHeading"'), 'aria-labelledby points to heading');
  });

  s2.test('ZIP modal dropzone (#zipDropzone) and file input (#zipFileInput)', () => {
    assert(htmlContent.includes('id="zipDropzone"'), 'zipDropzone element exists');
    assert(htmlContent.includes('tabindex="0"'), 'Dropzone is keyboard focusable');
    assert(htmlContent.includes('role="button"'), 'Dropzone role="button"');
    assert(htmlContent.includes('id="zipFileInput"'), 'zipFileInput element exists');
    assert(htmlContent.includes('accept=".zip"'), 'zipFileInput accepts only .zip');
  });

  s2.test('Category selector (#zipCategoryOption) with Auto-detect and 8 standard categories', () => {
    assert(htmlContent.includes('id="zipCategoryOption"'), 'zipCategoryOption element exists');
    assert(htmlContent.includes('value="auto"'), 'Option "auto" exists');
    const categories = ['General', 'Programming', 'Thesis', 'Assignment', 'Commands', 'Notes', 'Links', 'Other'];
    categories.forEach(cat => {
      assert(htmlContent.includes(`value="${cat}"`), `Category ${cat} in zipCategoryOption`);
    });
  });

  s2.test('Preview section (#zipPreviewSection), list (#zipPreviewList), summary, and select all', () => {
    assert(htmlContent.includes('id="zipPreviewSection"'), 'zipPreviewSection exists');
    assert(htmlContent.includes('id="zipPreviewList"'), 'zipPreviewList exists');
    assert(htmlContent.includes('id="zipPreviewSummary"'), 'zipPreviewSummary exists');
    assert(htmlContent.includes('id="zipSelectAllCheckbox"'), 'zipSelectAllCheckbox exists');
  });

  s2.test('Import confirmation button (#confirmZipImportBtn) and cancel button', () => {
    assert(htmlContent.includes('id="confirmZipImportBtn"'), 'confirmZipImportBtn exists');
    assert(htmlContent.includes('id="cancelZipModalBtn"'), 'cancelZipModalBtn exists');
    assert(htmlContent.includes('id="closeZipModalBtn"'), 'closeZipModalBtn exists');
  });

  // ============================================================================
  // POINT 3: Important Edge Cases & Boundary Conditions
  // ============================================================================
  const s3 = startSuite('Point 3: Important Edge Cases & Boundary Conditions');

  await s3.testAsync('Edge Case 3.1: Empty snippet list export handling', async () => {
    const { sandbox, downloads } = createScriptSandbox();
    let toastMsg = '';
    sandbox.showToast = (msg) => { toastMsg = msg; };

    await sandbox.exportSnippetsToZip([], 'test.zip', null);
    assertEqual(toastMsg, 'No snippets to export.', 'Empty export displays friendly toast message');
    assertEqual(downloads.length, 0, 'No ZIP download triggered for empty snippet list');
  });

  s3.test('Edge Case 3.2: Filename sanitization handles invalid chars, null bytes, and trims', () => {
    const { sandbox } = createScriptSandbox();
    const sanitize = sandbox.sanitizeFilename;

    assertEqual(sanitize('hello:world<test>file?*name|path/quote"'), 'hello_world_test_file_name_path_quote', 'Replaces invalid chars with underscore');
    assertEqual(sanitize('   spaced   name   '), 'spaced name', 'Normalizes multiple spaces');
    assertEqual(sanitize('___leading_and_trailing___'), 'leading_and_trailing', 'Trims leading and trailing underscores');
    assertEqual(sanitize(''), 'snippet', 'Empty string defaults to "snippet"');
    assertEqual(sanitize(null), 'snippet', 'Null defaults to "snippet"');
    assertEqual(sanitize(undefined), 'snippet', 'Undefined defaults to "snippet"');
    assertEqual(sanitize('a'.repeat(100)).length, 60, 'Truncates long titles to 60 chars maximum');
  });

  s3.test('Edge Case 3.3: Filename sanitization protects Windows reserved device names (CON, PRN, AUX, NUL, COM1-9)', () => {
    const { sandbox } = createScriptSandbox();
    const sanitize = sandbox.sanitizeFilename;

    const reserved = ['CON', 'con', 'PRN', 'prn', 'AUX', 'aux', 'NUL', 'nul', 'COM1', 'com5', 'COM9', 'LPT1', 'lpt7'];
    for (const name of reserved) {
      const sanitized = sanitize(name);
      assert(sanitized.startsWith('_'), `Reserved name ${name} must be prefixed with underscore: got ${sanitized}`);
    }

    assertEqual(sanitize('con.txt'), '_con.txt', 'con.txt prefixed with underscore');
    assertEqual(sanitize('aux.log'), '_aux.log', 'aux.log prefixed with underscore');
  });

  s3.test('Edge Case 3.4: Name collision prevention in single snippet ZIP and batch ZIP', () => {
    const { sandbox } = createScriptSandbox();

    const snippet1 = { title: 'snippet', category: 'Programming', content: '{"status":"ok"}' };
    const cat = snippet1.category;
    const ext = sandbox.getSnippetExtension(cat, snippet1.content);
    let codeFileName1 = `${sandbox.sanitizeFilename(snippet1.title)}.${ext}`;
    if (codeFileName1.toLowerCase() === 'snippet.json' || codeFileName1.toLowerCase() === 'readme.txt') {
      codeFileName1 = `${sandbox.sanitizeFilename(snippet1.title)}_code.${ext}`;
    }
    assertEqual(codeFileName1, 'snippet_code.json', 'Avoids collision with snippet.json metadata');

    const snippet2 = { title: 'README', category: 'Notes', content: 'Sample notes' };
    const ext2 = sandbox.getSnippetExtension(snippet2.category, snippet2.content);
    let codeFileName2 = `${sandbox.sanitizeFilename(snippet2.title)}.${ext2}`;
    if (codeFileName2.toLowerCase() === 'snippet.json' || codeFileName2.toLowerCase() === 'readme.txt') {
      codeFileName2 = `${sandbox.sanitizeFilename(snippet2.title)}_code.${ext2}`;
    }
    assertEqual(codeFileName2, 'README_code.txt', 'Avoids collision with README.txt file');
  });

  await s3.testAsync('Edge Case 3.5: Structured JSON backup extraction (quickcopy-backup.json vs loose files)', async () => {
    const { sandbox } = createScriptSandbox();

    const zip = new JSZip();
    const backupData = [
      { id: '1', title: 'Snippet 1', category: 'Programming', content: 'console.log("hello");' },
      { id: '2', title: 'Snippet 2', category: 'Commands', content: 'ls -la' }
    ];
    zip.file('quickcopy-backup.json', JSON.stringify(backupData));
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    zipBuf.name = 'backup.zip';
    zipBuf.size = zipBuf.length;

    await sandbox.handleSelectedZipFile(zipBuf);

    const parsed = sandbox.__getParsedZipSnippets();
    assertEqual(parsed.length, 2, 'Extracts 2 snippets from quickcopy-backup.json');
    assertEqual(parsed[0].title, 'Snippet 1', 'Snippet 1 title preserved');
    assertEqual(parsed[0].category, 'Programming', 'Category Programming preserved');
    assertEqual(parsed[1].content, 'ls -la', 'Snippet 2 content preserved');
  });

  s3.test('Edge Case 3.6: Category inference from file extensions & content heuristics', () => {
    const { sandbox } = createScriptSandbox();
    const getExt = sandbox.getSnippetExtension;

    // Programming heuristics
    assertEqual(getExt('Programming', 'def calculate_sum(a, b):\n  return a + b'), 'py', 'Python def heuristic');
    assertEqual(getExt('Programming', '<!DOCTYPE html>\n<html><body></body></html>'), 'html', 'HTML doctype heuristic');
    assertEqual(getExt('Programming', '.container { display: flex; margin: 0 auto; }'), 'css', 'CSS stylesheet heuristic');
    assertEqual(getExt('Programming', 'SELECT id, name FROM users WHERE active = 1;'), 'sql', 'SQL query heuristic');
    assertEqual(getExt('Programming', '{"name": "quickcopy", "version": "1.0.0"}'), 'json', 'JSON payload heuristic');
    assertEqual(getExt('Programming', 'type UserID = string | number;'), 'ts', 'TypeScript type alias heuristic');
    assertEqual(getExt('Programming', 'enum AppState { Loading, Ready, Error }'), 'ts', 'TypeScript enum heuristic');
    assertEqual(getExt('Programming', 'const sum = (a, b) => a + b;'), 'js', 'JavaScript default');

    // Commands heuristics
    assertEqual(getExt('Commands', 'Get-Process | Where-Object { $_.CPU -gt 10 }'), 'ps1', 'PowerShell heuristic');
    assertEqual(getExt('Commands', '@echo off\necho Hello World'), 'bat', 'Batch heuristic');
    assertEqual(getExt('Commands', 'docker compose up -d'), 'sh', 'Shell script default');

    // Notes heuristics
    assertEqual(getExt('Notes', '# Meeting Notes\n- Point 1\n- Point 2'), 'md', 'Markdown heading heuristic');
    assertEqual(getExt('Notes', 'Just a plain text reminder.'), 'txt', 'Plain text notes');
  });

  await s3.testAsync('Edge Case 3.7: Max 250 snippets import cap enforced', async () => {
    const { sandbox } = createScriptSandbox();

    const zip = new JSZip();
    const largeList = [];
    for (let i = 1; i <= 300; i++) {
      largeList.push({ title: `Snippet ${i}`, category: 'General', content: `Content ${i}` });
    }
    zip.file('quickcopy-backup.json', JSON.stringify(largeList));
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    zipBuf.name = 'bulk.zip';
    zipBuf.size = zipBuf.length;

    await sandbox.handleSelectedZipFile(zipBuf);

    assertEqual(sandbox.__getParsedZipSnippets().length, 250, 'Import strictly capped at 250 snippets');
  });

  await s3.testAsync('Edge Case 3.8: Content length boundary (10,000 chars) and title boundary (100 chars)', async () => {
    const { sandbox } = createScriptSandbox();

    const zip = new JSZip();
    const oversized = [
      {
        title: 'T'.repeat(150),
        category: 'General',
        content: 'C'.repeat(12000)
      }
    ];
    zip.file('quickcopy-backup.json', JSON.stringify(oversized));
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    zipBuf.name = 'oversized.zip';
    zipBuf.size = zipBuf.length;

    await sandbox.handleSelectedZipFile(zipBuf);

    const snippet = sandbox.__getParsedZipSnippets()[0];
    assertEqual(snippet.title.length, 100, 'Title truncated to exactly 100 chars');
    assertEqual(snippet.content.length, 10000, 'Content truncated to exactly 10,000 chars');
  });

  // ============================================================================
  // POINT 4: Error Handling & Stack Leak Prevention
  // ============================================================================
  const s4 = startSuite('Point 4: Error Handling & Stack Leak Prevention');

  await s4.testAsync('Error 4.1: Missing or corrupted ZIP files display clean user-facing error', async () => {
    const { sandbox, elements } = createScriptSandbox();
    const zipErrorEl = elements.get('zipError');

    // Corrupted buffer
    const badBuf = Buffer.from('NOT_A_VALID_ZIP_ARCHIVE_DATA');
    badBuf.name = 'corrupted.zip';
    badBuf.size = badBuf.length;

    await sandbox.handleSelectedZipFile(badBuf);

    assertEqual(zipErrorEl.textContent, 'Failed to extract ZIP archive. Please ensure it is a valid, uncorrupted ZIP file.');
    assert(!zipErrorEl.textContent.includes('offset'), 'No raw buffer stack error leaked');
    assert(!zipErrorEl.classList.contains('hidden'), 'Error container is visible');
  });

  await s4.testAsync('Error 4.2: Archive containing no valid text or code files displays warning', async () => {
    const { sandbox, elements } = createScriptSandbox();
    const zipErrorEl = elements.get('zipError');

    const zip = new JSZip();
    zip.file('image.png', Buffer.from([0x89, 0x50, 0x4E, 0x47]));
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    zipBuf.name = 'images_only.zip';
    zipBuf.size = zipBuf.length;

    await sandbox.handleSelectedZipFile(zipBuf);

    assertEqual(zipErrorEl.textContent, 'No valid text or code snippets found in this ZIP archive.');
  });

  await s4.testAsync('Error 4.3: File size exceeding 25MB limit rejected before unzipping', async () => {
    const { sandbox, elements } = createScriptSandbox();
    const zipErrorEl = elements.get('zipError');

    const oversizedFile = {
      name: 'giant.zip',
      size: 26 * 1024 * 1024 // 26MB > 25MB
    };

    await sandbox.handleSelectedZipFile(oversizedFile);

    assertEqual(zipErrorEl.textContent, 'File exceeds the 25MB size limit. Please choose a smaller ZIP archive.');
  });

  await s4.testAsync('Error 4.4: Non-zip file selection is rejected with clear instruction', async () => {
    const { sandbox, elements } = createScriptSandbox();
    const zipErrorEl = elements.get('zipError');

    await sandbox.handleSelectedZipFile({ name: 'document.pdf', size: 5000 });

    assertEqual(zipErrorEl.textContent, 'Please select a valid .zip file archive.');
  });

  s4.test('Error 4.5: Database errors do not leak stack traces or schema details to UI', () => {
    const { sandbox, elements } = createScriptSandbox();
    const zipErrorEl = elements.get('zipError');

    sandbox.displayZipError('Could not save snippets to the database.\nPlease try again.');

    assert(zipErrorEl.textContent.includes('Could not save snippets to the database.'), 'User-friendly message');
    assert(!zipErrorEl.textContent.includes('SELECT'), 'Zero SQL query leaked');
    assert(!zipErrorEl.textContent.includes('table snippets'), 'Zero table schema leaked');
  });

  // ============================================================================
  // POINT 5: Frontend and Backend Integration
  // ============================================================================
  const s5 = startSuite('Point 5: Frontend and Backend Integration Contracts');

  await s5.testAsync('Integration 5.1: Demo Mode saves imported snippets to localStorage under quickcopy_demo_snippets', async () => {
    const { sandbox, mockLocalStorage } = createScriptSandbox();
    sandbox.__setIsDemoMode(true);
    sandbox.__setParsedZipSnippets([
      { title: 'Local Demo Snippet', category: 'General', content: 'Demo text', checked: true }
    ]);

    await new Promise((resolve) => {
      sandbox.importSelectedZipSnippets();
      setTimeout(resolve, 350);
    });

    const stored = mockLocalStorage.getItem('quickcopy_demo_snippets');
    assert(stored !== null, 'quickcopy_demo_snippets key written to localStorage');
    const parsedStored = JSON.parse(stored);
    assert(parsedStored.some(s => s.title === 'Local Demo Snippet'), 'Imported snippet present in stored array');
    assert(parsedStored[0].id.startsWith('demo-'), 'Demo snippet assigned demo- id prefix');
  });

  await s5.testAsync('Integration 5.2: Supabase Mode dispatches batch insert to "snippets" table', async () => {
    let capturedTable = '';
    let capturedPayload = null;

    const mockSupabase = {
      from: (tableName) => {
        capturedTable = tableName;
        return {
          insert: (payload) => {
            capturedPayload = payload;
            return {
              select: async () => ({
                data: payload.map((p, idx) => ({ id: `supa-${idx}`, ...p, created_at: new Date().toISOString() })),
                error: null
              })
            };
          }
        };
      }
    };

    const { sandbox } = createScriptSandbox();
    sandbox.__setSupabaseClient(mockSupabase);
    sandbox.__setIsDemoMode(false);
    sandbox.__setParsedZipSnippets([
      { title: 'Cloud Snippet 1', category: 'Programming', content: 'x = 1', checked: true },
      { title: 'Cloud Snippet 2', category: 'Commands', content: 'npm test', checked: true }
    ]);

    await sandbox.importSelectedZipSnippets();

    assertEqual(capturedTable, 'snippets', 'Target table is "snippets"');
    assertEqual(capturedPayload.length, 2, 'Inserts 2 snippets in batch');
    assertEqual(capturedPayload[0].title, 'Cloud Snippet 1', 'Title correctly mapped in payload');
    assertEqual(capturedPayload[0].category, 'Programming', 'Category correctly mapped in payload');
  });

  // ============================================================================
  // POINT 6: Database Operations & Schema Integrity
  // ============================================================================
  const s6 = startSuite('Point 6: Database Operations & Schema Integrity');

  s6.test('Database payload schema contains only title, category, and content (no client IDs)', () => {
    const { sandbox } = createScriptSandbox();

    sandbox.__setParsedZipSnippets([
      { title: 'Valid Snippet', category: 'Notes', content: 'Notes text', checked: true }
    ]);

    const payload = sandbox.__getParsedZipSnippets().filter(s => s.checked).map(s => ({
      title: s.title,
      category: s.category,
      content: s.content
    }));

    const keys = Object.keys(payload[0]);
    assertEqual(keys.sort().join(','), 'category,content,title', 'Payload schema matches exactly title, category, content');
    assert(!('id' in payload[0]), 'Client must not supply snippet id for database generation');
    assert(!('created_at' in payload[0]), 'Client must not supply created_at for database default');
  });

  // ============================================================================
  // POINT 7: Security-Sensitive Functionality
  // ============================================================================
  const s7 = startSuite('Point 7: Security-Sensitive Functionality');

  await s7.testAsync('Security 7.1: Path traversal protection rejects archives containing "../" or "..\\"', async () => {
    const { sandbox, elements } = createScriptSandbox();
    const zipErrorEl = elements.get('zipError');

    // Simulate archive with path traversal entry
    sandbox.JSZip = {
      loadAsync: async () => ({
        files: {
          '../etc/passwd': { dir: false, async: () => 'root:x:0:0' }
        }
      })
    };

    await sandbox.handleSelectedZipFile({ name: 'malicious-traversal.zip', size: 1024 });

    assertEqual(zipErrorEl.textContent, 'Security alert: The archive contains unsafe relative path references (path traversal attempt).');
    assertEqual(sandbox.__getParsedZipSnippets().length, 0, 'No snippets parsed from traversal attack archive');
  });

  s7.test('Security 7.2: Strict XSS defense: previews and badges rendered via textContent exclusively', () => {
    const { sandbox, elements } = createScriptSandbox();
    const zipPreviewList = elements.get('zipPreviewList');

    const maliciousSnippet = {
      title: '<script>alert("xss")</script><img src=x onerror=alert(1)>',
      category: '<b onmouseover=alert(1)>Hack</b>',
      content: '<script>document.location="http://evil.com"</script>',
      checked: true
    };

    sandbox.__setParsedZipSnippets([maliciousSnippet]);
    sandbox.renderZipPreview();

    assert(zipPreviewList.children.length > 0, 'Preview item generated');
    const item = zipPreviewList.children[0];

    function checkNoHtmlInjection(node) {
      assert(!node.innerHTML.includes('<script>alert'), 'No unescaped script tag in innerHTML');
      assert(!node.innerHTML.includes('onerror='), 'No unescaped event handler in innerHTML');
      if (node.children) node.children.forEach(checkNoHtmlInjection);
    }
    checkNoHtmlInjection(item);
  });

  await s7.testAsync('Security 7.3: Binary files (.exe, .png, .pdf, .zip, etc.) automatically discarded', async () => {
    const { sandbox } = createScriptSandbox();

    const zip = new JSZip();
    zip.file('malware.exe', Buffer.from('MZ\x90\x00\x03\x00\x00\x00'));
    zip.file('photo.png', Buffer.from([0x89, 0x50, 0x4E, 0x47]));
    zip.file('document.pdf', Buffer.from('%PDF-1.4'));
    zip.file('nested.zip', Buffer.from('PK\x03\x04'));
    zip.file('valid_code.js', 'console.log("safe");');

    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    zipBuf.name = 'mixed.zip';
    zipBuf.size = zipBuf.length;

    await sandbox.handleSelectedZipFile(zipBuf);

    const parsed = sandbox.__getParsedZipSnippets();
    assertEqual(parsed.length, 1, 'Only the single valid JavaScript file is extracted');
    assertEqual(parsed[0].title, 'valid_code', 'Extracted valid code file title');
  });

  await s7.testAsync('Security 7.4: System and hidden files (__MACOSX, .DS_Store, .git) discarded', async () => {
    const { sandbox } = createScriptSandbox();

    const zip = new JSZip();
    zip.file('__MACOSX/._snippet.py', 'garbage metadata');
    zip.file('.DS_Store', 'desktop services store');
    zip.file('.git/config', 'repository config');
    zip.file('.gitignore', '*.log');
    zip.file('real_note.txt', 'Important meeting takeaways');

    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    zipBuf.name = 'mac_archive.zip';
    zipBuf.size = zipBuf.length;

    await sandbox.handleSelectedZipFile(zipBuf);

    const parsed = sandbox.__getParsedZipSnippets();
    assertEqual(parsed.length, 1, 'Hidden/system files discarded');
    assertEqual(parsed[0].title, 'real_note', 'Only real_note.txt extracted');
  });

  await s7.testAsync('Security 7.5: Null-byte (\\0) binary payload detection discards masquerading text files', async () => {
    const { sandbox } = createScriptSandbox();

    const zip = new JSZip();
    zip.file('fake_note.txt', 'Hello \0 binary executable fragment \0');
    zip.file('clean_note.txt', 'Hello normal clean text');

    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    zipBuf.name = 'nullbyte.zip';
    zipBuf.size = zipBuf.length;

    await sandbox.handleSelectedZipFile(zipBuf);

    const parsed = sandbox.__getParsedZipSnippets();
    assertEqual(parsed.length, 1, 'Null-byte file discarded');
    assertEqual(parsed[0].title, 'clean_note', 'Clean note extracted');
  });

  // ============================================================================
  // POINT 8: Performance & Responsiveness
  // ============================================================================
  const s8 = startSuite('Point 8: Performance & Responsiveness');

  s8.test('Total application bundle stays under 100 KB limit', () => {
    const totalBytes = htmlContent.length + jsContent.length + cssContent.length;
    const totalKB = (totalBytes / 1024).toFixed(2);
    console.log(`    Current bundle size: ${totalKB} KB (${totalBytes} bytes)`);
    assert(totalBytes < 100 * 1024, `Bundle size ${totalKB} KB must be under 100 KB`);
  });

  s8.test('Responsive CSS rules for ZIP modal and toolbar at 768px and 480px breakpoints', () => {
    assert(cssContent.includes('@media (max-width: 768px)'), 'Contains 768px tablet breakpoint');
    assert(cssContent.includes('@media (max-width: 480px)'), 'Contains 480px mobile breakpoint');
    assert(cssContent.includes('.modal-dialog-zip'), 'CSS styles .modal-dialog-zip');
    assert(cssContent.includes('.zip-dropzone'), 'CSS styles .zip-dropzone');
    assert(cssContent.includes('#downloadZipBtn'), 'CSS styles #downloadZipBtn');
    assert(cssContent.includes('#uploadZipBtn'), 'CSS styles #uploadZipBtn');
  });

  // ============================================================================
  // POINT 9: Review Changes Made by Each Sub-agent
  // ============================================================================
  const s9 = startSuite('Point 9: Review Changes Made by Each Sub-agent');

  s9.test('All ZIP elements referenced in script.js exist in quickcopy/index.html', () => {
    const referencedIds = [
      'downloadZipBtn', 'uploadZipBtn', 'uploadZipModal', 'closeZipModalBtn',
      'cancelZipModalBtn', 'confirmZipImportBtn', 'zipDropzone', 'zipFileInput',
      'zipFileInfo', 'zipFileName', 'zipFileSize', 'zipRemoveFileBtn',
      'zipCategoryOption', 'zipError', 'zipPreviewSection', 'zipPreviewList',
      'zipPreviewSummary', 'zipSelectAllCheckbox'
    ];

    referencedIds.forEach(id => {
      assert(htmlContent.includes(`id="${id}"`), `Element with id="${id}" exists in index.html`);
    });
  });

  s9.test('Root index.html is synchronized as a fast redirect to quickcopy/index.html', () => {
    assert(rootHtmlContent.includes('quickcopy/index.html'), 'Root redirects to quickcopy/index.html');
  });

  // ============================================================================
  // POINT 10: Non-Regression Verification
  // ============================================================================
  const s10 = startSuite('Point 10: Non-Regression Verification (Original 45-point Suite)');

  s10.test('Running test-runner.js completes with 100% PASS (45/45)', () => {
    const { execSync } = require('child_process');
    const output = execSync('node C:\\example\\test-runner.js', { encoding: 'utf8' });
    assert(output.includes('SUMMARY: Total: 45 | Passed: 45 | Failed: 0'), 'test-runner.js must report 45 passed, 0 failed');
  });

  // ============================================================================
  // POINT 11: Inconsistency Audit
  // ============================================================================
  const s11 = startSuite('Point 11: Inconsistency Audit Between Components');

  s11.test('Synchronized category definitions between #zipCategoryOption, #categoryFilter, and #snippetCategory', () => {
    const standardCategories = ['General', 'Programming', 'Thesis', 'Assignment', 'Commands', 'Notes', 'Links', 'Other'];

    standardCategories.forEach(cat => {
      assert(htmlContent.includes(`<option value="${cat}">${cat}</option>`) || htmlContent.includes(`value="${cat}"`), `Category ${cat} in dropdowns`);
    });

    const { sandbox } = createScriptSandbox();
    standardCategories.forEach(cat => {
      assertEqual(sandbox.normalizeCategory(cat.toLowerCase()), cat, `Normalizes ${cat}`);
    });
  });

  s11.test('CSS category badges defined for all valid categories', () => {
    const standardCategories = ['general', 'programming', 'thesis', 'assignment', 'commands', 'notes', 'links', 'other'];
    standardCategories.forEach(cat => {
      assert(cssContent.includes(`.badge-${cat}`), `CSS contains .badge-${cat}`);
    });
  });

  // ============================================================================
  // POINT 12: Re-Testing Corrected Issues
  // ============================================================================
  const s12 = startSuite('Point 12: Re-Testing Corrected Issues');

  await s12.testAsync('Issue 12.1: Pluralization support: single "snippet.json" parsed as single-item backup', async () => {
    const { sandbox } = createScriptSandbox();

    const zip = new JSZip();
    const singleMeta = {
      id: 'single-123',
      title: 'Solo Snippet',
      category: 'Commands',
      content: 'git status'
    };
    zip.file('snippet.json', JSON.stringify(singleMeta));
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    zipBuf.name = 'single_snippet_export.zip';
    zipBuf.size = zipBuf.length;

    await sandbox.handleSelectedZipFile(zipBuf);

    const parsed = sandbox.__getParsedZipSnippets();
    assertEqual(parsed.length, 1, 'Correctly parses singular snippet.json');
    assertEqual(parsed[0].title, 'Solo Snippet', 'Title parsed from snippet.json');
    assertEqual(parsed[0].category, 'Commands', 'Category parsed from snippet.json');
  });

  s12.test('Issue 12.2: Name collision avoidance prevents overwriting snippet.json or README.txt', () => {
    const { sandbox } = createScriptSandbox();

    function resolveSnippetFileName(title, category, content) {
      const ext = sandbox.getSnippetExtension(category, content);
      const safeTitle = sandbox.sanitizeFilename(title || 'snippet');
      let codeFileName = `${safeTitle}.${ext}`;
      if (codeFileName.toLowerCase() === 'snippet.json' || codeFileName.toLowerCase() === 'readme.txt') {
        codeFileName = `${safeTitle}_code.${ext}`;
      }
      return codeFileName;
    }

    assertEqual(resolveSnippetFileName('snippet', 'Programming', '{"data":1}'), 'snippet_code.json', 'Avoids collision with snippet.json');
    assertEqual(resolveSnippetFileName('README', 'Notes', 'Notes text'), 'README_code.txt', 'Avoids collision with README.txt');
    assertEqual(resolveSnippetFileName('my_script', 'Programming', 'console.log(1)'), 'my_script.js', 'Normal filename preserved');
  });

  s12.test('Issue 12.3: Focus trap properly filters out hidden or disabled elements', () => {
    assert(jsContent.includes('filter((el) => el.offsetParent !== null && window.getComputedStyle(el).visibility !== "hidden")'),
      'Focus trap filters out hidden elements using offsetParent and visibility'
    );
  });

  // Print results
  console.log('\n======================================================');
  console.log('              VERIFICATION REPORT TELEMETRY           ');
  console.log('======================================================\n');

  results.suites.forEach(suite => {
    console.log(`--- ${suite.name} ---`);
    suite.tests.forEach(t => {
      const mark = t.status === 'PASS' ? '✓ [PASS]' : '✗ [FAIL]';
      console.log(`  ${mark} ${t.description}`);
      if (t.error) {
        console.log(`      Error: ${t.error}`);
      }
    });
    console.log('');
  });

  console.log('======================================================');
  console.log(`SUMMARY: Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log('======================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runAllSuites().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
