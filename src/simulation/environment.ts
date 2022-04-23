import {Car} from "./car";
import {Dot} from "./pathParser";
import {Application} from "pixi.js";
import {Street} from "./Street";
import {Viewport} from "pixi-viewport";

export interface Environment {
    cars: Car[],
    carsByStreet: { [key: string]: Car[] }
    streets: Street[];
    trySetPosition: (car: Car, position: Dot) => boolean;
    garbageCollect: () => void
    spawnCar: (car: Car) => boolean
    changeStreet: (car: Car, oldStreet: Street) => void
}


export class EnvironmentImpl implements Environment {
    cars: Car[] = [];
    carsByStreet: { [p: string]: Car[] } = {};
    streets: Street[];
    viewport: Viewport;

    constructor(viewport: Viewport, streets: Street[]) {
        this.viewport = viewport;
        this.streets = streets;
        streets.forEach((street) => this.carsByStreet[street.name] = []);
    }

    spawnCar(car: Car): boolean {
        if (this.carsByStreet[car.street.name].length === 0 ||
            car.enoughDistanceBetween(this.carsByStreet[car.street.name][0])
        ) {
            this.cars.push(car);
            this.carsByStreet[car.street.name] = [car, ...this.carsByStreet[car.street.name]];
            this.viewport.addChild(car.sprite);
            return true;
        }
        return false;
    }

    changeStreet(car: Car, oldStreet: Street) {
        const oldIndex = this.carsByStreet[oldStreet.name].indexOf(car);
        this.carsByStreet[oldStreet.name].splice(oldIndex, 1);

        //cars must be insertet at "right" place to make sure inside lane collision detection works
        const newAry = this.carsByStreet[car.street.name];
        if (newAry.length === 0) {
            newAry.push(car);
        } else {
            for (let i = newAry.length - 1; i >= 0; i--) {
                const otherCar = newAry[i];
                if (otherCar.dotIndex <= car.dotIndex) {
                    //console.log(`car: ${car.dotIndex} ${otherCar.dotIndex}`);
                    newAry.splice(Math.min(i+1, newAry.length-1), 0, car)
                    break;
                }
                if (i === 0) {
                    newAry.splice(i, 0, car)
                }
            }
        }
    }

    trySetPosition(car: Car, position: Dot): boolean {
        if (car.mustWait) {
            car.mustWait = false;
            return false;
        }
        if(car.street.dots[car.dotIndex].trafficLight?.state === false) {
            return false;
        }
        const carIndexInStreet = this.carsByStreet[car.street.name].indexOf(car);
        //in this case, there is another car before the current car
        if (this.carsByStreet[car.street.name].length - 1 > carIndexInStreet) {
            if (!car.enoughDistanceBetween(this.carsByStreet[car.street.name][carIndexInStreet + 1])) {
                return false;
            }
        }
        if (position.checkForCollisions ?? car.street.dots[car.dotIndex].checkForCollisions) {
            car.checkCollisions = true

            const collisionCandidates: Car[] = this.cars.filter((other) => car.isCollisionCandidate(other));
            if (collisionCandidates.length) {
                const carBounds = car.boundingPoints(position);
                const frontDot: Dot = car.getFrontDot(position)
                for (let i = 0; i < collisionCandidates.length; i++) {
                    //only quick and dirty collision detection
                    if (car.wouldCollide({other: collisionCandidates[i], position: position, carBounds: carBounds})) {
                        switch (car.isAllowedToContinue({other: collisionCandidates[i], frontPoint: frontDot})) {
                            case 1:
                                continue;
                            case -1:
                                return false;
                            case 0:
                                if (this.cars.indexOf(collisionCandidates[i]) > this.cars.indexOf(car)) {
                                    collisionCandidates[i].mustWait = true;
                                }
                                break;
                        }
                    }
                }
            }
        } else {
            car
                .checkCollisions = false
        }

        car.sprite.x = position.x;
        car.sprite.y = position.y;
        if (position.rotation) {
            car.sprite.rotation = position.rotation;
        }
        return true;
    }

    garbageCollect() {
        this.cars = this.cars.filter(car => !car.garbage);
        Object.entries(this.carsByStreet).forEach(([key, value]) => {
            this.carsByStreet[key] = value.filter(car => !car.garbage);
        })
    }

}