import { createContext, PropsWithChildren, useContext } from "react";
import {
  AmplienceImageStudio,
  ImageSaveEventData,
  ImageStudioEventType,
  SDKEventType,
} from "@amplience/image-studio-sdk";

import { ShoppableImageData } from "./ShoppableImageData";
import { useExtensionContext } from "./ExtensionContext";
import { AssetLibraryService } from "./dal/asset-library-service/AssetLibraryService";
import { EditorMode, useEditorContext } from "./EditorContext";
import { Asset } from "./dal/asset-library-service/types/Asset";

interface ImageStudioState {
  openImageStudio: (shoppableImage: ShoppableImageData) => Promise<void>;
}

const defaultImageStudioState = {
  openImageStudio: async (shoppableImage: ShoppableImageData) => {},
};

const ImageStudioContext = createContext<ImageStudioState>(
  defaultImageStudioState
);

const IMAGE_STUDIO_BASEPATH = "https://app.amplience.net";

export function WithImageStudioContext({ children }: PropsWithChildren<{}>) {
  const { sdk, params, field, setThumbUrl, setField, clearUndo } =
    useExtensionContext();
  const { changeMode, clearAi } = useEditorContext();

  const handleOnSaveCallback = async (
    data: any,
    shoppableImage: ShoppableImageData,
    assetLibraryService: AssetLibraryService,
    srcImage: Asset
  ): Promise<SDKEventType | null> => {
    try {
      const imageData = data as ImageSaveEventData;
      if (imageData.image && shoppableImage.image) {
        const uploadedAsset = await assetLibraryService.uploadAsset(
          imageData.image,
          srcImage
        );
        const imageLink = assetLibraryService.createImageLinkFromAsset(
          shoppableImage.image,
          uploadedAsset
        );

        setThumbUrl(uploadedAsset.thumbURL);
        field!.image = imageLink;
        clearUndo!();
        clearAi();
        setField!();
        changeMode(EditorMode.EditorPoi);
        return SDKEventType.Success;
      }
      return SDKEventType.Fail;
    } catch (e) {
      console.error(e);
      return SDKEventType.Fail;
    }
  };
  const openImageStudio = async (shoppableImage: ShoppableImageData) => {
    try {
      if (!sdk) {
        throw new Error("Image Studio extension context not initialised");
      }
      const imageId = shoppableImage?.image?.id;
      if (!shoppableImage?.image || !imageId) {
        throw new Error("Image Studio missing shoppable image");
      }

      const assetLibraryService = new AssetLibraryService(
        sdk,
        params.mediaAssets?.basePath
      );
      const srcImage = await assetLibraryService.getAssetById(imageId);

      const imageStudioSdk = new AmplienceImageStudio({
        domain: params?.imageStudio?.basePath || IMAGE_STUDIO_BASEPATH,
      }).withEventListener(ImageStudioEventType.ImageSave, async (data) => {
        return await handleOnSaveCallback(
          data,
          shoppableImage,
          assetLibraryService,
          srcImage
        );
      });
      if (sdk?.hub?.organizationId) {
        imageStudioSdk.withDecodedOrgId(sdk.hub.organizationId);
      }

      await imageStudioSdk.editImages([
        {
          url: srcImage.thumbURL,
          name: srcImage.name,
          mimeType: srcImage.mimeType,
        },
      ]);
    } catch (e) {
      console.error("Image Studio error:", e);
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
