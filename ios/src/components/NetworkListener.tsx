import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAlertStore } from '../store/useAlertStore';

export const NetworkListener = () => {
  const { showAlert, hideAlert } = useAlertStore();
  const wasOffline = useRef(false);
  const offlineTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOffline = state.isConnected === false;

      if (isOffline) {
        if (!wasOffline.current && !offlineTimer.current) {
          // Add a 3-second debounce to ignore minor network jitters
          offlineTimer.current = setTimeout(() => {
            showAlert(
              'Signal Lost',
              "Lost in space? We can't find your signal. Check your connection and we'll be back in orbit."
            );
            wasOffline.current = true;
          }, 3000);
        }
      } else {
        // Clear any pending offline alert timer
        if (offlineTimer.current) {
          clearTimeout(offlineTimer.current);
          offlineTimer.current = null;
        }

        if (wasOffline.current) {
          // Automatically hide alert when back online
          hideAlert();
          wasOffline.current = false;
        }
      }
    });

    return () => {
      unsubscribe();
      if (offlineTimer.current) clearTimeout(offlineTimer.current);
    };
  }, [showAlert, hideAlert]);

  return null;
};
