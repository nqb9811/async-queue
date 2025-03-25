type Executor = (resolve: (data: any) => void, reject: (error: any) => void) => void | Promise<void>;

export class AsyncQueue {
  process(executor: Executor): Promise<any>;
}

export class HierarchicalAsyncQueue {
  constructor(pathSeparator: string);
  process(path: string, executor: Executor): Promise<any>;
}
