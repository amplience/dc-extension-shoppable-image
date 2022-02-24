import React, { useState } from "react";
import {
  ShoppableImageHotspot,
  ShoppableImagePolygon,
} from "./ShoppableImageData";

export enum EditorMode {
  Initial,

  EditorPoi,

  EditorGrab,
  EditorHotspot,
  EditorPolygonRect,
  EditorPolygonCircle,

  // These modes don't exist, they trigger actions.
  Swap,
  Delete,
}

export enum MetadataSelectionType {
  Default,
  ResizeX,
  ResizeY,
  Resize,
}

export enum MetadataSelectionMode {
  Hotspot,
  Polygon
}

export type MetadataSelectionTarget =
  | ShoppableImageHotspot
  | ShoppableImagePolygon;

export interface MetadataSelection {
  target: MetadataSelectionTarget;
  mode: MetadataSelectionMode;
  type: MetadataSelectionType;
  resizeAnchor?: { x: number; y: number };
  lastPosition?: { x: number; y: number };
  createdUndo?: boolean;
}

interface EditorState {
  mode: EditorMode;
  changeMode(mode: EditorMode): void;
  selection: MetadataSelection | undefined;
  setSelection(selection: MetadataSelection): void;
}

const dummySetter = () => {
  /* */
};

const defaultEditorState: EditorState = {
  mode: EditorMode.Initial,
  changeMode: dummySetter,
  selection: undefined,
  setSelection: dummySetter,
};

const EditorContext = React.createContext(defaultEditorState);

export function WithEditorContext({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(defaultEditorState);

  state.changeMode = (mode: EditorMode) => {
    setState({ ...state, mode: mode, selection: undefined });
  };

  state.setSelection = (selection: MetadataSelection) => {
    if (state.mode === EditorMode.EditorPoi) {
      switch (selection.mode) {
        case MetadataSelectionMode.Hotspot:
          state.mode = EditorMode.EditorHotspot;
          break;
        case MetadataSelectionMode.Polygon:
          state.mode = EditorMode.EditorGrab;
          break;
      }
    }

    setState({ ...state, selection });
  };

  return (
    <EditorContext.Provider value={state}>{children}</EditorContext.Provider>
  );
}

export function useEditorContext() {
  return React.useContext(EditorContext);
}
