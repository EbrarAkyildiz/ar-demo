let scene, camera, renderer;
let model;
let xrSession;

const startBtn = document.getElementById("start");

startBtn.addEventListener("click", startAR);

async function startAR() {

  if (!navigator.xr) {
    alert("WebXR desteklenmiyor");
    return;
  }

  const supported = await navigator.xr.isSessionSupported("immersive-ar");
  if (!supported) {
    alert("AR desteklenmiyor");
    return;
  }

  xrSession = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["local-floor"]
  });

  startBtn.style.display = "none";

  // Renderer
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.xr.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.xr.setSession(xrSession);

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera();

  // Light
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Load model
  const loader = new THREE.GLTFLoader();
  loader.load(
    "model.glb",
    (gltf) => {
      model = gltf.scene;

      // 🔒 SABİT POZİSYON (SENİN BELİRLEDİĞİN YER)
      model.position.set(0, 0, -4); // ileri – geri
      model.rotation.set(0, Math.PI, 0);
      model.scale.set(1, 1, 1);

      scene.add(model);
    },
    undefined,
    (err) => {
      console.error("Model yüklenemedi", err);
    }
  );

  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}

