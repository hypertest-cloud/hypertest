import pLimit from 'p-limit';

export const promiseMap = async <T, R>(
  values: Iterable<T> | AsyncIterable<T>,
  iterator: (value: T, index: number) => Promise<R>,
  options: {
    concurrency?: number;
  } = {},
): Promise<R[]> => {
  const { concurrency = 1 } = options;
  const limit = pLimit(concurrency);

  const promises: Promise<R>[] = [];

  let index = 0;
  for await (const value of values) {
    const currentIndex = index++;
    promises.push(limit(() => iterator(value, currentIndex)));
  }

  return Promise.all(promises);
};
