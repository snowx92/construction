type ToastCallback = (message: string, type: 'success' | 'error' | 'info') => void;

let toastCallback: ToastCallback | null = null;

export const setToastCallback = (callback: ToastCallback) => {
  toastCallback = callback;
};

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  if (toastCallback) {
    toastCallback(message, type);
  }
};
