import {TrafficLight} from "./TrafficLight";
import {Constraint, ConstraintImpl, ConstraintType} from "./Constraint";
import {Viewport} from "pixi-viewport";
import {Graphics} from "pixi.js";

export class InteractionHandler{
    currentMode?: ConstraintType;
    firstNode?: TrafficLight;
    constraints: Constraint[];
    viewport: Viewport;

    constructor(constraints: Constraint[], viewport: Viewport) {
        this.constraints = constraints;
        this.viewport = viewport;
    }

    setConstraintMode(type?: ConstraintType){

        console.log("updateeee", type);
        this.currentMode = type;
        console.log(this);
    }

    clear() {
        //this.currentMode = undefined;
        this.firstNode = undefined;
    }

    onClickTrafficLight(trafficLight: TrafficLight) {
        console.log(this);
        console.log("click!", this.currentMode);
        if(this.currentMode) {
        console.log("click!!");
            if(this.firstNode && this.firstNode !== trafficLight) {
        console.log("click!!!");
                //okay, we have all the required info
                const graphics = new Graphics();
                this.viewport.addChild(graphics);
                const constraint: ConstraintImpl = new ConstraintImpl(this.firstNode,
                    trafficLight,
                    this.currentMode,
                    graphics,
                    () => this.onClickConstraint(constraint)
                );
                this.constraints.push(constraint);
                this.clear();
            } else {
                this.firstNode = trafficLight;
            }
        }
    }

    onClickConstraint(constraint: Constraint) {
        const index = this.constraints.indexOf(constraint)
        if(index >= 0) {
            constraint.graphics.destroy();
            this.constraints.splice(index, 1);
        }
    }

}