import { ContentFieldExtension } from "dc-extensions-sdk";
import { HttpMethod } from "dc-extensions-sdk/dist/types/lib/components/HttpClient";
import { MediaImageLink } from "dc-extensions-sdk/dist/types/lib/components/MediaLink";
import { AssetPutPayload } from "./types/AssetPutPayload";
import { Asset } from "./types/Asset";
import { mimeTypeToFileExtension, SDKImage } from "@amplience/image-studio-sdk";

export class AssetLibraryService {
  private basePath: string;
  constructor(
    private readonly sdk: ContentFieldExtension,
    basePath: string = "https://api.amplience.net/v2/content/media/assets"
  ) {
    this.basePath = basePath;
  }

  async getAssetById(id: string) {
    const uploadedAsset = await this.sdk.assets.getById(id);
    if (!uploadedAsset) {
      throw new Error("Asset does not exist");
    }
    return uploadedAsset;
  }

  async putAsset(payload: AssetPutPayload) {
    const response = await this.sdk.client.request({
      url: this.basePath,
      method: "PUT" as HttpMethod.PUT,
      data: JSON.stringify(payload),
    });
    if (response.status !== 200) {
      throw new Error("Error creating new asset");
    }

    const data: any = response.data;
    if (!data?.content?.[0]) {
      throw new Error("Unexpected API response");
    }

    return data?.content?.[0];
  }

  async uploadAsset(
    studioAsset: SDKImage,
    srcAsset: Asset
  ): Promise<Asset> {
    try {
      if (!this.sdk.hub.id) {
        throw new Error("User has no HubId");
      }

      const fileExtension = mimeTypeToFileExtension(studioAsset.mimeType);

      if (!fileExtension) {
        throw new Error("Unable to determine image file extension");
      }

      const assetPutResponse = await this.putAsset({
        hubId: this.sdk.hub.id,
        mode: "overwrite",
        assets: [
          {
            src: studioAsset.url,
            name: studioAsset.name,
            srcName: `${studioAsset.name}.${fileExtension}`,
            label: `${studioAsset.name}.${fileExtension}`,
            folderID: srcAsset.folderID,
            bucketID: srcAsset.bucketID,
          },
        ],
      });

      const uploadedAsset = await this.getAssetById(assetPutResponse.id);
      return uploadedAsset;
    } catch (e) {
      console.error(
        `Failure during uploadToAssetStore: ${(e as Error).message}`,
        e
      );
      throw e;
    }
  }

  createImageLinkFromAsset(
    img: MediaImageLink,
    asset: Asset
  ): MediaImageLink & { mimeType: string } {
    return {
      _meta: {
        schema: img._meta.schema,
      },
      id: asset.id,
      name: asset.name,
      endpoint: img.endpoint,
      defaultHost: img.defaultHost,
      mimeType: asset.mimeType,
    };
  }
}
