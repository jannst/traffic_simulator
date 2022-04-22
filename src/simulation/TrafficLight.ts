import {Graphics} from "pixi.js";
import {TrafficLightConfiguration} from "../algo/algorithm";

export interface TrafficLight {
    polygon: number[],
    name: string,
    state: boolean
    setState: (state: boolean) => void
    drawState: () => void
    setHighlight: (highlight: boolean) => void
    highlight: boolean;
    setGraphics: (graphics: Graphics) => void
    tick: () => void
}

export class TrafficLightImpl implements TrafficLight, TrafficLightConfiguration {
    name: string;
    polygon: number[];
    graphics?: Graphics;
    highlight: boolean = false;
    state: boolean = false;
    avgCarsPerSec: number = 0;
    redTimeSec: number = 0;
    untilRedSec: number = 0;

    constructor(name: string, polygon: number[]) {
        this.name = name;
        this.polygon = polygon;
    }

    /**
     * this function should be executed every second
     */
    tick() {
        if (this.state) {
            this.untilRedSec--;
            if (this.untilRedSec <= 0) {
                this.setState(false);
            }
        } else {
            this.redTimeSec++;
        }
    }

    setGraphics(graphics: Graphics) {
        this.graphics = graphics;
    }

    setHighlight(highlight: boolean) {
        this.highlight = highlight;
        this.drawState()
    }

    drawHighlighting() {
        if (this.graphics) {
            this.graphics.lineStyle(5, 0xFFFFFF, 1);
            for (let i = 0; i < this.polygon.length - 1; i += 2) {
                this.graphics.drawCircle(this.polygon[i], this.polygon[i + 1], 6);
            }
        }
    }

    drawState() {
        if (this.graphics) {
            this.graphics.clear();
            this.graphics.lineStyle(2, this.state ? 0x00FF00 : 0xFF0000, .6);
            this.graphics.beginFill(this.state ? 0x00FF00 : 0xFF0000, .3)
            this.graphics.drawPolygon(this.polygon);
            if (this.highlight) {
                this.drawHighlighting();
            }
        }
    }

    setState(state: boolean): void {
        this.state = state;
        if (state) {
            this.redTimeSec = 0;
        } else {
            this.untilRedSec = 0;
        }
        this.drawState();
    }
}