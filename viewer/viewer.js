import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { setupRenderer, requestOrientationPermissionIfNeeded, ensureVideoAutoplay, makeVideoTexture, haversineMeters } from "../shared/parite.js";

const canvas = document.getElementById("canvas");
const startBtn = document.getElementById("start");
const info = document.getElementById("info");

let renderer, scene, camera, dirLight, hemi, ground, model;
const loader = new GLTFLoader();

function parseProjectFromURL(){
  const params = new URLSearchParams(location.search);
  const data = params.get("data");
  if(!data) return null;
  try{ return JSON.parse(decodeURIComponent(data)); }catch{ return null; }
}

async function startAR(){
  const project = parseProjectFromURL();
  if(!project){ info.textContent = "Geçerli proje verisi bulunamadı."; return; }

  // Orientation permission (iOS)
  const ok = await requestOrientationPermissionIfNeeded();
  if(!ok){ info.textContent = "Yön izni verilmedi."; }

  // Camera stream
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } }, audio: false
  });
  const video = document.createElement("video");
  video.srcObject = stream;
  ensureVideoAutoplay(video);

  // Three setup
  renderer = setupRenderer(canvas);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, canvas.clientWidth/canvas.clientHeight, 0.1, 2000);
  camera.position.set(0,1.6,3);

  // Background as camera feed
  const tex = makeVideoTexture(video);
  scene.background = tex;

  // Lights
  hemi = new THREE.HemisphereLight(0xffffff,0x444444,0.6);
  scene.add(hemi);

  dirLight = new THREE.DirectionalLight(0xffffff, project.render.lightIntensity);
  dirLight.position.set(5,10,5);
  dirLight.castShadow = project.render.shadow;
  dirLight.shadow.mapSize.set(2048,2048);
  scene.add(dirLight);

  ground = new THREE.ShadowMaterial({ opacity:0.35 });
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(200,200), ground);
  groundMesh.rotation.x = -Math.PI/2;
  groundMesh.receiveShadow = project.render.shadow;
  scene.add(groundMesh);

  // Load model
  if(project.models && project.models[0]){
    const url = project.models[0].blobUrl || project.models[0].url;
    loader.load(url, gltf=>{
      model = gltf.scene;
      model.traverse(o=>{
        if(o.isMesh){ o.castShadow = project.render.shadow; o.receiveShadow = project.render.shadow; }
      });
      const s = project.transform.scaleMeters;
      model.scale.setScalar(s);
      model.rotation.y = THREE.MathUtils.degToRad(project.transform.rotationDeg);
      model.position.set(project.transform.offsetX, project.target.altitude, project.transform.offsetZ);
      scene.add(model);
    });
  }

  // Geolocation watch + distance badge
  const badge = document.createElement("div");
  badge.className = "badge";
  badge.textContent = "Konum bekleniyor…";
  document.body.appendChild(badge);

  navigator.geolocation.watchPosition(pos=>{
    const { latitude, longitude } = pos.coords;
    const d = haversineMeters(latitude, longitude, project.target.lat, project.target.lon);
    badge.textContent = `Hedefe mesafe: ${d.toFixed(1)} m`;
  }, err=>{
    badge.textContent = "Konum alınamadı.";
    console.warn(err);
  }, { enableHighAccuracy:true, maximumAge:1000, timeout:10000 });

  // Render loop
  renderer.setAnimationLoop(()=>renderer.render(scene, camera));
  info.textContent = "AR aktif.";
}

startBtn.addEventListener("click", startAR);
