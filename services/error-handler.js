/**
 * Comprehensive Error Handler Service
 * Provides centralized error handling, logging, and user notifications
 */

class ApplicationErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.isOnline = navigator.onLine;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    this.initializeErrorHandling();
    this.setupNetworkMonitoring();
  }

  async initializeErrorHandling() {
    const storedErrors = JSON.parse(localStorage.getItem('stored_errors') || '[]');
    for (const item of storedErrors) {
      this.sendErrorToServer(item);
    }
  }

  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.errorQueue.length > 0) {
        this.errorQueue.forEach((item) => this.sendErrorToServer(item));
        this.errorQueue = [];
        localStorage.removeItem('stored_errors');
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Global error handlers
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleCaughtError(event.reason, 'unhandled_promise');
      event.preventDefault();
    });

    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      this.handleCaughtError(event.error, 'javascript_error');
    });
  }

  async handleCaughtError(caughtException, context = 'unknown', options = {}) {
    const exceptionInfo = this.categorizeException(caughtException, context);
    
    // Log error
    this.logException(exceptionInfo);
    
    // Handle based on error type
    switch (exceptionInfo.type) {
      case 'network':
        return this.handleNetworkException(exceptionInfo, options);
      case 'api':
        return this.handleAPIException(exceptionInfo, options);
      case 'validation':
        return this.handleValidationException(exceptionInfo, options);
      case 'authentication':
        return this.handleAuthException(exceptionInfo, options);
      case 'permission':
        return this.handlePermissionException(exceptionInfo, options);
      case 'rate_limit':
        return this.handleRateLimitException(exceptionInfo, options);
      case 'server_error':
        return this.handleServerException(exceptionInfo, options);
      default:
        return this.handleGenericException(exceptionInfo, options);
    }
  }

  categorizeException(caughtException, context) {
    const exceptionInfo = {
      original: caughtException,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      isOnline: this.isOnline
    };

    // Network errors
    if (!this.isOnline || caughtException.message?.includes('fetch') || caughtException.message?.includes('network')) {
      exceptionInfo.type = 'network';
      exceptionInfo.severity = 'medium';
      exceptionInfo.userMessage = 'Network is unreachable. Please check your internet connection.';
      exceptionInfo.retryable = true;
    }
    // API errors
    else if (caughtException.status && caughtException.status >= 400 && caughtException.status < 500) {
      exceptionInfo.type = 'api';
      exceptionInfo.severity = 'high';
      exceptionInfo.userMessage = 'An exception occurred while communicating with the server.';
    }
    // Validation errors
    else if (caughtException.message?.includes('validation') || caughtException.message?.includes('invalid')) {
      exceptionInfo.type = 'validation';
      exceptionInfo.severity = 'low';
      exceptionInfo.retryable = false;
    }
    // Authentication errors
    else if (caughtException.status === 401 || caughtException.message?.includes('unauthorized')) {
      exceptionInfo.type = 'authentication';
      exceptionInfo.severity = 'high';
      exceptionInfo.retryable = false;
    }
    // Permission errors
    else if (caughtException.status === 403 || caughtException.message?.includes('forbidden')) {
      exceptionInfo.type = 'permission';
      exceptionInfo.severity = 'medium';
      exceptionInfo.retryable = false;
    }
    // Rate limit errors
    else if (caughtException.message?.includes('rate limit') || caughtException.status === 429) {
      exceptionInfo.type = 'rate_limit';
      exceptionInfo.severity = 'medium';
      exceptionInfo.userMessage = 'Too many requests. Please try again later.';
      exceptionInfo.retryable = true;
    }
    // Server errors
    else {
      exceptionInfo.type = 'server_exception';
      exceptionInfo.severity = 'high';
      exceptionInfo.userMessage = 'An unexpected exception occurred. Please try again later.';
      exceptionInfo.retryable = false;
    }

    return exceptionInfo;
  }

  logException(exceptionInfo) {
    console.group('Exception Information');
    console.error('Type:', exceptionInfo.type);
    console.error('Context:', exceptionInfo.context);
    console.error('Exception Object:', exceptionInfo.original);
    console.groupEnd();
  }

  // Handle different types of errors

  async handleNetworkException(exceptionInfo, options) {
    if (!this.isOnline) {
      // Queue the item for later if possible
      if (options.queueable) {
        this.queueForOffline(options.operation, options.data);
        this.showNotification('Action saved offline. Will sync when connection is restored.', 'info');
        return { success: false, queued: true };
      }
      return { success: false, message: 'You appear to be offline. Please connect to the internet and try again.' };
    }

    switch (exceptionInfo.original.status) {
      case 500:
      case 502:
      case 503:
        this.showNotification('The server is currently unavailable. Please try again later.', 'error');
        return { success: false, retryable: true };
      default:
        this.showNotification('An unexpected error occurred. Please try again later.', 'error');
        return { success: false, retryable: false };
    }
  }

  async handleAPIException(exceptionInfo, options) {
    if (exceptionInfo.original.status === 404) {
      this.showNotification('The requested resource was not found.', 'error');
      return { success: false, status: 404 };
    }
    if (errorInfo.original.status === 409) {
      this.showNotification('Conflict detected. The resource may have been modified by another user.', 'warning');
      return { success: false, status: 409 };
    }
    if (exceptionInfo.original.status === 422) {
      this.showNotification('Validation failed. Please check your input.', 'error');
      return { success: false, status: 422 };
    }
    if (exceptionInfo.original.status === 429) {
      this.showNotification('Too many requests. Please wait a moment and try again.', 'warning');
      return this.handleRateLimitException(exceptionInfo, options);
    }
    if (exceptionInfo.original.status >= 500) {
      this.showNotification('Server error. Please try again later.', 'error');
      return { success: false, status: exceptionInfo.original.status, retryable: false };
    }
    // Fallback
    this.showNotification('An unexpected error occurred. Please try again.', 'error');
    return { success: false, retryable: false };
  }

  handleValidationException(exceptionInfo, options) {
    const validationException = errorInfo.original;
    
    if (validationException.details && Array.isArray(validationException.details)) {
      // Handle multiple validation errors
      validationException.details.forEach(detail => {
        this.showFieldError(detail.field, detail.message);
      });
    } else if (validationException.field && validationException.message) {
      // Handle single field error
      this.showFieldError(validationException.field, validationException.message);
    } else {
      // Generic validation error
      this.showNotification('Please check your input and try again.', 'error');
    }
    return { success: false };
  }

  async handleRateLimitException(exceptionInfo, options) {
    const retryAfter = exceptionInfo.original.retryAfter || 60;
    this.showNotification(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`, 'info');
    return new Promise((resolve) => setTimeout(() => resolve({ success: false, queued: true }), retryAfter * 1000));
  }

  handleAuthException(exceptionInfo, options) {
    this.showNotification('Authentication required. Please log in to continue.', 'error');
    
    // Clear any stored auth tokens
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);

    return { success: false, requiresAuth: true };
  }

  handlePermissionException(exceptionInfo, options) {
    this.showNotification('You do not have permission to perform this action.', 'error');
    return { success: false };
  }

  handleServerException(exceptionInfo, options) {
    this.showNotification('Server error. Please try again later.', 'error');
    return { success: false };
  }

  handleGenericException(exceptionInfo, options) {
    this.showNotification('An unknown error occurred. Please try again.', 'error');
    return { success: false };
  }

  // Utility functions

  showNotification(message, type) {
    // Assuming a global UI notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  showFieldError(field, message) {
    // Display error on specific form field (placeholder implementation)
    const fieldElem = document.querySelector(`[name="${field}"]`);
    if (fieldElem) {
      let errorElem = document.createElement('div');
      errorElem.className = 'field-error';
      errorElem.textContent = message;
      fieldElem.parentElement.insertBefore(errorElem, fieldElem.nextSibling);
    }
  }

  queueForOffline(operation, data) {
    this.errorQueue.push({ operation, data });
    localStorage.setItem('stored_errors', JSON.stringify(this.errorQueue));
  }
}

const applicationErrorHandler = new ApplicationErrorHandler();
export default applicationErrorHandler;