import { ContentFieldExtension } from "dc-extensions-sdk";
import { DetectPoiInput, FindPoiInput } from "./types/GqlInput";
import { PointsOfInterest, isPointsOfInterest } from "./types/GqlOutput";
import { FailedToDetectPois } from "./errors/FailedToDetectPois";
import { FailedToFindPois } from "./errors/FailedToFindPois";
import { InsufficientCredits } from "./errors/InsufficientCredits";

const AI_TIMEOUT_MS = 31000;

export class AiShoppableImageDal {
  private readonly detectPointsOfInterestInImageMutation = `
		mutation detectPointsOfInterestInImage($input: PointsOfInterestInImageInput!) {
			detectPointsOfInterestInImage(input: $input) {
				objects {
					id
					label
					center {
						x
						y
					}
					bounds {
						topLeft {
							x
							y
						}
						height
						width
					}
					outline {
						x
						y
					}
				}
			}
		}
	`;

  private readonly findPointsOfInterestInImageMutation = `
		mutation findPointsOfInterestInImage(
			$input: FindPointsOfInterestInImageInput!
		) {
			findPointsOfInterestInImage(input: $input) {
				objects {
					id
					label
					center {
						x
						y
					}
					bounds {
						topLeft {
							x
							y
						}
						height
						width
					}
					outline {
						x
						y
					}
				}
			}
		}
	`;

  constructor(private readonly sdk: ContentFieldExtension) {}

  isInsufficientCreditsError = (error: any) => error?.data?.errors?.[0]?.extensions?.code === "INSUFFICIENT_CREDITS";

  async detectPointsOfInterestInImage(input: DetectPoiInput): Promise<DetectResult> {
    let output: PointsOfInterest | undefined;
    try {
      const promise: Promise<any> = new Promise((resolve, reject) => {
        let hasResolved = false;
        this.sdk.connection
          .request("dc-management-sdk-js:graphql-mutation", {
            mutation: this.detectPointsOfInterestInImageMutation,
            vars: {
              input,
            },
          })
          .then((x) => {
            hasResolved = true;
            resolve(x);
          })
          .catch((e) => {
            hasResolved = true;
            reject(e);
          });

        setTimeout(() => {
          if (hasResolved) {
            return;
          }

          reject(new FailedToDetectPois());
        }, AI_TIMEOUT_MS);
      });

      const { data } = await promise;

      const polyObjects = data?.detectPointsOfInterestInImage;
      if (polyObjects && isPointsOfInterest(polyObjects)) {
        output = polyObjects;
      }
    } catch (err) {
      if (this.isInsufficientCreditsError(err)) {
        throw new InsufficientCredits();
      } else {
        throw new FailedToDetectPois();
      }
    }

    if (!output) {
      throw new FailedToDetectPois();
    }

    return {
      output,
    };
  }

  async findPointsOfInterestInImage(input: FindPoiInput): Promise<PointsOfInterest> {
    let output: PointsOfInterest | undefined;
    try {
      const { data } = await this.sdk.connection.request("dc-management-sdk-js:graphql-mutation", {
        mutation: this.findPointsOfInterestInImageMutation,
        vars: {
          input,
        },
      });

      const polyObjects = data?.findPointsOfInterestInImage;
      if (polyObjects && isPointsOfInterest(polyObjects)) {
        output = polyObjects;
      }
    } catch (err) {
      throw new FailedToFindPois();
    }

    if (!output) {
      throw new FailedToFindPois();
    }

    return output;
  }
}

interface DetectResult {
  output?: PointsOfInterest;
}
