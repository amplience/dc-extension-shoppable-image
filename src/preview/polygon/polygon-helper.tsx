import { ShoppableImagePoint } from "../../core/ShoppableImageData";

export class PolygonHelper {
    static box(x: number, y: number, w: number, h: number): ShoppableImagePoint[] {
        return [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h }
        ]
    }

    static circle(x: number, y: number, xr: number, yr: number): ShoppableImagePoint[] {
        const circleEdgeDist = 0.37;
        const circleCornerDist = 0.13;

        return [
            { x: x + circleEdgeDist * xr, y: y },
            { x: x + (1 - circleEdgeDist) * xr, y: y },
            { x: x + (1 - circleCornerDist) * xr, y: y + circleCornerDist * yr },
            { x: x + xr, y: y + circleEdgeDist * yr },
            { x: x + xr, y: y + (1 - circleEdgeDist) * yr},
            { x: x + (1 - circleCornerDist) * xr, y: y + (1 - circleCornerDist) * yr},
            { x: x + (1 - circleEdgeDist) * xr, y: y + yr},
            { x: x + circleEdgeDist * xr, y: y + yr},
            { x: x + circleCornerDist * xr, y: y + (1 - circleCornerDist) * yr},
            { x: x, y: y + (1 - circleEdgeDist) * yr},
            { x: x, y: y + circleEdgeDist * yr},
            { x: x + circleCornerDist * xr, y: y + circleCornerDist * yr},
        ]
    }
}