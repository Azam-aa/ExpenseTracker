import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { backStack } from '../services/android/backButton';
import { initSystemUIAndInsets } from '../services/android/insets';
import { requestStoragePersistence } from '../services/storage/localStorageShards';
import { appFolder } from '../services/storage/appFolder';
import { FullBackupPayload } from '../models/types';

// Screens
import { DailyScreen } from '../screens/Daily';
import { MonthlyScreen } from '../screens/Monthly';
import { YearlyScreen } from '../screens/Yearly';
import { NotesScreen } from '../screens/Notes';
import { ChartsScreen } from '../screens/Charts';
import { CategorizeScreen } from '../screens/Categorize';
import { SearchScreen } from '../screens/Search';
import { SettingsScreen } from '../screens/Settings';
import { CalculationsScreen } from '../screens/Calculations';
import { BackupExportScreen } from '../screens/BackupExport';
import { DataManagementScreen } from '../screens/DataManagement';
import { CategoriesScreen } from '../screens/Categories';
import { RecentlyDeletedScreen } from '../screens/RecentlyDeleted';
import { PreferencesScreen } from '../screens/Preferences';
import { HelpScreen } from '../screens/Help';
import { CheckDataScreen } from '../screens/CheckData';

// Overlays & Modals
import { AddEditSheet } from '../components/AddEditSheet';
import { DetailsSheet } from '../components/DetailsSheet';
import { CloudBackupSheet } from '../components/CloudBackupSheet';
import { ImageViewer } from '../components/ImageViewer';
import { DatePickerDialog } from '../components/DatePickerDialog';
import { PinLockScreen } from '../components/PinLockScreen';
import { Toast } from '../components/Toast';
import { StartupRecoveryDialog } from '../components/StartupRecoveryDialog';

export const App: React.FC = () => {
  const {
    activeTab,
    activeScreen,
    activeSheet,
    activeDialog,
    viewerImage,
    detailsTransaction,
    isAppLocked,
    initStore,
    closeSheet,
    closeViewer,
    openEditSheet,
    showToast
  } = useAppStore();

  const [discoveredSavedData, setDiscoveredSavedData] = useState<FullBackupPayload | null>(null);

  useEffect(() => {
    // 1. Initialize System UI & Insets
    initSystemUIAndInsets();
    requestStoragePersistence();

    // 2. Initialize Store
    initStore().then(async () => {
      // Check if local storage was empty but folder has saved data
      const currentTx = useAppStore.getState().transactions;
      if (currentTx.length === 0) {
        const saved = await appFolder.checkForSavedData();
        if (saved && saved.transactions && saved.transactions.length > 0) {
          setDiscoveredSavedData(saved);
        }
      }
    });

    // 3. Setup central back stack handler
    backStack.setExitToastCallback(() => {
      showToast('Press back again to exit');
    });

    const unregisterBack = backStack.pushHandler(() => {
      const state = useAppStore.getState();
      if (state.viewerImage) {
        state.closeViewer();
        return true;
      }
      if (state.activeDialog !== 'NONE') {
        useAppStore.setState({ activeDialog: 'NONE' });
        return true;
      }
      if (state.activeSheet !== 'NONE') {
        state.closeSheet();
        return true;
      }
      if (state.isMenuOpen) {
        state.closeMenu();
        return true;
      }
      if (state.activeScreen !== 'MAIN') {
        return state.goBack();
      }
      if (state.activeTab !== 'DAILY') {
        state.setActiveTab('DAILY');
        return true;
      }
      return false; // Delegate to root exit handler
    });

    return () => {
      unregisterBack();
    };
  }, [initStore, showToast]);

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'CHARTS':
        return <ChartsScreen />;
      case 'CATEGORIZE':
        return <CategorizeScreen />;
      case 'SEARCH':
        return <SearchScreen />;
      case 'SETTINGS':
        return <SettingsScreen />;
      case 'CALCULATIONS':
        return <CalculationsScreen />;
      case 'BACKUP_EXPORT':
        return <BackupExportScreen />;
      case 'DATA_MANAGEMENT':
        return <DataManagementScreen />;
      case 'CATEGORIES':
        return <CategoriesScreen />;
      case 'RECENTLY_DELETED':
        return <RecentlyDeletedScreen />;
      case 'PREFERENCES':
        return <PreferencesScreen />;
      case 'HELP':
        return <HelpScreen />;
      case 'CHECK_DATA':
        return <CheckDataScreen />;
      case 'MAIN':
      default:
        switch (activeTab) {
          case 'NOTES':
            return <NotesScreen />;
          case 'MONTHLY':
            return <MonthlyScreen />;
          case 'YEARLY':
            return <YearlyScreen />;
          case 'DAILY':
          default:
            return <DailyScreen />;
        }
    }
  };

  return (
    <div className="app-container">
      {/* Screen Router */}
      {renderActiveScreen()}

      {/* Overlays & Bottom Sheets */}
      {(activeSheet === 'ADD' || activeSheet === 'EDIT') && (
        <AddEditSheet onClose={closeSheet} />
      )}

      {activeSheet === 'DETAILS' && detailsTransaction && (
        <DetailsSheet
          transaction={detailsTransaction}
          onClose={closeSheet}
          onEdit={() => openEditSheet(detailsTransaction)}
        />
      )}

      {activeSheet === 'CLOUD_BACKUP' && (
        <CloudBackupSheet onClose={closeSheet} />
      )}

      {activeDialog === 'DATE_PICKER' && (
        <DatePickerDialog onClose={() => useAppStore.setState({ activeDialog: 'NONE' })} />
      )}

      {/* Fullscreen Image Viewer */}
      {viewerImage && (
        <ImageViewer
          imageUrl={viewerImage.url}
          transaction={viewerImage.transaction}
          imageRecord={viewerImage.imageRecord}
          onClose={closeViewer}
        />
      )}

      {/* Toast & Undo */}
      <Toast />

      {/* Fresh Install Discovery Dialog */}
      {discoveredSavedData && (
        <StartupRecoveryDialog
          savedData={discoveredSavedData}
          onResolve={() => setDiscoveredSavedData(null)}
        />
      )}

      {/* App Lock */}
      {isAppLocked && <PinLockScreen />}
    </div>
  );
};
