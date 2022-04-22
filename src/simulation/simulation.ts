import * as PIXI from 'pixi.js';
import bgImg from "../Haw_Porsche_Center_Google_Earth.png";
import {bgHeight, bgWidth} from "../App";
import {loadSimulationObjectsFromSvg, SimulationObjects} from "./pathParser";
import {initCars} from "./carTicker";

export interface Simulation extends SimulationObjects{
    app: PIXI.Application,
}

export async function createApp(svgPath: string): Promise<Simulation> {
    const simulationObjects: SimulationObjects = await loadSimulationObjectsFromSvg(svgPath)
    const app = new PIXI.Application({
        height: bgHeight,
        width: bgWidth,
        backgroundColor: 0x1099bb,
        resolution: window.devicePixelRatio || 1,
    });

    const bgSprite = PIXI.Sprite.from(bgImg);
    app.stage.addChild(bgSprite);

    simulationObjects.streets.forEach((street) => {
        const pointsGraphic: PIXI.Graphics = new PIXI.Graphics();
        street.setGraphics(pointsGraphic);
        app.stage.addChild(pointsGraphic);
    });

    simulationObjects.trafficLights.forEach((trafficLight) => {
        const pointsGraphic: PIXI.Graphics = new PIXI.Graphics();
        trafficLight.setGraphics(pointsGraphic);
        //just for drawing
        trafficLight.setState(trafficLight.state);
        app.stage.addChild(pointsGraphic);
    });

    initCars(app, simulationObjects);
    app.start();
    return {app: app, ...simulationObjects};
}
