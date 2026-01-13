const video = document.getElementById("camera");
const canvas = document.getElementById("arCanvas");

async function startAR() {
  // Kamera
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false
  });
  video.srcObject = stream;
  await video.play();

  // Three.js
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();

  const camera3D = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera3D.position.set(0, 1.6, 0);

  // Işık
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

  // MODEL
  const loader = new THREE.GLTFLoader();
  loader.load(
    "bina.glb",
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.3, 0.3, 0.3);
      model.position.set(0, 0, -5); // kameranın önünde
      scene.add(model);
    },
    undefined,
    (err) => {
      console.error("MODEL YÜKLENMEDİ", err);
    }
  );

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);
  }
  animate();
}

document.getElementById("startBtn").onclick = startAR;
