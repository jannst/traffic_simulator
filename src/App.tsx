import React, {useEffect, useMemo, useReducer, useRef, useState} from 'react';
import './App.css';
import car1 from "./sprites/car-truck1.png";
import bg from "./Haw_Porsche_Center_Google_Earth.png";
import {useWindowDimensions} from "./useWindowDimensions";
import {Box, Flex} from "./Layout";
import {SimulationWrapper} from "./simulationWrapper";
import {createApp} from "./simulation/simulation";

export const bgWidth = 1756;
export const bgHeight = 1180;

function App() {
    const wrapperRef = useRef(null);
    const simulationRef = useRef(null);
    let app = createApp();

    useEffect(() => {
        if (wrapperRef.current != null) {
            let htmlElem = wrapperRef.current as HTMLElement;
            const scaleY = htmlElem.clientHeight / bgHeight;
            const scaleX = htmlElem.clientWidth / bgWidth;
            // @ts-ignore
            simulationRef.current!.style.transform = `scale(${Math.min(scaleY, scaleX)})`;
        }
    }, []);

    return (
        <Flex flexDirection="row" height="100vh" width="100vw">
            <Box width={200} height="100%" background="green" flexShrink={0}>
            </Box>
            <Box background="black" height="100%" flexGrow={1} ref={wrapperRef} overflow="scroll">
                {useMemo(() => <SimulationWrapper ref={simulationRef} app={app}/>, [])}
            </Box>
        </Flex>

    );
}

export default App;
