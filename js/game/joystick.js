/**
 * joystick.js
 * Mobile Virtual D-Pad and Action Button [A]
 * Plus keyboard fallback for desktop testing (Arrow keys / WASD / Space)
 */

export class VirtualControls {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      action: false
    };

    this.onActionPress = null;
    this.initKeyboard();
  }

  initKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) this.keys.up = true;
      if (["ArrowDown", "KeyS"].includes(e.code)) this.keys.down = true;
      if (["ArrowLeft", "KeyA"].includes(e.code)) this.keys.left = true;
      if (["ArrowRight", "KeyD"].includes(e.code)) this.keys.right = true;
      if (["Space", "KeyE", "Enter"].includes(e.code)) {
        this.keys.action = true;
        if (this.onActionPress) this.onActionPress();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) this.keys.up = false;
      if (["ArrowDown", "KeyS"].includes(e.code)) this.keys.down = false;
      if (["ArrowLeft", "KeyA"].includes(e.code)) this.keys.left = false;
      if (["ArrowRight", "KeyD"].includes(e.code)) this.keys.right = false;
      if (["Space", "KeyE", "Enter"].includes(e.code)) this.keys.action = false;
    });
  }

  // Bind on-screen HTML touch buttons
  bindTouchButtons(dpadElements, actionBtnElement) {
    const bindDirection = (element, direction) => {
      if (!element) return;
      const start = (e) => {
        e.preventDefault();
        this.keys[direction] = true;
        element.classList.add("btn-pressed");
      };
      const end = (e) => {
        e.preventDefault();
        this.keys[direction] = false;
        element.classList.remove("btn-pressed");
      };
      element.addEventListener("touchstart", start, { passive: false });
      element.addEventListener("touchend", end, { passive: false });
      element.addEventListener("mousedown", start);
      element.addEventListener("mouseup", end);
      element.addEventListener("mouseleave", end);
    };

    if (dpadElements.up) bindDirection(dpadElements.up, "up");
    if (dpadElements.down) bindDirection(dpadElements.down, "down");
    if (dpadElements.left) bindDirection(dpadElements.left, "left");
    if (dpadElements.right) bindDirection(dpadElements.right, "right");

    if (actionBtnElement) {
      const triggerAction = (e) => {
        e.preventDefault();
        this.keys.action = true;
        actionBtnElement.classList.add("btn-pressed");
        if (this.onActionPress) this.onActionPress();
        setTimeout(() => {
          this.keys.action = false;
          actionBtnElement.classList.remove("btn-pressed");
        }, 150);
      };
      actionBtnElement.addEventListener("touchstart", triggerAction, { passive: false });
      actionBtnElement.addEventListener("mousedown", triggerAction);
    }
  }

  getState() {
    return this.keys;
  }
}
