const express = require('express');
const LeadProcessor = require('../services/lead-processor');

const router = express.Router();

// Initialize lead processor
let leadProcessor;
try {
  leadProcessor = new LeadProcessor();
} catch (error) {
  console.error('Failed to initialize lead processor:', error.message);
}

/**
 * GET /leads - Get leads with filtering and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    console.log('🔍 LEADS DEBUG: Starting leads request...');
    console.log('🔍 LEADS DEBUG: Request query params:', req.query);
    
    if (!leadProcessor) {
      console.error('❌ LEADS DEBUG: Lead processor not initialized');
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured. Please check Supabase connection.'
      });
    }

    console.log('✅ LEADS DEBUG: Lead processor is available');
    
    const {
      source_platform,
      industry,
      city,
      validated,
      outreach_sent,
      employee_id,
      min_score,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    console.log('🔍 LEADS DEBUG: Parsed query parameters:', {
      source_platform, industry, city, validated, outreach_sent, 
      employee_id, min_score, date_from, date_to, sort, order, page, limit
    });

    const filters = {};
    if (source_platform) filters.source_platform = source_platform;
    if (industry) filters.industry = industry;
    if (city) filters.city = city;
    if (validated !== undefined) filters.validated = validated === 'true';
    if (outreach_sent !== undefined) filters.outreach_sent = outreach_sent === 'true';
    if (employee_id) filters.employee_id = employee_id;
    if (min_score) filters.min_score = parseFloat(min_score);
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    // Add sorting parameters
    filters.sort = sort;
    filters.order = order;
    
    console.log('📊 LEADS DEBUG: Final filters object:', filters);
    console.log('📊 LEADS DEBUG: Pagination params - page:', page, 'limit:', limit);
    
    console.log('🚀 LEADS DEBUG: Calling leadProcessor.getLeads...');
    
    const result = await leadProcessor.getLeads(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    console.log('✅ LEADS DEBUG: Lead processor returned result:', {
      totalLeads: result.leads?.length || 0,
      totalCount: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
    
    if (result.leads && result.leads.length > 0) {
      console.log('📋 LEADS DEBUG: First lead sample:', {
        id: result.leads[0].id,
        business_name: result.leads[0].business_name,
        contact_name: result.leads[0].contact_name,
        created_at: result.leads[0].created_at
      });
    } else {
      console.log('⚠️ LEADS DEBUG: No leads found in result');
    }
    
    res.json(result);
  } catch (err) {
    console.error('❌ LEADS DEBUG: Critical error in leads route:', err);
    console.error('❌ LEADS DEBUG: Error timestamp:', new Date().toISOString());
    console.error('❌ LEADS DEBUG: Error stack:', err.stack);
    console.error('❌ LEADS DEBUG: Error message:', err.message);
    console.error('❌ LEADS DEBUG: Error type:', err.constructor.name);
    console.error('❌ LEADS DEBUG: Error name:', err.name);
    console.error('❌ LEADS DEBUG: Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    console.error('❌ LEADS DEBUG: About to call next(err)');
    next(err);
  }
});

/**
 * GET /leads/export - Export leads in CSV or XML format
 */
router.get('/export', async (req, res, next) => {
  console.log('🔍 EXPORT DEBUG: Export route hit with query params:', req.query);
  
  try {
    console.log('🔍 EXPORT DEBUG: Starting export process...');
    console.log('🔍 EXPORT DEBUG: Request method:', req.method);
    console.log('🔍 EXPORT DEBUG: Request URL:', req.url);
    console.log('🔍 EXPORT DEBUG: Request headers:', req.headers);
    
    if (!leadProcessor) {
      console.log('❌ EXPORT DEBUG: Lead processor not initialized');
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured.'
      });
    }

    const {
      format = 'csv',
      source_platform,
      industry,
      city,
      validated,
      outreach_sent,
      employee_id,
      min_score,
      date_from,
      date_to
    } = req.query;

    console.log('🔍 EXPORT DEBUG: Parsed parameters:', {
      format,
      source_platform,
      industry,
      city,
      validated,
      outreach_sent,
      employee_id,
      min_score,
      date_from,
      date_to
    });
    // Validate format
    if (!['csv', 'xml'].includes(format.toLowerCase())) {
      console.log('❌ EXPORT DEBUG: Invalid format:', format);
      return res.status(400).json({
        error: 'Invalid format',
        details: 'Format must be either csv or xml'
      });
    }

    const filters = {};
    if (source_platform) filters.source_platform = source_platform;
    if (industry) filters.industry = industry;
    if (city) filters.city = city;
    if (validated !== undefined) filters.validated = validated === 'true';
    if (outreach_sent !== undefined) filters.outreach_sent = outreach_sent === 'true';
    if (employee_id) filters.employee_id = employee_id;
    if (min_score) filters.min_score = parseFloat(min_score);
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    console.log('🔍 EXPORT DEBUG: Applied filters:', filters);
    // Get all leads (no pagination for export)
    console.log('🔍 EXPORT DEBUG: Calling leadProcessor.getLeads...');
    const result = await leadProcessor.getLeads(filters, 1, 10000);
    const leads = result.leads || [];
    
    console.log(`📊 EXPORT DEBUG: Retrieved ${leads.length} leads from database for export`);
    if (leads.length > 0) {
      console.log('📋 EXPORT DEBUG: First lead sample:', {
        business_name: leads[0].business_name,
        contact_name: leads[0].contact_name,
        email: leads[0].email,
        phone: leads[0].phone,
        city: leads[0].city,
        created_at: leads[0].created_at
      });
    } else {
      console.log('📋 EXPORT DEBUG: No leads found in database');
    }

    if (format.toLowerCase() === 'csv') {
      console.log('🔍 EXPORT DEBUG: Generating CSV...');
      const csv = await leadProcessor.exportToCSV(leads);
      console.log('📄 EXPORT DEBUG: Generated CSV preview (first 300 chars):', csv.substring(0, 300));
      console.log('📄 EXPORT DEBUG: CSV total length:', csv.length);
      console.log('📄 EXPORT DEBUG: CSV line count:', csv.split('\n').length);
      
      console.log('🔍 EXPORT DEBUG: Setting CSV response headers...');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      console.log('🔍 EXPORT DEBUG: Sending CSV response...');
      res.send(csv);
      console.log('✅ EXPORT DEBUG: CSV response sent successfully');
    } else if (format.toLowerCase() === 'xml') {
      console.log('🔍 EXPORT DEBUG: Generating XML...');
      const xml = await leadProcessor.exportToXML(leads);
      console.log('📄 EXPORT DEBUG: Generated XML preview (first 200 chars):', xml.substring(0, 200));
      console.log('📄 EXPORT DEBUG: XML total length:', xml.length);
      
      console.log('🔍 EXPORT DEBUG: Setting XML response headers...');
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.xml"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      console.log('🔍 EXPORT DEBUG: Sending XML response...');
      res.send(xml);
      console.log('✅ EXPORT DEBUG: XML response sent successfully');
    }
  } catch (err) {
    console.error('❌ EXPORT DEBUG: Failure exporting leads:', err);
    console.error('❌ EXPORT DEBUG: Error stack:', err.stack);
    next(err);
  }
});

/**
 * GET /leads/statistics - Get lead statistics
 */
router.get('/statistics', async (req, res, next) => {
  try {
    if (!leadProcessor) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured.'
      });
    }

    const stats = await leadProcessor.getStatistics();
    res.json(stats);
  } catch (err) {
    console.error('Failure fetching lead statistics:', err);
    next(err);
  }
});

/**
 * PUT /leads/:id - Update lead
 */
router.put('/:id', async (req, res, next) => {
  try {
    if (!leadProcessor) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured.'
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Validate updates
    const allowedFields = [
      'contact_name', 'role_title', 'email', 'phone', 'website',
      'validated', 'outreach_sent', 'response_received', 'converted',
      'relevance_score', 'contact_role_score', 'location_score',
      'completeness_score', 'online_presence_score'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const updatedLead = await leadProcessor.updateLead(id, filteredUpdates);
    res.json(updatedLead);
  } catch (err) {
    console.error('Failure updating lead:', err);
    next(err);
  }
});

/**
 * DELETE /leads/:id - Delete lead
 */
router.delete('/:id', async (req, res, next) => {
  try {
    if (!leadProcessor) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured.'
      });
    }

    const { id } = req.params;
    await leadProcessor.deleteLead(id);
    
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    console.error('Failure deleting lead:', err);
    next(err);
  }
});

/**
 * POST /leads/process - Manually process lead data
 */
router.post('/process', async (req, res, next) => {
  try {
    if (!leadProcessor) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured.'
      });
    }

    const { output, employee_id } = req.body;

    if (!output || !employee_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'output and employee_id are required'
      });
    }

    const result = await leadProcessor.processLeadData(output, employee_id);
    res.json(result);
  } catch (err) {
    console.error('Failure processing lead data:', err);
    next(err);
  }
});

module.exports = router;