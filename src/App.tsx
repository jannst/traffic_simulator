import React, {useEffect, useMemo, useReducer, useRef, useState} from 'react';
import './App.css';
import car1 from "./sprites/car-truck1.png";
import bg from "./Haw_Porsche_Center_Google_Earth.png";
import {useWindowDimensions} from "./useWindowDimensions";
import {Box, Flex} from "./Layout";
import {SimulationWrapper} from "./simulationWrapper";
import {createApp} from "./simulation/simulation";
import {parsePath} from "./simulation/pathParser";

export const bgWidth = 1756;
export const bgHeight = 1180;

function App() {
    const wrapperRef = useRef(null);
    const simulationRef = useRef(null);
    const path = parsePath("m 1752.1474,886.4776 c -36.9058,-2.80769 -73.8127,-5.61546 -104.4901,-8.25156 -30.6773,-2.6361 -55.1242,-5.10047 -74.7274,-6.86966 -19.6031,-1.76919 -34.3611,-2.84305 -55.6938,-3.25735 -21.3327,-0.4143 -49.238,-0.16891 -86.4671,0.50947 -37.2291,0.67838 -83.7795,1.78972 -124.7082,2.80979 -40.9286,1.02007 -76.2332,1.94882 -119.4314,2.19401 -43.1982,0.24518 -94.2872,-0.19323 -146.0627,-1.00131 -51.77558,-0.80808 -104.23457,-1.98578 -145.93799,-3.35298 -41.70342,-1.3672 -72.64902,-2.92385 -100.61416,-6.43529 -27.96514,-3.51145 -52.9483,-8.97764 -84.31871,-16.40785 -31.3704,-7.43021 -69.12605,-16.82398 -99.46714,-23.19711 -30.34109,-6.37313 -53.26588,-9.72517 -76.92908,-11.07242 -23.66321,-1.34726 -48.06324,-0.68952 -77.1856,1.37137 -29.12237,2.06088 -62.96515,5.52482 -89.99666,9.24037 -27.03151,3.71555 -47.25015,7.68255 -77.72303,14.83609 -30.47289,7.15354 -71.19792,17.49315 -97.09735,23.7779 -25.89943,6.28476 -36.97207,8.51434 -54.77892,10.35686 -17.80684,1.84251 -42.346857,3.29774 -66.888297,4.75306");
    let app = createApp(path);

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
