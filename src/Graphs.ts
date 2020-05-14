import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

export class Graphs {
    static names : string[] = ["Confirmed", "Deaths"];
    static scene : Scene;
    static planes : Mesh[];
    static imageMap : Map<string, Texture>;
    static planeRadius : number = 18;
    static planeSize : number = 6;

    constructor(scene : Scene) {
        Graphs.scene = scene;
        Graphs.planes = [];
        Graphs.imageMap = new Map();
        for (let name of Graphs.names) {
            let plane : Mesh = MeshBuilder.CreatePlane("GraphPlane" + name, {size: Graphs.planeSize}, scene);
            let planeMaterial : StandardMaterial = new StandardMaterial("mat" + plane.name, scene);
            plane.material = planeMaterial;
            plane.billboardMode = Mesh.BILLBOARDMODE_Y;

            // Position
            switch(name) {
                case "Confirmed":
                    plane.position.set(-Graphs.planeRadius / 2, Graphs.planeSize / 2, Graphs.planeRadius);
                    break;
                case "Active":
                    plane.position.set(0, Graphs.planeSize / 2, Graphs.planeRadius * 1.15);
                    break;
                case "Deaths":
                    plane.position.set(Graphs.planeRadius / 2, Graphs.planeSize / 2, Graphs.planeRadius);
                    break;
            }
            Graphs.planes.push(plane);
        }
    }

    static updateGraphs(data : any) {
        for (let i = 0; i < Graphs.planes.length; i++) {
            let plane = Graphs.planes[i];
            let name = Graphs.names[i];
            let planeTexture : Texture | undefined = undefined;
            if (Graphs.imageMap.has(data["full_name"])) {
                planeTexture = Graphs.imageMap.get(data["full_name"]);
            } else {
                planeTexture = new Texture("./images/graphs/" + name + "_" + data["full_name"] + ".png", Graphs.scene);
            }
            (plane.material as StandardMaterial).diffuseTexture = (planeTexture as Texture);
        }
    }
}