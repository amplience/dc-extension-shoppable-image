import { ContentFieldExtension } from "dc-extensions-sdk";
import React, { useEffect, useState } from "react";
import { AutoResizer } from "./AutoResizer";
import { getSdk } from "./ExtensionSdk";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { ShoppableImageData } from "./ShoppableImageData";
import AIRequestService from "./AIRequestService";

interface ExtensionState {
  params?: any;
  sdk?: ContentFieldExtension;
  field?: ShoppableImageData;
  setField?: () => void;
  setUndo?: () => void;
  undo?: () => void;
  redo?: () => void;
  clearUndo?: () => void;
  undoHistory: ShoppableImageData[];
  redoHistory: ShoppableImageData[];
  sdkConnected: boolean;
  AIService?: AIRequestService;
  thumbURL: string;
  setThumbUrl: { (x: string): void };
}

const defaultExtensionState: ExtensionState = {
  undoHistory: [],
  redoHistory: [],
  sdkConnected: false,
  thumbURL: "",
  setThumbUrl: () => {},
};

const ExtensionContext = React.createContext(defaultExtensionState);

export function WithExtensionContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState(defaultExtensionState);

  useEffect(() => {
    getSdk()
      .then(async (sdk) => {
        new AutoResizer(sdk);

        const params: any = {
          ...sdk.params.installation,
          ...sdk.params.instance,
        };
        const schema = sdk.field.schema;
        const formValue = (await sdk.field.getValue()) as ShoppableImageData;
        let hasImage = !!formValue?.image?.id;
        const assetId = formValue?.image?.id;
        const asset = hasImage && assetId
          ? await sdk.assets.getById(assetId)
          : {};
        const thumbURL = asset.thumbURL;
        const field = formValue || {};
        const undoHistory: ShoppableImageData[] = [];
        const redoHistory: ShoppableImageData[] = [];
        const AIService = new AIRequestService(sdk, params?.ai?.basePath || "");

        if (params.title == null && schema.title) {
          params.title = schema.title;
        }

        const setThumbUrl = (url: string) => {
          state.thumbURL = url;
        };

        const state: ExtensionState = {
          params,
          sdk,
          field,
          undoHistory,
          redoHistory,
          AIService,
          sdkConnected: true,
          thumbURL,
          setThumbUrl,
        };

        state.setField = () => {
          sdk.field.setValue(field);
          setState({ ...state });
        };

        state.setUndo = () => {
          redoHistory.splice(0, redoHistory.length);
          undoHistory.push(JSON.parse(JSON.stringify(field)));
          setState({ ...state });
        };

        state.undo = () => {
          const undo = undoHistory.pop();

          if (undo) {
            redoHistory.push(JSON.parse(JSON.stringify(field)));
            Object.assign(field, undo);
            sdk.field.setValue(field);
            setState({ ...state });
          }
        };

        state.redo = () => {
          const redo = redoHistory.pop();

          if (redo) {
            undoHistory.push(JSON.parse(JSON.stringify(field)));
            Object.assign(field, redo);
            sdk.field.setValue(field);
            setState({ ...state });
          }
        };

        state.clearUndo = () => {
          redoHistory.splice(0, redoHistory.length);
          undoHistory.splice(0, undoHistory.length);
        };

        KeyboardShortcuts.bindUndoMethods(state.undo, state.redo);

        setState(state);
      })
      .catch((e) => {
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
