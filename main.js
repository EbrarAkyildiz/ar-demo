import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/loaders/GLTFLoader.js";

const TARGET = { lat:41.017040, lon:28.858800, scale:0.3 };
const info = document.getElementById("info");

let heading = 0;

// iOS için yön izni
if (typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function") {
  document.body.addEventListener("click", async () => {
    await DeviceOrientationEvent.requestPermission();
  }, { once:true });
}

window.addEventListener("deviceorientation", e => {
  if (e.alpha !== null) heading = e.alpha;
});

// THREE setup
const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ canvas, alpha:true });
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 2000);
camera.position.set(0,1.6,0);

scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1));
const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(5,10,5);
scene.add(light);

// Kamera arka plan
navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" } })
.then(stream=>{
  const v=document.createElement("video");
  v.srcObject=stream; v.play();
  scene.background=new THREE.VideoTexture(v);
});

// Model
let model;
new GLTFLoader().load("./bina.glb", g=>{
  model=g.scene;
  model.scale.setScalar(TARGET.scale);
  model.position.set(0,0,-5); // ÖNÜNDE
  scene.add(model);
});

// Bearing
function bearing(lat1, lon1, lat2, lon2){
  const r=d=>d*Math.PI/180;
  const y=Math.sin(r(lon2-lon1))*Math.cos(r(lat2));
  const x=Math.cos(r(lat1))*Math.sin(r(lat2))-
          Math.sin(r(lat1))*Math.cos(r(lat2))*Math.cos(r(lon2-lon1));
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}

// GPS
navigator.geolocation.watchPosition(pos=>{
  const {latitude,longitude}=pos.coords;
  const b=bearing(latitude,longitude,TARGET.lat,TARGET.lon);
  const rel=(b-heading+360)%360;

  let dir="önünde";
  if(rel>45&&rel<=135) dir="sağında";
  else if(rel>135&&rel<=225) dir="arkanda";
  else if(rel>225&&rel<=315) dir="solunda";

  info.textContent=`Obje ${dir}`;
});

// Render
(function animate(){
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
})();
