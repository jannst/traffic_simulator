import {TrafficLight} from "./TrafficLight";
import {Constraint, ConstraintImpl, ConstraintType} from "./Constraint";
import {Container, DisplayObject, Graphics} from "pixi.js";

export class ConstraintHandler {
    currentMode?: ConstraintType;
    firstNode?: TrafficLight;
    constraints: Constraint[];
    container: Container;

    constructor(constraints: Constraint[], viewport: Container) {
        this.constraints = constraints;
        this.container = viewport;
    }

    setConstraintMode(type?: ConstraintType) {
        this.currentMode = type;
    }

    clear() {
        //this.currentMode = undefined;
        this.firstNode = undefined;
    }

    addConstraint(a: TrafficLight, b: TrafficLight, type: ConstraintType) {
        const graphics = new Graphics();
        this.container.addChild(graphics);
        const constraint: ConstraintImpl = new ConstraintImpl(a,
            b,
            type,
            graphics,
            () => this.onClickConstraint(constraint)
        );
        this.constraints.push(constraint);
    }

    onClickTrafficLight(trafficLight: TrafficLight) {
        if (this.currentMode) {
            if (this.firstNode && this.firstNode !== trafficLight) {
                //okay, we have all the required info
                this.addConstraint(this.firstNode, trafficLight, this.currentMode);
                this.clear();
            } else {
                this.firstNode = trafficLight;
            }
        }
    }

    onClickConstraint(constraint: Constraint) {
        const index = this.constraints.indexOf(constraint)
        if (index >= 0) {
            constraint.graphics.destroy();
            this.constraints.splice(index, 1);
        }
    }

}