import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getSdk } from "./ExtensionSdk";
import { ContentFieldExtension, Params } from "dc-extensions-sdk";
import { ShoppableImageData } from "./ShoppableImageData";
import { flushSync } from "react-dom";
import { Asset, AssetUploadService } from "./AssetUploadService";
import { useExtensionContext } from "./ExtensionContext";

interface WindowData {
  window: Window;
  connected: boolean;
  srcImageUrl: string;
  sendMessage?: {
    extensionMeta?: boolean;
    srcImageUrl?: boolean;
  };
}

interface WindowMessageDataOut {
  extensionMeta?: {
    exportContext: string;
  };
  inputImageUrl?: string;
  focus?: boolean;
}

interface WindowMessageDataIn {
  data: {
    exportImageUrl?: string;
    connect?: boolean;
    disconnect?: boolean;
  };
}

export interface FieldModel {
  image: any;
}

export interface Parameters extends Params {
  installation: {
    imageStudioUrl: string;
  };
}

interface SrcAsset {
  thumbURL: string;
  srcName: string;
  label: string;
  folderID: string;
  bucketID: string;
}

export interface ImageInfo {
  srcAsset: SrcAsset;
  shoppableImage: ShoppableImageData;
}

interface ImageStudioState {
  openImageStudio: (shoppableImage: ShoppableImageData) => Promise<void>;
}

const defaultImageStudioState = {
  openImageStudio: async (shoppableImage: ShoppableImageData) => {},
};

const ImageStudioContext = createContext<ImageStudioState>(
  defaultImageStudioState
);

export function WithImageStudioContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const { field, setField } = useExtensionContext();
  const [activeWindow, setActiveWindow] = useState<WindowData>();

  const [returnedImageUrl, setReturnedImageUrl] = useState<string>();

  const [imageInfo, setImageInfo] = useState<ImageInfo>();

  const [sdkInstance, setSdkInstance] =
    useState<ContentFieldExtension<FieldModel, Parameters>>();
  const [imageStudioUrl, setImageStudioUrl] = useState<string>();

  useEffect(() => {
    async function fetchData() {
      const sdk = (await getSdk()) as ContentFieldExtension<
        FieldModel,
        Parameters
      >;
      setSdkInstance(sdk);
      setImageStudioUrl(sdk.params.installation.imageStudioUrl);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!returnedImageUrl || !sdkInstance || !imageInfo) {
      return;
    }
    const assetUploadService = new AssetUploadService(sdkInstance);
    assetUploadService
      .uploadToAssetStore(returnedImageUrl, imageInfo)
      .then((uploadedAsset: Asset) => {
        const mediaImageLink = assetUploadService.createImageLinkFromAsset(
          imageInfo.shoppableImage.image,
          uploadedAsset
        );
        // this.diFieldService.updateImageValue(mediaImageLink);
        if (field) {
          field.image = mediaImageLink;
          setField && setField();
        }
      });
  }, [returnedImageUrl]);

  const sendWindowMessages = useCallback(
    (windowData?: WindowData) => {
      if (imageStudioUrl && windowData?.connected && windowData.sendMessage) {
        // process sending messages
        const messageData: WindowMessageDataOut = {};
        if (windowData.sendMessage.extensionMeta) {
          messageData.extensionMeta = {
            exportContext: "Content Item",
          };
        }

        if (windowData.sendMessage.srcImageUrl) {
          messageData.inputImageUrl = windowData.srcImageUrl;
          messageData.focus = true;
        }

        windowData.window.postMessage(messageData, imageStudioUrl);
        delete windowData.sendMessage; // clear all send flags so we don't do this again
      }
    },
    [imageStudioUrl]
  );

  /**
   * process any updates to the active window
   */
  useEffect(() => {
    if (activeWindow) {
      sendWindowMessages(activeWindow);
    }
  }, [activeWindow, sendWindowMessages]);

  const listener = (event: WindowMessageDataIn) => {
    if (event.data?.exportImageUrl) {
      setReturnedImageUrl(event.data.exportImageUrl);
    }

    /**
     * On connecting or disconnecting, update our data model
     * Note: windows may temporarily disconnect, ie if they are refreshed
     * so we need to maintain historical data incase they reconnect
     */
    if (event.data?.connect || event.data?.disconnect) {
      setActiveWindow((currentWindow: WindowData | undefined) => {
        if (currentWindow) {
          const updatedWindow = { ...currentWindow };
          if (event.data.connect && updatedWindow.connected === false) {
            updatedWindow.connected = true;

            // Once connected, send the metadata and srcUrl messages
            updatedWindow.sendMessage = {
              extensionMeta: true,
              srcImageUrl: true,
            };
          } else if (
            event.data.disconnect &&
            updatedWindow.connected === true
          ) {
            updatedWindow.connected = false;
          }
          return updatedWindow;
        }
        return currentWindow;
      });
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    window.addEventListener("message", listener);
    return () => {
      window.removeEventListener("message", listener);
    };
  }, []);

  const openImageStudio = async (shoppableImage: ShoppableImageData) => {
    const srcAsset = await sdkInstance?.assets.getById(shoppableImage.image.id);

    // Submit the image to the active window
    if (activeWindow?.connected) {
      activeWindow.srcImageUrl = srcAsset.thumbURL;
      activeWindow.sendMessage = {
        srcImageUrl: true,
      };
      sendWindowMessages(activeWindow);
      return;
    }

    // When no active, connected window, create another session
    const winRef = window.open(imageStudioUrl);
    if (winRef) {
      /**
       * Open a new window, but refrain from sending any meta/url until we are connected
       */
      const newWinObj: WindowData = {
        window: winRef,
        connected: false,
        srcImageUrl: srcAsset.thumbURL,
      };
      flushSync(() => {
        setImageInfo({ srcAsset, shoppableImage });
        setActiveWindow(newWinObj);
      });
    }
  };

  return (
    <ImageStudioContext.Provider value={{ openImageStudio }}>
      {children}
    </ImageStudioContext.Provider>
  );
}

export function useImageStudioContext() {
  return useContext(ImageStudioContext);
}
