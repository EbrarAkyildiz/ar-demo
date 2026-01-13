export const toRad = d => d * Math.PI / 180;

export function calcOffset(uLat, uLon, tLat, tLon) {
  const R = 6371000;
  const dLat = toRad(tLat - uLat);
  const dLon = toRad(tLon - uLon);
  return {
    x: dLon * Math.cos(toRad(uLat)) * R,
    z: -dLat * R
  };
}

export function bearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.cos(toRad(lon2 - lon1));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
