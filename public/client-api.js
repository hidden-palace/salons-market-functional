/**
 * Client-Side API Handler
 * Lightweight API client for browser environment
 */

class ClientAPI {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.defaultTimeout = 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  async request(method, endpoint, options = {}) {
    // Prevent duplicate baseURL if endpoint already includes it
    const url = endpoint.startsWith(this.baseURL) 
      ? endpoint 
      : `${this.baseURL}${endpoint}`;
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
      const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
      
      const response = await fetch(url, { 
        ...config, 
        signal: controller.signal 
      });
      
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
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Request timeout');
        timeoutErr.type = 'timeout';
        throw timeoutErr;
      }
      throw err;
    }
  }

  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }

  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, {
      ...options,
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, {
      ...options,
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }

  /**
   * Fetch company branding data including logo
   */
  async getBranding() {
    try {
      return await this.get('/branding');
    } catch (error) {
      console.error('Failed to fetch branding data:', error);
      throw error;
    }
  }

  /**
   * Update company logo
   */
  async updateLogo(logoData) {
    try {
      return await this.post('/branding/logo', logoData);
    } catch (error) {
      console.error('Failed to update logo:', error);
      throw error;
    }
  }
}

// Create singleton instance
const clientAPI = new ClientAPI();

// Make globally available
window.clientAPI = clientAPI;