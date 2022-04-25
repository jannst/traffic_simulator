import {Graphics, Text} from "pixi.js";
import {Dot} from "./pathParser";
import {Car} from "./car";

export type OnClickTrafficLight = (trafficLight: TrafficLight) => void;

export interface TrafficLight {
    polygon: number[],
    name: string,
    state: boolean
    setState: (state: boolean, timeUntilRed?: number) => void
    drawState: () => void
    setHighlight: (highlight: boolean) => void
    highlight: boolean;
    setGraphics: (graphics: Graphics) => void
    primitiveCenterPoint: () => Dot
    addCarToStatistics: (car: Car) => void
    onClick?: OnClickTrafficLight
    tick: () => void
    avgCarsPerSec: number;
    redTimeSec: number;
    untilRedSec: number;
}

const NUM_GREEN_PHASE_SAMPLES = 6;

export class TrafficLightImpl implements TrafficLight {
    name: string;
    polygon: number[];
    graphics?: Graphics;
    highlight: boolean = false;
    state: boolean = false;
    avgCarsPerSec: number = 0;
    redTimeSec: number = 0;
    untilRedSec: number = 0;
    onClick?: () => void

    carStats: { cars: Car[], greenTime: number }[] = []

    constructor(name: string, polygon: number[]) {
        this.name = name;
        this.polygon = polygon;
    }

    /**
     * this function should be executed every second
     */
    tick() {
        //console.log(`tick ${this.name} ${this.redTimeSec} ${this.untilRedSec}`);
        if (this.state) {
            this.untilRedSec--;
            if (this.untilRedSec <= 0) {
                this.setState(false);
            }
        } else {
            this.redTimeSec++;
        }
    }

    addCarToStatistics(car: Car) {
        if (this.state && this.carStats.length && !this.carStats[0].cars.includes(car)) {
            this.carStats[0].cars.push(car);
        }
    }

    setGraphics(graphics: Graphics) {
        this.graphics = graphics;
        graphics.interactive = true;
        graphics.on('pointerdown', () => {
            if (this.onClick) {
                this.onClick();
            }
        });
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
            this.graphics.children.forEach((c) => c.destroy());
            this.graphics.lineStyle(2, this.state ? 0x00FF00 : 0xFF0000, .6);
            this.graphics.beginFill(this.state ? 0x00FF00 : 0xFF0000, .3)
            this.graphics.drawPolygon(this.polygon);
            if (this.highlight) {
                this.drawHighlighting();
            }
            let text = new Text(this.avgCarsPerSec.toFixed(1), {
                fontFamily: 'monospace',
                fontSize: 18,
                fill: 0xFFFFFF,
                align: 'right'
            });
            const center = this.primitiveCenterPoint();
            text.position.x = center.x;
            text.position.y = center.y;
            text.zIndex = 1;
            this.graphics.addChild(text);
        }
    }

    primitiveCenterPoint(): Dot {
        const result = {x: 0, y: 0};
        for (let i = 0; i < this.polygon.length - 1; i += 2) {
            result.x += this.polygon[i];
            result.y += this.polygon[i + 1];
        }
        result.x = result.x / (this.polygon.length / 2)
        result.y = result.y / (this.polygon.length / 2)
        return result;
    }

    setState(state: boolean, timeUntilRed?: number): void {
        this.state = state;
        if (state) {
            this.redTimeSec = 0;
            if (timeUntilRed) {
                this.untilRedSec = timeUntilRed!;
            }
            this.carStats.splice(0, 0, {cars: [], greenTime: this.untilRedSec});
            //keep 11 items
            this.carStats = this.carStats.slice(0, NUM_GREEN_PHASE_SAMPLES-1);
        } else {
            this.untilRedSec = 0;
            this.calculateStatistics();
        }
        this.drawState();
    }

    calculateStatistics() {
        let totNumCars = 0;
        let totSecGreen = 0;
        this.carStats.slice(0, NUM_GREEN_PHASE_SAMPLES-1).forEach((entry) => {
            totNumCars += entry.cars.length;
            totSecGreen += entry.greenTime;
        });
        if (totSecGreen > 0) {
            this.avgCarsPerSec = totNumCars / totSecGreen;
        }
    }
}