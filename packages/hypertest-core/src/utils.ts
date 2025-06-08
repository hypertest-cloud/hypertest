import pLimit from 'p-limit';

/**
 * Asynchronously maps over an iterable or async iterable, applying the provided async iterator function to each item,
 * with optional concurrency control.
 *
 * @template T The type of elements in the input iterable.
 * @template R The type of elements in the resulting array.
 * @param values An iterable or async iterable of values to process.
 * @param iterator An async function that receives each value and its index, returning a Promise of the mapped result.
 * @param options Optional settings.
 * @param options.concurrency The maximum number of concurrent async operations. Defaults to 1.
 * @returns A Promise that resolves to an array of results, in the same order as the input.
 */
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
