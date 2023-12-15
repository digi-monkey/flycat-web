export class Pool<T> {
  private items: T[];
  private itemSet: Set<T>;
  private maxCapacity: number;

  constructor(maxCapacity: number) {
    this.items = [];
    this.itemSet = new Set();
    this.maxCapacity = maxCapacity;
  }

  addItem(item: T): void {
    if (this.items.length < this.maxCapacity && !this.itemSet.has(item)) {
      this.items.push(item);
      this.itemSet.add(item);
    }
  }

  removeItem(item: T): boolean {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.itemSet.delete(item);
      return true;
    }
    return false;
  }

  isFull(): boolean {
    return this.items.length >= this.maxCapacity;
  }

  has(item: T): boolean {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      return true;
    }
    return false;
  }

  getSize(): number {
    return this.items.length;
  }

  getItem(index: number): T | undefined {
    return this.items[index];
  }

  getItems(): T[] {
    return this.items.slice();
  }
}
