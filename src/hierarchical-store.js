class HierarchicalStoreNode {
  constructor(path, data) {
    this.path = path;
    this.data = data;
    this.children = new Map();
  }
}

class HierarchicalStore {
  constructor(pathSeparator) {
    this._pathSeparator = pathSeparator;
    this._root = new HierarchicalStoreNode('', null);
  }

  addIfNotExist(path, data) {
    const pathSegments = path
      .split(this._pathSeparator)
      .filter((pathSegment) => pathSegment);

    let parent = null;
    let node = this._root;

    for (let i = 0; i < pathSegments.length; i++) {
      const pathSegment = pathSegments[i];

      if (!node.children.has(pathSegment)) {
        node.children.set(pathSegment, new HierarchicalStoreNode(pathSegment, data));
      }

      parent = node;
      node = node.children.get(pathSegment);
    }

    const remove = () => {
      if (parent) {
        parent.children.delete(node.path);
      }
    };

    return {
      node,
      remove,
    };
  }

  lookup(path) {
    const pathSegments = path
      .split(this._pathSeparator)
      .filter((pathSegment) => pathSegment);

    let node = this._root;

    for (let i = 0; i < pathSegments.length; i++) {
      const pathSegment = pathSegments[i];

      if (!node.children.has(pathSegment)) {
        return null;
      }

      node = node.children.get(pathSegment);
    }

    return node;
  }

  remove(path) {
    const pathSegments = path
      .split(this._pathSeparator)
      .filter((pathSegment) => pathSegment);

    const stack = [];

    let node = this;

    for (let i = 0; i < pathSegments.length; i++) {
      const pathSegment = pathSegments[i];

      if (!node.children.has(pathSegment)) {
        return;
      }

      stack.push([node, pathSegment]);
      node = node.children.get(pathSegment);
    }

    while (stack.length) {
      const [parent, pathSegment] = stack.pop();

      parent.children.delete(pathSegment);

      if (parent.children.size) {
        break;
      };
    }
  }
}

module.exports = {
  HierarchicalStore,
};
