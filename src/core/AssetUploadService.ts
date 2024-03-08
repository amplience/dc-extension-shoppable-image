import { ContentFieldExtension } from "dc-extensions-sdk";
import { FieldModel, ImageInfo, Parameters } from "./ImageStudioContext";
import { HttpMethod } from "dc-extensions-sdk/dist/types/lib/components/HttpClient";
import { MediaImageLink } from "dc-extensions-sdk/dist/types/lib/components/MediaLink";

export interface Asset {
  srcName: string;
  revisionNumber: number;
  bucketID: string;
  label: string;
  mimeType: string;
  type: string;
  userID: string;
  thumbFile: string;
  folderID: string;
  file: string;
  createdDate: number;
  name: string;
  subType: string | null;
  id: string;
  thumbURL: string;
  publishStatus: string;
  status: string;
  timestamp: number;
}

export interface AssetStoreRequestBody {
  hubId: string;
  mode: string;
  assets: {
    src: string;
    name: string;
    label?: string;
    srcName?: string;
    bucketID?: string;
    folderID: string;
  }[];
}

export class AssetUploadService {
  constructor(
    private readonly sdk: ContentFieldExtension<FieldModel, Parameters>
  ) {}

  async uploadToAssetStore(url: string, imageInfo: ImageInfo): Promise<Asset> {
    try {
      if (!this.sdk.hub.id) {
        throw new Error("User has no HubId");
      }

      const payload: AssetStoreRequestBody = {
        hubId: this.sdk.hub.id,
        mode: "renameUnique",
        assets: [
          {
            src: url,
            name: imageInfo.shoppableImage.image.name,
            label: imageInfo.srcAsset.label,
            srcName: imageInfo.srcAsset.srcName,
            folderID: imageInfo.srcAsset.folderID,
            bucketID: imageInfo.srcAsset.bucketID,
          },
        ],
      };

      const sendAsset = await this.sdk.client.request({
        url: "https://api.amplience-qa.net/v2/content/media/assets",
        method: "PUT" as HttpMethod.PUT,
        data: JSON.stringify(payload),
      });
      if (sendAsset.status !== 200) {
        throw new Error("Error creating new asset");
      }

      const data: any = sendAsset.data;
      if (!data?.content?.[0]) {
        throw new Error("Unexpected API response");
      }

      const uploadedAsset: Asset = await this.sdk.assets.getById(
        data.content[0].id
      );
      if (!uploadedAsset) {
        throw new Error("New asset does not exist");
      }
      return uploadedAsset;
    } catch (e) {
      console.error(`Failure during getImageAsset: ${(e as Error).message}`);
      throw e;
    }
  }

  createImageLinkFromAsset(img: MediaImageLink, asset: Asset): MediaImageLink {
    return {
      _meta: {
        schema: img._meta.schema,
      },
      id: asset.id,
      name: asset.name,
      endpoint: img.endpoint,
      defaultHost: img.defaultHost,
    };
  }
}
