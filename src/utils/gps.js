const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Calculate distance between two GPS coordinates in meters
// Using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  try {
    // Validate input
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
        typeof lat2 !== 'number' || typeof lon2 !== 'number') {
      throw new Error('Invalid GPS coordinates: all parameters must be numbers');
    }
    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }

    if (isDevelopment) {
      console.log('[GPS] Calculating distance using Haversine formula');
      console.log('[GPS] Point 1:', { lat: lat1, lon: lon1 });
      console.log('[GPS] Point 2:', { lat: lat2, lon: lon2 });
    }

    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    
    if (isDevelopment) {
      console.log('[GPS] Distance calculated:', Math.round(distance), 'meters');
    }

    return distance;
  } catch (error) {
    console.error('[GPS ERROR]', new Date().toISOString());
    console.error('[GPS ERROR] Message:', error.message);
    if (isDevelopment) {
      console.error('[GPS ERROR] Stack:', error.stack);
      console.error('[GPS ERROR] Coordinates:', { lat1, lon1, lat2, lon2 });
    }
    throw error;
  }
}

// Determine GPS verdict based on distance
function getGpsVerdict(distanceMeters) {
  if (distanceMeters <= 100) return 'pass';
  if (distanceMeters <= 300) return 'near';
  return 'flagged';
}

module.exports = {
  calculateDistance,
  getGpsVerdict
};

