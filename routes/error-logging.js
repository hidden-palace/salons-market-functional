/**
 * Error Logging Routes
 * Handles client-side error reporting and server-side error tracking
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

/**
 * POST /errors - Log client-side errors
 */
router.post('/errors', async (req, res, next) => {
  try {
    const logData = {
      ...req.body,
      serverTimestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.requestId || `log_${Date.now()}`
    };

    // Log to console
    console.error('CLIENT_LOG:', JSON.stringify(logData, null, 2));

    // Store error for analysis
    await storeClientLog(logData);

    // Send to monitoring service if configured
    if (process.env.ERROR_MONITORING_URL) {
      await sendToMonitoringService(logData);
    }

    res.json({
      success: true,
      message: 'Log entry recorded successfully',
      logId: logData.requestId
    });

  } catch (err) {
    console.error('Failed to log client entry:', err);
    next(err);
  }
});

/**
 * GET /errors/stats - Get exception statistics
 */
router.get('/errors/stats', async (req, res, next) => {
  try {
    const stats = await getLogStatistics();
    res.json(stats);
  } catch (err) {
    console.error('Failed to get log statistics:', err);
    next(err);
  }
});

/**
 * GET /errors/recent - Get recent exceptions
 */
router.get('/errors/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const recentLogsList = await getRecentLogs(limit);
    res.json(recentLogsList);
  } catch (err) {
    console.error('Failed to get recent logs:', err);
    next(err);
  }
});

/**
 * Store client exception for analysis
 */
async function storeClientLog(logData) {
  try {
    const logDir = path.join(__dirname, '../logs/client-logs');
    
    // Ensure directory exists
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }

    // Store log with timestamp
    const filename = `client_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
    const filepath = path.join(logDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(logData, null, 2));
    console.log('Client log stored:', filepath);

    // Also append to daily log file
    const dailyLogFile = path.join(logDir, `logs_${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `${logData.serverTimestamp} - ${logData.type || 'unknown'} - ${logData.message || 'No message'}\n`;
    
    await fs.appendFile(dailyLogFile, logEntry);

  } catch (err) {
    console.error('Failed to store client log:', err);
  }
}

/**
 * Send exception to external monitoring service
 */
async function sendToMonitoringService(logData) {
  try {
    const monitoringUrl = process.env.ERROR_MONITORING_URL;
    const apiKey = process.env.ERROR_MONITORING_API_KEY;

    if (!monitoringUrl) return;

    const response = await fetch(monitoringUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(errorData),
      body: JSON.stringify(logData),
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Monitoring service responded with ${response.status}`);
    }

    console.log('Log sent to monitoring service successfully');

  } catch (err) {
    console.error('Failed to send log to monitoring service:', err);
  }
}

/**
 * Get exception statistics
 */
async function getLogStatistics() {
  try {
    const logDir = path.join(__dirname, '../logs/client-logs');
    
    try {
      await fs.access(logDir);
    } catch {
      return {
        totalLogs: 0,
        logsByType: {},
        logsByDay: {},
        recentLogs: 0
      };
    }

    const files = await fs.readdir(logDir);
    const logFiles = files.filter(file => file.startsWith('client_log_') && file.endsWith('.json'));

    const stats = {
      totalLogs: logFiles.length,
      logsByType: {},
      logsByDay: {},
      recentLogs: 0
    };

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    for (const file of logFiles.slice(-100)) { // Process last 100 logs
      try {
        const filepath = path.join(logDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const logData = JSON.parse(content);

        // Count by type
        const type = logData.type || 'unknown';
        stats.logsByType[type] = (stats.logsByType[type] || 0) + 1;

        // Count by day
        const day = logData.serverTimestamp?.split('T')[0] || 'unknown';
        stats.logsByDay[day] = (stats.logsByDay[day] || 0) + 1;

        // Count recent logs
        const logTime = new Date(logData.serverTimestamp).getTime();
        if (logTime > oneDayAgo) {
          stats.recentLogs++;
        }

      } catch (err) {
        console.error('Failed to parse log file:', file, err);
      }
    }

    return stats;

  } catch (err) {
    console.error('Failed to generate log statistics:', err);
    return {
      totalLogs: 0,
      logsByType: {},
      logsByDay: {},
      recentLogs: 0,
      failure: err.message
    };
  }
}

/**
 * Get recent exceptions
 */
async function getRecentLogs(limit = 50) {
  try {
    const logDir = path.join(__dirname, '../logs/client-logs');
    
    try {
      await fs.access(logDir);
    } catch {
      return [];
    }

    const files = await fs.readdir(logDir);
    const logFiles = files
      .filter(file => file.startsWith('client_log_') && file.endsWith('.json'))
      .sort()
      .slice(-limit);

    const recentLogsList = [];

    for (const file of logFiles) {
      try {
        const filepath = path.join(logDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const logData = JSON.parse(content);
        
        // Remove sensitive information
        delete logData.ip;
        delete logData.userAgent;
        
        recentLogsList.push(logData);

      } catch (err) {
        console.error('Failed to parse log file:', file, err);
      }
    }

    return recentLogsList.reverse(); // Most recent first

  } catch (err) {
    console.error('Failed to get recent logs:', err);
    return [];
  }
}

/**
 * Cleanup old exception files
 */
async function cleanupOldLogs() {
  try {
    const logDir = path.join(__dirname, '../logs/client-logs');
    
    try {
      await fs.access(logDir);
    } catch {
      return;
    }

    const files = await fs.readdir(logDir);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    for (const file of files) {
      if (file.startsWith('client_log_') && file.endsWith('.json')) {
        const filepath = path.join(logDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          await fs.unlink(filepath);
          console.log('Deleted old log file:', file);
        }
      }
    }

  } catch (err) {
    console.error('Failed to cleanup old logs:', err);
  }
}

// Run cleanup daily
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

module.exports = router;