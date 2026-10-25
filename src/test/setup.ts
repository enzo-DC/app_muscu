import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';

// jsdom n'implémente pas <dialog>.showModal / close
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
}
