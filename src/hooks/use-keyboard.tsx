import { useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';

export function useKeyboard() {
  useEffect(() => {
    let showListener: any;
    let hideListener: any;

    const setupListeners = async () => {
      // Configure keyboard behavior
      await Keyboard.setAccessoryBarVisible({ isVisible: true });
      
      // Listener para quando o teclado aparecer
      showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
        console.log('Keyboard will show with height:', info.keyboardHeight);
        document.body.classList.add('keyboard-open');
      });

      // Listener para quando o teclado esconder
      hideListener = await Keyboard.addListener('keyboardWillHide', () => {
        console.log('Keyboard will hide');
        document.body.classList.remove('keyboard-open');
      });
    };

    setupListeners();

    return () => {
      if (showListener) showListener.remove();
      if (hideListener) hideListener.remove();
    };
  }, []);
}
