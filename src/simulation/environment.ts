import {Car} from "./car";
import {distance, Dot, getAngleBetween, Street} from "./pathParser";
import intersects from "intersects";

export interface Environment {
    cars: Car[],
    carsByStreet: { [key: string]: Car[] }
    streets: Street[];
}

export class EnvironmentImpl implements Environment {
    cars: Car[] = [];
    carsByStreet: { [p: string]: Car[] } = {};
    streets: Street[];

    constructor(streets: Street[]) {
        this.streets = streets;
        streets.forEach((street) => this.carsByStreet[street.name] = []);
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
                        if (car.isAllowedToContinue({other: collisionCandidates[i], frontPoint: frontDot})) {
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


}