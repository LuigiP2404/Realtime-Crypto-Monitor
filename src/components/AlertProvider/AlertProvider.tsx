import React, {  useCallback, useState } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Slide, { type SlideProps } from "@mui/material/Slide";
import './AlertProvider.css';
import { AlertContext, type AlertType } from "../../hooks/useAlert";

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertType>({ message: "", severity: null });

  const showAlert = useCallback((message: string, severity: AlertType["severity"]) => {
    setAlert({ message, severity });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert({ message: "", severity: null });
  }, []);

  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
      <Snackbar
        className="appToast"
        open={Boolean(alert.severity)}
        autoHideDuration={6000}
        onClose={hideAlert}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        slots={{ transition: Slide }}
        slotProps={{ transition: { direction: "left" } as SlideProps}}
      >
        <Alert
          severity={alert.severity ?? "info"}
          variant="outlined"
          onClose={hideAlert}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </AlertContext.Provider>
  );
};
