type Executor = (resolve: (data: any) => void, reject: (error: any) => void) => void | Promise<void>;

export class AsyncQueue {
  process(executor: Executor): {
    promise: Promise<any>;
    abort: () => void;
  };
}

export class HierarchicalAsyncQueue {
  constructor(pathSeparator: string);
  process(path: string, executor: Executor): {
    promise: Promise<any>;
    abort: () => void;
  };
}
