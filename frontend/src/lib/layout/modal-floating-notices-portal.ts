/** Mount target for bottom floating notices while a modal dialog is open. */

type Listener = (target: HTMLElement | null) => void;

let target: HTMLElement | null = null;
const listeners = new Set<Listener>();

export function setModalFloatingNoticesTarget(element: HTMLElement | null): void {
  target = element;
  for (const listener of listeners) {
    listener(target);
  }
}

export function getModalFloatingNoticesTarget(): HTMLElement | null {
  return target;
}

export function subscribeModalFloatingNoticesTarget(listener: Listener): () => void {
  listeners.add(listener);
  listener(target);
  return () => {
    listeners.delete(listener);
  };
}
