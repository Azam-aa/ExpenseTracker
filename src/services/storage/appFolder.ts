import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { computeSha256 } from '../../utils/ids';
import { FullBackupPayload, SnapshotMetadata } from '../../models/types';

export const APP_FOLDER = 'DayToDayExpenses';

export class AppFolderService {
  private activeDirectory: Directory = Directory.Documents;
  private directoryPath: string = APP_FOLDER;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    if (!Capacitor.isNativePlatform()) {
      this.isInitialized = true;
      return;
    }

    // Try Directory.Documents first, fallback to External or Data
    const candidates = [Directory.Documents, Directory.External, Directory.Data];

    for (const dir of candidates) {
      try {
        await Filesystem.mkdir({
          directory: dir,
          path: this.directoryPath,
          recursive: true
        });

        // Test writing a README.txt
        const readmeContent =
          'Day to Day Expenses - Local Backup & Media Folder\n' +
          'All your financial data and transaction receipts are stored safely here.\n' +
          'You can copy this folder to your PC or another device for safekeeping.\n' +
          'Do NOT modify or delete latest.json manually.\n';

        await Filesystem.writeFile({
          directory: dir,
          path: `${this.directoryPath}/README.txt`,
          data: readmeContent,
          encoding: Encoding.UTF8
        });

        // Ensure subdirectories
        for (const sub of ['data', 'images', 'images/_trash', 'backups', 'exports', 'logs']) {
          await Filesystem.mkdir({
            directory: dir,
            path: `${this.directoryPath}/${sub}`,
            recursive: true
          });
        }

        this.activeDirectory = dir;
        this.isInitialized = true;
        console.log(`[AppFolder] Successfully initialized at Directory.${dir}/${this.directoryPath}`);
        return;
      } catch (err) {
        console.warn(`[AppFolder] Could not use Directory.${dir}, trying fallback:`, err);
      }
    }

    this.isInitialized = true;
  }

  public getActiveLocation(): string {
    if (!Capacitor.isNativePlatform()) {
      return 'Browser / Emulated Storage';
    }
    return `Documents/${this.directoryPath}`;
  }

  // Atomic snapshot write (write .tmp -> verify checksum -> rotate .bak -> rename)
  public async writeAtomicLatest(payload: FullBackupPayload): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      await this.init();
      const jsonString = JSON.stringify(payload);
      const checksum = await computeSha256(jsonString);

      const snapshotWrapper = {
        metadata: {
          schemaVersion: payload.version,
          revision: payload.revision,
          savedAt: payload.savedAt,
          counts: {
            transactions: payload.transactions.length,
            images: payload.images.length,
            notes: payload.notes.length,
            categories: payload.categories.length
          },
          checksum
        } as SnapshotMetadata,
        payload
      };

      const finalData = JSON.stringify(snapshotWrapper, null, 2);
      const tmpPath = `${this.directoryPath}/data/latest.json.tmp`;
      const finalPath = `${this.directoryPath}/data/latest.json`;
      const bakPath = `${this.directoryPath}/data/latest.json.bak`;

      // 1. Write tmp
      await Filesystem.writeFile({
        directory: this.activeDirectory,
        path: tmpPath,
        data: finalData,
        encoding: Encoding.UTF8
      });

      // 2. Read back & verify
      const readBack = await Filesystem.readFile({
        directory: this.activeDirectory,
        path: tmpPath,
        encoding: Encoding.UTF8
      });

      const parsed = JSON.parse(readBack.data as string);
      const readPayloadStr = JSON.stringify(parsed.payload);
      const readChecksum = await computeSha256(readPayloadStr);
      if (readChecksum !== checksum) {
        throw new Error('Checksum mismatch on verification read');
      }

      // 3. Move old latest.json to latest.json.bak (if exists)
      try {
        await Filesystem.copy({
          directory: this.activeDirectory,
          from: finalPath,
          toDirectory: this.activeDirectory,
          to: bakPath
        });
      } catch {
        // May not exist on first write
      }

      // 4. Move tmp to latest.json
      await Filesystem.rename({
        directory: this.activeDirectory,
        from: tmpPath,
        toDirectory: this.activeDirectory,
        to: finalPath
      });

      return true;
    } catch (e) {
      console.error('[AppFolder] Atomic write failed:', e);
      this.logError('writeAtomicLatest failed', e);
      return false;
    }
  }

  // Create rotating snapshot
  public async createSnapshot(
    payload: FullBackupPayload,
    reason?: string
  ): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      await this.init();
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const suffix = reason ? `-${reason}` : '';
      const filename = `snapshot-${timestamp}${suffix}.json`;
      const path = `${this.directoryPath}/backups/${filename}`;

      const jsonString = JSON.stringify(payload);
      const checksum = await computeSha256(jsonString);

      const snapshotWrapper = {
        metadata: {
          schemaVersion: payload.version,
          revision: payload.revision,
          savedAt: payload.savedAt,
          counts: {
            transactions: payload.transactions.length,
            images: payload.images.length,
            notes: payload.notes.length,
            categories: payload.categories.length
          },
          checksum
        },
        payload
      };

      await Filesystem.writeFile({
        directory: this.activeDirectory,
        path,
        data: JSON.stringify(snapshotWrapper, null, 2),
        encoding: Encoding.UTF8
      });

      // Cleanup old rotating snapshots (keep newest 30 + first of each month, never delete pre-*)
      if (!reason) {
        await this.pruneSnapshots();
      }

      return filename;
    } catch (e) {
      console.error('[AppFolder] Snapshot creation failed:', e);
      return null;
    }
  }

  // Prune rotating snapshots
  private async pruneSnapshots(): Promise<void> {
    try {
      const dirList = await Filesystem.readdir({
        directory: this.activeDirectory,
        path: `${this.directoryPath}/backups`
      });

      const snapshotFiles = dirList.files
        .filter((f) => f.name.startsWith('snapshot-') && f.name.endsWith('.json') && !f.name.includes('-pre-'))
        .sort((a, b) => b.name.localeCompare(a.name)); // newest first

      if (snapshotFiles.length > 30) {
        const toDelete = snapshotFiles.slice(30);
        for (const file of toDelete) {
          // Keep first snapshot of each month (e.g. Day 01)
          if (!file.name.includes('-01-')) {
            await Filesystem.deleteFile({
              directory: this.activeDirectory,
              path: `${this.directoryPath}/backups/${file.name}`
            });
          }
        }
      }
    } catch {
      // Ignored
    }
  }

  // List all snapshots
  public async listSnapshots(): Promise<{ name: string; size: number; mtime: number }[]> {
    if (!Capacitor.isNativePlatform()) return [];
    try {
      await this.init();
      const dirList = await Filesystem.readdir({
        directory: this.activeDirectory,
        path: `${this.directoryPath}/backups`
      });

      return dirList.files
        .filter((f) => f.name.endsWith('.json'))
        .map((f) => ({
          name: f.name,
          size: f.size || 0,
          mtime: f.mtime || 0
        }))
        .sort((a, b) => b.name.localeCompare(a.name));
    } catch {
      return [];
    }
  }

  // Read a snapshot file
  public async readSnapshot(filename: string): Promise<FullBackupPayload | null> {
    try {
      const content = await Filesystem.readFile({
        directory: this.activeDirectory,
        path: `${this.directoryPath}/backups/${filename}`,
        encoding: Encoding.UTF8
      });
      const parsed = JSON.parse(content.data as string);
      return parsed.payload || parsed;
    } catch (e) {
      console.error('[AppFolder] Could not read snapshot:', filename, e);
      return null;
    }
  }

  // Save image file to visible images/ directory
  public async saveImageFile(fileName: string, base64Data: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      await this.init();
      await Filesystem.writeFile({
        directory: this.activeDirectory,
        path: `${this.directoryPath}/images/${fileName}`,
        data: base64Data
      });
      return true;
    } catch (e) {
      console.error('[AppFolder] Error saving image file:', fileName, e);
      return false;
    }
  }

  // Move image to _trash
  public async trashImageFile(fileName: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Filesystem.rename({
        directory: this.activeDirectory,
        from: `${this.directoryPath}/images/${fileName}`,
        toDirectory: this.activeDirectory,
        to: `${this.directoryPath}/images/_trash/${fileName}`
      });
    } catch {
      // Ignore if file doesn't exist
    }
  }

  // Restore image from _trash
  public async restoreImageFile(fileName: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Filesystem.rename({
        directory: this.activeDirectory,
        from: `${this.directoryPath}/images/_trash/${fileName}`,
        toDirectory: this.activeDirectory,
        to: `${this.directoryPath}/images/${fileName}`
      });
    } catch {
      // Ignore
    }
  }

  // Append error log
  public async logError(context: string, error: unknown): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const errStr = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
      const entry = `[${new Date().toISOString()}] ${context}: ${errStr}\n\n`;
      await Filesystem.appendFile({
        directory: this.activeDirectory,
        path: `${this.directoryPath}/logs/errors.log`,
        data: entry,
        encoding: Encoding.UTF8
      });
    } catch {
      // Ignore logging failures
    }
  }

  // Check if saved data exists in folder (for fresh install detection)
  public async checkForSavedData(): Promise<FullBackupPayload | null> {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      await this.init();
      const content = await Filesystem.readFile({
        directory: this.activeDirectory,
        path: `${this.directoryPath}/data/latest.json`,
        encoding: Encoding.UTF8
      });
      const parsed = JSON.parse(content.data as string);
      return parsed.payload || parsed;
    } catch {
      // Try latest.json.bak
      try {
        const bakContent = await Filesystem.readFile({
          directory: this.activeDirectory,
          path: `${this.directoryPath}/data/latest.json.bak`,
          encoding: Encoding.UTF8
        });
        const parsed = JSON.parse(bakContent.data as string);
        return parsed.payload || parsed;
      } catch {
        return null;
      }
    }
  }

  // Delete all data in folder (if requested by user in Clear All Data)
  public async clearFolder(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Filesystem.rmdir({
        directory: this.activeDirectory,
        path: this.directoryPath,
        recursive: true
      });
    } catch {
      // Ignored
    }
  }
}

export const appFolder = new AppFolderService();
