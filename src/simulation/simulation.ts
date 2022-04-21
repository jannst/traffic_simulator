import * as PIXI from 'pixi.js';
import bgImg from "../Haw_Porsche_Center_Google_Earth.png";
import {bgHeight, bgWidth} from "../App";
import {SimulationObjects} from "./pathParser";
import {initCars} from "./carTicker";

export function createApp(simulationObjects: SimulationObjects): PIXI.Application {
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
        street.dots.forEach((point) => {
                pointsGraphic.lineStyle(1, point.checkForCollisions ? 0xFF0000 : 0xFFFFFF, 1);
                pointsGraphic.drawCircle(point.x, point.y, 1);
            }
        );
        app.stage.addChild(pointsGraphic);
    });

    simulationObjects.trafficLights.forEach((trafficLight) => {
        const pointsGraphic: PIXI.Graphics = new PIXI.Graphics();
        pointsGraphic.lineStyle(2, 0x00FF00, 1);
        pointsGraphic.drawPolygon(trafficLight.polygon);
        app.stage.addChild(pointsGraphic);
    });
    initCars(app, simulationObjects);
    app.start();
    return app;
}
