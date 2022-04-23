import {Box, Flex} from "./Layout";
import {Simulation} from "./simulation/simulation";
import {Street} from "./simulation/Street";
import styled from "styled-components";
import {useState} from "react";
import {background, BackgroundProps} from "styled-system";
import {TrafficLight} from "./simulation/TrafficLight";

const Text = styled.p`
  font-size: 12px;
  padding: 0;
  margin: 0;
`

const SubText = styled(Text)`
  font-size: 9px;
`

const Button = styled.button<BackgroundProps>`
  ${background};
`;

const Heading = styled.h3`
  text-align: center;
  color: white;
`;

const Container = styled(Box)`
  ::-webkit-scrollbar {
    width: 9px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgb(155, 155, 155);
    border-radius: 20px;
    border: transparent;
  }
`;

function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue(value + 1); // update the state to force render
}

export function SimulationControls({simulation}: { simulation: Simulation }) {
    const [allVisible, setAllVisible] = useState(false);

    function toggleVisibilityForAll() {
        simulation.streets.forEach((street => street.setHighlight(!allVisible)));
        setAllVisible(!allVisible);
    }

    return (
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