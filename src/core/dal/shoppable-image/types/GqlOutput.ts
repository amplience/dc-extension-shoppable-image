import { PointOfSale } from "@mui/icons-material";

export interface Coordinate {
  x: number;
  y: number;
}

export interface Bounds {
  topLeft: Coordinate;
  width: number;
  height: number;
}

export interface PointOfInterest {
  id: string;
  label: string;
  center: Coordinate;
  bounds: Bounds | undefined;
  outline: Coordinate[] | undefined;
}

export interface PointsOfInterest {
  objects: PointOfInterest[] | undefined;
}

function isCoordinate(data: any): data is Coordinate {
	const { x, y } = data;
	if (x === undefined || y === undefined) {
		return false;
	}

	return true;
}

function isCoordinates(data: any): data is Coordinate[] {
	if (!Array.isArray(data)) {
		return false;
	}

	for (let element of data) {
		if (!isCoordinate(element)) {
			return false;
		}
	}

	return true;
}

function isBounds(data: any): data is Bounds {
	const { topLeft, width, height } = data;
	if (!topLeft || width === undefined || height === undefined) {
		return false;
	}

	return isCoordinate(topLeft);
}

function isPointOfInterest(data: any): data is PointOfInterest {
	const { id, label, center, bounds, outline } = data;
	if (!id || !label || !center) {
		return false;
	}

	if (bounds && !isBounds(bounds)) {
		return false;
	}

	if (outline && !isCoordinates(outline)) {
    return false;
  }

	return true;
}

export function isPointsOfInterest(data: any): data is PointsOfInterest {
	if (data === undefined) {
		return false;
	}

	const { objects } = data;
	if (!objects) {
		return true;
	} else if (!Array.isArray(objects)) {
		return false;
	}

	for (let element of objects) {
		if (!isPointOfInterest(element)) {
			return false;
		}
	}

  return true;
}
