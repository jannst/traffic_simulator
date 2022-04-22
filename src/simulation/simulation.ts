import * as PIXI from 'pixi.js';
import bgImg from "../Haw_Porsche_Center_Google_Earth.png";
import {bgHeight, bgWidth} from "../App";
import {loadSimulationObjectsFromSvg, SimulationObjects} from "./pathParser";
import {initCars} from "./carTicker";
import {Environment, EnvironmentImpl} from "./environment";
import {Car, CarImpl} from "./car";

export interface Simulation extends SimulationObjects{
    app: PIXI.Application,
}

export async function createApp(svgPath: string): Promise<Simulation> {
    const app = new PIXI.Application({
        height: bgHeight,
        width: bgWidth,
        backgroundColor: 0x1099bb,
        resolution: window.devicePixelRatio || 1,
    });

    const bgSprite = PIXI.Sprite.from(bgImg);
    app.stage.addChild(bgSprite);

    const simulationObjects: SimulationObjects = await loadSimulationObjectsFromSvg(svgPath)
    const environment: Environment = new EnvironmentImpl(app, simulationObjects.streets);
    const availiableStreets = simulationObjects.streets.filter((street) => !street.parent);

    //street highllighters
    simulationObjects.streets.forEach((street) => {
        const pointsGraphic: PIXI.Graphics = new PIXI.Graphics();
        street.setGraphics(pointsGraphic);
        app.stage.addChild(pointsGraphic);
    });

    //traffic light highlighters
    simulationObjects.trafficLights.forEach((trafficLight) => {
        const pointsGraphic: PIXI.Graphics = new PIXI.Graphics();
        trafficLight.setGraphics(pointsGraphic);
        //just for drawing
        trafficLight.setState(trafficLight.state);
        app.stage.addChild(pointsGraphic);
    });


    //delete unused cars
    setInterval(() => environment.garbageCollect(), 1000);

    let elapsedMs = 0;
    app.ticker.add((delta) => {
        elapsedMs += app.ticker.elapsedMS;
        //generate new cars
        if(elapsedMs >= 100) {
            availiableStreets.filter((street) => Math.random() <= street.percentage).forEach((street) => {
                new CarImpl(environment, street).spawn();
            });
            elapsedMs = 0;
        }
        //process cars
        environment.cars.forEach((car: Car) => car.tick(delta));
    });
    app.start();
    return {app: app, ...simulationObjects};
}
