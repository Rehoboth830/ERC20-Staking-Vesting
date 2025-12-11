import { toast, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Default toast options for consistent UI
const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

/**
 * Show a success notification
 * @param message
 * @param options - optional override for default options
 */
export const notifySuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, { ...defaultOptions, ...options });
};

/**
 * Show an error notification
 * @param message
 * @param options - optional override for default options
 */
export const notifyError = (message: string, options?: ToastOptions) => {
  toast.error(message, { ...defaultOptions, ...options });
};

/**
 * Show an info notification
 * @param message
 * @param options - optional override for default options
 */
export const notifyInfo = (message: string, options?: ToastOptions) => {
  toast.info(message, { ...defaultOptions, ...options });
};

/**
 * Show a warning notification
 * @param message
 * @param options - optional override for default options
 */
export const notifyWarning = (message: string, options?: ToastOptions) => {
  toast.warning(message, { ...defaultOptions, ...options });
};
