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
        node.children.set(pathSegment, new HierarchicalStoreNode(pathSegment, null));
      }

      parent = node;
      node = node.children.get(pathSegment);

      if (lastSegment) {
        node.data = data;
      }
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
}

module.exports = {
  HierarchicalStore,
};
