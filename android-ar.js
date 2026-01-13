import * as BABYLON from "https://cdn.babylonjs.com/babylon.js";
import "https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js";
import { calcOffset } from "./utils.js";

export const androidAR = {
  async start(cfg) {
    const canvas = document.getElementById("canvas");

    // Yüksek kalite engine
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      disableWebGL2Support: false
    });

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    // Işık ve kamera
    const camera = new BABYLON.FreeCamera("cam", new BABYLON.Vector3(0, 1.6, 0), scene);
    camera.attachControl(canvas, true);
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Model
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", cfg.model, scene);
    const building = result.meshes[0];
    building.scaling.set(cfg.scale, cfg.scale, cfg.scale);
    building.setEnabled(false);

    // WebXR (hit-test + anchors)
    const xr = await scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar" },
      optionalFeatures: ["hit-test", "anchors", "dom-overlay", "unbounded"]
    });

    const features = xr.baseExperience.featuresManager;
    const anchors = features.enableFeature(BABYLON.WebXRAnchorSystem, "latest");

    const offset = calcOffset(cfg.userLat, cfg.userLon, cfg.lat, cfg.lon);

    xr.baseExperience.sessionManager.onXRSessionInit.add(() => {
      const anchor = anchors.addAnchorPoint(new BABYLON.Vector3(0, cfg.altitude, 0));
      anchor.onAnchorAddedObservable.add((anchorNode) => {
        const parent = new BABYLON.TransformNode("buildingAnchor", scene);
        parent.setParent(anchorNode);
        parent.position.addInPlace(new BABYLON.Vector3(offset.x, offset.y, offset.z));
        building.setParent(parent);
        building.setEnabled(true);
      });
    });

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
  }
};
