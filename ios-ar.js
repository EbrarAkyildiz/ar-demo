import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { calcOffset, bearing, toRad } from "./utils.js";

export const iosAR = {
  async start(cfg) {

    /* RENDERER */
    const canvas = document.getElementById("canvas");
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(devicePixelRatio);

    /* SCENE */
    const scene = new THREE.Scene();

    /* CAMERA */
    const camera = new THREE.PerspectiveCamera(
      70,
      innerWidth / innerHeight,
      0.1,
      5000
    );
    camera.position.set(0, 1.6, 0); // GÖZ HİZASI

    /* LIGHT */
    scene.add(new THREE.AmbientLight(0xffffff, 2));

    /* CAMERA FEED */
    const video = document.createElement("video");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    await video.play();

    const videoTex = new THREE.VideoTexture(video);
    videoTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = videoTex;

    /* MODEL */
    let model;
    const loader = new GLTFLoader();
    loader.load(cfg.model, gltf => {
      model = gltf.scene;
      model.scale.setScalar(cfg.scale);
      scene.add(model);
    });

    /* HEADING */
    let heading = 0;
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      const p = await DeviceOrientationEvent.requestPermission();
      if (p === "granted") {
        window.addEventListener("deviceorientation", e => {
          heading = e.webkitCompassHeading ?? (360 - e.alpha);
        });
      }
    } else {
      window.addEventListener("deviceorientationabsolute", e => {
        heading = 360 - e.alpha;
      });
    }

    /* LOOP */
    function animate() {
      requestAnimationFrame(animate);

      if (model) {
        const off = calcOffset(
          cfg.userLat,
          cfg.userLon,
          cfg.lat,
          cfg.lon
        );

        const br = bearing(
          cfg.userLat,
          cfg.userLon,
          cfg.lat,
          cfg.lon
        );

        const rel = (br - heading + 360) % 360;
        const dist = Math.hypot(off.x, off.z);

        model.position.set(
          Math.sin(toRad(rel)) * dist,
          -1.6,
          -Math.cos(toRad(rel)) * dist
        );

        model.rotation.y = toRad(-heading);
      }

      renderer.render(scene, camera);
    }

    animate();
  }
};
