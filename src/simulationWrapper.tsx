import {Application} from "pixi.js";
import React, {MutableRefObject, useEffect} from "react";

export const SimulationWrapper = React.forwardRef(({app}: { app: Application | undefined }, ref) => {
    console.log("sim app")
    useEffect(() => {
        if (app) {
            console.log("loading app");
            if (ref && (ref as MutableRefObject<any>).current) {
                let htmlElem = (ref as MutableRefObject<any>).current as HTMLElement;
                htmlElem.appendChild(app.view);
                //htmlElem.style.transform = `scale(${scale})`;
            } else {
                console.error("could not append app to div")
            }
        }
    }, [app,ref]);

        return <div style={{transformOrigin: "0 0"}} ref={ref as MutableRefObject<any>}/>;
});