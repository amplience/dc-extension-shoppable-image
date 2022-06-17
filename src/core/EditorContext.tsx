import React, { useState } from "react";
import { useExtensionContext } from "./ExtensionContext";
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
  setSelection(selection: MetadataSelection | undefined): void;
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
  const { field } = useExtensionContext();

  state.changeMode = (mode: EditorMode) => {
    setState({ ...state, mode: mode, selection: undefined });
  };

  state.setSelection = (selection: MetadataSelection | undefined) => {
    if (state.mode === EditorMode.EditorPoi && selection) {
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

  const validateSelection = () => {
    if (state.selection && field) {
      if (state.selection.mode === MetadataSelectionMode.Hotspot) {
        const index = field.hotspots ? field.hotspots.findIndex(x => x.id === (state.selection as MetadataSelection).target.id) : -1;

        if (index === -1) {
          state.setSelection(undefined);
        } else if (field.hotspots && field.hotspots[index] !== (state.selection as MetadataSelection).target) {
          // Might need to repoint at new object.
          state.setSelection({
            ...state.selection,
            target: field.hotspots[index]
          });
        }
      } else if (state.selection.mode === MetadataSelectionMode.Polygon) {
        const index = field.polygons ? field.polygons.findIndex(x => x.id === (state.selection as MetadataSelection).target.id) : -1;

        if (index === -1) {
          state.setSelection(undefined);
        } else if (field.polygons && field.polygons[index] !== (state.selection as MetadataSelection).target) {
          // Might need to repoint at new object.
          state.setSelection({
            ...state.selection,
            target: field.polygons[index]
          });
        }
      }
    }
  }

  validateSelection();

  return (
    <EditorContext.Provider value={state}>{children}</EditorContext.Provider>
  );
}

export function useEditorContext() {
  return React.useContext(EditorContext);
}
