import { init, ContentFieldExtension } from 'dc-extensions-sdk';

let sdk: Promise<ContentFieldExtension>;

export async function getSdk(): Promise<ContentFieldExtension> {
  if (sdk == null) {
    sdk = init();
  }
  return await sdk;
}
