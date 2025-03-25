class HierarchicalStoreNode {
  constructor(path, parent, data) {
    this.path = path;
    this.data = data;
    this.parent = parent;
    this.children = new Map();
  }

  remove() {
    if (this.parent) {
      this.parent.children.delete(this);

      if (!this.parent.children.size) {
        this.parent.remove();
      }
    }
  }
}

class HierarchicalStore {
  constructor(pathSeparator) {
    this._pathSeparator = pathSeparator;
    this._root = new HierarchicalStoreNode('', null, null);
  }

  getOrAddIfNotExist(path) {
    const pathSegments = path
      .split(this._pathSeparator)
      .filter((pathSegment) => pathSegment);

    let parent = null;
    let node = this._root;

    for (let i = 0; i < pathSegments.length; i++) {
      const pathSegment = pathSegments[i];
      const lastSegment = i === pathSegments.length - 1;

      if (!node.children.has(pathSegment)) {
        node.children.set(pathSegment, new HierarchicalStoreNode(pathSegment, node, null));
      }

      parent = node;
      node = node.children.get(pathSegment);

      if (lastSegment) {
        node.data = data;
      }
    }

    return node;
  }

  getNonEmptyAncestors(node) {
    const nonEmptyAncestors = [];

    let currentNode = node;

    while (currentNode.parent) {
      if (currentNode.parent.data) {
        nonEmptyAncestors.push(currentNode.parent);
      }

      currentNode = currentNode.parent;
    }

    return nonEmptyAncestors;
  }

  getNonEmptyDescendants(node) {
    const nonEmptyDescendants = [];

    for (const child of node.children) {
      if (child.data) {
        nonEmptyDescendants.push(child);
      }

      nonEmptyDescendants.push(...this.getNonEmptyDescendants(child));
    }

    return nonEmptyDescendants;
  }
}

module.exports = {
  HierarchicalStore,
};
