import { ContentFieldExtension } from "dc-extensions-sdk";

export class AutoResizer {
  private active = true;
  private lastSize = 0;
  private animFrameBound: () => void;

  constructor(private sdk: ContentFieldExtension) {
    this.animFrameBound = this.animFrame.bind(this);

    requestAnimationFrame(this.animFrameBound);
  }

  animFrame() {
    const height = this.sdk.frame.getHeight();

    if (height !== this.lastSize) {
      this.lastSize = height;
      this.sdk.frame.setHeight(height);
    }

    if (this.active) {
      requestAnimationFrame(this.animFrameBound);
    }
  }

  dispose() {
    this.active = false;
  }
}
