// Global state
let currentEmployee = 'brenden';
let currentThreadId = null;
let isProcessing = false;
let conversationHistory = {}; // Store conversation history per employee
let isExportDropdownOpen = false; // Track export dropdown state

// Global state management
let activeEmployeeId = 'brenden';
let conversationThreads = {}; // Store separate thread IDs for each employee
let pendingMessages = {}; // Track pending messages per employee

// Employee configurations
const employees = {
  brenden: {
    id: 'brenden',
    name: 'AI Brenden',
    role: 'lead scraper',
    specialty: 'Lead Research Specialist',
    avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/brenden.jpeg',
    description: 'Expert data researcher specializing in B2B lead generation. I extract high-quality prospects from LinkedIn, Google Maps, and Yellow Pages with precision and attention to detail.',
    quickActions: [
      { icon: '🔍', text: 'Find florists in Los Angeles', action: 'Find florists in Los Angeles area' },
      { icon: '📊', text: 'Research wedding vendors', action: 'Research wedding vendors and event planners' },
      { icon: '🏢', text: 'Corporate clients search', action: 'Find corporate clients who need floral services' },
      { icon: '📋', text: 'Scrape LinkedIn For VAs', action: 'Scrape LinkedIn For Virtual Assistants' }
    ],
    tags: ['Specialist', 'Marketing']
  },
  van: {
    id: 'van',
    name: 'AI Van',
    role: 'page operator',
    specialty: 'Digital Marketing Designer',
    avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/logo_1754352839350.jpeg',
    description: 'Creative digital marketing specialist focused on landing page design and conversion optimization. I create compelling pages that turn visitors into customers.',
    quickActions: [
      { icon: '💼', text: 'Corporate services page', action: 'Design a landing page for corporate floral services' },
      { icon: '💒', text: 'Wedding packages page', action: 'Create a wedding floral packages landing page' },
      { icon: '📱', text: 'Mobile-first design', action: 'Design a mobile-optimized flower delivery page' }
    ],
    tags: ['Marketing', 'Design']
  },
  rey: {
    id: 'rey',
    name: 'AI Rey',
    role: 'Strategic Analyst',
    specialty: 'Lead Generation Plan Strategist',
    avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/angel.jpeg',
    description: 'I develop comprehensive lead generation strategies by analyzing competitor landscapes and market opportunities. I create data-driven plans that optimize conversion rates and identify the most promising prospects.',
    quickActions: [
      { icon: '🧲', text: 'Create Lead Generation Plan to get new Leads', action: 'Create Lead Generation Plan to get new Leads' },
      { icon: '📝', text: 'Generate a 3-Tier Lead Gen Strategy', action: 'Generate a 3-Tier Lead Gen Strategy' },
      { icon: '📊', text: 'Break Plan into Time-Phased Actions', action: 'Break Plan into Time-Phased Actions' },
      { icon: '🎯', text: 'Build KPI Tracking metrics', action: 'Build KPI Tracking metrics' }
    ],
    tags: ['Strategy', 'Analytics']
  },
  xavier: {
  id: 'xavier',
  name: 'AI Xavier',
  role: 'Content Specialist',
  specialty: 'Content Generation AI',
  avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/logo_1753134605371.png',
  description: 'I create compelling content across all formats – from engaging social media videos and UGC campaigns to persuasive email sequences and landing page copy. I understand audience psychology and craft messages that convert.',
  quickActions: [
    { icon: '🎥', text: 'Generate TikTok Video Concept', action: 'Generate TikTok Video Concept' },
    { icon: '📹', text: 'Create Instagram Reel Script', action: 'Create Instagram Reel Script' },
    { icon: '📝', text: 'Write UGC Video Caption', action: 'Write UGC Video Caption' },
    { icon: '💡', text: 'Suggest 5 UGC Ideas', action: 'Suggest 5 UGC Ideas for brand' }
  ],
  tags: ['Content', 'Marketing']
}
};

// Welcome messages
const welcomeMessages = {
  brenden: "👋 Hi! I'm AI Brenden, your Lead Research Specialist. I excel at finding and qualifying high-quality business leads. I can help you discover potential customers, research companies, and build targeted prospect lists. What kind of leads are you looking for today?",
  van: "👋 Hello! I'm AI Van, your Digital Marketing Designer. I specialize in creating high-converting landing pages and marketing automation workflows. I can help you design compelling pages, set up marketing funnels, and optimize your digital presence. What marketing project can I help you with?",
  rey: "👋 Hey there! I'm AI Rey, your Lead Generation Plan Strategist. I focus on voice outreach strategies and competitor analysis to help you understand your market better. I can help you develop outreach campaigns, analyze competitors, and create strategic plans. What's your lead generation goal?",
  xavier: "👋 Hi! I'm AI Xavier, your UGC Expert. I specialize in user-generated content strategies and content creation that resonates with your audience. I can help you develop content plans, create engaging copy, and build authentic brand connections. Ready to create some amazing content?"
};

// DOM elements
let chatMessages, messageInput, sendButton, charCount, employeeList;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  initializeNavigation();
  initializeEmployeeSelection();
  initializeChatInterface();
  initializeBranding();
  initializeMobileMenu();
  initializeExportDropdown();
  
  // Load initial employee
  switchEmployee('brenden');
  
  // Load dashboard metrics
  loadDashboardMetrics();
  
  console.log('🚀 Orchid Republic Command Center initialized');
});

function initializeElements() {
  chatMessages = document.getElementById('chatMessages');
  messageInput = document.getElementById('messageInput');
  sendButton = document.getElementById('sendButton');
  charCount = document.getElementById('charCount');
  employeeList = document.querySelector('.team-members');
}

function initializeNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Show corresponding section
      contentSections.forEach(section => section.classList.remove('active'));
      const targetSection = document.getElementById(`${sectionId}-section`);
      if (targetSection) {
        targetSection.classList.add('active');
      }
      
      // Load section-specific data
      if (sectionId === 'leads') {
        console.log('🎯 Switching to leads section, loading data...');
        loadLeadsData();
      } else if (sectionId === 'dashboard') {
        console.log('🎯 Switching to dashboard section, loading metrics...');
        loadDashboardMetrics();
      }
    });
  });
}

function initializeEmployeeSelection() {
  const teamMembers = document.querySelectorAll('.team-member');
  
  teamMembers.forEach(member => {
    member.addEventListener('click', () => {
      const employeeId = member.dataset.employee;
      switchEmployee(employeeId);
      
      // Update active team member
      teamMembers.forEach(m => m.classList.remove('active'));
      member.classList.add('active');
    });
  });
}

function setupEmployeeProfiles() {
  console.log('🔧 Setting up employee profiles...');
  
  const employees = [
    { 
      id: 'brenden', 
      name: 'AI Brenden', 
      role: 'Lead Research Specialist', 
      specialty: 'Lead Generation & Data Research',
      avatar: '/brenden-avatar.jpg',
      description: 'Expert at finding and qualifying high-value leads through advanced research techniques.',
      status: 'online'
    },
    { 
      id: 'Van', 
      name: 'AI Van', 
      role: 'Landing Page Generation Expert', 
      specialty: 'Landing Page Expert',
      avatar: '/van-avatar.jpg',
      description: 'Expert at creating comprehensive engaging landing pages that convert.',
      status: 'online'
    },
    {
      id: 'Xavier',
      name: 'AI Xavier',
      role: 'UGC Expert', 
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    },
    { 
      id: 'Rey', 
      name: 'AI Rey', 
      role: 'Lead Generation Plan Strategist', 
      specialty: 'Voice Outreach & Campaign Management',
      avatar: '/rey-avatar.jpg', 
      description: 'Specializes in creating effective outreach strategies and managing voice campaigns.',
      status: 'online'
    },
    { 
      id: 'Xavier', 
      name: 'AI Xavier', 
      role: 'Content Generation AI', 
      specialty: 'Expert UGC video generator',
      avatar: '/van-avatar.jpg',
      description: 'Expert at creating high quality AI UGC videos for Reels and Tiktok.',
      status: 'online'
    }
  ];

  // Clear existing employee list and ensure fresh state
  employeeList.innerHTML = '';
  
  console.log('🔧 CRITICAL: Creating employee elements with data attributes');

  employees.forEach((employee, index) => {
    const employeeEl = document.createElement('div');
    employeeEl.className = `team-member ${employee.id === activeEmployeeId ? 'active' : ''}`;
    // CRITICAL: Store employee ID in data attribute for foolproof identification
    employeeEl.setAttribute('data-employee-id', employee.id);
    employeeEl.setAttribute('data-employee-name', employee.name);
    employeeEl.innerHTML = `
      <div class="member-avatar">
        <img src="https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" alt="${employee.name}">
        <div class="status-indicator ${employee.status}"></div>
      </div>
      <div class="member-info">
        <div class="member-name">${employee.name}</div>
        <div class="member-role">${employee.role}</div>
        <div class="member-specialty">${employee.specialty}</div>
      </div>
    `;

    // CRITICAL: Add click handler using data attribute, not array index
    employeeEl.addEventListener('click', function() {
      const clickedEmployeeId = this.getAttribute('data-employee-id');
      const clickedEmployeeName = this.getAttribute('data-employee-name');
      
      console.log('🎯 EMERGENCY FIX: Employee clicked!');
      console.log('🎯 EMERGENCY FIX: Clicked element data-employee-id:', clickedEmployeeId);
      console.log('🎯 EMERGENCY FIX: Clicked element data-employee-name:', clickedEmployeeName);
      console.log('🎯 EMERGENCY FIX: Previous activeEmployeeId:', activeEmployeeId);
      
      if (!clickedEmployeeId) {
        console.error('🚨 CRITICAL ERROR: No employee ID found on clicked element!');
        return;
      }
      
      // Prevent processing if message is pending
      if (pendingMessages[clickedEmployeeId]) {
        console.warn('⚠️ Message pending, ignoring click');
        return;
      }
      
      // Update active employee with absolute certainty
      activeEmployeeId = clickedEmployeeId;
      
      console.log('🎯 EMERGENCY FIX: NEW activeEmployeeId set to:', activeEmployeeId);
      
      // Update visual selection
      document.querySelectorAll('.team-member').forEach(el => el.classList.remove('active'));
      this.classList.add('active');
      
      // Find employee data
      const selectedEmployee = employees.find(emp => emp.id === clickedEmployeeId);
      if (!selectedEmployee) {
        console.error('🚨 CRITICAL ERROR: Employee not found in array!');
        return;
      }
      
      console.log('🎯 EMERGENCY FIX: Selected employee object:', selectedEmployee);
      
      // Handle employee selection
      handleEmployeeClick(selectedEmployee);
    });

    employeeList.appendChild(employeeEl);
    
    console.log(`🔧 Employee ${employee.name} (${employee.id}) added to DOM with data attribute`);
  });

  console.log('✅ Employee profiles setup complete');
  console.log('✅ CRITICAL: activeEmployeeId is:', activeEmployeeId);
}

function handleEmployeeClick(employee) {
  console.log('👤 Employee selected:', employee.name, '(ID:', employee.id, ')');
  console.log('👤 CRITICAL VERIFICATION: activeEmployeeId is now:', activeEmployeeId);
  console.log('👤 CRITICAL VERIFICATION: employee.id is:', employee.id);
  console.log('👤 CRITICAL VERIFICATION: Do they match?', activeEmployeeId === employee.id);

  // Update active employee visual state
  document.querySelectorAll('.team-member').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-employee-id="${employee.id}"]`)?.classList.add('active');

  // Update chat header
  updateChatHeader(employee);

  // Load conversation for this employee
  loadConversationForEmployee(employee.id);

  console.log(`✅ Successfully switched to ${employee.name}`);
}

function initializeChatInterface() {
  const chatForm = document.getElementById('chatForm');
  const newChatBtn = document.getElementById('newChatBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Chat form submission
  if (chatForm) {
    chatForm.addEventListener('submit', handleChatSubmit);
  }
  
  // New chat button
  if (newChatBtn) {
    newChatBtn.addEventListener('click', startNewChat);
  }
  
  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Update active tab
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show corresponding content
      tabContents.forEach(content => content.classList.remove('active'));
      const targetContent = document.getElementById(`${tabId}-tab`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
  
  // Character count
  if (messageInput && charCount) {
    messageInput.addEventListener('input', updateCharacterCount);
  }
  
  // Auto-resize textarea
  if (messageInput) {
    messageInput.addEventListener('input', autoResizeTextarea);
    
    // Add Enter key to send message
    messageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        
        // Only send if there's content and not already processing
        if (messageInput.value.trim() && !isProcessing) {
          const chatForm = document.getElementById('chatForm');
          if (chatForm) {
            handleChatSubmit(event);
          }
        }
      }
    });
  }
}

function initializeBranding() {
  console.log('🎨 Initializing branding functionality...');
  
  const primaryPicker = document.getElementById('primaryPicker');
  const primaryInput = document.getElementById('primaryInput');
  const secondaryPicker = document.getElementById('secondaryPicker');
  const secondaryInput = document.getElementById('secondaryInput');
  const accentPicker = document.getElementById('accentPicker');
  const accentInput = document.getElementById('accentInput');
  const saveColorsBtn = document.getElementById('saveColorsBtn');
  const logoUpload = document.getElementById('logoUpload');
  
  console.log('🔍 Branding elements found:', {
    primaryPicker: !!primaryPicker,
    logoUpload: !!logoUpload,
    saveColorsBtn: !!saveColorsBtn
  });
  
  // Sync color picker with text input
  if (primaryPicker && primaryInput) {
    primaryPicker.addEventListener('change', (e) => {
      primaryInput.value = e.target.value.toUpperCase();
    });
    primaryInput.addEventListener('change', (e) => {
      primaryPicker.value = e.target.value;
    });
  }
  
  if (secondaryPicker && secondaryInput) {
    secondaryPicker.addEventListener('change', (e) => {
      secondaryInput.value = e.target.value.toUpperCase();
    });
    secondaryInput.addEventListener('change', (e) => {
      secondaryPicker.value = e.target.value;
    });
  }
  
  if (accentPicker && accentInput) {
    accentPicker.addEventListener('change', (e) => {
      accentInput.value = e.target.value.toUpperCase();
    });
    accentInput.addEventListener('change', (e) => {
      accentPicker.value = e.target.value;
    });
  }
  
  // Save colors
  if (saveColorsBtn) {
    saveColorsBtn.addEventListener('click', saveColorScheme);
  }
  
  // Handle logo upload
  if (logoUpload) {
    console.log('✅ Logo upload input found, attaching event listener');
    logoUpload.addEventListener('change', handleLogoUpload);
  } else {
    console.error('❌ Logo upload input not found!');
  }
  
  // Load current branding on page load
  loadCurrentBranding();
}

async function handleLogoUpload(event) {
  console.log('🔍 FRONTEND DEBUG: handleLogoUpload called');
  
  const file = event.target.files[0];
  if (!file) return;
  
  console.log('🔍 FRONTEND DEBUG: Logo file selected:', {
    name: file.name,
    type: file.type,
    size: file.size
  });
  
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    showNotification('Invalid file type. Please select a PNG, JPG, or SVG file.', 'error');
    return;
  }
  
  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    showNotification('File too large. Please select a file smaller than 2MB.', 'error');
    return;
  }
  
  try {
    console.log('🚀 FRONTEND DEBUG: Starting logo upload...');
    
    // Create FormData
    const formData = new FormData();
    formData.append('logo', file);
    
    console.log('📤 FRONTEND DEBUG: FormData created, making API call...');
    
    // Show loading notification
    showNotification('Uploading logo...', 'info');
    
    // Upload to server
    const response = await fetch('/api/storage/logo', {
      method: 'POST',
      body: formData
    });
    
    console.log('📡 FRONTEND DEBUG: API response status:', response.status);
    console.log('📡 FRONTEND DEBUG: API response ok:', response.ok);
    
    const result = await response.json();
    console.log('📡 FRONTEND DEBUG: API response data:', result);
    
    if (response.ok && result.success) {
      showNotification('Logo uploaded successfully!', 'success');
      
      // Update logo preview
      updateLogoPreview(result.logo_url);
      
      // Clear file input
      event.target.value = '';
    } else {
      console.error('❌ FRONTEND DEBUG: Upload failed:', result);
      showNotification(`Upload failed: ${result.details || result.message || 'Unknown error'}`, 'error');
    }
    
  } catch (error) {
    console.error('❌ FRONTEND DEBUG: Upload error:', error);
    showNotification(`Upload error: ${error.message}`, 'error');
  }
}

async function loadCurrentBranding() {
  try {
    console.log('🔍 FRONTEND DEBUG: Loading current branding...');
    console.log('🔍 FRONTEND DEBUG: Loading current branding...');
    
    const response = await fetch('/api/branding');
    const branding = await response.json();
    
    console.log('📡 FRONTEND DEBUG: Current branding data:', branding);
    
    if (branding.logo_url) {
      updateLogoPreview(branding.logo_url);
    }
    
    // Update color inputs if they exist
    const primaryInput = document.getElementById('primaryInput');
    const primaryPicker = document.getElementById('primaryPicker');
    const secondaryInput = document.getElementById('secondaryInput');
    const secondaryPicker = document.getElementById('secondaryPicker');
    const accentInput = document.getElementById('accentInput');
    const accentPicker = document.getElementById('accentPicker');
    
    if (primaryInput && branding.primary_color) {
      primaryInput.value = branding.primary_color;
      if (primaryPicker) primaryPicker.value = branding.primary_color;
    }
    
    if (secondaryInput && branding.secondary_color) {
      secondaryInput.value = branding.secondary_color;
      if (secondaryPicker) secondaryPicker.value = branding.secondary_color;
    }
    
    if (accentInput && branding.accent_color) {
      accentInput.value = branding.accent_color;
      if (accentPicker) accentPicker.value = branding.accent_color;
    }
    
  } catch (error) {
    console.error('❌ FRONTEND DEBUG: Error loading branding:', error);
  }
}

function updateLogoPreview(logoUrl) {
  console.log('🖼️ FRONTEND DEBUG: Updating logo preview with URL:', logoUrl);
  
  const currentLogo = document.getElementById('currentLogo');
  const logoPreview = document.getElementById('logoPreview');
  
  if (currentLogo && logoPreview && logoUrl) {
    logoPreview.src = logoUrl;
    currentLogo.style.display = 'block';
    console.log('✅ FRONTEND DEBUG: Logo preview updated:', logoUrl);
  }
}

function removeLogo() {
  console.log('🗑️ FRONTEND DEBUG: Remove logo function called');
  // TODO: Implement logo removal
  console.log('🗑️ FRONTEND DEBUG: Remove logo requested');
  showNotification('Logo removal not implemented yet', 'warning');
}

function initializeMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    });
  }
}

function initializeExportDropdown() {
  const downloadBtn = document.getElementById('downloadLeadsBtn');
  const exportDropdown = document.getElementById('exportDropdown');
  
  if (!downloadBtn || !exportDropdown) return;
  
  // Toggle dropdown on button click
  downloadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isExportDropdownOpen = !isExportDropdownOpen;
    exportDropdown.style.display = isExportDropdownOpen ? 'block' : 'none';
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (isExportDropdownOpen && 
        !downloadBtn.contains(e.target) && 
        !exportDropdown.contains(e.target)) {
      isExportDropdownOpen = false;
      exportDropdown.style.display = 'none';
    }
  });
  
  // Handle dropdown item clicks
  const dropdownItems = exportDropdown.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const format = item.getAttribute('data-format');
      if (format) {
        exportFilteredLeads(format);
      }
    });
  });
}

/**
 * Get current filter values from the leads page
 */
function getLeadsFilters() {
  const filters = {};
  
  // Get status filter and map to backend parameters
  const statusFilter = document.querySelector('.filter-select[data-filter="status"]');
  if (statusFilter && statusFilter.value && statusFilter.value !== 'All Leads') {
    switch (statusFilter.value) {
      case 'New':
        filters.validated = false;
        filters.outreach_sent = false;
        break;
      case 'Contacted':
        filters.outreach_sent = true;
        break;
      case 'Qualified':
        filters.validated = true;
        break;
    }
  }
  
  // Get industry filter
  const industryFilter = document.querySelector('.filter-select[data-filter="industry"]');
  if (industryFilter && industryFilter.value && industryFilter.value !== 'All Industries') {
    filters.industry = industryFilter.value;
  }
  
  // Get location filter
  const locationFilter = document.querySelector('.filter-input[data-filter="location"]');
  if (locationFilter && locationFilter.value.trim()) {
    filters.city = locationFilter.value.trim();
  }
  
  return filters;
}

/**
 * Export leads with current filters applied
 */
async function exportFilteredLeads(format) {
  const downloadBtn = document.getElementById('downloadLeadsBtn');
  const exportDropdown = document.getElementById('exportDropdown');
  
  if (!downloadBtn) return;
  
  try {
    // Show loading state
    downloadBtn.classList.add('loading');
    const btnText = downloadBtn.querySelector('.btn-text');
    const btnLoading = downloadBtn.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    
    // Get current filters
    const filters = getLeadsFilters();
    
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    // Add cache-busting parameter
    queryParams.append('_t', Date.now().toString());
    
    // Construct export URL
    const exportUrl = `/api/leads/export?${queryParams.toString()}`;
    
    console.log(`📥 Exporting leads as ${format.toUpperCase()} with filters:`, filters);
    console.log(`🔗 EXPORT DEBUG: Full export URL:`, exportUrl);
    console.log(`🌐 EXPORT DEBUG: Current window location:`, window.location.href);
    console.log(`🔗 EXPORT DEBUG: Absolute URL would be:`, new URL(exportUrl, window.location.origin).href);
    
    // Test if we can reach the server at all
    console.log(`🧪 EXPORT DEBUG: Testing server connectivity...`);
    try {
      const testResponse = await fetch('/api/test-route');
      const testData = await testResponse.json();
      console.log(`✅ EXPORT DEBUG: Server test successful:`, testData);
    } catch (testError) {
      console.error(`❌ EXPORT DEBUG: Server test failed:`, testError);
    }
    
    // Try to fetch the export URL directly to see what happens
    console.log(`🔍 DIRECT FETCH TEST: Attempting direct fetch to export URL (NO DOWNLOAD)...`);
    console.log(`🔍 DIRECT FETCH TEST: This is a test to see what the client receives from the server`);
    
    let responseText; // Declare responseText in outer scope
    try {
      const directResponse = await fetch(exportUrl);
      console.log(`📡 EXPORT DEBUG: Direct fetch response status:`, directResponse.status);
      console.log(`📡 EXPORT DEBUG: Direct fetch response headers:`, [...directResponse.headers.entries()]);
      console.log(`📡 EXPORT DEBUG: Direct fetch response type:`, directResponse.type);
      console.log(`📡 EXPORT DEBUG: Direct fetch response URL:`, directResponse.url);
      
      responseText = await directResponse.text(); // Assign to outer-scoped variable
      console.log(`📄 EXPORT DEBUG: Direct fetch response body (first 500 chars):`, responseText.substring(0, 500));
      
      // Check if it's HTML instead of CSV
      if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        console.error(`❌ EXPORT DEBUG: Response is HTML, not CSV! This confirms the routing issue.`);
        console.error(`❌ DIRECT FETCH TEST: CLIENT RECEIVED HTML INSTEAD OF CSV`);
        console.error(`❌ DIRECT FETCH TEST: This means something is intercepting the response`);
        console.error(`❌ DIRECT FETCH TEST: Possible causes: Service Worker, WebContainer proxy, or routing issue`);
        return; // Exit early if HTML is received
      } else {
        console.log(`✅ DIRECT FETCH TEST: CLIENT RECEIVED VALID CSV DATA`);
        console.log(`✅ DIRECT FETCH TEST: CSV length: ${responseText.length} characters`);
      }
    } catch (directError) {
      console.error(`❌ EXPORT DEBUG: Direct fetch failed:`, directError);
      return; // Exit early if fetch fails
    }
    
    // Only proceed if we have valid responseText
    if (!responseText) {
      console.error(`❌ EXPORT DEBUG: No response text available for download`);
      return;
    }
    
    // Trigger download using the CSV data we fetched
    const blob = new Blob([responseText], { type: format === 'csv' ? 'text/csv' : 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.${format}`;
    console.log(`💾 EXPORT DEBUG: Creating download link with blob data`);
    console.log(`💾 EXPORT DEBUG: Download filename:`, link.download);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success notification
    showNotification(`${format.toUpperCase()} export completed successfully!`, 'success');
    
  } catch (error) {
    console.error('Export error:', error);
    showNotification(`Export failed: ${error.message}`, 'error');
  } finally {
    // Hide loading state
    downloadBtn.classList.remove('loading');
    const btnText = downloadBtn.querySelector('.btn-text');
    const btnLoading = downloadBtn.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'flex';
    if (btnLoading) btnLoading.style.display = 'none';
    
    // Close dropdown
    isExportDropdownOpen = false;
    if (exportDropdown) exportDropdown.style.display = 'none';
  }
}

function saveCurrentConversation() {
  if (!chatMessages || !currentEmployee) return;
  
  // Save current conversation state with employee-specific thread
  conversationHistory[currentEmployee] = {
    threadId: currentThreadId, // This thread belongs to the current employee
    messages: chatMessages.innerHTML,
    timestamp: Date.now()
  };
  
  console.log(`💾 Saved conversation for ${employees[currentEmployee]?.name}:`, {
    employee: currentEmployee,
    threadId: currentThreadId,
    messageCount: chatMessages.children.length
  });
}

function loadConversation(employeeId) {
  if (!chatMessages) return;
  
  const savedConversation = conversationHistory[employeeId];
  
  if (savedConversation && savedConversation.messages) {
    // Restore saved conversation with employee-specific thread
    chatMessages.innerHTML = savedConversation.messages;
    currentThreadId = savedConversation.threadId; // Use the thread that belongs to this employee
    
    // Re-attach event listeners to any interactive elements
    reattachEventListeners();
    
    scrollToBottom();
    
    console.log(`📂 Loaded conversation for ${employees[employeeId]?.name}:`, {
      employee: employeeId,
      threadId: currentThreadId,
      messageCount: chatMessages.children.length
    });
  } else {
    // Show welcome message for new conversation
    clearChatMessages();
    showWelcomeMessage(employees[employeeId]);
    currentThreadId = null; // No thread yet for this employee
    
    console.log(`🆕 New conversation for ${employees[employeeId]?.name}:`, {
      employee: employeeId,
      threadId: currentThreadId
    });
  }
}

function reattachEventListeners() {
  console.log('🔗 Reattaching event listeners for chat elements...');
  
  // Re-attach event listeners for HTML preview buttons using data-action attributes
  const actionButtons = chatMessages.querySelectorAll('[data-action]');
  actionButtons.forEach(btn => {
    const action = btn.getAttribute('data-action');
    const content = btn.getAttribute('data-content');
    
    // Remove any existing listeners to prevent duplicates
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = chatMessages.querySelector(`[data-action="${action}"][data-content="${content}"]`) || 
                   chatMessages.querySelector(`[data-action="${action}"]`);
    
    if (newBtn) {
      switch (action) {
        case 'toggleHtmlView':
          newBtn.addEventListener('click', () => toggleHtmlView(newBtn));
          break;
        case 'copyToClipboard':
          if (content) {
            newBtn.addEventListener('click', () => copyToClipboard(newBtn, decodeURIComponent(content)));
          }
          break;
        case 'downloadHtml':
          if (content) {
            newBtn.addEventListener('click', () => downloadHtml(decodeURIComponent(content)));
          }
          break;
      }
    }
  });
}

function switchEmployee(employeeId) {
  // Save current conversation before switching (with current employee's thread)
  if (currentEmployee && currentEmployee !== employeeId) {
    saveCurrentConversation();
    console.log(`🔄 Switching from ${employees[currentEmployee]?.name} to ${employees[employeeId]?.name}`);
  }
  
  // Update current employee
  const previousEmployee = currentEmployee;
  currentEmployee = employeeId;
  
  const employee = employees[employeeId];
  if (!employee) return;
  
  // Update header information
  const avatarImg = document.getElementById('current-employee-avatar');
  const nameEl = document.getElementById('current-employee-name');
  const roleEl = document.getElementById('current-employee-role');
  const specialtyEl = document.getElementById('current-employee-specialty');
  const descriptionEl = document.getElementById('employee-description');
  const newChatBtn = document.getElementById('newChatBtn');
  
  // Use profile picture URL if available, otherwise fall back to default avatar
  const avatarUrl = employee.profile_picture_url || employee.avatar;
  if (avatarImg) avatarImg.src = avatarUrl;
  
  if (nameEl) nameEl.textContent = employee.name;
  if (roleEl) roleEl.textContent = employee.role;
  if (specialtyEl) specialtyEl.textContent = employee.specialty;
  if (descriptionEl) descriptionEl.textContent = employee.description;
  if (newChatBtn) newChatBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      <path d="M12 7v6m3-3H9"></path>
    </svg>
    New Chat with ${employee.name}
  `;
  
  // Update quick actions
  updateQuickActions(employee.quickActions);
  
  // Load conversation for this employee (with their own thread)
  loadConversation(employeeId);
  
  console.log(`✅ Successfully switched to ${employee.name} (${employeeId})`);
}

function updateQuickActions(quickActions) {
  const quickActionsContainer = document.querySelector('.quick-actions');
  if (!quickActionsContainer) return;
  
  quickActionsContainer.innerHTML = '';
  
  quickActions.forEach(action => {
    const actionEl = document.createElement('div');
    actionEl.className = 'quick-action';
    actionEl.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
      <span>${action.icon} ${action.text}</span>
    `;
    
    actionEl.addEventListener('click', () => {
      if (messageInput) {
        messageInput.value = action.action;
        messageInput.focus();
        updateCharacterCount();
      }
    });
    
    quickActionsContainer.appendChild(actionEl);
  });
}

function clearChatMessages() {
  if (chatMessages) {
    chatMessages.innerHTML = '';
  }
}

function showWelcomeMessage(employee) {
  if (!chatMessages) return;
  
  const welcomeEl = document.createElement('div');
  welcomeEl.className = 'welcome-message';
  welcomeEl.innerHTML = `
    <div class="welcome-avatar">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>
    <div class="welcome-content">
      <h4>Hi! I'm ${employee.name}, your ${employee.specialty}.</h4>
      <p>Ask me to help with ${employee.role === 'lead scraper' ? 'lead generation and research' : employee.role === 'page operator' ? 'landing page design and marketing' : 'voice outreach and customer engagement'} or use the quick actions above.</p>
    </div>
  `;
  
  chatMessages.appendChild(welcomeEl);
  scrollToBottom();
}

function startNewChat() {
  console.log(`🗑️ Starting new chat with ${employees[currentEmployee]?.name} - clearing conversation history`);
  
  // Clear current conversation from memory for this employee only
  if (currentEmployee) {
    delete conversationHistory[currentEmployee];
  }
  
  // Reset thread and UI for current employee
    const currentConfig = employeeConfig && employeeConfig[currentEmployee];
    
    if (!currentConfig || !currentConfig.assistantId) {
        console.error('Employee configuration not found for:', currentEmployee);
        displayMessage('System', 'Error: Employee configuration not available. Please refresh the page.', 'error');
        return;
    }
  currentThreadId = null;
  clearChatMessages();
  showWelcomeMessage(employees[currentEmployee]);
  
  if (messageInput) {
    messageInput.value = '';
    messageInput.focus();
    updateCharacterCount();
  }
  
  console.log(`✅ New chat started with ${employees[currentEmployee]?.name}`);
}

async function handleChatSubmit(e) {
  e.preventDefault();
  
  if (isProcessing || !messageInput || !messageInput.value.trim()) {
    return;
  }
  
  const message = messageInput.value.trim();
  
  console.log(`💬 Sending message to ${employees[currentEmployee]?.name}:`, {
    employee: currentEmployee,
    threadId: currentThreadId,
    messageLength: message.length
  });
  
  // Add user message to chat
  addMessage(message, 'user');
  
  // Clear input and update UI
  messageInput.value = '';
  updateCharacterCount();
  setProcessingState(true);
  
  // Show typing indicator
  const typingIndicator = showTypingIndicator();
  
  try {
    const requestBody = {
      message: message,
      employee: currentEmployee, // Ensure we're sending to the correct employee
      thread_id: currentThreadId // Use employee-specific thread (or null for new thread)
    };
    
    console.log(`📤 API Request:`, requestBody);
    
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    console.log(`📥 API Response:`, {
      status: response.status,
      ok: response.ok,
      data: data
    });
    
    // Remove typing indicator
    if (typingIndicator) {
      typingIndicator.remove();
    }
    
    if (!response.ok) {
      throw new Error(data.details || data.error || 'Request failed');
    }
    
    // Update thread ID for this employee
    if (data.thread_id) {
      currentThreadId = data.thread_id;
      console.log(`🧵 Thread updated for ${employees[currentEmployee]?.name}: ${currentThreadId}`);
    }
    
    if (data.status === 'completed') {
      // Show assistant response
      addMessage(data.message, 'assistant');
    } else if (data.status === 'requires_action') {
      // Show tool calls status
      addMessage(`I'm working on your request using external tools. This may take a moment...`, 'assistant');
      
      // Start polling for completion
      pollForCompletion(data.thread_id, data.run_id);
    } else {
      addMessage(`Request status: ${data.status}`, 'assistant');
    }
    
  } catch (error) {
    console.error('Chat error:', error);
    
    // Remove typing indicator
    if (typingIndicator) {
      typingIndicator.remove();
    }
    
    addMessage(`Sorry, I encountered an error: ${error.message}`, 'assistant', true);
  } finally {
    setProcessingState(false);
  }
}

async function pollForCompletion(threadId, runId, maxAttempts = 60) {
  let attempts = 0;
  
  console.log(`🔄 Starting polling for ${employees[currentEmployee]?.name}:`, {
    threadId,
    runId,
    employee: currentEmployee
  });
  
  const poll = async () => {
    try {
      attempts++;
      
      const response = await fetch(`/api/run-status?thread_id=${threadId}&run_id=${runId}&employee_id=${currentEmployee}`);
      const data = await response.json();
      
      console.log(`📊 Poll attempt ${attempts}/${maxAttempts} for ${employees[currentEmployee]?.name}:`, {
        status: data.status,
        employee: data.employee_id,
        threadId: data.thread_id
      });
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Status check failed');
      }
      
      if (data.status === 'completed') {
        addMessage(data.message, 'assistant');
        
        // Check if leads were processed and refresh leads page if needed
        if (data.lead_processing && data.lead_processing.detected && data.lead_processing.processed) {
          console.log(`🎯 Leads detected and processed: ${data.lead_processing.count} leads`);
          
          // Show notification about lead processing
          showNotification(
            `${employees[currentEmployee]?.name} found and processed ${data.lead_processing.count} new leads!`,
            'success'
          );
          
        // Auto-refresh leads page if user is currently viewing it
const leadsSection = document.getElementById('leads-section');
if (leadsSection && leadsSection.classList.contains('active')) {
  console.log('📊 Auto-refreshing leads page...');
  await loadLeadsData({
    employee: currentEmployee,
    assistantId: currentConfig.assistantId
  });
}
          
          // Update dashboard metrics
          await loadDashboardMetrics();
        }
        
        console.log(`✅ Task completed for ${employees[currentEmployee]?.name}`);
        return;
      } else if (data.status === 'failed') {
        addMessage(`Task failed: ${data.error || 'Unknown error'}`, 'assistant', true);
        console.error(`❌ Task failed for ${employees[currentEmployee]?.name}:`, data.error);
        return;
      } else if (attempts >= maxAttempts) {
        addMessage('Analyzing the retrieved leads. Hang on a second...', 'assistant', true);
        console.warn(`⏰ Polling timeout for ${employees[currentEmployee]?.name}`);
        return;
      }
      
      // Continue polling
      setTimeout(poll, 2000);
      
    } catch (error) {
      console.error('Polling error:', error);
      addMessage(`Error checking task status: ${error.message}`, 'assistant', true);
    }
  };
  
  // Start polling after a short delay
  setTimeout(poll, 2000);
}

function addMessage(content, role, isError = false) {
  if (!chatMessages) return;
  
  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;
  
  if (isError) {
    messageEl.classList.add('error');
  }
  
  // Create message avatar
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  if (role === 'user') {
    avatar.textContent = 'U';
    avatar.title = 'You';
  } else {
    const emp = currentEmployee || 'brenden';
    avatar.textContent = emp.charAt(0).toUpperCase();
    avatar.title = currentEmployee ? getEmployeeName(emp) : 'AI Assistant';
  }

  // Create message bubble container
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  // Create message header
  const header = document.createElement('div');
  header.className = 'message-header';

  const sender = document.createElement('span');
  sender.className = 'message-sender';
  sender.textContent = role === 'user' ? 'You' : (currentEmployee ? getEmployeeName(currentEmployee) : 'AI Assistant');

  const timestamp = document.createElement('span');
  timestamp.className = 'message-time';
  timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  header.appendChild(sender);
  header.appendChild(timestamp);

  // Create message content with better formatting
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  // Format content with proper HTML rendering for AI responses
  if (role !== 'user' && typeof content === 'string') {
    // Convert basic markdown-like formatting to HTML
    let formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraphs if not already formatted
    if (!formattedContent.includes('<p>')) {
      formattedContent = '<p>' + formattedContent + '</p>';
    }
    
    messageContent.innerHTML = formattedContent;
  } else {
    messageContent.textContent = content;
  }

  // Handle special message types
  if (isError) {
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-message';
    
    const icon = document.createElement('div');
    icon.className = `status-icon error`;
    icon.textContent = '✕';
    
    statusDiv.appendChild(icon);
    statusDiv.appendChild(document.createTextNode(content));
    messageContent.innerHTML = '';
    messageContent.appendChild(statusDiv);
  }

  bubble.appendChild(header);
  bubble.appendChild(messageContent);

  messageEl.appendChild(avatar);
  messageEl.appendChild(bubble);
  
  chatMessages.appendChild(messageEl);
  scrollToBottom();
}

// Helper function to get employee display name
function getEmployeeName(employeeId) {
  const names = {
    'brenden': 'AI Brenden',
    'van': 'AI Van', 
    'Rey': 'AI Rey',
    'angel': 'AI Angel'
  };
  return names[employeeId] || 'AI Assistant';
}

function createHtmlPreview(htmlContent) {
  const container = document.createElement('div');
  container.className = 'html-preview';
  
  const header = document.createElement('div');
  header.className = 'code-header';
  header.innerHTML = `
    <span class="code-type">Landing Page HTML</span>
    <button class="view-full-btn" onclick="toggleHtmlView(this)">View Full Code</button>
  `;
  
  const preview = document.createElement('div');
  preview.className = 'code-preview';
  preview.innerHTML = `<code>${escapeHtml(htmlContent.substring(0, 500))}${htmlContent.length > 500 ? '...' : ''}</code>`;
  
  const fullCode = document.createElement('div');
  fullCode.className = 'code-full';
  fullCode.style.display = 'none';
  fullCode.innerHTML = `<pre><code>${escapeHtml(htmlContent)}</code></pre>`;
  
  const actions = document.createElement('div');
  actions.className = 'code-actions';
  
  // Store content in data attributes for event handlers
  const escapedContent = escapeHtml(htmlContent).replace(/'/g, "\\'");
  actions.innerHTML = `
    <button class="copy-btn" data-content="${escapedContent}" onclick="copyToClipboard(this, this.getAttribute('data-content'))">Copy Code</button>
    <button class="download-btn" data-content="${escapedContent}" onclick="downloadHtml(this.getAttribute('data-content'))">Download HTML</button>
  `;
  
  container.appendChild(header);
  container.appendChild(preview);
  container.appendChild(fullCode);
  container.appendChild(actions);
  
  return container;
}

function toggleHtmlView(button) {
  const container = button.closest('.html-preview');
  const isExpanded = container.classList.contains('expanded');
  
  if (isExpanded) {
    container.classList.remove('expanded');
    button.textContent = 'View Full Code';
  } else {
    container.classList.add('expanded');
    button.textContent = 'Hide Full Code';
  }
}

function copyToClipboard(button, content) {
  // Unescape the content
  const unescapedContent = content.replace(/\\'/g, "'");
  
  navigator.clipboard.writeText(unescapedContent).then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    button.textContent = 'Copy Failed';
    setTimeout(() => {
      button.textContent = 'Copy Code';
    }, 2000);
  });
}

function downloadHtml(content) {
  // Unescape the content
  const unescapedContent = content.replace(/\\'/g, "'");
  
  const blob = new Blob([unescapedContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'landing-page.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showTypingIndicator() {
  if (!chatMessages) return null;
  
  const typingEl = document.createElement('div');
  typingEl.className = 'message assistant';
  typingEl.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  chatMessages.appendChild(typingEl);
  scrollToBottom();
  
  return typingEl;
}

function setProcessingState(processing) {
  isProcessing = processing;
  
  if (sendButton) {
    sendButton.disabled = processing;
  }
  
  if (messageInput) {
    messageInput.disabled = processing;
  }
}

function updateCharacterCount() {
  if (!messageInput || !charCount) return;
  
  const length = messageInput.value.length;
  const maxLength = 4000;
  
  charCount.textContent = length;
  
  if (length > maxLength * 0.9) {
    charCount.classList.add('warning');
  } else {
    charCount.classList.remove('warning');
  }
  
  if (length >= maxLength) {
    charCount.classList.add('error');
  } else {
    charCount.classList.remove('error');
  }
}

function autoResizeTextarea() {
  if (!messageInput) return;
  
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function saveColorScheme() {
  const primaryColor = document.getElementById('primaryInput')?.value || '#EC4899';
  const secondaryColor = document.getElementById('secondaryInput')?.value || '#64748B';
  const accentColor = document.getElementById('accentInput')?.value || '#F97316';
  
  // Update CSS custom properties
  document.documentElement.style.setProperty('--primary-color', primaryColor);
  document.documentElement.style.setProperty('--secondary-color', secondaryColor);
  document.documentElement.style.setProperty('--accent-color', accentColor);
  
  // Save to localStorage
  localStorage.setItem('orchid-colors', JSON.stringify({
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor
  }));
  
  // Show notification
  showNotification('Color scheme saved successfully!', 'success');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Add appropriate icon based on type
  let icon = '';
  switch (type) {
    case 'success':
      icon = '✅';
      break;
    case 'error':
      icon = '❌';
      break;
    case 'warning':
      icon = '⚠️';
      break;
    default:
      icon = 'ℹ️';
  }
  
  notification.innerHTML = `
    <div class="notification-content">
      <span>${icon} ${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
  
  console.log(`📢 Notification shown: ${type} - ${message}`);
}

async function loadDashboardMetrics() {
  try {
    console.log('📈 Loading dashboard metrics...');
    const response = await fetch('/api/leads/statistics');
    const stats = await response.json();
    
    if (response.ok) {
      // Update dashboard metrics
      const leadsGenerated = document.getElementById('leads-generated');
      const leadsValidated = document.getElementById('leads-validated');
      const leadsContacted = document.getElementById('leads-contacted');
      const leadsConverted = document.getElementById('leads-converted');
      
      if (leadsGenerated) leadsGenerated.textContent = stats.total || 0;
      if (leadsValidated) leadsValidated.textContent = stats.validated || 0;
      if (leadsContacted) leadsContacted.textContent = stats.outreach_sent || 0;
      if (leadsConverted) leadsConverted.textContent = stats.converted || 0;
      
      console.log(`✅ Updated dashboard metrics: ${stats.total || 0} total leads`);
    } else {
      console.error('Failed to load dashboard metrics:', stats);
    }
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
  }
}

async function loadLeadsData() {
  try {
    console.log('📊 Loading leads data...');
    const response = await fetch('/api/leads?limit=100');
    const data = await response.json();
    
    if (response.ok) {
      displayLeadsTable(data.leads || []);
      updateLeadsPagination(data);
      console.log(`✅ Loaded ${data.leads?.length || 0} leads`);
    } else {
      console.error('Failed to load leads:', data);
      showNotification('Failed to load leads data', 'error');
    }
  } catch (error) {
    console.error('Failed to load leads data:', error);
    showNotification('Error loading leads data', 'error');
  }
}

function displayLeadsTable(leads) {
  const leadsTable = document.querySelector('.leads-table');
  const downloadBtn = document.getElementById('downloadLeadsBtn');
  
  if (!leadsTable) return;
  
  // Clear existing table content
  leadsTable.innerHTML = '';
  
  // Create table header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Source Platform</th>
      <th>Business</th>
      <th>Contact</th>
      <th>Location</th>
      <th>Score</th>
      <th>Status</th>
    </tr>
  `;
  leadsTable.appendChild(thead);
  
  // Create table body
  const tableBody = document.createElement('tbody');
  
  if (leads.length === 0) {
    // Hide download button when no leads
    if (downloadBtn) {
      downloadBtn.style.display = 'none';
    }
    
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #64748b;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5;">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            </svg>
            <div>
              <h4 style="margin: 0 0 8px 0; color: #374151;">No leads found yet</h4>
              <p style="margin: 0; font-size: 14px;">Ask ${employees[currentEmployee]?.name || 'AI Brenden'} to generate some leads for you!</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">Try: "Find florists in Los Angeles" or "Research wedding vendors"</p>
            </div>
            <div class="team-member" data-employee-id="xavier">
                <div class="member-avatar">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" alt="AI Xavier">
                    <div class="status-indicator online"></div>
                </div>
                <div class="member-info">
                    <div class="member-name">AI Xavier</div>
                    <div class="member-role">Content Specialist</div>
                    <div class="member-tags">
                        <span class="tag content">Content</span>
                        <span class="tag marketing">Marketing</span>
                    </div>
                </div>
                <div class="member-stats">
                    <span class="notification-badge">2</span>
                </div>
            </div>
          </div>
        </td>
      </tr>
    `;
    
    // SURGICAL FIX: Ensure Xavier's team member has correct data attribute
    const xavierMember = document.querySelector('.team-member[data-employee-id="xavier"]');
    if (!xavierMember) {
      console.error('🚨 SURGICAL ERROR: Xavier team member not found with data-employee-id="xavier"');
      // Find Xavier by content and fix the attribute
      const allMembers = document.querySelectorAll('.team-member');
      allMembers.forEach(member => {
        if (member.textContent.includes('AI Xavier')) {
          console.log('🔧 SURGICAL FIX: Adding data-employee-id to Xavier element');
          member.setAttribute('data-employee-id', 'xavier');
        }
      });
    }
    
    // Add event listeners to team members
    document.querySelectorAll('.team-member').forEach(member => {
      member.addEventListener('click', () => {
        console.log('🔍 SURGICAL DEBUG: Team member clicked:', member);
        console.log('🔍 SURGICAL DEBUG: data-employee-id:', member.dataset.employeeId);
        const employeeId = member.dataset.employeeId;
        console.log('🔍 SURGICAL DEBUG: Extracted employeeId:', employeeId);
        console.log('🔍 SURGICAL DEBUG: Available employees:', Object.keys(employees));
        if (employeeId && employees[employeeId]) {
          selectEmployee(employeeId);
        }
      });
    });
    
    leadsTable.appendChild(tableBody);
    return;
  }
  
  // Show download button when leads exist
  if (downloadBtn) {
    downloadBtn.style.display = 'flex';
  }
  
  console.log(`📋 Displaying ${leads.length} leads in table`);
  
  leads.forEach(lead => {
    const row = document.createElement('tr');
    
    // Add a subtle animation for new leads
    const isRecent = new Date(lead.created_at) > new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
    if (isRecent) {
      row.style.animation = 'fadeInHighlight 2s ease-out';
      row.classList.add('new-lead-row');
    }
    
    row.innerHTML = `
      <td>
        <div class="source-info">
          <strong>${lead.source_platform || 'Unknown'}</strong>
        </div>
      </td>
      <td>
        <div class="business-info">
          <strong>${lead.business_name}</strong>
          <small>${lead.industry || 'Unknown Industry'}${isRecent ? ' <span class="new-lead-badge">• NEW</span>' : ''}</small>
        </div>
      </td>
      <td>
        <div class="contact-info">
          <strong>${lead.contact_name || 'No contact'}</strong>
          <small>${lead.email || 'No Email'}</small>
          <small>${lead.phone || 'No Phone'}</small>
        </div>
      </td>
      <td>
        <div class="location-info">
          <strong>${lead.city || 'Unknown'}, ${lead.state || 'Unknown'}</strong>
          <small>${lead.address || ''}</small>
        </div>
      </td>
      <td>
        <span class="score ${getScoreClass(lead.score)}">${(lead.score || 0).toFixed(1)}</span>
      </td>
      <td>
        <span class="status ${getLeadStatus(lead)}">${getLeadStatusText(lead)}</span>
      </td>
    `;
    tableBody.appendChild(row);
  });
  
  leadsTable.appendChild(tableBody);
}

function getScoreClass(score) {
  if (score >= 4) return 'high';
  if (score >= 2.5) return 'medium';
  return 'low';
}

function getLeadStatus(lead) {
  if (lead.converted) return 'converted';
  if (lead.response_received) return 'responded';
  if (lead.outreach_sent) return 'contacted';
  if (lead.validated) return 'qualified';
  return 'new';
}

function getLeadStatusText(lead) {
  if (lead.converted) return 'Converted';
  if (lead.response_received) return 'Responded';
  if (lead.outreach_sent) return 'Contacted';
  if (lead.validated) return 'Qualified';
  return 'New';
}

function updateLeadsPagination(data) {
  const paginationInfo = document.querySelector('.pagination-info');
  const pageNumbers = document.querySelector('.page-numbers');
  
  if (paginationInfo) {
    const start = ((data.page || 1) - 1) * (data.limit || 50) + 1;
    const end = Math.min(start + (data.leads?.length || 0) - 1, data.total || 0);
    paginationInfo.textContent = `Showing ${start}-${end} of ${data.total || 0} leads`;
  }
  
  if (pageNumbers) {
    pageNumbers.innerHTML = '';
    const totalPages = data.totalPages || 1;
    const currentPage = data.page || 1;
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.onclick = () => loadLeadsPage(i);
      pageNumbers.appendChild(pageBtn);
    }
  }
}

async function loadLeadsPage(page) {
  try {
    const response = await fetch(`/api/leads?page=${page}&limit=50`);
    const data = await response.json();
    
    if (response.ok) {
      displayLeadsTable(data.leads || []);
      updateLeadsPagination(data);
    }
  } catch (error) {
    console.error('Failed to load leads page:', error);
  }
}

function viewLead(leadId) {
  // TODO: Implement lead detail view
  console.log('View lead:', leadId);
}

function editLead(leadId) {
  // TODO: Implement lead editing
  console.log('Edit lead:', leadId);
}

function renderTeamMembers() {
  console.log('🔧 SURGICAL: renderTeamMembers called');
  console.log('🔧 SURGICAL: Available employees:', Object.keys(employees));
  
  const teamSection = document.querySelector('.team-members');
  if (!teamSection) return;
  
  // SURGICAL FIX: Build team members dynamically from employees object
  let teamHTML = '';
  
  Object.entries(employees).forEach(([employeeId, employee]) => {
    const isActive = employeeId === 'brenden' ? 'active' : '';
    const badgeCount = employeeId === 'brenden' ? '5' : employeeId === 'van' ? '3' : '2';
    
    teamHTML += `
      <div class="team-member ${isActive}" data-employee-id="${employeeId}">
        <div class="member-avatar">
          <img src="${employee.avatar}" alt="${employee.name}">
          <div class="status-indicator online"></div>
        </div>
        <div class="member-info">
          <div class="member-name">${employee.name}</div>
          <div class="member-role">${employee.role}</div>
          <div class="member-tags">
            ${employee.tags.map(tag => `<span class="tag ${tag.toLowerCase()}">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="member-stats">
          <div class="notification-badge">${badgeCount}</div>
        </div>
      </div>
    `;
  });
  
  teamSection.innerHTML = teamHTML;
  
  console.log('🔧 SURGICAL: Team members HTML generated');
  console.log('🔧 SURGICAL: Found team member elements:', document.querySelectorAll('.team-member').length);
  
  // SURGICAL VERIFICATION: Check each team member's data attribute
  document.querySelectorAll('.team-member').forEach((member, index) => {
    const employeeId = member.dataset.employeeId;
    console.log(`🔧 SURGICAL: Team member ${index}: data-employee-id="${employeeId}"`);
  });
  
  // Create chat interfaces for all employees
  Object.values(employees).forEach(employee => {
    createChatInterface(employee);
  });

  // Create chat interface for an employee
  function createChatInterface(employee) {
    const chatInterface = document.querySelector('.chat-interface');
    if (!chatInterface) {
      console.error('Chat interface container not found');
      return;
    }

    // Check if chat container already exists for this employee
    let chatContainer = document.getElementById(`chat-${employee.id}`);
    if (chatContainer) {
      return; // Already exists
    }

    // Create chat container for this employee
    chatContainer = document.createElement('div');
    chatContainer.id = `chat-${employee.id}`;
    chatContainer.className = 'employee-chat-container';
    chatContainer.style.display = 'none';
    
    chatContainer.innerHTML = `
      <div class="chat-messages" id="messages-${employee.id}">
        <div class="welcome-message">
          <div class="welcome-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="welcome-content">
            <h4>Welcome to ${employee.name}</h4>
            <p>${employee.description}</p>
          </div>
        </div>
      </div>
      <div class="chat-input-container">
        <form class="chat-form" id="chat-form-${employee.id}">
          <div class="input-wrapper">
            <textarea id="messageInput-${employee.id}" placeholder="Ask ${employee.name} anything..." rows="1"></textarea>
            <button type="submit" class="send-button" id="send-button-${employee.id}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="character-count" id="char-count-${employee.id}">0/4000</div>
        </form>
      </div>
    `;

    // Find the chat-content container and append
    const chatContent = chatInterface.querySelector('.chat-content');
    if (chatContent) {
      chatContent.appendChild(chatContainer);
    } else {
      chatInterface.appendChild(chatContainer);
    }

    // Setup event listeners for this employee's chat
    setupChatEventListeners(employee);
  }

  // Setup chat interface for the active employee;
  function setupChatInterface() {
    const messageInput = document.getElementById('messageInput');
    const chatForm = document.getElementById('chatForm');
    const sendButton = document.getElementById('sendButton');

    if (!messageInput || !chatForm || !sendButton) {
      console.error('Chat interface elements not found');
      return;
    }

    // Character count and validation
    messageInput.addEventListener('input', () => {
      const length = messageInput.value.length;
      const charCount = document.getElementById('charCount');
      if (charCount) {
        charCount.textContent = `${length}/4000`;
        charCount.classList.toggle('warning', length > 3500);
        charCount.classList.toggle('error', length > 4000);
      }
      sendButton.disabled = length === 0 || length > 4000;
    });

    // Handle send button click;
    document.getElementById('sendButton').addEventListener('click', (e) => {
      e.preventDefault();
      const message = messageInput.value.trim();
      if (message && currentEmployee) {
        sendMessage(message);
        messageInput.value = '';
        sendButton.disabled = true;
      }
    });

    // Handle Enter key
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
      }
    });
  }

  // Setup event listeners for a specific employee's chat
  function setupChatEventListeners(employee) {
    const form = document.getElementById(`chat-form-${employee.id}`);
    const input = document.getElementById(`messageInput-${employee.id}`);
    const charCount = document.getElementById(`char-count-${employee.id}`);
    const sendButton = document.getElementById(`send-button-${employee.id}`);

    if (!form || !input || !charCount || !sendButton) {
      console.error(`Failed to find chat elements for ${employee.id}`);
      return;
    }

    // Character count
    input.addEventListener('input', () => {
      const length = input.value.length;
      charCount.textContent = `${length}/4000`;
      charCount.classList.toggle('warning', length > 3500);
      charCount.classList.toggle('error', length > 4000);
      sendButton.disabled = length === 0 || length > 4000;
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const message = input.value.trim();
      if (!message || currentEmployee?.id !== employee.id) return;
      
      await sendMessage(message);
      input.value = '';
      input.style.height = 'auto';
      charCount.textContent = '0/4000';
      sendButton.disabled = true;
    });

    // Enter key handling
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    });
  }
}

function attachTeamMemberListeners() {
  console.log('🔧 SURGICAL: attachTeamMemberListeners called');
  
  // Add event listeners to team members
  document.querySelectorAll('.team-member').forEach(member => {
    const employeeId = member.dataset.employeeId;
    console.log(`🔧 SURGICAL: Attaching listener to team member: ${employeeId}`);
    
    member.addEventListener('click', () => {
      console.log('🚨 SURGICAL CLICK: Team member clicked');
      console.log('🚨 SURGICAL CLICK: data-employee-id:', member.dataset.employeeId);
      console.log('🚨 SURGICAL CLICK: Available employees:', Object.keys(employees));
      console.log('🚨 SURGICAL CLICK: Employee exists?', !!employees[employeeId]);
      
      if (employeeId && employees[employeeId]) {
        console.log('🚨 SURGICAL CLICK: Calling selectEmployee with:', employeeId);
        selectEmployee(employeeId);
      } else {
        console.error('🚨 SURGICAL ERROR: Employee not found:', employeeId);
      }
    });
  });
}

function renderMainContent() {
  renderTeamMembers();
  attachTeamMemberListeners();
}

function selectEmployee(employeeId) {
  console.log('🎯 SURGICAL SELECT: selectEmployee called with:', employeeId);
  console.log('🎯 SURGICAL SELECT: Current employee:', currentEmployee);
  console.log('🎯 SURGICAL SELECT: Employee exists?', !!employees[employeeId]);
  
  if (!employees[employeeId]) {
    console.error('🚨 SURGICAL ERROR: Employee not found in selectEmployee:', employeeId);
    console.error('🚨 SURGICAL ERROR: Available employees:', Object.keys(employees));
    return;
  }
  
  const selectedEmployee = employees[employeeId];
  console.log('🎯 SURGICAL SELECT: Selected employee object:', selectedEmployee);

  // Save current conversation before switching
  if (currentEmployee && currentConversation) {
    conversationHistory[currentEmployee] = currentConversation;
  }

  // Update current employee
  console.log('🔄 CRITICAL: Setting currentEmployee from', currentEmployee, 'to', employeeId);
  currentEmployee = employeeId;
  console.log('🔄 CRITICAL: currentEmployee is now:', currentEmployee);

  // Load or create conversation for new employee
  loadConversationForEmployee(employeeId);

  // Update active team member visual state
  document.querySelectorAll('.team-member').forEach(member => {
    member.classList.remove('active');
    const memberEmployeeId = member.dataset.employeeId;
    if (memberEmployeeId === employeeId) {
      member.classList.add('active');
      console.log('🎯 VISUAL UPDATE: Set active class for', employeeId);
    }
  });

  // Update chat header with employee details
  updateChatHeader(selectedEmployee);
  updateQuickActions(selectedEmployee.quickActions || []);
  updateChatTabs(selectedEmployee);
  updateChatContent(selectedEmployee);

  console.log('🎯 FINAL CHECK: currentEmployee after selectEmployee:', currentEmployee);
  console.log('🎯 FINAL CHECK: Selected employee name:', selectedEmployee.name);
  console.log(`✅ Successfully switched to ${selectedEmployee.name} (${employeeId})`);
}

function switchToEmployeeChat(employeeId) {
    console.log(`🔄 Attempting to switch to employee: ${employeeId}`);
    
    // Debug: Check if employee exists in our array
    const employee = Object.values(employees).find(emp => emp.id === employeeId);
    if (!employee) {
        console.error(`❌ Employee not found in employees array: ${employeeId}`);
        console.log('Available employees:', Object.keys(employees));
        return;
    }
    
    console.log(`✅ Found employee:`, employee);
    
    // Validate employee ID
    const validEmployees = Object.keys(employees);
    if (!validEmployees.includes(employeeId)) {
        console.error(`❌ Invalid employee ID: ${employeeId}`);
        console.log('Valid employees:', validEmployees);
        return;
    }
}

async function sendMessage(message) {
  console.log('📤 Sending message...');
  console.log('📤 CRITICAL: About to send message with activeEmployeeId:', activeEmployeeId);
  console.log('📤 CRITICAL: Message content:', message);
  console.log('📤 CRITICAL: Thread ID for this employee:', conversationThreads[activeEmployeeId]);
  
  if (pendingMessages[activeEmployeeId]) {
    console.warn('⚠️ Message already pending for', activeEmployeeId, ', skipping');
    return;
  }
  
  const currentEmployeeId = activeEmployeeId; // Store at start to avoid race conditions
  pendingMessages[currentEmployeeId] = true;

  if (!message.trim()) {
    pendingMessages[currentEmployeeId] = false;
    return;
  }

  // Clear input and disable send button
  const messageInput = document.getElementById('messageInput');
  updateSendButton();
  if (messageInput) messageInput.value = '';
  if (sendButton) sendButton.disabled = true;

  try {
    // Add user message to chat immediately
    appendMessage(message, 'user', 'You');

    console.log('🚀 CRITICAL: Making API request with employee:', activeEmployeeId);
    
    // Prepare message data with current employee context
    const messageData = {
      message: message,
      employee: currentEmployeeId,
      thread_id: conversationThreads[currentEmployeeId] || null
    };
    
    console.log('🚀 CRITICAL: Full API payload:', messageData);

    // Send to backend
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 CRITICAL: API response received:', {
      status: data.status,
      employeeId: data.employee?.name || 'UNKNOWN',
      messagePreview: data.message?.substring(0, 100) + '...'
    });
    
    // Hide typing indicator as soon as we get a response
    hideTypingIndicator();

    // Store the thread ID for this employee
    if (data.thread_id) {
      conversationThreads[activeEmployeeId] = data.thread_id;
      console.log(`💾 Stored thread ID for ${activeEmployeeId}:`, data.thread_id);
    }
    if (data.thread_id && currentEmployeeId === activeEmployeeId) {
      conversationThreads[currentEmployeeId] = data.thread_id;
      console.log(`🧵 Thread ID stored for ${currentEmployeeId}:`, data.thread_id);
    }
    const employeeName = data.employee?.name || `AI ${currentEmployeeId}`;
    
    console.log('💬 CRITICAL: Adding response from:', employeeName);
    console.log('💬 CRITICAL: Expected employee was:', `AI ${currentEmployeeId}`);
    
    appendMessage(data.message, 'assistant', employeeName);

    if (data.status === 'requires_action') {
      console.log('⚠️ Assistant requires additional actions');
    }

  } catch (error) {
    console.error('❌ Error sending message:', error);
    hideTypingIndicator();
    
    // Always hide typing indicator on error
    hideTypingIndicator();
    
    appendMessage(`Sorry, there was an error: ${error.message}`, 'assistant', 'System');
  } finally {
    pendingMessages[currentEmployeeId] = false;
    updateSendButton();
  }
}

// Load saved color scheme on page load
document.addEventListener('DOMContentLoaded', function() {
  const savedColors = localStorage.getItem('orchid-colors');
  if (savedColors) {
    try {
      const colors = JSON.parse(savedColors);
      document.documentElement.style.setProperty('--primary-color', colors.primary);
      document.documentElement.style.setProperty('--secondary-color', colors.secondary);
      document.documentElement.style.setProperty('--accent-color', colors.accent);
      
      // Update form inputs
      const primaryInput = document.getElementById('primaryInput');
      const primaryPicker = document.getElementById('primaryPicker');
      const secondaryInput = document.getElementById('secondaryInput');
      const secondaryPicker = document.getElementById('secondaryPicker');
      const accentInput = document.getElementById('accentInput');
      const accentPicker = document.getElementById('accentPicker');
      
      if (primaryInput) primaryInput.value = colors.primary;
      if (primaryPicker) primaryPicker.value = colors.primary;
      if (secondaryInput) secondaryInput.value = colors.secondary;
      if (secondaryPicker) secondaryPicker.value = colors.secondary;
      if (accentInput) accentInput.value = colors.accent;
      if (accentPicker) accentPicker.value = colors.accent;
    } catch (error) {
      console.error('Failed to load saved colors:', error);
    }
  }
});

function updateSendButton() {
  const isPending = pendingMessages[activeEmployeeId];
  sendButton.disabled = isPending;
  sendButton.textContent = isPending ? 'Sending...' : 'Send';
  
  // Update placeholder to show current employee
  const currentEmployee = getCurrentEmployeeName();
  messageInput.placeholder = isPending ? 
    `Waiting for ${currentEmployee}...` : 
    `Message ${currentEmployee}...`;
}

function getCurrentEmployeeName() {
  const names = {
    'brenden': 'AI Brenden',
    'Rey': 'AI Rey',
    'van': 'AI Van'
  };
  return names[activeEmployeeId] || `AI ${activeEmployeeId}`;
}

function updateEmployeeHeader(employeeId) {
  const employeeNames = {
    'brenden': 'AI Brenden',
    'Rey': 'AI Rey',
    'Xavier': 'AI Xavier'
  };
  
  const employeeRoles = {
    'brenden': 'Lead Research Specialist',
    'Rey': 'Voice Outreach Manager',
    'Xavier': 'UGC Expert'
  };
  
  const employeeAvatars = {
    'brenden': 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'Rey': 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'Xavier': 'https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  };
  
  const nameElement = document.querySelector('.employee-details h3');
  const roleElement = document.querySelector('.role-tag');
  const avatarElement = document.querySelector('.employee-avatar img');
  
  if (nameElement) nameElement.textContent = employeeNames[employeeId] || 'Unknown Employee';
  if (roleElement) roleElement.textContent = employeeRoles[employeeId] || 'Unknown Role';
  if (avatarElement) avatarElement.src = employeeAvatars[employeeId] || '';
  
  console.log('Employee header updated for:', employeeId);
}