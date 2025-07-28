/**
 * Client-Side Logo Handler
 * Handles dynamic logo retrieval and display from company_branding table
 */

console.log('🎨 Logo Handler: Script loaded at', new Date().toISOString());

class LogoHandler {
  constructor() {
    this.logoElement = null;
    this.fallbackElement = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    console.log('🎨 Logo Handler: Constructor called');
    this.init();
  }

  /**
   * Initialize logo handler
   */
  init() {
    console.log('🎨 Logo Handler: Initializing...');
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      console.log('🎨 Logo Handler: DOM still loading, waiting...');
      document.addEventListener('DOMContentLoaded', () => this.setupLogo());
    } else {
      console.log('🎨 Logo Handler: DOM ready, setting up logo');
      this.setupLogo();
    }
  }

  /**
   * Setup logo elements and fetch logo data
   */
  async setupLogo() {
    try {
      console.log('🎨 Logo Handler: Setting up logo elements...');
      // Find logo elements in the DOM
      this.logoElement = document.getElementById('company-logo-img');
      this.fallbackElement = document.querySelector('.logo-icon');
      
      console.log('🎨 Logo Handler: Elements found:', {
        logoElement: !!this.logoElement,
        fallbackElement: !!this.fallbackElement,
        logoElementSrc: this.logoElement?.src || 'none'
      });
      
      if (!this.logoElement) {
        console.error('🎨 Logo Handler: Logo image element (#company-logo-img) not found in DOM');
        console.log('🎨 Logo Handler: Available elements with "logo" in ID:', 
          Array.from(document.querySelectorAll('[id*="logo"]')).map(el => el.id));
        return;
      }

      // Fetch and display logo
      console.log('🎨 Logo Handler: Fetching logo data...');
      await this.fetchAndDisplayLogo();
      
      // Set up error handling for broken images
      this.setupImageErrorHandling();
      
    } catch (error) {
      console.error('🎨 Logo Handler: Failed to setup logo:', error);
      this.showFallbackLogo();
    }
  }

  /**
   * Fetch logo data from company_branding table via API
   */
  async fetchAndDisplayLogo() {
    try {
      console.log('🎨 Logo Handler: Making API request to /api/branding...');
      const brandingData = await window.clientAPI.getBranding();

      console.log('🎨 Logo Handler: API response status:', response.status);
      
      if (!response.ok) {
        console.error('🎨 Logo Handler: API request failed with status:', response.status);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      console.log('🎨 Logo Handler: Branding data received:', {
        hasLogo: !!brandingData.logo_url,
        logoUrl: brandingData.logo_url,
        fullData: brandingData
      });

      if (brandingData.logo_url && brandingData.logo_url.trim() !== '') {
        console.log('🎨 Logo Handler: Valid logo URL found, displaying...');
        await this.displayLogo(brandingData.logo_url);
      } else {
        console.log('🎨 Logo Handler: No logo URL found in branding data, showing fallback');
        this.showFallbackLogo();
      }

    } catch (error) {
      console.error('🎨 Logo Handler: Error fetching logo:', error);
      
      // Retry logic for transient failures
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🎨 Logo Handler: Retrying logo fetch (attempt ${this.retryCount}/${this.maxRetries})`);
        
        setTimeout(() => {
          this.fetchAndDisplayLogo();
        }, 2000 * this.retryCount); // Exponential backoff
      } else {
        console.error('🎨 Logo Handler: Max retries reached, showing fallback logo');
        this.showFallbackLogo();
      }
    }
  }

  /**
   * Display the logo image
   */
  async displayLogo(logoUrl) {
    console.log('🎨 Logo Handler: Attempting to display logo:', logoUrl);
    return new Promise((resolve, reject) => {
      if (!this.logoElement) {
        console.error('🎨 Logo Handler: Logo element not available for display');
        reject(new Error('Logo element not available'));
        return;
      }

      // Create a temporary image to test if the URL is valid
      const testImage = new Image();
      
      testImage.onload = () => {
        console.log('🎨 Logo Handler: Logo image loaded successfully, updating DOM...');
        // Image loaded successfully, update the main logo element
        this.logoElement.src = logoUrl;
        this.logoElement.alt = 'Company Logo';
        this.logoElement.style.display = 'block';
        
        // Hide fallback logo
        if (this.fallbackElement) {
          this.fallbackElement.style.display = 'none';
          console.log('🎨 Logo Handler: Fallback logo hidden');
        }
        
        console.log('🎨 Logo Handler: Logo displayed successfully:', logoUrl);
        resolve();
      };
      
      testImage.onerror = () => {
        console.error('🎨 Logo Handler: Failed to load logo image:', logoUrl);
        this.showFallbackLogo();
        reject(new Error('Logo image failed to load'));
      };
      
      // Start loading the test image
      console.log('🎨 Logo Handler: Testing image load...');
      testImage.src = logoUrl;
    });
  }

  /**
   * Show fallback text logo when image logo is unavailable
   */
  showFallbackLogo() {
    console.log('🎨 Logo Handler: Showing fallback logo');
    if (this.logoElement) {
      this.logoElement.style.display = 'none';
      console.log('🎨 Logo Handler: Image logo hidden');
    }
    
    if (this.fallbackElement) {
      this.fallbackElement.style.display = 'flex';
      console.log('🎨 Logo Handler: Fallback text logo displayed');
    } else {
      console.warn('🎨 Logo Handler: No fallback element found');
    }
  }

  /**
   * Setup error handling for logo image loading failures
   */
  setupImageErrorHandling() {
    if (this.logoElement) {
      this.logoElement.addEventListener('error', () => {
        console.error('🎨 Logo Handler: Logo image failed to load, showing fallback');
        this.showFallbackLogo();
      });
      console.log('🎨 Logo Handler: Error handling set up for logo image');
    }
  }

  /**
   * Refresh logo (useful for after logo uploads)
   */
  async refreshLogo() {
    console.log('🎨 Logo Handler: Manual refresh requested');
    this.retryCount = 0; // Reset retry count
    await this.fetchAndDisplayLogo();
  }

  /**
   * Get current logo status
   */
  getLogoStatus() {
    const status = {
      hasImageLogo: this.logoElement && this.logoElement.style.display !== 'none' && this.logoElement.src,
      logoUrl: this.logoElement ? this.logoElement.src : null,
      isUsingFallback: this.fallbackElement && this.fallbackElement.style.display !== 'none'
    };
    console.log('🎨 Logo Handler: Current status:', status);
    return status;
  }
}

console.log('🎨 Logo Handler: Creating global instance...');
// Create global instance
const logoHandler = new LogoHandler();

// Make it globally available for manual refresh after uploads