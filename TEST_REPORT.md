# Test Report: Day to Day Expenses (Local Clone)

Date: September 21, 2026  
Status: **PASSED**  
Version: 1.0.0 (Release APK Signed & Verified)

---

## 1. Test Summary Overview

| Test Suite | Total Tests | Passed | Failed | Status |
|---|---|---|---|---|
| **Vitest Unit & Math Engine** | 3 | 3 | 0 | **PASSED** |
| **Durability & 10k Stress Test** | 3 | 3 | 0 | **PASSED** |
| **Playwright Mobile E2E (411x838 @ 2.625 DPR)** | 5 | 5 | 0 | **PASSED** |
| **Release APK Build & Signature** | 1 | 1 | 0 | **PASSED** |
| **Offline & Permission Audit** | 1 | 1 | 0 | **PASSED** |
| **Physical Device / Emulator Execution** | 1 | 0 | 0 | **NOT RUN** (No active emulator/device connected) |

---

## 2. Unit & Calculation Engine Verification (`calc.test.ts`)

- **Indian Monetary Grouping**: Formatter correctly formats lakh and crore values with rupee symbols:
  - `₹2,716.00`
  - `₹1,200.00`
  - `₹1,00,000.00`
  - `₹1,00,00,000.00`
- **Integer Paise Arithmetic**: String amounts (`"2716"`, `"2,716.00"`, `"₹1,200.50"`) parse to integer paise (`271600`, `120050`) avoiding any floating-point arithmetic errors. Invalid or zero values return `null`.
- **Reference Screenshot Parity Check**:
  - September 2026 Carry Forward: `₹5,443.00` (`544300` paise)
  - September 2026 Total Income: `₹34,900.00` (`3490000` paise)
  - September 2026 Total Expense: `₹37,627.00` (`3762700` paise)
  - September 2026 Net Balance: `₹2,716.00` (`271600` paise)
  - September Uncategorized Expenses: Exactly **30 items** matching screenshot `04-charts.png` badge
  - Yearly running balances across months: April (`₹28,025.00`), May (`₹34,160.00`), September (`₹2,716.00`)
  - Daily balance on 21 September (no transactions) equals C/F `₹2,716.00`

---

## 3. Durability & 10,000 Transactions Stress Test (`durabilityAndStress.test.ts`)

- **10,000 Transactions Stress Run**:
  - Synthetic data set of 10,000 transactions distributed across 12 calendar months with 20% income and 80% expenses.
  - `yearTable(10000_transactions)` execution time: **17 ms** (well below 100 ms threshold).
  - `monthSummary` execution time: **< 5 ms**.
  - Memory consumption remained stable throughout iterative running balance calculations.
- **6-Second Soft Delete Buffer**:
  - Deleting a transaction flags `deletedAt: <timestamp>` without permanent removal.
  - Active transaction selectors immediately filter out soft-deleted items from ledger views.
  - User invoking "UNDO" within 6 seconds immediately removes the `deletedAt` flag, restoring the transaction with original ID, category, and image reference intact.
- **SHA-256 Payload Integrity**:
  - Payload serialization and SHA-256 hash generation verified.
  - Corrupted or modified byte payloads produce distinct checksums and trigger checksum mismatch safeguards.

---

## 4. Playwright Mobile Parity Suite (`parityAndFlows.spec.ts`)

- **Viewport Configuration**: Mobile emulation configured at **411 x 838** pixels with Device Pixel Ratio **2.625** (simulating Google Pixel / modern Samsung Galaxy devices).
- **Test 1 - Daily Screen Initial Render**:
  - TopBar rendered with title "Day to Day Expenses", cloud backup icon, search button, and three-dot options.
  - TabStrip renders 4 primary tabs: Notes (pencil icon with `aria-label="Notes"`), Daily, Monthly, Yearly.
  - DateCard renders "C/F", "Income (Credit)", "Expense (Debit)", "Balance" with date selector chevrons.
  - Mint floating action button (`+`) visible at bottom right.
  - Captured screenshot: `tests/screenshots/01-daily-empty.png`.
- **Test 2 - Navigation Across All Main Views**:
  - Navigated to Monthly tab: Summary card and month navigator visible.
  - Navigated to Yearly tab: 4-column layout with C/F row, Income (Credit), Expense (Debit), Balance.
  - Navigated to Notes tab: Notes list view and "+ Add Note" FAB visible.
  - Navigated to Charts screen via Three-Dot Menu: Segmented control (`Income (Credit)` vs `Expense (Debit)`), `All time`, month navigator, dynamic Y-axis, and category breakdown.
  - Captured screenshots: `02-monthly-tab.png`, `03-yearly-tab.png`, `04-notes-tab.png`, `05-charts-tab.png`.
- **Test 3 - Add Transaction Flow**:
  - FAB clicked -> bottom sheet slides up with rounded corners, collapse chevron, Expense/Income selector, Amount, Category picker, Description, and receipt camera button.
  - Filled `Amount = 1250` and `Description = Grocery supplies`.
  - Saved via mint check button.
  - Verified transaction row appears in Daily ledger with exact formatted amount `₹1,250.00`.
  - Captured screenshots: `06-add-sheet.png`, `07-daily-with-tx.png`.
- **Test 4 - Soft Delete & Undo Toast**:
  - Added transaction for `₹450.00`.
  - Opened transaction details -> tapped Edit -> tapped Delete -> confirmed in dialog.
  - Verified 6-second snackbar appears with "Transaction deleted" and mint "UNDO" action.
  - Tapped "UNDO" -> transaction immediately reappeared in the active ledger.
- **Test 5 - Settings, Data Management, Categories, and Diagnostic Screen**:
  - Opened Three-Dot Menu -> tapped Settings.
  - Verified Settings options (App Language, Currency, App Lock, Calculations, Backup and export, Data Management, Preferences).
  - Navigated to Data Management -> Categories -> Category Manager with Expense / Income tabs.
  - Navigated to Check Data and Images -> Verified diagnostic interface with "Start Integrity Check".
  - Captured screenshots: `08-settings-screen.png`, `09-categories-screen.png`, `10-check-data-screen.png`.

---

## 5. Offline & Permission Verification

- **Manifest Audit**: Inspected `DayToDayExpenses-v1.0.0.apk` using `aapt dump permissions`:
  ```
  package: com.personal.daytodayexpenses
  uses-permission: name='android.permission.CAMERA'
  uses-permission: name='android.permission.READ_MEDIA_IMAGES'
  permission: com.personal.daytodayexpenses.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
  uses-permission: name='com.personal.daytodayexpenses.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
  ```
  - `android.permission.INTERNET` is **completely absent**.
  - `network_security_config.xml` blocks cleartext network traffic.
- **Mock Data Exclusion in Release**: Verified `useAppStore` initializes with 0 transactions on initial clean install; seed transactions exist purely inside `src/seed/devSeed.ts` for Vitest tests.

---

## 6. Release APK Artifact Verification

- **File Path**: `E:\Delete this\ExpenseTracker\DayToDayExpenses-v1.0.0.apk`
- **Output Mirror**: `E:\Delete this\ExpenseTracker\dist\DayToDayExpenses-v1.0.0.apk`
- **File Size**: **6,525,123 bytes** (~6.5 MB)
- **Signature Verification (`apksigner verify --verbose`)**:
  - `Verifies`: **true**
  - `v1 Scheme (JAR signing)`: **true**
  - `v2 Scheme (APK Signature Scheme v2)`: **true**
  - `Signers`: 1 (Certificate CN: `Day to Day Expenses`, Validity: 10,000 days)
- **Keystore**: `keystore/release.keystore` (RSA 2048, SHA256withRSA)

---

## 7. Device / Emulator Execution Status

- **ADB Devices Output**: `List of devices attached` is empty.
- **Status**: **NOT RUN** (No physical device or Android Virtual Device was online in this execution environment).
- **Emulation Alternative Executed**: Full Playwright mobile browser emulation with touch events, DPR 2.625, and Pixel screen dimensions executed and passed 100%.
