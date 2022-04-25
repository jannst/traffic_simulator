import {Constraint} from "../simulation/Constraint";
import {TrafficLight} from "../simulation/TrafficLight";

type DomainValue = 'SWITCH_ON' | 'UNCHANGED';

export type UnaryConstraint = (variable: Variable,) => boolean
const isRedAtLeast2Sec = (trafficLight: TrafficLight) => trafficLight.redTimeSec >= 2;

interface Variable {
    trafficLight: TrafficLight
    domain: DomainValue[]
}

function deleteSwitchOnFromDomain(v: Variable) {
    if (v.domain.includes("SWITCH_ON")) {
        v.domain.splice(v.domain.indexOf("SWITCH_ON"), 1);
    }
}

export interface NandConstraint {
    a: Variable
    b: Variable
}

export interface Solution {
    tl: TrafficLight
    val: DomainValue
}


export class TrafficLightSolver {
    stack: { values: DomainValue[][], index: number, valueIndex: number }[] = [];
    currentIndex = 0;
    currentValueIndex = 0;
    //Die Variablen enthalten ebenfalls die Constraints
    variables: Variable[];
    constraints: NandConstraint[] = [];

    constructor(trafficLights: TrafficLight[], constraints: Constraint[]) {
        //trafficLights in Variablen überführen
        this.variables = trafficLights.map((tl) => {
            return {
                domain: ["UNCHANGED", "SWITCH_ON"],
                trafficLight: tl
            };
        });
        //die constraints in die Variablen packen, damit später nicht mehr so viel über Listen iteriert werden muss
        constraints.forEach((c) => {
            const varA = this.variables.find((v) => v.trafficLight === c.a)!;
            const varB = this.variables.find((v) => v.trafficLight === c.b)!;
            //varA.connectedVariables.push(varB);
            //varB.connectedVariables.push(varA);
            this.constraints.push({a: varA, b: varB});
            this.constraints.push({a: varB, b: varA});
        });
    }

    //aktuelle domain aller variablen sichern
    stackPush() {
        this.stack.push({
            index: this.currentIndex,
            valueIndex: this.currentValueIndex,
            values: this.variables.map((v) => [...v.domain])
        });
    }

    //domain vom stack wieder auf die variablen "einspielen"
    stackPop(): boolean {
        const valueToApply = this.stack.pop()!;
        this.currentValueIndex = valueToApply.valueIndex;
        this.currentIndex = valueToApply.index;
        for (let i = 0; i < valueToApply.values.length; i++) {
            this.variables[i].domain = valueToApply.values[i];
        }
        return true;
    }

    revise(vi: Variable, vj: Variable) {
        // Revise kann vereinfacht werden, da es nur den NAND constraint gibt und
        // es nur einen einzigen Fall gibt, wo eine Wert in der Domain von vi
        // nicht mit der anderen Variable vereinbar ist.
        // Dies ist der Fall, wenn vj schon gewählt wurde und die Wertemenge = ["SWITCH_ON"]
        // Dann dart der Wert von vi nur "UNCHANGED" sein!
        if (vj.domain.includes("SWITCH_ON") && vj.domain.length === 1) {
            deleteSwitchOnFromDomain(vi);
            return true;
        }
        return false;
    }

    arcConsistency3LA() {
        //q ist kopie des lokalen constraint arrays
        const q: NandConstraint[] = [...this.constraints.filter((c) => this.variables.indexOf(c.a) > this.currentIndex)];
        let consistent = true;
        while (q.length > 0 && consistent) {
            const c = q.pop()!;
            //constraint überprüfen
            if (this.revise(c.a, c.b)) {
                //falls gelöscht wurde, angrenzende constraints neu prüfen
                q.push(...this.constraints.filter((c2) =>
                    c2.b === c.a && c2.a !== c.b && !q.includes(c2) && this.variables.indexOf(c2.a) > this.currentIndex)
                );
                consistent = c.a.domain.length > 0
            }
        }
        return consistent;
    }

    solve(): Solution[]|undefined {
        //Constraint Vorverarbeitung:
        //Wenn eine Ampel noch nicht mindestens 2 Sekunden rot ist, darf sie nicht auf grün geschaltet werden
        //Ampeln die grün sind können, logischwerweise nicht seit 2 sek rot sein, fallen also auch hier raus.
        //Alle Ampeln, die mit einem NAND Constraint verbunden sind, müssen beide mindestens seit 2 Sekunden rot sein,
        //damit eine Ampel von beiden später auf Grün schalten kann. Andernfalls könnten ja noch Autos
        //von der Straße der jeweils anderen Ampel die Kreuzung blockieren
        this.variables.forEach((v) => {
            if (!isRedAtLeast2Sec(v.trafficLight)) {
                deleteSwitchOnFromDomain(v);
            }
        });
        this.constraints.forEach((c) => {
            if (!isRedAtLeast2Sec(c.a.trafficLight) || !isRedAtLeast2Sec(c.b.trafficLight)) {
                deleteSwitchOnFromDomain(c.a);
                deleteSwitchOnFromDomain(c.b);
            }
        })
        //Eine Vorvearbeitung mit dem AC (arc consistency) algorithmus ist hier nicht notwendig, da
        //das Netz in jedem Fall Kantenkonsistent ist, da der einzige Constraint der NAND constraint ist,
        //der prüft, dass nicht 2 verbundene Variablen beide den Wert "SWITCH_ON" haben.
        //Da aber jede Variable immer auch den Wert "UNCHANGED" in der Domäne hat, ist dieser Constraint überall erfüllbar

        const values: DomainValue[] = ["UNCHANGED", "SWITCH_ON"];
        let bestScore = 0;
        let bestSumSecRed = Number.POSITIVE_INFINITY;
        let bestSolution = undefined;
        console.log("vars:", this.variables);
        outer_loop:
            while (true) {
                //console.log("outer while")
                if (this.currentIndex >= this.variables.length) {
                    do {
                        if (this.stack.length === 0) {
                            //console.log("end!");
                            break outer_loop;
                        }
                        //wenn es noch Zustände auf dem Stack gibt, dann mache dort weiter
                        //(console.log("pop", this.stack, this.currentIndex)
                        this.stackPop();
                        this.currentValueIndex++;
                    } while (this.currentValueIndex >= values.length)
                }
                if (this.variables[this.currentIndex].domain.length > 1) {
                    this.stackPush();
                    //console.log("pushed", this.stack[this.stack.length - 1]);

                    this.variables[this.currentIndex].domain = [values[this.currentValueIndex]];
                    //console.log(this.variables.map((v) => ({domain: v.domain})));
                    if (!this.arcConsistency3LA()) {
                        console.log("ac3 failed :(");
                        //this.stackPop();
                    }
                }
                if(this.currentIndex === this.variables.length-1) {
                    //alle variablen sind durchlaufen
                    let numLightsGreen = 0;
                    let sumSecRed = 0;
                    this.variables.forEach((v) => {
                        if(v.domain[0] === "SWITCH_ON") {
                            numLightsGreen++;
                        } else {
                            sumSecRed += v.trafficLight.redTimeSec*(v.trafficLight.avgCarsPerSec > 0 ? v.trafficLight.avgCarsPerSec : 1);
                        }
                    });
                    const score = sumSecRed
                    if(sumSecRed < bestSumSecRed){
                        bestSumSecRed = sumSecRed;
                        //bestScore = score;
                        bestSolution = this.variables.map((v) => ({tl: v.trafficLight, val: v.domain[0]!}));
                    }
                }
                this.currentIndex++;
                this.currentValueIndex = 0;
            }
            console.log("solution: ", bestSolution);
            return bestSolution;
    }
}