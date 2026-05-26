export const getSafeLocalStorage = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (error) {
    console.warn("Storage access denied:", error);
    return fallback;
  }
};

export const setSafeLocalStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Storage write denied:", error);
  }
};

export const clearSafeStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.warn("localStorage clear denied:", error);
  }
  try {
    sessionStorage.clear();
  } catch (error) {
    console.warn("sessionStorage clear denied:", error);
  }
};
