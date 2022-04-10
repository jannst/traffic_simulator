import * as PIXI from 'pixi.js';
import carImg from "../sprites/car-truck3.png";
import bgImg from "../Haw_Porsche_Center_Google_Earth.png";
import {bgHeight, bgWidth} from "../App";
import {textStyle} from "styled-system";
import {Dot} from "./pathParser";

interface SimCar {
    sprite: PIXI.Sprite,
    cx: number,
    cy: number,
    currentAngle: number,
    angleStep: number,
    radius: number
}

export function createApp(path: Dot[]): PIXI.Application {
    const app = new PIXI.Application({
        height: bgHeight,
        width: bgWidth,
        backgroundColor: 0x1099bb,
        resolution: window.devicePixelRatio || 1,
    });

    const bgSprite = PIXI.Sprite.from(bgImg);
    app.stage.addChild(bgSprite);

    const pointsGraphic: PIXI.Graphics = new PIXI.Graphics();
    pointsGraphic.lineStyle(2, 0xFFFFFF, 1);
    console.log(path);
    path.forEach((point) => pointsGraphic.drawCircle(point.x, point.y, 5));
    app.stage.addChild(pointsGraphic);


    const cx = app.screen.width / 2;
    const cy = app.screen.height / 2;

    const texture = PIXI.Texture.from(carImg);
    const cars: SimCar[] = Array.apply(null, {length: 20} as any).map(() => {
        return {
            sprite: new PIXI.Sprite(texture),
            cy: cy + Math.random() * 800 - 400,
            cx: cx + Math.random() * 800 - 400,
            currentAngle: 0,
            angleStep: Math.random() * .1,
            radius: 150 * Math.random()
        };

    })

    cars.forEach((car) => {
        car.sprite.x = car.cx + Math.sin(car.currentAngle) * car.radius;
        car.sprite.y = car.cy + Math.cos(car.currentAngle) * car.radius;

        //let graphics: PIXI.Graphics = new PIXI.Graphics();
        //graphics.lineStyle(2, 0xFFFFFF, 1);
        //car.sprite.calculateBounds();
        //graphics.drawRect(0,0, car.sprite.width, car.sprite.height);
        //car.sprite.addChild(graphics);
        app.stage.addChild(car.sprite);
        car.sprite.scale.x = .3;
        car.sprite.scale.y = .3;
    });


    app.ticker.add((delta) => {
        cars.forEach((car) => {
            car.sprite.x = car.cx + Math.sin(car.currentAngle) * car.radius;
            car.sprite.y = car.cy + Math.cos(car.currentAngle) * car.radius;
            car.sprite.rotation = -car.currentAngle;
            car.currentAngle += car.angleStep * delta % 360;
        });
    });
    app.start();
    return app;
}
