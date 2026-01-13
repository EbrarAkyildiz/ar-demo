export function toRad(d) { return d * Math.PI / 180; }

export function metersPerDegree(latDeg) {
  const latMeters = 111320;
  const lonMeters = 111320 * Math.cos(toRad(latDeg));
  return { latMeters, lonMeters };
}

export function calcOffset(userLat, userLon, targetLat, targetLon) {
  const { latMeters, lonMeters } = metersPerDegree(userLat);
  const dLat = targetLat - userLat;
  const dLon = targetLon - userLon;
  return {
    x: dLon * lonMeters,   // doğu (+), batı (-)
    y: 0,
    z: -(dLat * latMeters) // kuzey ileri: -z
  };
}

export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function bearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.cos(toRad(lon2 - lon1));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function smooth(prev, next, alpha = 0.08) {
  return prev * (1 - alpha) + next * alpha;
}

export function updateHUD({ acc, dist, brg }) {
  const accEl = document.getElementById("hud-acc");
  const distEl = document.getElementById("hud-dist");
  const brgEl = document.getElementById("hud-brg");
  if (accEl) accEl.textContent = `ACC: ${acc != null ? Math.round(acc) + "m" : "—"}`;
  if (distEl) distEl.textContent = `DIST: ${dist != null ? Math.round(dist) + "m" : "—"}`;
  if (brgEl) brgEl.textContent = `BRG: ${brg != null ? Math.round(brg) + "°" : "—"}`;
}
