export class Queue<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  has(item: T): boolean{
    return this.items.includes(item);
  }

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}
