import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { setupRenderer } from "../shared/parite.js";

let project = {
  target: { lat: 41.017040, lon: 28.858800, altitude: 0 },
  transform: { scaleMeters: 10, rotationDeg: 0, offsetX: 0, offsetZ: 0 },
  render: { lightIntensity: 1, shadow: true },
  models: []
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
      project.target.lat = parseFloat(lat); project.target.lon = parseFloat(lon);
      marker.setLatLng([project.target.lat, project.target.lon]);
      map.setView([project.target.lat, project.target.lon], 18);
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
const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth/canvas.clientHeight, 0.1, 200
