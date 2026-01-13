import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { setupRenderer } from "../shared/parite.js";

let project = {
  target: { lat: 41.017040, lon: 28.858800, altitude: 0 },
  transform: { scaleMeters: 10, rotationDeg: 0, offsetX: 0, offsetZ: 0 },
  render: { lightIntensity: 1, shadow: true },
  models: [] // { name, blobUrl }
};

// Leaflet map
const map = L.map("map").setView([project.target.lat, project.target.lon], 18);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"© OSM" }).addTo(map);
const marker = L.marker([project.target.lat, project.target.lon], { draggable:true }).addTo(map);
marker.on("dragend", () => {
  const { lat, lng } = marker.getLatLng();
  project.target.lat = lat; project.target.lon = lng;
});

// Street search (Nominatim)
document.getElementById("searchStreet").addEventListener("click", async ()=>{
  const q = document.getElementById("streetInput").value.trim();
  if(!q) return;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
  try{
    const res = await fetch(url, { headers: { "Accept-Language":"tr" }});
    const data = await res.json();
    if(data.length){
      const { lat, lon } = data[0];
      const latNum = parseFloat(lat), lonNum = parseFloat(lon);
      project.target.lat = latNum; project.target.lon = lonNum;
      marker.setLatLng([latNum, lonNum]);
      map.setView([latNum, lonNum], 18);
    }
  }catch(e){ console.warn("Geocoding error", e); }
});

// Altitude
document.getElementById("altitudeInput").addEventListener("input", e=>{
  project.target.altitude = parseFloat(e.target.value) || 0;
});

// Three.js preview
const canvas = document.getElementById("canvas");
const renderer = setupRenderer(canvas);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth/canvas.clientHeight, 0.1, 2000);
camera.position.set(0,1.6,3);

// Lights
const hemi = new THREE.HemisphereLight(0xffffff,0x444444,0.6);
scene.add(hemi);

const dirLight = new THREE.DirectionalLight(0xffffff, project.render.lightIntensity);
dirLight.position.set(5,10,5);
dirLight.castShadow = project.render.shadow;
dirLight.shadow.mapSize.set(2048,2048);
scene.add(dirLight);

// Ground shadow catcher
const groundMat = new THREE.ShadowMaterial({ opacity:0.4 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200), groundMat);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

// Model handling
let model;
const loader = new GLTFLoader();
const modelList = document.getElementById("modelList");

document.getElementById("modelFile").addEventListener("change", e=>{
  const file = e.target.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  project.models = [{ name:file.name, blobUrl:url }];

  // UI list
  modelList.innerHTML = `<li>${file.name}</li>`;

  // Load preview
  loader.load(url, gltf=>{
    if(model) scene.remove(model);
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
});

// Controls
document.getElementById("scaleSlider").addEventListener("input", e=>{
  const s = parseFloat(e.target.value);
  project.transform.scaleMeters = s;
  if(model) model.scale.setScalar(s);
});

document.getElementById("rotationSlider").addEventListener("input", e=>{
  const deg = parseFloat(e.target.value);
  project.transform.rotationDeg = deg;
  if(model) model.rotation.y = THREE.MathUtils.degToRad(deg);
});

document.getElementById("offsetX").addEventListener("input", e=>{
  const x = parseFloat(e.target.value) || 0;
  project.transform.offsetX = x;
  if(model) model.position.x = x;
});

document.getElementById("offsetZ").addEventListener("input", e=>{
  const z = parseFloat(e.target.value) || 0;
  project.transform.offsetZ = z;
  if(model) model.position.z = z;
});

document.getElementById("lightIntensity").addEventListener("input", e=>{
  const val = parseFloat(e.target.value);
  project.render.lightIntensity = val;
  dirLight.intensity = val;
});

document.getElementById("shadowToggle").addEventListener("change", e=>{
  const on = e.target.value === "on";
  project.render.shadow = on;
  dirLight.castShadow = on;
  ground.receiveShadow = on;
  if(model){
    model.traverse(o=>{
      if(o.isMesh){ o.castShadow = on; o.receiveShadow = on; }
    });
  }
});

// Render loop
renderer.setAnimationLoop(()=>renderer.render(scene,camera));

// Save JSON
document.getElementById("saveProject").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(project,null,2)], { type:"application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "project.json";
  a.click();
});

// Generate viewer link
document.getElementById("generateLink").addEventListener("click", ()=>{
  const encoded = encodeURIComponent(JSON.stringify(project));
  const url = `${location.origin}${location.pathname.replace(/admin\/index\.html$/,"")}viewer/index.html?data=${encoded}`;
  document.getElementById("shareLink").textContent = url;
});

// New project
document.getElementById("newProject").addEventListener("click", ()=>{
  project = {
    target: { lat: 41.017040, lon: 28.858800, altitude: 0 },
    transform: { scaleMeters: 10, rotationDeg: 0, offsetX: 0, offsetZ: 0 },
    render: { lightIntensity: 1, shadow: true },
    models: []
  };
  modelList.innerHTML = "";
  document.getElementById("scaleSlider").value = 10;
  document.getElementById("rotationSlider").value = 0;
  document.getElementById("offsetX").value = 0;
  document.getElementById("offsetZ").value = 0;
  document.getElementById("lightIntensity").value = 1;
  document.getElementById("shadowToggle").value = "on";
});
