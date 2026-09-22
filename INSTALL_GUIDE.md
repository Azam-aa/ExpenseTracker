# Day to Day Expenses - Easy Android Installation Guide

This guide will walk you through installing the **Day to Day Expenses** app onto your Android phone in just a few minutes. No technical background or special developer tools are needed.

---

## 1. Where to Find Your App File on Your Computer

The ready-to-install app package (called an **APK**) is located right here on your computer:

```
E:\Delete this\ExpenseTracker\android\app\build\outputs\apk\release\app-release.apk
```

- **File Name:** `app-release.apk`
- **File Size:** Approximately **6.27 MB**
- **Type:** Signed Production Release APK

---

## 2. How to Transfer the App to Your Phone

Choose whichever method is easiest for you:

### Method A: Google Drive (Simplest & Wireless)
1. On your computer, open [Google Drive](https://drive.google.com) in your browser.
2. Drag and drop `app-release.apk` into your Drive.
3. On your Android phone, open the **Google Drive** app.
4. Locate `app-release.apk` and tap on it to download and start installing.

### Method B: USB Cable
1. Connect your phone to your computer using your USB charging cable.
2. If your phone asks how to connect, select **File Transfer** (or **MTP**).
3. On your computer, open File Explorer, navigate to your phone's storage (e.g., the **Downloads** folder).
4. Copy `app-release.apk` from `E:\Delete this\ExpenseTracker\android\app\build\outputs\apk\release\` into your phone's **Downloads** folder.
5. Unplug the cable.

### Method C: Send to Yourself on WhatsApp / Telegram
1. Open WhatsApp Web or Telegram on your computer.
2. Send `app-release.apk` as a document to your own chat or saved messages.
3. Open the message on your phone and tap the file.

---

## 3. Step-by-Step Installation on Your Phone

Once the file is on your phone, follow these simple steps:

### Step 1: Open the APK file
- Open your phone's **Files** or **My Files** app.
- Go to the **Downloads** folder.
- Tap on `app-release.apk`.

### Step 2: Allow Installation ("Install unknown apps")
Because this app is installed directly rather than downloaded from the Google Play Store, Android will display a security prompt:
- Android will say: *"For your security, your phone is not allowed to install unknown apps from this source."*
- Tap **Settings** on that prompt.
- Toggle the switch next to **Allow from this source** to **ON** (blue/green).
- Tap the **Back** button to return to the installer.

### Step 3: Handle Google Play Protect Warning
Google Play Protect scans apps not downloaded from the Play Store and may display a warning:
- Android may show a dialog saying: *"Blocked by Play Protect"* or *"Unrecognized app"*.
- Tap **More details** (small text below the warning).
- Tap **Install anyway**.

### Step 4: Confirm and Install
- A prompt will ask: *"Do you want to install this application?"* (or *"Do you want to install an update to this application?"*).
- Tap **Install** (or **Update**).
- Wait 5 to 10 seconds for the installation bar to finish.
- Tap **Open** when finished!

---

## 4. What Happens to Your Existing Data?

**Your existing transactions, categories, notes, and photos are 100% safe.**

This build is signed with the exact same release keystore certificate (`daytodayexpenses`) and uses the exact same app package ID (`com.personal.daytodayexpenses`). When Android installs it, it performs an in-place upgrade. None of your local records or images are deleted or reset.

---

## 5. Quick 3-Step Test to Confirm Everything Works

Once the app opens on your phone, run this quick 1-minute test:

1. **Add a Test Expense:**
   - Tap the **+** (Add) button at the bottom of the screen.
   - Enter an amount (e.g. `50`), select **Expense**, and type a title like `Coffee Test`.
2. **Attach a Photo:**
   - Tap the **Paperclip / Attach** button.
   - Pick a photo from your phone's gallery or take a quick camera picture.
   - Notice the photo is added cleanly to the sheet.
3. **Save and Verify:**
   - Tap **Add** (or Save).
   - In the **Daily** list, confirm your `Coffee Test` appears with the paperclip icon `[📎]`.
   - Tap on the transaction to view details, and tap the attachment to open the full-screen photo viewer.

Enjoy using **Day to Day Expenses**!
