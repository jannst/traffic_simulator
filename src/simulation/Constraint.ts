import {TrafficLight} from "./TrafficLight";
import {Graphics} from "pixi.js";
import {distance} from "./pathParser";

export type ConstraintType = "NAND" | "CROSS";
export type OnClickConstraint = () => void

export interface Constraint {
    a: TrafficLight
    b: TrafficLight
    type: ConstraintType
    graphics: Graphics;
    draw: () => void
    onClick: OnClickConstraint
}

export class ConstraintImpl implements Constraint{
    a: TrafficLight;
    b: TrafficLight;
    type: ConstraintType;
    graphics: Graphics;
    onClick: OnClickConstraint;

    constructor(a: TrafficLight, b:TrafficLight, type: ConstraintType, graphics: Graphics, onClick: OnClickConstraint) {
        this.a = a;
        this.b = b;
        this.type = type;
        this.graphics = graphics;
        this.onClick = onClick;

        this.draw();
        graphics.interactive = true;
        graphics.on('pointerdown', () => onClick());
    }

    draw() {
        const centerA = this.a.primitiveCenterPoint();
        const centerB = this.b.primitiveCenterPoint();

        let color = 0xFFFFFF;
        if(this.type === "NAND") {
            color = 0xFF2222
        }
        this.graphics.beginFill(color, .5);
        const dist = distance(centerA, centerB);
        const step = (5+Math.random()*5);
        const numPts = Math.floor(dist/step);
        const stepX = (centerB.x - centerA.x)/numPts;
        const stepY = (centerB.y - centerA.y)/numPts;
        for(let i = 0; i < numPts; i++) {
            this.graphics.drawCircle(centerA.x + stepX*i, centerA.y + stepY*i, 3)
        }
    }



}