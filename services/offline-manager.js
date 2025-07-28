/**
 * Offline Manager Service
 * Handles offline functionality, data synchronization, and cache management
 */

import applicationErrorHandler from './error-handler.js';

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.cache = new Map();
    this.dbName = 'OrchidRepublicOfflineDB';
    this.dbVersion = 1;
    this.db = null;
    
    this.initializeOfflineSupport();
    this.setupNetworkListeners();
    this.initializeIndexedDB();
  }

  /**
   * Initialize offline support
   */
  async initializeOfflineSupport() {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (caughtFailure) {
        console.error('Service Worker registration failed:', caughtFailure);
      }
    }

    // Initialize cache
    if ('caches' in window) {
      this.cacheAPI = await caches.open('orchid-republic-v1');
    }
  }

  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onConnectionRestored();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onConnectionLost();
    });
  }

  /**
   * Initialize IndexedDB for offline data storage
   */
  async initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp');
          syncStore.createIndex('type', 'type');
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp');
          cacheStore.createIndex('expiry', 'expiry');
        }

        if (!db.objectStoreNames.contains('offlineActions')) {
          const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
          actionsStore.createIndex('timestamp', 'timestamp');
          actionsStore.createIndex('status', 'status');
        }
      };
    });
  }

  /**
   * Handle connection restored
   */
  async onConnectionRestored() {
    console.log('Connection restored, syncing offline data...');
    
    // Show notification
    this.showNotification('Connection restored! Syncing your changes...', 'success');
    
    // Sync offline actions
    await this.syncOfflineActions();
    
    // Clear expired cache
    await this.clearExpiredCache();
  }

  /**
   * Handle connection lost
   */
  onConnectionLost() {
    console.log('Connection lost, switching to offline mode...');
    this.showNotification('You are offline. Your changes will be saved and synced when connection is restored.', 'warning');
  }

  /**
   * Store data for offline access
   */
  async storeOfflineData(key, data, expiryMinutes = 60) {
    if (!this.db) await this.initializeIndexedDB();

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');

    const cacheItem = {
      key,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (expiryMinutes * 60 * 1000)
    };

    await store.put(cacheItem);
    console.log(`Data cached offline: ${key}`);
  }

  /**
   * Retrieve offline data
   */
  async getOfflineData(key) {
    if (!this.db) await this.initializeIndexedDB();

    const transaction = this.db.transaction(['cachedData'], 'readonly');
    const store = transaction.objectStore('cachedData');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiry > Date.now()) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Queue action for offline sync
   */
  async queueOfflineAction(action) {
    if (!this.db) await this.initializeIndexedDB();

    const transaction = this.db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');

    const actionItem = {
      ...action,
      timestamp: Date.now(),
      status: 'pending',
      attempts: 0
    };

    await store.add(actionItem);
    console.log('Action queued for offline sync:', action.type);
  }

  /**
   * Sync offline actions when connection is restored
   */
  async syncOfflineActions() {
    if (!this.db) return;

    const transaction = this.db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = async () => {
        const pendingActions = request.result;
        
        if (pendingActions.length === 0) {
          resolve();
          return;
        }

        console.log(`Syncing ${pendingActions.length} offline actions...`);
        
        let successful = 0;
        let failed = 0;

        for (const action of pendingActions) {
          try {
            await this.executeOfflineAction(action);
            
            // Mark as completed
            action.status = 'completed';
            action.completedAt = Date.now();
            await store.put(action);
            
            successful++;
          } catch (caughtFailure) {
            console.error('Failed to sync action:', action, caughtFailure);
            
            // Increment attempts
            action.attempts++;
            action.lastFailure = caughtFailure.message;
            
            // Mark as failed if too many attempts
            if (action.attempts >= 3) {
              action.status = 'failed';
            }
            
            await store.put(action);
            failed++;
          }
        }

        if (failed === 0) {
          this.showNotification(`All ${successful} offline actions synced successfully!`, 'success');
        } else {
          this.showNotification(`${successful} actions synced, ${failed} failed.`, 'warning');
        }

        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Execute an offline action
   */
  async executeOfflineAction(action) {
    switch (action.type) {
      case 'api_call':
        return await this.executeAPICall(action);
      case 'form_submission':
        return await this.executeFormSubmission(action);
      case 'file_upload':
        return await this.executeFileUpload(action);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute API call from offline queue
   */
  async executeAPICall(action) {
    const response = await fetch(action.url, {
      method: action.method,
      headers: action.headers,
      body: action.body
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Execute form submission from offline queue
   */
  async executeFormSubmission(action) {
    const formData = new FormData();
    Object.entries(action.data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(action.url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Form submission failed with status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Execute file upload from offline queue
   */
  async executeFileUpload(action) {
    // File uploads are more complex to handle offline
    // This would require storing the file data in IndexedDB
    throw new Error('File upload synchronization not implemented yet');
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    if (!this.db) return;

    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    const index = store.index('expiry');

    const now = Date.now();
    const range = IDBKeyRange.upperBound(now);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if data should be cached
   */
  shouldCache(url, method = 'GET') {
    // Cache GET requests for static data
    if (method !== 'GET') return false;
    
    // Don't cache real-time data
    const noCachePatterns = [
      '/api/status',
      '/api/run-status',
      '/api/webhook-response'
    ];
    
    return !noCachePatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Get cache key for request
   */
  getCacheKey(url, method = 'GET', body = null) {
    let key = `${method}:${url}`;
    if (body) {
      key += `:${JSON.stringify(body)}`;
    }
    return key;
  }

  /**
   * Intercept fetch requests for offline support
   */
  async interceptFetch(url, options = {}) {
    const method = options.method || 'GET';
    const cacheKey = this.getCacheKey(url, method, options.body);

    // If offline, try to get from cache
    if (!this.isOnline) {
      const cachedData = await this.getOfflineData(cacheKey);
      if (cachedData) {
        console.log('Serving from offline cache:', url);
        return { success: true, data: cachedData, fromCache: true };
      } else {
        // Queue for later if it's a modifying operation
        if (method !== 'GET') {
          await this.queueOfflineAction({
            type: 'api_call',
            url,
            method,
            headers: options.headers,
            body: options.body
          });
          return { success: false, queued: true };
        } else {
          throw new Error('No offline data available');
        }
      }
    }

    // Online - make request and cache if appropriate
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      // Cache successful GET requests
      if (response.ok && this.shouldCache(url, method)) {
        await this.storeOfflineData(cacheKey, data);
      }

      return { success: true, data };
    } catch (caughtError) {
      // If request fails, try cache as fallback
      const cachedData = await this.getOfflineData(cacheKey);
      if (cachedData) {
        console.log('Request failed, serving from cache:', url);
        return { success: true, data: cachedData, fromCache: true };
      }
      throw caughtError;
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // This would integrate with your notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // You can integrate this with your existing notification system
    if (window.appErrorHandler && window.appErrorHandler.showNotification) {
      window.applicationErrorHandler.showNotification(message, type);
    }
  }

  /**
   * Get offline status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      hasOfflineData: this.cache.size > 0,
      pendingActions: this.syncQueue.length
    };
  }
}

// Export singleton instance
const offlineManager = new OfflineManager();
export default offlineManager;