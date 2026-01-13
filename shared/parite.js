// iOS/Android parite yardımcıları

export function setupRenderer(canvas){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function haversineMeters(lat1, lon1, lat2, lon2){
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function requestOrientationPermissionIfNeeded(){
  const isIOS = typeof DeviceOrientationEvent !== "undefined" &&
                typeof DeviceOrientationEvent.requestPermission === "function";
  if(isIOS){
    try{
      const res = await DeviceOrientationEvent.requestPermission();
      return res === "granted";
    }catch{ return false; }
  }
  return true;
}

export function ensureVideoAutoplay(video){
  video.setAttribute("playsinline","true");
  video.muted = true;
  const play = () => video.play().catch(()=>{});
  document.body.addEventListener("touchstart", play, { once:true });
  document.body.addEventListener("click", play, { once:true });
}

export function makeVideoTexture(video){
  const tex = new THREE.VideoTexture(video);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
