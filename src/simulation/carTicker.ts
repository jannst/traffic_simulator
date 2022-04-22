import {Application} from "pixi.js";
import {SimulationObjects} from "./pathParser";
import {Car, CarImpl} from "./car";
import {Environment, EnvironmentImpl} from "./environment";

export function initCars(app: Application, simulation: SimulationObjects) {
    const environment: Environment = new EnvironmentImpl(app, simulation.streets);
    const spawnCarEveryXTicks = 60 * 1.6;
    let ticksPassed = spawnCarEveryXTicks + 1;

    const availiableStreets = simulation.streets.filter((street) => !street.parent);

    app.ticker.add((delta) => {
        //generate new cars
        if (ticksPassed + Math.random() * 100 > spawnCarEveryXTicks) {
            ticksPassed = 0;
            //garbage collect old cars
            environment.garbageCollect();
            const street = availiableStreets[Math.floor(Math.random() * availiableStreets.length)];
            new CarImpl(environment, street).spawn();
        } else {
            ticksPassed += delta;
        }

        //process cars
        environment.cars.forEach((car: Car) => car.tick(delta));
    });
}