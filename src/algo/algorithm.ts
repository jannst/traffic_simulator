import {TrafficLight} from "../simulation/TrafficLight";
import {Constraint} from "../simulation/Constraint";
import {TrafficLightSolver} from "./solver";

export function tickAlgo(variables: TrafficLight[], constraints: Constraint[]) {
    const tls = new TrafficLightSolver(variables, constraints);
    const solution = tls.solve();
    if(solution) {
        solution.forEach((entry) => {
            if(entry.val === "SWITCH_ON") {
                entry.tl.setState(true, 5);
            }
        })
    }
}