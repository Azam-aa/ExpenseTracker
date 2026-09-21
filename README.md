# ExpenseTracker (Day to Day Expenses Local Clone)

A 100% offline, privacy-first, pixel-faithful Android expense tracker app built with React, TypeScript, Vite, and Capacitor.

The app reproduces the exact dark-mode visual design of the original "Day to Day Expenses" app, adding three critical enhancements:
1. **Image attachments on every transaction** (camera capture or gallery pick, EXIF orientation correction, WebP compression, and 320px fast cached thumbnails).
2. **Crash-proof 3-tier local data safety system** (`localStorage` sharding + `IndexedDB` image blobs + visible device mirror in `Documents/DayToDayExpenses` with atomic rename, SHA-256 verification, and rotating snapshots).
3. **Safe area and edge-to-edge handling** for modern Samsung, Pixel, and cutout Android displays with dynamic soft keyboard avoidance.

---

## Deliverables

- **Signed Release APK**: [`DayToDayExpenses-v1.0.0.apk`](file:///E:/Delete%20this/ExpenseTracker/DayToDayExpenses-v1.0.0.apk) (approx 6.5 MB)
- **Mirror Release APK**: [`dist/DayToDayExpenses-v1.0.0.apk`](file:///E:/Delete%20this/ExpenseTracker/dist/DayToDayExpenses-v1.0.0.apk)
- **Release Keystore**: `keystore/release.keystore` (verified with v1 and v2 signature schemes)
- **Test Report**: [`TEST_REPORT.md`](file:///E:/Delete%20this/ExpenseTracker/TEST_REPORT.md)
- **Decisions Log**: [`DECISIONS.md`](file:///E:/Delete%20this/ExpenseTracker/DECISIONS.md)

---

## Key Features

### 1. 100% Offline & Zero Network Permission
- The release APK contains **no `android.permission.INTERNET`** permission.
- No analytics, tracking, or remote CDNs.
- All fonts (Roboto) and assets are bundled locally in the APK.

### 2. 3-Tier Crash-Proof Data Durability
- **Tier 1 (Fast Memory & Shards)**: `localStorage` sharded by month (`dte.v1.tx.YYYY-MM`), metadata (`dte.v1.meta`), notes, and active draft.
- **Tier 2 (Binary Storage)**: `IndexedDB` (`dte_images_v1`) stores full compressed receipts and 320px thumbnails.
- **Tier 3 (User-Visible Phone Storage)**: Synced to `Documents/DayToDayExpenses/`:
  - `data/latest.json` (atomic write via `.tmp` -> SHA-256 hash verify -> `.bak` rotation -> `latest.json`).
  - `snapshots/` (automated rotating snapshots: 30 newest + 1st of month; pre-clear snapshots are never auto-deleted).
  - `images/` (full receipt images with `_trash/` safety subfolder).
  - `exports/` (generated Excel `.xlsx`, CSV, and ZIP backups).
  - `logs/errors.log` (local crash and error diagnostics).

### 3. Deletion Safety & 6-Second Undo
- Deletions are soft-deleted for 30 days and visible in **Settings > Data Management > Recently Deleted**.
- Whenever a transaction is deleted, a bottom toast appears with a 6-second timer offering an immediate **"UNDO"** action to restore the record instantly.

### 4. Self-Healing Diagnostics ("Check Data and Images")
- Accessible under **Settings > Data Management > Check data and images**.
- Scans `localStorage`, `IndexedDB`, and `Documents/DayToDayExpenses`.
- If a receipt exists in one tier but is missing in another, the diagnostic automatically repairs and restores the missing copy.

### 5. Monetary Math & Indian Numbering
- Uses exact integer paise minor units (e.g. `₹2,716.00` = `271600` paise) across all calculations.
- Formats amounts using standard Indian grouping (`1,00,000.00`).
- Strict formula: `Balance = Carry Forward + Income - Expense`.

### 6. App Lock (PBKDF2)
- 4-digit PIN protection using the Web Crypto API (`crypto.subtle`) with PBKDF2 (100,000 iterations, SHA-256, 16-byte random salt).

---

## Project Structure

```
ExpenseTracker/
├── android/                   # Native Android Capacitor project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/.../MainActivity.java  # Native insets bridge
│   │   │   ├── res/xml/network_security_config.xml
│   │   │   └── res/mipmap-.../             # Mint Rupee launcher icons
│   │   └── build.gradle       # Signing configs for release
│   └── local.properties       # Points to Android SDK
├── keystore/                  # Release keystore & credentials
│   ├── release.keystore
│   └── keystore.properties
├── reference/                 # User reference screenshots
├── src/
│   ├── components/            # TopBar, TabStrip, DateCard, AddEditSheet, DetailsSheet, etc.
│   ├── screens/               # Daily, Monthly, Yearly, Notes, Charts, Settings, Categories, etc.
│   ├── services/
│   │   ├── android/           # Safe area insets & hardware back button handling
│   │   ├── backup/            # Full ZIP backup & restore
│   │   ├── calc/              # Pure calculation engine (C/F, running balances)
│   │   ├── export/            # Excel (.xlsx) & PDF report generation
│   │   ├── images/            # EXIF rotation, WebP compression, thumbnailing
│   │   ├── lock/              # PBKDF2 PIN lock
│   │   └── storage/           # LocalStorage shards, IndexedDB, and Documents mirror
│   ├── store/                 # Zustand central application state & auto-flush
│   └── theme/                 # Sampled color tokens & global typography
├── tests/
│   ├── unit/                  # Vitest calculation, math & 10k stress tests
│   ├── e2e/                   # Playwright mobile tests (411x838 @ 2.625 DPR)
│   └── screenshots/           # Captured visual verification screenshots
├── DayToDayExpenses-v1.0.0.apk # Signed release APK
├── TEST_REPORT.md             # Full verification test report
├── DECISIONS.md               # Architectural decisions log
└── package.json
```

---

## Build & Test Instructions

### 1. Run Unit & Durability Tests
```bash
npm run test
```

### 2. Run Playwright Visual Parity Tests (411x838 DPR 2.625)
```bash
npx playwright test
```

### 3. Build Web Bundle
```bash
npm run build
```

### 4. Build Signed Release APK
```bash
npx cap sync android
cd android
./gradlew assembleRelease
```
The resulting signed APK is output to:
`android/app/build/outputs/apk/release/app-release.apk`
and copied to the project root as `DayToDayExpenses-v1.0.0.apk`.
