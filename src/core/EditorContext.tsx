
import React, { useEffect, useState } from "react";

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

interface EditorState {
  mode: EditorMode;
  changeMode(mode: EditorMode): void;
}

const dummySetter = () => {
  /* */
};

const defaultEditorState: EditorState = {
  mode: EditorMode.Initial,
  changeMode: dummySetter
};

const EditorContext = React.createContext(defaultEditorState);

export function WithEditorContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState(defaultEditorState);

  useEffect(() => {
    const state: EditorState = { mode: EditorMode.Initial, changeMode: dummySetter };

    state.changeMode = (mode: EditorMode) => {
      setState({ ...state, mode: mode });
    }

    setState(state);
  }, []);

  return (
    <EditorContext.Provider value={state}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  return React.useContext(EditorContext);
}
