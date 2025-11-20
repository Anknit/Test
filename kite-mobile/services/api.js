import axios from 'axios';
import { getApiKey, getServerUrl } from '../utils/storage';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * API Client for Kite Trading Bot
 * Handles all communication with backend server
 */

class ApiClient {
  constructor() {
    this.baseURL = null;
    this.apiKey = null;
    this.axiosInstance = null;
  }

  /**
   * Initialize API client with stored credentials
   */
  async initialize() {
    this.baseURL = await getServerUrl();
    this.apiKey = await getApiKey();

    if (!this.baseURL || !this.apiKey) {
      throw new Error('API client not configured. Please complete setup.');
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.error || error.message;
          throw new Error(message);
        } else if (error.request) {
          // Request made but no response received
          throw new Error('No response from server. Check your connection.');
        } else {
          // Error setting up the request
          throw new Error(error.message);
        }
      }
    );
  }

  /**
   * Update configuration (after settings change)
   */
  async updateConfig() {
    await this.initialize();
  }

  /**
   * Make GET request
   */
  async get(endpoint, params = {}) {
    const response = await this.axiosInstance.get(endpoint, { params });
    return response.data;
  }

  /**
   * Make POST request
   */
  async post(endpoint, data = {}) {
    const response = await this.axiosInstance.post(endpoint, data);
    return response.data;
  }

  // ==================== Health & Status ====================

  /**
   * Check server health
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Health check failed');
    }
  }

  /**
   * Get trading status
   */
  async getStatus() {
    return await this.get(API_ENDPOINTS.STATUS);
  }

  // ==================== Trading ====================

  /**
   * Start trading
   */
  async startTrading(params) {
    return await this.post(API_ENDPOINTS.TRADING_START, params);
  }

  /**
   * Stop trading
   */
  async stopTrading() {
    return await this.post(API_ENDPOINTS.TRADING_STOP);
  }

  /**
   * Restart trading
   */
  async restartTrading(params) {
    return await this.post(API_ENDPOINTS.TRADING_RESTART, params);
  }

  // ==================== Enctoken ====================

  /**
   * Update enctoken manually
   */
  async updateEnctoken(enctoken) {
    return await this.post(API_ENDPOINTS.ENCTOKEN_UPDATE, { enctoken });
  }

  /**
   * Get enctoken status
   */
  async getEnctokenStatus() {
    return await this.get(API_ENDPOINTS.ENCTOKEN_STATUS);
  }

  /**
   * Validate enctoken with Kite API
   */
  async validateEnctoken() {
    return await this.get(API_ENDPOINTS.ENCTOKEN_VALIDATE);
  }

  /**
   * Login to Kite and fetch enctoken
   */
  async loginToKite(credentials) {
    return await this.post(API_ENDPOINTS.ENCTOKEN_LOGIN, credentials);
  }

  // ==================== Logs ====================

  /**
   * Get logs
   */
  async getLogs(lines = 100, filter = '') {
    return await this.get(API_ENDPOINTS.LOGS, { lines, filter });
  }

  /**
   * Clear logs
   */
  async clearLogs() {
    return await this.post(API_ENDPOINTS.LOGS_CLEAR);
  }

  // ==================== Backtest ====================

  /**
   * Run backtest
   */
  async runBacktest(params) {
    return await this.post(API_ENDPOINTS.BACKTEST_RUN, params);
  }

  /**
   * Get backtest results
   */
  async getBacktestResults() {
    return await this.get(API_ENDPOINTS.BACKTEST_RESULTS);
  }

  // ==================== Instruments ====================

  async getInstruments() {
    return await this.get(API_ENDPOINTS.INSTRUMENTS);
  }

  // ==================== Cache ====================

  /**
   * Get cache files
   */
  async getCacheFiles() {
    return await this.get(API_ENDPOINTS.CACHE);
  }

  /**
   * Clear cache
   */
  async clearCache() {
    return await this.post(API_ENDPOINTS.CACHE_CLEAR);
  }

  // ==================== Email ====================

  /**
   * Configure email settings
   */
  async configureEmail(config) {
    return await this.post(API_ENDPOINTS.EMAIL_CONFIG, config);
  }

  /**
   * Get email status
   */
  async getEmailStatus() {
    return await this.get(API_ENDPOINTS.EMAIL_STATUS);
  }

  /**
   * Send test email
   */
  async sendTestEmail() {
    return await this.post(API_ENDPOINTS.EMAIL_TEST);
  }

  // ==================== Positions ====================

  /**
   * Get open positions
   */
  async getPositions() {
    return await this.get(API_ENDPOINTS.POSITIONS);
  }
}

// Export singleton instance
const apiClient = new ApiClient();
export default apiClient;
