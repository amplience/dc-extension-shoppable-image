export class MouseState {
  isMouseDown = false;

  mouseDown() {
    this.isMouseDown = true;
  }

  mouseUp() {
    this.isMouseDown = false;
  }
}
