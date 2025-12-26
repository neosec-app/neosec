const axios = require('axios');

/**
 * Free blocklist sources - No API key required!
 */

/**
 * Fetch blocklist from Blocklist.de (FREE - No API key needed)
 * @returns {Promise<Array>} Array of IP objects
 */
async function fetchBlocklistDE() {
  try {
    // Blocklist.de provides free IP lists via HTTP
    const response = await axios.get('https://lists.blocklist.de/lists/all.txt', {
      timeout: 30000,
      headers: {
        'User-Agent': 'NeoSec-ThreatBlocker/1.0'
      }
    });

    if (response.data && typeof response.data === 'string') {
      const ips = response.data
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(line));

      return ips.map(ip => ({
        ipAddress: ip,
        threatType: 'Suspicious', // Blocklist.de doesn't specify types
        source: 'Blocklist.de',
        abuseConfidenceScore: 75, // Default confidence
        countryCode: null,
        usageType: null,
        isp: null,
        domain: null,
        hostnames: [],
        totalReports: 0,
        numDistinctUsers: 0,
        lastReportedAt: new Date().toISOString()
      }));
    }

    return [];
  } catch (error) {
    console.error('Blocklist.de fetch error:', error.message);
    return [];
  }
}

/**
 * Fetch Tor Exit Nodes (FREE - No API key needed)
 * @returns {Promise<Array>} Array of IP objects
 */
async function fetchTorExitNodes() {
  try {
    const response = await axios.get('https://check.torproject.org/exit-addresses', {
      timeout: 30000,
      headers: {
        'User-Agent': 'NeoSec-ThreatBlocker/1.0'
      }
    });

    if (response.data && typeof response.data === 'string') {
      const ips = [];
      const lines = response.data.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('ExitAddress')) {
          const parts = line.split(' ');
          if (parts.length >= 2) {
            const ip = parts[1].trim();
            if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
              ips.push(ip);
            }
          }
        }
      }

      return ips.map(ip => ({
        ipAddress: ip,
        threatType: 'Suspicious',
        source: 'Tor Exit Nodes',
        abuseConfidenceScore: 50,
        countryCode: null,
        usageType: null,
        isp: null,
        domain: null,
        hostnames: [],
        totalReports: 0,
        numDistinctUsers: 0,
        lastReportedAt: new Date().toISOString()
      }));
    }

    return [];
  } catch (error) {
    console.error('Tor Exit Nodes fetch error:', error.message);
    return [];
  }
}

/**
 * Fetch from multiple free sources
 * @param {Array} sources - Array of source names to fetch from ['blocklist.de', 'tor']
 * @returns {Promise<Array>} Combined array of IP objects
 */
async function fetchFreeBlocklist(sources = ['blocklist.de']) {
  const allIPs = [];
  const ipSet = new Set(); // To deduplicate

  try {
    const fetchPromises = [];

    if (sources.includes('blocklist.de')) {
      fetchPromises.push(fetchBlocklistDE().then(ips => ({ source: 'blocklist.de', ips })));
    }

    if (sources.includes('tor')) {
      fetchPromises.push(fetchTorExitNodes().then(ips => ({ source: 'tor', ips })));
    }

    const results = await Promise.allSettled(fetchPromises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.ips) {
        for (const ipData of result.value.ips) {
          if (!ipSet.has(ipData.ipAddress)) {
            ipSet.add(ipData.ipAddress);
            allIPs.push(ipData);
          }
        }
      }
    }

    console.log(`✅ Fetched ${allIPs.length} unique IPs from free sources: ${sources.join(', ')}`);
    return allIPs;
  } catch (error) {
    console.error('Error fetching free blocklist:', error.message);
    return allIPs; // Return what we got
  }
}

module.exports = {
  fetchFreeBlocklist,
  fetchBlocklistDE,
  fetchTorExitNodes
};

