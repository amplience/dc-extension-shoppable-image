import React, { useEffect, useState } from "react";
import { useExtensionContext } from "./ExtensionContext";
import {
  ShoppableImageHotspot,
  ShoppableImagePolygon,
} from "./ShoppableImageData";

import { AIImageData, AIState } from "./AIImageData";
import { InsufficientCredits } from "./dal/shoppable-image/errors/InsufficientCredits";
import { track } from "../gainsight/gainsight";

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
  Polygon,
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
  aspect: { x: number; y: number };
  setAspect: (aspect: { x: number; y: number }) => void;
  mode: EditorMode;
  changeMode(mode: EditorMode): void;
  selection: MetadataSelection | undefined;
  setSelection(selection: MetadataSelection | undefined): void;
  ai: AIImageData;
  toggleAIDrawer(): void;
  setDrawerVisible(state: boolean): void;
  fetchAI(): Promise<void>;
  clearAi(): void;
  uiDisabled: boolean;
  setUiDisabled(disabled: boolean): void;
}

const dummySetter = () => {
  /* */
};

const initialAiState: AIImageData = {
  objects: [],
  drawerOpen: false,
  state: AIState.Stale,
};

const defaultEditorState: EditorState = {
  mode: EditorMode.Initial,
  aspect: { x: 1, y: 1 },
  setAspect: dummySetter,
  changeMode: dummySetter,
  selection: undefined,
  setSelection: dummySetter,
  toggleAIDrawer: dummySetter,
  fetchAI: async () => {},
  ai: initialAiState,
  clearAi: () => {},
  setDrawerVisible: (state: boolean) => {},
  setUiDisabled: (state: boolean) => {},
  uiDisabled: false,
};

const EditorContext = React.createContext(defaultEditorState);

export function WithEditorContext({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(defaultEditorState);
  const [uiDisabled, setUiDisabled] = useState(false);

  const { field, AIService, sdk, thumbURL } = useExtensionContext();

  useEffect(() => {
    const fetchAI = async () => {
      track(window, "AI Automatic Shoppable Image", {
        name: "dc-extension-shoppable-image-ai",
        category: "Extension",
      });

      const imageHost = sdk?.stagingEnvironment || field?.image?.defaultHost;
      if (
        AIService &&
        imageHost &&
        field?.image?.endpoint &&
        field.image?.name
      ) {
        const imageUrl = sdk?.stagingEnvironment
          ? `https://${imageHost}/i/${
              field.image.endpoint
            }/${encodeURIComponent(field.image.name)}`
          : thumbURL;
        setState((prevState) => ({
          ...prevState,
          ai: { ...prevState.ai, state: AIState.Loading },
        }));
        try {
          setUiDisabled(true);
          const objects = await AIService.get(imageUrl, true);
          track(window, "AI Credits used", {
            name: "dc-extension-shoppable-image-ai",
            category: "Extension",
          });
          if (Array.isArray(objects) && objects.length > 0) {
            setState((prevState) => ({
              ...prevState,
              ai: { ...prevState.ai, state: AIState.Loaded, objects },
            }));
          } else {
            setState((prevState) => ({
              ...prevState,
              ai: { ...prevState.ai, state: AIState.Error },
            }));
          }
        } catch (e: any) {
          if (e && e.message === "Request cancelled") {
            return;
          }

          const isInsufficientCredits = e instanceof InsufficientCredits;

          if (isInsufficientCredits) {
            track(window, "AI Credits Limit reached", {
              name: "dc-extension-shoppable-image-ai",
              category: "Extension",
            });
          }

          const state = isInsufficientCredits
            ? AIState.InsufficientCredits
            : AIState.Error;
          setState((prevState) => ({
            ...prevState,
            ai: { ...prevState.ai, state },
          }));
        } finally {
          setUiDisabled(false);
        }
      }
    };

    const clearAi = () => {
      setState((prevState) => ({ ...prevState, ai: initialAiState }));
    };

    const setDrawerVisible = (state: boolean) => {
      setState((prevState) => ({
        ...prevState,
        ai: {
          ...prevState.ai,
          drawerOpen: state,
        },
      }));
    };

    setState((prevState) => ({
      ...prevState,
      fetchAI: fetchAI,
      clearAi: clearAi,
      setDrawerVisible,
    }));
  }, [field?.image, thumbURL, AIService, sdk]);

  const setAspect = (aspect: { x: number; y: number }) => {
    setState((prevState) => ({ ...prevState, aspect }));
  };

  const changeMode = (mode: EditorMode) => {
    setState((prevState) => ({
      ...prevState,
      mode,
      selection: undefined,
    }));
  };

  const toggleAIDrawer = () => {
    setState((prevState) => ({
      ...prevState,
      ai: { ...prevState.ai, drawerOpen: !prevState.ai.drawerOpen },
    }));
  };

  useEffect(() => {
    validateSelection();
  }, [state, field]);

  const validateSelection = () => {
    if (state.selection && field) {
      if (state.selection.mode === MetadataSelectionMode.Hotspot) {
        const index = field.hotspots
          ? field.hotspots.findIndex(
              (x) => x.id === (state.selection as MetadataSelection).target.id
            )
          : -1;

        if (index === -1) {
          state.setSelection(undefined);
        } else if (
          field.hotspots &&
          field.hotspots[index] !==
            (state.selection as MetadataSelection).target
        ) {
          // Might need to repoint at new object.
          state.setSelection({
            ...state.selection,
            target: field.hotspots[index],
          });
        }
      } else if (state.selection.mode === MetadataSelectionMode.Polygon) {
        const index = field.polygons
          ? field.polygons.findIndex(
              (x) => x.id === (state.selection as MetadataSelection).target.id
            )
          : -1;

        if (index === -1) {
          state.setSelection(undefined);
        } else if (
          field.polygons &&
          field.polygons[index] !==
            (state.selection as MetadataSelection).target
        ) {
          // Might need to repoint at new object.
          state.setSelection({
            ...state.selection,
            target: field.polygons[index],
          });
        }
      }
    }
  };

  const setSelection = (selection: MetadataSelection | undefined) => {
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

  return (
    <EditorContext.Provider
      value={{
        ...state,
        setAspect,
        changeMode,
        toggleAIDrawer,
        setSelection,
        uiDisabled,
        setUiDisabled,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  return React.useContext(EditorContext);
}
