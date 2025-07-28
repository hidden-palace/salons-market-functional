const express = require('express');
const OpenAIService = require('../services/openai-client');
const WebhookHandler = require('../services/webhook-handler');
const LeadProcessor = require('../services/lead-processor');
const { validateAskRequest, validateWebhookResponse } = require('../middleware/validation');
const config = require('../config');

const router = express.Router();

// Initialize services with error handling
let openaiService;
let webhookHandler;
let leadProcessor;

try {
  openaiService = new OpenAIService();
  webhookHandler = new WebhookHandler();
  leadProcessor = new LeadProcessor();
} catch (error) {
  console.error('Failed to initialize services:', error.message);
  // Services will be null, and we'll handle this in the routes
}

/**
 * GET /assistant-info - Get detailed assistant configuration
 */
router.get('/assistant-info', async (req, res, next) => {
  try {
    if (!openaiService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'OpenAI service is not properly configured.'
      });
    }

    // Get employee from query parameter
    const employee = req.query.employee || 'brenden';
    const employeeConfig = config.employees[employee];
    
    if (!employeeConfig) {
      return res.status(404).json({
        error: 'Employee not found',
        details: `Employee '${employee}' is not configured`
      });
    }

    const assistantId = employeeConfig.assistantId;
    
    console.log(`Getting assistant info for ${employee} (${assistantId})`);

    // Check if assistant ID is placeholder
    if (assistantId.includes('placeholder')) {
      return res.status(503).json({
        error: 'Assistant not configured',
        details: `${employeeConfig.name} is not connected yet. Please contact your administrator to configure this AI employee.`,
        employee: employeeConfig
      });
    }

    // Get assistant details from OpenAI
    const assistant = await openaiService.client.beta.assistants.retrieve(assistantId);
    
    res.json({
      id: assistant.id,
      name: assistant.name,
      description: assistant.description,
      instructions: assistant.instructions,
      model: assistant.model,
      tools: assistant.tools,
      created_at: assistant.created_at,
      employee: employeeConfig
    });
    
  } catch (error) {
    console.error('Error getting assistant info:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 404) {
      return res.status(404).json({
        error: 'Assistant not found',
        details: 'The specified assistant ID does not exist or is not accessible.'
      });
    }
    
    next(error);
  }
});

/**
 * GET /run-status - Check the status of a specific run with isolation context
 */
router.get('/run-status', async (req, res, next) => {
  try {
    console.log('=== RUN STATUS CHECK WITH ISOLATION ===');
    
    if (!openaiService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'OpenAI service is not properly configured.'
      });
    }

    const { thread_id, run_id, employee_id } = req.query;
    
    // Validate required parameters
    if (!thread_id || !run_id || !employee_id) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'thread_id, run_id, and employee_id are required'
      });
    }

    const employeeConfig = config.employees[employee_id];
    if (!employeeConfig) {
      return res.status(404).json({
        error: 'Employee not found',
        details: `Employee '${employee_id}' is not configured`
      });
    }

    console.log(`🔍 Checking run status for ${employeeConfig.name}:`, {
      thread_id,
      run_id,
      employee_id
    });

    // Validate thread ownership through isolation manager
    try {
      webhookHandler.getIsolationManager().validateThreadOwnership(thread_id, employee_id);
    } catch (isolationError) {
      console.error(`🚨 ISOLATION VIOLATION in run status check:`, isolationError.message);
      return res.status(403).json({
        error: 'Thread access denied',
        details: `Thread ${thread_id} does not belong to ${employeeConfig.name}: ${isolationError.message}`
      });
    }

    // Get current run status from OpenAI
    const run = await openaiService.client.beta.threads.runs.retrieve(thread_id, run_id);
    console.log(`📊 Run ${run_id} current status: ${run.status}`);

    const response = {
      thread_id,
      run_id,
      employee_id,
      employee_name: employeeConfig.name,
      status: run.status,
      isolation_verified: true,
      timestamp: new Date().toISOString()
    };

    if (run.status === 'completed') {
      console.log(`✅ Run completed, fetching final message for ${employeeConfig.name}`);
      
      try {
        const assistantMessage = await openaiService.getLatestAssistantMessage(thread_id);
        response.message = assistantMessage.content;
        response.message_id = assistantMessage.id;
        console.log(`📝 Final message retrieved for ${employeeConfig.name}`);
      } catch (messageError) {
        console.error(`❌ Failed to get final message for ${employeeConfig.name}:`, messageError.message);
        response.message = `Task completed successfully by ${employeeConfig.name}. The assistant has finished processing your request.`;
        response.message_error = messageError.message;
      }
      
    } else if (run.status === 'requires_action') {
      console.log(`🔧 Run requires action for ${employeeConfig.name}`);
      
      if (run.required_action?.type === 'submit_tool_outputs') {
        response.tool_calls = run.required_action.submit_tool_outputs.tool_calls.map(tc => ({
          id: tc.id,
          function: tc.function.name,
          arguments: JSON.parse(tc.function.arguments)
        }));
        
        // Get employee-specific pending calls
        const pendingCalls = webhookHandler.getEmployeePendingCalls(employee_id);
        response.pending_tool_calls = pendingCalls.length;
        response.tool_calls_sent = pendingCalls.length > 0;
        
        if (pendingCalls.length > 0) {
          response.webhook_status = pendingCalls.map(call => ({
            tool_call_id: call.toolCallId,
            function_name: call.functionName,
            age_seconds: call.age_seconds,
            status: call.status || 'pending',
            correlation_key: call.correlationKey
          }));
        }
      }
      
    } else if (run.status === 'failed') {
      console.error(`❌ Run failed for ${employeeConfig.name}:`, run.last_error);
      response.error = run.last_error?.message || 'Run failed with unknown error';
      response.error_code = run.last_error?.code;
      
    } else if (['cancelled', 'expired'].includes(run.status)) {
      console.warn(`⚠️ Run ${run.status} for ${employeeConfig.name}`);
      response.error = `Run was ${run.status}`;
      
    } else {
      console.log(`⏳ Run still processing for ${employeeConfig.name}: ${run.status}`);
      response.processing = true;
    }

    res.json(response);
    
  } catch (error) {
    console.error('Error checking run status:', error);
    next(error);
  }
});

/**
 * POST /ask - Handle user messages with BULLETPROOF employee isolation
 */
router.post('/ask', validateAskRequest, async (req, res, next) => {
  let threadId = null;
  let runId = null;
  let employeeId = null;
  let assistantId = null;
  
  try {
    console.log('=== BULLETPROOF ASK REQUEST PROCESSING ===');
    console.log('Request timestamp:', new Date().toISOString());

    // Check if services are properly initialized
    if (!openaiService || !webhookHandler) {
      console.error('Services not initialized');
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Required services are not properly configured. Please check your environment variables.'
      });
    }

    const { message, employee = 'brenden', thread_id } = req.body;
    employeeId = employee;
    
    // Get employee configuration
    const employeeConfig = config.employees[employee];
    if (!employeeConfig) {
      return res.status(404).json({
        error: 'Employee not found',
        details: `Employee '${employee}' is not configured`
      });
    }

    assistantId = employeeConfig.assistantId;
    
    // CRITICAL: Validate employee configuration
    console.log('🎯 BULLETPROOF EMPLOYEE VALIDATION:');
    console.log(`   Employee ID: ${employeeId}`);
    console.log(`   Employee Name: ${employeeConfig.name}`);
    console.log(`   Employee Role: ${employeeConfig.role}`);
    console.log(`   Assistant ID: ${assistantId}`);
    console.log(`   Webhook URL: ${employeeConfig.webhookUrl}`);
    
    // Check if assistant ID is placeholder
    if (assistantId.includes('placeholder')) {
      return res.status(503).json({
        error: 'Assistant not configured',
        details: `❌ ${employeeConfig.name} is not connected yet. Please contact your administrator to configure this AI employee.`,
        employee: employeeConfig
      });
    }
    
    console.log(`🎯 Processing message for ${employeeConfig.name} (${employeeConfig.role})`);
    console.log('📝 Message:', message);

    // Step 1: Create or use existing thread with isolation
    if (thread_id) {
      console.log('Step 1: Using existing thread with isolation validation:', thread_id);
      threadId = thread_id;
      
      // CRITICAL: Validate thread ownership through isolation manager
      try {
        webhookHandler.getIsolationManager().validateThreadOwnership(threadId, employeeId);
        console.log(`✅ Thread ownership validated for ${employeeConfig.name}`);
      } catch (isolationError) {
        console.error(`🚨 CRITICAL ISOLATION VIOLATION:`, isolationError.message);
        return res.status(403).json({
          error: 'Thread access denied',
          details: `Thread ${threadId} does not belong to ${employeeConfig.name}. This is a critical isolation violation.`,
          employee: employeeConfig,
          isolation_error: isolationError.message
        });
      }
      
      // Check for active runs on this thread
      try {
        console.log('🔍 Checking for active runs on thread...');
        const runs = await openaiService.client.beta.threads.runs.list(threadId, { limit: 1 });
        
        if (runs.data.length > 0) {
          const latestRun = runs.data[0];
          console.log(`📊 Latest run status: ${latestRun.status} (${latestRun.id})`);
          
          if (['queued', 'in_progress', 'requires_action'].includes(latestRun.status)) {
            console.log(`⚠️ Thread ${threadId} has active run ${latestRun.id} with status: ${latestRun.status}`);
            
            if (latestRun.status === 'requires_action') {
              const pendingCalls = webhookHandler.getEmployeePendingCalls(employeeId);
              
              if (pendingCalls.length > 0) {
                console.log(`🔧 Found ${pendingCalls.length} pending tool calls for ${employeeConfig.name}`);
                return res.status(409).json({
                  error: 'Thread busy with tool calls',
                  details: `${employeeConfig.name} is currently processing ${pendingCalls.length} tool call(s). Please wait for completion.`,
                  thread_id: threadId,
                  run_id: latestRun.id,
                  pending_tool_calls: pendingCalls.length,
                  employee: employeeConfig,
                  status: 'requires_action'
                });
              }
            } else {
              return res.status(409).json({
                error: 'Thread busy',
                details: `${employeeConfig.name} is currently processing another request. Please wait for completion.`,
                thread_id: threadId,
                run_id: latestRun.id,
                current_status: latestRun.status,
                employee: employeeConfig
              });
            }
          }
        }
      } catch (runCheckError) {
        console.warn('⚠️ Could not check run status, proceeding anyway:', runCheckError.message);
      }
    } else {
      console.log('Step 1: Creating new thread with isolation...');
      const thread = await openaiService.createThread();
      threadId = thread.id;
      
      // CRITICAL: Register thread in isolation manager
      webhookHandler.getIsolationManager().createConversationThread(employeeId, threadId);
      console.log(`✅ Thread created and registered for ${employeeConfig.name}:`, threadId);
    }
    
    // Step 2: Add user message to thread
    console.log('Step 2: Adding message to thread...');
    await openaiService.addMessage(threadId, message);
    console.log('✅ Message added to thread successfully');
    
    // Step 3: Run the CORRECT assistant for this employee
    console.log(`Step 3: Running ${employeeConfig.name}'s assistant (${assistantId})...`);
    const run = await openaiService.runAssistant(threadId, assistantId);
    runId = run.id;
    console.log(`✅ ${employeeConfig.name}'s assistant run started:`, runId);
    
    // Step 4: Poll for completion
    console.log(`Step 4: Polling for ${employeeConfig.name}'s completion...`);
    const result = await openaiService.pollRunStatus(threadId, runId, 20, 2000); // 40 seconds max
    console.log(`✅ ${employeeConfig.name} polling completed, result status:`, result.status);
    
    if (result.status === 'completed') {
      console.log(`✅ ${employeeConfig.name} completed without tool calls`);
      
      const assistantMessage = await openaiService.getLatestAssistantMessage(threadId);
      
      const response = {
        status: 'completed',
        message: assistantMessage.content,
        thread_id: threadId,
        run_id: runId,
        assistant_id: assistantId,
        employee: employeeConfig,
        isolation_verified: true,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Sending completed response for ${employeeConfig.name}`);
      res.json(response);
      
    } else if (result.status === 'requires_action') {
      console.log(`🔧 ${employeeConfig.name} requires tool calls:`, result.toolCalls?.length || 0);
      
      // Validate employee-specific webhook configuration
      if (!employeeConfig.webhookUrl || employeeConfig.webhookUrl.includes('placeholder')) {
        console.error(`❌ Webhook URL not configured for ${employeeConfig.name}`);
        return res.status(503).json({
          error: 'Webhook not configured',
          details: `External webhook URL is not configured for ${employeeConfig.name}. Tool calls cannot be processed.`,
          employee: employeeConfig,
          tool_calls: result.toolCalls.map(tc => ({
            id: tc.id,
            function: tc.function.name,
            arguments: JSON.parse(tc.function.arguments)
          })),
          thread_id: threadId,
          run_id: runId
        });
      }
      
      // CRITICAL: Send to CORRECT employee's webhook with bulletproof isolation
      console.log(`=== SENDING TOOL CALLS TO ${employeeConfig.name.toUpperCase()}'S WEBHOOK ===`);
      console.log(`🎯 BULLETPROOF WEBHOOK ROUTING:`);
      console.log(`   Employee: ${employeeConfig.name}`);
      console.log(`   Webhook URL: ${employeeConfig.webhookUrl}`);
      console.log(`   Tool Calls: ${result.toolCalls.length}`);
      console.log(`   Thread ID: ${threadId}`);
      console.log(`   Run ID: ${runId}`);
      
      const webhookResults = await webhookHandler.sendToolCalls(
        result.toolCalls,
        threadId,
        runId,
        employeeId // CRITICAL: Correct employee ID
      );
      console.log(`✅ Tool calls sent to ${employeeConfig.name}'s webhook successfully`);
      
      const response = {
        status: 'requires_action',
        message: `Tool calls have been sent to ${employeeConfig.name}'s external webhook`,
        thread_id: threadId,
        run_id: runId,
        assistant_id: assistantId,
        employee: employeeConfig,
        tool_calls: result.toolCalls.map(tc => ({
          id: tc.id,
          function: tc.function.name,
          arguments: JSON.parse(tc.function.arguments)
        })),
        webhook_results: webhookResults,
        isolation_verified: true,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Sending requires_action response for ${employeeConfig.name}`);
      res.json(response);
    } else {
      console.error('Unexpected result status:', result.status);
      throw new Error(`Unexpected assistant status: ${result.status}`);
    }
    
  } catch (error) {
    console.error('=== BULLETPROOF ASK REQUEST ERROR ===');
    console.error('Error timestamp:', new Date().toISOString());
    console.error('Employee ID:', employeeId);
    console.error('Assistant ID:', assistantId);
    console.error('Thread ID:', threadId);
    console.error('Run ID:', runId);
    console.error('Error:', error);
    
    // Enhanced error response with context
    const errorResponse = {
      error: 'Request processing failed',
      details: error.message,
      context: {
        employee_id: employeeId,
        employee_name: employeeId ? config.employees[employeeId]?.name : null,
        assistant_id: assistantId,
        thread_id: threadId,
        run_id: runId,
        isolation_enabled: true,
        timestamp: new Date().toISOString()
      }
    };
    
    next(errorResponse);
  }
});

/**
 * POST /webhook-response - Handle webhook responses with BULLETPROOF isolation
 */
router.post('/webhook-response', validateWebhookResponse, async (req, res, next) => {
  let processedResponse = null;
  
  try {
    console.log('=== BULLETPROOF WEBHOOK RESPONSE PROCESSING ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Check if services are properly initialized
    if (!openaiService || !webhookHandler) {
      console.error('Services not initialized');
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Services are not properly configured.'
      });
    }
    
    console.log('🔍 Processing webhook response with bulletproof isolation...');
    
    // CRITICAL: Process through bulletproof isolation system
    processedResponse = webhookHandler.processWebhookResponse(req.body);
    console.log(`✅ Webhook response processed with bulletproof isolation for ${processedResponse.employee_name}`);
    
    // CRITICAL: Validate isolation integrity
    console.log('🎯 BULLETPROOF ISOLATION VALIDATION:');
    console.log(`   Tool Call ID: ${processedResponse.tool_call_id}`);
    console.log(`   Employee ID: ${processedResponse.employee_id}`);
    console.log(`   Employee Name: ${processedResponse.employee_name}`);
    console.log(`   Thread ID: ${processedResponse.thread_id}`);
    console.log(`   Run ID: ${processedResponse.run_id}`);
    console.log(`   Correlation Verified: ${processedResponse.correlation_verified}`);
    console.log(`   Isolation Verified: ${processedResponse.isolation_verified}`);
    
    // Check if this is lead data and process it
    if (leadProcessor && leadProcessor.isLeadData(processedResponse.output)) {
      console.log(`🎯 Detected lead data from ${processedResponse.employee_name}, processing...`);
      try {
        const leadResult = await leadProcessor.processLeadData(
          processedResponse.output,
          processedResponse.employee_id
        );
        console.log(`✅ Successfully processed ${leadResult.count} leads from ${processedResponse.employee_name}`);
        
        processedResponse.lead_processing = {
          detected: true,
          processed: leadResult.success,
          count: leadResult.count,
          message: leadResult.message
        };
      } catch (leadError) {
        console.error(`❌ Failed to process leads from ${processedResponse.employee_name}:`, leadError.message);
        processedResponse.lead_processing = {
          detected: true,
          processed: false,
          error: leadError.message
        };
      }
    } else {
      processedResponse.lead_processing = {
        detected: false,
        processed: false
      };
    }
    
    // Submit tool output back to OpenAI
    console.log(`🚀 Submitting tool output to OpenAI for ${processedResponse.employee_name}`);
    
    const submitResult = await openaiService.submitToolOutputs(
      processedResponse.thread_id,
      processedResponse.run_id,
      [{
        tool_call_id: processedResponse.tool_call_id,
        output: processedResponse.output
      }]
    );
    console.log(`✅ Tool output submitted successfully for ${processedResponse.employee_name}. Status:`, submitResult.status);
    
    console.log(`⏳ Starting polling for completion for ${processedResponse.employee_name}...`);
    
    // Poll for final completion
    const result = await openaiService.pollRunStatus(
      processedResponse.thread_id,
      processedResponse.run_id,
      90, // 3 minutes
      2000 // 2 second intervals
    );
    console.log(`✅ Final polling completed for ${processedResponse.employee_name}, status:`, result.status);
    
    if (result.status === 'completed') {
      console.log(`📝 Getting final assistant message for ${processedResponse.employee_name}...`);
      
      const assistantMessage = await openaiService.getLatestAssistantMessage(
        processedResponse.thread_id
      );
      console.log(`✅ ${processedResponse.employee_name} final message retrieved successfully`);
      
      const response = {
        status: 'completed',
        message: assistantMessage.content,
        thread_id: processedResponse.thread_id,
        run_id: processedResponse.run_id,
        tool_call_id: processedResponse.tool_call_id,
        employee_id: processedResponse.employee_id,
        employee_name: processedResponse.employee_name,
        lead_processing: processedResponse.lead_processing,
        isolation_verified: true,
        correlation_verified: true,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Sending webhook completion response for ${processedResponse.employee_name}`);
      res.json(response);
      
    } else if (result.status === 'requires_action') {
      console.log(`🔧 ${processedResponse.employee_name} requires more actions:`, result.toolCalls?.length || 0, 'tool calls');
      
      // Send additional tool calls to employee-specific webhook
      if (result.toolCalls && result.toolCalls.length > 0) {
        console.log(`🚀 Sending additional tool calls to ${processedResponse.employee_name} webhook...`);
        const additionalWebhookResults = await webhookHandler.sendToolCalls(
          result.toolCalls,
          processedResponse.thread_id,
          processedResponse.run_id,
          processedResponse.employee_id
        );
        console.log(`✅ Additional webhook results for ${processedResponse.employee_name}:`, additionalWebhookResults);
      }
      
      const response = {
        status: 'requires_action',
        message: `${processedResponse.employee_name} requires additional tool calls`,
        thread_id: processedResponse.thread_id,
        run_id: processedResponse.run_id,
        tool_call_id: processedResponse.tool_call_id,
        employee_id: processedResponse.employee_id,
        employee_name: processedResponse.employee_name,
        lead_processing: processedResponse.lead_processing,
        tool_calls: result.toolCalls?.map(tc => ({
          id: tc.id,
          function: tc.function.name,
          arguments: JSON.parse(tc.function.arguments)
        })) || [],
        isolation_verified: true,
        correlation_verified: true,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Sending requires_action response for ${processedResponse.employee_name}`);
      res.json(response);
      
    } else {
      console.log(`⏳ ${processedResponse.employee_name} still processing or unknown status:`, result.status);
      const response = {
        status: result.status === 'unknown' ? 'processing' : result.status,
        message: `Tool output submitted for ${processedResponse.employee_name}, assistant status: ${result.status}`,
        thread_id: processedResponse.thread_id,
        run_id: processedResponse.run_id,
        tool_call_id: processedResponse.tool_call_id,
        employee_id: processedResponse.employee_id,
        employee_name: processedResponse.employee_name,
        lead_processing: processedResponse.lead_processing,
        current_status: result.status,
        isolation_verified: true,
        correlation_verified: true,
        timestamp: new Date().toISOString()
      };

      console.log(`📊 Sending processing/status response for ${processedResponse.employee_name}`);
      res.json(response);
    }
    
  } catch (error) {
    console.error('=== BULLETPROOF WEBHOOK RESPONSE ERROR ===');
    console.error('Error timestamp:', new Date().toISOString());
    console.error('Processed response:', processedResponse);
    console.error('Error:', error);
    
    const errorResponse = {
      error: 'Webhook response processing failed',
      details: error.message,
      context: {
        tool_call_id: processedResponse?.tool_call_id,
        thread_id: processedResponse?.thread_id,
        run_id: processedResponse?.run_id,
        employee_id: processedResponse?.employee_id,
        employee_name: processedResponse?.employee_name,
        isolation_enabled: true,
        timestamp: new Date().toISOString()
      }
    };
    
    next(errorResponse);
  }
});

/**
 * GET /status - Get server status with isolation information
 */
router.get('/status', async (req, res) => {
  try {
    const pendingCalls = webhookHandler ? webhookHandler.getPendingCalls() : [];
    
    // Check webhook health for all employees if configured
    let webhookHealth = null;
    if (webhookHandler) {
      try {
        webhookHealth = await webhookHandler.checkWebhookHealth();
      } catch (error) {
        webhookHealth = { error: error.message };
      }
    }
    
    // Get comprehensive statistics with isolation info
    const stats = webhookHandler ? webhookHandler.getStatistics() : null;
    
    // Get lead statistics if available
    let leadStats = null;
    if (leadProcessor) {
      try {
        leadStats = await leadProcessor.getStatistics();
      } catch (error) {
        leadStats = { error: error.message };
      }
    }

    // Get isolation integrity status
    let isolationIntegrity = null;
    if (webhookHandler) {
      try {
        isolationIntegrity = webhookHandler.validateSystemIntegrity();
      } catch (error) {
        isolationIntegrity = { error: error.message };
      }
    }
    
    const response = {
      status: 'running',
      employees: config.employees,
      services_initialized: {
        openai: !!openaiService,
        webhook: !!webhookHandler,
        leads: !!leadProcessor,
        isolation: !!(webhookHandler && webhookHandler.getIsolationManager())
      },
      configuration: {
        api_key_configured: !!(config.openai.apiKey && !config.openai.apiKey.includes('your_')),
        employees_configured: Object.keys(config.employees).reduce((acc, key) => {
          const employee = config.employees[key];
          acc[key] = {
            assistant_configured: !employee.assistantId.includes('placeholder'),
            webhook_configured: !!(employee.webhookUrl && !employee.webhookUrl.includes('placeholder')),
            name: employee.name,
            role: employee.role
          };
          return acc;
        }, {})
      },
      webhook_health: webhookHealth,
      pending_tool_calls: pendingCalls.length,
      pending_calls: pendingCalls,
      statistics: stats,
      lead_statistics: leadStats,
      isolation_integrity: isolationIntegrity,
      isolation_enabled: true,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Status request - response summary:', {
      total_employees: Object.keys(config.employees).length,
      pending_calls: pendingCalls.length,
      isolation_healthy: isolationIntegrity?.healthy || false,
      total_leads: leadStats?.total || 0
    });
    res.json(response);
  } catch (error) {
    console.error('Error in status endpoint:', error);
    res.status(500).json({
      error: 'Failed to get status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /debug/isolation - Debug endpoint for isolation system
 */
router.get('/debug/isolation', (req, res) => {
  try {
    if (!webhookHandler) {
      return res.status(503).json({ 
        error: 'Webhook handler not initialized',
        details: 'Service is not properly configured',
        timestamp: new Date().toISOString()
      });
    }
    
    const isolationManager = webhookHandler.getIsolationManager();
    const stats = isolationManager.getIsolationStatistics();
    const integrity = isolationManager.validateIsolationIntegrity();
    
    const response = {
      isolation_statistics: stats,
      integrity_check: integrity,
      employee_contexts: Object.keys(config.employees).reduce((acc, empId) => {
        acc[empId] = isolationManager.getEmployeeContext(empId);
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Debug isolation request:', {
      total_employees: stats.totalEmployees,
      total_threads: stats.totalActiveThreads,
      total_pending: stats.totalPendingOperations,
      isolation_healthy: integrity.healthy
    });
    res.json(response);
  } catch (error) {
    console.error('Error in debug isolation endpoint:', error);
    res.status(500).json({
      error: 'Failed to get isolation debug info',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /debug/reset-employee - Emergency reset for specific employee
 */
router.post('/debug/reset-employee', (req, res) => {
  try {
    const { employee_id } = req.body;
    
    if (!employee_id) {
      return res.status(400).json({
        error: 'Missing employee_id',
        details: 'employee_id is required for reset operation'
      });
    }
    
    if (!webhookHandler) {
      return res.status(503).json({ 
        error: 'Webhook handler not initialized',
        details: 'Service is not properly configured'
      });
    }
    
    console.log(`🚨 EMERGENCY RESET requested for employee: ${employee_id}`);
    
    const resetResult = webhookHandler.emergencyResetEmployee(employee_id);
    
    res.json({
      status: 'success',
      message: `Employee ${employee_id} context has been reset`,
      employee_name: resetResult.name,
      reset_timestamp: new Date().toISOString(),
      new_isolation_key: resetResult.isolationKey
    });
    
  } catch (error) {
    console.error('Error in emergency reset:', error);
    res.status(500).json({
      error: 'Failed to reset employee',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;