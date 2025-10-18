// FIX: The type 'LogEntry' is not exported from '../types'. Since logging functionality is disabled,
// this import is removed and the dependent type annotation is changed to 'any[]'.

// Logging is disabled as Firebase has been removed.
// Functions are kept to prevent import errors in other components.

export const getLogs = async (): Promise<any[]> => {
  return [];
};

export const addLog = async (action: string, details: string = ''): Promise<void> => {
  // Do nothing
};

export const clearLogs = async (): Promise<void> => {
  // Do nothing
};
