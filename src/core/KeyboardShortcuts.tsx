interface KeyboardBinding {
  code: string,
  needsCtrl?: boolean,
  needsShift?: boolean,
  action: () => void
}

export class KeyboardShortcuts {
  keyDownBind: (event: KeyboardEvent) => void;
  keyUpBind: (event: KeyboardEvent) => void;
  ignoreShortcuts = false;

  undoBind?: () => void;
  redoBind?: () => void;
  deleteBind?: () => void;

  private actions: Map<string, KeyboardBinding[]>;

  constructor() {
    this.keyDownBind = this.keyDown.bind(this);
    this.keyUpBind = this.keyUp.bind(this);

    const bindings: KeyboardBinding[] = [
      {
        code: 'KeyZ',
        needsCtrl: true,
        needsShift: true,
        action: this.redo.bind(this)
      },
      {
        code: 'KeyZ',
        needsCtrl: true,
        action: this.undo.bind(this)
      },
      {
        code: 'KeyY',
        needsCtrl: true,
        action: this.redo.bind(this)
      },
      {
        code: 'Backspace',
        action: this.delete.bind(this)
      },
      {
        code: 'Delete',
        action: this.delete.bind(this)
      }
    ];

    this.actions = new Map();

    for (const binding of bindings) {
      let codeBindings = this.actions.get(binding.code);

      if (codeBindings === undefined) {
        codeBindings = [];

        this.actions.set(binding.code, codeBindings);
      }

      codeBindings.push(binding);
    }

    this.bind();
  }

  bind(): void {
    window.addEventListener('keydown', this.keyDownBind);
    window.addEventListener('keyup', this.keyUpBind);
  }

  unbind(): void {
    window.removeEventListener('keydown', this.keyDownBind);
    window.removeEventListener('keyup', this.keyUpBind);
  }

  undo(): void {
    if (this.undoBind) {
      this.undoBind();
    }
  }

  redo(): void {
    if (this.redoBind) {
      this.redoBind();
    }
  }

  delete(): void {
    if (this.deleteBind) {
      this.deleteBind();
    }
  }

  static globalInstance?: KeyboardShortcuts;

  static getInstance(): KeyboardShortcuts {
    if (this.globalInstance == null) {
      this.globalInstance = new KeyboardShortcuts();
    }

    return this.globalInstance;
  }

  static bindUndoMethods(undo: () => void, redo: () => void) {
    const instance = this.getInstance();

    instance.undoBind = undo;
    instance.redoBind = redo;
  }

  static bindDeleteMethod(deleteMethod: () => void) {
    const instance = this.getInstance();

    instance.deleteBind = deleteMethod;
  }

  keyDown(event: KeyboardEvent) {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      return;
    }

    const matches = this.actions.get(event.code);

    if (matches) {
      for (const match of matches) {
        if ((!match.needsCtrl || (event.ctrlKey || event.metaKey)) &&
          (!match.needsShift || event.shiftKey)) {
          match.action();
          event.preventDefault();
          return;
        }
      }
    }
  }

  keyUp(event: KeyboardEvent) {

  }
}