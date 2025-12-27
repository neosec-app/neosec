const axios = require('axios');

/**
 * Free blocklist sources - No API key required!
 */

/**
 * Fetch blocklist from Blocklist.de (FREE - No API key needed)
 * Blocklist.de provides categorized lists for different attack types
 * @returns {Promise<Array>} Array of IP objects with proper threat types
 */
async function fetchBlocklistDE() {
  try {
    const allIPs = [];
    const ipMap = new Map(); // Track IPs and their threat types (in case IP appears in multiple lists)
    
    // Blocklist.de provides categorized lists - fetch from multiple sources for better categorization
    const blocklistSources = [
      { url: 'https://lists.blocklist.de/lists/bruteforcelogin.txt', threatType: 'Brute Force' },
      { url: 'https://lists.blocklist.de/lists/ssh.txt', threatType: 'Brute Force' },
      { url: 'https://lists.blocklist.de/lists/mail.txt', threatType: 'Spam' },
      { url: 'https://lists.blocklist.de/lists/apache.txt', threatType: 'DDoS' },
      { url: 'https://lists.blocklist.de/lists/strongips.txt', threatType: 'DDoS' },
      { url: 'https://lists.blocklist.de/lists/all.txt', threatType: 'Suspicious' } // Fallback for any other IPs
    ];

    // Fetch from all sources in parallel
    const fetchPromises = blocklistSources.map(async ({ url, threatType }) => {
      try {
        const response = await axios.get(url, {
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

          // Store IPs with their threat types (prioritize more specific types)
          ips.forEach(ip => {
            if (!ipMap.has(ip)) {
              ipMap.set(ip, threatType);
            } else {
              // If IP already exists, keep the more specific type (not "Suspicious")
              const existingType = ipMap.get(ip);
              if (existingType === 'Suspicious' && threatType !== 'Suspicious') {
                ipMap.set(ip, threatType);
              }
            }
          });
        }
      } catch (error) {
        // Continue if one list fails
        console.warn(`Failed to fetch Blocklist.de list from ${url}:`, error.message);
      }
    });

    await Promise.allSettled(fetchPromises);

    // Convert map to array
    for (const [ipAddress, threatType] of ipMap.entries()) {
      allIPs.push({
        ipAddress,
        threatType,
        source: 'Blocklist.de',
        abuseConfidenceScore: threatType === 'Suspicious' ? 50 : 75, // Higher confidence for categorized threats
        countryCode: null,
        usageType: null,
        isp: null,
        domain: null,
        hostnames: [],
        totalReports: 0,
        numDistinctUsers: 0,
        lastReportedAt: new Date().toISOString()
      });
    }

    console.log(`✅ Fetched ${allIPs.length} IPs from Blocklist.de (categorized by attack type)`);
    return allIPs;
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

