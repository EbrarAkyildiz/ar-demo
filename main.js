document.getElementById("start").onclick = () => {
  gpsAR.start({
    lat: 41.017040,
    lon: 28.858800,
    model: "models/bina.glb",
    scale: 0.3,
    minAccuracy: 18,
    altitude: 84
  });
};
