const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const { errorHandler } = require('./middleware/validation');
const assistantRoutes = require('./routes/assistant');
const leadsRoutes = require('./routes/leads');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: process.env.NODE_ENV === 'production' 
        ? ["'self'", "'unsafe-inline'"]
        : ["'self'", "'unsafe-eval'", "'unsafe-inline'"], // Allow unsafe-eval and unsafe-inline in non-production
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your production domains
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Secret']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests',
    details: 'Rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware with error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('Invalid JSON in request body:', e.message);
      const error = new Error('Invalid JSON in request body');
      error.status = 400;
      throw error;
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  
  // Log request body for API endpoints (but not for static files)
  if (req.path.startsWith('/api') && req.method !== 'GET') {
    console.log('Request body:', req.body);
  }
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const response = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.server.nodeEnv
  };
  
  console.log('Health check response:', response);
  res.json(response);
});

// API routes
app.use('/api', assistantRoutes);
app.use('/api/leads', leadsRoutes);

// Add branding and storage routes
const brandingRoutes = require('./routes/branding');
const storageRoutes = require('./routes/storage');
app.use('/api/branding', brandingRoutes);
app.use('/api/storage', storageRoutes);

// Test route for debugging
app.get('/api/test-route', (req, res) => {
  console.log('🧪 TEST ROUTE HIT: /api/test-route accessed successfully');
  console.log('🧪 TEST ROUTE: Request method:', req.method);
  console.log('🧪 TEST ROUTE: Request URL:', req.url);
  console.log('🧪 TEST ROUTE: Query params:', req.query);
  console.log('🧪 TEST ROUTE: Headers:', req.headers);
  
  res.json({
    success: true,
    message: 'Test route is working correctly',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    query: req.query
  });
});

// Add a specific test route for leads export
app.get('/api/leads/export-test', (req, res) => {
  console.log('🧪 LEADS EXPORT TEST: Route accessed successfully');
  console.log('🧪 LEADS EXPORT TEST: Query params:', req.query);
  
  res.json({
    success: true,
    message: 'Leads export test route is working',
    timestamp: new Date().toISOString(),
    query: req.query
  });
});

// Serve chat interface at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API documentation endpoint
app.get('/api-docs', (req, res) => {
  const response = {
    name: 'OpenAI Assistant Webhook Bridge',
    version: '1.0.0',
    description: 'Express.js server bridging OpenAI Assistants with external webhooks',
    endpoints: {
      health: 'GET /health - Server health check',
      ask: 'POST /api/ask - Send message to OpenAI Assistant',
      webhookResponse: 'POST /api/webhook-response - Receive webhook responses',
      status: 'GET /api/status - Get server status and pending tool calls',
      leads: 'GET /api/leads - Get leads with filtering',
      leadStatistics: 'GET /api/leads/statistics - Get lead statistics'
    },
    documentation: {
      askEndpoint: {
        method: 'POST',
        path: '/api/ask',
        body: {
          message: 'string (required) - User message to send to assistant',
          employee: 'string (optional) - Employee ID (default: brenden)',
          thread_id: 'string (optional) - Existing thread ID'
        },
        responses: {
          completed: 'Assistant completed without tool calls',
          requires_action: 'Tool calls sent to webhook, waiting for responses'
        }
      },
      webhookEndpoint: {
        method: 'POST',
        path: '/api/webhook-response',
        body: {
          tool_call_id: 'string (required) - ID of the tool call',
          output: 'string (required) - Result from webhook execution',
          thread_id: 'string (required) - OpenAI thread ID',
          run_id: 'string (required) - OpenAI run ID'
        }
      },
      leadsEndpoint: {
        method: 'GET',
        path: '/api/leads',
        query: {
          industry: 'string (optional) - Filter by industry',
          city: 'string (optional) - Filter by city',
          validated: 'boolean (optional) - Filter by validation status',
          employee_id: 'string (optional) - Filter by employee',
          page: 'number (optional) - Page number (default: 1)',
          limit: 'number (optional) - Items per page (default: 50)'
        }
      }
    }
  };
  
  console.log('API docs response:', response);
  res.json(response);
});

// 404 handler
app.use('*', (req, res) => {
  const response = {
    error: 'Endpoint not found',
    details: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET / - Chat interface',
      'GET /health - Health check',
      'GET /api-docs - API documentation',
      'POST /api/ask - Send message to assistant',
      'POST /api/webhook-response - Receive webhook responses',
      'GET /api/status - Server status',
      'GET /api/leads - Get leads',
      'GET /api/leads/statistics - Lead statistics'
    ]
  };
  
  console.log('404 response:', response);
  res.status(404).json(response);
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const server = app.listen(config.server.port, () => {
  console.log('\n🚀 OpenAI Assistant Webhook Bridge Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Server running on port: ${config.server.port}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`🤖 Assistant ID: ${config.openai.assistantId}`);
  console.log(`🔗 Webhook URL: ${config.webhook.url}`);
  console.log(`⚡ Rate limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000}s`);
  console.log('='.repeat(50));
  console.log('\n📚 Available endpoints:');
  console.log(`   GET  / - Chat interface`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api-docs - API documentation`);
  console.log(`   GET  /api/status - Server status`);
  console.log(`   POST /api/ask - Send message to assistant`);
  console.log(`   POST /api/webhook-response - Receive webhook responses`);
  console.log(`   GET  /api/leads - Get leads with filtering`);
  console.log(`   GET  /api/leads/statistics - Lead statistics`);
  console.log('\n✅ Server ready to accept connections');
  console.log(`🎯 Open your browser to: http://localhost:${config.server.port}\n`);
});

// Cleanup pending tool calls every 15 minutes
const WebhookHandler = require('./services/webhook-handler');
let webhookHandler;

try {
  webhookHandler = new WebhookHandler();
  setInterval(() => {
    webhookHandler.cleanupPendingCalls();
  }, 15 * 60 * 1000);
} catch (error) {
  console.warn('Could not initialize webhook handler for cleanup:', error.message);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production, but log the error
  if (config.server.nodeEnv !== 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Exit the process as this is a serious error
  process.exit(1);
});

module.exports = app;