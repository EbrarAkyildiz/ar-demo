const canvas = document.getElementById("renderCanvas");
const iosViewer = document.getElementById("iosViewer");
const statusEl = document.getElementById("status");
const arBtn = document.getElementById("arBtn");

const engine = new BABYLON.Engine(canvas, true);
let scene, xrHelper, building;

// === Hedef koordinat ===
const siteLat = 41.0082; // Enlem
const siteLon = 28.9784; // Boylam

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

  await BABYLON.SceneLoader.AppendAsync("models/", "bina.glb", scene);
  building = scene.meshes[scene.meshes.length - 1];
  building.scaling.set(0.5, 0.5, 0.5);
  building.setEnabled(false);

  let userPosition = null;
  try {
    userPosition = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
    });
  } catch (e) {
    console.warn("Konum alınamadı:", e);
  }

  arBtn.onclick = async () => {
    // iOS Safari kontrolü
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // Babylon.js yerine Model-Viewer göster
      canvas.style.display = "none";
      iosViewer.style.display = "block";
      statusEl.textContent = "iOS Quick Look ile AR açılıyor.";
      return;
    }

    // Android için Babylon.js WebXR
    try {
      xrHelper = await scene.createDefaultXRExperienceAsync({
        uiOptions: { sessionMode: "immersive-ar" },
        optionalFeatures: ["hit-test", "anchors"]
      });

      const featuresManager = xrHelper.baseExperience.featuresManager;
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

      xrHelper.baseExperience.sessionManager.onXRSessionInit.add(() => {
        const anchor = anchors.addAnchorPoint(new BABYLON.Vector3(0, 0, 0));
        anchor.onAnchorAddedObservable.add((anchorNode) => {
          const parent = new BABYLON.TransformNode("buildingAnchor", scene);
          parent.setParent(anchorNode);
          parent.position.addInPlace(offset);

          building.setEnabled(true);
          building.setParent(parent);
          statusEl.textContent = "Model yerleştirildi.";
        });
      });

    } catch (err) {
      console.error("AR başlatılamadı:", err);
      building.setEnabled(true);
      statusEl.textContent = "AR yok, 3D modda gösteriliyor.";
    }
  };

  return scene;
}

(async function init() {
  await createScene();
  engine.runRenderLoop(() => scene && scene.render());
  window.addEventListener("resize", () => engine.resize());
})();
