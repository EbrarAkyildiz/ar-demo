/************ AYARLAR ************/
const siteLat = 41.017478;   // Arsa enlem
const siteLon = 28.858917;   // Arsa boylam
const SCALE_FACTOR = 0.01;   // iPhone için ideal
/********************************/

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const startBtn = document.getElementById("startAR");

startBtn.onclick = () => {
  startBtn.style.display = "none";
  startAR();
};

async function startAR() {
  if (!navigator.geolocation) {
    alert("Konum desteklenmiyor");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {

    const userLat = pos.coords.latitude;
    const userLon = pos.coords.longitude;

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    // 🔒 Sabit kamera
    const camera = new BABYLON.FreeCamera(
      "camera",
      new BABYLON.Vector3(0, 1.6, 0),
      scene
    );
    camera.detachControl();

    // 💡 Işık
    new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );

    // 📱 WebXR + HIT TEST
    const xr = await scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar" },
      optionalFeatures: true
    });

    const hitTest = xr.baseExperience.featuresManager.enableFeature(
      BABYLON.WebXRHitTest,
      "latest"
    );

    // 🏗️ Model yükle
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "models/",
      "bina.glb",
      scene
    );

    const bina = result.meshes[0];
    bina.isVisible = false;

    bina.scaling.setAll(SCALE_FACTOR);

    // 🌍 GPS → metre dönüşümü
    const metersPerLat = 111320;
    const metersPerLon =
      40075000 * Math.cos(userLat * Math.PI / 180) / 360;

    const gpsX = (siteLon - userLon) * metersPerLon;
    const gpsZ = (siteLat - userLat) * metersPerLat;

    // 🎯 HIT TEST + GPS birleşimi
    hitTest.onHitTestResultObservable.add((results) => {
      if (!results.length) return;

      const hit = results[0];
      const matrix = BABYLON.Matrix.FromArray(hit.transformationMatrix);
      const position = matrix.getTranslation();

      // Zemine oturur + GPS offset
      bina.position.x = position.x + gpsX;
      bina.position.y = position.y;
      bina.position.z = position.z + gpsZ;

      bina.isVisible = true;
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

  }, () => {
    alert("Konum izni verilmedi");
  }, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
}

window.addEventListener("resize", () => engine.resize());
