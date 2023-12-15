export class Queue<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  has(item: T): boolean {
    return this.items.includes(item);
  }

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  removeItem(item: T) {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}
