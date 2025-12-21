/**
 * Utility functions for IP address extraction and handling
 */

/**
 * Extract the real client IP address from request
 * Handles proxies, IPv6 localhost, and various header formats
 */
const getClientIP = (req) => {
  // Check X-Forwarded-For header (most common for proxies)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one (original client)
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    const clientIP = ips[0];
    
    // Skip if it's still localhost
    if (clientIP && clientIP !== '::1' && clientIP !== '127.0.0.1' && !clientIP.startsWith('192.168.') && !clientIP.startsWith('10.')) {
      return clientIP;
    }
  }

  // Check X-Real-IP header (used by nginx)
  const xRealIP = req.headers['x-real-ip'];
  if (xRealIP && xRealIP !== '::1' && xRealIP !== '127.0.0.1') {
    return xRealIP;
  }

  // Use req.ip if available (requires trust proxy to be set)
  if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') {
    return req.ip;
  }

  // Fallback to connection remote address
  const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (remoteAddress) {
    // Handle IPv6 localhost (::1) - convert to IPv4 localhost
    if (remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    // Handle IPv6-mapped IPv4 addresses
    if (remoteAddress.startsWith('::ffff:')) {
      return remoteAddress.replace('::ffff:', '');
    }
    if (remoteAddress !== '::1' && remoteAddress !== '127.0.0.1') {
      return remoteAddress;
    }
  }

  // If we're in development and it's localhost, return a more descriptive value
  if (process.env.NODE_ENV === 'development') {
    return '127.0.0.1 (Local Development)';
  }

  // Last resort
  return 'unknown';
};

/**
 * Check if IP address is localhost or private
 */
const isLocalOrPrivateIP = (ip) => {
  if (!ip || ip === 'unknown') return true;
  
  // IPv4 localhost
  if (ip === '127.0.0.1' || ip === 'localhost') return true;
  
  // IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;
  
  // Private IP ranges
  if (ip.startsWith('192.168.') || 
      ip.startsWith('10.') || 
      ip.startsWith('172.16.') || 
      ip.startsWith('172.17.') || 
      ip.startsWith('172.18.') || 
      ip.startsWith('172.19.') || 
      ip.startsWith('172.20.') || 
      ip.startsWith('172.21.') || 
      ip.startsWith('172.22.') || 
      ip.startsWith('172.23.') || 
      ip.startsWith('172.24.') || 
      ip.startsWith('172.25.') || 
      ip.startsWith('172.26.') || 
      ip.startsWith('172.27.') || 
      ip.startsWith('172.28.') || 
      ip.startsWith('172.29.') || 
      ip.startsWith('172.30.') || 
      ip.startsWith('172.31.')) {
    return true;
  }
  
  return false;
};

module.exports = {
  getClientIP,
  isLocalOrPrivateIP
};

