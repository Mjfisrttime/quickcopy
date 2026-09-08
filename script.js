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

// ZIP Toolbar & Modal Elements
let downloadZipBtn;
let uploadZipBtn;
let uploadZipModal;
let closeZipModalBtn;
let cancelZipModalBtn;
let confirmZipImportBtn;
let zipDropzone;
let zipFileInput;
let zipFileInfo;
let zipFileName;
let zipFileSize;
let zipRemoveFileBtn;
let zipCategoryOption;
let zipError;
let zipPreviewSection;
let zipPreviewSummary;
let zipSelectAllCheckbox;
let zipPreviewList;

// Toast Element
let toast;
let toastMessage;

// ZIP System State
let parsedZipSnippets = [];

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

  downloadZipBtn = document.getElementById("downloadZipBtn");
  uploadZipBtn = document.getElementById("uploadZipBtn");
  uploadZipModal = document.getElementById("uploadZipModal");
  closeZipModalBtn = document.getElementById("closeZipModalBtn");
  cancelZipModalBtn = document.getElementById("cancelZipModalBtn");
  confirmZipImportBtn = document.getElementById("confirmZipImportBtn");
  zipDropzone = document.getElementById("zipDropzone");
  zipFileInput = document.getElementById("zipFileInput");
  zipFileInfo = document.getElementById("zipFileInfo");
  zipFileName = document.getElementById("zipFileName");
  zipFileSize = document.getElementById("zipFileSize");
  zipRemoveFileBtn = document.getElementById("zipRemoveFileBtn");
  zipCategoryOption = document.getElementById("zipCategoryOption");
  zipError = document.getElementById("zipError");
  zipPreviewSection = document.getElementById("zipPreviewSection");
  zipPreviewSummary = document.getElementById("zipPreviewSummary");
  zipSelectAllCheckbox = document.getElementById("zipSelectAllCheckbox");
  zipPreviewList = document.getElementById("zipPreviewList");

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

  // ZIP Toolbar listeners
  if (downloadZipBtn) {
    downloadZipBtn.addEventListener("click", () => {
      const listToExport = (currentFilteredSnippets && currentFilteredSnippets.length > 0)
        ? currentFilteredSnippets
        : allSnippets;
      exportSnippetsToZip(listToExport, undefined, downloadZipBtn);
    });
  }

  if (uploadZipBtn) {
    uploadZipBtn.addEventListener("click", () => openZipModal());
  }

  // Create Modal open / close listeners
  openCreateBtn.addEventListener("click", () => openModal());
  emptyCreateBtn.addEventListener("click", () => openModal());
  closeModalBtn.addEventListener("click", () => closeModal());
  cancelModalBtn.addEventListener("click", () => closeModal());

  // Close create modal when clicking outside of dialog
  createModal.addEventListener("click", (event) => {
    if (event.target === createModal) {
      closeModal();
    }
  });

  // Upload ZIP Modal open / close listeners
  if (closeZipModalBtn) {
    closeZipModalBtn.addEventListener("click", () => closeZipModal());
  }
  if (cancelZipModalBtn) {
    cancelZipModalBtn.addEventListener("click", () => closeZipModal());
  }
  if (uploadZipModal) {
    uploadZipModal.addEventListener("click", (event) => {
      if (event.target === uploadZipModal) {
        closeZipModal();
      }
    });
  }

  // Dropzone drag-and-drop & file selection listeners
  if (zipDropzone) {
    zipDropzone.addEventListener("click", () => {
      if (zipFileInput) zipFileInput.click();
    });

    zipDropzone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (zipFileInput) zipFileInput.click();
      }
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      zipDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        zipDropzone.classList.add("drag-over");
      });
    });

    ["dragleave", "dragend"].forEach((eventName) => {
      zipDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        zipDropzone.classList.remove("drag-over");
      });
    });

    zipDropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      zipDropzone.classList.remove("drag-over");
      const files = event.dataTransfer ? event.dataTransfer.files : null;
      if (files && files.length > 0) {
        handleSelectedZipFile(files[0]);
      }
    });
  }

  if (zipFileInput) {
    zipFileInput.addEventListener("change", () => {
      if (zipFileInput.files && zipFileInput.files.length > 0) {
        handleSelectedZipFile(zipFileInput.files[0]);
      }
    });
  }

  if (zipRemoveFileBtn) {
    zipRemoveFileBtn.addEventListener("click", () => {
      resetZipModalState();
    });
  }

  if (zipCategoryOption) {
    zipCategoryOption.addEventListener("change", () => {
      applyZipCategoryOptionChange();
    });
  }

  if (zipSelectAllCheckbox) {
    zipSelectAllCheckbox.addEventListener("change", () => {
      toggleSelectAllZipSnippets(zipSelectAllCheckbox.checked);
    });
  }

  if (confirmZipImportBtn) {
    confirmZipImportBtn.addEventListener("click", () => {
      importSelectedZipSnippets();
    });
  }

  // Handle modal keyboard accessibility (Escape to close, Tab focus trapping)
  document.addEventListener("keydown", (event) => {
    const isCreateOpen = createModal && !createModal.classList.contains("hidden");
    const isZipOpen = uploadZipModal && !uploadZipModal.classList.contains("hidden");

    if (!isCreateOpen && !isZipOpen) return;

    const activeModal = isCreateOpen ? createModal : uploadZipModal;

    if (event.key === "Escape") {
      if (isCreateOpen) closeModal();
      if (isZipOpen) closeZipModal();
      return;
    }

    if (event.key === "Tab") {
      const focusable = Array.from(
        activeModal.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        )
      ).filter((el) => el.offsetParent !== null && window.getComputedStyle(el).visibility !== "hidden");
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

  // Footer / Action Buttons (ZIP & Copy)
  const footer = document.createElement("div");
  footer.className = "snippet-card-footer";

  const zipBtn = document.createElement("button");
  zipBtn.className = "btn-copy btn-card-zip";
  zipBtn.type = "button";
  zipBtn.textContent = "📦 ZIP";
  zipBtn.setAttribute("aria-label", `Download snippet "${snippet.title}" as ZIP`);

  zipBtn.addEventListener("click", () => {
    downloadSingleSnippetZip(snippet, zipBtn);
  });

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn-copy";
  copyBtn.type = "button";
  copyBtn.textContent = "📋 COPY";
  copyBtn.setAttribute("aria-label", `Copy snippet "${snippet.title}"`);

  copyBtn.addEventListener("click", () => {
    copySnippet(snippet.content || "", copyBtn);
  });

  footer.appendChild(zipBtn);
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

// ==========================================
// 7. ZIP EXPORT & IMPORT SYSTEM
// ==========================================

/**
 * Sanitize a string for safe usage in a file or directory name across platforms.
 * Strips invalid characters: < > : " / \ | ? * \0 and control chars.
 */
function sanitizeFilename(name) {
  if (!name || typeof name !== "string") return "snippet";
  let cleaned = name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/_+/g, "_")
    .replace(/^[_.\s]+|[_.\s]+$/g, "");
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(cleaned)) {
    cleaned = `_${cleaned}`;
  }
  return cleaned.slice(0, 60).trim() || "snippet";
}

/**
 * Determine suitable file extension based on category and content heuristics.
 */
function getSnippetExtension(category, content) {
  const cat = (category || "").toLowerCase();
  const text = (content || "").trim();

  if (cat === "programming") {
    if (/^\s*def\s+[a-zA-Z_]|import\s+[a-zA-Z_]|elif\s+|if\s+__name__\s*==/m.test(text)) {
      return "py";
    }
    if (/^\s*<!DOCTYPE\s+html|<html|<body|<div|<head/i.test(text)) {
      return "html";
    }
    if (/[{;][\s\n]*[a-zA-Z-]+:\s*[^;]+;/m.test(text) && !text.includes("function") && !text.includes("const ")) {
      return "css";
    }
    if (/^\s*(SELECT|INSERT\s+INTO|CREATE\s+TABLE|UPDATE|DELETE\s+FROM|ALTER\s+TABLE)\s+/i.test(text)) {
      return "sql";
    }
    if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
      try {
        JSON.parse(text);
        return "json";
      } catch {}
    }
    if (/\b(interface|type|enum)\s+[A-Z]|\b:\s*(string|number|boolean|any)\b/.test(text)) {
      return "ts";
    }
    return "js";
  }

  if (cat === "commands") {
    if (/^\s*(SELECT|INSERT|CREATE|UPDATE|DELETE)\s+/i.test(text)) {
      return "sql";
    }
    if (/^\s*(Get-|Set-|New-|Remove-|Start-|Stop-|\$[a-zA-Z_])/m.test(text) || text.includes("powershell")) {
      return "ps1";
    }
    if (/^@echo\b|^rem\b/im.test(text)) {
      return "bat";
    }
    return "sh";
  }

  if (cat === "notes" || cat === "thesis" || cat === "assignment") {
    if (/^#{1,6}\s+|^\s*[-*+]\s+|```|\*\*[\w\s]+\*\*/m.test(text)) {
      return "md";
    }
    return "txt";
  }

  if (cat === "links") {
    return "txt";
  }

  return "txt";
}

/**
 * Trigger client-side file download for a Blob object.
 */
function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 150);
}

/**
 * Export a list of snippets as an organized ZIP archive.
 * Formats files into snippets/<Category>/<Title>.<ext>, includes quickcopy-backup.json
 * and a README.txt, and compresses with DEFLATE.
 */
async function exportSnippetsToZip(snippetsList, archiveFilename, buttonElement) {
  if (!snippetsList || snippetsList.length === 0) {
    showToast("No snippets to export.");
    return;
  }

  if (typeof JSZip === "undefined") {
    showToast("ZIP library not loaded. Please check your connection.");
    return;
  }

  let originalHtml = "";
  if (buttonElement) {
    originalHtml = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
  }

  try {
    const zip = new JSZip();
    const usedPaths = new Set();

    // 1. Add individual snippet files into folder structure
    snippetsList.forEach((snippet) => {
      const cat = snippet.category || "General";
      const ext = getSnippetExtension(cat, snippet.content || "");
      const baseName = sanitizeFilename(snippet.title || "snippet");
      
      let filePath = `snippets/${cat}/${baseName}.${ext}`;
      let counter = 1;
      while (usedPaths.has(filePath)) {
        filePath = `snippets/${cat}/${baseName}_${counter}.${ext}`;
        counter++;
      }
      usedPaths.add(filePath);

      zip.file(filePath, snippet.content || "");
    });

    // 2. Add quickcopy-backup.json with full structured metadata
    const backupData = snippetsList.map((s) => ({
      id: s.id || "",
      title: s.title || "Untitled Snippet",
      category: s.category || "General",
      content: s.content || "",
      created_at: s.created_at || new Date().toISOString()
    }));
    zip.file("quickcopy-backup.json", JSON.stringify(backupData, null, 2));

    // 3. Add friendly README.txt
    const readmeContent = [
      "QuickCopy Snippets Archive",
      "==========================",
      `Exported: ${new Date().toLocaleString()}`,
      `Total Snippets: ${snippetsList.length}`,
      "",
      "This archive was generated by QuickCopy (Share • Copy • Done).",
      "",
      "Contents:",
      '1. "snippets/<Category>/" - Code and text files organized by category.',
      '2. "quickcopy-backup.json" - Full snippet records with JSON metadata and timestamps.',
      "",
      "Importing:",
      "You can restore or import these snippets back into QuickCopy at any time:",
      '1. Open QuickCopy in your browser.',
      '2. Click "Import ZIP" in the toolbar.',
      "3. Drag and drop this ZIP file into the import dialog.",
      '4. Preview your snippets and click "Import Snippets".'
    ].join("\r\n");
    zip.file("README.txt", readmeContent);

    // 4. Generate ZIP blob with DEFLATE compression
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    // 5. Trigger download
    const filename = archiveFilename || `quickcopy-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    triggerBlobDownload(blob, filename);

    // 6. Tactile button feedback
    if (buttonElement) {
      buttonElement.innerHTML = '<span class="btn-icon">✓</span> Downloaded';
      buttonElement.classList.add("is-copied");

      setTimeout(() => {
        buttonElement.innerHTML = originalHtml;
        buttonElement.disabled = false;
        buttonElement.classList.remove("is-copied");
      }, 2000);
    }

    showToast(`Exported ${snippetsList.length} snippet${snippetsList.length === 1 ? "" : "s"} to ZIP!`);
  } catch (err) {
    console.error("[QuickCopy] Error exporting ZIP archive:", err);
    if (buttonElement) {
      buttonElement.innerHTML = originalHtml;
      buttonElement.disabled = false;
    }
    showToast("Failed to generate ZIP export.");
  }
}

/**
 * Download a single snippet packaged into its own .zip file.
 * Contains the snippet file, snippet.json metadata, and a README.txt.
 */
async function downloadSingleSnippetZip(snippet, buttonElement) {
  if (!snippet) return;

  if (typeof JSZip === "undefined") {
    showToast("ZIP library not loaded. Please check your connection.");
    return;
  }

  let originalText = "";
  if (buttonElement) {
    originalText = buttonElement.textContent;
    buttonElement.disabled = true;
    buttonElement.textContent = "⏳ ZIP";
  }

  try {
    const zip = new JSZip();
    const cat = snippet.category || "General";
    const ext = getSnippetExtension(cat, snippet.content || "");
    const safeTitle = sanitizeFilename(snippet.title || "snippet");
    let codeFileName = `${safeTitle}.${ext}`;
    if (codeFileName.toLowerCase() === "snippet.json" || codeFileName.toLowerCase() === "readme.txt") {
      codeFileName = `${safeTitle}_code.${ext}`;
    }

    // 1. Snippet code/text file
    zip.file(codeFileName, snippet.content || "");

    // 2. snippet.json metadata
    const meta = {
      id: snippet.id || "",
      title: snippet.title || "Untitled Snippet",
      category: cat,
      content: snippet.content || "",
      created_at: snippet.created_at || new Date().toISOString()
    };
    zip.file("snippet.json", JSON.stringify(meta, null, 2));

    // 3. README.txt
    const readmeContent = [
      "QuickCopy Snippet Export",
      "========================",
      `Title: ${snippet.title || "Untitled Snippet"}`,
      `Category: ${cat}`,
      `Created: ${snippet.created_at ? new Date(snippet.created_at).toLocaleString() : new Date().toLocaleString()}`,
      "",
      "Files in this archive:",
      `- ${codeFileName}: Source content of the snippet`,
      "- snippet.json: Structured JSON metadata",
      "",
      "This snippet can be imported back into QuickCopy at any time via the Import ZIP modal."
    ].join("\r\n");
    zip.file("README.txt", readmeContent);

    // 4. Generate ZIP blob with DEFLATE compression
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    // 5. Trigger download
    triggerBlobDownload(blob, `quickcopy-${safeTitle}.zip`);

    // 6. Button feedback
    if (buttonElement) {
      buttonElement.textContent = "✓ ZIP";
      buttonElement.classList.add("is-downloaded");

      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
        buttonElement.classList.remove("is-downloaded");
      }, 2000);
    }

    showToast("Downloaded snippet ZIP!");
  } catch (err) {
    console.error("[QuickCopy] Error downloading snippet ZIP:", err);
    if (buttonElement) {
      buttonElement.textContent = originalText;
      buttonElement.disabled = false;
    }
    showToast("Failed to download snippet ZIP.");
  }
}

/**
 * Format bytes into human-readable string (KB, MB).
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Open the "Import Snippets from ZIP" modal.
 */
function openZipModal() {
  lastFocusedElement = document.activeElement;
  resetZipModalState();

  uploadZipModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    zipDropzone.focus();
  }, 50);
}

/**
 * Close the "Import Snippets from ZIP" modal.
 */
function closeZipModal() {
  uploadZipModal.classList.add("hidden");
  document.body.style.overflow = "";
  resetZipModalState();

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

/**
 * Reset all state, form fields, and preview items in the ZIP modal.
 */
function resetZipModalState() {
  parsedZipSnippets = [];
  if (zipFileInput) zipFileInput.value = "";
  if (zipCategoryOption) zipCategoryOption.value = "auto";
  if (zipFileInfo) zipFileInfo.classList.add("hidden");
  if (zipFileName) zipFileName.textContent = "";
  if (zipFileSize) zipFileSize.textContent = "";
  if (zipPreviewSection) zipPreviewSection.classList.add("hidden");
  if (zipPreviewList) zipPreviewList.innerHTML = "";
  if (zipPreviewSummary) zipPreviewSummary.textContent = "Found 0 snippets";
  if (zipSelectAllCheckbox) zipSelectAllCheckbox.checked = true;
  if (confirmZipImportBtn) {
    confirmZipImportBtn.disabled = true;
    confirmZipImportBtn.querySelector(".btn-text").textContent = "Import Snippets";
  }
  hideZipError();
}

function displayZipError(msg) {
  if (!zipError) return;
  zipError.textContent = msg;
  zipError.classList.remove("hidden");
}

function hideZipError() {
  if (!zipError) return;
  zipError.textContent = "";
  zipError.classList.add("hidden");
}

function setImportingState(isImporting) {
  if (!confirmZipImportBtn) return;
  confirmZipImportBtn.disabled = isImporting;
  const btnText = confirmZipImportBtn.querySelector(".btn-text");
  if (btnText) {
    btnText.textContent = isImporting ? "Importing..." : "Import Snippets";
  }
}

/**
 * Validate category string against allowed application categories.
 */
function normalizeCategory(cat) {
  const valid = ["General", "Programming", "Thesis", "Assignment", "Commands", "Notes", "Links", "Other"];
  if (!cat || typeof cat !== "string") return "General";
  const match = valid.find((c) => c.toLowerCase() === cat.trim().toLowerCase());
  return match || "General";
}

/**
 * Handle a user-selected ZIP file, perform security checks, and parse snippets.
 */
async function handleSelectedZipFile(file) {
  hideZipError();
  if (!file) return;

  // 1. File name extension check
  if (!file.name || !file.name.toLowerCase().endsWith(".zip")) {
    displayZipError("Please select a valid .zip file archive.");
    return;
  }

  // 2. File size safety check (Reject files > 25MB to prevent zip bombs/memory overflow)
  const MAX_SIZE_BYTES = 25 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    displayZipError("File exceeds the 25MB size limit. Please choose a smaller ZIP archive.");
    return;
  }

  // 3. Display file details
  zipFileName.textContent = file.name;
  zipFileSize.textContent = `(${formatBytes(file.size)})`;
  zipFileInfo.classList.remove("hidden");

  // 4. Verify JSZip availability
  if (typeof JSZip === "undefined") {
    displayZipError("JSZip library is not loaded. Please refresh and check your internet connection.");
    return;
  }

  try {
    const zip = await JSZip.loadAsync(file);

    // 5. Path traversal protection: Ensure no relative "../" or "..\\" paths exist
    for (const relativePath of Object.keys(zip.files)) {
      if (relativePath.includes("../") || relativePath.includes("..\\")) {
        displayZipError("Security alert: The archive contains unsafe relative path references (path traversal attempt).");
        return;
      }
    }

    parsedZipSnippets = [];
    const MAX_IMPORT_LIMIT = 250;

    // 6. Check for structured JSON backup (quickcopy-backup.json, snippets.json, or snippet.json)
    const backupKey = Object.keys(zip.files).find((k) => {
      const lower = k.toLowerCase().replace(/\\/g, "/");
      const name = lower.split("/").pop();
      return name === "quickcopy-backup.json" || name === "snippets.json" || name === "snippet.json";
    });

    if (backupKey && !zip.files[backupKey].dir) {
      try {
        const jsonContent = await zip.files[backupKey].async("string");
        const parsed = JSON.parse(jsonContent);
        const snippetRecords = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of snippetRecords) {
          if (parsedZipSnippets.length >= MAX_IMPORT_LIMIT) break;
          if (!item || typeof item !== "object") continue;
          const rawTitle = typeof item.title === "string" ? item.title.trim() : "";
          const title = rawTitle.slice(0, 100) || "Imported Snippet";
          const rawContent = typeof item.content === "string" ? item.content : "";
          if (!rawContent.trim()) continue;
          const content = rawContent.slice(0, 10000);
          const origCategory = normalizeCategory(item.category);

          parsedZipSnippets.push({
            title,
            category: origCategory,
            originalCategory: origCategory,
            content,
            checked: true
          });
        }
      } catch (jsonErr) {
        console.warn("[QuickCopy] Backup JSON parse error, falling back to individual file extraction:", jsonErr);
      }
    }

    // 7. If no JSON backup was found or parsed, iterate through all individual files
    if (parsedZipSnippets.length === 0) {
      const binaryExtensions = new Set([
        "png", "jpg", "jpeg", "gif", "bmp", "ico", "webp", "tiff", "psd",
        "exe", "dll", "so", "dylib", "bin", "iso", "img", "dmg",
        "zip", "tar", "gz", "7z", "rar", "bz2", "xz",
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
        "mp3", "wav", "flac", "aac", "ogg", "mp4", "mkv", "avi", "mov", "wmv",
        "ttf", "otf", "woff", "woff2", "eot",
        "class", "jar", "pyc", "pyo", "o", "obj"
      ]);

      const validCategories = ["General", "Programming", "Thesis", "Assignment", "Commands", "Notes", "Links", "Other"];

      for (const [entryPath, entry] of Object.entries(zip.files)) {
        if (parsedZipSnippets.length >= MAX_IMPORT_LIMIT) break;
        if (entry.dir) continue;

        const normalized = entryPath.replace(/\\/g, "/");
        const segments = normalized.split("/");
        const fileName = segments[segments.length - 1];

        // Skip hidden and system files (__MACOSX, .DS_Store, .git, or files starting with .)
        if (segments.some((seg) => seg === "__MACOSX" || seg === ".DS_Store" || seg === ".git" || seg.startsWith("."))) {
          continue;
        }
        if (!fileName || fileName.startsWith(".")) continue;

        // Skip readme and metadata files during raw file extraction
        const lowerName = fileName.toLowerCase();
        if (
          lowerName === "readme.txt" ||
          lowerName === "readme.md" ||
          lowerName === "snippet.json" ||
          lowerName === "snippets.json" ||
          lowerName === "quickcopy-backup.json"
        ) {
          continue;
        }

        // Skip binary extensions
        const dotIndex = fileName.lastIndexOf(".");
        const extension = dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
        if (binaryExtensions.has(extension)) continue;

        // Read text content
        let textContent = "";
        try {
          textContent = await entry.async("string");
        } catch {
          continue;
        }

        if (!textContent || !textContent.trim()) continue;

        // Skip binary files that contain null bytes
        if (textContent.includes("\0")) continue;

        // Title from filename (strip extension, trim, max 100 chars)
        const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
        const title = baseName.trim().slice(0, 100) || "Imported Snippet";

        // Enforce content length limit (10,000 chars)
        const content = textContent.slice(0, 10000);

        // Infer category from folder structure or extension
        let inferredCategory = "General";

        // Check if any parent folder matches a category name
        for (let i = 0; i < segments.length - 1; i++) {
          const match = validCategories.find((c) => c.toLowerCase() === segments[i].toLowerCase());
          if (match) {
            inferredCategory = match;
            break;
          }
        }

        if (inferredCategory === "General") {
          // Infer from file extension
          if (["js", "ts", "jsx", "tsx", "py", "html", "htm", "css", "c", "cpp", "cs", "java", "go", "rs", "php", "rb"].includes(extension)) {
            inferredCategory = "Programming";
          } else if (["sh", "bash", "bat", "cmd", "ps1", "sql"].includes(extension)) {
            inferredCategory = "Commands";
          } else if (["md", "txt"].includes(extension)) {
            inferredCategory = "Notes";
          }
        }

        parsedZipSnippets.push({
          title,
          category: inferredCategory,
          originalCategory: inferredCategory,
          content,
          checked: true
        });
      }
    }

    if (parsedZipSnippets.length === 0) {
      displayZipError("No valid text or code snippets found in this ZIP archive.");
      return;
    }

    // Apply category option if user previously set a forced category
    const forcedCategory = zipCategoryOption ? zipCategoryOption.value : "auto";
    if (forcedCategory !== "auto") {
      parsedZipSnippets.forEach((s) => (s.category = forcedCategory));
    }

    // Render preview
    renderZipPreview();
  } catch (err) {
    console.error("[QuickCopy] Error reading ZIP file:", err);
    displayZipError("Failed to extract ZIP archive. Please ensure it is a valid, uncorrupted ZIP file.");
  }
}

/**
 * Handle category dropdown changes in the ZIP import modal.
 */
function applyZipCategoryOptionChange() {
  if (!zipCategoryOption || parsedZipSnippets.length === 0) return;
  const selCat = zipCategoryOption.value;

  parsedZipSnippets.forEach((snippet) => {
    snippet.category = selCat === "auto" ? snippet.originalCategory : selCat;
  });

  renderZipPreview();
}

/**
 * Toggle checked state of all snippets in the ZIP preview.
 */
function toggleSelectAllZipSnippets(checked) {
  parsedZipSnippets.forEach((s) => (s.checked = checked));
  if (zipPreviewList) {
    const checkboxes = zipPreviewList.querySelectorAll(".zip-preview-item-checkbox");
    checkboxes.forEach((cb) => (cb.checked = checked));
  }
  updateConfirmButtonCount();
}

/**
 * Update the "Select All" checkbox state based on individual snippet checkboxes.
 */
function updateZipSelectAllState() {
  if (!zipSelectAllCheckbox || parsedZipSnippets.length === 0) return;
  const allChecked = parsedZipSnippets.every((s) => s.checked);
  const anyChecked = parsedZipSnippets.some((s) => s.checked);
  zipSelectAllCheckbox.checked = allChecked;
  zipSelectAllCheckbox.indeterminate = anyChecked && !allChecked;
}

/**
 * Update the confirm import button text and disabled state.
 */
function updateConfirmButtonCount() {
  if (!confirmZipImportBtn) return;
  const checkedCount = parsedZipSnippets.filter((s) => s.checked).length;
  confirmZipImportBtn.disabled = checkedCount === 0;
  const btnText = confirmZipImportBtn.querySelector(".btn-text");
  if (btnText) {
    btnText.textContent = checkedCount > 0
      ? `Import (${checkedCount}) Snippet${checkedCount === 1 ? "" : "s"}`
      : "Import Snippets";
  }
}

/**
 * Render the extracted snippets preview safely in the ZIP modal.
 * STRICT XSS: Uses document.createElement and textContent exclusively.
 */
function renderZipPreview() {
  if (!zipPreviewList || !zipPreviewSection) return;

  zipPreviewList.innerHTML = "";
  const totalCount = parsedZipSnippets.length;

  zipPreviewSummary.textContent = `Found ${totalCount} snippet${totalCount === 1 ? "" : "s"}`;
  updateZipSelectAllState();

  parsedZipSnippets.forEach((snippet) => {
    const item = document.createElement("div");
    item.className = "zip-preview-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "zip-preview-item-checkbox";
    checkbox.checked = !!snippet.checked;
    checkbox.setAttribute("aria-label", `Select snippet "${snippet.title}"`);
    checkbox.addEventListener("change", () => {
      snippet.checked = checkbox.checked;
      updateZipSelectAllState();
      updateConfirmButtonCount();
      hideZipError();
    });
    item.appendChild(checkbox);

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "zip-preview-item-content";

    const headerRow = document.createElement("div");
    headerRow.className = "zip-preview-item-header";

    const titleEl = document.createElement("span");
    titleEl.className = "zip-preview-title";
    titleEl.textContent = snippet.title || "Untitled Snippet";
    titleEl.title = snippet.title || "";
    headerRow.appendChild(titleEl);

    const catBadge = document.createElement("span");
    const cat = snippet.category || "General";
    const catSlug = cat.toLowerCase().replace(/[^a-z0-9]/g, "");
    catBadge.className = `category-badge badge-${catSlug}`;
    catBadge.textContent = cat;
    headerRow.appendChild(catBadge);

    const charBadge = document.createElement("span");
    charBadge.className = "zip-preview-chars";
    charBadge.textContent = `${(snippet.content || "").length} chars`;
    headerRow.appendChild(charBadge);

    contentWrapper.appendChild(headerRow);

    const preSnippet = document.createElement("pre");
    preSnippet.className = "zip-preview-snippet";
    const raw = snippet.content || "";
    preSnippet.textContent = raw.length > 200 ? raw.slice(0, 200) + "..." : raw;
    contentWrapper.appendChild(preSnippet);

    item.appendChild(contentWrapper);
    zipPreviewList.appendChild(item);
  });

  zipPreviewSection.classList.remove("hidden");
  updateConfirmButtonCount();
}

/**
 * Import the selected snippets into the active database (Supabase or Demo localStorage).
 */
async function importSelectedZipSnippets() {
  hideZipError();
  const selectedSnippets = parsedZipSnippets.filter((s) => s.checked);

  if (selectedSnippets.length === 0) {
    displayZipError("Please select at least one snippet to import.");
    return;
  }

  setImportingState(true);

  // Demo Mode (localStorage: quickcopy_demo_snippets)
  if (isDemoMode) {
    setTimeout(() => {
      try {
        const now = Date.now();
        const createdItems = selectedSnippets.map((s, idx) => ({
          id: `demo-${now}-${idx}`,
          title: s.title,
          category: s.category,
          content: s.content,
          created_at: new Date(now - idx * 1000).toISOString()
        }));

        allSnippets.unshift(...createdItems);
        localStorage.setItem("quickcopy_demo_snippets", JSON.stringify(allSnippets));

        setImportingState(false);
        closeZipModal();
        filterSnippets();
        showToast(`Successfully imported ${createdItems.length} snippet${createdItems.length === 1 ? "" : "s"} from ZIP!`);
      } catch (err) {
        console.error("[QuickCopy Demo] Import error:", err);
        setImportingState(false);
        displayZipError("Could not save imported snippets locally. Please try again.");
      }
    }, 200);
    return;
  }

  // Live Supabase Insertion
  try {
    const payload = selectedSnippets.map((s) => ({
      title: s.title,
      category: s.category,
      content: s.content
    }));

    const { data, error } = await supabaseClient
      .from("snippets")
      .insert(payload)
      .select();

    if (error) {
      console.error("[QuickCopy Supabase Import Error]", error);
      setImportingState(false);
      displayZipError("Could not save snippets to the database.\nPlease try again.");
      return;
    }

    if (data && data.length > 0) {
      allSnippets.unshift(...data);
    } else {
      const now = Date.now();
      const fallbackItems = selectedSnippets.map((s, idx) => ({
        id: `imported-${now}-${idx}`,
        title: s.title,
        category: s.category,
        content: s.content,
        created_at: new Date().toISOString()
      }));
      allSnippets.unshift(...fallbackItems);
    }

    setImportingState(false);
    closeZipModal();
    filterSnippets();
    showToast(`Successfully imported ${selectedSnippets.length} snippet${selectedSnippets.length === 1 ? "" : "s"} from ZIP!`);
  } catch (err) {
    console.error("[QuickCopy Network Import Error]", err);
    setImportingState(false);
    displayZipError("Could not save snippets to the database.\nPlease try again.");
  }
}
