const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

let modelPlaced = false;
let hitTestSource = null;

const createScene = async () => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  // Kamera (kilitli)
  const camera = new BABYLON.FreeCamera(
    "camera",
    new BABYLON.Vector3(0, 1.6, 0),
    scene
  );
  camera.detachControl();

  // Işık
  new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  // WebXR AR
  const xr = await scene.createDefaultXRExperienceAsync({
    uiOptions: { sessionMode: "immersive-ar" },
    optionalFeatures: true
  });

  const sessionManager = xr.baseExperience.sessionManager;

  // MODELİ YÜKLE (AMA BAŞTA GİZLİ)
  const result = await BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "models/",
    "bina.glb",
    scene
  );

  const modelRoot = result.meshes[0];
  modelRoot.setEnabled(false);

  // HIT TEST (ZEMİN ALGILAMA)
  sessionManager.onXRSessionInit.add(() => {
    sessionManager.session
      .requestReferenceSpace("viewer")
      .then(viewerSpace => {
        sessionManager.session
          .requestHitTestSource({ space: viewerSpace })
          .then(source => hitTestSource = source);
      });
  });

  sessionManager.onXRFrameObservable.add(() => {
    if (!hitTestSource || modelPlaced) return;

    const frame = sessionManager.currentFrame;
    const referenceSpace = sessionManager.referenceSpace;
    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);

      modelRoot.position.set(
        pose.transform.position.x,
        pose.transform.position.y,
        pose.transform.position.z
      );

      modelRoot.rotationQuaternion = new BABYLON.Quaternion(
        pose.transform.orientation.x,
        pose.transform.orientation.y,
        pose.transform.orientation.z,
        pose.transform.orientation.w
      );

      modelRoot.setEnabled(true);
      modelPlaced = true; // 🔒 SABİTLENDİ
    }
  });

  return scene;
};

createScene().then(scene => {
  engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", () => engine.resize());
