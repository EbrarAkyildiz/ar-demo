/**
 * Babylon.js + WebXR + GPS AR Demo
 * - Ücretsiz CDN'ler kullanılır.
 * - Android Chrome ve iOS Safari'de çalışır (HTTPS zorunlu).
 * - Kullanıcıdan kamera ve konum izni ister.
 * - Kullanıcının konumu ile hedef inşaat sahası arasındaki farkı metreye çevirir (yaklaşık),
 *   AR anchor etrafında modele ofset uygular.
 *
 * Nereleri değiştirebilirsin:
 * 1) MODEL YOLU: aşağıda MODEL_PATH sabitini değiştir (models/bina.glb).
 * 2) HEDEF KOORDİNAT: siteLat/siteLon değerlerini kendi inşaat sahana göre ayarla.
 * 3) MODEL ÖLÇEK/PİVOT: building.scaling ve gerekirse building.position ile oynayabilirsin.
 * 4) UI METİNLERİ: statusEl.textContent satırlarını özelleştirebilirsin.
 */

const canvas = document.getElementById("renderCanvas");
const statusEl = document.getElementById("status");
const arBtn = document.getElementById("arBtn");
const placeBtn = document.getElementById("placeBtn");

const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
let scene, xrHelper, building;

// === 1) MODEL YOLU — GLB/GLTF dosyanı buraya koy ===
const MODEL_PATH = "models/";
const MODEL_FILE = "bina.glb"; // örnek: bina.glb

// === 2) HEDEF KOORDİNAT — inşaat sahası GPS (lat/lon) ===
// İstanbul örnek koordinat (değiştir!):
const siteLat = 41.0082;
const siteLon = 28.9784;

// Metre-derece dönüşümü (yaklaşık, küçük ölçekli ofset için yeterli)
function metersPerDegree(lat) {
  const latMeters = 111320; // 1° enlem ≈ 111.32 km
  const lonMeters = 111320 * Math.cos(lat * Math.PI / 180);
  return { latMeters, lonMeters };
}

// Kullanıcı konumu ile hedef konum arasındaki farkı sahne koordinatına çevir
function geoOffsetToScene(userLat, userLon, targetLat, targetLon) {
  const m = metersPerDegree(userLat);
  const dLat = targetLat - userLat; // + kuzey
  const dLon = targetLon - userLon; // + doğu
  const x = dLon * m.lonMeters;     // doğu-batı (x)
  const z = -dLat * m.latMeters;    // kuzey-güney (z) — sahnede kuzey negatif z
  return new BABYLON.Vector3(x, 0, z);
}

async function createScene() {
  scene = new BABYLON.Scene(engine);

  // Basit ışık ve ortam (AR başarısız olursa fallback için)
  scene.createDefaultLight(true);
  scene.createDefaultEnvironment({
    createGround: true,
    groundSize: 50,
    enableGroundShadow: false
  });

  // Fallback kamera (AR yoksa)
  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 20, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  // Modeli yükle
  statusEl.textContent = "Model yükleniyor…";
  try {
    await BABYLON.SceneLoader.AppendAsync(MODEL_PATH, MODEL_FILE, scene);
  } catch (e) {
    statusEl.textContent = "Model yüklenemedi. Dosya yolunu kontrol et.";
    console.error(e);
  }

  // Model referansı: isim eşleşmiyorsa son mesh'i al
  building = scene.meshes.find(m => m.name && m.name.toLowerCase().includes("bina")) || scene.meshes[scene.meshes.length - 1];
  if (building) {
    // === 3) MODEL ÖLÇEK/PİVOT — gerekirse ayarla ===
    building.scaling.set(0.5, 0.5, 0.5); // mobil için daha küçük ölçek
    building.setEnabled(false);          // AR anchor sonrası göstereceğiz
  }

  // Konum izni iste
  statusEl.textContent = "Konum izni bekleniyor…";
  let userPosition = null;
  try {
    userPosition = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000
      });
    });
    statusEl.textContent = "Konum alındı. AR için hazır.";
  } catch (e) {
    statusEl.textContent = "Konum alınamadı (izin/veri). Yine de AR denenebilir.";
    console.warn("Geolocation error:", e);
  }

  // AR başlatma — iOS/Safari kullanıcı jesti gerektirir
  arBtn.onclick = async () => {
    arBtn.disabled = true;
    statusEl.textContent = "AR başlatılıyor…";

    try {
      xrHelper = await scene.createDefaultXRExperienceAsync({
        uiOptions: { sessionMode: "immersive-ar" },
        optionalFeatures: true
      });

      // WebXR özellikleri: hit test (yüzey bulma) ve anchor sistemi
      const featuresManager = xrHelper.baseExperience.featuresManager;
      const hitTest = featuresManager.enableFeature(BABYLON.WebXRHitTest, "latest");
      const anchors = featuresManager.enableFeature(BABYLON.WebXRAnchorSystem, "latest");

      let placed = false;
      placeBtn.disabled = false;
      statusEl.textContent = "Yüzey arayın ve 'Modeli yerleştir'e dokunun.";

      // Kullanıcının konumu varsa, hedef sahaya ofset hesapla
      let offset = new BABYLON.Vector3(0, 0, 0);
      if (userPosition) {
        const uLat = userPosition.coords.latitude;
        const uLon = userPosition.coords.longitude;
        offset = geoOffsetToScene(uLat, uLon, siteLat, siteLon);
      }

      // Hit test sonuçlarını dinle — son pozisyonu sakla
      let lastHitPose = null;
      hitTest.onHitTestResultObservable.add((results) => {
        if (results.length > 0) {
          lastHitPose = results[0];
          statusEl.textContent = "Yüzey bulundu. Modeli yerleştirebilirsin.";
        }
      });

      // Yerleştirme butonu — son hit test pozisyonuna GPS ofset uygula
      placeBtn.onclick = () => {
        if (!lastHitPose || placed) return;

        const refSpace = xrHelper.baseExperience.sessionManager.referenceSpace;
        const pose = lastHitPose.getPose(refSpace);
        if (!pose) return;

        // Anchor oluştur ve model bağla
        const anchor = anchors.addAnchorPointUsingHitTestResult(lastHitPose);
        anchor.onAnchorAddedObservable.add((anchorNode) => {
          // Anchor altında bir parent transform node
          const parent = new BABYLON.TransformNode("buildingAnchor", scene);
          parent.setParent(anchorNode);

          // GPS ofsetini uygula (x: doğu-batı, z: kuzey-güney)
          parent.position = new BABYLON.Vector3(
            (parent.position.x || 0) + offset.x,
            (parent.position.y || 0),
            (parent.position.z || 0) + offset.z
          );

          // Modeli göster ve parent'a bağla
          if (building) {
            building.setEnabled(true);
            building.setParent(parent);
          }

          placed = true;
          placeBtn.disabled = true;
          statusEl.textContent = "Model yerleştirildi. GPS ofset uygulandı.";
        });
      };

    } catch (err) {
      // AR başlatılamadı — fallback: klasik 3D görüntüleme
      console.error("WebXR AR başlatılamadı:", err);
      statusEl.textContent = "AR başlatılamadı, 3D görüntülemeye geçiliyor.";
      if (building) building.setEnabled(true);
    }
  };

  return scene;
}

// Başlat
(async function init() {
  await createScene();
  engine.runRenderLoop(() => scene && scene.render());
  window.addEventListener("resize", () => engine.resize());
})();
