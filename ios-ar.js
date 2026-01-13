import * as THREE from "https://esm.sh/three@0.155.0";
import { GLTFLoader } from "https://esm.sh/three@0.155.0/examples/jsm/loaders/GLTFLoader.js";
import {
  calcOffset,
  bearing,
  toRad,
  smooth,
  haversine,
  updateHUD
} from "./utils.js";

/* iOS pusula izni */
async function requestOrientationPermission() {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      return res === "granted";
    } catch {
      return false;
    }
  }
  return true; // Android / eski iOS
}

export const iosAR = {
  async start(cfg) {
    const canvas = document.getElementById("canvas");

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    /* Scene & Camera */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      20000
    );
    camera.position.set(0, 1.6, 0);

    /* Light */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));

    /* Kamera stream (yüksek kalite) */
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: cfg.iosCamera?.width ?? 1920 },
        height: { ideal: cfg.iosCamera?.height ?? 1080 },
        frameRate: { ideal: cfg.iosCamera?.frameRate ?? 30 }
      },
      audio: false
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.playsInline = true;
    await video.play();

    const videoTex = new THREE.VideoTexture(video);
    videoTex.minFilter = THREE.LinearFilter;
    videoTex.magFilter = THREE.LinearFilter;
    videoTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = videoTex;

    /* Model */
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(cfg.model);
    const building = gltf.scene;
    building.scale.set(cfg.scale, cfg.scale, cfg.scale);
    building.visible = false;
    scene.add(building);

    /* Heading (pusula) */
    let heading = 0;
    const granted = await requestOrientationPermission();
    if (!granted) {
      console.warn("iOS pusula izni verilmedi – yaklaşık yön kullanılacak");
    }

    // Standart
    window.addEventListener("deviceorientation", (e) => {
      if (e.alpha != null) {
        const target = 360 - e.alpha;
        heading = smooth(heading, target, 0.08);
      }
    });

    // Daha stabil (varsa)
    window.addEventListener("deviceorientationabsolute", (e) => {
      if (e.alpha != null) {
        const target = 360 - e.alpha;
        heading = smooth(heading, target, 0.05);
      }
    });

    /* Yerleştirme */
    function updatePlacement() {
      if (cfg.userLat == null || cfg.userLon == null) return;

      const off = calcOffset(cfg.userLat, cfg.userLon, cfg.lat, cfg.lon);
      const br = bearing(cfg.userLat, cfg.userLon, cfg.lat, cfg.lon);

      const rel = (br - heading + 360) % 360;
      const rad = toRad(rel);
      const dist = Math.hypot(off.x, off.z);

      const x = Math.sin(rad) * dist;
      const z = Math.cos(rad) * dist;

      building.position.set(x, cfg.altitude, -z);
      building.visible = true;

      const d = haversine(cfg.userLat, cfg.userLon, cfg.lat, cfg.lon);
      updateHUD({ dist: d, brg: br });
    }

    /* Loop */
    function animate() {
      updatePlacement();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    /* Resize */
    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
  }
};
