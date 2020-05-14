import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Engines/Extensions"
import "@babylonjs/core/Helpers/sceneHelpers";
import { Scene } from "@babylonjs/core/scene";
import { Vector3, Color3 } from "@babylonjs/core/Maths/math";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/loaders/glTF";

import { GUI3DManager } from "@babylonjs/gui";

// Required side effects to populate the Create methods on the mesh class. Without this, the bundle would be smaller but the createXXX methods from mesh would not be accessible.
import  "@babylonjs/core/Meshes/Builders/groundBuilder";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import "@babylonjs/core/Cameras/VR";

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/core/";

import { DataParser } from "./DataParser";
import { Level, LevelCreator } from "./LevelCreator";
import { Graphs } from "./Graphs";
import { UI } from "./UI";

var canvas = document.getElementById("renderCanvas") as HTMLCanvasElement; // Get the canvas element 
var engine = new Engine(canvas, true); // Generate the BABYLON 3D engine
var statusbar : any = undefined;

/******* Add the Playground Class with a static CreateScene function ******/
class Playground { 
    public static CreateScene(engine: Engine, canvas: HTMLCanvasElement): Scene {
        // Create the scene space
        var scene = new Scene(engine);

        var anchor = new TransformNode("");
        scene.addTransformNode(anchor);

        // Add lights to the scene
        var light1 = new HemisphericLight("light1", new Vector3(1, 3, 0), scene);
        //var light2 = new PointLight("light2", new Vector3(0, 3, -1), scene);

        let ground = createGround();

        createEnvironment(scene, 5.5);

        var VRHelper = scene.createDefaultVRExperience();

        VRHelper.enableInteractions();
        VRHelper.enableTeleportation({
                floorMeshes: [ground]
        });
          
        var manager = new GUI3DManager(scene);
        new Graphs(scene);
        UI.create(scene);

        let stateData = DataParser.getStateData("Georgia");

        let data = stateData;
        let level = LevelCreator.createLevel(scene, data, "latest", 0.35, 0.2, 0.5, 2.5);

        return scene;
    }
}

var createEnvironment = function (scene : Scene, scale : number) {
    SceneLoader.LoadAssetContainer("./models/", "3dui_project_background.glb", scene, function (container) {
        var meshes = container.meshes;
        var materials = container.materials;
        console.log(meshes, materials);
        //...
        for(let mesh of meshes) {
            mesh.scaling.set(scale, scale, scale);
            mesh.position.set(0, -2.5, 1.3);
            let material = new StandardMaterial("envBack", scene);
            material.diffuseColor = new Color3(0.7, 0.7, 0.7);
            material.alpha = 0.75;
            mesh.material = material;
        }
        for(let material of materials) {
            material.alpha = 0.3;
            material.backFaceCulling = true;
            console.log(material.toString());
        }
    
        // Adds all elements to the scene
        container.addAllToScene();
    });
}

var createGround = function () {
    let ground = Mesh.CreateGround("ground1", 100, 100, 2, scene);
    let groundMaterial = new StandardMaterial("ground", scene);
    let diffuseTexture = new Texture("images/ground_diffuse.png", scene);
    diffuseTexture.uScale = 20;
    diffuseTexture.vScale = 20;
    let bumpTexture = new Texture("images/ground_bump.png", scene);
    bumpTexture.uScale = 20;
    bumpTexture.vScale = 20;
    let specTexture = new Texture("images/ground_spec.png", scene);
    specTexture.uScale = 20;
    specTexture.vScale = 20;
    groundMaterial.diffuseTexture = diffuseTexture;
    groundMaterial.specularTexture = specTexture;
    groundMaterial.bumpTexture = bumpTexture;
    ground.material = groundMaterial;
    return ground;
};

/******* End of the create scene function ******/    
// code to use the Class above
var createScene = function() { 
    return Playground.CreateScene(engine, 
        engine.getRenderingCanvas() as HTMLCanvasElement); 
}

var scene = createScene(); //Call the createScene function

// // Register a render loop to repeatedly render the scene
// engine.runRenderLoop(function () { 
//     scene.render();
// });

// Watch for browser/canvas resize events
window.addEventListener("resize", function () { 
    engine.resize();
});

engine.runRenderLoop(() => {
    scene.render();
})
