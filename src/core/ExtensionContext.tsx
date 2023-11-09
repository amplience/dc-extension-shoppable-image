import { ContentFieldExtension, ContentEditorExtension } from "dc-extensions-sdk";
import React, { useEffect, useState } from "react";
import { AutoResizer } from "./AutoResizer";
import { getSdk } from "./ExtensionSdk";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { ShoppableImageData } from "./ShoppableImageData";interface ExtensionState {
  params?: any;
  sdk?: ContentFieldExtension | ContentEditorExtension;
  field?: ShoppableImageData;
  setField?: () => void;
  setUndo?: () => void;
  undo?: () => void;
  redo?: () => void;
  clearUndo?: () => void;
  undoHistory: ShoppableImageData[];
  redoHistory: ShoppableImageData[];
  sdkConnected: boolean;
  isField: boolean;
}

const defaultExtensionState: ExtensionState = {
  undoHistory: [],
  redoHistory: [],
  sdkConnected: false,
  isField: true
};

const ExtensionContext = React.createContext(defaultExtensionState);

export function WithExtensionContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState(defaultExtensionState);

  useEffect(() => {
    getSdk().then(async (sdk) => {
      const isField = sdk instanceof ContentFieldExtension;
      if(isField) {
        new AutoResizer(sdk);
      }
      const params: any = { ...sdk.params.installation, ...sdk.params.instance };
      const schema = isField ? sdk.field.schema : sdk.schema;
      const field = isField ? await sdk.field.getValue() as ShoppableImageData : await sdk.form.getValue() as ShoppableImageData;
      const undoHistory: ShoppableImageData[] = [];
      const redoHistory: ShoppableImageData[] = [];

      if (params.title == null && schema.title) {
        params.title = schema.title;
      }

      const state: ExtensionState = { params, sdk, field, undoHistory, redoHistory, sdkConnected: true, isField };

      state.setField = () => {
        isField ? sdk.field.setValue(field) : sdk.form.setValue(field);
        setState({ ...state });
      }

      state.setUndo = () => {
        redoHistory.splice(0, redoHistory.length);
        undoHistory.push(JSON.parse(JSON.stringify(field)));
        setState({ ...state });
      }

      state.undo = () => {
        const undo = undoHistory.pop();

        if (undo) {
          redoHistory.push(JSON.parse(JSON.stringify(field)));
          Object.assign(field, undo);
          isField ? sdk.field.setValue(field) : sdk.form.setValue(field);
          setState({ ...state });
        }
      }

      state.redo = () => {
        const redo = redoHistory.pop();

        if (redo) {
          undoHistory.push(JSON.parse(JSON.stringify(field)));
          Object.assign(field, redo);
          isField ? sdk.field.setValue(field) : sdk.form.setValue(field);
          setState({ ...state });
        }
      }

      state.clearUndo = () => {
        redoHistory.splice(0, redoHistory.length);
        undoHistory.splice(0, undoHistory.length);
      }

      KeyboardShortcuts.bindUndoMethods(state.undo, state.redo);

      setState(state);
    }).catch((e) => {
      console.error(e);
    });
  }, []);

  return (
    <ExtensionContext.Provider value={state}>
      {children}
    </ExtensionContext.Provider>
  );
}

export function useExtensionContext() {
  return React.useContext(ExtensionContext);
}
