import { useAlertStore } from '../store/useAlertStore';

const ERROR_MESSAGES = {
  OFFLINE: {
    title: 'Signal Lost',
    message: "Lost in space? We can't find your signal. Check your connection and we'll be back in orbit.",
  },
  SERVER_DOWN: {
    title: 'Mission Control Pause',
    message: "Mission Control is taking a quick break. We're working on getting things back on track. Try again in a bit?",
  },
  GENERIC: {
    title: 'Cosmic Jitter',
    message: "Something went slightly off-course. Let's try that again, shall we?",
  },
};

interface ExtendedRequestInit extends RequestInit {
  silent?: boolean;
}

export const apiHelper = {
  fetch: async (url: string, options?: ExtendedRequestInit) => {
    const { showAlert } = useAlertStore.getState();
    const isSilent = options?.silent ?? false;

    try {
      const response = await fetch(url, options);
      return response;
    } catch (error: any) {
      if (!isSilent) {
        if (error.message === 'Network request failed') {
          showAlert(ERROR_MESSAGES.OFFLINE.title, ERROR_MESSAGES.OFFLINE.message);
        }
        // We no longer show GENERIC alerts here to avoid 'fake' connectivity messages.
        // Components catching the error can decide whether to show an alert or not.
      }
      throw error;
    }
  }
};
