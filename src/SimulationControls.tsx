import {Box, Flex} from "./Layout";
import {Simulation, simulationSpeed} from "./simulation/simulation";
import {Street} from "./simulation/Street";
import {useEffect, useState} from "react";
import {TrafficLight} from "./simulation/TrafficLight";
import {Button, Container, Heading, Operation, SubText, Text} from "./StyledComponents";
import {ConstraintType} from "./simulation/Constraint";

function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue(value + 1); // update the state to force render
}

export function SimulationControls({simulation}: { simulation: Simulation }) {
    const [allStreetsVisible, setAllStreetsVisible] = useState(false);
    const [constraintsVisible, setConstraintsVisible] = useState(false);
    const [constraintMode, setConstraintMode] = useState<ConstraintType | undefined>()
    const [simSpeed, setSimSpeed] = useState(1);
    const forceUpdate = useForceUpdate();

    useEffect(() => {
        simulation.setSpeed(simSpeed);
    },[simSpeed]);

    useEffect(() => {
        simulation.constraintHandler.setConstraintMode(constraintMode);
        if (constraintMode) {
            setConstraintsVisible(true);
        }
    }, [constraintMode]);

    useEffect(() => {
        simulation.setConstraintVisibility(constraintsVisible)
        if (!constraintsVisible) {
            setConstraintMode(undefined);
        }
    }, [constraintsVisible]);


    useEffect(() => {
        simulation.streets.forEach((street => street.setHighlight(allStreetsVisible)));
        forceUpdate();
    }, [allStreetsVisible])

    return (
        <Flex flexDirection="column" height="100%" overflow="hidden">
            <Box>
                <Heading>Simulation Speed {simSpeed.toFixed(1)}</Heading>
                <input
                    style={{width: "96%"}}
                    id="typeinp"
                    type="range"
                    min="1" max="10"
                    value={simSpeed}
                    onChange={(event) => setSimSpeed(parseFloat(event.target.value))}
                    step=".5"
                />
                <Heading>Operations</Heading>
                <Flex px={1}>
                    <Operation
                        background={constraintMode === "NAND" ? "orange" : "blue"}
                        onClick={() => setConstraintMode(constraintMode === "NAND" ? undefined : "NAND")}
                    >
                        NAND
                    </Operation>
                </Flex>
                <Heading>Display</Heading>
                <Flex px={1}>
                    <Operation
                        background={allStreetsVisible ? "orange" : "blue"}
                        onClick={() => setAllStreetsVisible(!allStreetsVisible)}
                    >
                        STREETS
                    </Operation>
                    <Operation
                        background={constraintsVisible ? "orange" : "blue"}
                        onClick={() => setConstraintsVisible(!constraintsVisible)}
                    >
                        CONSTRAINTS
                    </Operation>
                </Flex>
            </Box>
            <Container height="100%" overflow="auto">
                <Flex p={1} flexDirection="column" justifyContent="space-between">
                    <Box>
                        <Heading>Streets</Heading>
                        {simulation.streets.map((street) => <Box my={1} key={street.name}><StreetBox
                            street={street}/></Box>)}
                    </Box>
                    <Box>
                        <Heading>Traffic Lights</Heading>
                        {simulation.trafficLights.map((trafficLight) => <Box my={1} key={trafficLight.name}>
                            <TrafficLightBox trafficLight={trafficLight}/>
                        </Box>)}
                    </Box>
                </Flex>
            </Container>
        </Flex>
    );
}

function StreetBox({street}: { street: Street }) {
    const forceUpdate = useForceUpdate();

    function updateVisibility(value: boolean) {
        street.setHighlight(value);
        forceUpdate();
    }

    function handleChange(event: any) {
        street.percentage = event.target.value;
        forceUpdate();
    }

    return (
        <Box p={1} background="lightgrey">
            <Text>{street.name}</Text>
            {street.parent && <SubText>Parent: {street.parent.name}</SubText>}
            {street.mergesInto && <SubText>Merges Into: {street.mergesInto.street.name}</SubText>}
            <Flex width="100%" justifyContent="space-between">
                <input
                    id="typeinp"
                    type="range"
                    min="0" max="1"
                    value={street.percentage}
                    onChange={handleChange}
                    step=".025"/>
                <Button
                    background={street.highlight ? "lightgreen" : "white"}
                    onClick={() => updateVisibility(!street.highlight)}>
                    highlight
                </Button>
            </Flex>
        </Box>
    )
}

function TrafficLightBox({trafficLight}: { trafficLight: TrafficLight }) {
    const forceUpdate = useForceUpdate();

    function updateVisibility(value: boolean) {
        trafficLight.setHighlight(value);
        forceUpdate();
    }

    return (
        <Flex p={1} background="lightgrey" justifyContent="space-between">
            <Text>{trafficLight.name}</Text>
            <Button
                background={trafficLight.highlight ? "lightgreen" : "white"}
                onClick={() => updateVisibility(!trafficLight.highlight)}>
                highlight
            </Button>
        </Flex>
    )
}