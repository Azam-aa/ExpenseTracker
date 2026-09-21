import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

type BackHandler = () => boolean; // return true if handled, false to delegate to next

class BackStackManager {
  private handlers: BackHandler[] = [];
  private lastBackPressTime = 0;
  private exitToastCallback: (() => void) | null = null;

  constructor() {
    if (Capacitor.isNativePlatform()) {
      App.addListener('backButton', () => {
        this.handleBack();
      });
    }

    // Also support Escape key on desktop/browser
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleBack();
      }
    });
  }

  public setExitToastCallback(cb: () => void) {
    this.exitToastCallback = cb;
  }

  public pushHandler(handler: BackHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  public handleBack(): boolean {
    for (let i = this.handlers.length - 1; i >= 0; i--) {
      const handled = this.handlers[i]();
      if (handled) {
        return true;
      }
    }

    // At root
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      if (Capacitor.isNativePlatform()) {
        App.exitApp();
      }
      return true;
    }

    this.lastBackPressTime = now;
    if (this.exitToastCallback) {
      this.exitToastCallback();
    }
    return true;
  }
}

export const backStack = new BackStackManager();
