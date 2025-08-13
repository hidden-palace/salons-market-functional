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
      console.log(`📊 Processing lead data for employee: ${employeeId}`);
      
      // Parse the JSON output from the webhook
      let leadsData;
      try {
        const parsed = JSON.parse(webhookOutput);
        
        // Handle OpenAI tool output format: [{"index":0,"message":{"role":"assistant","content":{"leads":[...]}}}]
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstItem = parsed[0];
          
          // Check for nested OpenAI format
          if (firstItem.message && firstItem.message.content && firstItem.message.content.leads) {
            leadsData = firstItem.message.content.leads;
            console.log(`✅ Extracted ${leadsData.length} leads from OpenAI format`);
          }
          // Check for direct array format (fallback)
          else if (firstItem.title || firstItem.business_name || firstItem.name) {
            leadsData = parsed;
            console.log(`✅ Using direct array format with ${leadsData.length} leads`);
          } else {
            throw new Error('Unrecognized data structure in webhook output - no leads found in expected locations');
          }
        } else {
          throw new Error('Expected array in webhook output, got: ' + typeof parsed);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse webhook output as JSON:', parseError);
        console.error('❌ Raw output preview:', webhookOutput.substring(0, 200) + '...');
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

      console.log(`📊 Processing ${leadsData.length} leads from ${employeeId}`);

      // Process and save leads to Supabase
      const savedLeads = await this.supabaseService.processAndSaveLeads(leadsData, employeeId);

      console.log(`✅ Successfully processed and saved ${savedLeads.length} leads for employee: ${employeeId}`);

      return {
        success: true,
        leads: savedLeads,
        count: savedLeads.length,
        message: `Successfully processed and saved ${savedLeads.length} leads from employee: ${employeeId}`
      };

    } catch (err) {
      console.error(`❌ Failed to process lead data for ${employeeId}:`, err.message);
      throw err;
    }
  }

  /**
   * Check if webhook output contains lead data
   */
  isLeadData(webhookOutput) {
    try {
      const parsed = JSON.parse(webhookOutput);
      
      // Handle OpenAI tool output format: [{"index":0,"message":{"role":"assistant","content":{"leads":[...]}}}]
      let leadsArray = null;
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstItem = parsed[0];
        
        // Check for nested OpenAI format
        if (firstItem.message && firstItem.message.content && firstItem.message.content.leads) {
          leadsArray = firstItem.message.content.leads;
        }
        // Check for direct array format (fallback)
        else if (firstItem.title || firstItem.business_name || firstItem.name) {
          leadsArray = parsed;
        }
      }
      
      if (leadsArray && Array.isArray(leadsArray) && leadsArray.length > 0) {
        const firstLead = leadsArray[0];
        
        // Check for common lead data fields
        const leadFields = ['title', 'business_name', 'name', 'address', 'phone', 'website', 'categories', 'company'];
        const hasLeadFields = leadFields.some(field => firstLead.hasOwnProperty(field));
        
        return hasLeadFields;
      }
      
      return false;
    } catch (err) {
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
