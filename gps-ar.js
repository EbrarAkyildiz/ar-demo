const gpsAR = {
  start(cfg) {
    const msg = document.getElementById("msg");
    msg.innerText = "Konum alınıyor...";

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    navigator.geolocation.getCurrentPosition(
      (p) => {
        cfg.userLat = p.coords.latitude;
        cfg.userLon = p.coords.longitude;

        if (p.coords.accuracy > cfg.minAccuracy) {
          msg.innerText = "GPS hassasiyeti bekleniyor (" +
            Math.round(p.coords.accuracy) + "m)";
        }

        document.getElementById("ui").style.display = "none";

        if (isAndroid && navigator.xr) {
          androidAR.start(cfg);
        } else {
          iosAR.start(cfg);
        }
      },
      () => alert("Konum izni gerekli"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
};
