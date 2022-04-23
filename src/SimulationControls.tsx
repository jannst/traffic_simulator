import {Box, Flex} from "./Layout";
import {Simulation} from "./simulation/simulation";
import {Street} from "./simulation/Street";
import styled from "styled-components";
import {useEffect, useState} from "react";
import {background, BackgroundProps} from "styled-system";
import {TrafficLight} from "./simulation/TrafficLight";
import {Button, Text, Container, Heading, Operation, SubText} from "./StyledComponents";
import {ConstraintType} from "./simulation/Constraint";

function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue(value + 1); // update the state to force render
}

export function SimulationControls({simulation}: { simulation: Simulation }) {
    const [allVisible, setAllVisible] = useState(false);
    const [constraintMode, setConstraintMode] = useState<ConstraintType | undefined>()

    useEffect(() => {
        simulation.interactionHandler.setConstraintMode(constraintMode);
    }, [constraintMode]);

    function toggleVisibilityForAll() {
        simulation.streets.forEach((street => street.setHighlight(!allVisible)));
        setAllVisible(!allVisible);
    }

    return (
        <Flex flexDirection="column">
            <Box>
                <Heading>Operations</Heading>
                <Flex>
                    <Operation
                        background={constraintMode === "NAND" ? "orange" : "blue"}
                        onClick={() => setConstraintMode(constraintMode === "NAND" ? undefined : "NAND")}
                    >
                        NAND
                    </Operation>
                </Flex>
            </Box>
            <Container height="100%" overflow="auto">
                <Flex p={1} flexDirection="column" justifyContent="space-between">
                    <Box>
                        <Heading onClick={toggleVisibilityForAll}>Streets</Heading>
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
            <input
                id="typeinp"
                type="range"
                min="0" max="1"
                value={street.percentage}
                onChange={handleChange}
                step=".05"/>
            <Button
                background={street.highlight ? "lightgreen" : "white"}
                onClick={() => updateVisibility(!street.highlight)}>
                toggle highlight
            </Button>
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
        <Box p={1} background="lightgrey">
            <Text>{trafficLight.name}</Text>
            <Button
                background={trafficLight.highlight ? "lightgreen" : "white"}
                onClick={() => updateVisibility(!trafficLight.highlight)}>
                toggle highlight
            </Button>
        </Box>
    )
}