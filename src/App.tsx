import React, {useEffect, useMemo, useRef, useState} from 'react';
import './App.css';
import {Box, Flex} from "./Layout";
import {SimulationWrapper} from "./simulationWrapper";
import {createApp} from "./simulation/simulation";
import {loadSimulationObjectsFromSvg} from "./simulation/pathParser";
import {Application} from "pixi.js";

export const bgWidth = 1756;
export const bgHeight = 1180;

function App() {
    const wrapperRef = useRef(null);
    const simulationRef = useRef(null);
    const [app, setApp] = useState<Application|undefined>();
    //const [simulationObjects, setSimulationObjects] = useState<SimulationObjects|undefined>();
    //let app = createApp(simulationOjects);

    useEffect(() => {
        if (wrapperRef.current != null) {
            let htmlElem = wrapperRef.current as HTMLElement;
            const scaleY = htmlElem.clientHeight / bgHeight;
            const scaleX = htmlElem.clientWidth / bgWidth;
            // @ts-ignore
            simulationRef.current!.style.transform = `scale(${Math.min(scaleY, scaleX)})`;
        }
        loadSimulationObjectsFromSvg("./Haw_Porsche_Center_Google_Earth.svg").then(objects => {
            //setSimulationObjects(objects);
            setApp(createApp(objects))
        });
    }, []);

    return (
        <Flex flexDirection="row" height="100vh" width="100vw">
            <Box width={200} height="100%" background="green" flexShrink={0}>
            </Box>
            <Box background="black" height="100%" flexGrow={1} ref={wrapperRef} overflow="scroll">
                {useMemo(() => <SimulationWrapper ref={simulationRef} app={app}/>, [app])}
            </Box>
        </Flex>

    );
}

export default App;
