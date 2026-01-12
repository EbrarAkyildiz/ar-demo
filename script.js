const canvas = document.getElementById("renderCanvas");
const statusEl = document.getElementById("status");
const arBtn = document.getElementById("arBtn");
const placeBtn = document.getElementById("placeBtn");

const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
let scene, xrHelper, building;

// === MODEL YOLU ===
const MODEL_PATH = "models/";
const MODEL_FILE = "bina.glb";

// === HEDEF KOORDİNAT ===
// Burayı değiştirerek inşaat sahasının GPS konumunu ayarlıyorsun.
// Örneğin Ankara Kızılay için:
const siteLat = 41.017476;
const siteLon = 28.859071;

// Metre-derece dönüşümü
function metersPerDegree(lat) {
  const latMeters = 111320;
  const lonMeters = 111320 * Math.cos(lat * Math.PI / 180);
  return { latMeters, lonMeters };
}

function geoOffsetToScene(userLat, userLon, targetLat, targetLon) {
  const m = metersPerDegree(userLat);
  const dLat = targetLat - userLat;
  const dLon = targetLon - userLon;
  const x = dLon * m.lonMeters;
  const z = -dLat * m.latMeters;
  return new BABYLON.Vector3(x, 0, z);
}

async function createScene() {
  scene = new BABYLON.Scene(engine);
  scene.createDefaultLight(true);
  scene.createDefaultEnvironment({ createGround: true, groundSize: 50 });

  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 20, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  // Model yükle
  await BABYLON.SceneLoader.AppendAsync(MODEL_PATH, MODEL_FILE, scene);
  building = scene.meshes[scene.meshes.length - 1];
  building.scaling.set(0.5, 0.5, 0.5);
  building.setEnabled(false);

  // Konum izni
  let userPosition = null;
  try {
    userPosition = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
    });
    statusEl.textContent = "Konum alındı.";
  } catch (e) {
    statusEl.textContent = "Konum alınamadı.";
  }

  // AR başlat
  arBtn.onclick = async () => {
    try {
      xrHelper = await scene.createDefaultXRExperienceAsync({
        uiOptions: { sessionMode: "immersive-ar" },
        optionalFeatures: ["hit-test", "anchors"]
      });

      const featuresManager = xrHelper.baseExperience.featuresManager;
      const hitTest = featuresManager.enableFeature(BABYLON.WebXRHitTest, "latest");
      const anchors = featuresManager.enableFeature(BABYLON.WebXRAnchorSystem, "latest");

      let offset = new BABYLON.Vector3(0, 0, 0);
      if (userPosition) {
        offset = geoOffsetToScene(
          userPosition.coords.latitude,
          userPosition.coords.longitude,
          siteLat,
          siteLon
        );
      }

      let lastHitPose = null;
      hitTest.onHitTestResultObservable.add((results) => {
        if (results.length > 0) {
          lastHitPose = results[0];
          statusEl.textContent = "Yüzey bulundu. Modeli yerleştirebilirsin.";
          placeBtn.disabled = false;
        }
      });

      placeBtn.onclick = () => {
        if (!lastHitPose) return;
        const anchor = anchors.addAnchorPointUsingHitTestResult(lastHitPose);
        anchor.onAnchorAddedObservable.add((anchorNode) => {
          const parent = new BABYLON.TransformNode("buildingAnchor", scene);
          parent.setParent(anchorNode);
          parent.position.addInPlace(offset);

          building.setEnabled(true);
          building.setParent(parent);
          statusEl.textContent = "Model yerleştirildi.";
          placeBtn.disabled = true;
        });
      };

    } catch (err) {
      statusEl.textContent = "AR başlatılamadı, 3D modda gösteriliyor.";
      building.setEnabled(true);
    }
  };

  return scene;
}

(async function init() {
  await createScene();
  engine.runRenderLoop(() => scene && scene.render());
  window.addEventListener("resize", () => engine.resize());
})();
