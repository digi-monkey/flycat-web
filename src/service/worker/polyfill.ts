// Adapted from https://github.com/okikio/sharedworker/blob/v1.0.4/src/index.ts, which is licensed under the MIT license.

/**
 * indicates if SharedWorker is supported, in the global scope
 */
export const SharedWorkerSupported = 'SharedWorker' in globalThis;

/**
 * A polyfill class for `SharedWorker`, it accepts a URL/string as well as any other options the spec. allows for `SharedWorker`. It supports all the same methods and properties as the original, except it adds compatibility methods and properties for older browsers that don't support `SharedWorker`, so, it can switch to normal `Workers` instead.
 */
export class SharedWorkerPolyfill
  implements SharedWorker, EventTarget, AbstractWorker
{
  /**
   * The actual worker that is used, depending on browser support it can be either a `SharedWorker` or a normal `Worker`.
   */
  public ActualWorker: SharedWorker | Worker;
  constructor() {
    if (SharedWorkerSupported) {
      this.ActualWorker = new SharedWorker(
        new URL('./worker0.ts', import.meta.url),
      );
    } else {
      this.ActualWorker = new Worker(new URL('./worker1.ts', import.meta.url));
    }
  }

  /**
   * An EventListener called when MessageEvent of type message is fired on the port—that is, when the port receives a message.
   */
  public get onmessage() {
    if (SharedWorkerSupported) {
      return (this.ActualWorker as SharedWorker)?.port.onmessage;
    } else {
      return (this.ActualWorker as Worker)
        .onmessage as unknown as MessagePort['onmessage'];
    }
  }

  public set onmessage(value: MessagePort['onmessage'] | Worker['onmessage']) {
    if (SharedWorkerSupported) {
      (this.ActualWorker as SharedWorker).port.onmessage =
        value as MessagePort['onmessage'];
    } else {
      (this.ActualWorker as Worker).onmessage = value as Worker['onmessage'];
    }
  }

  /**
   * An EventListener called when a MessageEvent of type MessageError is fired—that is, when it receives a message that cannot be deserialized.
   */
  public get onmessageerror() {
    if (SharedWorkerSupported) {
      return (this.ActualWorker as SharedWorker)?.port.onmessageerror;
    } else {
      return (this.ActualWorker as Worker).onmessageerror;
    }
  }

  public set onmessageerror(
    value: MessagePort['onmessageerror'] | Worker['onmessageerror'],
  ) {
    if (SharedWorkerSupported) {
      (this.ActualWorker as SharedWorker).port.onmessageerror =
        value as MessagePort['onmessageerror'];
    } else {
      (this.ActualWorker as Worker).onmessageerror =
        value as Worker['onmessageerror'];
    }
  }

  /**
   * Starts the sending of messages queued on the port (only needed when using EventTarget.addEventListener; it is implied when using MessagePort.onmessage.)
   */
  public start() {
    if (SharedWorkerSupported) {
      return (this.ActualWorker as SharedWorker)?.port.start();
    }
  }

  /**
   * Clones message and transmits it to worker's global environment. transfer can be passed as a list of objects that are to be transferred rather than cloned.
   */
  public postMessage(
    message: any,
    transfer?: Transferable[] | StructuredSerializeOptions,
  ) {
    if (SharedWorkerSupported) {
      return (this.ActualWorker as SharedWorker)?.port.postMessage(
        message,
        transfer as Transferable[],
      );
    } else {
      return (this.ActualWorker as Worker).postMessage(
        message,
        transfer as Transferable[],
      );
    }
  }

  /**
   * Immediately terminates the worker. This does not let worker finish its operations; it is halted at once. ServiceWorker instances do not support this method.
   */
  public terminate() {
    if (SharedWorkerSupported) {
      return (this.ActualWorker as SharedWorker)?.port.close();
    } else {
      return (this.ActualWorker as Worker).terminate();
    }
  }

  /**
   * Disconnects the port, so it is no longer active.
   */
  public close() {
    return this.terminate();
  }

  /**
   * Returns a MessagePort object used to communicate with and control the shared worker.
   */
  public get port() {
    return (
      SharedWorkerSupported
        ? (this.ActualWorker as SharedWorker).port
        : this.ActualWorker
    ) as MessagePort;
  }

  /**
   * Is an EventListener that is called whenever an ErrorEvent of type error event occurs.
   */
  public get onerror() {
    return this.ActualWorker.onerror as any;
  }

  public set onerror(value: (this: AbstractWorker, ev: ErrorEvent) => any) {
    this.ActualWorker.onerror = value;
  }

  /**
   * Registers an event handler of a specific event type on the EventTarget
   */
  public addEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  public addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  public addEventListener<K extends keyof MessagePortEventMap>(
    type: K,
    listener: (this: MessagePort, ev: MessagePortEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  public addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (SharedWorkerSupported && type !== 'error') {
      return (this.ActualWorker as SharedWorker)?.port.addEventListener(
        type,
        listener,
        options,
      );
    } else {
      return this.ActualWorker.addEventListener(type, listener, options);
    }
  }

  /**
   * Removes an event listener from the EventTarget.
   */
  public removeEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  public removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
  public removeEventListener<K extends keyof MessagePortEventMap>(
    type: K,
    listener: (this: MessagePort, ev: MessagePortEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  public removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    if (SharedWorkerSupported && type !== 'error') {
      return (this.ActualWorker as SharedWorker)?.port.removeEventListener(
        type,
        listener,
        options,
      );
    } else {
      return this.ActualWorker.removeEventListener(type, listener, options);
    }
  }

  /**
   * Dispatches an event to this EventTarget.
   */
  public dispatchEvent(event: Event) {
    return this.ActualWorker.dispatchEvent(event);
  }
}

export default SharedWorkerPolyfill;
