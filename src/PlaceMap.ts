import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math";

export class PlaceMap {
    static plane : Mesh;
    static planeMaterial : StandardMaterial;
    private static imageMap : Map<string, Texture>;
    static scene : Scene;

    constructor(scene : Scene) {
        PlaceMap.scene = scene;
        PlaceMap.imageMap = new Map();
        PlaceMap.plane = MeshBuilder.CreatePlane("map", {size: 3.5});
        PlaceMap.planeMaterial = new StandardMaterial("matmap", scene);
        PlaceMap.plane.material = PlaceMap.planeMaterial;

        PlaceMap.plane.position.set(-0.625, 0.6, 2.5);
        PlaceMap.plane.rotate(new Vector3(1, 0, 0), Math.PI / 2);

        PlaceMap.planeMaterial.alpha = 0.7;
    }

    static updateMap(fullName : string) {
        let texture : Texture;
        if (PlaceMap.imageMap.has(fullName)) {
            texture = PlaceMap.imageMap.get(fullName) as Texture;
        } else {
            texture = new Texture("https://www.mapquestapi.com/staticmap/v5/map?key=IFT7zKT0KuQSSTKSQqVEkqIMydsAQAf6&center=GA,&size=400,400@2x&zoom=6", PlaceMap.scene);
            PlaceMap.imageMap.set(fullName, texture);
        }
        PlaceMap.planeMaterial.diffuseTexture = texture;
    }
}