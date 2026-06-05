const MAX_SPEED_KMH = 15;
const MIN_DURATION_MIN = 5;
const MIN_DISTANCE_M = 200;

function haversineMeters(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function validateWalkSession(session) {
  const flags = [];
  const points = session.points || [];
  let distance = 0;

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const seg = haversineMeters(prev, curr);
    distance += seg;
    const dtHours = (new Date(curr.timestamp) - new Date(prev.timestamp)) / 3600000;
    if (dtHours > 0) {
      const speedKmh = (seg / 1000) / dtHours;
      if (speedKmh > MAX_SPEED_KMH) flags.push('speed_too_high');
      if (seg > 500 && dtHours < 0.01) flags.push('teleport_suspected');
    }
  }

  const durationMinutes = session.durationMinutes || 0;
  if (durationMinutes < MIN_DURATION_MIN) flags.push('duration_too_short');
  if (distance < MIN_DISTANCE_M) flags.push('distance_too_short');

  const validated = flags.length === 0 && durationMinutes >= MIN_DURATION_MIN;
  return { validated, distanceMeters: Math.round(distance), cheatFlags: [...new Set(flags)] };
}
