import {Command, MoveToCommand} from "svg-path-parser";

const parseSVG = require('svg-path-parser');

export interface Dot {
    x: number,
    y: number
}

export interface SimulationObjects {
    streets: Street[]
}

export interface Street {
    dots: Dot[],
    name: string,
}

export async function loadSimulationObjectsFromSvg(assetPath: string): Promise<SimulationObjects> {
    const streets: Street[] = [];
    const text = await (await fetch(assetPath)).text();
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(text, "text/xml");
    let items = xmlDoc.getElementsByTagName("g");
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const attributes = (item.getAttribute("inkscape:label") ?? "").split(";");
        if (attributes.length >= 1 && attributes[0] === "S") {
            const itemPaths = item.getElementsByTagName("path");
            if (itemPaths.length !== 1) {
                throw new Error(`Street ${attributes[1]} contains more than one path. This is illegal`);
            }
            const path = parsePath(itemPaths[0].getAttribute("d") ?? "");
            streets.push({name: attributes[1], dots: path});
            console.log("loaded street: " + item.getAttribute("inkscape:label"));
        }
    }
    return {streets: streets};
}

export function parsePath(pathDescription: String): Dot[] {
    const commands: Command[] = parseSVG(pathDescription);
    let points: Dot[] = [];
    let currentPosition: Dot = {x: 0, y: 0};

    if (commands.length > 0) {
        let index = 0
        if (commands[index].code === 'M') {
            currentPosition.x = (commands[index] as MoveToCommand).x;
            currentPosition.y = (commands[index] as MoveToCommand).y;
            points.push(currentPosition);
            index++;
        }

        //expand the bezier curves to more points
        for (; index < commands.length; index++) {
            let cmd = commands[index];
            if (cmd.code === "c") {
                const endPoint = {x: currentPosition.x + cmd.x, y: currentPosition.y + cmd.y};
                for (let j = 0; j < 100; j += 10) {
                    points.push(getCubicBezierXYatPercent(currentPosition,
                        {x: cmd.x1 + currentPosition.x, y: cmd.y1 + currentPosition.y},
                        {x: cmd.x2 + currentPosition.x, y: cmd.y2 + currentPosition.y},
                        endPoint,
                        j / 100));
                }
                currentPosition = endPoint;
                //currentPosition = {x: currentPosition.x + cmd.x, y: currentPosition.y + cmd.y};
                //points.push(currentPosition);
            } else {
                throw new Error(`Unsupported svg path command: ${cmd.code}`);
            }
        }

        //point distribution in bezier curves is not linear.
        //Normalize point distribution to have equal distance between all points
        if (points.length > 0) {
            //this variable controls the distance between the equally distributed points
            const dist = 7;
            let i = 0;
            let normalizedPoints = [];
            let neededDist = dist;
            let curPoint = points[i]

            //starting point
            normalizedPoints.push(points[i]);
            while (i < points.length - 1) {
                const distToNext = distance(curPoint, points[i + 1])
                if (distToNext < neededDist) {
                    neededDist -= distToNext;
                    curPoint = points[i + 1];
                    i++;
                } else if (distToNext > neededDist) {
                    let distScale = 1 / (distToNext / neededDist);
                    curPoint = pointBetween(curPoint, points[i + 1], distScale);
                    neededDist = dist;
                    normalizedPoints.push(curPoint);
                } else {
                    curPoint = points[i + 1];
                    normalizedPoints.push(curPoint);
                    neededDist = dist;
                    i++;
                }
            }
            points = normalizedPoints;
        }
    }
    return points;

}

export function pointBetween(a: Dot, b: Dot, scale: number): Dot {
    const diffX = (a.x - b.x) * scale;
    const diffY = (a.y - b.y) * scale;
    return {x: a.x - diffX, y: a.y - diffY};
}

export function distance(a: Dot, b: Dot) {
    const diffX = a.x - b.x;
    const diffY = a.y - b.y;
    return Math.abs(Math.hypot(diffX, diffY));
}

//source: http://jsfiddle.net/m1erickson/LumMX/
// quadratic bezier: percent is 0-1
function getQuadraticBezierXYatPercent(startPt: Dot, controlPt: Dot, endPt: Dot, percent: number): Dot {
    var x = Math.pow(1 - percent, 2) * startPt.x + 2 * (1 - percent) * percent * controlPt.x + Math.pow(percent, 2) * endPt.x;
    var y = Math.pow(1 - percent, 2) * startPt.y + 2 * (1 - percent) * percent * controlPt.y + Math.pow(percent, 2) * endPt.y;
    return ({
        x: x,
        y: y
    });
}

// cubic bezier percent is 0-1
function getCubicBezierXYatPercent(startPt: Dot, controlPt1: Dot, controlPt2: Dot, endPt: Dot, percent: number): Dot {
    var x = CubicN(percent, startPt.x, controlPt1.x, controlPt2.x, endPt.x);
    var y = CubicN(percent, startPt.y, controlPt1.y, controlPt2.y, endPt.y);
    return ({
        x: x,
        y: y
    });
}

// cubic helper formula at percent distance
function CubicN(pct: number, a: number, b: number, c: number, d: number) {
    var t2 = pct * pct;
    var t3 = t2 * pct;
    return a + (-a * 3 + pct * (3 * a - a * pct)) * pct + (3 * b + pct * (-6 * b + b * 3 * pct)) * pct + (c * 3 - c * 3 * pct) * t2 + d * t3;
}