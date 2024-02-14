import { ContentFieldExtension } from "dc-extensions-sdk";
import { ObjectData } from "./AIImageData";
import { TempFileServiceDal } from "./dal/temp-file-service/TempFileServiceDal";
import { AiShoppableImageDal } from "./dal/shoppable-image/AiShoppableImageDal";
import { PointOfInterest } from "./dal/shoppable-image/types/GqlOutput";

interface cache {
  [url: string]: ObjectData[];
}

class AIRequestService {
  private basePath: string;
  private cache: cache;
  private currentPromise: null | ((e: Error) => void);
  private readonly tempFileServiceDal: TempFileServiceDal;
  private readonly aiPoiServiceDal: AiShoppableImageDal;

  constructor(private readonly sdk: ContentFieldExtension, base: string) {
    this.basePath = base;
    this.cache = {} as cache;
    this.currentPromise = null;
    this.tempFileServiceDal = new TempFileServiceDal(sdk);
    this.aiPoiServiceDal = new AiShoppableImageDal(sdk);
  }

  private cancel() {
    if (this.currentPromise) {
      this.currentPromise(new Error("Request cancelled"));
    }
  }

  async get(imageUrl: string, useCache: boolean = true) {
    if (useCache && this.cache[imageUrl]) {
      return this.cache[imageUrl];
    }
    this.cancel();
    return await this.retrieve(imageUrl);
  }

  private retrieve(imageUrl: string): Promise<ObjectData[]> {
    return new Promise(async (resolve, reject) => {
      this.currentPromise = reject;

      try {
        const { downloadUrl } = await this.tempFileServiceDal.uploadImage(imageUrl);
        const organizationId = Buffer.from(`Organization:${this.sdk!.hub.organizationId}`, "utf-8").toString("base64");
        const detectResponse = await this.aiPoiServiceDal.detectPointsOfInterestInImage({
          organizationId,
          imageUrl: downloadUrl,
        });

        const pointsOfInterest = detectResponse.output?.objects ?? [];
        const objects = this.generateSelectors(pointsOfInterest);

        this.cache[imageUrl] = objects;

        resolve(objects);
      } catch (err) {
        reject(err);
      }
    });
  }

  private generateSelectors(objects: PointOfInterest[]): ObjectData[] {
    const stringCount: { [key: string]: number } = {};

    return objects.map(obj => {
      const { label } = obj;
      const count = (stringCount[label] || 0);
      stringCount[label] = count + 1;

      const selector = count > 0 ? `.${label}-${count}` : `.${label}`;
      return {
        ...obj,
        id: obj.id,
        target: obj.label,
        center: obj.center,
        bounds: obj.bounds,
        outline: obj.outline,
        selector,
      };
    });
  }
}

export default AIRequestService;
