import React, {useEffect, useMemo, useRef, useState} from 'react';
import './App.css';
import {Box, Flex} from "./Layout";
import {SimulationWrapper} from "./simulationWrapper";
import {createApp, Simulation} from "./simulation/simulation";
import {loadSimulationObjectsFromSvg} from "./simulation/pathParser";
import {Application} from "pixi.js";
import {SimulationControls} from "./SimulationControls";

export const bgWidth = 1756;
export const bgHeight = 1180;

function App() {
    const wrapperRef = useRef(null);
    const simulationRef = useRef(null);
    const [simulation, setSimulation] = useState<Simulation | undefined>();

    useEffect(() => {
        if (wrapperRef.current != null) {
            let htmlElem = wrapperRef.current as HTMLElement;
            const scaleY = htmlElem.clientHeight / bgHeight;
            const scaleX = htmlElem.clientWidth / bgWidth;
            // @ts-ignore
            simulationRef.current!.style.transform = `scale(${Math.min(scaleY, scaleX)})`;
        }
        createApp("./Haw_Porsche_Center_Google_Earth.svg").then(simulation => {
            //setSimulationObjects(objects);
            setSimulation(simulation)
        });
    }, []);

    return (
        <Flex flexDirection="row" height="100vh" width="100vw">
            <Box width="20vw" height="100%" background="green" flexShrink={0}>
                {simulation && <SimulationControls simulation={simulation}/>}
            </Box>
            <Box background="black" height="100%" flexGrow={1} ref={wrapperRef} overflow="scroll">
                {useMemo(() => <SimulationWrapper ref={simulationRef} app={simulation?.app}/>, [simulation?.app])}
            </Box>
        </Flex>

    );
}

export default App;
