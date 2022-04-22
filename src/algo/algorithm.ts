
export interface TrafficLightConfiguration {
    /**
     * If traffic light is in state red, this number will be incremented by 1 every second (happens inside simulation.js)
     */
    redTimeSec: number;
    /**
     * If the traffic light is green, this number is decremented by 1 every second (happens inside simulation.js)
     * When this number equals 0, the traffic light will switch to red
     */
    untilRedSec: number
    /**
     * The current state of the traffic light
     * true = green, false = red
     * ONLY READ THIS VARIABLE, DO NOT WRITE!
     * Use setState function
     */
    state: boolean
    /**
     * The total amount of cars which passed the traffic light during the last 10 green cycles
     * divided by the total time of the last 10 green cycles in seconds
     */
    avgCarsPerSec: number
}

export interface AlgorithmArgs {
    updateTrafficLight: (trafficLight: TrafficLightConfiguration, state: boolean, timeUntilRed?: number) => void
    variables: TrafficLightConfiguration[],
    constraints: Constraint[]
}

export interface Constraint {
    a: TrafficLightConfiguration
    b: TrafficLightConfiguration
    constraint: "NAND" | "FOLLOWS"
}

export function tickAlgo({variables, constraints, updateTrafficLight}: AlgorithmArgs) {
    if(variables.every((light) => light.redTimeSec > 1)) {
        const lightToSet = variables.sort((a,b) => Math.sign(b.redTimeSec - a.redTimeSec))[0]
        updateTrafficLight(lightToSet, true, 5);
    }
}