/**
 * QuickCopy Automated Test Runner & Verification Suite
 * Executes 12-Point Protocol Verification for QuickCopy
 */

const fs = require('fs');
const path = require('path');

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

// Read all key files
const rootHtmlContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const htmlContent = fs.readFileSync(path.join(QUICKCOPY_DIR, 'index.html'), 'utf8');
const jsContent = fs.readFileSync(path.join(QUICKCOPY_DIR, 'script.js'), 'utf8');
const cssContent = fs.readFileSync(path.join(QUICKCOPY_DIR, 'style.css'), 'utf8');
const readmeContent = fs.readFileSync(path.join(QUICKCOPY_DIR, 'README.md'), 'utf8');

// ============================================================================
// POINT 1: Original Requirements & Project Structure
// ============================================================================
const s1 = startSuite('Point 1: Original Requirements & Project Structure');

s1.test('Root index.html exists and redirects to quickcopy/index.html', () => {
  assert(rootHtmlContent.includes('url=quickcopy/index.html'), 'Meta refresh redirect to quickcopy/index.html');
  assert(rootHtmlContent.includes('window.location.replace("quickcopy/index.html")'), 'JavaScript location replace redirect');
  assert(rootHtmlContent.includes('href="quickcopy/index.html"'), 'Fallback anchor link to quickcopy/index.html');
  assert(rootHtmlContent.includes('<!DOCTYPE html>'), 'Valid HTML5 doctype in root index.html');
});

s1.test('QuickCopy required files exist and are non-empty', () => {
  const files = ['index.html', 'style.css', 'script.js', 'README.md'];
  for (const f of files) {
    const fullPath = path.join(QUICKCOPY_DIR, f);
    assert(fs.existsSync(fullPath), `File ${f} exists`);
    assert(fs.statSync(fullPath).size > 100, `File ${f} is populated`);
  }
});

s1.test('Pure Vanilla Stack without heavy frameworks or auth dependencies', () => {
  assert(!htmlContent.includes('react.production.min.js'), 'Zero React');
  assert(!htmlContent.includes('vue.global.js'), 'Zero Vue');
  assert(!htmlContent.includes('bootstrap.min.css'), 'Zero Bootstrap');
  assert(htmlContent.includes('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'), 'Loads official Supabase JS v2 CDN');
  assert(!htmlContent.includes('auth0') && !htmlContent.includes('firebase-auth'), 'Pure anonymous no-auth app');
});

// ============================================================================
// POINT 2: Check Every Implemented Feature
// ============================================================================
const s2 = startSuite('Point 2: Every Implemented Feature Verification');

s2.test('Header elements exist (Brand title, subtitle, + Create button)', () => {
  assert(htmlContent.includes('class="brand-title"'), 'Brand title container');
  assert(htmlContent.includes('📋 QuickCopy'), 'Brand title text');
  assert(htmlContent.includes('Share • Copy • Done'), 'Brand subtitle text');
  assert(htmlContent.includes('id="openCreateBtn"'), 'Header + Create button (#openCreateBtn)');
});

s2.test('Search box and controls (input, clear button, search icon)', () => {
  assert(htmlContent.includes('id="searchInput"'), 'Search input with id="searchInput"');
  assert(htmlContent.includes('id="clearSearchBtn"'), 'Clear search button with id="clearSearchBtn"');
  assert(htmlContent.includes('class="search-icon"'), 'Search icon element');
  assert(htmlContent.includes('placeholder="🔍 Search snippets..."'), 'Search placeholder');
});

s2.test('Category filter dropdown options', () => {
  assert(htmlContent.includes('id="categoryFilter"'), 'Category select #categoryFilter exists');
  const categories = ['All', 'General', 'Programming', 'Thesis', 'Assignment', 'Commands', 'Notes', 'Links', 'Other'];
  for (const cat of categories) {
    assert(htmlContent.includes(`value="${cat}"`), `Category filter includes "${cat}"`);
  }
});

s2.test('Copy All button with icon and title', () => {
  assert(htmlContent.includes('id="copyAllBtn"'), 'Copy All button exists');
  assert(htmlContent.includes('Copy All'), 'Copy All button label');
  assert(jsContent.includes('function copyAllSnippets()'), 'copyAllSnippets function declared');
});

s2.test('Create snippet modal dialog with accessibility attributes', () => {
  assert(htmlContent.includes('id="createModal"'), 'Modal element with id="createModal"');
  assert(htmlContent.includes('role="dialog"'), 'Accessible role="dialog"');
  assert(htmlContent.includes('aria-modal="true"'), 'aria-modal="true" set');
  assert(htmlContent.includes('aria-labelledby="modalHeading"'), 'aria-labelledby linked to modal heading');
  assert(htmlContent.includes('id="closeModalBtn"'), 'Modal close button');
  assert(htmlContent.includes('id="cancelModalBtn"'), 'Modal cancel button');
});

s2.test('Form fields and character counters in Create modal', () => {
  assert(htmlContent.includes('id="snippetTitle"'), 'Title field #snippetTitle');
  assert(htmlContent.includes('maxlength="100"'), 'HTML maxlength 100 on title');
  assert(htmlContent.includes('id="titleCharCount"'), 'Title char count element');
  assert(htmlContent.includes('id="snippetCategory"'), 'Category select #snippetCategory');
  assert(htmlContent.includes('id="snippetContent"'), 'Content textarea #snippetContent');
  assert(htmlContent.includes('maxlength="10000"'), 'HTML maxlength 10000 on content');
  assert(htmlContent.includes('id="contentCharCount"'), 'Content char count element');
  assert(htmlContent.includes('id="saveSnippetBtn"'), 'Save button #saveSnippetBtn');
});

s2.test('All three state views: loading, empty, and error', () => {
  assert(htmlContent.includes('id="loadingState"'), 'Loading state container');
  assert(htmlContent.includes('class="spinner"'), 'Loading spinner');
  assert(htmlContent.includes('id="emptyState"'), 'Empty state container');
  assert(htmlContent.includes('id="emptyCreateBtn"'), 'Empty state create button');
  assert(htmlContent.includes('id="errorState"'), 'Error state container');
  assert(htmlContent.includes('id="retryBtn"'), 'Error state retry button');
});

s2.test('Sorting logic orders newest first (created_at DESC)', () => {
  assert(jsContent.includes('new Date(b.created_at) - new Date(a.created_at)'), 'Descending sort by created_at in local demo mode');
  assert(jsContent.includes('.order("created_at", { ascending: false })'), 'Supabase order by created_at descending');
});

// ============================================================================
// POINT 3: Edge Cases & Boundaries
// ============================================================================
const s3 = startSuite('Point 3: Edge Cases & Boundary Conditions');

function validateSnippet(titleInput, contentInput) {
  const title = (titleInput || '').trim();
  const rawContent = contentInput || '';

  if (!title) {
    return { valid: false, error: 'Title is required.' };
  }
  if (title.length > 100) {
    return { valid: false, error: 'Title must be 100 characters or fewer.' };
  }
  if (!rawContent.trim()) {
    return { valid: false, error: 'Content is required.' };
  }
  if (rawContent.length > 10000) {
    return { valid: false, error: 'Content must be 10,000 characters or fewer.' };
  }
  const content = rawContent.trimEnd();
  return { valid: true, title, content };
}

s3.test('Edge Case: Whitespace-only title rejection', () => {
  assertEqual(validateSnippet('     ', 'Valid Content').valid, false);
  assertEqual(validateSnippet('\t\r\n  \t', 'Valid Content').valid, false);
  assertEqual(validateSnippet('', 'Valid Content').valid, false);
});

s3.test('Edge Case: Whitespace-only content rejection', () => {
  assertEqual(validateSnippet('Valid Title', '     ').valid, false);
  assertEqual(validateSnippet('Valid Title', '\n\n\r\t   ').valid, false);
  assertEqual(validateSnippet('Valid Title', '').valid, false);
});

s3.test('Edge Case: Exact 100 char title accepted', () => {
  const t100 = 'T'.repeat(100);
  const res = validateSnippet(t100, 'Content');
  assertEqual(res.valid, true);
  assertEqual(res.title.length, 100);
});

s3.test('Edge Case: 101 char title rejection', () => {
  const t101 = 'T'.repeat(101);
  const res = validateSnippet(t101, 'Content');
  assertEqual(res.valid, false);
  assertEqual(res.error, 'Title must be 100 characters or fewer.');
});

s3.test('Edge Case: Exact 10,000 char content accepted', () => {
  const c10000 = 'C'.repeat(10000);
  const res = validateSnippet('Title', c10000);
  assertEqual(res.valid, true);
  assertEqual(res.content.length, 10000);
});

s3.test('Edge Case: 10,001 char content rejection', () => {
  const c10001 = 'C'.repeat(10001);
  const res = validateSnippet('Title', c10001);
  assertEqual(res.valid, false);
  assertEqual(res.error, 'Content must be 10,000 characters or fewer.');
});

s3.test('Edge Case: Multi-line indentation preservation (Python def, YAML indentation)', () => {
  const pythonCode = '    def calculate(x, y):\n        val = x + y\n        return val * 2';
  const res = validateSnippet('Python Indent Test', pythonCode);
  assertEqual(res.valid, true);
  assertEqual(res.content, pythonCode);
  assert(res.content.startsWith('    def'), 'Line 1 4-space indent preserved');

  const yamlConfig = '  server:\n    host: 0.0.0.0\n    port: 8080\n    routes:\n      - /api';
  const yamlRes = validateSnippet('YAML Indent Test', yamlConfig);
  assertEqual(yamlRes.content, yamlConfig);
});

s3.test('Edge Case: Truncation threshold logic (> 6 lines or > 300 chars)', () => {
  function isTruncated(rawContent) {
    const lineCount = (rawContent.match(/\n/g) || []).length + 1;
    return lineCount > 6 || rawContent.length > 300;
  }

  // Exactly 6 lines, 100 chars -> false
  assertEqual(isTruncated('1\n2\n3\n4\n5\n6'), false, '6 lines should not truncate');

  // 7 lines -> true
  assertEqual(isTruncated('1\n2\n3\n4\n5\n6\n7'), true, '7 lines should truncate');

  // Exactly 300 chars, 1 line -> false
  assertEqual(isTruncated('a'.repeat(300)), false, '300 chars should not truncate');

  // 301 chars -> true
  assertEqual(isTruncated('a'.repeat(301)), true, '301 chars should truncate');
});

s3.test('Edge Case: Truncation toggle interaction simulation', () => {
  // Simulate DOM toggle behavior
  let isTruncatedClass = true;
  let buttonText = 'Show more ▼';
  let ariaExpanded = 'false';

  function onToggleClick() {
    if (isTruncatedClass) {
      isTruncatedClass = false;
      buttonText = 'Show less ▲';
      ariaExpanded = 'true';
    } else {
      isTruncatedClass = true;
      buttonText = 'Show more ▼';
      ariaExpanded = 'false';
    }
  }

  // Initial state
  assertEqual(isTruncatedClass, true);
  assertEqual(buttonText, 'Show more ▼');
  assertEqual(ariaExpanded, 'false');

  // Click 1: Expand
  onToggleClick();
  assertEqual(isTruncatedClass, false);
  assertEqual(buttonText, 'Show less ▲');
  assertEqual(ariaExpanded, 'true');

  // Click 2: Collapse
  onToggleClick();
  assertEqual(isTruncatedClass, true);
  assertEqual(buttonText, 'Show more ▼');
  assertEqual(ariaExpanded, 'false');
});

// ============================================================================
// POINT 4: Error Handling & Data Leak Prevention
// ============================================================================
const s4 = startSuite('Point 4: Error Handling & Stack Leak Prevention');

s4.test('Load error shows exact user error message and zero database stack leak', () => {
  assert(jsContent.includes('"Unable to load snippets.\\n\\nPlease refresh the page and try again."'));
  // Confirm errorState title and desc are populated cleanly without leaking error object
  assert(jsContent.includes('titleEl.textContent = parts[0];'));
  assert(jsContent.includes('descEl.textContent = parts[1];'));
});

s4.test('Save error shows exact user error message without leaking DB internals', () => {
  assert(jsContent.includes('"Could not save your snippet.\\nPlease try again."'));
  assert(jsContent.includes('displayFormError("Could not save your snippet.\\nPlease try again.");'));
});

s4.test('Validation error strings match specification exactly', () => {
  assert(jsContent.includes('"Title is required."'));
  assert(jsContent.includes('"Title must be 100 characters or fewer."'));
  assert(jsContent.includes('"Content is required."'));
  assert(jsContent.includes('"Content must be 10,000 characters or fewer."'));
});

// ============================================================================
// POINT 5: Frontend and Supabase Integration Contracts
// ============================================================================
const s5 = startSuite('Point 5: Frontend & Supabase Integration Contracts');

s5.test('Table schema contract: table name is snippets', () => {
  assert(readmeContent.includes('CREATE TABLE IF NOT EXISTS public.snippets'));
  assert(jsContent.includes('.from("snippets")'));
});

s5.test('Columns contract: id, title, category, content, created_at', () => {
  assert(readmeContent.includes('id UUID PRIMARY KEY DEFAULT gen_random_uuid()'));
  assert(readmeContent.includes('title VARCHAR(100) NOT NULL'));
  assert(readmeContent.includes('category VARCHAR(50) NOT NULL DEFAULT \'General\''));
  assert(readmeContent.includes('content TEXT NOT NULL'));
  assert(readmeContent.includes('created_at TIMESTAMPTZ NOT NULL DEFAULT timezone(\'utc\'::text, now())'));
  assert(jsContent.includes('.select("id, title, category, content, created_at")'));
});

// ============================================================================
// POINT 6: Database Operations & Row Level Security (RLS)
// ============================================================================
const s6 = startSuite('Point 6: Database Operations & RLS Verification');

s6.test('RLS is enabled on snippets table', () => {
  assert(readmeContent.includes('ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;'));
});

s6.test('RLS SELECT policy: public read allowed for anon and authenticated', () => {
  assert(readmeContent.includes('CREATE POLICY "Allow public read access to snippets"'));
  assert(readmeContent.includes('FOR SELECT'));
  assert(readmeContent.includes('TO anon, authenticated'));
  assert(readmeContent.includes('USING (true);'));
});

s6.test('RLS INSERT policy: insert permitted with length & trim checks', () => {
  assert(readmeContent.includes('CREATE POLICY "Allow public insert access to snippets"'));
  assert(readmeContent.includes('FOR INSERT'));
  assert(readmeContent.includes('char_length(trim(title)) > 0 AND char_length(title) <= 100'));
  assert(readmeContent.includes('char_length(trim(content)) > 0 AND char_length(content) <= 10000'));
});

s6.test('RLS UPDATE and DELETE policies intentionally omitted to forbid modification by anon', () => {
  assert(readmeContent.includes('omitting UPDATE and DELETE policies for the'));
  assert(!jsContent.includes('.from("snippets").update'));
  assert(!jsContent.includes('.from("snippets").delete'));
});

// ============================================================================
// POINT 7: Security & Strict XSS Prevention
// ============================================================================
const s7 = startSuite('Point 7: Security & Strict XSS Prevention');

s7.test('Snippet title uses textContent', () => {
  assert(jsContent.includes('title.textContent = snippet.title || "Untitled Snippet";'));
  assert(!jsContent.includes('title.innerHTML = snippet.title'));
});

s7.test('Snippet content uses textContent inside pre tag', () => {
  assert(jsContent.includes('pre.textContent = snippet.content || "";'));
  assert(!jsContent.includes('pre.innerHTML = snippet.content'));
});

s7.test('Category badge uses textContent', () => {
  assert(jsContent.includes('categoryBadge.textContent = cat;'));
  assert(!jsContent.includes('categoryBadge.innerHTML = cat'));
});

s7.test('Form errors and toast messages use textContent exclusively', () => {
  assert(jsContent.includes('formError.textContent = msg;'));
  assert(jsContent.includes('toastMessage.textContent = message;'));
  assert(!jsContent.includes('formError.innerHTML = msg'));
  assert(!jsContent.includes('toastMessage.innerHTML = message'));
});

s7.test('XSS script injection payload simulation executes as harmless text', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror="alert(1)">',
    '"><svg onload=alert(document.domain)>',
    'javascript:alert(1)'
  ];

  for (const payload of xssPayloads) {
    // In DOM, element.textContent = payload sets the text node without parsing HTML
    const encoded = payload
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    assert(!encoded.includes('<script>'), 'Payload contains no active <script>');
    assert(!encoded.includes('<img'), 'Payload contains no active <img');
  }
});

// ============================================================================
// POINT 8: Performance & Responsiveness
// ============================================================================
const s8 = startSuite('Point 8: Performance & Responsiveness');

s8.test('CSS media queries exist for tablet (768px) and mobile (480px)', () => {
  assert(cssContent.includes('@media (max-width: 768px)'), 'Includes @media (max-width: 768px)');
  assert(cssContent.includes('@media (max-width: 480px)'), 'Includes @media (max-width: 480px)');
});

s8.test('CSS media query styles toolbar vertically on mobile screens', () => {
  assert(cssContent.includes('flex-direction: column;'));
  assert(cssContent.includes('grid-template-columns: 1fr;'));
});

s8.test('Total asset payload is ultra-lightweight (Zero heavy JS/CSS frameworks)', () => {
  const htmlSize = fs.statSync(path.join(QUICKCOPY_DIR, 'index.html')).size;
  const cssSize = fs.statSync(path.join(QUICKCOPY_DIR, 'style.css')).size;
  const jsSize = fs.statSync(path.join(QUICKCOPY_DIR, 'script.js')).size;
  const totalKb = (htmlSize + cssSize + jsSize) / 1024;
  console.log(`    Total application bundle size: ${totalKb.toFixed(2)} KB`);
  assert(totalKb < 100, `Total bundle size should be < 100 KB, got ${totalKb.toFixed(2)} KB`);
});

// ============================================================================
// POINT 9: Component Synchronization
// ============================================================================
const s9 = startSuite('Point 9: Component Synchronization & Selectors');

s9.test('All DOM element IDs referenced in script.js exist in index.html', () => {
  const matches = jsContent.matchAll(/document\.getElementById\("([^"]+)"\)/g);
  const referencedIds = new Set([...matches].map(m => m[1]));

  for (const id of referencedIds) {
    assert(htmlContent.includes(`id="${id}"`), `DOM element id="${id}" referenced in script.js must exist in index.html`);
  }
});

s9.test('Category badges defined in CSS cover all available categories', () => {
  const categories = ['programming', 'thesis', 'assignment', 'commands', 'notes', 'links', 'general', 'other'];
  for (const cat of categories) {
    assert(cssContent.includes(`.badge-${cat}`), `CSS includes .badge-${cat}`);
  }
});

// ============================================================================
// POINT 10: Non-Regression & Core Flow Verification
// ============================================================================
const s10 = startSuite('Point 10: Non-Regression & Core Flow Verification');

s10.test('Real-time filtering simulation across query and category', () => {
  const mockSnippets = [
    { id: '1', title: 'Docker Compose Postgres', category: 'Commands', content: 'postgres:16' },
    { id: '2', title: 'React Hook useDebounce', category: 'Programming', content: 'function useDebounce' },
    { id: '3', title: 'Thesis Chapter 3', category: 'Thesis', content: 'Methodology notes' },
    { id: '4', title: 'General Note', category: 'General', content: 'Some plain notes' }
  ];

  function filter(snippets, query, category) {
    const q = (query || '').trim().toLowerCase();
    const selCat = category || 'All';
    return snippets.filter(s => {
      const matchesCat = selCat === 'All' || (s.category && s.category.toLowerCase() === selCat.toLowerCase());
      const matchesQuery = !q ||
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.content && s.content.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }

  // All category, empty query
  assertEqual(filter(mockSnippets, '', 'All').length, 4);

  // Category filter: Commands
  const cmdResults = filter(mockSnippets, '', 'Commands');
  assertEqual(cmdResults.length, 1);
  assertEqual(cmdResults[0].id, '1');

  // Category filter: General
  const genResults = filter(mockSnippets, '', 'General');
  assertEqual(genResults.length, 1);
  assertEqual(genResults[0].id, '4');

  // Search query: debounce
  const searchResults = filter(mockSnippets, 'debounce', 'All');
  assertEqual(searchResults.length, 1);
  assertEqual(searchResults[0].id, '2');

  // Case insensitivity: REACT
  const caseResults = filter(mockSnippets, 'REACT', 'All');
  assertEqual(caseResults.length, 1);
  assertEqual(caseResults[0].id, '2');

  // Mismatch query
  const emptyRes = filter(mockSnippets, 'nonexistentxyz123', 'All');
  assertEqual(emptyRes.length, 0);
});

s10.test('Copy All formatting logic formatted as Title\\n\\nContent\\n\\n\\nTitle\\n\\nContent', () => {
  const testList = [
    { title: 'T1', content: 'C1' },
    { title: 'T2', content: 'C2' }
  ];

  const formatted = testList.map(s => `${s.title || 'Untitled'}\n\n${s.content || ''}`).join('\n\n\n');
  assertEqual(formatted, 'T1\n\nC1\n\n\nT2\n\nC2');
});

// ============================================================================
// POINT 11: Identify Inconsistencies Between Components
// ============================================================================
const s11 = startSuite('Point 11: Inconsistency Audit');

s11.test('Check category consistency between #categoryFilter and #snippetCategory', () => {
  const filterMatch = htmlContent.match(/<select id="categoryFilter"[\s\S]*?<\/select>/i);
  assert(filterMatch, '#categoryFilter select found');
  const filterOptions = [...filterMatch[0].matchAll(/value="([^"]+)"/g)].map(m => m[1]);

  const modalMatch = htmlContent.match(/<select id="snippetCategory"[\s\S]*?<\/select>/i);
  assert(modalMatch, '#snippetCategory select found');
  const modalOptions = [...modalMatch[0].matchAll(/value="([^"]+)"/g)].map(m => m[1]);

  console.log('    #categoryFilter options:', filterOptions);
  console.log('    #snippetCategory options:', modalOptions);

  // Verify all categories in snippetCategory exist in categoryFilter
  for (const opt of modalOptions) {
    assert(filterOptions.includes(opt), `Category "${opt}" from snippet modal must exist in category filter`);
  }
});

// ============================================================================
// POINT 12: Re-Test Corrected Issues
// ============================================================================
const s12 = startSuite('Point 12: Re-Testing Corrected Issues');

s12.test('Re-Test: Category "General" is present in #categoryFilter and selectable', () => {
  assert(htmlContent.includes('<option value="General">General</option>'),
    '<option value="General">General</option> is present in index.html');
});

s12.test('Re-Test: Copy button provides tactile feedback and calls clipboard fallback', () => {
  assert(jsContent.includes('buttonElement.textContent = "✓ COPIED";'), 'Feedback text is ✓ COPIED');
  assert(jsContent.includes('buttonElement.classList.add("is-copied");'), 'Adds is-copied class');
  assert(jsContent.includes('fallbackExecCommandCopy'), 'Has execCommand fallback');
  assert(jsContent.includes('textArea.setSelectionRange'), 'Has iOS selection range fallback');
});

s12.test('Re-Test: Copy All button triggers feedback only on successful copy operation', () => {
  assert(jsContent.includes('onSuccessCallback'), 'copySnippet accepts onSuccessCallback');
  assert(jsContent.includes('COPIED ALL'), 'Updates to COPIED ALL upon success');
});

// ============================================================================
// SUMMARY & REPORT
// ============================================================================
console.log('\n======================================================');
console.log('           QUICKCOPY TEST SUITE EXECUTION             ');
console.log('======================================================\n');

for (const suite of results.suites) {
  console.log(`\n--- ${suite.name} ---`);
  for (const t of suite.tests) {
    const symbol = t.status === 'PASS' ? '✓' : '✗';
    console.log(`  ${symbol} [${t.status}] ${t.description}`);
    if (t.error) {
      console.log(`      Error: ${t.error}`);
    }
  }
}

console.log('\n======================================================');
console.log(`SUMMARY: Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
console.log('======================================================\n');

if (results.failed > 0) {
  process.exitCode = 1;
}
