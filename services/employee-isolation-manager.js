/**
 * CRITICAL: Employee Isolation Manager
 * 
 * This service ensures COMPLETE isolation between AI employees to prevent
 * any cross-contamination of responses, tool calls, or conversations.
 * 
 * Each employee operates in a completely isolated context with:
 * - Separate conversation threads
 * - Isolated webhook endpoints
 * - Strict correlation validation
 * - Independent processing pipelines
 */

const crypto = require('crypto');
const config = require('../config');

class EmployeeIsolationManager {
  constructor() {
    this.employeeContexts = new Map(); // Isolated contexts per employee
    this.conversationThreads = new Map(); // Employee-specific thread tracking
    this.pendingOperations = new Map(); // Isolated pending operations
    this.correlationKeys = new Map(); // Strict correlation tracking
    
    console.log('🔒 EmployeeIsolationManager initialized with STRICT isolation');
    this.initializeEmployeeContexts();
  }

  /**
   * Initialize completely isolated contexts for each employee
   */
  initializeEmployeeContexts() {
    Object.entries(config.employees).forEach(([employeeId, employee]) => {
      const context = {
        employeeId,
        name: employee.name,
        role: employee.role,
        specialty: employee.specialty,
        assistantId: employee.assistantId,
        webhookUrl: employee.webhookUrl,
        activeThreads: new Set(),
        pendingCalls: new Map(),
        conversationHistory: new Map(),
        isolationKey: this.generateIsolationKey(employeeId),
        lastActivity: null,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0
      };
      
      this.employeeContexts.set(employeeId, context);
      console.log(`🔐 Initialized isolated context for ${employee.name} (${employeeId})`);
      console.log(`   Isolation Key: ${context.isolationKey}`);
      console.log(`   Assistant ID: ${employee.assistantId}`);
      console.log(`   Webhook URL: ${employee.webhookUrl}`);
    });
  }

  /**
   * Generate unique isolation key for employee
   */
  generateIsolationKey(employeeId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256')
      .update(`${employeeId}-${timestamp}-${random}`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Create a new conversation thread with STRICT employee binding
   */
  createConversationThread(employeeId, threadId) {
    const context = this.employeeContexts.get(employeeId);
    if (!context) {
      throw new Error(`Employee ${employeeId} not found in isolation manager`);
    }

    const conversationKey = this.generateConversationKey(employeeId, threadId);
    const threadData = {
      threadId,
      employeeId,
      employeeName: context.name,
      isolationKey: context.isolationKey,
      conversationKey,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      toolCallCount: 0,
      status: 'active'
    };

    // Store in employee-specific context
    context.activeThreads.add(threadId);
    context.conversationHistory.set(threadId, threadData);
    
    // Store in global thread tracking with employee binding
    this.conversationThreads.set(threadId, {
      ...threadData,
      ownerEmployee: employeeId
    });

    console.log(`🧵 Created isolated thread for ${context.name}:`, {
      threadId,
      employeeId,
      conversationKey,
      isolationKey: context.isolationKey
    });

    return threadData;
  }

  /**
   * Generate unique conversation key for thread-employee binding
   */
  generateConversationKey(employeeId, threadId) {
    return crypto.createHash('sha256')
      .update(`${employeeId}-${threadId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 24);
  }

  /**
   * Validate thread ownership with STRICT verification
   */
  validateThreadOwnership(threadId, employeeId) {
    const threadData = this.conversationThreads.get(threadId);
    
    if (!threadData) {
      throw new Error(`Thread ${threadId} not found in isolation manager`);
    }

    if (threadData.ownerEmployee !== employeeId) {
      throw new Error(`CRITICAL ISOLATION VIOLATION: Thread ${threadId} belongs to ${threadData.ownerEmployee}, not ${employeeId}`);
    }

    const context = this.employeeContexts.get(employeeId);
    if (!context.activeThreads.has(threadId)) {
      throw new Error(`Thread ${threadId} not found in ${employeeId} active threads`);
    }

    console.log(`✅ Thread ownership validated: ${threadId} belongs to ${context.name}`);
    return threadData;
  }

  /**
   * Register tool call with STRICT employee isolation
   */
  registerToolCall(toolCallId, threadId, runId, employeeId, functionName, arguments_) {
    // Validate thread ownership first
    const threadData = this.validateThreadOwnership(threadId, employeeId);
    const context = this.employeeContexts.get(employeeId);

    // Generate unique correlation key
    const correlationKey = this.generateCorrelationKey(employeeId, threadId, runId, toolCallId);
    
    const toolCallData = {
      toolCallId,
      threadId,
      runId,
      employeeId,
      employeeName: context.name,
      functionName,
      arguments: arguments_,
      correlationKey,
      isolationKey: context.isolationKey,
      conversationKey: threadData.conversationKey,
      registeredAt: new Date().toISOString(),
      status: 'pending',
      webhookUrl: context.webhookUrl,
      retryCount: 0,
      lastError: null
    };

    // Store in employee-specific context
    context.pendingCalls.set(toolCallId, toolCallData);
    
    // Store in global pending operations with strict correlation
    this.pendingOperations.set(toolCallId, toolCallData);
    
    // Store correlation key mapping
    this.correlationKeys.set(correlationKey, {
      toolCallId,
      employeeId,
      threadId,
      runId
    });

    // Update thread activity
    threadData.lastActivity = new Date().toISOString();
    threadData.toolCallCount++;
    context.lastActivity = new Date().toISOString();
    context.totalOperations++;

    console.log(`🔧 Registered tool call for ${context.name}:`, {
      toolCallId,
      functionName,
      correlationKey,
      isolationKey: context.isolationKey,
      conversationKey: threadData.conversationKey
    });

    return toolCallData;
  }

  /**
   * Generate unique correlation key for tool call
   */
  generateCorrelationKey(employeeId, threadId, runId, toolCallId) {
    const components = [employeeId, threadId, runId, toolCallId, Date.now()];
    return crypto.createHash('sha256')
      .update(components.join('-'))
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Process webhook response with BULLETPROOF validation
   */
  processWebhookResponse(toolCallId, output, threadId, runId) {
    console.log('🔍 Processing webhook response with BULLETPROOF validation...');
    
    // Get pending operation
    const pendingOperation = this.pendingOperations.get(toolCallId);
    if (!pendingOperation) {
      throw new Error(`ISOLATION ERROR: No pending operation found for tool call ${toolCallId}`);
    }

    // CRITICAL: Validate ALL correlation parameters
    if (pendingOperation.threadId !== threadId) {
      throw new Error(`CRITICAL THREAD MISMATCH: Expected ${pendingOperation.threadId}, got ${threadId} for ${pendingOperation.employeeName}`);
    }

    if (pendingOperation.runId !== runId) {
      throw new Error(`CRITICAL RUN MISMATCH: Expected ${pendingOperation.runId}, got ${runId} for ${pendingOperation.employeeName}`);
    }

    // Validate employee context
    const context = this.employeeContexts.get(pendingOperation.employeeId);
    if (!context) {
      throw new Error(`ISOLATION ERROR: Employee context not found for ${pendingOperation.employeeId}`);
    }

    // Validate thread ownership
    this.validateThreadOwnership(threadId, pendingOperation.employeeId);

    // Validate correlation key
    const correlationMapping = this.correlationKeys.get(pendingOperation.correlationKey);
    if (!correlationMapping || 
        correlationMapping.toolCallId !== toolCallId ||
        correlationMapping.employeeId !== pendingOperation.employeeId ||
        correlationMapping.threadId !== threadId ||
        correlationMapping.runId !== runId) {
      throw new Error(`CRITICAL CORRELATION VIOLATION: Invalid correlation key for ${pendingOperation.employeeName}`);
    }

    console.log(`🎯 BULLETPROOF VALIDATION PASSED for ${context.name}:`, {
      toolCallId,
      employeeId: pendingOperation.employeeId,
      threadId,
      runId,
      correlationKey: pendingOperation.correlationKey,
      isolationKey: context.isolationKey
    });

    // Process the response
    const processedResponse = {
      toolCallId,
      output,
      threadId,
      runId,
      employeeId: pendingOperation.employeeId,
      employeeName: context.name,
      correlationKey: pendingOperation.correlationKey,
      isolationKey: context.isolationKey,
      conversationKey: pendingOperation.conversationKey,
      processedAt: new Date().toISOString(),
      validationPassed: true
    };

    // Update operation status
    pendingOperation.status = 'processed';
    pendingOperation.processedAt = new Date().toISOString();
    pendingOperation.output = output;

    // Remove from pending operations
    context.pendingCalls.delete(toolCallId);
    this.pendingOperations.delete(toolCallId);
    this.correlationKeys.delete(pendingOperation.correlationKey);

    // Update statistics
    context.successfulOperations++;
    context.lastActivity = new Date().toISOString();

    // Update thread activity
    const threadData = context.conversationHistory.get(threadId);
    if (threadData) {
      threadData.lastActivity = new Date().toISOString();
    }

    console.log(`✅ Webhook response processed successfully for ${context.name}`);
    console.log(`📊 Remaining pending operations: ${this.pendingOperations.size}`);

    return processedResponse;
  }

  /**
   * Get employee-specific pending operations
   */
  getEmployeePendingOperations(employeeId) {
    const context = this.employeeContexts.get(employeeId);
    if (!context) {
      return [];
    }

    return Array.from(context.pendingCalls.values()).map(op => ({
      ...op,
      age_seconds: Math.round((Date.now() - new Date(op.registeredAt).getTime()) / 1000)
    }));
  }

  /**
   * Get all pending operations with employee isolation info
   */
  getAllPendingOperations() {
    return Array.from(this.pendingOperations.values()).map(op => ({
      ...op,
      age_seconds: Math.round((Date.now() - new Date(op.registeredAt).getTime()) / 1000)
    }));
  }

  /**
   * Get employee context and statistics
   */
  getEmployeeContext(employeeId) {
    const context = this.employeeContexts.get(employeeId);
    if (!context) {
      return null;
    }

    return {
      ...context,
      activeThreadsCount: context.activeThreads.size,
      pendingCallsCount: context.pendingCalls.size,
      conversationCount: context.conversationHistory.size,
      successRate: context.totalOperations > 0 ? 
        (context.successfulOperations / context.totalOperations * 100).toFixed(2) + '%' : 
        'N/A'
    };
  }

  /**
   * Get comprehensive isolation statistics
   */
  getIsolationStatistics() {
    const stats = {
      totalEmployees: this.employeeContexts.size,
      totalActiveThreads: this.conversationThreads.size,
      totalPendingOperations: this.pendingOperations.size,
      totalCorrelationKeys: this.correlationKeys.size,
      employeeBreakdown: {},
      isolationHealth: 'healthy',
      timestamp: new Date().toISOString()
    };

    // Get per-employee statistics
    for (const [employeeId, context] of this.employeeContexts.entries()) {
      stats.employeeBreakdown[employeeId] = {
        name: context.name,
        role: context.role,
        activeThreads: context.activeThreads.size,
        pendingCalls: context.pendingCalls.size,
        totalOperations: context.totalOperations,
        successfulOperations: context.successfulOperations,
        failedOperations: context.failedOperations,
        successRate: context.totalOperations > 0 ? 
          (context.successfulOperations / context.totalOperations * 100).toFixed(2) + '%' : 
          'N/A',
        lastActivity: context.lastActivity,
        isolationKey: context.isolationKey
      };
    }

    // Check isolation health
    const totalPending = Array.from(this.employeeContexts.values())
      .reduce((sum, ctx) => sum + ctx.pendingCalls.size, 0);
    
    if (totalPending !== this.pendingOperations.size) {
      stats.isolationHealth = 'warning';
      stats.healthIssue = 'Pending operations count mismatch detected';
    }

    return stats;
  }

  /**
   * Cleanup old operations and threads
   */
  cleanupOldOperations() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    let cleanedOperations = 0;
    let cleanedThreads = 0;

    // Cleanup old pending operations
    for (const [toolCallId, operation] of this.pendingOperations.entries()) {
      const operationAge = Date.now() - new Date(operation.registeredAt).getTime();
      
      if (operationAge > oneHourAgo) {
        // Remove from employee context
        const context = this.employeeContexts.get(operation.employeeId);
        if (context) {
          context.pendingCalls.delete(toolCallId);
          context.failedOperations++;
        }
        
        // Remove from global tracking
        this.pendingOperations.delete(toolCallId);
        this.correlationKeys.delete(operation.correlationKey);
        cleanedOperations++;
        
        console.log(`🧹 Cleaned up old operation: ${toolCallId} (${operation.employeeName}, age: ${Math.round(operationAge / 60000)}min)`);
      }
    }

    // Cleanup old inactive threads
    for (const [threadId, threadData] of this.conversationThreads.entries()) {
      const threadAge = Date.now() - new Date(threadData.lastActivity).getTime();
      
      if (threadAge > oneDayAgo) {
        // Remove from employee context
        const context = this.employeeContexts.get(threadData.ownerEmployee);
        if (context) {
          context.activeThreads.delete(threadId);
          context.conversationHistory.delete(threadId);
        }
        
        // Remove from global tracking
        this.conversationThreads.delete(threadId);
        cleanedThreads++;
        
        console.log(`🧹 Cleaned up old thread: ${threadId} (${threadData.employeeName}, age: ${Math.round(threadAge / 3600000)}h)`);
      }
    }

    if (cleanedOperations > 0 || cleanedThreads > 0) {
      console.log(`🧹 Cleanup complete: ${cleanedOperations} operations, ${cleanedThreads} threads removed`);
    }

    return { cleanedOperations, cleanedThreads };
  }

  /**
   * Force reset employee context (emergency use only)
   */
  resetEmployeeContext(employeeId) {
    const context = this.employeeContexts.get(employeeId);
    if (!context) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    console.log(`🚨 EMERGENCY RESET for ${context.name}`);

    // Clear all pending operations for this employee
    for (const [toolCallId, operation] of this.pendingOperations.entries()) {
      if (operation.employeeId === employeeId) {
        this.pendingOperations.delete(toolCallId);
        this.correlationKeys.delete(operation.correlationKey);
      }
    }

    // Clear all threads for this employee
    for (const [threadId, threadData] of this.conversationThreads.entries()) {
      if (threadData.ownerEmployee === employeeId) {
        this.conversationThreads.delete(threadId);
      }
    }

    // Reset employee context
    context.activeThreads.clear();
    context.pendingCalls.clear();
    context.conversationHistory.clear();
    context.isolationKey = this.generateIsolationKey(employeeId);
    context.lastActivity = null;
    context.totalOperations = 0;
    context.successfulOperations = 0;
    context.failedOperations = 0;

    console.log(`✅ Employee context reset complete for ${context.name}`);
    return context;
  }

  /**
   * Validate system isolation integrity
   */
  validateIsolationIntegrity() {
    const issues = [];

    // Check pending operations consistency
    const globalPendingCount = this.pendingOperations.size;
    const employeePendingSum = Array.from(this.employeeContexts.values())
      .reduce((sum, ctx) => sum + ctx.pendingCalls.size, 0);

    if (globalPendingCount !== employeePendingSum) {
      issues.push(`Pending operations count mismatch: global=${globalPendingCount}, employee_sum=${employeePendingSum}`);
    }

    // Check correlation keys consistency
    const correlationKeysCount = this.correlationKeys.size;
    if (correlationKeysCount !== globalPendingCount) {
      issues.push(`Correlation keys count mismatch: keys=${correlationKeysCount}, operations=${globalPendingCount}`);
    }

    // Check thread ownership consistency
    for (const [threadId, threadData] of this.conversationThreads.entries()) {
      const ownerContext = this.employeeContexts.get(threadData.ownerEmployee);
      if (!ownerContext || !ownerContext.activeThreads.has(threadId)) {
        issues.push(`Thread ${threadId} ownership inconsistency for ${threadData.employeeName}`);
      }
    }

    const isHealthy = issues.length === 0;
    
    console.log(`🔍 Isolation integrity check: ${isHealthy ? 'HEALTHY' : 'ISSUES FOUND'}`);
    if (!isHealthy) {
      console.error('🚨 Isolation integrity issues:', issues);
    }

    return {
      healthy: isHealthy,
      issues,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = EmployeeIsolationManager;