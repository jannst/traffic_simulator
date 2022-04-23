import {Simulation} from "./simulation";
import {ConstraintType} from "./Constraint";

interface Config {
    streets: { [key: string]: number }
    constraints: { type: ConstraintType, a: string, b: string }[]
}

export function saveConfig(name: string, simulation: Simulation) {
    const config: Config = {streets: {}, constraints: []};
    simulation.streets.forEach((street) => config.streets[street.name] = street.percentage);
    config.constraints = simulation.constraints.map((c) => {
        return {type: c.type, a: c.a.name, b: c.b.name};
    });
    window.localStorage.setItem(name, JSON.stringify(config));
}

export function loadConfig(name: string, simulation: Simulation) {
    const data = window.localStorage.getItem(name);
    if (data) {
        const config: Config = JSON.parse(data);
        simulation.streets.forEach((street) => {
            if (street.name in config.streets) {
                street.percentage = config.streets[street.name];
            }
        });
        config.constraints.forEach((constr) => {
            if (simulation.trafficLights.some(tl => tl.name === constr.a) && simulation.trafficLights.some(tl => tl.name === constr.b)) {
                simulation.constraintHandler.addConstraint(simulation.trafficLights.find(tl => tl.name === constr.a)!,
                    simulation.trafficLights.find(tl => tl.name === constr.b)!,
                    constr.type
                );
            } else {
                console.error("failed to load constraint ", constr);
            }
        })

    }
}