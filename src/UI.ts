import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ActionManager, ExecuteCodeAction, SetValueAction } from "@babylonjs/core/Actions";
import { AdvancedDynamicTexture, TextBlock, StackPanel,  } from "@babylonjs/gui/2D";

import { Graphs } from "./Graphs";
import { LevelCreator, Level } from "./LevelCreator";
import { Color3 } from "@babylonjs/core/Maths/math";

export class UI {
	static fontsize : number = 25;
	static textColor : string = "white";
	static fieldWidth : number = 150;
	static fieldHeight : number = 50;
	static timeSpheres : Mesh[];
	static dashboard : Mesh;
	static dashboardTexture : AdvancedDynamicTexture;
	static timeTextBlock: TextBlock;
	static confirmedTextBlock : TextBlock;
	static deathsTextBlock: TextBlock;
	static activeTextBlock: TextBlock;
	static fullnameTextBlock: TextBlock;
	
    static create(scene : Scene) {
        UI.timeSpheres = [];
		UI.createTimeSpheres(scene);
		
		UI.dashboard = MeshBuilder.CreatePlane("dashboard", {width: 4.5, height: 3}, scene);
		UI.dashboard.position.set(0, 3, 10);
		UI.dashboard.billboardMode = Mesh.BILLBOARDMODE_Y;
		UI.dashboardTexture = AdvancedDynamicTexture.CreateForMesh(UI.dashboard, 9 * 50, 6 * 50, false);
		UI.dashboardTexture.background = "black";
		UI.timeTextBlock = new TextBlock("datatime", "latest");
		UI.confirmedTextBlock = new TextBlock("dataConfirmed", "0");
		UI.deathsTextBlock = new TextBlock("dataDeaths", "0");
		UI.activeTextBlock = new TextBlock("dataActive", "0");
		UI.fullnameTextBlock = new TextBlock("dataFullname", "name");
		UI.createDashboard(scene);

		UI.timeSpheres.map((sphere) => { sphere.position.y = 1; sphere.position.z = 6 });
    }

    static createTimeSpheres(scene : Scene) {
			let timeSphereDiameter = 0.5;
			//Time Controls
			//Earliest (1st sphere from left) sets the time to the first recorded date 
			let earliestTimeSphere : Mesh = MeshBuilder.CreateSphere("earliestTimeSphere", {diameter: timeSphereDiameter, segments: 8},scene);
			earliestTimeSphere.position.set(-2,0.25,0);
			earliestTimeSphere.rotation.set(0,0,Math.PI);
			let earliestTimeSphereTexture : Texture = new Texture("./images/UI/earliest_sphere_texture.png", scene);
			let earliestTimeSphereMat = new StandardMaterial("earliestTimeSphereMat", scene);
			earliestTimeSphereMat.diffuseTexture = earliestTimeSphereTexture as Texture;
            earliestTimeSphere.material = earliestTimeSphereMat;   
            UI.timeSpheres.push(earliestTimeSphere);
			earliestTimeSphere.actionManager = new ActionManager(scene);
			earliestTimeSphere.actionManager.registerAction(
				new ExecuteCodeAction(ActionManager.OnPickTrigger, () => { if (LevelCreator.latestLevel) LevelCreator.latestLevel.updateTime("earliest") }));
			earliestTimeSphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOverTrigger, earliestTimeSphere.material, "wireframe", true));
			earliestTimeSphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOutTrigger, earliestTimeSphere.material, "wireframe", false));
			let earliestTimeSphereLabelTexture : Texture = new Texture("./images/UI/Earliest_Date.png",scene);
			let earliestTimeSphereLabel = UI.createLabel(scene,earliestTimeSphere,timeSphereDiameter,earliestTimeSphereLabelTexture);

			//Previous (2nd sphere from left) previous date from curent date
			let previousTimeSphere : Mesh = MeshBuilder.CreateSphere("previousTimeSphere", {diameter: timeSphereDiameter, segments: 8},scene);
			previousTimeSphere.position.set(-1,0.25,0);
			previousTimeSphere.rotation.set(0,0,Math.PI);
			let previousTimeSphereTexture : Texture = new Texture("./images/UI/previous_sphere_texture.png", scene);
			let previousTimeSphereMat = new StandardMaterial("previousTimeSphereMat", scene);
			previousTimeSphereMat.diffuseTexture = previousTimeSphereTexture as Texture;
			previousTimeSphere.material = previousTimeSphereMat;
            UI.timeSpheres.push(previousTimeSphere);
			previousTimeSphere.actionManager = new ActionManager(scene);
			previousTimeSphere.actionManager.registerAction(
				new ExecuteCodeAction(ActionManager.OnPickTrigger, () => { if (LevelCreator.latestLevel) LevelCreator.latestLevel.updateTime(-7) }));
			previousTimeSphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOverTrigger, previousTimeSphere.material, "wireframe", true));
			previousTimeSphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOutTrigger, previousTimeSphere.material, "wireframe", false));
			let previousTimeSphereLabelTexture : Texture = new Texture("./images/UI/Previous_Date.png",scene);
			let previousTimeSphereLabel = UI.createLabel(scene,previousTimeSphere,timeSphereDiameter,previousTimeSphereLabelTexture);

			//Next (3rd sphere from left) next date from curent date
			let nextTimeSphere : Mesh = MeshBuilder.CreateSphere("nextTimeSphere", {diameter: timeSphereDiameter, segments: 8},scene);
			nextTimeSphere.position.set(1,0.25,0);
			nextTimeSphere.rotation.set(0,0,Math.PI);
			let nextTimeSphereTexture : Texture = new Texture("./images/UI/next_sphere_texture.png", scene);
			let nextTimeSphereMat = new StandardMaterial("nextTimeSphereMat", scene);
			nextTimeSphereMat.diffuseTexture = nextTimeSphereTexture as Texture;
			nextTimeSphere.material = nextTimeSphereMat;
            UI.timeSpheres.push(nextTimeSphere);
			nextTimeSphere.actionManager = new ActionManager(scene);
			nextTimeSphere.actionManager.registerAction(
				new ExecuteCodeAction(ActionManager.OnPickTrigger, () => { if (LevelCreator.latestLevel) LevelCreator.latestLevel.updateTime(7) }));
			nextTimeSphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOverTrigger, nextTimeSphere.material, "wireframe", true));
			nextTimeSphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOutTrigger, nextTimeSphere.material, "wireframe", false));
			let nextTimeSphereLabelTexture : Texture = new Texture("./images/UI/Next_Date.png",scene);
			let nextTimeSphereLabel = UI.createLabel(scene,nextTimeSphere,timeSphereDiameter,nextTimeSphereLabelTexture);

			//Previous (4th sphere from left) most recent recorded date
			let latestTimeSphere : Mesh = MeshBuilder.CreateSphere("latestTimeSphere", {diameter: timeSphereDiameter, segments: 8},scene);
			latestTimeSphere.position.set(2,0.25,0);
			latestTimeSphere.rotation.set(0,0,Math.PI);
			let latestTimeSphereTexture : Texture = new Texture("./images/UI/latest_sphere_texture.png", scene);
			let latestTimeSphereMat = new StandardMaterial("latestTimeSphereMat", scene);
			latestTimeSphereMat.diffuseTexture = latestTimeSphereTexture as Texture;
			latestTimeSphere.material = latestTimeSphereMat;
            UI.timeSpheres.push(latestTimeSphere);
			latestTimeSphere.actionManager = new ActionManager(scene);
			latestTimeSphere.actionManager.registerAction(
				new ExecuteCodeAction(ActionManager.OnPickTrigger, () => { if (LevelCreator.latestLevel) LevelCreator.latestLevel.updateTime("latest") }));
			latestTimeSphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOverTrigger, latestTimeSphere.material, "wireframe", true));
			latestTimeSphere.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOutTrigger, latestTimeSphere.material, "wireframe", false));
			let latestTimeSphereLabelTexture : Texture = new Texture("./images/UI/Lastest_Date.png",scene);
			let latestTimeSphereLabel = UI.createLabel(scene,latestTimeSphere,timeSphereDiameter,latestTimeSphereLabelTexture);
	}
	
	static createDashboard(scene : Scene) {
		let panel : StackPanel = new StackPanel();
		panel.isVertical = true;
		UI.dashboardTexture.addControl(panel);

		// Header on top
		let titleLabel = new TextBlock("title", "US Covid 19 3D data explorer");
		titleLabel.color = UI.textColor;
		titleLabel.fontSize = UI.fontsize;
		titleLabel.widthInPixels = UI.fieldWidth * 3;
		titleLabel.heightInPixels = UI.fieldHeight;
		panel.addControl(titleLabel);

		let fullnamePanel = new StackPanel();
		fullnamePanel.isVertical = false;
		let fullnameLabel = new TextBlock("fullname", "Name: ");
		fullnameLabel.color = UI.textColor;
		fullnameLabel.fontSize = UI.fontsize;
		fullnameLabel.widthInPixels = UI.fieldWidth;
		fullnamePanel.addControl(fullnameLabel);
		UI.fullnameTextBlock.color = UI.textColor;
		UI.fullnameTextBlock.fontSize = UI.fontsize;
		UI.fullnameTextBlock.widthInPixels = UI.fieldWidth * 2;
		fullnamePanel.addControl(UI.fullnameTextBlock);
		fullnamePanel.heightInPixels = UI.fieldHeight;
		panel.addControl(fullnamePanel);

		let timePanel = new StackPanel();
		timePanel.isVertical = false;
		let timeLabel = new TextBlock("time", "Date: ");
		timeLabel.color = UI.textColor;
		timeLabel.fontSize = UI.fontsize;
		timeLabel.widthInPixels = UI.fieldWidth;
		timePanel.addControl(timeLabel);
		UI.timeTextBlock.color = UI.textColor;
		UI.timeTextBlock.fontSize = UI.fontsize;
		UI.timeTextBlock.widthInPixels = UI.fieldWidth * 2;
		timePanel.addControl(UI.timeTextBlock);
		timePanel.heightInPixels = UI.fieldHeight;
		panel.addControl(timePanel);

		let confirmedPanel = new StackPanel();
		confirmedPanel.isVertical = false;
		let confirmedLabel = new TextBlock("confirmed", "Confirmed: ");
		confirmedLabel.color = UI.textColor;
		confirmedLabel.fontSize = UI.fontsize;
		confirmedLabel.widthInPixels = UI.fieldWidth;
		confirmedPanel.addControl(confirmedLabel);
		UI.confirmedTextBlock.color = UI.textColor;
		UI.confirmedTextBlock.fontSize = UI.fontsize;
		UI.confirmedTextBlock.widthInPixels = UI.fieldWidth * 2;
		confirmedPanel.addControl(UI.confirmedTextBlock);
		confirmedPanel.heightInPixels = UI.fieldHeight;
		panel.addControl(confirmedPanel);

		let deathsPanel = new StackPanel();
		deathsPanel.isVertical = false;
		let deathsLabel = new TextBlock("deaths", "Deaths: ");
		deathsLabel.color = UI.textColor;
		deathsLabel.fontSize = UI.fontsize;
		deathsLabel.widthInPixels = UI.fieldWidth;
		deathsPanel.addControl(deathsLabel);
		UI.deathsTextBlock.color = UI.textColor;
		UI.deathsTextBlock.fontSize = UI.fontsize;
		UI.deathsTextBlock.widthInPixels = UI.fieldWidth * 2;
		deathsPanel.addControl(UI.deathsTextBlock);
		deathsPanel.heightInPixels = UI.fieldHeight;
		panel.addControl(deathsPanel);

		let activePanel = new StackPanel();
		activePanel.isVertical = false;
		let activeLabel = new TextBlock("active", "Active: ");
		activeLabel.color = UI.textColor;
		activeLabel.fontSize = UI.fontsize;
		activeLabel.widthInPixels = UI.fieldWidth;
		activePanel.addControl(activeLabel);
		UI.activeTextBlock.color = UI.textColor;
		UI.activeTextBlock.fontSize = UI.fontsize;
		UI.activeTextBlock.widthInPixels = UI.fieldWidth * 2;
		activePanel.addControl(UI.activeTextBlock);
		activePanel.heightInPixels = UI.fieldHeight;
		panel.addControl(activePanel);

	}

	static updateDashboard(data : any) {
		UI.fullnameTextBlock.text = data["full_name"].toString();
		UI.timeTextBlock.text = data["time"].toString();
		UI.confirmedTextBlock.text = data["confirmed"].toString();
		UI.deathsTextBlock.text = data["deaths"].toString();
		UI.activeTextBlock.text = data["active"].toString();
	}

	static updateElements(updateGraphs? : boolean) {
		let data = LevelCreator.latestData;
		this.updateDashboard(data);
		if (updateGraphs) Graphs.updateGraphs(data);
	}

	static createLabel(scene: Scene, sphere : Mesh,diameter : number, texture : Texture)
	{
		let namePlane = MeshBuilder.CreatePlane("namePlane" + sphere.name, {size: diameter * 1.5}, scene);
		namePlane.parent = sphere;
		namePlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
        namePlane.position.set(0, diameter*0.5, 0);
		let nameMaterial = new StandardMaterial("namemat" + texture.name, scene);
		nameMaterial.diffuseTexture = texture as Texture;
		nameMaterial.diffuseTexture.hasAlpha = true;
        namePlane.material = nameMaterial;
	}
}