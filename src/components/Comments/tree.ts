export class TreeNode<T> {
  value: T;
  parent: TreeNode<T> | null;
  children: TreeNode<T>[];

  constructor(value: T) {
    this.value = value;
    this.parent = null;
    this.children = [];
  }

  addChild(child: TreeNode<T>): void {
    child.parent = this;
    this.children.push(child);
  }

  removeChild(child: TreeNode<T>): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      child.parent = null;
      this.children.splice(index, 1);
    }
  }
}
