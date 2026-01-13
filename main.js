// Three.js ve GLTFLoader aynı sürümden import edilmeli
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/loaders/GLTFLoader.js";

const TARGET = { lat:41.017040, lon:28.858800, altitude:82, scale:0.3 };
const info = document.getElementById("info");

// Renderer + sahne + kamera
const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ canvas, alpha:true });
renderer.setSize(window.innerWidth, window.innerHeight);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(0,1.6,3);

// Işıklar
scene.add(new THREE.HemisphereLight(0xffffff,0x444444,0.8));
const dir = new THREE.DirectionalLight(0xffffff,0.9);
dir.position.set(5,10,5);
scene.add(dir);

// Kamera arka plan (video bindirme)
navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" } })
.then(stream=>{
  const video = document.createElement("video");
  video.srcObject = stream;
  video.play();
  const tex = new THREE.VideoTexture(video);
  scene.background = tex;
});

// Model yükleme
const loader = new GLTFLoader();
loader.load("./bina.glb", (gltf)=>{
  const model = gltf.scene;
  model.scale.set(TARGET.scale,TARGET.scale,TARGET.scale);
  model.position.set(0,TARGET.altitude,0);
  scene.add(model);
});

// Bearing hesaplama
function bearing(lat1, lon1, lat2, lon2){
  const toRad = d=>d*Math.PI/180;
  const dLon = toRad(lon2-lon1);
  lat1=toRad(lat1); lat2=toRad(lat2);
  const y=Math.sin(dLon)*Math.cos(lat2);
  const x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}

// GPS + yön takibi
navigator.geolocation.watchPosition((pos)=>{
  const userLat=pos.coords.latitude, userLon=pos.coords.longitude;
  const dist = Math.hypot(userLat-TARGET.lat, userLon-TARGET.lon)*111000; // yaklaşık metre
  window.addEventListener("deviceorientation",(e)=>{
    const heading=e.alpha || 0; // cihaz yönü
    const b=bearing(userLat,userLon,TARGET.lat,TARGET.lon);
    const rel=(b-heading+360)%360;
    let dir="önünde";
    if(rel>=45 && rel<135) dir="sağında";
    else if(rel>=135 && rel<225) dir="arkanda";
    else if(rel>=225 && rel<315) dir="solunda";
    info.textContent=`Obje ${dir}, yaklaşık ${dist.toFixed(1)} m`;
  });
});

// Render loop
function animate(){
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
animate();
