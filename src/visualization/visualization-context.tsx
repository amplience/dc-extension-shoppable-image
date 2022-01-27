import React, { useEffect, useState } from "react";
import { ShoppableImageData } from "../core/ShoppableImageData";
import { init } from 'dc-visualization-sdk';

interface ExtensionState {
  field?: ShoppableImageData;
}

const defaultExtensionState: ExtensionState = {
};

const VisualizationContext = React.createContext(defaultExtensionState);

export function WithVisualizationContext({
  fieldName,
  children,
}: {
  fieldName: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState(defaultExtensionState);

  useEffect(() => {
    init().then(async (sdk) => {
      const state: ExtensionState = { 
        field: (await sdk.form.get({
          format: 'linked',
          depth: 'all'
        })).content[fieldName]
      };

      sdk.form.changed((model) => {
        setState({ ...state, field: model.content[fieldName] as ShoppableImageData });
      });

      setState({ ...state });
    }).catch((e) => {
      console.error(e);
    });
  }, [fieldName]);

  return (
    <VisualizationContext.Provider value={state}>
      {children}
    </VisualizationContext.Provider>
  );
}

export function useVisualizationContext() {
  return React.useContext(VisualizationContext);
}
