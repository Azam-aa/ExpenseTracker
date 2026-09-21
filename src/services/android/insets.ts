import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export interface InsetValues {
  top: number;
  bottom: number;
  left: number;
  right: number;
  imeHeight: number;
}

export function initSystemUIAndInsets(): void {
  if (Capacitor.isNativePlatform()) {
    try {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#0f1513' });
    } catch {
      // Ignored if platform doesn't support
    }

    try {
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.documentElement.style.setProperty('--kb-height', `${info.keyboardHeight}px`);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.documentElement.style.setProperty('--kb-height', '0px');
      });
    } catch {
      // Keyboard plugin not supported on web
    }
  }

  // Listen for native bridge event if MainActivity sends WindowInsets
  window.addEventListener('native-insets-change', (event: Event) => {
    const customEvt = event as CustomEvent<InsetValues>;
    if (customEvt.detail) {
      const { top, bottom, left, right, imeHeight } = customEvt.detail;
      document.documentElement.style.setProperty('--safe-top', `${top}px`);
      document.documentElement.style.setProperty('--safe-bottom', `${bottom}px`);
      document.documentElement.style.setProperty('--safe-left', `${left}px`);
      document.documentElement.style.setProperty('--safe-right', `${right}px`);
      if (imeHeight !== undefined) {
        document.documentElement.style.setProperty('--kb-height', `${imeHeight}px`);
      }
    }
  });
}
