# Decisions Log (DECISIONS.md)

### 1. Project Path
- **Decision**: The project is placed at `E:\Delete this\ExpenseTracker` according to the workspace setting and user's approval. Path handling across scripts and Android build tooling wraps all paths in quotes to safeguard against spaces.

### 2. Available Reference Screenshots vs Remaining Specs
- **Decision**: 5 screenshots (`03-daily-add-sheet`, `04-charts`, `06-monthly`, `07-yearly`, `08-notes-tab`) were uploaded and verified. For the remaining 5 screens (`01-daily-menu-open`, `02-settings`, `05-help-feedback`, `09-search-keyboard`, `10-daily-plain`), we follow the exact geometric coordinate specifications, font sizing, padding, and layout given in sections 10, 11, 14, 15, and 16 of the master specification. The Daily screen background in `03-daily-add-sheet` directly reveals `10-daily-plain` geometry as well.

### 3. Capacitor Version & Android Compatibility
- **Decision**: Used latest stable Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android` v7) with Android SDK 34 (`android-34`), build-tools 34.0.0, and JDK 21 LTS to support Android 14/15 edge-to-edge window insets and modern APIs.

### 4. Storage & Durability Architecture
- **Decision**:
  - `localStorage` is used for metadata (`dte.v1.meta`, `dte.v1.tx.YYYY-MM`, `dte.v1.notes`, `dte.v1.draft`).
  - `IndexedDB` (`idb`) stores image blobs and 320px thumbnails for fast display and offline durability.
  - Visible phone folder at `Documents/DayToDayExpenses` contains mirrors (`data/latest.json`, `.bak`, `backups/`, `images/`, `_trash/`, `exports/`, `logs/errors.log`).
  - Rotating snapshots keep the newest 30 + 1st of month. Pre-import, pre-restore, and pre-clear snapshots are never auto-deleted.
  - Deletions are soft-deleted for 30 days in Recently Deleted with an immediate 6-second undo toast.

### 5. Color Tokens & Theme Sampling
- **Decision**: Colors are sampled directly from pixel analysis of the screenshots:
  - App background: `#0f1513`
  - Income / Expense section bars: `#252b29`
  - Accent card / Date card / Selected segment / Month chip: `#354c44`
  - Bottom sheet background: `#3f4a46`
  - Three dot menu popup: `#1e2624`
  - Search bar top: `#323836`
  - Outlines / card borders: `#3f4946`
  - Segment border: `#6b7370`
  - Primary mint: `#7fd6bc` (active tab line `#86d6bd`)
  - Floating button: `#005142`
  - On-FAB: `#a2f2d9`
  - On-primary check: `#00382c`
  - Text: `#e0e3e1`
  - Text-dim: `#bfc9c4`
  - Income: `#7cdc7b`
  - Expense: `#fb7a75`
  - Warning: `#ffc107`

### 6. Calculation Engine & Monetary Math
- **Decision**: All money arithmetic operates on integer minor units (paise) to prevent any float precision errors. All formulas follow `Balance = Carry Forward + Income - Expense`.

### 7. Dual Safe Area Handling & Edge-to-Edge
- **Decision**: CSS variables `--safe-top`, `--safe-bottom`, `--safe-left`, `--safe-right`, and `--kb-height` are populated from both `env(safe-area-inset-*)` and the native Android `MainActivity` `ViewCompat.setOnApplyWindowInsetsListener` bridge. Soft keyboard height is measured and dynamically injected into the web root to shift input sheets without layout distortion.

### 8. Zero Network Permission & Offline Guarantee
- **Decision**: The release APK explicitly removes `android.permission.INTERNET` from `AndroidManifest.xml`. `network_security_config.xml` blocks cleartext and remote connections. The app functions 100% offline with no external analytics, remote CDNs, or phone-home calls.

### 9. Zero Mock/Seed Data in Release
- **Decision**: Seed transactions used to verify screenshot numbers are strictly guarded in `src/seed/devSeed.ts` and only invoked within unit tests (`calc.test.ts`). Fresh application installs initialize with an empty transaction ledger and clean default categories.

### 10. Release Signing Architecture
- **Decision**: Generated a dedicated release keystore at `keystore/release.keystore` (RSA 2048, SHA256withRSA, 10,000 days validity). Gradle configuration reads `keystore/keystore.properties` to automatically produce verified v1 and v2 signed APKs.
