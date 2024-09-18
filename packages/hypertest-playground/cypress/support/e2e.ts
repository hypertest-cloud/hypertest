// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')
// --- this code has been temporary added only for hypertest package procedures ---
// const originalIt = it;
// type CustomIt = (param1: string, callback: () => void) => Mocha.Test | void

// const testCounter = {
//   value: 0
// }

// const customIt: CustomIt = (param1, callback) => {
//   const currentValue = testCounter.value
//   testCounter.value = testCounter.value + 1;

//   if (1 && 1 === currentValue) {
//     return originalIt(param1, callback)
//   }
// };

// (customIt as any).skip = () => {}

// it = customIt as Mocha.TestFunction

import * as fs from 'fs';
import * as path from 'path';

interface HypertestStorage {
  testIndex: number,
  testsCounter: number
}

function readHypertestStorage(): HypertestStorage | null {
  try {
    const fullPath = path.resolve('./hypertestStorage.json');
    console.log('fullPath: ' + fullPath)
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    console.log('fileContent: ' + fileContent)
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function saveHypertestStorage<T>(object: HypertestStorage): void {
  try {
      const jsonString = JSON.stringify(object, null, 2);
      const fullPath = path.resolve('./cypress/support/hypertestStorage.json');

      fs.writeFileSync(fullPath, jsonString, 'utf8');

    console.log(`Storage saved under ${fullPath}`);
  } catch (error: any) {
    console.error(`Error while saving the storage: ${error.message}`);
  }
}

// const hypertestStorage = readHypertestStorage();

// const fileIndex = parseInt(window.localStorage.getItem('index') || '0')
// window.localStorage.setItem('index', `${fileIndex + 1}`)

// if (fileIndex + 1 === 2) {
//   throw new Error('HERE: fileIndex + 1 === 3')
// }

// export const hypertestStorage = {
//   testIndex: 1,
//   testsCounter: 0
// }

// const originalIt = it;
// type CustomIt = (param1: string, callback: () => void) => Mocha.Test | void

// const customIt: CustomIt = (param1, callback) => {
//   const currentValue = hypertestStorage.testsCounter
//   hypertestStorage.testsCounter = hypertestStorage.testsCounter + 1;

//   if (hypertestStorage.testIndex === currentValue || param1 === 'hyperTestIt') {
//     return originalIt(param1, callback)
//   }
// };

// (customIt as any).skip = () => {}

// it = customIt as Mocha.TestFunction
