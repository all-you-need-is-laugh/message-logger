import deferred from './deferred';

interface InterceptableMock<T = any, Y extends any[] = any> extends jest.Mock<T, Y> {
  deferredExecutionPromise: Promise<{ args: unknown[], proceed: (value: unknown) => void }>
}
// TODO: add types here
const intercept = (original) => {
  const deferredStart = deferred();
  const deferredExecution = deferred();
  const mock = jest.fn().mockImplementation(async (...args: unknown[]) => {
    deferredStart.resolve(args);
    await deferredExecution.promise;

    return original(...args);
  }) as InterceptableMock<any, any>;

  mock.deferredExecutionPromise = deferredStart.promise
    .then((args) => ({
      args: args as unknown[],
      proceed: deferredExecution.resolve
    }));

  return mock;
};

export default intercept;
