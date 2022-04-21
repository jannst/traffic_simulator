import {Car} from "./car";
import {Dot, Street} from "./pathParser";
import {Application} from "pixi.js";

export interface Environment {
    cars: Car[],
    carsByStreet: { [key: string]: Car[] }
    streets: Street[];
    trySetPosition: (car: Car, position: Dot) => boolean;
    garbageCollect: () => void
    spawnCar(car: Car): boolean
}

export class EnvironmentImpl implements Environment {
    cars: Car[] = [];
    carsByStreet: { [p: string]: Car[] } = {};
    streets: Street[];
    app: Application;

    constructor(app: Application, streets: Street[]) {
        this.app = app;
        this.streets = streets;
        streets.forEach((street) => this.carsByStreet[street.name] = []);
    }

    spawnCar(car: Car): boolean {
        if (this.carsByStreet[car.street.name].length === 0 ||
            car.enoughDistanceBetween(this.carsByStreet[car.street.name][0])
        ) {
            this.cars.push(car);
            this.carsByStreet[car.street.name] = [car, ...this.carsByStreet[car.street.name]];
            this.app.stage.addChild(car.sprite);
            return true;
        }
        return false;
    }

    trySetPosition(car: Car, position: Dot): boolean {
        if (car.mustWait) {
            car.mustWait = false;
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
                    if (car.wouldCollide({other: collisionCandidates[i], position: position, carBounds: carBounds})) {
                        if (car.isAllowedToContinue({other: collisionCandidates[i],
                            frontPoint: frontDot,
                            othersIndexBiggerThanOwn: this.cars.indexOf(collisionCandidates[i]) > this.cars.indexOf(car)
                        })) {
                            if (this.cars.indexOf(collisionCandidates[i]) > this.cars.indexOf(car)) {
                                collisionCandidates[i].mustWait = true;
                            }
                        } else {
                            return false;
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