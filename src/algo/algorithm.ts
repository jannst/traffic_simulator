import {TrafficLight} from "../simulation/TrafficLight";
import {Constraint} from "../simulation/Constraint";
import {Solution, TrafficLightSolver} from "./solver";

interface SubSystem {
    variables: TrafficLight[],
    constraints: Constraint[],
    bestSolutions: Solution[][]
}

export function findSubSystems(variables: TrafficLight[], constraints: Constraint[]) {
    const originalVariables: TrafficLight[] = [...variables];
    const streetIntersections: SubSystem[] = [];

    constraints.forEach((c) => {
        const indexOfA = originalVariables.indexOf(c.a)
        if (indexOfA >= 0) {
            //delete variable from original variables, as it will be assigned to a subset
            originalVariables.splice(indexOfA, 1);
        }
        const indexOfB = originalVariables.indexOf(c.b)
        if (indexOfB >= 0) {
            //delete variable from original variables, as it will be assigned to a subset
            originalVariables.splice(indexOfB, 1);
        }
        const intersection = streetIntersections.find((intersect) => intersect.variables.includes(c.a) || intersect.variables.includes(c.b))
        if (intersection) {
            intersection.constraints.push(c);
            if (!intersection.variables.includes(c.a)) {
                intersection.variables.push(c.a);
            }
            if (!intersection.variables.includes(c.b)) {
                intersection.variables.push(c.b);
            }
        } else {
            streetIntersections.push({variables: [c.a, c.b], constraints: [c], bestSolutions: []});
        }

    });
    originalVariables.forEach((v) => streetIntersections.push({variables: [v], constraints: [], bestSolutions: []}));
    console.log("subsets")
    console.log(streetIntersections);
    console.log("solutions");
    streetIntersections.forEach((intersection) => {
        const solutions = new TrafficLightSolver(intersection.variables, intersection.constraints).solve();
        //sort solutions by number of green lights descending
        solutions.sort(function (a, b) {
            return b.filter((s) => s.val === "ON").length - a.filter((s) => s.val === "ON").length
        });
        const includedVars: TrafficLight[] = [];
        const bestSolutions = [];
        for (let i = 0; i < intersection.variables.length; i++) {
            let atLeastOneNew = false;
            solutions[i].forEach((s) => {
                if (s.val === "ON" && !includedVars.includes(s.tl)) {
                    includedVars.push(s.tl);
                    atLeastOneNew = true;
                }
            });
            if (atLeastOneNew) {
                bestSolutions.push(solutions[i]);
            }
            //if sizes are equal, we have enough configurations, so that every traffic light is switched on in at least one configuration
            //then just return the relevant subset of solutions
            if (includedVars.length >= intersection.variables.length) {
                intersection.bestSolutions = bestSolutions;
                return;
            }
        }
        throw new Error("invalid state");
    });
    intersections = streetIntersections;
}

let intersections: SubSystem[];
let counter = 0;

function solutionScore(solutions: Solution[]) {
    let score = 0;
    const activeLights = solutions.filter((s) => s.val === "ON").map(s => s.tl);
    solutions.forEach(solution => {
        const multiplier = Math.min(3, Math.max(1, solution.tl.avgCarsPerSec))
        if (solution.tl.state) {
            //auf rot stellen verlangsamt den verkehr, deswegen wir der score gesenkt
            score += solution.val === "ON" ? multiplier : -8 * multiplier
        } else if (solution.val === "ON") {
            //auf grün schalten minimiert die wartezeit an einer ampel
            score += solution.tl.redTimeSec * multiplier
            if (solution.tl.previousTrafficLights) {
                solution.tl.previousTrafficLights.forEach(ptl => {
                    if (activeLights.includes(ptl.tl)) {
                        score += multiplier * ptl.percentage
                    }
                });
            }
        }
    });
    return score;
}

export function tickAlgo(variables: TrafficLight[], constraints: Constraint[]) {
    if (counter % 50 === 0) {
        console.log("reset waiting times");
        variables.forEach(v => {
            v.redTimeSec = 0;
            v.setState(false);
        });
    }

    //sort the street intersections by the total number of cars per second
    intersections.sort((a, b) => {
        let weightA = 0;
        let weightB = 0;
        a.variables.forEach((v) => weightA += v.avgCarsPerSec);
        b.variables.forEach((v) => weightB += v.avgCarsPerSec);
        return weightB / b.variables.length - weightA / a.variables.length;
    });

    const solution: Solution[] = [];
    intersections.forEach(intersection => {
        let bestIndex = 0;
        let bestScore = Number.NEGATIVE_INFINITY;
        for (let i = 0; i < intersection.bestSolutions.length; i++) {
            const score = solutionScore([...solution, ...intersection.bestSolutions[i]]);
            if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }
        solution.push(...intersection.bestSolutions[bestIndex]);
    });
    solution.forEach((s) => {
        s.tl.setState(s.val === "ON");
    })
    counter++;
}