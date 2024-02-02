import { ContentFieldExtension } from "dc-extensions-sdk";
import { FailedToGetTempFileUrls } from "./errors/FailedToGetTempFileUrls";
import { FailedToUploadImage } from "./errors/FailedToUploadImage";

export interface GetTempFileUrlsResponse {
	uploadUrl: string;
	downloadUrl: string;
}

interface UploadImageResponse {
  downloadUrl: string;
}

export class TempFileServiceDal {
  private static readonly ContentType = "Content-Type";

  private readonly contentTypeWhitelist: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/bmp": ".bmp",
    "image/jp2": ".jp2",
    "image/tiff": ".tiff",
    "image/webp": ".webp",
    "application/force-download": "",
  };

  private readonly tempFileMutation = `
		mutation createTempFileUploadUrl {
			createTempFileUploadUrl {
				uploadUrl
				downloadUrl
			}
		}
	`;

  constructor(private readonly sdk: ContentFieldExtension) {}

  isTempFileUrlsResponse(data: any): data is GetTempFileUrlsResponse {
    return data?.uploadUrl && data?.downloadUrl;
  }

  private async getTempFileUrls(): Promise<GetTempFileUrlsResponse> {
    let output: GetTempFileUrlsResponse | undefined;
    try {
      const { data } = await this.sdk.connection.request("dc-management-sdk-js:graphql-mutation", {
        mutation: this.tempFileMutation,
      });

      const createTempFileUploadUrl = data?.createTempFileUploadUrl;
      if (createTempFileUploadUrl && this.isTempFileUrlsResponse(createTempFileUploadUrl)) {
        output = createTempFileUploadUrl;
      }
    } catch (err) {
      throw new FailedToGetTempFileUrls();
    }

    if (!output) {
      throw new FailedToGetTempFileUrls();
    }

    return output;
  }

  async uploadImage(imageUrl: string): Promise<UploadImageResponse> {
    try {
      const image = await fetch(imageUrl);

      const { headers } = image;
      const contentType = headers.get(TempFileServiceDal.ContentType);
      if (!contentType || !Object.keys(this.contentTypeWhitelist).includes(contentType)) {
        throw new FailedToUploadImage();
      }

      const tempFileUrls = await this.getTempFileUrls();
      await fetch(tempFileUrls.uploadUrl, {
        method: "PUT",
        headers: {
          [TempFileServiceDal.ContentType]: contentType,
        },
        body: await image.arrayBuffer(),
      });

      return { downloadUrl: tempFileUrls.downloadUrl, }
    } catch (err) {
      throw new FailedToUploadImage();
    }
  }
}
