const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const info = document.getElementById("info");

const createScene = async () => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  const camera = new BABYLON.FreeCamera(
    "camera",
    new BABYLON.Vector3(0, 1.6, 0),
    scene
  );
  camera.detachControl();

  new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  // 🔥 AR EXPERIENCE
  const xr = await scene.createDefaultXRExperienceAsync({
    uiOptions: {
      sessionMode: "immersive-ar",
      referenceSpaceType: "local-floor"
    }
  });

  info.innerText = "AR butonuna bas";

  // MODEL
  const result = await BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "models/",
    "bina.glb",
    scene
  );

  const model = result.meshes[0];
  model.scaling.setAll(1);
  model.setEnabled(false);

  xr.baseExperience.onStateChangedObservable.add((state) => {
    if (state === BABYLON.WebXRState.IN_XR) {
      model.position = new BABYLON.Vector3(0, 0, -2);
      model.setEnabled(true);
      info.innerText = "Bina yerleştirildi";
    }
  });

  return scene;
};

createScene().then(scene => {
  engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", () => engine.resize());
