const iosAR = {
  async start(cfg) {
    const canvas = document.getElementById("canvas");

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(innerWidth, innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      innerWidth / innerHeight,
      0.1,
      10000
    );
    camera.position.y = 1.6;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));

    // Kamera görüntüsü
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();
    scene.background = new THREE.VideoTexture(video);

    // Model
    const loader = new THREE.GLTFLoader();
    const gltf = await loader.loadAsync(cfg.model);
    const building = gltf.scene;
    building.scale.set(cfg.scale, cfg.scale, cfg.scale);
    scene.add(building);

    let heading = 0;
    window.addEventListener("deviceorientation", (e) => {
      if (e.alpha !== null) {
        heading = heading * 0.9 + (360 - e.alpha) * 0.1;
      }
    });

    function calcOffset() {
      const latM = 111320;
      const lonM = 111320 * Math.cos(cfg.userLat * Math.PI / 180);
      return {
        x: (cfg.lon - cfg.userLon) * lonM,
        z: -(cfg.lat - cfg.userLat) * latM
      };
    }

    function bearing() {
      const toRad = d => d * Math.PI / 180;
      const y = Math.sin(toRad(cfg.lon - cfg.userLon)) * Math.cos(toRad(cfg.lat));
      const x = Math.cos(toRad(cfg.userLat)) * Math.sin(toRad(cfg.lat)) -
        Math.sin(toRad(cfg.userLat)) * Math.cos(toRad(cfg.lat)) *
        Math.cos(toRad(cfg.lon - cfg.userLon));
      return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }

    function update() {
      const off = calcOffset();
      const br = bearing();
      const rel = (br - heading + 360) % 360;
      const rad = rel * Math.PI / 180;
      const dist = Math.hypot(off.x, off.z);

      building.position.set(
        Math.sin(rad) * dist,
        cfg.altitude,
        -Math.cos(rad) * dist
      );
    }

    function animate() {
      update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    animate();
  }
};
