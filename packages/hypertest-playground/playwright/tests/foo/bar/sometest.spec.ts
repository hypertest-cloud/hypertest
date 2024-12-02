import { test } from '@playwright/test';

test.describe('super nested desc', () => {
  test('super nested test2', () => {

  })

  const array = ['some1', 'some2']
  for (const param of array) {
    test(`for ${param}`, () => {

    })
  }

  array.forEach((param) => {
    test(`forEach ${param}`, () => {

    })
  })
})
