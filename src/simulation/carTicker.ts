import {Application} from "pixi.js";
import {SimulationObjects} from "./pathParser";
import {CarImpl} from "./car";
import {Environment, EnvironmentImpl} from "./environment";

export function initCars(app: Application, simulation: SimulationObjects) {
    const environment: Environment = new EnvironmentImpl(app, simulation.streets);
    const spawnCarEveryXTicks = 60 * 1;
    let ticksPassed = spawnCarEveryXTicks + 1;

    app.ticker.add((delta) => {
        //generate new cars
        if (ticksPassed + Math.random() * 100 > spawnCarEveryXTicks) {
            ticksPassed = 0;
            //garbage collect old cars
            environment.garbageCollect();
            const street = simulation.streets[Math.floor(Math.random() * simulation.streets.length)];
            new CarImpl(environment, street).spawn();
        } else {
            ticksPassed += delta;
        }

        //process cars
        environment.cars.forEach((car) => car.tick(delta));
    });
}