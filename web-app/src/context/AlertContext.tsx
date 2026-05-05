'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AlertOptions {
  title?: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

interface AlertContextType {
  showAlert: (message: string, options?: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{ message: string; options?: AlertOptions } | null>(null);

  const showAlert = (message: string, options?: AlertOptions) => {
    setAlert({ message, options });
  };

  const closeAlert = () => {
    if (alert?.options?.onClose) {
      alert.options.onClose();
    }
    setAlert(null);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div className="modal-overlay">
          <div className="modal-content animate-in">
            <div className="modal-header">
              <h3 className={`modal-title modal-title--${alert.options?.type || 'info'}`}>
                {alert.options?.title || (alert.options?.type === 'error' ? 'Error' : alert.options?.type === 'success' ? 'Success' : 'Notice')}
              </h3>
              <button className="modal-close" onClick={closeAlert}>✕</button>
            </div>
            <div className="modal-body">
              <p>{alert.message}</p>
            </div>
            <div className="modal-footer">
              <button className={`btn btn--${alert.options?.type === 'error' ? 'danger' : 'primary'}`} onClick={closeAlert}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
