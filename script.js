
// Canvas ve engine
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Sahne oluştur
const createScene = function () {
  const scene = new BABYLON.Scene(engine);

  // Kamera
  const camera = new BABYLON.ArcRotateCamera("camera",
    Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  // Işık
  const light = new BABYLON.HemisphericLight("light",
    new BABYLON.Vector3(0, 1, 0), scene);

  // Demo bina modeli yükle
  BABYLON.SceneLoader.Append("models/", "bina.glb", scene, function (scene) {
    scene.createDefaultCameraOrLight(true, true, true);
  });

  return scene;
};

const scene = createScene();
engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
