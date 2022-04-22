import {Graphics} from "pixi.js";

export interface TrafficLight {
    polygon: number[],
    name: string,
    state: boolean
    setState: (state: boolean) => void
    setHighlight: (highlight: boolean) => void
    highlight: boolean;
    setGraphics: (graphics: Graphics) => void
}

export class TrafficLightImpl implements TrafficLight {
    name: string;
    polygon: number[];
    state: boolean = false;
    graphics?: Graphics;
    highlight: boolean = false;

    constructor(name: string, polygon: number[]) {
        this.name = name;
        this.polygon = polygon;
    }

    setGraphics(graphics: Graphics) {
        this.graphics = graphics;
    }

    setHighlight(highlight: boolean) {
        this.highlight = highlight;
        this.setState(this.state);
    }

    drawHighlighting() {
        if (this.graphics) {
            this.graphics.lineStyle(5, 0xFFFFFF, 1);
            for(let i = 0; i < this.polygon.length-1; i+=2) {
                this.graphics.drawCircle(this.polygon[i], this.polygon[i+1], 6);
            }
        }
    }

    setState(state: boolean): void {
        this.state = state;
        if (this.graphics) {
            this.graphics.clear();
            this.graphics.lineStyle(2, this.state ? 0x00FF00 : 0xFF0000, .6);
            this.graphics.beginFill(this.state ? 0x00FF00 : 0xFF0000, .3)
            this.graphics.drawPolygon(this.polygon);
            if(this.highlight){
                this.drawHighlighting();
            }
        }
    }
}