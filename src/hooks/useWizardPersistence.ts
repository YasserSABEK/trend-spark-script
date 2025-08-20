import { useState, useEffect, useCallback } from 'react';

interface WizardState {
  currentStep: number;
  formData: any;
  processingResults: any;
  createdProfileId: string | null;
}

interface UseWizardPersistenceOptions {
  userId: string | undefined;
  storageKey: string;
  initialState: WizardState;
}

export const useWizardPersistence = ({ userId, storageKey, initialState }: UseWizardPersistenceOptions) => {
  const [state, setState] = useState<WizardState>(initialState);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const getStorageKey = useCallback(() => {
    return userId ? `${storageKey}_${userId}` : null;
  }, [storageKey, userId]);

  // Load state from localStorage on mount
  useEffect(() => {
    const key = getStorageKey();
    if (!key) return;

    try {
      const savedState = localStorage.getItem(key);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error('Error loading wizard state from localStorage:', error);
    }
  }, [getStorageKey]);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((newState: WizardState) => {
    const key = getStorageKey();
    if (!key) return;

    try {
      localStorage.setItem(key, JSON.stringify(newState));
      setState(newState);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error saving wizard state to localStorage:', error);
      setState(newState);
    }
  }, [getStorageKey]);

  // Clear saved state
  const clearState = useCallback(() => {
    const key = getStorageKey();
    if (!key) return;

    try {
      localStorage.removeItem(key);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error clearing wizard state from localStorage:', error);
    }
  }, [getStorageKey]);

  // Check if there's saved state
  const hasSavedState = useCallback(() => {
    const key = getStorageKey();
    if (!key) return false;
    return localStorage.getItem(key) !== null;
  }, [getStorageKey]);

  return {
    state,
    saveState,
    clearState,
    hasUnsavedChanges,
    hasSavedState
  };
};