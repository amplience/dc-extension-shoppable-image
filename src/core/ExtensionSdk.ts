import { init, ContentFieldExtension, ContentEditorExtension } from 'dc-extensions-sdk';

let sdk: Promise<ContentFieldExtension | ContentEditorExtension>;

export async function getSdk(): Promise<ContentFieldExtension | ContentEditorExtension> {
  if (sdk == null) {
    sdk = init();
  }
  return await sdk;
}
