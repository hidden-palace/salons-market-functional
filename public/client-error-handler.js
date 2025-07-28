/**
 * Client-Side Error Handler
 * Lightweight error handling for browser environment
 */

class ClientErrorHandler {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupNetworkMonitoring();
  }

  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async handleCaughtFailure(caughtErr, context = 'unknown', options = {}) {
    const failureInfo = this.categorizeFailure(caughtErr, context);
    
    // Log failure
    this.logFailure(failureInfo);
    
    // Handle based on failure type
    switch (failureInfo.type) {
      case 'network':
        return this.handleNetworkFailure(failureInfo, options);
      case 'api':
        return this.handleAPIFailure(failureInfo, options);
      case 'validation':
        return this.handleValidationFailure(failureInfo, options);
      default:
        return this.handleGenericFailure(failureInfo, options);
    }
  }

  categorizeFailure(caughtErr, context) {
    const failureInfo = {
      original: caughtErr,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      isOnline: this.isOnline
    };

    // Network failures
    if (!this.isOnline || caughtErr.message?.includes('fetch') || caughtErr.message?.includes('network')) {
      failureInfo.type = 'network';
      failureInfo.severity = 'medium';
      failureInfo.userMessage = 'Network connection issue. Please check your internet connection.';
      failureInfo.retryable = true;
    }
    // API failures
    else if (caughtErr.status && caughtErr.status >= 400 && caughtErr.status < 500) {
      failureInfo.type = 'api';
      failureInfo.severity = 'high';
      failureInfo.userMessage = 'An issue occurred while communicating with the server.';
    }
    // Validation failures
    else if (caughtErr.message?.includes('validation') || caughtErr.message?.includes('invalid')) {
      failureInfo.type = 'validation';
      failureInfo.severity = 'low';
      failureInfo.retryable = false;
    }
    // Server failures
    else {
      failureInfo.type = 'server_failure';
      failureInfo.severity = 'high';
      failureInfo.userMessage = 'An unexpected issue occurred. Please try again later.';
      failureInfo.retryable = false;
    }

    return failureInfo;
  }

  logFailure(failureInfo) {
    console.group('Client Failure Information');
    console.log('Type:', failureInfo.type);
    console.log('Context:', failureInfo.context);
    console.log('Failure Object:', failureInfo.original);
    console.groupEnd();
  }

  async handleNetworkFailure(failureInfo, options) {
    if (!this.isOnline) {
      this.showNotification('You appear to be offline. Please connect to the internet and try again.', 'warning');
      return { success: false, message: 'Offline' };
    }

    this.showNotification('Network issue detected. Please try again.', 'warning');
    return { success: false, retryable: true };
  }

  async handleAPIFailure(failureInfo, options) {
    if (failureInfo.original.status === 404) {
      this.showNotification('The requested resource was not found.', 'failure');
      return { success: false, status: 404 };
    }
    if (failureInfo.original.status === 429) {
      this.showNotification('Too many requests. Please wait a moment and try again.', 'warning');
      return { success: false, status: 429 };
    }
    
    this.showNotification('An issue occurred. Please try again.', 'failure');
    return { success: false, retryable: false };
  }

  handleValidationFailure(failureInfo, options) {
    this.showNotification('Please check your input and try again.', 'failure');
    return { success: false };
  }

  handleGenericFailure(failureInfo, options) {
    this.showNotification('An unknown issue occurred. Please try again.', 'failure');
    return { success: false };
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-message">${message}</div>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
}

// Create singleton instance
const clientFailureHandler = new ClientErrorHandler();

// Make globally available
window.clientFailureHandler = clientFailureHandler;