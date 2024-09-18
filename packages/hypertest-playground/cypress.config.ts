import { defineConfig } from "cypress";
import * as fs from 'fs';
import * as path from 'path';

interface HypertestStorage {
  testIndex: number,
  testsCounter: number
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

// if (!process.env.TEST_INDEX) {
//   throw new Error('Missing TEST_INDEX variable')
// }

// saveHypertestStorage({
//   testIndex: parseInt(process.env.TEST_INDEX),
//   testsCounter: 0
// });

// window.localStorage.setItem('someKey', '123')

let myVar = 0

const config = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        loguj(message) {
          console.log(message)
          return null
        },
        setMyVar: (value) => {
          console.log('setMyVar: ' + value)
          return (myVar = parseInt(value));
        },
        getMyVar: () => {
          return myVar;
        }
      })
    }
  },
});


export default config
