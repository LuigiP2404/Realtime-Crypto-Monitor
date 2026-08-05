import { createContext, useContext } from "react";

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

export type AlertType = {
  message: string;
  severity: "error" | "warning" | "info" | "success" | null;
};

export type AlertContextType = {
  alert: AlertType;
  showAlert: (message: string, severity: AlertType["severity"]) => void;
  hideAlert: () => void;
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used inside AlertProvider");
  }
  return context;
};
