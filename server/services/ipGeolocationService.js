const axios = require('axios');
const { isLocalOrPrivateIP } = require('../utils/ipUtils');

/**
 * Get location information from IP address
 * Uses free IP geolocation API (ip-api.com)
 */
const getLocationFromIP = async (ipAddress) => {
  try {
    // Skip for localhost or private IPs
    if (!ipAddress || ipAddress === 'unknown' || isLocalOrPrivateIP(ipAddress)) {
      // Check if it's development mode with localhost
      if (ipAddress && (ipAddress.includes('Local Development') || ipAddress === '127.0.0.1')) {
        return 'Local Development';
      }
      return 'Local Network';
    }
    
    // Clean up IP address (remove any port numbers or extra info)
    const cleanIP = ipAddress.split(':')[0].split(',')[0].trim();

    // Use ip-api.com free service (no API key required, 45 requests/minute limit)
    const response = await axios.get(`http://ip-api.com/json/${cleanIP}`, {
      timeout: 3000 // 3 second timeout
    });

    if (response.data && response.data.status === 'success') {
      const { city, regionName, country, countryCode } = response.data;
      const locationParts = [];
      
      if (city) locationParts.push(city);
      if (regionName) locationParts.push(regionName);
      if (country) locationParts.push(country);
      
      return locationParts.length > 0 ? locationParts.join(', ') : country || 'Unknown';
    }
    
    return 'Unknown';
  } catch (error) {
    console.error('Error fetching location from IP:', error.message);
    // Return a fallback value instead of throwing
    return 'Unknown';
  }
};

module.exports = {
  getLocationFromIP
};

