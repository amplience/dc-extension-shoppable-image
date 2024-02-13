import { Bounds, Coordinate } from "./dal/shoppable-image/types/GqlOutput";

export interface ContentItemPointOfInterest {
  id: string;
  target: string;
  center: Coordinate;
  bounds: Bounds | undefined;
  outline: Coordinate[] | undefined;
}

export type ObjectData = ContentItemPointOfInterest & {
  selector: string;
};

export enum AIState {
  Stale,
  Loading,
  Loaded,
  Error,
  InsufficientCredits,
}

export interface AIImageData {
  image?: string;
  objects: ObjectData[];
  state: AIState;
  drawerOpen: boolean;
}