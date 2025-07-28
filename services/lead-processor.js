const SupabaseService = require('./supabase-client');

class LeadProcessor {
  constructor() {
    this.supabaseService = new SupabaseService();
  }

  /**
   * Process webhook response containing lead data
   */
  async processLeadData(webhookOutput, employeeId) {
    try {
      console.log('🔍 Processing lead data from webhook output...');
      console.log('🔍 DEBUG: processLeadData - Employee ID:', employeeId);
      console.log('🔍 DEBUG: processLeadData - Raw output preview:', webhookOutput.substring(0, 500) + '...');
      
      // Parse the JSON output from the webhook
      let leadsData;
      try {
        const parsed = JSON.parse(webhookOutput);
        console.log('🔍 DEBUG: processLeadData - Successfully parsed JSON, checking structure...');
        
        // Handle OpenAI tool output format: [{"index":0,"message":{"role":"assistant","content":{"leads":[...]}}}]
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstItem = parsed[0];
          
          // Check for nested OpenAI format
          if (firstItem.message && firstItem.message.content && firstItem.message.content.leads) {
            leadsData = firstItem.message.content.leads;
            console.log('🔍 DEBUG: processLeadData - Extracted leads from OpenAI nested format, count:', leadsData.length);
          }
          // Check for direct array format (fallback)
          else if (firstItem.title || firstItem.business_name || firstItem.name) {
            leadsData = parsed;
            console.log('🔍 DEBUG: processLeadData - Using direct array format, count:', leadsData.length);
          } else {
            console.log('🔍 DEBUG: processLeadData - First item keys:', Object.keys(firstItem));
            throw new Error('Unrecognized data structure in webhook output - no leads found in expected locations');
          }
        } else {
          console.log('🔍 DEBUG: processLeadData - Parsed data type:', typeof parsed);
          throw new Error('Expected array in webhook output, got: ' + typeof parsed);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse webhook output as JSON:', parseError);
        console.error('❌ Raw webhook output causing parse error:', webhookOutput.substring(0, 1000));
        throw new Error('Invalid JSON format in webhook response');
      }

      // Ensure we have an array of leads
      if (!Array.isArray(leadsData)) {
        console.error('❌ Extracted leads data is not an array:', typeof leadsData);
        throw new Error('Expected array of leads in webhook response');
      }

      if (leadsData.length === 0) {
        console.log('⚠️ No leads found in webhook response');
        return { success: true, leads: [], count: 0 };
      }

      console.log(`📊 Found ${leadsData.length} leads to process from employee: ${employeeId}`);
      console.log('🔍 DEBUG: processLeadData - First lead sample keys:', Object.keys(leadsData[0]));
      console.log('🔍 DEBUG: processLeadData - First lead sample data:', JSON.stringify(leadsData[0], null, 2));

      // DIAGNOSTIC: Check for email and phone fields in the first lead
      if (leadsData.length > 0) {
        const firstLead = leadsData[0];
        console.log('🔍 DIAGNOSTIC: Email/Phone Field Analysis:');
        console.log('   📧 Email field:', firstLead.email || 'NOT FOUND');
        console.log('   📞 Phone field:', firstLead.phone || 'NOT FOUND');
        console.log('   📞 Phone alternatives:');
        console.log('     - phoneUnformatted:', firstLead.phoneUnformatted || 'NOT FOUND');
        console.log('     - phone_number:', firstLead.phone_number || 'NOT FOUND');
        console.log('     - phoneNumber:', firstLead.phoneNumber || 'NOT FOUND');
        console.log('   🔍 All available fields containing "email":', Object.keys(firstLead).filter(key => key.toLowerCase().includes('email')));
        console.log('   🔍 All available fields containing "phone":', Object.keys(firstLead).filter(key => key.toLowerCase().includes('phone')));
        
        // Check for nested contact information
        if (firstLead.contact) {
          console.log('   🔍 Contact object found:', firstLead.contact);
        }
        if (firstLead.contactInfo) {
          console.log('   🔍 ContactInfo object found:', firstLead.contactInfo);
        }
      }

      // Process and save leads to Supabase
      console.log('🔍 DEBUG: processLeadData - About to call supabaseService.processAndSaveLeads...');
      const savedLeads = await this.supabaseService.processAndSaveLeads(leadsData, employeeId);

      console.log(`✅ Successfully processed and saved ${savedLeads.length} leads for employee: ${employeeId}`);

      return {
        success: true,
        leads: savedLeads,
        count: savedLeads.length,
        message: `Successfully processed and saved ${savedLeads.length} leads from employee: ${employeeId}`
      };

    } catch (err) {
      console.error(`❌ CRITICAL: Failure processing lead data for employee ${employeeId}:`, err.message);
      console.error(`❌ CRITICAL: Full error details:`, err);
      throw err;
    }
  }

  /**
   * Check if webhook output contains lead data
   */
  isLeadData(webhookOutput) {
    try {
      const parsed = JSON.parse(webhookOutput);
      
      console.log('🔍 DEBUG: isLeadData - Raw webhook output:', webhookOutput.substring(0, 300) + '...');
      console.log('🔍 DEBUG: isLeadData - Parsed structure type:', Array.isArray(parsed) ? 'Array' : typeof parsed);
      
      // Handle OpenAI tool output format: [{"index":0,"message":{"role":"assistant","content":{"leads":[...]}}}]
      let leadsArray = null;
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstItem = parsed[0];
        console.log('🔍 DEBUG: isLeadData - First item structure:', Object.keys(firstItem));
        
        // Check for nested OpenAI format
        if (firstItem.message && firstItem.message.content && firstItem.message.content.leads) {
          leadsArray = firstItem.message.content.leads;
          console.log('🔍 DEBUG: isLeadData - Found leads in OpenAI nested format, count:', leadsArray.length);
        }
        // Check for direct array format (fallback)
        else if (firstItem.title || firstItem.business_name || firstItem.name) {
          leadsArray = parsed;
          console.log('🔍 DEBUG: isLeadData - Found leads in direct array format, count:', leadsArray.length);
        }
        else {
          console.log('🔍 DEBUG: isLeadData - No recognized lead structure found in first item');
        }
      }
      else {
        console.log('🔍 DEBUG: isLeadData - Parsed data is not an array or is empty');
      }
      
      if (leadsArray && Array.isArray(leadsArray) && leadsArray.length > 0) {
        const firstLead = leadsArray[0];
        
        // Check for common lead data fields
        const leadFields = ['title', 'business_name', 'name', 'address', 'phone', 'website', 'categories', 'company'];
        const hasLeadFields = leadFields.some(field => firstLead.hasOwnProperty(field));
        
        console.log('🔍 DEBUG: isLeadData - First lead fields:', Object.keys(firstLead));
        console.log('🔍 DEBUG: isLeadData - Has lead fields:', hasLeadFields);
        console.log('🔍 DEBUG: isLeadData - Returning:', hasLeadFields);
        
        return hasLeadFields;
      }
      
      console.log('🔍 DEBUG: isLeadData - No valid leads structure found');
      return false;
    } catch (err) {
      console.error('🔍 DEBUG: isLeadData - JSON parsing error:', err.message);
      return false;
    }
  }

  /**
   * Get lead statistics
   */
  async getStatistics() {
    return await this.supabaseService.getLeadStatistics();
  }

  /**
   * Get leads with filters
   */
  async getLeads(filters = {}, page = 1, limit = 50) {
    return await this.supabaseService.getLeads(filters, page, limit);
  }

  /**
   * Update lead
   */
  async updateLead(leadId, updates) {
    return await this.supabaseService.updateLead(leadId, updates);
  }

  /**
   * Delete lead
   */
  async deleteLead(leadId) {
    return await this.supabaseService.deleteLead(leadId);
  }

  /**
   * Export leads to CSV
   */
  async exportToCSV(leads) {
    return await this.supabaseService.exportToCSV(leads);
  }

  /**
   * Export leads to XML
   */
  async exportToXML(leads) {
    return await this.supabaseService.exportToXML(leads);
  }
}

module.exports = LeadProcessor;
