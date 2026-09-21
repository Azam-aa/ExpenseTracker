import { create } from 'zustand';
import {
  Transaction,
  Category,
  Note,
  Settings,
  TabType,
  ScreenId,
  ImageRecord,
  FullBackupPayload
} from '../models/types';
import {
  loadMetaShard,
  saveMetaShard,
  loadAllTransactions,
  saveMonthShard,
  loadNotes,
  saveNotes,
  defaultSettings,
  clearAllShards
} from '../services/storage/localStorageShards';
import { appFolder } from '../services/storage/appFolder';
import { DEFAULT_CATEGORIES } from '../models/defaultCategories';
import { getTodayDateString } from '../utils/dates';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { clearAllIdbImages } from '../services/storage/indexedDbImages';

interface AppState {
  // Data
  transactions: Transaction[];
  categories: Category[];
  notes: Note[];
  settings: Settings;
  imageRecords: Record<string, ImageRecord>;
  revision: number;

  // Navigation & Screen selection
  activeTab: TabType;
  activeScreen: ScreenId;
  screenStack: ScreenId[];
  selectedDate: string;   // 'YYYY-MM-DD'
  selectedMonth: { year: number; month: number };
  selectedYear: number;

  // UI overlays
  activeSheet: 'NONE' | 'ADD' | 'EDIT' | 'DETAILS' | 'CATEGORY_PICKER' | 'PHOTO_PICKER' | 'CLOUD_BACKUP';
  activeDialog: 'NONE' | 'DATE_PICKER' | 'CONFIRM_DELETE' | 'RESET_APP' | 'CONFIRM_RESTORE';
  editingTransaction: Transaction | null;
  detailsTransaction: Transaction | null;
  viewerImage: { url: string; transaction: Transaction; imageRecord?: ImageRecord } | null;
  isMenuOpen: boolean;
  toastMessage: string | null;
  undoTx: { transaction: Transaction; timeoutId: number } | null;
  isAppLocked: boolean;

  // Actions
  initStore: () => Promise<void>;
  addTransaction: (tx: Transaction, img?: ImageRecord) => void;
  updateTransaction: (tx: Transaction, img?: ImageRecord) => void;
  deleteTransaction: (id: string) => void;
  undoDeleteTransaction: () => void;
  permanentlyDeleteTransaction: (id: string) => void;
  restoreTransaction: (id: string) => void;

  addCategory: (cat: Category) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (id: string, reassignToId: string | null) => void;

  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;

  updateSettings: (partial: Partial<Settings>) => void;
  unlockApp: () => void;

  // Nav actions
  setActiveTab: (tab: TabType) => void;
  navigate: (screen: ScreenId) => void;
  goBack: () => boolean;
  setSelectedDate: (date: string) => void;
  setSelectedMonth: (year: number, month: number) => void;
  setSelectedYear: (year: number) => void;

  // Sheet & Overlay actions
  openAddSheet: () => void;
  openEditSheet: (tx: Transaction) => void;
  openDetailsSheet: (tx: Transaction) => void;
  closeSheet: () => void;
  openMenu: () => void;
  closeMenu: () => void;
  openViewer: (url: string, tx: Transaction, img?: ImageRecord) => void;
  closeViewer: () => void;
  showToast: (msg: string) => void;

  // Full data replacement / restore
  restoreFullPayload: (payload: FullBackupPayload) => Promise<void>;
  clearAllData: (deleteFolder: boolean) => Promise<void>;
  flushMirrorNow: () => Promise<void>;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let changeCounter = 0;

function scheduleMirrorFlush(getState: () => AppState) {
  changeCounter++;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    flushStateToFolder(getState);
  }, 1500);

  if (changeCounter >= 25) {
    changeCounter = 0;
    flushStateToFolder(getState, true);
  }
}

async function flushStateToFolder(getState: () => AppState, createRotatingSnapshot: boolean = false) {
  const state = getState();
  const payload: FullBackupPayload = {
    version: state.settings.schemaVersion,
    revision: state.revision,
    savedAt: Date.now(),
    settings: state.settings,
    categories: state.categories,
    notes: state.notes,
    transactions: state.transactions,
    images: Object.values(state.imageRecords)
  };

  await appFolder.writeAtomicLatest(payload);

  if (createRotatingSnapshot) {
    await appFolder.createSnapshot(payload);
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  notes: [],
  settings: defaultSettings,
  imageRecords: {},
  revision: 1,

  activeTab: 'DAILY',
  activeScreen: 'MAIN',
  screenStack: ['MAIN'],
  selectedDate: getTodayDateString(),
  selectedMonth: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  },
  selectedYear: new Date().getFullYear(),

  activeSheet: 'NONE',
  activeDialog: 'NONE',
  editingTransaction: null,
  detailsTransaction: null,
  viewerImage: null,
  isMenuOpen: false,
  toastMessage: null,
  undoTx: null,
  isAppLocked: false,

  initStore: async () => {
    // 1. Load shards from localStorage
    const meta = loadMetaShard();
    const { transactions } = loadAllTransactions();
    const notes = loadNotes();

    // Check App Lock
    const shouldLock = meta.settings.appLock?.enabled || false;

    set({
      settings: meta.settings,
      categories: meta.categories,
      revision: meta.revision,
      transactions,
      notes,
      isAppLocked: shouldLock
    });

    // 2. Initialize AppFolder in background
    await appFolder.init();

    // 3. Setup App pause/background listener for immediate mirror flush
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', (state) => {
        if (!state.isActive) {
          flushStateToFolder(get, true);
        }
      });
      App.addListener('pause', () => {
        flushStateToFolder(get);
      });
    }

    // Flush initial mirror if needed
    scheduleMirrorFlush(get);
  },

  addTransaction: (tx, img) => {
    set((state) => {
      const monthKey = tx.date.slice(0, 7);
      const updatedList = [tx, ...state.transactions];
      const monthTxList = updatedList.filter((t) => t.date.startsWith(monthKey));

      saveMonthShard(monthKey, monthTxList);
      const newRev = state.revision + 1;
      saveMetaShard({
        schemaVersion: state.settings.schemaVersion,
        revision: newRev,
        settings: state.settings,
        categories: state.categories,
        updatedAt: Date.now()
      });

      const updatedRecords = { ...state.imageRecords };
      if (img) {
        updatedRecords[img.id] = img;
      }

      return {
        transactions: updatedList,
        revision: newRev,
        imageRecords: updatedRecords,
        activeSheet: 'NONE',
        editingTransaction: null
      };
    });

    scheduleMirrorFlush(get);
  },

  updateTransaction: (tx, img) => {
    set((state) => {
      const updatedList = state.transactions.map((t) => (t.id === tx.id ? tx : t));
      const monthKey = tx.date.slice(0, 7);
      const monthTxList = updatedList.filter((t) => t.date.startsWith(monthKey));

      saveMonthShard(monthKey, monthTxList);
      const newRev = state.revision + 1;
      saveMetaShard({
        schemaVersion: state.settings.schemaVersion,
        revision: newRev,
        settings: state.settings,
        categories: state.categories,
        updatedAt: Date.now()
      });

      const updatedRecords = { ...state.imageRecords };
      if (img) {
        updatedRecords[img.id] = img;
      }

      return {
        transactions: updatedList,
        revision: newRev,
        imageRecords: updatedRecords,
        activeSheet: 'NONE',
        editingTransaction: null,
        detailsTransaction: tx
      };
    });

    scheduleMirrorFlush(get);
  },

  deleteTransaction: (id) => {
    const state = get();
    const tx = state.transactions.find((t) => t.id === id);
    if (!tx) return;

    // Clear any prior undo timer
    if (state.undoTx) {
      clearTimeout(state.undoTx.timeoutId);
    }

    // Soft delete
    const softDeletedTx: Transaction = {
      ...tx,
      deletedAt: Date.now()
    };

    const updatedList = state.transactions.map((t) => (t.id === id ? softDeletedTx : t));
    const monthKey = tx.date.slice(0, 7);
    saveMonthShard(monthKey, updatedList.filter((t) => t.date.startsWith(monthKey)));

    // 6 second undo toast
    const timeoutId = window.setTimeout(() => {
      set({ undoTx: null });
      // Move image file to trash if attached
      if (tx.imageId) {
        const rec = get().imageRecords[tx.imageId];
        if (rec) {
          appFolder.trashImageFile(rec.fileName);
        }
      }
    }, 6000);

    set({
      transactions: updatedList,
      activeSheet: 'NONE',
      editingTransaction: null,
      detailsTransaction: null,
      undoTx: { transaction: tx, timeoutId }
    });

    scheduleMirrorFlush(get);
  },

  undoDeleteTransaction: () => {
    const { undoTx } = get();
    if (!undoTx) return;
    clearTimeout(undoTx.timeoutId);

    const restoredTx: Transaction = {
      ...undoTx.transaction,
      deletedAt: null
    };

    set((state) => {
      const updatedList = state.transactions.map((t) => (t.id === restoredTx.id ? restoredTx : t));
      const monthKey = restoredTx.date.slice(0, 7);
      saveMonthShard(monthKey, updatedList.filter((t) => t.date.startsWith(monthKey)));
      return {
        transactions: updatedList,
        undoTx: null
      };
    });

    scheduleMirrorFlush(get);
  },

  permanentlyDeleteTransaction: (id) => {
    set((state) => {
      const tx = state.transactions.find((t) => t.id === id);
      const updatedList = state.transactions.filter((t) => t.id !== id);
      if (tx) {
        const monthKey = tx.date.slice(0, 7);
        saveMonthShard(monthKey, updatedList.filter((t) => t.date.startsWith(monthKey)));
      }
      return { transactions: updatedList };
    });
    scheduleMirrorFlush(get);
  },

  restoreTransaction: (id) => {
    set((state) => {
      const updatedList = state.transactions.map((t) =>
        t.id === id ? { ...t, deletedAt: null } : t
      );
      const tx = state.transactions.find((t) => t.id === id);
      if (tx) {
        const monthKey = tx.date.slice(0, 7);
        saveMonthShard(monthKey, updatedList.filter((t) => t.date.startsWith(monthKey)));
        if (tx.imageId) {
          const rec = state.imageRecords[tx.imageId];
          if (rec) {
            appFolder.restoreImageFile(rec.fileName);
          }
        }
      }
      return { transactions: updatedList };
    });
    scheduleMirrorFlush(get);
  },

  addCategory: (cat) => {
    set((state) => {
      const updated = [...state.categories, cat];
      saveMetaShard({
        schemaVersion: state.settings.schemaVersion,
        revision: state.revision + 1,
        settings: state.settings,
        categories: updated,
        updatedAt: Date.now()
      });
      return { categories: updated, revision: state.revision + 1 };
    });
    scheduleMirrorFlush(get);
  },

  updateCategory: (cat) => {
    set((state) => {
      const updated = state.categories.map((c) => (c.id === cat.id ? cat : c));
      saveMetaShard({
        schemaVersion: state.settings.schemaVersion,
        revision: state.revision + 1,
        settings: state.settings,
        categories: updated,
        updatedAt: Date.now()
      });
      return { categories: updated, revision: state.revision + 1 };
    });
    scheduleMirrorFlush(get);
  },

  deleteCategory: (id, reassignToId) => {
    set((state) => {
      const updatedCats = state.categories.filter((c) => c.id !== id);
      const updatedTx = state.transactions.map((t) =>
        t.categoryId === id ? { ...t, categoryId: reassignToId } : t
      );

      // Save affected shards
      const monthKeys = new Set(updatedTx.map((t) => t.date.slice(0, 7)));
      monthKeys.forEach((mk) => {
        saveMonthShard(mk, updatedTx.filter((t) => t.date.startsWith(mk)));
      });

      saveMetaShard({
        schemaVersion: state.settings.schemaVersion,
        revision: state.revision + 1,
        settings: state.settings,
        categories: updatedCats,
        updatedAt: Date.now()
      });

      return {
        categories: updatedCats,
        transactions: updatedTx,
        revision: state.revision + 1
      };
    });
    scheduleMirrorFlush(get);
  },

  addNote: (note) => {
    set((state) => {
      const updated = [note, ...state.notes];
      saveNotes(updated);
      return { notes: updated };
    });
    scheduleMirrorFlush(get);
  },

  updateNote: (note) => {
    set((state) => {
      const updated = state.notes.map((n) => (n.id === note.id ? note : n));
      saveNotes(updated);
      return { notes: updated };
    });
    scheduleMirrorFlush(get);
  },

  deleteNote: (id) => {
    set((state) => {
      const updated = state.notes.filter((n) => n.id !== id);
      saveNotes(updated);
      return { notes: updated };
    });
    scheduleMirrorFlush(get);
  },

  updateSettings: (partial) => {
    set((state) => {
      const updatedSettings = { ...state.settings, ...partial };
      saveMetaShard({
        schemaVersion: updatedSettings.schemaVersion,
        revision: state.revision + 1,
        settings: updatedSettings,
        categories: state.categories,
        updatedAt: Date.now()
      });
      return { settings: updatedSettings, revision: state.revision + 1 };
    });
    scheduleMirrorFlush(get);
  },

  unlockApp: () => set({ isAppLocked: false }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  navigate: (screen) =>
    set((state) => ({
      activeScreen: screen,
      screenStack: [...state.screenStack, screen],
      isMenuOpen: false
    })),

  goBack: () => {
    const { screenStack } = get();
    if (screenStack.length > 1) {
      const nextStack = screenStack.slice(0, -1);
      const prevScreen = nextStack[nextStack.length - 1];
      set({
        activeScreen: prevScreen,
        screenStack: nextStack,
        isMenuOpen: false
      });
      return true;
    }
    return false;
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedMonth: (year, month) => set({ selectedMonth: { year, month } }),
  setSelectedYear: (year) => set({ selectedYear: year }),

  openAddSheet: () => set({ activeSheet: 'ADD', editingTransaction: null }),
  openEditSheet: (tx) => set({ activeSheet: 'EDIT', editingTransaction: tx, detailsTransaction: null }),
  openDetailsSheet: (tx) => set({ activeSheet: 'DETAILS', detailsTransaction: tx }),
  closeSheet: () => set({ activeSheet: 'NONE', editingTransaction: null }),
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
  openViewer: (url, tx, img) => set({ viewerImage: { url, transaction: tx, imageRecord: img } }),
  closeViewer: () => set({ viewerImage: null }),
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => set({ toastMessage: null }), 2500);
  },

  restoreFullPayload: async (payload) => {
    // 1. Create pre-restore snapshot
    const currentPayload: FullBackupPayload = {
      version: get().settings.schemaVersion,
      revision: get().revision,
      savedAt: Date.now(),
      settings: get().settings,
      categories: get().categories,
      notes: get().notes,
      transactions: get().transactions,
      images: Object.values(get().imageRecords)
    };
    await appFolder.createSnapshot(currentPayload, 'pre-restore');

    // 2. Clear current shards
    clearAllShards();

    // 3. Save new shards
    saveMetaShard({
      schemaVersion: payload.version,
      revision: payload.revision + 1,
      settings: payload.settings,
      categories: payload.categories,
      updatedAt: Date.now()
    });

    saveNotes(payload.notes);

    const monthGroups: Record<string, Transaction[]> = {};
    payload.transactions.forEach((tx) => {
      const mk = tx.date.slice(0, 7);
      if (!monthGroups[mk]) monthGroups[mk] = [];
      monthGroups[mk].push(tx);
    });

    Object.entries(monthGroups).forEach(([mk, list]) => {
      saveMonthShard(mk, list);
    });

    const imgRecMap: Record<string, ImageRecord> = {};
    if (payload.images) {
      payload.images.forEach((r) => {
        imgRecMap[r.id] = r;
      });
    }

    set({
      transactions: payload.transactions,
      categories: payload.categories,
      notes: payload.notes,
      settings: payload.settings,
      imageRecords: imgRecMap,
      revision: payload.revision + 1,
      toastMessage: 'Backup restored successfully'
    });

    await flushStateToFolder(get, true);
  },

  clearAllData: async (deleteFolder: boolean) => {
    // 1. Pre-clear snapshot unless user checked delete folder
    if (!deleteFolder) {
      const currentPayload: FullBackupPayload = {
        version: get().settings.schemaVersion,
        revision: get().revision,
        savedAt: Date.now(),
        settings: get().settings,
        categories: get().categories,
        notes: get().notes,
        transactions: get().transactions,
        images: Object.values(get().imageRecords)
      };
      await appFolder.createSnapshot(currentPayload, 'pre-clear');
    }

    clearAllShards();
    await clearAllIdbImages();

    if (deleteFolder) {
      await appFolder.clearFolder();
    }

    set({
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      notes: [],
      settings: defaultSettings,
      imageRecords: {},
      revision: 1,
      activeSheet: 'NONE',
      activeScreen: 'MAIN',
      screenStack: ['MAIN'],
      toastMessage: 'All data cleared'
    });

    if (!deleteFolder) {
      await flushStateToFolder(get);
    }
  },

  flushMirrorNow: async () => {
    await flushStateToFolder(get);
  }
}));
