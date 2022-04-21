import {Command, MoveToCommand} from "svg-path-parser";

const parseSVG = require('svg-path-parser');

export interface Dot {
    x: number,
    y: number,
    checkForCollisions?: boolean,
    rotation?: number
}

export interface SimulationObjects {
    streets: Street[]
}

export interface Street {
    dots: Dot[],
    parent?: Street,
    id: string,
    parentId?: string
    parentStreet?: Street
    mergesIntoId?: string
    mergesInto?: { street: Street, targetIndex: number }
    children: { street: Street, dotIndex: number }[]
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
        if (item.style.display === "none") {
            continue;
        }
        //formmat of street layer names: S;<id>;<parent_id>;<merges_into_id>;<name>
        const attributes = (item.getAttribute("inkscape:label") ?? "").split(";");
        if (attributes.length >= 5 && attributes[0] === "S") {
            const [streetId, parentId, mergesIntoId, streetName] = attributes.slice(1)
            const itemPaths = item.getElementsByTagName("path");
            if (itemPaths.length !== 1) {
                throw new Error(`Street ${attributes[1]} contains more than one or no paths. This is illegal`);
            }
            const path = parsePath(itemPaths[0].getAttribute("d") ?? "");
            streets.push({
                name: streetName,
                dots: path,
                children: [],
                id: streetId,
                parentId: parentId,
                mergesIntoId: mergesIntoId
            });
            console.log("loaded street: " + item.getAttribute("inkscape:label"));
        }
    }
    //okay, now wire streets together
    streets.forEach((street) => {
        if (street.parentId) {
            const parentStreet = streets.find((str) => str.id === street.parentId);
            if (parentStreet) {
                parentStreet.children.push({
                    street: street,
                    dotIndex: findMinimumDistanceIndex(parentStreet, street.dots[0])
                });
                street.parentStreet = parentStreet;
            } else {
                throw new Error(`unknown parent street id ${street.parentId}`);
            }
        }
        if (street.mergesIntoId) {
            const targetStreet = streets.find((str) => str.id === street.mergesIntoId);
            if (targetStreet) {
                street.mergesInto = {
                    street: targetStreet,
                    targetIndex: findMinimumDistanceIndex(targetStreet, street.dots[street.dots.length - 1])
                }
            } else {
                throw new Error(`unknown merges into street id ${street.mergesIntoId}`);
            }
        }
    });
    findStreetIntersections(streets);
    console.log(streets);
    return {streets: streets};
}

function findMinimumDistanceIndex(street: Street, dot: Dot): number {
    let currentMinimum = Number.POSITIVE_INFINITY
    let bestIndex = 0;
    for (let i = 0; i < street.dots.length; i++) {
        const currentDist = distance(dot, street.dots[i])
        if (currentDist < currentMinimum) {
            currentMinimum = currentDist;
            bestIndex = i;
        }
    }
    return bestIndex;
}

function findStreetIntersections(streets: Street[]) {
    //let increment = 30 / DIST_BETWEEN_POINTS;
    //let numLines = streets.map((street) => (street.dots.length / increment) - 1).reduce((a, b) => a + b, 0);
    //console.log(`Street intersection calculations. Number of operations: ${(numLines * 2) ** 2}`);
    //N = street.map((street) => street.dots.lengt).sum
    //we dont need the exact interection points, because we have complexity O()
    const minDist = 40;
    const lookahead = 3;
    for (let i = 0; i < streets.length; i++) {
        const dots = streets[i].dots;
        for (let j = 0; j < dots.length; j++) {
            //const dot = dots[j];
            dance:
                //if (!dots[j].checkForCollisions) {
                for (let k = 0; k < streets.length; k++) {
                    //do not check for points on same street
                    if (k === i) continue;
                    const checkDots = streets[k].dots;
                    for (let l = 0; l < checkDots.length; l++) {
                        if (distanceSmallerThan(dots[j], checkDots[l], minDist)) {
                            for (let m = Math.max(j - lookahead, 0); m < Math.min(j + lookahead, dots.length); m++) {
                                dots[m].checkForCollisions = true
                            }
                            //checkDots[l].checkForCollisions = true;
                            break dance;
                        }
                    }
                }
            //}
        }
    }
}

//this variable controls the distance between the equally distributed points
const DIST_BETWEEN_POINTS = 10;

function parsePath(pathDescription: String): Dot[] {
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
            if (cmd.command === "curveto") {
                let endPoint, ctrlPt1, ctrlPt2;

                if (cmd.relative) {
                    ctrlPt1 = {x: cmd.x1 + currentPosition.x, y: cmd.y1 + currentPosition.y};
                    ctrlPt2 = {x: cmd.x2 + currentPosition.x, y: cmd.y2 + currentPosition.y};
                    endPoint = {x: currentPosition.x + cmd.x, y: currentPosition.y + cmd.y};
                } else {
                    ctrlPt1 = {x: cmd.x1, y: cmd.y1};
                    ctrlPt2 = {x: cmd.x2, y: cmd.y2};
                    endPoint = {x: cmd.x, y: cmd.y};
                }
                for (let j = 0; j < 100; j += 10) {
                    points.push(getCubicBezierXYatPercent(currentPosition,
                        ctrlPt1,
                        ctrlPt2,
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
        if (points.length > 2) {
            let i = 0;
            let normalizedPoints = [];
            let neededDist = DIST_BETWEEN_POINTS;
            let curPoint = points[i]

            //starting point
            //Bug: rotaton relative to points[i + 1] yield weird results, use points[i + 2] for as reference for now
            normalizedPoints.push(getPointWithRotation(points[i], points[i + 2]));
            while (i < points.length - 1) {
                const distToNext = distance(curPoint, points[i + 1])
                if (distToNext < neededDist) {
                    neededDist -= distToNext;
                    curPoint = points[i + 1];
                    i++;
                } else if (distToNext > neededDist) {
                    let distScale = 1 / (distToNext / neededDist);
                    //will also calculate rotation
                    curPoint = pointBetweenWithAngle(curPoint, points[i + 1], distScale);
                    neededDist = DIST_BETWEEN_POINTS;
                    normalizedPoints.push(curPoint);
                } else {
                    curPoint = getPointWithRotation(points[i + 1], points[i], true);
                    normalizedPoints.push(curPoint);
                    neededDist = DIST_BETWEEN_POINTS;
                    i++;
                }
            }
            points = normalizedPoints;
        }
    }
    return points;

}

function getPointWithRotation(dot: Dot, rotationReference: Dot, invert: boolean = false): Dot {
    const diffX = dot.x - rotationReference.x;
    const diffY = dot.y - rotationReference.y;
    return {x: dot.x, y: dot.y, rotation: (getRotFromDiff(diffX, diffY) + (invert ? Math.PI : 0)) % (2 * Math.PI)};
}

export function getAngleBetween(a: Dot, b: Dot) {
    const diffX = a.x - b.x;
    const diffY = a.y - b.y;
    return getRotFromDiff(diffX, diffY);
}

export function rotate(reference: Dot, target: Dot, angle: number): number[] {
    const oldX = target.x - reference.x;
    const oldY = target.y - reference.y;
    const newX = oldX * Math.cos(angle) - oldY * Math.sin(angle);
    const newY = oldX * Math.sin(angle) + oldY * Math.cos(angle);
    return [reference.x + newX, reference.y + newY];
}

function getRotFromDiff(diffX: number, diffY: number) {
    return Math.abs(Math.atan2(diffY, diffX) + (Math.PI * 1.5) % (2 * Math.PI));
}

export function pointBetween(a: Dot, b: Dot, scale: number): Dot {
    const diffX = (a.x - b.x) * scale;
    const diffY = (a.y - b.y) * scale;
    return {x: a.x - diffX, y: a.y - diffY, rotation: a.rotation};
}

export function pointBetweenWithAngle(a: Dot, b: Dot, scale: number): Dot {
    const diffX = (a.x - b.x) * scale;
    const diffY = (a.y - b.y) * scale;
    return {x: a.x - diffX, y: a.y - diffY, rotation: getRotFromDiff(diffX, diffY)};
}

const ANGLE_THRESHOLD = Math.PI / 8

export function distanceSmallerThan(a: Dot, b: Dot, distance: number) {
    const diffX = a.x - b.x;
    const diffY = a.y - b.y;
    if (Math.abs(diffX) + Math.abs(diffY) > distance) {
        return false;
    } else {
        const rotDiff = Math.abs((a.rotation ?? 0 % Math.PI) - (b.rotation ?? 0 % Math.PI)) % Math.PI;
        if (rotDiff < ANGLE_THRESHOLD || rotDiff > Math.PI - ANGLE_THRESHOLD) {
            distance = distance / 2;
        }
        return Math.hypot(diffX, diffY) < distance;
    }
}

export function distance(a: Dot, b: Dot) {
    const diffX = a.x - b.x;
    const diffY = a.y - b.y;
    return Math.hypot(diffX, diffY);
}


/*
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
 */

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