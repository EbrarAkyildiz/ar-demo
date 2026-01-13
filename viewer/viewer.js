import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  setupRenderer,
  requestOrientationPermissionIfNeeded,
  ensureVideoAutoplay,
  makeVideoTexture,
  haversineMeters
} from "../shared/parite.js";

const canvas = document.getElementById("canvas");
const startBtn = document.getElementById("start");
const info = document.getElementById("info");

let renderer, scene, camera, dirLight, hemi, model;

function parseProjectFromURL(){
  const params = new URLSearchParams(location.search);
  const data = params.get("data");
  if(!data) return null;
  try{ return JSON.parse(decodeURIComponent(data)); }catch{ return null; }
}

async function startAR(){
  const project = parseProjectFromURL();
  if(!project){ info.textContent = "Geçerli proje verisi bulunamadı."; return; }

  await requestOrientationPermissionIfNeeded();

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } }, audio: false
  });
  const video = document.createElement("video");
  video.srcObject = stream;
  ensureVideoAutoplay(video);

  renderer = setupRenderer(canvas);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, canvas.clientWidth/canvas.clientHeight, 0.1, 2000);
  camera.position.set(0,1.6,3);

  const tex = makeVideoTexture(video);
  scene.background = tex;

  hemi = new THREE.HemisphereLight(0xffffff,0x444444,0.6);
  scene.add(hemi);

  dirLight = new THREE.DirectionalLight(0xffffff, project.render.lightIntensity);
  dirLight.position.set(5,10,5);
  dirLight.castShadow = project.render.shadow;
  dirLight.shadow.mapSize.set(2048,2048);
  scene.add(dirLight);

  const groundMat = new THREE.ShadowMaterial({ opacity:0.35 });
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(200,200), groundMat);
  groundMesh.rotation.x = -Math.PI/2;
  groundMesh.receiveShadow = project.render.shadow;
  scene.add(groundMesh);

  if(project.models && project.models[0]){
    const url = project.models[0].url;
    const loader = new GLTFLoader();
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

  renderer.setAnimationLoop(()=>renderer.render(scene, camera));
  info.textContent = "AR aktif.";
}

startBtn.addEventListener("click", startAR);
