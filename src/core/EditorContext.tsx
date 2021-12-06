
import React, { useEffect, useState } from "react";
import { ShoppableImageHotspot, ShoppableImagePolygon } from "./ShoppableImageData";

export enum EditorMode {
  Initial,

  EditorPoi,
  EditorHotspot,
  EditorPolygonRect,
  EditorPolygonCircle,

  // These modes don't exist, they trigger actions.
  Swap,
  Delete
}

export type MetadataSelection =
  | ShoppableImageHotspot
  | ShoppableImagePolygon
  | undefined;

interface EditorState {
  mode: EditorMode;
  changeMode(mode: EditorMode): void;
  selection: MetadataSelection,
  setSelection(selection: MetadataSelection): void
}

const dummySetter = () => {
  /* */
};


const defaultEditorState: EditorState = {
  mode: EditorMode.Initial,
  changeMode: dummySetter,
  selection: undefined,
  setSelection: dummySetter
};

const EditorContext = React.createContext(defaultEditorState);

export function WithEditorContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState(defaultEditorState);

  state.changeMode = (mode: EditorMode) => {
    setState({ ...state, mode: mode, selection: undefined });
  }

  state.setSelection = (selection: MetadataSelection) => {
    setState({ ...state, selection })
  }

  return (
    <EditorContext.Provider value={state}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  return React.useContext(EditorContext);
}
