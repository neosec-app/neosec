const axios = require('axios');

/**
 * Fetch blocklist from AbuseIPDB API
 * @param {string} apiKey - AbuseIPDB API key
 * @param {number} maxAgeInDays - Maximum age of reports in days (default: 90)
 * @param {number} confidenceMinimum - Minimum confidence score (0-100, default: 75)
 * @param {number} limit - Maximum number of IPs to fetch (default: 10000)
 * @returns {Promise<Array>} Array of IP objects with threat data
 */
async function fetchBlocklist(apiKey, maxAgeInDays = 90, confidenceMinimum = 75, limit = 10000) {
  if (!apiKey) {
    throw new Error('AbuseIPDB API key is required');
  }

  try {
    const response = await axios.get('https://api.abuseipdb.com/api/v2/blacklist', {
      params: {
        limit: limit,
        maxAgeInDays: maxAgeInDays,
        confidenceMinimum: confidenceMinimum
      },
      headers: {
        'Key': apiKey,
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    if (response.data && response.data.data) {
      return response.data.data.map(ip => ({
        ipAddress: ip.ipAddress,
        abuseConfidenceScore: ip.abuseConfidenceScore || 0,
        lastReportedAt: ip.lastReportedAt || new Date().toISOString(),
        countryCode: ip.countryCode || null,
        usageType: ip.usageType || null,
        isp: ip.isp || null,
        domain: ip.domain || null,
        hostnames: ip.hostnames || [],
        totalReports: ip.totalReports || 0,
        numDistinctUsers: ip.numDistinctUsers || 0,
        // Map AbuseIPDB data to our threat types
        threatType: mapAbuseIPDBToThreatType(ip.abuseConfidenceScore, ip.usageType),
        source: 'AbuseIPDB'
      }));
    }

    return [];
  } catch (error) {
    console.error('AbuseIPDB API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw new Error(`Failed to fetch blocklist from AbuseIPDB: ${error.message}`);
  }
}

/**
 * Map AbuseIPDB data to our threat type categories
 */
function mapAbuseIPDBToThreatType(confidenceScore, usageType) {
  if (confidenceScore >= 90) {
    return 'Malware C&C';
  } else if (confidenceScore >= 75) {
    if (usageType && usageType.toLowerCase().includes('hosting')) {
      return 'Malware Host';
    }
    return 'Botnet';
  } else if (confidenceScore >= 50) {
    return 'Suspicious';
  }
  return 'Other';
}

/**
 * Check a single IP address against AbuseIPDB
 * @param {string} apiKey - AbuseIPDB API key
 * @param {string} ipAddress - IP address to check
 * @returns {Promise<Object>} IP check result
 */
async function checkIP(apiKey, ipAddress) {
  if (!apiKey) {
    throw new Error('AbuseIPDB API key is required');
  }

  try {
    const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
      params: {
        ipAddress: ipAddress,
        maxAgeInDays: 90,
        verbose: ''
      },
      headers: {
        'Key': apiKey,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.data) {
      const data = response.data.data;
      return {
        ipAddress: data.ipAddress,
        isPublic: data.isPublic,
        ipVersion: data.ipVersion,
        isWhitelisted: data.isWhitelisted,
        abuseConfidenceScore: data.abuseConfidenceScore || 0,
        countryCode: data.countryCode || null,
        usageType: data.usageType || null,
        isp: data.isp || null,
        domain: data.domain || null,
        hostnames: data.hostnames || [],
        totalReports: data.totalReports || 0,
        numDistinctUsers: data.numDistinctUsers || 0,
        lastReportedAt: data.lastReportedAt || null
      };
    }

    return null;
  } catch (error) {
    console.error('AbuseIPDB Check IP Error:', error.message);
    throw new Error(`Failed to check IP with AbuseIPDB: ${error.message}`);
  }
}

module.exports = {
  fetchBlocklist,
  checkIP
};


