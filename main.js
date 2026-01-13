import { WebAR } from "./sdk/WebAR.js";

const startBtn = document.getElementById("start");
const toast = document.getElementById("toast");

// Senin odandaki test koordinatları
const CONFIG = {
  id: "deneme_bina",
  url: "bina.glb",
  lat: 41.017040,
  lon: 28.858800,
  altitude: 82,
  scale: 0.3,
  rotation: [0, 0, 0]
};

const ar = new WebAR({
  container: "#canvas",
  engine: "three",
  placement: "gps",   // "gps" veya "dragdrop"
  quality: "high"
});

function showToast(msg, ms = 2000) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), ms);
}

startBtn.onclick = async () => {
  try {
    await ar.start();
    const model = await ar.loadModel(CONFIG.url, {
      scale: CONFIG.scale,
      altitude: CONFIG.altitude,
      rotation: CONFIG.rotation,
      pbr: { metalness: 0.2, roughness: 0.6 },
      gps: { lat: CONFIG.lat, lon: CONFIG.lon, altitude: CONFIG.altitude }
    });
    model.userData.isBuilding = true;

    // Placement mode
    ar.setPlacementMode("gps", { target: CONFIG });
    document.getElementById("ui").style.display = "none";
    showToast("Kamera başlatıldı. GPS konumlandırma aktif.");
  } catch (e) {
    console.error(e);
    showToast("Başlatma hatası: " + e.message, 3000);
  }
};

ar.on("placed", (pos) => {
  console.log("Yerleştirildi:", pos);
  showToast(`Obje yerleştirildi: x=${pos.x.toFixed(2)} z=${pos.z.toFixed(2)}`);
});

ar.on("gps:far", (d) => {
  showToast(`Hedef konuma uzaklık: ${d.toFixed(1)} m`);
});

ar.on("gps:ready", () => {
  showToast("GPS hazır, hedef konum kontrol ediliyor…");
});
