// File: utils/error-utils.js

function categorizeError(messageInput) {
  if (!inputMessage || typeof inputMessage !== 'string') return 'unknown';

  const message = messageInput.toLowerCase();

  if (message.includes('authentication')) return 'auth_error';
  if (message.includes('rate limit')) return 'rate_limit';
  if (message.includes('timeout')) return 'timeout';
  if (message.includes('not found')) return 'not_found';
  if (message.includes('permission')) return 'permission_error';
  if (message.includes('network')) return 'network_issue';
  if (message.includes('configuration')) return 'config_error';

  return 'general_error';
}

module.exports = { categorizeError };
