import * as PIXI from 'pixi.js';
import bgImg from "../Haw_Porsche_Center_Google_Earth.png";
import {loadSimulationObjectsFromSvg, SimulationObjects} from "./pathParser";
import {Environment, EnvironmentImpl} from "./environment";
import {Car, CarImpl} from "./car";
import {findSubSystems, tickAlgo} from "../algo/algorithm";
import {Viewport} from "pixi-viewport";
import {Constraint} from "./Constraint";
import {ConstraintHandler} from "./interactions";
import {loadConfig, saveConfig} from "./config";

export interface Simulation extends SimulationObjects {
    app: PIXI.Application,
    constraints: Constraint[]
    setConstraintVisibility: (value: boolean) => void
    setshowTrafficLightNet: (value: boolean) => void
    constraintHandler: ConstraintHandler
    setSpeed: (speed: number) => void;
}

export var simulationSpeed = 15;
export var showTrafficLightNet = false;

export function createSimulation(name: string, rawSvgData: string, parent: HTMLElement): Simulation {
    const simulationObjects: SimulationObjects = loadSimulationObjectsFromSvg(rawSvgData)
    const app = new PIXI.Application({
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
    const constraintsContainer = new PIXI.Container();
    const setConstraintVisible = (value: boolean) => constraintsContainer.visible = value
    const setTrafficLightNetVisible = (value: boolean) => showTrafficLightNet = value
    viewport.addChild(constraintsContainer);
    const interactionHandler = new ConstraintHandler(constraints, constraintsContainer);

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

    const tickTrafficLights = () => {
        simulationObjects.trafficLights.forEach((trafficLight) => trafficLight.tick());
        tickAlgo(simulationObjects.trafficLights, constraints);
    };


    //traffic light execution ticker
    let intervalId = setInterval(tickTrafficLights, 1000 / simulationSpeed);


    //delete unused cars
    setInterval(() => environment.garbageCollect(), 1000);

    let elapsedMs = 0;
    app.ticker.add((delta) => {
        elapsedMs += app.ticker.elapsedMS;
        //generate new cars
        if (elapsedMs >= 100 / simulationSpeed) {
            availiableStreets.filter((street) => Math.random() <= street.percentage).forEach((street) => {
                new CarImpl(environment, street).spawn();
            });
            elapsedMs = 0;
        }
        //process cars
        environment.cars.forEach((car: Car) => car.tick(delta));
    });
    const simulation: Simulation = {
        app: app,
        constraints: constraints,
        constraintHandler: interactionHandler,
        setSpeed: (val) => {
            simulationSpeed = val;
            clearInterval(intervalId);
            intervalId = setInterval(tickTrafficLights, 1000 / simulationSpeed);
        },
        setshowTrafficLightNet: setTrafficLightNetVisible,
        setConstraintVisibility: setConstraintVisible, ...simulationObjects,
    };
    loadConfig(name, simulation);
    findSubSystems(simulationObjects.trafficLights, constraints);
    setInterval(() => saveConfig(name, simulation), 5000);
    app.start();
    return simulation;
}
