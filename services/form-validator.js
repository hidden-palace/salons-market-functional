/**
 * Form Validation Service with Error Handling
 * Provides comprehensive form validation with user-friendly error messages
 */

class FormValidator {
  constructor() {
    this.rules = new Map();
    this.customValidators = new Map();
    this.initializeValidators();
  }

  /**
   * Initialize built-in validators
   */
  initializeValidators() {
    this.customValidators.set('required', (value) => {
      if (!value || value.trim() === '') {
        return 'This field is required';
      }
      return null;
    });

    this.customValidators.set('email', (value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    });

    this.customValidators.set('minLength', (value, minLength) => {
      if (value && value.length < minLength) {
        return `Must be at least ${minLength} characters long`;
      }
      return null;
    });

    this.customValidators.set('maxLength', (value, maxLength) => {
      if (value && value.length > maxLength) {
        return `Must be no more than ${maxLength} characters long`;
      }
      return null;
    });

    this.customValidators.set('phone', (value) => {
      if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return 'Please enter a valid phone number';
      }
      return null;
    });
  }

  /**
   * Define validation rules for a form
   */
  setRules(formId, rules) {
    this.rules.set(formId, rules);
  }

  /**
   * Validate all fields in a form on submit
   */
  validateFormElement(formElement) {
    const formId = formElement.id || formElement.dataset.formId;
    const rules = this.rules.get(formId);

    if (!rules) return { valid: true, errors: [] };

    const validationErrors = [];
    Object.entries(rules).forEach(([fieldName, fieldRules]) => {
      const field = formElement.querySelector(`[name="${fieldName}"]`);
      if (!field) return;
      const fieldValidationErrors = this.validateField(fieldName, field.value, fieldRules);
      if (fieldValidationErrors.length > 0) {
        validationErrors.push(...fieldValidationErrors);
      }
    });
    return {
      valid: validationErrors.length === 0,
      errors: validationErrors
    };
  }

  /**
   * Validate a single field's value against its rules
   */
  validateField(fieldName, value, rules) {
    const validationIssues = [];

    for (const rule of rules) {
      let validator, params, message;

      if (typeof rule === 'string') {
        validator = rule;
        params = [];
      } else if (typeof rule === 'object') {
        validator = rule.rule;
        params = rule.params || [];
        message = rule.message;
      }

      const validatorFunction = this.customValidators.get(validator);
      if (!validatorFunction) {
        console.warn(`Unknown validator: ${validator}`);
        continue;
      }

      const validationIssue = validatorFunction(value, ...params);
      if (validationIssue) {
        validationIssues.push({
          field: fieldName,
          rule: validator,
          message: message || validationIssue
        });
        break; // Stop at first error for this field
      }
    }

    return validationIssues;
  }

  /**
   * Clear previous errors on a field
   */
  clearFieldErrors(field) {
    const issueElements = field.parentElement.querySelectorAll('.field-error');
    issueElements.forEach(elem => elem.remove());
  }

  /**
   * Set up real-time validation (on blur/input)
   */
  setupRealTimeValidation(formElement) {
    const formId = formElement.id || formElement.dataset.formId;
    const rules = this.rules.get(formId);
    
    if (!rules) return;

    Object.keys(rules).forEach(fieldName => {
      const field = formElement.querySelector(`[name="${fieldName}"]`);
      if (!field) return;

      const validateFieldRealTime = () => {
        const value = field.value;
        const fieldIssues = this.validateField(fieldName, value, rules[fieldName]);

        // Clear previous errors
        this.clearFieldErrors(field);

        // Show new errors
        if (fieldIssues.length > 0) {
          this.showFieldErrors(field, fieldIssues);
        }
      };

      field.addEventListener('blur', validateFieldRealTime);
      let timeout;
      field.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(validateFieldRealTime, 300);
      });
    });
  }

  /**
   * Display field errors
   */
  showFieldErrors(field, fieldIssues) {
    fieldIssues.forEach(issueObj => {
      const issueElement = document.createElement('div');
      issueElement.className = 'field-error';
      issueElement.textContent = issueObj.message;
      field.parentElement.appendChild(issueElement);
    });
  }
}

export default new FormValidator();
