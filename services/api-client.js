/**
 * Enhanced API Client with Error Handling
 * Provides robust API communication with automatic error handling
 */

import applicationErrorHandler from './error-handler.js';

class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.defaultTimeout = 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  async request(method, endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      const response = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);

      // Handle non-200 responses
      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        const httpFailure = new Error(responseData.message || `HTTP ${response.status}`);
        httpFailure.status = response.status;
        httpFailure.response = response;
        httpFailure.data = responseData;
        throw httpFailure;
      }

      return await response.json();
    } catch (caughtException) {
      if (caughtException.name === 'AbortError') {
        // Handle request timeout
        return applicationErrorHandler.handleCaughtError(caughtException, 'timeout');
      }
      throw caughtException;
    }
  }

  async batchRequest(requests) {
    try {
      const responses = await Promise.all(requests.map((req) => this.request(req.method, req.url, req.options)));
      return responses;
    } catch (caughtException) {
      const handledFailure = await appErrorHandler.handleCaughtError(caughtException, 'batch_request');
      throw handledFailure;
    }
  }
}

export default APIClient;
