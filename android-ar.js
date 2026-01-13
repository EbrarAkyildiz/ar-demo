const androidAR = {
  async start(cfg) {
    const canvas = document.getElementById("canvas");

    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.FreeCamera(
      "cam",
      new BABYLON.Vector3(0, 1.6, 0),
      scene
    );

    new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );

    const dx = (cfg.lon - cfg.userLon) * 111320;
    const dz = (cfg.lat - cfg.userLat) * 110540;

    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      "", "", cfg.model, scene
    );

    const building = result.meshes[0];
    building.scaling.set(cfg.scale, cfg.scale, cfg.scale);
    building.position.set(dx, cfg.altitude, -dz);

    await scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar" }
    });

    engine.runRenderLoop(() => scene.render());
  }
};
