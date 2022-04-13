import {Application} from "pixi.js";
import {distance, Dot, pointBetween, SimulationObjects, Street} from "./pathParser";
import * as PIXI from "pixi.js";
import carImg1 from "../sprites/car-truck1.png";
import carImg2 from "../sprites/car-truck2.png";
import carImg3 from "../sprites/car-truck3.png";
import carImg4 from "../sprites/car-truck4.png";

export interface SimCar {
    sprite: PIXI.Sprite,
    street: Street,
    dotIndex: number,
    pxPerTick: number,
    garbage: boolean
}

export function initCars(app: Application, simulation: SimulationObjects) {

    const textures = [
        PIXI.Texture.from(carImg1),
        PIXI.Texture.from(carImg2),
        PIXI.Texture.from(carImg3),
        PIXI.Texture.from(carImg4)
    ];
    const carSpriteScale = .5;

    let cars: SimCar[] = [];
    const spawnCarEveryXTicks = 60 * 2;
    let ticksPassed = spawnCarEveryXTicks + 1;

    function spawnCar() {
        console.log("spawn car");
        const street = simulation.streets[Math.floor(Math.random() * simulation.streets.length)];
        const car: SimCar = {
            pxPerTick: 1.5,
            street: street,
            dotIndex: 0,
            sprite: new PIXI.Sprite(textures[Math.floor(Math.random() * textures.length)]),
            garbage: false
        };
        car.sprite.x = street.dots[0]!.x;
        car.sprite.y = street.dots[0]!.y;
        car.sprite.rotation = street.dots[0]!.rotation ?? 0;
        car.sprite.pivot.x = car.sprite.width / 2;
        car.sprite.pivot.y = car.sprite.height / 2;
        car.sprite.scale.x = carSpriteScale;
        car.sprite.scale.y = carSpriteScale;
        cars.push(car);
        app.stage.addChild(car.sprite);
    }


    /*
        Array.apply(null, {length: 20} as any).map(() => {
        return {
            sprite: new PIXI.Sprite(texture),
            cy: cy + Math.random() * 800 - 400,
            cx: cx + Math.random() * 800 - 400,
            currentAngle: 0,
            angleStep: Math.random() * .1,
            radius: 150 * Math.random()
        };

     */

    //})

    function incrementDotIndex(car: SimCar): boolean {
        car.dotIndex++;
        if (car.dotIndex >= car.street.dots.length - 1) {
            car.garbage = true;
            car.sprite.destroy();
            return false;
        }
        return true;
    }


    app.ticker.add((delta) => {
        //generate new cars
        if (ticksPassed + Math.random() * 100 > spawnCarEveryXTicks) {
            ticksPassed = 0;
            //garbage collect old cars
            cars = cars.filter(car => !car.garbage);
            spawnCar();
        } else {
            ticksPassed += delta;
        }

        //process cars
        cars.forEach((car) => {
            if (car.garbage) {
                return;
            }
            if (car.dotIndex < car.street.dots.length - 1) {
                const distToTravel = car.pxPerTick * delta;
                let dist = 0;
                let distToNext = distance(car.sprite, car.street.dots[car.dotIndex + 1]);
                while (dist < distToTravel) {
                    if (distToNext < distToTravel) {
                        dist += distToNext;
                        if (!incrementDotIndex(car)) {
                            break;
                        }
                        car.sprite.x = car.street.dots[car.dotIndex].x;
                        car.sprite.y = car.street.dots[car.dotIndex].y;
                        if (car.street.dots[car.dotIndex].rotation) {
                            car.sprite.rotation = car.street.dots[car.dotIndex].rotation!;
                        }
                        distToNext = distance(car.sprite, car.street.dots[car.dotIndex + 1]);
                    } else if (distToNext > distToTravel) {
                        let distScale = 1 / (distToNext / distToTravel);
                        const newPt = pointBetween(car.sprite, car.street.dots[car.dotIndex + 1], distScale);
                        car.sprite.x = newPt.x;
                        car.sprite.y = newPt.y;
                        //car.sprite.rotation = getRotation(car.sprite, car.street.dots[car.dotIndex + 1]);
                        break;
                    } else {
                        if (!incrementDotIndex(car)) {
                            break;
                        }
                        car.sprite.x = car.street.dots[car.dotIndex].x;
                        car.sprite.y = car.street.dots[car.dotIndex].y;
                        if (car.street.dots[car.dotIndex].rotation) {
                            car.sprite.rotation = car.street.dots[car.dotIndex].rotation!;
                        }
                        break;
                    }
                }
            } else {
                car.garbage = true;
                car.sprite.destroy();
            }
        });


        //car.sprite.x = car.cx + Math.sin(car.currentAngle) * car.radius;
        //car.sprite.y = car.cy + Math.cos(car.currentAngle) * car.radius;
        //car.sprite.rotation = -car.currentAngle;
        //car.currentAngle += car.angleStep * delta % 360;
    });
}