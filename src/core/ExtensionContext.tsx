import { ContentFieldExtension } from "dc-extensions-sdk";
import React, { useEffect, useState } from "react";
import { getSdk } from "./ExtensionSdk";
import { ShoppableImageData } from "./ShoppableImageData";

interface ExtensionState {
  params?: any;
  sdk?: ContentFieldExtension;
  field?: ShoppableImageData;
  setField?: () => void;
  sdkConnected: boolean;
}

const defaultExtensionState: ExtensionState = {
  sdkConnected: false
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
      sdk.frame.setHeight(500);
      sdk.frame.startAutoResizer();

      const params = { ...sdk.params.installation, ...sdk.params.instance };
      const field = await sdk.field.getValue() as ShoppableImageData;

      const state: ExtensionState = { params, sdk, field, sdkConnected: true };

      state.setField = () => {
        sdk.field.setValue(field);
        setState({ ...state });
      }

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
