/**
 * Error Handling Integration Script
 * Integrates error handling services with the existing application
 */

// Global error handling setup
window.addEventListener('DOMContentLoaded', () => {
  initializeErrorHandling();
  setupFormValidation();
  setupNetworkMonitoring();
});

/**
 * Initialize comprehensive error handling
 */
function initializeErrorHandling() {
  console.log('🛡️ Initializing client-side error handling...');

  // Setup global error boundaries
  setupGlobalErrorBoundaries();

  console.log('✅ Error handling initialized successfully');
}

/**
 * Setup global error boundaries
 */
function setupGlobalErrorBoundaries() {
  // Catch and handle all unhandled errors
  window.addEventListener('error', (event) => {
    if (window.clientFailureHandler) {
      window.clientFailureHandler.handleCaughtFailure(event.error, 'global_exception', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    }
  });

  // Catch and handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (window.clientFailureHandler) {
      window.clientFailureHandler.handleCaughtFailure(event.reason, 'unhandled_promise', {
        promise: event.promise
      });
    }
    event.preventDefault();
  });
}

/**
 * Setup form validation for all forms
 */
function setupFormValidation() {
  // Setup form submission handling
  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!form.matches('form')) return;
    
    // Skip if form has data-no-intercept attribute
    if (form.dataset.noIntercept === 'true') return;
    
    event.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';
      
      try {
        // Submit form
        const endpoint = form.action || form.dataset.action || '/api/submit';
        const method = form.method || 'POST';
        
        const result = await window.clientAPI.request(method.toUpperCase(), endpoint, {
          body: JSON.stringify(data)
        });
        
        // Handle success
        if (window.clientFailureHandler) {
          window.clientFailureHandler.showNotification('Form submitted successfully!', 'success');
        }
        
        // Reset form if specified
        if (form.dataset.resetOnSuccess !== 'false') {
          form.reset();
        }
        
        // Trigger custom success event
        form.dispatchEvent(new CustomEvent('formSuccess', { detail: result }));
        
      } catch (err) {
        if (window.clientFailureHandler) {
          await window.clientFailureHandler.handleCaughtFailure(err, 'form_submission', {
            formId: form.id
          });
        }
      } finally {
        // Restore button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}

/**
 * Setup network monitoring
 */
function setupNetworkMonitoring() {
  // Update offline indicator
  updateOfflineIndicator();
  
  window.addEventListener('online', updateOfflineIndicator);
  window.addEventListener('offline', updateOfflineIndicator);
}

/**
 * Update offline indicator
 */
function updateOfflineIndicator() {
  const existingIndicator = document.querySelector('.offline-indicator');
  
  if (!navigator.onLine) {
    if (!existingIndicator) {
      const indicator = document.createElement('div');
      indicator.className = 'offline-indicator';
      indicator.textContent = 'You are offline. Changes will be saved locally.';
      document.body.appendChild(indicator);
    }
  } else {
    if (existingIndicator) {
      existingIndicator.remove();
    }
  }
}

/**
 * Utility functions for error handling
 */
window.ErrorUtils = {
  /**
   * Handle async operations with error management
   */
  async handleAsync(operation, context = 'async_operation', options = {}) {
    try {
      return await operation();
    } catch (err) {
      if (window.clientFailureHandler) {
        return window.clientFailureHandler.handleCaughtFailure(err, context, options);
      }
      throw err;
    }
  },
  
  /**
   * Wrap functions with error handling
   */
  wrapFunction(fn, context = 'wrapped_function') {
    return function(...args) {
      try {
        const result = fn.apply(this, args);
        if (result instanceof Promise) {
          return result.catch(err => {
            if (window.clientFailureHandler) {
              return window.clientFailureHandler.handleCaughtFailure(err, context, { args });
            }
            throw err;
          });
        }
        return result;
      } catch (err) {
        if (window.clientFailureHandler) {
          return window.clientFailureHandler.handleCaughtFailure(err, context, { args });
        }
        throw err;
      }
    };
  },
  
  /**
   * Show loading state with error handling
   */
  async withLoading(operation, loadingElement) {
    if (loadingElement) {
      loadingElement.classList.add('loading');
    }
    
    try {
      return await operation();
    } finally {
      if (loadingElement) {
        loadingElement.classList.remove('loading');
      }
    }
  },
  
  /**
   * Debounce function calls to prevent spam
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};