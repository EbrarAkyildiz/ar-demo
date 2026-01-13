import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/loaders/GLTFLoader.js";
import { calcOffset, bearing, toRad, smooth, haversine, updateHUD } from "./utils.js";

async function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      return res === "granted";
    } catch {
      return false;
    }
  }
  return true; // eski iOS/Android
}

export const iosAR = {
  async start(cfg) {
    const canvas = document.getElementById("canvas");
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 20000);
    camera.position.set(0, 1.6, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(hemi);

    // Kamera akışı — yüksek kalite constraints
    const constraints = {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: cfg.iosCamera?.width ?? 1920 },
        height: { ideal: cfg.iosCamera?.height ?? 1080 },
        frameRate: { ideal: cfg.iosCamera?.frameRate ?? 30 }
      },
      audio: false
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();
    const videoTex = new THREE.VideoTexture(video);
    videoTex.minFilter = THREE.LinearFilter;
    videoTex.magFilter = THREE.LinearFilter;
    videoTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = videoTex;

    // Model
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(cfg.model);
    const building = gltf.scene;
    building.scale.set(cfg.scale, cfg.scale, cfg.scale);
    building.visible = false;
    scene.add(building);

    // Heading (pusula) izni ve okuma
    let heading = 0;
    const granted = await requestOrientationPermission();
    if (!granted) console.warn("Heading izni verilmedi—yaklaşık yerleştirme yapılacak.");

    window.addEventListener("deviceorientation", (e) => {
      if (e.alpha != null) {
        const target = (360 - e.alpha);
        heading = smooth(heading, target, 0.08);
      }
    });

    // Konum güncellemesi ile HUD ve yerleştirme
    function updatePlacement() {
      const off = calcOffset(cfg.userLat, cfg.userLon, cfg.lat, cfg.lon);
      const br = bearing(cfg.userLat, cfg.userLon, cfg.lat, cfg.lon);
      const rel = ((br - heading) + 360) % 360;
      const rad = toRad(rel);
      const dist = Math.hypot(off.x, off.z);

      const x = Math.sin(rad) * dist;
      const z = Math.cos(rad) * dist;

      building.position.set(x, cfg.altitude, -z);
      building.visible = true;

      const d = haversine(cfg.userLat, cfg.userLon, cfg.lat, cfg.lon);
      updateHUD({ dist: d, brg: br });
    }

    function animate() {
      updatePlacement();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener("resize", () => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    });
  }
};
