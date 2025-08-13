const axios = require('axios');
const config = require('../config');
const EmployeeIsolationManager = require('./employee-isolation-manager');

class WebhookHandler {
  constructor() {
    this.webhookSecret = config.webhook.secret;
    this.retryAttempts = 3; // Reduced for faster failure detection
    this.retryDelay = 2000;
    this.maxRetryDelay = 8000;
    
    // CRITICAL: Initialize isolation manager for bulletproof employee separation
    this.isolationManager = new EmployeeIsolationManager();
    
    console.log('🚀 WebhookHandler initialized with BULLETPROOF ISOLATION');
    console.log('🔒 Employee isolation manager active');
    
    // Start periodic integrity checks
    setInterval(() => {
      this.isolationManager.validateIsolationIntegrity();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * CRITICAL: Send tool calls with BULLETPROOF employee isolation
   */
  async sendToolCalls(toolCalls, threadId, runId, employeeId = 'brenden') {
    console.log(`=== BULLETPROOF TOOL CALL PROCESSING FOR ${employeeId.toUpperCase()} ===`);
    
    // Validate employee exists
    const employeeConfig = config.employees[employeeId];
    if (!employeeConfig) {
      throw new Error(`CRITICAL ERROR: Employee '${employeeId}' not found in configuration`);
    }

    // Validate tool-specific webhook configuration for the first tool call
    const toolWebhooks = employeeConfig.toolWebhooks;
    if (!toolWebhooks) {
      throw new Error(`CRITICAL ERROR: 'toolWebhooks' object not found for ${employeeConfig.name}. Please configure it in config/index.js`);
    }

    if (!toolWebhooks || Object.keys(toolWebhooks).length === 0) {
      throw new Error(`CRITICAL ERROR: No tool webhooks configured for ${employeeConfig.name}`);
    }

    const firstToolCallName = toolCalls[0]?.function?.name; // This line is for initial validation, not for routing
    if (!toolWebhooks[firstToolCallName] || toolWebhooks[firstToolCallName].includes('placeholder')) {
      throw new Error(`CRITICAL ERROR: Webhook URL not configured for tool '${firstToolCallName}' in ${employeeConfig.name}`);
    }

    console.log(`🎯 EMPLOYEE VALIDATION PASSED:`, {
      employeeId,
      employeeName: employeeConfig.name,
      employeeRole: employeeConfig.role,
      toolWebhooks: Object.keys(toolWebhooks),
      threadId,
      runId,
      toolCallsCount: toolCalls.length
    });

    // Ensure thread is registered in isolation manager
    try {
      this.isolationManager.validateThreadOwnership(threadId, employeeId);
    } catch (error) {
      // Thread not found, create it
      console.log(`📝 Creating new isolated thread for ${employeeConfig.name}`);
      this.isolationManager.createConversationThread(employeeId, threadId);
    }

    const results = [];

    for (const toolCall of toolCalls) {
      try {
        console.log(`🔧 Processing tool call ${toolCall.id} for ${employeeConfig.name}:`, {
          function: toolCall.function.name,
          arguments: Object.keys(JSON.parse(toolCall.function.arguments))
        });

        // CRITICAL: Register tool call with strict isolation
        const toolCallData = this.isolationManager.registerToolCall(
          toolCall.id,
          threadId,
          runId,
          employeeId,
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );

        const toolWebhookUrl = toolWebhooks[toolCall.function.name]; // Dynamically get webhook URL based on tool's function name
        if (!toolWebhookUrl) {
          throw new Error(`Webhook URL for tool '${toolCall.function.name}' is not configured for ${employeeConfig.name}. Please check 'toolWebhooks' in config/index.js`);
        }

        if (!toolWebhookUrl || toolWebhookUrl.includes('placeholder')) {
          throw new Error(`Webhook URL for tool '${toolCall.function.name}' not configured for ${employeeConfig.name}`);
        }

        console.log(`🎯 Using webhook URL for tool '${toolCall.function.name}': ${toolWebhookUrl}`);

        // Prepare webhook payload with isolation metadata
        const payload = {
          tool_call_id: toolCall.id,
          function_name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
          thread_id: threadId,
          run_id: runId,
          employee_id: employeeId,
          employee_name: employeeConfig.name,
          employee_role: employeeConfig.role,
          correlation_key: toolCallData.correlationKey,
          isolation_key: toolCallData.isolationKey,
          conversation_key: toolCallData.conversationKey,
          timestamp: new Date().toISOString(),
          retry_count: 0
        };

        console.log(`🚀 Sending isolated tool call to ${employeeConfig.name} webhook:`, {
          toolCallId: toolCall.id,
          correlationKey: toolCallData.correlationKey,
          isolationKey: toolCallData.isolationKey,
          webhookUrl: toolWebhookUrl
        });

        const result = await this.sendWebhookWithRetry(payload, toolWebhookUrl, employeeId); // Use the specific tool's webhook URL
        results.push(result);

      } catch (err) {
        console.error(`💥 CRITICAL FAILURE processing tool call ${toolCall.id} for ${employeeConfig.name}:`, err.message);
        
        results.push({
          toolCallId: toolCall.id,
          employeeId: employeeId,
          employeeName: employeeConfig.name,
          status: 'error',
          message: err.message,
          retryable: false // Don't retry critical errors
        });
      }
    }

    console.log(`✅ Tool call processing complete for ${employeeConfig.name}`);
    console.log(`📊 Results: ${results.filter(r => r.status === 'sent').length} sent, ${results.filter(r => r.status === 'error').length} failed`);

    return results;
  }

  /**
   * Send webhook with enhanced error handling and isolation tracking
   */
  async sendWebhookWithRetry(payload, webhookUrl, employeeId, attempt = 1) {
    const maxAttempts = this.retryAttempts; // This webhookUrl is now the specific tool's webhookUrl
    const employeeConfig = config.employees[employeeId];
    
    try {
      console.log(`📡 Webhook attempt ${attempt}/${maxAttempts} for ${employeeConfig.name}:`, {
        toolCallId: payload.tool_call_id,
        function: payload.function_name,
        correlationKey: payload.correlation_key
      });

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenAI-Assistant-Bridge/2.0',
        'X-Request-ID': `${payload.tool_call_id}-${Date.now()}`,
        'X-Thread-ID': payload.thread_id,
        'X-Run-ID': payload.run_id,
        'X-Employee-ID': payload.employee_id,
        'X-Employee-Name': payload.employee_name,
        'X-Correlation-Key': payload.correlation_key,
        'X-Isolation-Key': payload.isolation_key,
        'X-Conversation-Key': payload.conversation_key,
        'X-Attempt': attempt.toString(),
        'X-Max-Attempts': maxAttempts.toString()
      };

      if (this.webhookSecret) {
        headers['X-Webhook-Secret'] = this.webhookSecret;
      }

      const axiosConfig = {
        headers,
        timeout: 45000, // 45 second timeout
        validateStatus: (status) => status < 500,
        maxRedirects: 2
      };

      const response = await axios.post(webhookUrl, payload, axiosConfig);

      if (response.status >= 400) {
        let errorMessage = `Webhook returned ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          errorMessage += `\n\n🔧 WEBHOOK NOT ACTIVE for ${employeeConfig.name}:\n`;
          errorMessage += `   • The n8n.cloud workflow is not running\n`;
          errorMessage += `   • Go to n8n.cloud and activate the workflow\n`;
          errorMessage += `   • For test webhooks: Click 'Execute workflow' first\n`;
          errorMessage += `   • Verify webhook URL: ${webhookUrl}`;
        }
        
        throw new Error(errorMessage);
      }

      console.log(`✅ Webhook success for ${employeeConfig.name}:`, {
        status: response.status,
        toolCallId: payload.tool_call_id,
        correlationKey: payload.correlation_key
      });
      
      return {
        toolCallId: payload.tool_call_id,
        employeeId: payload.employee_id,
        employeeName: payload.employee_name,
        webhookUrl: webhookUrl,
        status: 'sent',
        response: response.data,
        attempt: attempt,
        correlationKey: payload.correlation_key,
        isolationKey: payload.isolation_key
      };

    } catch (error) {
      console.error(`❌ Webhook attempt ${attempt}/${maxAttempts} failed for ${employeeConfig.name}:`, error.message);
      
      if (attempt < maxAttempts && !error.message.includes('404')) {
        const delay = Math.min(this.retryDelay * Math.pow(2, attempt - 1), this.maxRetryDelay);
        console.log(`⏳ Retrying ${employeeConfig.name} webhook in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWebhookWithRetry(payload, webhookUrl, employeeId, attempt + 1);
      } else {
        console.error(`💥 FINAL FAILURE for ${employeeConfig.name} webhook after ${maxAttempts} attempts`);
        throw new Error(`${employeeConfig.name} webhook failed: ${error.message}`);
      }
    }
  }

  /**
   * CRITICAL: Process webhook response with BULLETPROOF isolation validation
   */
  processWebhookResponse(responseData) {
    console.log('=== BULLETPROOF WEBHOOK RESPONSE PROCESSING ===');
    
    const { tool_call_id, output, thread_id, run_id } = responseData;

    // Basic validation
    if (!tool_call_id || !output || !thread_id || !run_id) {
      throw new Error('Missing required fields: tool_call_id, output, thread_id, run_id');
    }

    console.log(`🔍 Processing webhook response:`, {
      toolCallId: tool_call_id,
      threadId: thread_id,
      runId: run_id,
      outputSize: typeof output === 'string' ? output.length : JSON.stringify(output).length
    });

    // CRITICAL: Process through isolation manager with bulletproof validation
    const processedResponse = this.isolationManager.processWebhookResponse(
      tool_call_id,
      output,
      thread_id,
      run_id
    );

    console.log(`✅ BULLETPROOF VALIDATION PASSED:`, {
      toolCallId: processedResponse.toolCallId,
      employeeId: processedResponse.employeeId,
      employeeName: processedResponse.employeeName,
      correlationKey: processedResponse.correlationKey,
      isolationKey: processedResponse.isolationKey
    });

    return {
      tool_call_id: processedResponse.toolCallId,
      output: processedResponse.output,
      thread_id: processedResponse.threadId,
      run_id: processedResponse.runId,
      employee_id: processedResponse.employeeId,
      employee_name: processedResponse.employeeName,
      correlation_verified: true,
      isolation_verified: true,
      processed_at: processedResponse.processedAt
    };
  }

  /**
   * Get pending calls with isolation context
   */
  getPendingCalls() {
    return this.isolationManager.getAllPendingOperations();
  }

  /**
   * Get employee-specific pending calls
   */
  getEmployeePendingCalls(employeeId) {
    return this.isolationManager.getEmployeePendingOperations(employeeId);
  }

  /**
   * Cleanup old operations
   */
  cleanupPendingCalls() {
    return this.isolationManager.cleanupOldOperations();
  }

  /**
   * Get comprehensive statistics with isolation info
   */
  getStatistics() {
    const isolationStats = this.isolationManager.getIsolationStatistics();
    const pendingCalls = this.getPendingCalls();
    
    return {
      ...isolationStats,
      pending_operations: pendingCalls.length,
      pending_by_employee: isolationStats.employeeBreakdown,
      isolation_health: isolationStats.isolationHealth,
      configuration: {
        retry_attempts: this.retryAttempts,
        retry_delay: this.retryDelay,
        max_retry_delay: this.maxRetryDelay,
        isolation_enabled: true
      }
    };
  }

  /**
   * Get isolation manager for direct access (debugging only)
   */
  getIsolationManager() {
    return this.isolationManager;
  }

  /**
   * Emergency reset for specific employee (use with caution)
   */
  emergencyResetEmployee(employeeId) {
    console.log(`🚨 EMERGENCY RESET requested for employee: ${employeeId}`);
    return this.isolationManager.resetEmployeeContext(employeeId);
  }

  /**
   * Validate system integrity
   */
  validateSystemIntegrity() {
    return this.isolationManager.validateIsolationIntegrity();
  }
}

module.exports = WebhookHandler;