import { createContext, PropsWithChildren, useContext } from "react";
import { AmplienceImageStudio } from "@amplience/image-studio-sdk";

import { ShoppableImageData } from "./ShoppableImageData";
import { useExtensionContext } from "./ExtensionContext";
import { AssetLibraryService } from "./dal/asset-library-service/AssetLibraryService";
import { EditorMode, useEditorContext } from "./EditorContext";

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
      });

      if (sdk.hub.organizationId) {
        imageStudioSdk.withDecodedOrgId(sdk.hub.organizationId);
      }

      const studioResponse = await imageStudioSdk.editImages([
        {
          url: srcImage.thumbURL,
          name: srcImage.name,
          mimeType: srcImage.mimeType,
        },
      ]);

      if (studioResponse?.image) {
        const uploadedAsset = await assetLibraryService.uploadAsset(
          studioResponse.image,
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
      }
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
