import {Application} from "pixi.js";
import {distance, Dot, getAngleBetween, pointBetween, SimulationObjects, Street} from "./pathParser";
import * as PIXI from "pixi.js";
import carImg1 from "../sprites/car-truck1.png";
import carImg2 from "../sprites/car-truck2.png";
import carImg3 from "../sprites/car-truck3.png";
import carImg4 from "../sprites/car-truck4.png";
import {Car, CarImpl} from "./car";
import {Environment, EnvironmentImpl} from "./environment";

const intersects = require('intersects');

export function initCars(app: Application, simulation: SimulationObjects) {

    const textures = [
        PIXI.Texture.from(carImg1),
        PIXI.Texture.from(carImg2),
        PIXI.Texture.from(carImg3),
        PIXI.Texture.from(carImg4)
    ];
    const carSpriteScale = .5;

    const environment: Environment = new EnvironmentImpl(simulation.streets);

    //let cars: Car[] = [];
    //let carsByStreet: { [key: string]: Car[] } = {};
    //simulation.streets.forEach((street) => carsByStreet[street.name] = []);
    const spawnCarEveryXTicks = 60 * 1;
    let ticksPassed = spawnCarEveryXTicks + 1;


    function spawnCar(): boolean {
        const street = simulation.streets[Math.floor(Math.random() * simulation.streets.length)];
        const sprite = new PIXI.Sprite(textures[Math.floor(Math.random() * textures.length)]);
        const car: Car = new CarImpl(sprite, street);
        car.sprite.x = street.dots[0]!.x;
        car.sprite.y = street.dots[0]!.y;
        car.sprite.rotation = street.dots[0]!.rotation ?? 0;
        car.sprite.pivot.x = car.sprite.width / 2;
        car.sprite.pivot.y = car.sprite.height / 2;
        car.sprite.scale.x = carSpriteScale;
        car.sprite.scale.y = carSpriteScale;

        if (carsByStreet[street.name].length === 0 || car.enoughDistanceBetween(carsByStreet[street.name][0])) {
            cars.push(car);
            carsByStreet[street.name] = [car, ...carsByStreet[street.name]];
            app.stage.addChild(car.sprite);
            return true;
        }
        return false;
    }









    const DISTANCE_CHECK_THRESHOLD = 60;

    function trySetPosition(car: Car, position: Dot): boolean {
        if (car.mustWait) {
            car.mustWait = false;
            return false;
        }
        const carIndexInStreet = carsByStreet[car.street.name].indexOf(car);
        //in this case, there is another car before the current car
        if (carsByStreet[car.street.name].length - 1 > carIndexInStreet) {
            if (!enoughDistanceBetween(car, carsByStreet[car.street.name][carIndexInStreet + 1])) {
                return false;
            }
        }
        if (position.checkForCollisions ?? car.street.dots[car.dotIndex].checkForCollisions) {
            car.checkCollisions = true

            const collisionCandidates: Car[] = cars.filter((c) => c.checkCollisions &&
                !c.garbage &&
                c !== car &&
                c.street !== car.street
            );
            let collision = false;
            if (collisionCandidates.length) {
                const carBounds = boundingPoints(car, position);
                const frontDot: Dot = getFrontDot(car, position)
                for (let i = 0; i < collisionCandidates.length; i++) {
                    if (distance(position, collisionCandidates[i].sprite) < DISTANCE_CHECK_THRESHOLD &&
                        intersects.polygonPolygon(carBounds, boundingPoints(collisionCandidates[i], collisionCandidates[i].sprite))
                    ) {
                        collision = true;

                        const angleCarRelToOther = Math.abs(getAngleBetween(frontDot, collisionCandidates[i].sprite) - frontDot.rotation!);
                        const otherFrontDot = getFrontDot(collisionCandidates[i])
                        const angleOtherRelToCar = Math.abs(getAngleBetween(otherFrontDot, position) - otherFrontDot.rotation!);
                        if(angleCarRelToOther > 0.4*Math.PI) {
                            continue;
                        }
                        if (angleCarRelToOther < angleOtherRelToCar) {
                            return false;
                        } else {
                            if (cars.indexOf(collisionCandidates[i]) > cars.indexOf(car)) {
                                collisionCandidates[i].mustWait = true;
                            }
                            break;
                        }
                        //if(angle > -Math.PI/2 && angle < Math.PI/2) {
                        //    return false;
                        //}
                        const pointsGraphic: PIXI.Graphics = new PIXI.Graphics();
                        pointsGraphic.lineStyle(2, collision ? 0xaa0044 : 0xFFFFFF, 1);
                        pointsGraphic.drawCircle(frontDot.x, frontDot.y, 2);
                        //pointsGraphic.drawPolygon(carBounds);
                        app.stage.addChild(pointsGraphic);
                        setTimeout(() => {
                            app.stage.removeChild(pointsGraphic);
                            pointsGraphic.destroy();
                        }, 10);

                    }
                }
            }
        } else {
            car.checkCollisions = false
        }
        car.sprite.x = position.x;
        car.sprite.y = position.y;
        if (position.rotation) {
            car.sprite.rotation = position.rotation;
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
                const distToTravel = car.pxPerTick ;//* delta;
                let dist = 0;
                let distToNext = distance(car.sprite, car.street.dots[car.dotIndex + 1]);
                while (dist < distToTravel) {
                    if (distToNext < distToTravel) {
                        dist += distToNext;
                        if (!incrementDotIndex(car)) {
                            break;
                        }
                        //tmpDot = car.street.dots[car.dotIndex]
                        //console.log(tmpDot);
                        //car.sprite.x = car.street.dots[car.dotIndex].x;
                        //car.sprite.y = car.street.dots[car.dotIndex].y;
                        //if (car.street.dots[car.dotIndex].rotation) {
                        //    car.sprite.rotation = car.street.dots[car.dotIndex].rotation!;
                        //}
                        distToNext = distance(car.sprite, car.street.dots[car.dotIndex + 1]);
                    } else if (distToNext > distToTravel) {
                        let distScale = 1 / (distToNext / distToTravel);
                        trySetPosition(car, pointBetween(car.sprite, car.street.dots[car.dotIndex + 1], distScale))
                        break;
                    } else {
                        incrementDotIndex(car);
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