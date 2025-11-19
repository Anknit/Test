import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage wrapper using Expo SecureStore
 * For web, it falls back to localStorage.
 * Stores sensitive data like API keys.
 */

const KEYS = {
  API_KEY: 'api_key',
  SERVER_URL: 'server_url',
  SETUP_COMPLETE: 'setup_complete',
};

/**
 * Save API key securely
 */
export const saveApiKey = async (apiKey) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.API_KEY, apiKey);
    } else {
      await SecureStore.setItemAsync(KEYS.API_KEY, apiKey);
    }
    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
};

/**
 * Get API key
 */
export const getApiKey = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(KEYS.API_KEY);
    } else {
      return await SecureStore.getItemAsync(KEYS.API_KEY);
    }
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
};

/**
 * Save server URL
 */
export const saveServerUrl = async (url) => {
  try {
    // Remove trailing slash
    const cleanUrl = url.replace(/\/$/, '');
    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.SERVER_URL, cleanUrl);
    } else {
      await SecureStore.setItemAsync(KEYS.SERVER_URL, cleanUrl);
    }
    return true;
  } catch (error) {
    console.error('Error saving server URL:', error);
    return false;
  }
};

/**
 * Get server URL
 */
export const getServerUrl = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(KEYS.SERVER_URL);
    } else {
      return await SecureStore.getItemAsync(KEYS.SERVER_URL);
    }
  } catch (error) {
    console.error('Error getting server URL:', error);
    return null;
  }
};

/**
 * Mark setup as complete
 */
export const setSetupComplete = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.SETUP_COMPLETE, 'true');
    } else {
      await SecureStore.setItemAsync(KEYS.SETUP_COMPLETE, 'true');
    }
    return true;
  } catch (error) {
    console.error('Error setting setup complete:', error);
    return false;
  }
};

/**
 * Check if setup is complete
 */
export const isSetupComplete = async () => {
  try {
    let value;
    if (Platform.OS === 'web') {
      value = localStorage.getItem(KEYS.SETUP_COMPLETE);
    } else {
      value = await SecureStore.getItemAsync(KEYS.SETUP_COMPLETE);
    }
    return value === 'true';
  } catch (error) {
    console.error('Error checking setup status:', error);
    return false;
  }
};

/**
 * Clear all stored data (logout)
 */
export const clearAllData = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(KEYS.API_KEY);
      localStorage.removeItem(KEYS.SERVER_URL);
      localStorage.removeItem(KEYS.SETUP_COMPLETE);
    } else {
      await SecureStore.deleteItemAsync(KEYS.API_KEY);
      await SecureStore.deleteItemAsync(KEYS.SERVER_URL);
      await SecureStore.deleteItemAsync(KEYS.SETUP_COMPLETE);
    }
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};
