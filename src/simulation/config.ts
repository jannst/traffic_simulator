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
    let data = window.localStorage.getItem(name);
    if (!data) {
        //just a quick have to have a default config :[
        data = '{"streets":{"WLLSTR->MHLDMM":"0.075","MHLDMM->WLLSTR":"0.075","LBTD->LBST":"0.075","SLPF->BGRWDE":"0.45","LBST->LBTD":"0.1","BRGWDE->SLPF":"0.45","STREET_8":"0.1","STREET_9":"0.075","LBTD->SLPF":"0.05"},"constraints":[{"type":"NAND","a":"AMPEL_12","b":"AMPEL_10"},{"type":"NAND","a":"AMPEL_12","b":"AMPEL_11"},{"type":"NAND","a":"AMPEL_11","b":"AMPEL_9"},{"type":"NAND","a":"AMPEL_9","b":"AMPEL_10"},{"type":"NAND","a":"AMPEL_2","b":"AMPEL_5"},{"type":"NAND","a":"AMPEL_1","b":"AMPEL_5"},{"type":"NAND","a":"AMPEL_2","b":"AMPEL_3"},{"type":"NAND","a":"AMPEL_2","b":"AMPEL_4"},{"type":"NAND","a":"AMPEL_1","b":"AMPEL_3"},{"type":"NAND","a":"AMPEL_3","b":"AMPEL_4"},{"type":"NAND","a":"AMPEL_6","b":"AMPEL_7"},{"type":"NAND","a":"AMPEL_8","b":"AMPEL_7"},{"type":"NAND","a":"AMPEL_5","b":"AMPEL_4"},{"type":"NAND","a":"AMPEL_13","b":"AMPEL_11"},{"type":"NAND","a":"AMPEL_13","b":"AMPEL_9"},{"type":"NAND","a":"AMPEL_12","b":"AMPEL_13"}]}';
    }
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