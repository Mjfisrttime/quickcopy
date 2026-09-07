# 📋 QuickCopy

> **Share • Copy • Done**  
> A lightning-fast, modern, and secure text & code snippet sharing web application powered by Vanilla HTML, CSS, JavaScript, and Supabase.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Features](#2-features)
3. [Supabase Project Setup](#3-supabase-project-setup)
4. [Database Schema & SQL Table Creation](#4-database-schema--sql-table-creation)
5. [Row Level Security (RLS) Policies](#5-row-level-security-rls-policies)
6. [Configuring Credentials in QuickCopy](#6-configuring-credentials-in-quickcopy)
7. [Running Locally](#7-running-locally)
8. [Deployment Options](#8-deployment-options)
9. [Security Architecture & Design Principles](#9-security-architecture--design-principles)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)

---

## 1. Introduction

**QuickCopy** is an ultra-clean, lightweight pasteboard and snippet manager designed for developers, students, and teams. It eliminates the friction of sharing command lines, code blocks, academic notes, citation templates, and thesis outlines across machines.

QuickCopy is built with:
- **Pure Vanilla HTML5, CSS3, and JavaScript (ES6+)**: Zero framework lock-in, zero build steps, zero bloated dependencies.
- **Supabase JS v2**: Scalable PostgreSQL backend with instant realtime REST endpoints.
- **Graceful Offline / Demo Mode**: Test and evaluate all features immediately without requiring an active database or account.

---

## 2. Features

- **⚡ One-Click Copying**: Instant copy to clipboard with tactile visual feedback (`✓ COPIED`).
- **📋 Copy All**: Combines and copies all currently visible and filtered snippets in a single click formatted as `Title\n\nContent`.
- **🔍 Real-Time Search & Category Filters**: Search instantly across titles, content, and categories (`Programming`, `Thesis`, `Assignment`, `Commands`, `Notes`, `Links`, `Other`, `General`).
- **📱 Mobile-First Responsive Design**: Flawless layout on mobile phones, tablets, and ultra-wide desktop monitors.
- **🛡️ Rock-Solid XSS Protection**: Strict DOM node manipulation (`document.createElement` & `textContent`); zero dynamic `innerHTML` injection of user data.
- **🔄 Expandable Previews**: Snippets with more than 6 lines or 300 characters are neatly folded with a smooth `"Show more ▼"` / `"Show less ▲"` toggle.
- **💾 Offline / Local Demo Fallback**: Automatically activates when placeholder credentials are used, persisting your test snippets in browser `localStorage`.

---

## 3. Supabase Project Setup

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

## 4. Database Schema & SQL Table Creation

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

## 5. Row Level Security (RLS) Policies

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

## 6. Configuring Credentials in QuickCopy

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

## 7. Running Locally

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

## 8. Deployment Options

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

## 9. Security Architecture & Design Principles

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

---

## 10. Troubleshooting & FAQ

### Q: Why does the top banner say "Demo Mode"?
A: This occurs when `SUPABASE_URL` or `SUPABASE_ANON_KEY` in `script.js` still contain the placeholder strings. To switch to your cloud database, follow [Section 6](#6-configuring-credentials-in-quickcopy).

### Q: Can I add more categories?
A: Yes! Simply add `<option value="YourCategory">YourCategory</option>` to both the `#categoryFilter` dropdown and `#snippetCategory` select in `index.html`. QuickCopy's CSS will automatically style it.

### Q: Where are newly created snippets saved in Demo Mode?
A: In your browser's `localStorage` under the key `quickcopy_demo_snippets`. You can clear them at any time via Developer Tools (`F12` &rarr; Application &rarr; Local Storage &rarr; Clear).

---

&copy; 2026 QuickCopy. Open source, lightweight, and built for speed.
