import { gpsAR } from "./gps-ar.js";

const startBtn = document.getElementById("start");
const msg = document.getElementById("msg");

startBtn.addEventListener("click", async () => {
  msg.textContent = "Konum ve izinler isteniyor...";
  try {
    await gpsAR.start({
      // Odandaki koordinatlar (örnek)
      lat: 41.017040,
      lon: 28.858800,
      altitude: 84,

      // Model (kök dizinde)
      model: "bina.glb",
      scale: 0.3,          // iç mekân test için küçük

      // GPS doğruluk eşiği
      minAccuracy: 20,     // iç mekân toleransı (dışarıda 8–10 yap)

      // iOS kamera kalite tercihleri
      iosCamera: { width: 1920, height: 1080, frameRate: 30 }
    });
    document.getElementById("ui").style.display = "none";
  } catch (e) {
    msg.textContent = "Başlatma hatası: " + e.message;
  }
});
