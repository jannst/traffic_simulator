import * as PIXI from 'pixi.js';
import bgImg from "../Haw_Porsche_Center_Google_Earth.png";
import {loadSimulationObjectsFromSvg, SimulationObjects} from "./pathParser";
import {Environment, EnvironmentImpl} from "./environment";
import {Car, CarImpl} from "./car";
import {AlgorithmArgs, tickAlgo, TrafficLightConfiguration} from "../algo/algorithm";
import {TrafficLightImpl} from "./TrafficLight";
import {Viewport} from "pixi-viewport";
import {Constraint, ConstraintType} from "./Constraint";
import {InteractionHandler} from "./interactions";

export interface Simulation extends SimulationObjects {
    app: PIXI.Application,
    constraints: Constraint[]
    interactionHandler: InteractionHandler
}

export function createSimulation(rawSvgData: string, parent: HTMLElement): Simulation {
    const simulationObjects: SimulationObjects = loadSimulationObjectsFromSvg(rawSvgData)
    const app = new PIXI.Application({
        //height: bgHeight,
        //width: bgWidth,
        resizeTo: parent,
        backgroundColor: 0x333333,
        resolution: window.devicePixelRatio || 1,
    });

    //document.body.appendChild(app.view)
    // create viewport
    const viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: simulationObjects.imageWidth,
        worldHeight: simulationObjects.imageHeight,
        interaction: app.renderer.plugins.interaction
    })
    // add the viewport to the stage
    app.stage.addChild(viewport)
    // activate plugins
    viewport.drag().pinch().wheel().decelerate();

    const bgSprite = PIXI.Sprite.from(bgImg);
    viewport.addChild(bgSprite);

    const environment: Environment = new EnvironmentImpl(viewport, simulationObjects.streets);
    const availiableStreets = simulationObjects.streets.filter((street) => !street.parent);

    const constraints: Constraint[] = [];
    const interactionHandler = new InteractionHandler(constraints, viewport);
    //street highllighters
    simulationObjects.streets.forEach((street) => {
        const pointsGraphic: PIXI.Graphics = new PIXI.Graphics();
        street.setGraphics(pointsGraphic);
        viewport.addChild(pointsGraphic);
    });

    //traffic light highlighters
    simulationObjects.trafficLights.forEach((trafficLight) => {
        const pointsGraphic: PIXI.Graphics = new PIXI.Graphics();
        trafficLight.onClick = () => interactionHandler.onClickTrafficLight(trafficLight);
        trafficLight.setGraphics(pointsGraphic);
        trafficLight.drawState();
        viewport.addChild(pointsGraphic);
    });



    //traffic light execution ticker
    setInterval(() => {
        simulationObjects.trafficLights.forEach((trafficLight) => trafficLight.tick());
        const params: AlgorithmArgs = {
            variables: simulationObjects.trafficLights as any as TrafficLightConfiguration[],
            constraints: [],
            updateTrafficLight: (trafficLight, state, timeUntilRed) => {
                const mutableLight = trafficLight as any as TrafficLightImpl;
                mutableLight.setState(state);
                if(timeUntilRed) {
                    mutableLight.untilRedSec = timeUntilRed;
                }
            }
        }
        tickAlgo(params);
    }, 1000);

    //delete unused cars
    setInterval(() => environment.garbageCollect(), 1000);

    let elapsedMs = 0;
    app.ticker.add((delta) => {
        elapsedMs += app.ticker.elapsedMS;
        //generate new cars
        if (elapsedMs >= 100) {
            availiableStreets.filter((street) => Math.random() <= street.percentage).forEach((street) => {
                new CarImpl(environment, street).spawn();
            });
            elapsedMs = 0;
        }
        //process cars
        environment.cars.forEach((car: Car) => car.tick(delta));
    });
    app.start();
    return {app: app, constraints: constraints, interactionHandler: interactionHandler,  ...simulationObjects};
}
