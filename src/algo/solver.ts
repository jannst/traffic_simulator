import {Constraint} from "../simulation/Constraint";
import {TrafficLight} from "../simulation/TrafficLight";

type DomainValue = 'ON' | 'OFF';

interface Variable {
    trafficLight: TrafficLight
    domain: DomainValue[]
}


export interface NandConstraint {
    a: Variable
    b: Variable
}

export interface Solution {
    tl: TrafficLight
    val: DomainValue
}

function deleteSwitchOnFromDomain(v: Variable) {
    if (v.domain.includes("ON")) {
        v.domain.splice(v.domain.indexOf("ON"), 1);
    }
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
                domain: ["OFF", "ON"],
                trafficLight: tl
            };
        });
        //die constraints in die Variablen packen, damit später nicht mehr so viel über Listen iteriert werden muss
        constraints.forEach((c) => {
            const varA = this.variables.find((v) => v.trafficLight === c.a)!;
            const varB = this.variables.find((v) => v.trafficLight === c.b)!;
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
        // Dies ist der Fall, wenn vj schon gewählt wurde und die Wertemenge = ["ON"]
        // Dann dart der Wert von vi nur "OFF" sein!
        if (vj.domain.includes("ON") && vj.domain.length === 1) {
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

    solve(): Solution[][] {
        //Eine Vorvearbeitung mit dem AC (arc consistency) algorithmus ist hier nicht notwendig, da
        //das Netz in jedem Fall Kantenkonsistent ist, da der einzige Constraint der NAND constraint ist,
        //der prüft, dass nicht 2 verbundene Variablen beide den Wert "ON" haben.
        //Da aber jede Variable immer auch den Wert "OFF" in der Domäne hat, ist dieser Constraint überall erfüllbar

        const values: DomainValue[] = ["OFF", "ON"];
        const solutions: Solution[][] = [];
        //console.log("vars:", this.variables);
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
                        //will never happen in this use case
                        throw new Error("invalid state");
                    }
                }
                if(this.currentIndex === this.variables.length-1) {
                    //alle variablen sind durchlaufen und besetzt => eine Lösung wurde gefunden
                    solutions.push(this.variables.map((v) => ({tl: v.trafficLight, val: v.domain[0]!})));
                }
                this.currentIndex++;
                this.currentValueIndex = 0;
            }
            return solutions;
    }
}