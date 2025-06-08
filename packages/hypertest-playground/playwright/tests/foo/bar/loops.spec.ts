import { expect, test } from '@playwright/test';

test.describe('loops', () => {
  const array = ['some1', 'some2'];
  for (const param of array) {
    test(`for ${param}`, () => {
      expect(true).toBe(true);
    });
  }

  test.describe('in nested describe', () => {
    // biome-ignore lint/complexity/noForEach: <explanation>
    array.forEach((param) => {
      test(`forEach ${param}`, () => {
        expect(true).toBe(true);
      });
    });
  });
});
