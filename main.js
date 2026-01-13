import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Senin odanın GPS bilgisi (model sabit; konum izni sadece doğrulama/mesaj için)
const TARGET = { lat: 41.017040, lon: 28.858800, altitude: 0, scale: 1 };

const canvas = document.getElementById("canvas");
const info = document.getElementById("info");
const startBtn = document.getElementById("start");

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 1.6, 3);

// Gerçekçi ışıklar ve gölge
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(5, 10, 5);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
dir.shadow.camera.near = 0.5;
dir.shadow.camera.far = 50;
dir.shadow.camera.left = -10;
dir.shadow.camera.right = 10;
dir.shadow.camera.top = 10;
dir.shadow.camera.bottom = -10;
scene.add(dir);

// Zemin (gölgeyi alır, model zemine oturur)
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Model referansı
let model;

// Modeli yükle ve pivotu zemine oturt
function loadModel() {
  const loader = new GLTFLoader();
  loader.load(
    "./bina.glb",
    (gltf) => {
      model = gltf.scene;
      model.scale.set(TARGET.scale, TARGET.scale, TARGET.scale);
      model.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });

      // Pivotu zemine oturtmak için bounding box ile düzeltme
      const box = new THREE.Box3().setFromObject(model);
      const minY = box.min.y;
      model.position.set(0, -minY, 0); // zemine oturt
      scene.add(model);

      info.textContent = "Model yüklendi ve zemine sabitlendi.";
    },
    undefined,
    (err) => {
      info.textContent = "Model yüklenemedi: " + err.message;
    }
  );
}

// Kamera akışını başlat (iOS için playsinline ve user gesture şart)
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.setAttribute("playsinline", "true"); // iOS için gerekli
    await video.play();

    const tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBFormat;

    scene.background = tex;
    info.textContent = "Kamera açık.";
  } catch (err) {
    info.textContent = "Kamera izni reddedildi: " + err.message;
    throw err;
  }
}

// Konum iznini iste ve bilgi ver (model sabit; konum sadece doğrulama/mesaj)
function startGeolocation() {
  if (!("geolocation" in navigator)) {
    info.textContent = "Geolocation desteklenmiyor.";
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const distMeters = haversineMeters(latitude, longitude, TARGET.lat, TARGET.lon);
      info.textContent = `Kamera açık. Konum: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} — Hedefe ~${distMeters.toFixed(1)} m`;
    },
    (err) => {
      info.textContent = "Konum izni reddedildi: " + err.message;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// Haversine ile yaklaşık mesafe (metre)
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Dünya yarıçapı (m)
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Başlat butonu: user gesture ile hem kamera hem konum izni istenir
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  startBtn.textContent = "Başlatılıyor…";
  info.textContent = "İzinler isteniyor…";

  try {
    await startCamera();
    startGeolocation();
    loadModel();
    startBtn.style.display = "none";
  } catch {
    startBtn.disabled = false;
    startBtn.textContent = "AR'ı Başlat";
  }
});

// Render ve resize
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
