export interface BasePoiInput {
  organizationId: string;
  imageUrl: string;
}

export interface DetectPoiInput extends BasePoiInput {
	hints?: string[];
}

export interface FindPoiInput extends BasePoiInput {
  thingsToFind: string[];
}
