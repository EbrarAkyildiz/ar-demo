import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ alpha:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

const loader = new GLTFLoader();
loader.load("./bina.glb", gltf => {
  scene.add(gltf.scene);
});

function animate(){
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
