import {Sprite} from "pixi.js";
import {distance, Dot, getAngleBetween, pointBetween, rotate, Street} from "./pathParser";
import intersects from "intersects";
import * as PIXI from "pixi.js";
import {Environment} from "./environment";
import carImg1 from "../sprites/car-truck1.png";
import carImg2 from "../sprites/car-truck2.png";
import carImg3 from "../sprites/car-truck3.png";
import carImg4 from "../sprites/car-truck4.png";

export interface Car {
    sprite: Sprite,
    street: Street,
    dotIndex: number,
    pxPerTick: number,
    garbage: boolean,
    checkCollisions: boolean,
    mustWait?: boolean

    /***
     * Function which is used to check if there is enough distance between the current car and the
     * other car which is the predecessor car on the same street
     * @param other
     */
    enoughDistanceBetween: (other: Car) => boolean
    /**
     * Yields the points of the polygon enclosing the car
     * Format: [x1, y1, x2, y2, ...]
     * @param position
     */
    boundingPoints: (position?: Dot) => number[]
    /**
     * Yields the point in the middle of the front bumper
     * @param position
     */
    getFrontDot: (position?: Dot) => Dot

    /**
     * Determines if the car, at the new position or at the current position, if no position is defined,
     * would collide with the other car
     * A collision is present, if the polygon, enclosing the cars intersect
     * @param args
     */
    wouldCollide(args: { other: Car, position?: Dot, carBounds?: number[] }): boolean

    /**
     * Function for pre filtering possible collsion candidates
     * @param other
     */
    isCollisionCandidate(other: Car): boolean;

    /**
     * Will be called, if at collision, or possible collsion with the other car is present
     * Decides, if the current car is allowed to continue
     * @param args
     */
    isAllowedToContinue(args: { other: Car, frontPoint?: Dot }): boolean

    /**
     * Tries to add the car to the map
     * If these is not enough space in the street, the car will not be spawned and false is returned
     */
    spawn(): boolean

    /**
     * Process a tick
     */
    tick(delta:number): void
}

//for collision detection
//before polygon intersection check is performend, the distance between 2 cars is calculated
//if the calculated distance > DISTANCE_CHECK_THRESHOLD => do not perform polygon intersection check and return false
const DISTANCE_CHECK_THRESHOLD = 60;

//the minimum distance beween 2 cars on the same lane. Anything more close is considered as a collision
const SAME_LANE_MIN_DISTANCE = 5;

//the absolute size of our sprite images are a little too big
//thereforce scale by the following factor
const CAR_SPRITE_SCALE = .5;

const CAR_TEXTURES = [
    PIXI.Texture.from(carImg1),
    PIXI.Texture.from(carImg2),
    PIXI.Texture.from(carImg3),
    PIXI.Texture.from(carImg4)
];

export class CarImpl implements Car {
    public checkCollisions: boolean;
    public dotIndex: number;
    public garbage: boolean;
    public pxPerTick: number;
    public sprite: Sprite;
    public street: Street;
    private environment: Environment;

    constructor(environment: Environment, street: Street) {
        this.sprite = new PIXI.Sprite(CAR_TEXTURES[Math.floor(Math.random() * CAR_TEXTURES.length)]);
        this.environment = environment;
        this.street = street;
        this.checkCollisions = false;
        this.dotIndex = 0;
        this.garbage = false;
        //speed of the car
        this.pxPerTick = 1.5;

        this.sprite.x = street.dots[0]!.x;
        this.sprite.y = street.dots[0]!.y;
        this.sprite.rotation = street.dots[0]!.rotation ?? 0;
        this.sprite.pivot.x = this.sprite.width / 2;
        this.sprite.pivot.y = this.sprite.height / 2;
        this.sprite.scale.x = CAR_SPRITE_SCALE;
        this.sprite.scale.y = CAR_SPRITE_SCALE;
    };

    enoughDistanceBetween(b: Car): boolean {
        //garbage cars are not rendered anymore, therefore can not collide
        if (this.garbage || b.garbage) return true;
        //take half height because positioning reference is at the center of the sprites
        const aHeight = this.sprite.height / 2;
        const bHeight = b.sprite.height / 2;
        return distance(this.sprite, b.sprite) >= aHeight + bHeight + SAME_LANE_MIN_DISTANCE;
    }

    /**
     * the dot index represents at which point of the street the car is currently located
     */
    incrementDotIndex(): boolean {
        if (this.dotIndex >= this.street.dots.length - 2) {
            this.garbage = true;
            this.sprite.destroy();
            return false;
        } else if (this.environment.trySetPosition(this, this.street.dots[this.dotIndex + 1])) {
            this.dotIndex++;
            return true;
        }
        return false;
    }

    spawn(): boolean {
        return this.environment.spawnCar(this)
    }

    boundingPoints(position?: Dot): number[] {
        if (!position) {
            position = this.sprite;
        }
        const halfWidth = this.sprite.width / 2 + 5;
        const halfHeight = this.sprite.height / 2 + 5;
        return [...rotate(this.sprite, {
            x: position.x + halfWidth,
            y: position.y + halfHeight
        }, position.rotation ?? this.sprite.rotation),
            ...rotate(this.sprite, {
                x: position.x + halfWidth,
                y: position.y - halfHeight
            }, position.rotation ?? this.sprite.rotation),
            ...rotate(this.sprite, {
                x: position.x - halfWidth,
                y: position.y - halfHeight
            }, position.rotation ?? this.sprite.rotation),
            ...rotate(this.sprite, {
                x: position.x - halfWidth,
                y: position.y + halfHeight
            }, position.rotation ?? this.sprite.rotation)];
    }

    getFrontDot(position?: Dot): Dot {
        if (!position) {
            position = this.sprite;
        }
        const frontPoint = rotate(this.sprite, {
            x: position.x,
            y: position.y - this.sprite.height / 2
        }, position.rotation ?? this.sprite.rotation);
        return {
            x: frontPoint[0],
            y: frontPoint[1],
            rotation: position.rotation ?? this.sprite.rotation
        };
    }

    wouldCollide({other, position, carBounds}: { other: Car, position?: Dot, carBounds?: number[] }): boolean {
        if (!position) {
            position = this.sprite;
        }
        if (!carBounds) {
            carBounds = this.boundingPoints(position);
        }
        return distance(position, other.sprite) < DISTANCE_CHECK_THRESHOLD &&
            intersects.polygonPolygon(carBounds, other.boundingPoints());
    }

    //will only be true for cars on different streets
    isCollisionCandidate(other: Car): boolean {
        return other.checkCollisions &&
            !other.garbage &&
            other as any !== this &&
            other.street !== this.street;
    }

    isAllowedToContinue({other, frontDot}: { other: Car; frontDot?: Dot }): boolean {
        if (!frontDot) {
            frontDot = this.getFrontDot();
        }
        const angleCarRelToOther = Math.abs(getAngleBetween(frontDot, other.sprite) - frontDot.rotation!);
        if (angleCarRelToOther > 0.4 * Math.PI) {
            //the center of the other car is probably behind our front point
            //As this is only a heuristic, we decide that this car can continue
            return true;
        }
        const otherFrontDot = other.getFrontDot();
        const angleOtherRelToCar = Math.abs(getAngleBetween(otherFrontDot, this.sprite) - otherFrontDot.rotation!);
        //If the angle between our frontPoint relative to the other cars center point is bigger than
        //the angle from the other cars front point to our center point, then continue
        return angleCarRelToOther > angleOtherRelToCar;
    }

    tick(delta: number) {
        //for (let i = 0; i < delta; i++) {
            if (this.garbage) {
                return;
            }
            if (this.dotIndex < this.street.dots.length - 1) {
                const distToTravel = this.pxPerTick;
                let dist = 0;
                let distToNext = distance(this.sprite, this.street.dots[this.dotIndex + 1]);
                while (dist < distToTravel) {
                    if (distToNext < distToTravel) {
                        dist += distToNext;
                        if (!this.incrementDotIndex()) {
                            break;
                        }
                        //tmpDot = car.street.dots[car.dotIndex]
                        //console.log(tmpDot);
                        //car.sprite.x = car.street.dots[car.dotIndex].x;
                        //car.sprite.y = car.street.dots[car.dotIndex].y;
                        //if (car.street.dots[car.dotIndex].rotation) {
                        //    car.sprite.rotation = car.street.dots[car.dotIndex].rotation!;
                        //}
                        distToNext = distance(this.sprite, this.street.dots[this.dotIndex + 1]);
                    } else if (distToNext > distToTravel) {
                        let distScale = 1 / (distToNext / distToTravel);
                        this.environment.trySetPosition(this, pointBetween(this.sprite, this.street.dots[this.dotIndex + 1], distScale))
                        break;
                    } else {
                        this.incrementDotIndex();
                        break;
                    }
                }
            } else {
                this.garbage = true;
                this.sprite.destroy();
            }
        }
    //}
}
