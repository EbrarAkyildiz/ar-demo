import { androidAR } from "./android-ar.js";
import { iosAR } from "./ios-ar.js";
import { haversine, bearing, updateHUD } from "./utils.js";

export const gpsAR = {
  async start(cfg) {
    const msg = document.getElementById("msg");
    const isAndroid = /Android/i.test(navigator.userAgent);

    let started = false;
    return new Promise((resolve, reject) => {
      const watchId = navigator.geolocation.watchPosition(
        async (p) => {
          const { latitude, longitude, accuracy } = p.coords;
          cfg.userLat = latitude;
          cfg.userLon = longitude;

          const dist = haversine(latitude, longitude, cfg.lat, cfg.lon);
          const brg = bearing(latitude, longitude, cfg.lat, cfg.lon);
          updateHUD({ acc: accuracy, dist, brg });

          msg.textContent = `GPS doğruluk: ${Math.round(accuracy)}m`;

          if (!started && accuracy <= cfg.minAccuracy) {
            started = true;
            try {
              if (isAndroid && navigator.xr) {
                await androidAR.start(cfg);
              } else {
                await iosAR.start(cfg);
              }
              navigator.geolocation.clearWatch(watchId);
              resolve();
            } catch (e) {
              navigator.geolocation.clearWatch(watchId);
              reject(e);
            }
          }
        },
        (err) => reject(new Error("Konum izni/hatası: " + err.message)),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
      );
    });
  }
};
