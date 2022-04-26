import {Graphics, Text} from "pixi.js";
import {Dot} from "./pathParser";
import {Car} from "./car";
import {showTrafficLightNet} from "./simulation";

export type OnClickTrafficLight = (trafficLight: TrafficLight) => void;

export interface TrafficLight {
    polygon: number[],
    name: string,
    state: boolean
    setState: (state: boolean) => void
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
    previousTrafficLights?: {tl: TrafficLight, percentage: number}[];
}

const CAR_PER_SEC_SAMPLES = 50;

export class TrafficLightImpl implements TrafficLight {
    name: string;
    polygon: number[];
    graphics?: Graphics;
    highlight: boolean = false;
    state: boolean = false;
    avgCarsPerSec: number = 0;
    previousTrafficLights?: {tl: TrafficLight, percentage: number}[];
    redTimeSec: number = 0;
    onClick?: () => void

    carStats: { cars: Car[], previousTrafficLights: TrafficLight[]}[] = []

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
            this.carStats.splice(0, 0, {cars: [], previousTrafficLights: []});
            this.carStats = this.carStats.slice(0, CAR_PER_SEC_SAMPLES - 1);
            this.calculateStatistics();
            this.drawState();
        } else {
            this.redTimeSec++;
        }
    }

    addCarToStatistics(car: Car) {
        if (this.state && this.carStats.length && !this.carStats[0].cars.includes(car)) {
            this.carStats[0].cars.push(car);
            if(car.lastTrafficLight) {
                this.carStats[0].previousTrafficLights.push(car.lastTrafficLight);
            }
            car.lastTrafficLight = this;
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
            if(showTrafficLightNet && this.previousTrafficLights) {
                this.previousTrafficLights.forEach((entry) => {
                    this.graphics!.lineStyle(entry.percentage*10, 0x0000FF, .5);
                    this.graphics!.moveTo(center.x, center.y);
                    const otherCenter = entry.tl.primitiveCenterPoint();
                    this.graphics!.lineTo(otherCenter.x, otherCenter.y);
                });
            }
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

    setState(state: boolean): void {
        this.state = state;
        if (state) {
            this.redTimeSec = 0;
        } else {
            this.calculateStatistics();
        }
        this.drawState();
    }

    calculateStatistics() {
        if (this.carStats.length) {
            let totNumCars = 0;
            let previousTrafficLights: {[key: string]: {tl: TrafficLight, num: number}} = {};
            this.carStats.slice(0, CAR_PER_SEC_SAMPLES - 1).forEach((entry) => {
                totNumCars += entry.cars.length;
                entry.previousTrafficLights.forEach((tl) => {
                    if(tl.name in previousTrafficLights) {
                        previousTrafficLights[tl.name].num++;
                    } else {
                        previousTrafficLights[tl.name] = {tl: tl, num: 1};
                    }
                })
            });
            this.avgCarsPerSec = totNumCars / this.carStats.length;
            this.previousTrafficLights = Object.values(previousTrafficLights).map(entry => ({tl: entry.tl, percentage: entry.num/totNumCars}))
        }
    }
}