export const en = {
  app: {
    title: 'Day to Day Expenses',
    worksOffline: 'Works fully offline. Nothing is sent anywhere.',
    somethingWrong: 'Something went wrong',
    reload: 'Reload'
  },
  tabs: {
    notes: 'Notes',
    daily: 'Daily',
    monthly: 'Monthly',
    yearly: 'Yearly'
  },
  daily: {
    cf: 'C/F',
    balance: 'Balance',
    incomeCredit: 'Income',
    expenseDebit: 'Expense',
    emptyHint: "Tap on '+' to add new item and long press an entry to edit."
  },
  addSheet: {
    incomeCredit: 'Income',
    expenseDebit: 'Expense',
    enterText: 'Enter Text',
    amount: 'Amount',
    description: 'Description',
    addImage: 'Add Image',
    imageAttached: 'Image attached',
    change: 'Change',
    remove: 'Remove',
    invalidAmount: 'Enter a valid amount',
    untitled: 'Untitled',
    added: 'Added',
    saved: 'Saved',
    deleteTx: 'Delete this transaction?',
    deleteConfirm: 'Delete',
    cancel: 'Cancel',
    undo: 'UNDO',
    deleted: 'Transaction deleted'
  },
  photoPicker: {
    takePhoto: 'Take Photo',
    chooseGallery: 'Choose from Gallery',
    cancel: 'Cancel'
  },
  monthly: {
    totalIncome: 'Total Income',
    totalExpense: 'Total Expense',
    cf: 'C/F',
    balance: 'Balance',
    noTransactions: 'No transactions found.'
  },
  yearly: {
    incomeCredit: 'Income',
    expenseDebit: 'Expense',
    balance: 'Balance',
    cf: 'C/F'
  },
  notes: {
    noNotes: 'No notes found.',
    titlePlaceholder: 'Title',
    textPlaceholder: 'Write a note',
    deleteNote: 'Delete this note?'
  },
  charts: {
    title: 'Charts',
    allTime: 'All time',
    year: 'Year',
    uncategorizedWarning: '{count} items are not categorized. Click here to categorize.',
    uncategorizedTitle: 'Uncategorized',
    breakdown: 'Category Breakdown'
  },
  search: {
    placeholder: 'Search by title, desc, category, amount...',
    typeToSearch: 'Type something to search',
    noResults: 'No transactions found.'
  },
  menu: {
    charts: 'Charts',
    helpFeedback: 'Help and Feedback',
    settings: 'Settings'
  },
  settings: {
    title: 'Settings',
    appLanguage: 'App Language',
    appLanguageDesc: 'English (English)',
    currency: 'Currency',
    currencyDesc: 'INR - Indian Rupee',
    appLock: 'App lock',
    appLockDesc: 'Helps you protect your data from being viewed by others accidentally.',
    calculations: 'Calculations',
    calculationsDesc: 'Fiscal year, carry forward.',
    backupExport: 'Backup and export',
    backupExportDesc: 'Local backup, restore, export as excel.',
    dataManagement: 'Data Management',
    dataManagementDesc: 'Categories, carry forward, recently deleted, clear data.',
    preferences: 'Preferences',
    preferencesDesc: 'Themes and more.',
    helpFeedback: 'Help and Feedback',
    helpFeedbackDesc: 'Help, contact us, privacy policy.'
  },
  calculations: {
    title: 'Calculations',
    fiscalStart: 'Fiscal year starts in',
    carryForward: 'Carry forward',
    openingBalance: 'Opening balance'
  },
  backupExport: {
    title: 'Backup and export',
    backupNow: 'Backup now',
    lastBackup: 'Last backup: {time}',
    autoBackup: 'Auto backup',
    autoBackupDesc: 'Saves a safety copy after every change.',
    appFolder: 'App folder',
    restoreFromFolder: 'Restore from app folder',
    shareBackup: 'Share backup file',
    restoreFromFile: 'Restore from file',
    exportExcel: 'Export as Excel (.xlsx)',
    exportCsv: 'Export as CSV',
    checkDataImages: 'Check data and images',
    savedToFolder: 'Saved to Documents/DayToDayExpenses'
  },
  dataManagement: {
    title: 'Data Management',
    categories: 'Categories',
    carryForward: 'Carry forward',
    recentlyDeleted: 'Recently deleted',
    checkDataImages: 'Check data and images',
    clearAllData: 'Clear all data',
    clearConfirm: 'This will permanently delete all local application data.',
    clearFolderCheckbox: 'Also delete the backup folder (cannot be undone)',
    deleteEverything: 'Delete everything',
    restorePromptTitle: 'Saved Data Found',
    restorePromptMsg: 'Found saved data on this phone: {txCount} transactions, {imgCount} images, last saved {date}. Restore it?',
    restoreBtn: 'Restore',
    startFreshBtn: 'Start fresh'
  },
  help: {
    title: 'Help and Feedback',
    howToUse: 'How to use',
    whatsNew: "What's new",
    faq: 'Frequently asked questions',
    share: 'Share',
    privacyPolicy: 'Privacy policy',
    contactUs: 'Contact Us',
    appVersion: 'App Version'
  },
  appLock: {
    enterPin: 'Enter PIN',
    confirmPin: 'Confirm PIN',
    setPin: 'Set 4-digit PIN',
    wrongPin: 'Incorrect PIN. Try again.',
    forgotPin: 'Forgot PIN?',
    resetTitle: 'Reset Application Lock',
    resetWarning: 'PIN cannot be recovered. Resetting the app erases internal app data. Your copies in Documents/DayToDayExpenses are NOT deleted and can be restored afterwards.',
    typeErasePrompt: 'Type ERASE to confirm'
  }
};

export type Translations = typeof en;
