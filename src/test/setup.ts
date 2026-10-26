import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Les tests tournent en parallèle : sous charge, une requête IndexedDB peut dépasser 1 s
configure({ asyncUtilTimeout: 3000 });

// jsdom n'implémente pas le défilement
window.scrollTo = () => undefined;

// jsdom n'implémente pas <dialog>.showModal / close
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
}
