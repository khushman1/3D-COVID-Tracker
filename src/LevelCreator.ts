import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

// Required side effects to populate the Create methods on the mesh class. Without this, the bundle would be smaller but the createXXX methods from mesh would not be accessible.
import  "@babylonjs/core/Meshes/Builders/groundBuilder";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import "@babylonjs/core/Cameras/VR";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ActionManager, SetValueAction, ExecuteCodeAction } from "@babylonjs/core/Actions";
import { DataParser } from "./DataParser";
import { UI } from "./UI";

export class LevelCreator {
    static imageMap : Map<string, Texture> = new Map();
    static latestLevel : Level | undefined = undefined;
    static latestData : any;

    private static scene : Scene;

    static createParentSphere(scene : Scene, data : any, name: string, diameter : number, y? : number) {
        if (!y) y = diameter;
        let parentSphere : Mesh = LevelCreator.createSphere(scene, data, "parent" + name, diameter, true);
        parentSphere.position.set(0, y - diameter / 2, 0);
        let threshold = LevelCreator.normalize(data.deaths, data.confirmed, data.active);
        parentSphere.material = LevelCreator.getMaterialByThreshold(scene, parentSphere.name, threshold);
        for(let mesh of parentSphere.getChildMeshes(true)) {
            mesh.scaling.set(0.75, 0.75, 0.75);
        }
        
        return parentSphere;
    }

    static getIndexFromTime(dates : string[], time : string) {
        if (time == "latest") {
            return dates.length - 1;
        }
		if (time == "earliest"){
			return 0;
		}
        let date : Date = new Date(time);
        let startDate : Date = new Date(dates[0]);
        let diff = Math.abs(date.getTime() - startDate.getTime());
        let diffDays = Math.ceil(diff / (1000 * 3600 * 24));
        return diffDays;
    }

    private static fillCurrentDetails(data : any, index : number, time : string, diameter : number, childDiameter : number, y : number, spreadRadius : number) {
        data["confirmed"] = data.series_confirmed[index];
        data["deaths"] = data.series_deaths[index];
        data["active"] = data.series_active[index];
        data["time"] = time;
        data["diameter"] = diameter;
        data["childDiameter"] = childDiameter;
        data["y"] = y;
        data["spreadRadius"] = spreadRadius;

        if (data["ancestor"]) {
            data["ancestor"]["time"] = time;
            data["ancestor"]["diameter"] = diameter;
            data["ancestor"]["childDiameter"] = childDiameter;
            data["ancestor"]["y"] = y;
            data["ancestor"]["spreadRadius"] = spreadRadius;
        }
        for (let key of Object.keys(data["children"])) {
            data["children"][key]["confirmed"] = data["children"][key].series_confirmed[index];
            data["children"][key]["deaths"] = data["children"][key].series_deaths[index];
            data["children"][key]["active"] = data["children"][key].series_active[index];
            data["children"][key]["time"] = time;
            data["children"][key]["diameter"] = diameter;
            data["children"][key]["childDiameter"] = childDiameter;
            data["children"][key]["y"] = y;
            data["children"][key]["spreadRadius"] = spreadRadius;
            data["children"][key]["ancestor"] = data;
        }
    }

    static createLevel(scene : Scene, data : any, time : string, diameter? : number, childDiameter? : number, y? : number, spreadRadius? : number) {
        return new Promise<Level>((resolve) => {
            LevelCreator.scene = scene;
            if (!diameter) diameter = 3;
            if (!childDiameter) childDiameter = 2;
            if (!y) y = diameter + childDiameter;
            if (!spreadRadius) spreadRadius = (childDiameter) * Object.keys(data.children).length;

            let index : number = LevelCreator.getIndexFromTime(data.dates, time);
            if (index == NaN) {
                console.error("DATE ERROR", time);
                return;
            }
            
            if(!(data["ancestor"])) {
                data["ancestor"] = DataParser.getAncestor(data["name"]);
            }
            LevelCreator.fillCurrentDetails(data, index, time, diameter, childDiameter, y, spreadRadius);


            let name : string = data.name;
            let confirmed : number = data.confirmed;
            let deaths : number = data.deaths;
            let active : number = data.active;
            let stats : Stats = LevelCreator.findChildrenStatsMinMax(data.children);
            let parentSphere : Mesh = LevelCreator.createParentSphere(scene, data, name, diameter, y);
            let childrenSpheres : Mesh[] = (data.children != null && Object.keys(data.children).length > 0)
                                        ? LevelCreator.createChildrenSpheres(scene, parentSphere, data, childDiameter, stats, y, spreadRadius) : [];
            let statsSpheres : Mesh[] = LevelCreator.createStatsSpheres(scene, data, parentSphere, name, diameter / 2);
            let ancestorSphere : Mesh | undefined = (data["ancestor"]) ? LevelCreator.createAncestorSphere(scene, data, parentSphere, diameter * 1, y * 2.5)
                                                                         : undefined;
			//TEST Position / layout change.
            parentSphere.position.set(0, 1, 3.75);

            let level = new Level(parentSphere, childrenSpheres, statsSpheres, ancestorSphere, data, stats);
            LevelCreator.latestLevel = level;
            LevelCreator.latestData = data;
            UI.updateElements(true);
            resolve();
            return level;
        });
    }

    static createChildrenSpheres(scene : Scene, parent : Mesh, data : any, childDiameter : number, stats : Stats, y? : number, spreadRadius? : number) {
        if (!y) y = 0;
        if (!spreadRadius) spreadRadius = 5;
        let children = data.children;
        let no = Object.keys(children).length;
        let rows : number = Math.floor(Math.sqrt(no));
        let column : number = Math.ceil(Math.sqrt(no));
        let childrenSpheri : Mesh[] = [];
        let position : Vector3 = new Vector3();

        // Create Children
        for(let key of Object.keys(children)) {
            let diameter = LevelCreator.getNewDiameter(stats, children[key].confirmed, childDiameter, childDiameter / 1.5);
            let childSphere = LevelCreator.createSphere(scene, children[key], "child" + children[key].name, diameter, true);
            childSphere.parent = parent;
            childrenSpheri.push(childSphere);

            // lat lon layout
			//TESTING Y POSITION (init: diameter * 2.5 + y)
            position.set(spreadRadius * (-LevelCreator.normalize(children[key].lon, stats.lon[1], stats.lon[0]) + 0.5 - 0.3),
                         diameter * 2.5 - y,
                         spreadRadius * (LevelCreator.normalize(children[key].lat, stats.lat[1], stats.lat[0]) - 0.5 - 0.75));
            childSphere.position.copyFrom(position);

            let threshold = LevelCreator.normalize(children[key].confirmed, stats.confirmed[1], stats.confirmed[0]);
            childSphere.material = LevelCreator.getMaterialByThreshold(scene, childSphere.name, threshold);
            let color4 = Color4.FromColor3(LevelCreator.generateHeatMapColor(threshold));
            color4.a = 0.1;
            let childSphereConnector = MeshBuilder.CreateLines(childSphere.name + "childSphereConnector",
                                                               {points: [Vector3.Zero(), childSphere.position.negate()],
                                                                colors: [color4, color4],
                                                                updatable: true, useVertexAlpha : true},
                                                               scene);
            childSphereConnector.isPickable = false;
            childSphereConnector.material = childSphere.material;
            // childSphereConnector.bakeCurrentTransformIntoVertices();
            childSphereConnector.parent = childSphere;
        }

        LevelCreator._addChildNavigationActions(scene, childrenSpheri);

        return childrenSpheri;
    }

    static createAncestorSphere(scene : Scene, data : any, parent : Mesh, diameter : number, y? : number) {
        if (!y) y = diameter;
        let sphere : Mesh = LevelCreator.createSphere(scene, data["ancestor"], "ancestor" + name, diameter, true);
        sphere.position.set(0, y - diameter / 2, 0.5);
        let threshold = LevelCreator.normalize(data.active, data.confirmed, data.deaths);
        sphere.material = LevelCreator.getMaterialByThreshold(scene, sphere.name, threshold);
        sphere.material.alpha = 0.7;
        sphere.position.set(y, y, y);
        sphere.parent = parent;

        sphere.actionManager = new ActionManager(scene);
        sphere.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {LevelCreator._changeLevel(scene, parent, data["ancestor"]); }));
        sphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOverTrigger, sphere.material, "wireframe", true));
        sphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOutTrigger, sphere.material, "wireframe", false));

        let color4 = Color4.FromColor3(LevelCreator.generateHeatMapColor(threshold));
        color4.a = 0.2;
        let sphereConnector = MeshBuilder.CreateLines(sphere.name + "sphereConnector",
                                                           {points: [new Vector3(parent.position.x, parent.position.y - diameter, parent.position.z), sphere.position],
                                                            colors: [color4, color4],
                                                            updatable: true, useVertexAlpha : true},
                                                           scene);
        sphereConnector.isPickable = false;
        sphereConnector.material = sphere.material;
        sphereConnector.parent = parent;
        
        return sphere;
    }

    static createStatsSpheres(scene : Scene, data : any, sphere : Mesh, name : string, diameter : number) {
        let spheres : Mesh[] = [];

		//If there are no confirmed cases then there will be no statistic spheres
		if(data.confirmed > 0)
		{
			let parentPosition = new Vector3(0, 0, 0);

			//confirmed stat sphere
			let confirmedMaterial = new StandardMaterial("confirmedMaterial", scene);
			confirmedMaterial.diffuseColor = new Color3(0, .9, 0);
			let confirmedSphere  : Mesh = MeshBuilder.CreateSphere(name+"confirmedSphere", {diameter: diameter*data.confirmed / data.confirmed, updatable:true}, scene);
			confirmedSphere.position = new Vector3(diameter*1.73,diameter,-diameter*0.5);
			confirmedSphere.parent = sphere;
			confirmedSphere.material = confirmedMaterial;
			let confirmedSphereConnector = MeshBuilder.CreateLines(name+"confirmedSphereConnector",{points: [parentPosition ,confirmedSphere.position.negate()], updatable: true}, scene);
			confirmedSphereConnector.parent = confirmedSphere;
			let confirmedLabelTexture = new Texture("./images/UI/Confirmed_Label.png",scene);
			let confirmedSphereLabel = LevelCreator.createLabel(scene,confirmedSphere,diameter*0.7,confirmedLabelTexture as Texture);
			spheres.push(confirmedSphere);

			if(data.active > 0)
			{
				//active cases stat sphere
				let activeMaterial = new StandardMaterial("activeMaterial", scene);
				activeMaterial.diffuseColor = new Color3(1, .682, .259);
				let activeSphere : Mesh = MeshBuilder.CreateSphere(name+"activeSphere", {diameter: diameter*data.active / data.confirmed, updatable:true}, scene);
				activeSphere.position = new Vector3(0,diameter,diameter);
				activeSphere.parent = sphere;
				activeSphere.material = activeMaterial;
				let activeSphereConnector = MeshBuilder.CreateLines(name+"activeSphereConnector",{points: [parentPosition ,activeSphere.position.negate()], updatable: true}, scene);
				activeSphereConnector.parent = activeSphere;
				let activeLabelTexture = new Texture("./images/UI/Active_Label.png",scene);
				let activeSphereLabel = LevelCreator.createLabel(scene,activeSphere,diameter*0.7,activeLabelTexture as Texture);
				spheres.push(activeSphere);
			}
			if(data.deaths > 0 )
			{
				//deaths stat sphere
				let deathMaterial = new StandardMaterial("deathMaterial", scene);
				deathMaterial.diffuseColor = new Color3(.9, 0, 0);
				let deathSphere : Mesh = MeshBuilder.CreateSphere(name+"deathSphere", {diameter: diameter*data.deaths / data.confirmed, updatable:true}, scene);
				deathSphere.position = new Vector3(-diameter*1.73,diameter,-diameter*0.5);
				deathSphere.parent = sphere;
				deathSphere.material = deathMaterial;
				let deathSphereConnector = MeshBuilder.CreateLines(name+"deathSphereConnector",{points: [parentPosition ,deathSphere.position.negate()], updatable: true}, scene);
				deathSphereConnector.parent = deathSphere;
				let deathsLabelTexture = new Texture("./images/UI/Deaths_Label.png",scene);
				let deathsSphereLabel = LevelCreator.createLabel(scene,deathSphere,diameter*0.7,deathsLabelTexture as Texture);
				spheres.push(deathSphere);
            }
		}
        return spheres;
    }



    private static getNewDiameter(stats : Stats, confirmed : number, diameter : number, step? : number) {
        if (!step) step = 0.5;
        return (stats.confirmed[0] != stats.confirmed[1]) ? diameter - step + (step / 1.5) * LevelCreator.normalize(confirmed, stats.confirmed[1], stats.confirmed[0])
                                                          : (diameter - step);
    }

    private static normalize(x : number, max : number, min : number) {
        return (max == min) ? 0 : ((x - min) / (max - min));
    }

    static findChildrenStatsMinMax(children : any) {
        let stats = new Stats();

        if (children != null) {
            for(let name of Object.keys(children)) {
                stats.confirmed[0] = (stats.confirmed[0] == -1) ? children[name].confirmed : Math.min(stats.confirmed[0], children[name].confirmed);
                stats.confirmed[1] = Math.max(stats.confirmed[1], children[name].confirmed);
                stats.deaths[0] = (stats.deaths[0] == -1) ? children[name].deaths : Math.min(stats.deaths[0], children[name].deaths);
                stats.deaths[1] = Math.max(stats.deaths[1], children[name].deaths);
                stats.active[0] = (stats.active[0] == -1) ? children[name].active : Math.min(stats.active[0], children[name].active);
                stats.active[1] = Math.max(stats.active[1], children[name].active);
                stats.lat[0] = Math.min(stats.lat[0], children[name].lat);
                stats.lat[1] = Math.max(stats.lat[1], children[name].lat);
                stats.lon[0] = Math.max(stats.lon[0], children[name].lon);
                stats.lon[1] = Math.min(stats.lon[1], children[name].lon);
            }
        }

        return stats;
    }

    static createSphere(scene : Scene, data : any, name : string, diameter : number, label? : boolean) {
		//Central Sphere Node
        let sphere : Mesh = MeshBuilder.CreateSphere(name, {diameter: diameter, segments: 8}, scene);
        sphere.metadata = {"data": data};

        if (label) {
            // Create text above them
            /*
			let namePlane = MeshBuilder.CreatePlane("namePlane" + sphere.name, {size: diameter * 1.5}, scene);
            namePlane.parent = sphere;
            namePlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
            namePlane.position.set(0, diameter, 0);
            let nameTexture : Texture | undefined;
            if (LevelCreator.imageMap.has(data["name"])) {
                nameTexture = LevelCreator.imageMap.get(data["name"]);
            } else {
                nameTexture = new Texture("./images/labels/" + data["name"] + ".png", scene);
            }
            let nameMaterial = new StandardMaterial("namemat" + data["name"], scene);
            nameMaterial.diffuseTexture = nameTexture as Texture;
            nameMaterial.diffuseTexture.hasAlpha = true;
            namePlane.material = nameMaterial;
			*/
			let nameTexture : Texture | undefined;
            if (LevelCreator.imageMap.has(data["name"])) {
                nameTexture = LevelCreator.imageMap.get(data["name"]);
            } else {
                nameTexture = new Texture("./images/labels/" + data["name"] + ".png", scene);
            }

			let sphereLabel = LevelCreator.createLabel(scene,sphere,diameter,nameTexture as Texture);
            
        }

        return sphere;
    }

	static createLabel(scene: Scene, sphere : Mesh,diameter : number, texture : Texture)
	{
		let namePlane = MeshBuilder.CreatePlane("namePlane" + sphere.name, {size: diameter * 1.5}, scene);
		namePlane.parent = sphere;
		namePlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
        namePlane.position.set(0, diameter, 0);
		let nameMaterial = new StandardMaterial("namemat" + texture.name, scene);
		nameMaterial.diffuseTexture = texture as Texture;
		nameMaterial.diffuseTexture.hasAlpha = true;
        namePlane.material = nameMaterial;
        namePlane.isPickable = false;
	}

    private static generateHeatMapColor(threshold : number) {
        let h = (1.0 - threshold) * 240;
        let s = 0.8;
        let l = 0.75;
        let newColor = new Color3();
        Color3.HSVtoRGBToRef(h, s, l, newColor);
        return newColor;
    }

    private static getMaterialByThreshold(scene : Scene, name : string, threshold : number) {
        let material : StandardMaterial = new StandardMaterial("mat"  + name, scene);
        material.diffuseColor = LevelCreator.generateHeatMapColor(threshold);
        material.specularColor = material.diffuseColor;
        material.emissiveColor = new Color3(Math.max(material.diffuseColor.r - 0.5, 0),
                                            Math.max(material.diffuseColor.g - 0.5, 0),
                                            Math.max(material.diffuseColor.b - 0.5, 0));
        return material;
    }

    private static _addChildNavigationActions(scene : Scene, spheres : Mesh[]) {
        let scaleBy = 1.6;
        let largeScale = new Vector3(scaleBy, scaleBy, scaleBy);
        let ogScale = new Vector3(1 / scaleBy, 1 / scaleBy, 1 / scaleBy);
        for(let sphere of spheres) {
            sphere.actionManager = new ActionManager(scene);

            sphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOverTrigger, sphere.material, "wireframe", true));
            sphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOutTrigger, sphere.material, "wireframe", false));
            sphere.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => { LevelCreator._changeLevel(scene, sphere); }))
        }
    }

    private static _changeLevel(scene : Scene, mesh : Mesh, data? : any) {
        if (!data) data = mesh.metadata["data"];
        mesh.metadata["level"].dispose(true);
        LevelCreator.createLevel(scene, data, data["time"], data["diameter"], data["childDiameter"], data["y"], data["spreadRadius"]);
        //console.info("Changing level to", data["name"], data);
    }

    static updateIndex(level : Level, newIndex : number) {
        // Update details in data
        LevelCreator.fillCurrentDetails(level.data, newIndex, level.data["dates"][newIndex], level.data["diameter"],
                                        level.data["childDiameter"], level.data["y"], level.data["spreadRadius"]);
        // Get new stats
        let stats : Stats = LevelCreator.findChildrenStatsMinMax(level.data.children);
        level.childrenSpheres = (level.data.children != null && Object.keys(level.data.children).length > 0)
                                ? LevelCreator.createChildrenSpheres(LevelCreator.scene, level.parentSphere, level.data, level.data["childDiameter"], stats,
                                  level.data["y"], level.data["spreadRadius"])
                                : [];
        level.statsSpheres = LevelCreator.createStatsSpheres(LevelCreator.scene, LevelCreator.latestData, level.parentSphere, level.data["name"], level.data["diameter"] / 2);
        UI.updateElements();
    }
}


export class Stats {
    confirmed : number[] = [-1, 0];
    deaths : number[] = [-1, 0];
    active : number[] = [-1, 0];
    lat : number[] = [1000.0, 0.0];
    lon : number[] = [-1000.0, 0.0];

    constructor(confirmed? : number[], deaths? : number[], active?: number[], lat? : number[], lon? : number[]) {
        if (confirmed) this.confirmed = confirmed;
        if (deaths) this.deaths = deaths;
        if (active) this.active = active;
        if (lat) this.lat = lat;
        if (lon) this.lon = lon;
    }
}

export class Level {
    parentSphere : Mesh;
    childrenSpheres : Mesh[];
    statsSpheres : Mesh[];
    ancestorSphere : Mesh | undefined;
    data : any;
    stats : Stats;

    constructor(parentSphere : Mesh, childrenSphere : Mesh[], statsSpheres : Mesh[], ancestorSphere : Mesh | undefined, data : any, stats : Stats) {
        this.parentSphere = parentSphere;
        this.childrenSpheres = childrenSphere;
        this.statsSpheres = statsSpheres;
        this.ancestorSphere = ancestorSphere;
        this.data = data;
        this.stats = stats;

        this.parentSphere.metadata["level"] = this;
        this.childrenSpheres.map((sphere) => { sphere.metadata["level"] = this; });
    }

    dispose(complete : boolean) {
        return new Promise((resolve) => {
            if (complete) {
                this.parentSphere.dispose(undefined, complete);
                if (this.ancestorSphere) this.ancestorSphere.dispose(undefined, complete);
                LevelCreator.latestLevel = undefined;
            }
            this.childrenSpheres.map((sphere) => { sphere.dispose(false, true); });
            this.statsSpheres.map((sphere) => { sphere.dispose(undefined, true); });
            resolve();
        });
    }

    updateTime(delta : number | string) {
        if (!LevelCreator.latestLevel) {
            return;
        }
        let data : any = LevelCreator.latestLevel.data;
        if (data["children"] == null) {
            return;
        }
        
        let newIndex : number = LevelCreator.getIndexFromTime(data["dates"], data["time"]);
        if (typeof delta == 'string') {
            if (delta == "earliest") {
                newIndex = 0;
            } else if (delta == "latest") {
                newIndex = this.data.dates.length - 1;
            } else {
                return;
            }
        } else {
            newIndex += delta;
        }

        newIndex = Math.min(Math.max(newIndex, 0), Object.keys(data["dates"]).length - 1);
        if (newIndex != LevelCreator.getIndexFromTime(data["dates"], data["time"])) {
            this.dispose(false);
            LevelCreator.updateIndex(this, newIndex);
            this.childrenSpheres.map((sphere) => { sphere.metadata["level"] = this; });
        }
    }
}
