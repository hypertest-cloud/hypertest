import fs from 'fs'
import { v1 } from 'uuid'
import { HYPERTEST_FILE_MODIFICATION_SEPARATOR } from './constant.js'
import { CypressPluginOptions } from './types.js'

const loggerCustomName = `logHypertest${v1().slice(0, 4)}`

const getModifiedE2EData = (data: string, loggerName: string) => `${data}
${HYPERTEST_FILE_MODIFICATION_SEPARATOR}
const originalIt = it;
type CustomIt = (param1: string, callback: () => void) => Mocha.Test | void

const testCounter = {
  value: 0
}

const customIt: CustomIt = (param1, callback) => {
  if (process.env.TEST_INDEX && parseInt(process.env.TEST_INDEX) === testCounter.value) {
    return originalIt(param1, callback)
  }

  testCounter.value = testCounter.value + 1;
};

(customIt as any).skip = () => {}

it = customIt as Mocha.TestFunction`


// const originalIt = it;
// type CustomIt = (...args: [string]) => Mocha.Test

// const testCounter = {
//   value: 0
// }

// const customIt: CustomIt = (param1, callback) => {
//   if (2 === testCounter.value) {
//     originalIt(param1, callback)
//   }

//   testCounter.value = testCounter.value + 1;
// }

// it.skip = () => {}

// it = customIt as Mocha.TestFunction


const getE2eFilePath = (options: CypressPluginOptions) => `${options.projectPath}//cypress//support//e2e.ts`

export const overrideItCallback = (options: CypressPluginOptions) => new Promise<void>((resolve, reject) => {
  const e2eFilePath = getE2eFilePath(options)

  fs.readFile(e2eFilePath, 'utf8', (error, data) => {
    if (error) {
      reject(`Failed to get e2e file: ${error}`)
    }
    if (data.includes(HYPERTEST_FILE_MODIFICATION_SEPARATOR)) {
      console.log('E2e file is already modified')
      resolve()
    }

    const modifiedData = getModifiedE2EData(data, loggerCustomName)

    fs.writeFile(e2eFilePath, modifiedData, 'utf8', (err) => {
      if (error) {
        reject(`Failed to modify e2e file: ${error}`)
      }
      resolve()
    });
  });
})
