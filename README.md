# 📋 QuickCopy

> **Share • Copy • Done**  
> A lightning-fast, modern, and secure text & code snippet sharing web application powered by Vanilla HTML, CSS, JavaScript, and Supabase.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Features](#2-features)
3. [ZIP File Import & Export System](#3-zip-file-import--export-system)
4. [QuickLink Direct Sharing & QR Code System](#4-quicklink-direct-sharing--qr-code-system)
5. [Supabase Project Setup](#5-supabase-project-setup)
6. [Database Schema & SQL Table Creation](#6-database-schema--sql-table-creation)
7. [Row Level Security (RLS) Policies](#7-row-level-security-rls-policies)
8. [Configuring Credentials in QuickCopy](#8-configuring-credentials-in-quickcopy)
9. [Running Locally](#9-running-locally)
10. [Deployment Options](#10-deployment-options)
11. [Security Architecture & Design Principles](#11-security-architecture--design-principles)
12. [Troubleshooting & FAQ](#12-troubleshooting--faq)

---

## 1. Introduction

**QuickCopy** is an ultra-clean, lightweight pasteboard and snippet manager designed for developers, students, and teams. It eliminates the friction of sharing command lines, code blocks, academic notes, citation templates, and thesis outlines across machines.

QuickCopy is built with:
- **Pure Vanilla HTML5, CSS3, and JavaScript (ES6+)**: Zero framework lock-in, zero build steps, zero bloated dependencies.
- **Supabase JS v2**: Scalable PostgreSQL backend with instant realtime REST endpoints.
- **Graceful Offline / Demo Mode**: Test and evaluate all features immediately without requiring an active database or account.
- **JSZip Integration**: Fast, client-side ZIP archive packaging and parsing.

---

## 2. Features

- **⚡ One-Click Copying**: Instant copy to clipboard with tactile visual feedback (`✓ COPIED`).
- **📋 Copy All**: Combines and copies all currently visible and filtered snippets in a single click formatted as `Title\n\nContent`.
- **🔍 Real-Time Search & Category Filters**: Search instantly across titles, content, and categories (`Programming`, `Thesis`, `Assignment`, `Commands`, `Notes`, `Links`, `Other`, `General`, and `ZIP Archive`).
- **📦 Full & Filtered ZIP Export**: Export all snippets or currently filtered results into a clean, categorized ZIP archive with metadata and README documentation.
- **📂 Full ZIP Storage & Extraction**: Upload ZIP archives with two flexible modes: save the intact archive as a unified card under category `ZIP Archive` (with file list preview and 1-click download/extract), or split into individual snippet cards.
- **🏷️ Clean Single Snippet ZIPs**: Instantly download any single snippet packaged as a clean standalone `.zip` archive containing only the source file (zero extraneous readme/json files).
- **📱 Mobile-First Responsive Design**: Flawless layout on mobile phones, tablets, and ultra-wide desktop monitors.
- **🛡️ Rock-Solid XSS Protection**: Strict DOM node manipulation (`document.createElement` & `textContent`); zero dynamic `innerHTML` injection of user data.
- **🔄 Expandable Previews**: Snippets with more than 6 lines or 300 characters are neatly folded with a smooth `"Show more ▼"` / `"Show less ▲"` toggle.
- **⚡ QuickLink Direct Sharing & QR Code**: Generate shareable URLs (`?copy=` or `?dl=`) with client-side hash payloads (`#q=...`) and scannable QR codes for fast phone and cross-device transfers.
- **💾 Offline / Local Demo Fallback**: Automatically activates when placeholder credentials are used, persisting your test snippets in browser `localStorage`.

---

## 3. ZIP File Import & Export System

QuickCopy includes a comprehensive client-side ZIP packaging and restore system powered by [JSZip](https://stuk.github.io/jszip/):

### 3.1 ZIP Export
- **Toolbar "Export ZIP" Button**:
  - Located in the search and filter toolbar.
  - Automatically respects active filters: if search terms or category filters are applied, only matching snippets are packaged. If no filter is active, all snippets are exported.
  - Button transitions to `"⏳ Generating..."` during processing and `"✓ Downloaded"` upon completion.
- **Archive Folder Organization**:
  - Structured cleanly as `snippets/<Category>/<SanitizedTitle>.<ext>`.
  - Intelligently determines appropriate file extensions:
    - **Programming**: Detects `.py`, `.html`, `.css`, `.sql`, `.json`, `.ts`, defaulting to `.js`.
    - **Commands**: Detects `.sql`, `.ps1`, `.bat`, defaulting to `.sh`.
    - **Notes / Thesis / Assignment**: Detects Markdown (`.md`) or defaults to `.txt`.
    - **Links / General / Other**: Plain text `.txt`.
- **Structured Metadata Backup**:
  - Automatically includes `quickcopy-backup.json` at the root of the archive with the full array of snippet objects (`id`, `title`, `category`, `content`, `created_at`).
- **Built-in Documentation**:
  - Generates `README.txt` inside the archive explaining the contents, metadata format, and instructions for restoring into any QuickCopy instance.
- **Compression**:
  - Applied with DEFLATE level 6 compression for minimal bandwidth and compact storage.
- **Clean Single Snippet Download ("📦 ZIP")**:
  - Each standard snippet card includes a dedicated `📦 ZIP` button.
  - Generates a clean archive containing solely the source code file without extraneous readme or metadata files.

### 3.2 ZIP Import & Full ZIP Workflow
- **Accessible Modal Dialog**:
  - Openable via the "Import ZIP" toolbar button or keyboard shortcuts.
  - Complete with focus trapping, `Escape` key dismiss, and ARIA attributes (`role="dialog"`, `aria-modal="true"`).
- **Two Import Modes (Radio Selection)**:
  - **Save as Full ZIP File (Default)**:
    - Preserves the uploaded archive intact as a single snippet card categorized as `"ZIP Archive"`.
    - Features an overview summary box (`📦 ZIP Archive • X files • Y KB`).
    - Scrollable file list preview detailing filenames and sizes inside the archive.
    - **"📥 Download ZIP"**: 1-click download of the complete original archive.
    - **"📂 Extract & Split"**: Decompresses and expands all text/code files into individual snippet cards on demand.
    - **"📋 Copy Info"**: Copies formatted archive contents and file manifest to the clipboard.
  - **Extract & Split into Individual Snippets**:
    - Decompresses the archive immediately and extracts valid text and code files into separate snippet cards.
    - Provides interactive preview list with individual checkboxes and a `"Select All"` toggle.
- **Interactive File Dropzone**:
  - Supports drag-and-drop or clicking to open the native file browser (`accept=".zip"`).
  - Highlights drop area on drag-over and displays file name with formatted file size.
- **Category Assignment**:
  - Allows selecting **"Auto-detect from files"**, **"ZIP Archive"**, or explicit category overrides.
- **Safety Checks & Protections**:
  - **File Size Limit**: Rejects files larger than 1GB to prevent memory exhaustion and zip bomb attacks.
  - **Path Traversal Protection**: Explicitly validates all file paths to ensure no relative `../` or `..\` traversal escapes.
  - **Binary File Exclusion**: Automatically ignores images, executables, compiled binaries, and compressed archives.
  - **System File Filtering**: Automatically ignores macOS resource forks (`__MACOSX`), `.DS_Store`, `.git`, and dotfiles.
  - **Content & Title Sanitation**: Enforces title limit (100 characters) and content length (10,000 characters).
  - **Strict XSS Immunity**: Preview cards and notices are built strictly using `document.createElement` and `textContent`.
- **Database Insertion & Offline Persistence**:
  - Full ZIP binary payloads are cached in client-side IndexedDB (`quickcopy_zip_db`), with compact descriptors saved in Supabase or `localStorage: quickcopy_demo_snippets`.

---

---

## 4. QuickLink Direct Sharing & QR Code System

QuickCopy features a seamless, zero-friction cross-device snippet transfer system called **QuickLink**:

### 4.1 How QuickLink Works
- **Share Button on Every Card ("🔗 Link")**: Clicking the link button opens the **Share QuickLink** modal.
- **Header Toolbar Button ("⚡ QuickLink")**: Located in the main toolbar (#quickLinkToolbarBtn), allowing anyone to open, paste, or test any QuickLink URL.
- **Two Action Modes**:
  - **⚡ Auto-Copy Link**: Opening the link automatically copies snippet content to the recipient's clipboard and displays a visual confirmation.
  - **📥 Auto-Download Link**: Opening the link triggers an instant ZIP archive download of the snippet or archive.
- **Zero-Server Client Hash Payloads (`#q=...`)**: Snippet text, titles, and categories are base64url-encoded directly into the URL hash, allowing instant sharing without needing a shared database or active internet backend.

### 4.2 Scannable QR Codes for Phone & Tablet Transfers
- The QuickLink modal automatically generates a scannable **QR code** for mobile devices.
- Simply open QuickCopy on your computer, click **"⚡ QuickLink"** (or **"🔗 Link"** on any card), and scan the QR code with your phone or tablet camera to instantly transfer and copy code across devices.

### 4.3 Cross-Device ZIP Handling & Integrity
- **Text & Code Archives**: Automatically synchronized across devices with full, non-empty file contents reconstructed on download.
- **Large Binary Archives**: Binary archives exceeding database limits are safely cached in the uploading device's local IndexedDB. If opened on another device where the binary is not stored, QuickCopy clearly informs the user rather than producing corrupt 0-byte files.

---

## 5. Supabase Project Setup

Follow these steps to create your free Supabase cloud database:

1. **Sign Up / Log In**:
   Visit [supabase.com](https://supabase.com) and sign in with GitHub or your email.

2. **Create New Project**:
   - Click **"New project"** on your dashboard.
   - Choose an organization.
   - Enter a project name (e.g. `quickcopy-prod`).
   - Choose a secure database password (save this in a password manager).
   - Select the region closest to you or your users.
   - Click **"Create new project"** and wait 1–2 minutes for PostgreSQL to provision.

3. **Retrieve Project API Credentials**:
   - Navigate to **Project Settings** (gear icon on sidebar) &rarr; **API**.
   - Under **Project URL**, copy your `URL` (looks like `https://xyzcompany.supabase.co`).
   - Under **Project API keys**, copy the `anon` / `public` key (starts with `eyJ...`).

---

## 6. Database Schema & SQL Table Creation

1. In your Supabase project dashboard, open the **SQL Editor** from the left navigation bar.
2. Click **"New query"**.
3. Paste the following SQL schema script:

```sql
-- ==============================================================================
-- QuickCopy Schema: Create 'snippets' Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for speedy ordering by newest first
CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON public.snippets (created_at DESC);

-- Index for searching categories quickly
CREATE INDEX IF NOT EXISTS idx_snippets_category ON public.snippets (category);
```

4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`).
5. Verify the table is created by checking the **Table Editor** &rarr; `snippets`.

---

## 7. Row Level Security (RLS) Policies

Row Level Security (RLS) ensures that public, anonymous visitors can read snippets and publish new snippets, but **cannot edit, tamper with, or delete existing snippets**.

Execute the following SQL in your Supabase **SQL Editor**:

```sql
-- 1. Enable Row Level Security (RLS) on the snippets table
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow anyone (anon and authenticated) to SELECT / view snippets
CREATE POLICY "Allow public read access to snippets"
ON public.snippets
FOR SELECT
TO anon, authenticated
USING (true);

-- 3. Policy: Allow anyone (anon and authenticated) to INSERT / create new snippets
CREATE POLICY "Allow public insert access to snippets"
ON public.snippets
FOR INSERT
TO anon, authenticated
WITH CHECK (
    -- Ensure title length is bounded between 1 and 100 characters
    char_length(trim(title)) > 0 AND char_length(title) <= 100
    AND
    -- Ensure content is non-empty and within 10,000 characters
    char_length(trim(content)) > 0 AND char_length(content) <= 10000
);

-- ==============================================================================
-- NOTE ON UPDATE AND DELETE POLICIES:
-- By enabling RLS and intentionally omitting UPDATE and DELETE policies for the
-- 'anon' role, all modifications and deletions by anonymous clients are BLOCKED
-- at the PostgreSQL kernel level. Only authenticated database administrators
-- or service role keys can mutate or drop records.
-- ==============================================================================
```

---

## 8. Configuring Credentials in QuickCopy

Open `quickcopy/script.js` in your favorite code editor. At the very top of the file, replace the placeholder constants with your actual Supabase URL and Anon Key:

```javascript
// ==========================================
// 1. SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

> **Note**: If you leave the credentials as `"YOUR_SUPABASE_URL"` and `"YOUR_SUPABASE_ANON_KEY"`, QuickCopy will automatically run in **Local Demo Mode**, loading sample seed data and storing changes in your browser's `localStorage`.

---

## 9. Running Locally

Because QuickCopy is written in vanilla web technologies, you have multiple ways to run it:

### Option A: Direct File Opening (Fastest)
Simply double-click `quickcopy/index.html` or `index.html` in your file explorer to open it in Chrome, Edge, Firefox, or Safari.

### Option B: Python Simple HTTP Server
If you have Python installed:
```powershell
# In PowerShell or Command Prompt from C:\example
python -m http.server 8000
```
Open your browser at `http://localhost:8000/quickcopy/`.

### Option C: VS Code Live Server
1. Open the `C:\example` folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `quickcopy/index.html` and choose **"Open with Live Server"**.

### Option D: Node.js `npx serve`
```powershell
npx serve C:\example\quickcopy -p 3000
```
Open `http://localhost:3000`.

---

## 10. Deployment Options

QuickCopy is a 100% static frontend application. You can deploy it for free on any modern web host:

### Deploying to GitHub Pages
1. Push your repository to GitHub.
2. In your repository, go to **Settings** &rarr; **Pages**.
3. Under **Branch**, select `main` and root `/` (or `/quickcopy` if you set it as your source).
4. Click **Save**. Your site will be live at `https://<username>.github.io/<repo-name>/`.

### Deploying to Netlify
1. Log in to [netlify.com](https://www.netlify.com).
2. Drag and drop the `C:\example\quickcopy` folder onto the Netlify Dashboard.
3. Your site is deployed immediately with global CDN and SSL.

### Deploying to Vercel
1. Install Vercel CLI: `npm i -g vercel` or link your GitHub repo at [vercel.com](https://vercel.com).
2. Run `vercel` in `C:\example\quickcopy` and follow the prompts.

---

## 11. Security Architecture & Design Principles

QuickCopy is built with security-first web standards:

1. **Strict XSS (Cross-Site Scripting) Prevention**:
   - User input from `title`, `content`, and `category` is **never** assigned to `element.innerHTML`.
   - All DOM updates utilize `document.createElement()`, `element.textContent`, and direct attribute setters (`setAttribute`).
   - Snippet content is enclosed within styled `<pre>` and `<code>` blocks using CSS `white-space: pre-wrap; word-break: break-word;` ensuring raw markup or `<script>` tags are treated strictly as plain text.

2. **Defense in Depth with Supabase RLS**:
   - Even if an attacker attempts to call `.delete()` or `.update()` from the browser console, the Supabase PostgreSQL engine will reject the request due to the absence of `UPDATE` and `DELETE` RLS policies.
   - Input lengths are enforced both client-side (via HTML attributes & JS validation) and server-side (via SQL `WITH CHECK` constraints).

3. **No Database Error Leakage**:
   - Internal database errors, schema details, or connection strings are logged only to the developer console and never rendered directly into the user interface. Users receive clear, user-friendly notices (e.g. *"Unable to load snippets. Please refresh the page and try again."*).

4. **Clipboard Permissions & Graceful Degradation**:
   - Modern `navigator.clipboard.writeText` is used when available.
   - An invisible, non-intrusive `document.execCommand('copy')` fallback ensures compatibility in non-HTTPS local environments or older browser engines.

5. **ZIP Archive Security**:
   - 1GB archive size cap guards against zip bombs and denial-of-service memory exhaustion.
   - Strict path traversal defense rejects any entries with `../` or `..\`.
   - File filtering automatically rejects executable/binary payloads.

---

## 12. Troubleshooting & FAQ

### Q: Why does the top banner say "Demo Mode"?
A: This occurs when `SUPABASE_URL` or `SUPABASE_ANON_KEY` in `script.js` still contain the placeholder strings. To switch to your cloud database, follow [Section 7](#7-configuring-credentials-in-quickcopy).

### Q: Can I add more categories?
A: Yes! Simply add `<option value="YourCategory">YourCategory</option>` to both the `#categoryFilter` dropdown and `#snippetCategory` select in `index.html`. QuickCopy's CSS will automatically style it.

### Q: Where are newly created snippets saved in Demo Mode?
A: In your browser's `localStorage` under the key `quickcopy_demo_snippets`. You can clear them at any time via Developer Tools (`F12` &rarr; Application &rarr; Local Storage &rarr; Clear).

---

&copy; 2026 QuickCopy. Open source, lightweight, and built for speed.
