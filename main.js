import { iosAR } from "./ios-ar.js";

const btn = document.getElementById("startBtn");
const ui = document.getElementById("ui");

btn.onclick = async () => {
  navigator.geolocation.getCurrentPosition(
    async (pos) => {

      await iosAR.start({
        lat: 41.017040,       // BİNA KOORDİNATI
        lon: 28.858800,
        model: "bina.glb",
        scale: 1,
        altitude: 0,
        userLat: pos.coords.latitude,
        userLon: pos.coords.longitude
      });

      ui.style.display = "none";
    },
    e => alert("GPS HATASI"),
    { enableHighAccuracy: true }
  );
};
