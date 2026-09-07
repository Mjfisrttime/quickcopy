/**
 * ============================================================================
 * QuickCopy — Modern Snippet Sharing Application
 * ============================================================================
 */

// ==========================================
// 1. SUPABASE CONFIGURATION
// ==========================================
// Replace these with your actual Supabase project credentials.
// Find them at: https://supabase.com/dashboard/project/_/settings/api
const SUPABASE_URL = "https://llnxlxocfzeqqkqocxsa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbnhseG9jZnplcXFrcW9jeHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDA4NDMsImV4cCI6MjEwNDMxNjg0M30.i5gtm504ky0xNQaAkUrFZWEdChG57HpCvxoeFNvLsfg";

// ==========================================
// 2. APPLICATION STATE & CLIENT SETUP
// ==========================================
let supabaseClient = null;
let allSnippets = [];
let currentFilteredSnippets = [];
let isDemoMode = false;
let toastTimeoutId = null;
let lastFocusedElement = null;

// Initial sample seed data for demo / offline testing
const INITIAL_DEMO_SNIPPETS = [
  {
    id: "demo-1",
    title: "Docker Compose for PostgreSQL",
    category: "Commands",
    content: "services:\n  postgres:\n    image: postgres:16-alpine\n    restart: always\n    environment:\n      POSTGRES_USER: admin\n      POSTGRES_PASSWORD: secretpassword\n      POSTGRES_DB: quickcopy_db\n    ports:\n      - \"5432:5432\"\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n\nvolumes:\n  pgdata:",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
  },
  {
    id: "demo-2",
    title: "React Custom Hook: useDebounce",
    category: "Programming",
    content: "import { useState, useEffect } from 'react';\n\nexport function useDebounce(value, delay = 300) {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n\n  useEffect(() => {\n    const timer = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n\n  return debouncedValue;\n}",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
  },
  {
    id: "demo-3",
    title: "Thesis Methodology Outline",
    category: "Thesis",
    content: "Chapter 3: Methodology\n\n3.1 Research Design (Mixed Methods Approach)\n3.2 Population & Sampling Strategy (Stratified random sample, N=250)\n3.3 Data Collection Instruments (Structured surveys & semi-structured interviews)\n3.4 Reliability and Validity Verification (Cronbach's Alpha > 0.82)\n3.5 Ethical Considerations (Institutional Review Board approval & informed consent)\n3.6 Data Analysis Framework (SPSS descriptive statistics & NVivo thematic coding)",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
  },
  {
    id: "demo-4",
    title: "Git Undo Last Commit (Keep Changes)",
    category: "Commands",
    content: "# Soft reset undoes the last commit but leaves your changes staged:\ngit reset --soft HEAD~1\n\n# Mixed reset (default) undoes commit and unstages changes:\ngit reset HEAD~1\n\n# To completely discard the last commit and all changes (CAUTION):\ngit reset --hard HEAD~1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
  },
  {
    id: "demo-5",
    title: "Assignment Citation Formats (APA 7th)",
    category: "Assignment",
    content: "Journal Article:\nAuthor, A. A., & Author, B. B. (Year). Title of article. Title of Periodical, volume(issue), pp-pp. https://doi.org/xxxx\n\nBook:\nAuthor, A. A. (Year). Title of work: Capital letter also for subtitle (edition). Publisher.\n\nWebsite:\nAuthor, A. A. (Year, Month Day). Title of web page. Website Name. URL",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() // 3 days ago
  }
];

// ==========================================
// 3. DOM ELEMENTS
// ==========================================
let searchInput;
let clearSearchBtn;
let categoryFilter;
let copyAllBtn;
let openCreateBtn;
let emptyCreateBtn;
let retryBtn;
let snippetsGrid;
let loadingState;
let emptyState;
let errorState;
let resultsCount;
let activeFilterTag;
let demoBanner;
let dismissBannerBtn;

// Modal Elements
let createModal;
let closeModalBtn;
let cancelModalBtn;
let createSnippetForm;
let snippetTitle;
let snippetCategory;
let snippetContent;
let titleCharCount;
let contentCharCount;
let formError;
let saveSnippetBtn;

// Toast Element
let toast;
let toastMessage;

// ==========================================
// 4. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initDOMElements();
  setupEventListeners();
  checkSupabaseConfiguration();
  loadSnippets();
});

/**
 * Cache references to all required DOM elements
 */
function initDOMElements() {
  searchInput = document.getElementById("searchInput");
  clearSearchBtn = document.getElementById("clearSearchBtn");
  categoryFilter = document.getElementById("categoryFilter");
  copyAllBtn = document.getElementById("copyAllBtn");
  openCreateBtn = document.getElementById("openCreateBtn");
  emptyCreateBtn = document.getElementById("emptyCreateBtn");
  retryBtn = document.getElementById("retryBtn");
  snippetsGrid = document.getElementById("snippetsGrid");
  loadingState = document.getElementById("loadingState");
  emptyState = document.getElementById("emptyState");
  errorState = document.getElementById("errorState");
  resultsCount = document.getElementById("resultsCount");
  activeFilterTag = document.getElementById("activeFilterTag");
  demoBanner = document.getElementById("demoBanner");
  dismissBannerBtn = document.getElementById("dismissBannerBtn");

  createModal = document.getElementById("createModal");
  closeModalBtn = document.getElementById("closeModalBtn");
  cancelModalBtn = document.getElementById("cancelModalBtn");
  createSnippetForm = document.getElementById("createSnippetForm");
  snippetTitle = document.getElementById("snippetTitle");
  snippetCategory = document.getElementById("snippetCategory");
  snippetContent = document.getElementById("snippetContent");
  titleCharCount = document.getElementById("titleCharCount");
  contentCharCount = document.getElementById("contentCharCount");
  formError = document.getElementById("formError");
  saveSnippetBtn = document.getElementById("saveSnippetBtn");

  toast = document.getElementById("toast");
  toastMessage = document.getElementById("toastMessage");
}

/**
 * Check whether valid Supabase credentials were provided.
 * Falls back gracefully to Demo Mode if placeholder keys are detected.
 */
function checkSupabaseConfiguration() {
  const isPlaceholderUrl = 
    !SUPABASE_URL ||
    SUPABASE_URL === "YOUR_SUPABASE_URL" ||
    !SUPABASE_URL.startsWith("http");

  const isPlaceholderKey = 
    !SUPABASE_ANON_KEY || 
    SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY" ||
    SUPABASE_ANON_KEY.length < 20;

  if (isPlaceholderUrl || isPlaceholderKey) {
    isDemoMode = true;
    if (demoBanner) {
      demoBanner.classList.remove("hidden");
    }
    console.info(
      "%c[QuickCopy]%c Running in local demo fallback mode. Configure SUPABASE_URL and SUPABASE_ANON_KEY in script.js to connect to Supabase.",
      "color: #2563eb; font-weight: bold;",
      "color: inherit;"
    );
  } else {
    isDemoMode = false;
    if (demoBanner) {
      demoBanner.classList.add("hidden");
    }
    try {
      if (window.supabase && typeof window.supabase.createClient === "function") {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } else {
        console.warn("[QuickCopy] Supabase JS SDK not loaded from CDN. Falling back to demo mode.");
        isDemoMode = true;
      }
    } catch (err) {
      console.error("[QuickCopy] Error initializing Supabase client:", err);
      isDemoMode = true;
    }
  }
}

/**
 * Register all event listeners
 */
function setupEventListeners() {
  // Search and filter listeners
  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim().length > 0) {
      clearSearchBtn.classList.remove("hidden");
    } else {
      clearSearchBtn.classList.add("hidden");
    }
    filterSnippets();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    searchInput.focus();
    filterSnippets();
  });

  categoryFilter.addEventListener("change", () => {
    filterSnippets();
  });

  // Copy All button
  copyAllBtn.addEventListener("click", () => {
    copyAllSnippets();
  });

  // Modal open / close listeners
  openCreateBtn.addEventListener("click", () => openModal());
  emptyCreateBtn.addEventListener("click", () => openModal());
  closeModalBtn.addEventListener("click", () => closeModal());
  cancelModalBtn.addEventListener("click", () => closeModal());

  // Close modal when clicking outside of dialog
  createModal.addEventListener("click", (event) => {
    if (event.target === createModal) {
      closeModal();
    }
  });

  // Handle modal keyboard accessibility (Escape to close, Tab focus trapping)
  document.addEventListener("keydown", (event) => {
    if (createModal.classList.contains("hidden")) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key === "Tab") {
      const focusable = createModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    }
  });

  // Form input character counters & validation styling
  snippetTitle.addEventListener("input", () => {
    const len = snippetTitle.value.length;
    titleCharCount.textContent = `${len} / 100`;
    if (len >= 100) {
      titleCharCount.classList.add("is-limit");
    } else {
      titleCharCount.classList.remove("is-limit");
    }
    hideFormError();
  });

  snippetContent.addEventListener("input", () => {
    const len = snippetContent.value.length;
    contentCharCount.textContent = `${len} / 10000`;
    if (len >= 10000) {
      contentCharCount.classList.add("is-limit");
    } else {
      contentCharCount.classList.remove("is-limit");
    }
    hideFormError();
  });

  // Form submission
  createSnippetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createSnippet();
  });

  // Retry button
  retryBtn.addEventListener("click", () => {
    loadSnippets();
  });

  // Demo banner dismiss
  if (dismissBannerBtn) {
    dismissBannerBtn.addEventListener("click", () => {
      if (demoBanner) demoBanner.classList.add("hidden");
    });
  }
}

// ==========================================
// 5. CORE FUNCTIONS
// ==========================================

/**
 * Load snippets from Supabase or localStorage demo database.
 * Orders snippets by created_at DESC (newest first).
 */
async function loadSnippets() {
  // Show loading state, hide other views
  loadingState.classList.remove("hidden");
  emptyState.classList.add("hidden");
  errorState.classList.add("hidden");
  snippetsGrid.innerHTML = "";

  if (isDemoMode) {
    // Simulate brief network fetch in demo mode for realistic UI transition
    setTimeout(() => {
      try {
        const stored = localStorage.getItem("quickcopy_demo_snippets");
        if (stored) {
          allSnippets = JSON.parse(stored);
        } else {
          allSnippets = [...INITIAL_DEMO_SNIPPETS];
          localStorage.setItem("quickcopy_demo_snippets", JSON.stringify(allSnippets));
        }

        // Sort descending by created_at
        allSnippets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        loadingState.classList.add("hidden");
        filterSnippets();
      } catch (err) {
        console.error("[QuickCopy Demo] Error loading local snippets:", err);
        showErrorState("Unable to load snippets.\n\nPlease refresh the page and try again.");
      }
    }, 200);
    return;
  }

  // Live Supabase query
  try {
    const { data, error } = await supabaseClient
      .from("snippets")
      .select("id, title, category, content, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[QuickCopy Supabase Query Error]", error);
      showErrorState("Unable to load snippets.\n\nPlease refresh the page and try again.");
      return;
    }

    allSnippets = data || [];
    loadingState.classList.add("hidden");
    filterSnippets();
  } catch (err) {
    console.error("[QuickCopy Network Error]", err);
    showErrorState("Unable to load snippets.\n\nPlease refresh the page and try again.");
  }
}

/**
 * Filter snippets in real-time by search query (title, content, category)
 * and selected category filter.
 */
function filterSnippets() {
  const query = (searchInput.value || "").trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  currentFilteredSnippets = allSnippets.filter((snippet) => {
    // Category check
    const matchesCategory = 
      selectedCategory === "All" || 
      (snippet.category && snippet.category.toLowerCase() === selectedCategory.toLowerCase());

    // Search query check
    const titleText = (snippet.title || "").toLowerCase();
    const contentText = (snippet.content || "").toLowerCase();
    const catText = (snippet.category || "").toLowerCase();

    const matchesSearch = 
      !query || 
      titleText.includes(query) || 
      contentText.includes(query) || 
      catText.includes(query);

    return matchesCategory && matchesSearch;
  });

  updateResultsMeta(query, selectedCategory, currentFilteredSnippets.length, allSnippets.length);
  renderSnippets(currentFilteredSnippets);
}

/**
 * Update the metadata indicator below the toolbar
 */
function updateResultsMeta(query, category, count, total) {
  if (total === 0) {
    resultsCount.textContent = "0 snippets";
    activeFilterTag.classList.add("hidden");
    return;
  }

  resultsCount.textContent = `Showing ${count} of ${total} snippet${total === 1 ? "" : "s"}`;

  if (category !== "All" || query) {
    const filtersApplied = [];
    if (category !== "All") filtersApplied.push(`Category: ${category}`);
    if (query) filtersApplied.push(`"${query}"`);
    activeFilterTag.textContent = filtersApplied.join(" • ");
    activeFilterTag.classList.remove("hidden");
  } else {
    activeFilterTag.classList.add("hidden");
  }
}

/**
 * Safely render snippets to the DOM.
 * STRICT XSS PREVENTION: Uses document.createElement and textContent exclusively.
 * NEVER inserts untrusted user content into innerHTML.
 */
function renderSnippets(snippetsToDisplay = currentFilteredSnippets) {
  // Clear existing items in grid
  snippetsGrid.innerHTML = "";

  // 1. Overall empty state (no snippets exist in database)
  if (allSnippets.length === 0) {
    emptyState.classList.remove("hidden");
    snippetsGrid.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  snippetsGrid.classList.remove("hidden");

  // 2. Filter/Search returned no matches
  if (snippetsToDisplay.length === 0) {
    const noMatchBox = document.createElement("div");
    noMatchBox.className = "state-box";
    noMatchBox.style.gridColumn = "1 / -1";
    noMatchBox.style.padding = "3rem 1.5rem";

    const noMatchIcon = document.createElement("div");
    noMatchIcon.className = "state-icon";
    noMatchIcon.textContent = "🔍";

    const noMatchTitle = document.createElement("h3");
    noMatchTitle.className = "state-title";
    noMatchTitle.textContent = "No matching snippets";

    const noMatchDesc = document.createElement("p");
    noMatchDesc.className = "state-desc";
    noMatchDesc.textContent = "Try adjusting your search terms or category filter.";

    const clearBtn = document.createElement("button");
    clearBtn.className = "btn btn-secondary";
    clearBtn.type = "button";
    clearBtn.textContent = "Reset Filters";
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearSearchBtn.classList.add("hidden");
      categoryFilter.value = "All";
      filterSnippets();
    });

    noMatchBox.appendChild(noMatchIcon);
    noMatchBox.appendChild(noMatchTitle);
    noMatchBox.appendChild(noMatchDesc);
    noMatchBox.appendChild(clearBtn);

    snippetsGrid.appendChild(noMatchBox);
    return;
  }

  // 3. Render snippet cards safely
  snippetsToDisplay.forEach((snippet) => {
    const card = createSnippetCardElement(snippet);
    snippetsGrid.appendChild(card);
  });
}

/**
 * Build a single snippet card DOM element safely with createElement
 */
function createSnippetCardElement(snippet) {
  const card = document.createElement("article");
  card.className = "snippet-card";
  card.setAttribute("data-id", snippet.id || "");

  // Header
  const header = document.createElement("div");
  header.className = "snippet-card-header";

  const titleRow = document.createElement("div");
  titleRow.className = "snippet-title-row";

  const title = document.createElement("h2");
  title.className = "snippet-title";
  title.textContent = snippet.title || "Untitled Snippet";
  titleRow.appendChild(title);

  const metaRow = document.createElement("div");
  metaRow.className = "snippet-meta-row";

  // Category Badge
  const categoryBadge = document.createElement("span");
  const cat = snippet.category || "General";
  const catSlug = cat.toLowerCase().replace(/[^a-z0-9]/g, "");
  categoryBadge.className = `category-badge badge-${catSlug}`;
  categoryBadge.textContent = cat;
  metaRow.appendChild(categoryBadge);

  // Formatted Time
  const timeSpan = document.createElement("time");
  timeSpan.className = "snippet-time";
  timeSpan.textContent = formatTimestamp(snippet.created_at);
  if (snippet.created_at) {
    timeSpan.setAttribute("datetime", snippet.created_at);
  }
  metaRow.appendChild(timeSpan);

  header.appendChild(titleRow);
  header.appendChild(metaRow);

  // Body / Content
  const body = document.createElement("div");
  body.className = "snippet-card-body";

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "snippet-content-wrapper";

  const pre = document.createElement("pre");
  pre.className = "snippet-content";
  pre.textContent = snippet.content || "";
  contentWrapper.appendChild(pre);

  body.appendChild(contentWrapper);

  // Truncation Check: > 6 lines or > 300 characters
  const rawContent = snippet.content || "";
  const lineCount = (rawContent.match(/\n/g) || []).length + 1;
  const isLong = lineCount > 6 || rawContent.length > 300;

  if (isLong) {
    contentWrapper.classList.add("is-truncated");

    const expandBtn = document.createElement("button");
    expandBtn.className = "snippet-expand-btn";
    expandBtn.type = "button";
    expandBtn.textContent = "Show more ▼";
    expandBtn.setAttribute("aria-expanded", "false");

    expandBtn.addEventListener("click", () => {
      const isCurrentlyTruncated = contentWrapper.classList.contains("is-truncated");
      if (isCurrentlyTruncated) {
        contentWrapper.classList.remove("is-truncated");
        expandBtn.textContent = "Show less ▲";
        expandBtn.setAttribute("aria-expanded", "true");
      } else {
        contentWrapper.classList.add("is-truncated");
        expandBtn.textContent = "Show more ▼";
        expandBtn.setAttribute("aria-expanded", "false");
      }
    });

    body.appendChild(expandBtn);
  }

  // Footer / Copy Action
  const footer = document.createElement("div");
  footer.className = "snippet-card-footer";

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn-copy";
  copyBtn.type = "button";
  copyBtn.textContent = "📋 COPY";
  copyBtn.setAttribute("aria-label", `Copy snippet "${snippet.title}"`);

  copyBtn.addEventListener("click", () => {
    copySnippet(snippet.content || "", copyBtn);
  });

  footer.appendChild(copyBtn);

  // Assemble card
  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(footer);

  return card;
}

/**
 * Create a new snippet and save to Supabase or Demo localStorage
 */
async function createSnippet() {
  const title = (snippetTitle.value || "").trim();
  const category = snippetCategory.value || "General";
  const rawContent = snippetContent.value || "";

  // Validate title: 1-100 characters
  if (!title) {
    displayFormError("Title is required.");
    snippetTitle.focus();
    return;
  }
  if (title.length > 100) {
    displayFormError("Title must be 100 characters or fewer.");
    snippetTitle.focus();
    return;
  }

  // Validate content: 1-10,000 characters (check non-empty after trim, but preserve code indentation)
  if (!rawContent.trim()) {
    displayFormError("Content is required.");
    snippetContent.focus();
    return;
  }
  if (rawContent.length > 10000) {
    displayFormError("Content must be 10,000 characters or fewer.");
    snippetContent.focus();
    return;
  }

  // Preserve initial line indentation for code/commands while trimming trailing whitespace
  const content = rawContent.trimEnd();

  // Indicate loading state on button
  setSavingState(true);
  hideFormError();

  const newSnippetRecord = {
    title,
    category,
    content,
    created_at: new Date().toISOString()
  };

  if (isDemoMode) {
    // Local demo storage
    setTimeout(() => {
      try {
        const demoId = "demo-" + Date.now();
        const createdItem = { id: demoId, ...newSnippetRecord };

        allSnippets.unshift(createdItem);
        localStorage.setItem("quickcopy_demo_snippets", JSON.stringify(allSnippets));

        setSavingState(false);
        closeModal();
        filterSnippets();
        showToast("Snippet created successfully!");
      } catch (err) {
        console.error("[QuickCopy Demo] Save error:", err);
        setSavingState(false);
        displayFormError("Could not save your snippet.\nPlease try again.");
      }
    }, 200);
    return;
  }

  // Supabase insertion
  try {
    const { data, error } = await supabaseClient
      .from("snippets")
      .insert([
        {
          title: newSnippetRecord.title,
          category: newSnippetRecord.category,
          content: newSnippetRecord.content
        }
      ])
      .select();

    if (error) {
      console.error("[QuickCopy Supabase Save Error]", error);
      setSavingState(false);
      displayFormError("Could not save your snippet.\nPlease try again.");
      return;
    }

    // Add created item to local state
    if (data && data.length > 0) {
      allSnippets.unshift(data[0]);
    } else {
      allSnippets.unshift(newSnippetRecord);
    }

    setSavingState(false);
    closeModal();
    filterSnippets();
    showToast("Snippet created successfully!");
  } catch (err) {
    console.error("[QuickCopy Save Network Error]", err);
    setSavingState(false);
    displayFormError("Could not save your snippet.\nPlease try again.");
  }
}

/**
 * Copy a snippet's text to the clipboard.
 * Features modern navigator.clipboard with fallback to document.execCommand('copy').
 * Updates button to "✓ COPIED" for 2 seconds.
 */
function copySnippet(text, buttonElement, customToast = "Copied to clipboard!", onSuccessCallback) {
  if (!text) {
    showToast("Nothing to copy.");
    return;
  }

  const handleSuccess = () => {
    if (buttonElement) {
      const originalText = buttonElement.textContent;
      buttonElement.textContent = "✓ COPIED";
      buttonElement.classList.add("is-copied");

      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.classList.remove("is-copied");
      }, 2000);
    }
    if (typeof onSuccessCallback === "function") {
      onSuccessCallback();
    }
    showToast(customToast);
  };

  const handleFailure = (err) => {
    console.error("[QuickCopy] Copy failed:", err);
    showToast("Unable to copy to clipboard.");
  };

  // Attempt Modern Clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text).then(handleSuccess).catch(() => {
      // Fallback if permission rejected or unsupported in context
      fallbackExecCommandCopy(text, handleSuccess, handleFailure);
    });
  } else {
    // Fallback for older browsers or insecure contexts
    fallbackExecCommandCopy(text, handleSuccess, handleFailure);
  }
}

/**
 * Fallback copy implementation using an invisible textarea
 */
function fallbackExecCommandCopy(text, onSuccess, onFailure) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    if (typeof textArea.setSelectionRange === "function") {
      textArea.setSelectionRange(0, textArea.value.length);
    }

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      onSuccess();
    } else {
      onFailure(new Error("execCommand copy returned false"));
    }
  } catch (err) {
    onFailure(err);
  }
}

/**
 * Copy all currently visible snippets formatted as:
 * Title 1\n\nContent 1\n\n\nTitle 2\n\nContent 2
 */
function copyAllSnippets() {
  if (!currentFilteredSnippets || currentFilteredSnippets.length === 0) {
    showToast("No snippets to copy.");
    return;
  }

  // Format visibly filtered snippets
  const formattedContent = currentFilteredSnippets
    .map((s) => `${s.title || "Untitled"}\n\n${s.content || ""}`)
    .join("\n\n\n");

  const originalHtml = copyAllBtn.innerHTML;

  copySnippet(
    formattedContent, 
    null, 
    `Copied all (${currentFilteredSnippets.length}) snippets to clipboard!`,
    () => {
      // Provide temporary feedback on the Copy All button only on success
      copyAllBtn.innerHTML = '<span class="btn-icon">✓</span> COPIED ALL';
      copyAllBtn.classList.add("btn-primary");
      copyAllBtn.classList.remove("btn-secondary");

      setTimeout(() => {
        copyAllBtn.innerHTML = originalHtml;
        copyAllBtn.classList.remove("btn-primary");
        copyAllBtn.classList.add("btn-secondary");
      }, 2000);
    }
  );
}

/**
 * Open the "Create New Snippet" modal and reset form fields
 */
function openModal() {
  lastFocusedElement = document.activeElement;
  createSnippetForm.reset();
  titleCharCount.textContent = "0 / 100";
  titleCharCount.classList.remove("is-limit");
  contentCharCount.textContent = "0 / 10000";
  contentCharCount.classList.remove("is-limit");
  hideFormError();

  createModal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Prevent background scroll

  // Focus on title input after opening
  setTimeout(() => {
    snippetTitle.focus();
  }, 50);
}

/**
 * Close the "Create New Snippet" modal
 */
function closeModal() {
  createModal.classList.add("hidden");
  document.body.style.overflow = "";
  hideFormError();

  // Restore focus to triggering element
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

/**
 * Display a temporary floating toast notification
 */
function showToast(message) {
  if (!toast || !toastMessage) return;

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
    toastTimeoutId = null;
  }

  toastMessage.textContent = message;
  toast.classList.remove("hidden");

  toastTimeoutId = setTimeout(() => {
    toast.classList.add("hidden");
    toastTimeoutId = null;
  }, 2800);
}

// ==========================================
// 6. HELPER & UTILITY FUNCTIONS
// ==========================================

function displayFormError(msg) {
  formError.textContent = msg;
  formError.classList.remove("hidden");
}

function hideFormError() {
  formError.textContent = "";
  formError.classList.add("hidden");
}

function setSavingState(isSaving) {
  if (isSaving) {
    saveSnippetBtn.disabled = true;
    saveSnippetBtn.querySelector(".btn-text").textContent = "Saving...";
  } else {
    saveSnippetBtn.disabled = false;
    saveSnippetBtn.querySelector(".btn-text").textContent = "Save Snippet";
  }
}

function showErrorState(message) {
  loadingState.classList.add("hidden");
  emptyState.classList.add("hidden");
  snippetsGrid.innerHTML = "";

  const titleEl = errorState.querySelector(".state-title");
  const descEl = errorState.querySelector(".state-desc");

  const parts = message.split("\n\n");
  if (parts.length >= 2) {
    titleEl.textContent = parts[0];
    descEl.textContent = parts[1];
  } else {
    titleEl.textContent = message;
    descEl.textContent = "";
  }

  errorState.classList.remove("hidden");
}

/**
 * Format timestamp into human-readable representation
 */
function formatTimestamp(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    // Format full date e.g. "Sep 7, 2026"
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
  } catch {
    return "";
  }
}
