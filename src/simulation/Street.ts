import {Dot} from "./pathParser";
import {Graphics} from "pixi.js";

export interface Street {
    dots: Dot[],
    parent?: Street,
    id: string,
    parentId?: string
    mergesIntoId?: string
    mergesInto?: { street: Street, targetIndex: number }
    children: { [key: number]: { street: Street } },
    name: string,
    highlight: Boolean,
    setHighlight: (visibility: boolean) => void
    setGraphics: (graphics: Graphics) => void
}

export class StreetImpl implements Street {
    children: { [p: number]: { street: Street } } = {}
    dots: Dot[];
    id: string;
    mergesInto?: { street: Street; targetIndex: number };
    mergesIntoId: string;
    name: string;
    parent?: Street;
    parentId: string;
    graphics?: Graphics;
    highlight: boolean = false;

    constructor(name: string, dots: Dot[], id: string, parentId: string, mergesIntoId: string) {
        this.name = name;
        this.dots = dots;
        this.id = id;
        this.parentId = parentId;
        this.mergesIntoId = mergesIntoId;
    }

    setGraphics(graphics: Graphics) {
        this.graphics = graphics;
    }

    setHighlight(visibility: boolean): void {
        if (this.graphics && visibility !== this.highlight) {
            this.graphics.clear();
            this.highlight = visibility;
            if (visibility && this.dots.length > 1) {
                this.graphics.moveTo(this.dots[0].x, this.dots[0].y);
                for (let i = 1; i < this.dots.length; i++) {
                    this.graphics.lineStyle(3, this.dots[i - 1].checkForCollisions ? 0xFF0000 : 0xFFFFFF, 1);
                    this.graphics.lineTo(this.dots[i].x, this.dots[i].y);
                }
            }
        }
    }
}