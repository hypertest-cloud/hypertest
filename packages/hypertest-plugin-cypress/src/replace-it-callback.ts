import fs from 'fs'
import path from 'path'
import { v1 } from 'uuid'
import { HYPERTEST_FILE_MODIFICATION_SEPARATOR } from './constant.js'
import { CypressPluginOptions } from './types.js'

const getModifiedE2EData = (data: string, loggerName: string) => `${data}
${HYPERTEST_FILE_MODIFICATION_SEPARATOR}
const originalIt = it;
type CustomIt = (...args: [string]) => Mocha.Test

const customIt: CustomIt = (param1) => originalIt(param1, () => {
  cy.task('${loggerName}', JSON.stringify(this))
  cy.task('${loggerName}', 'Hypertest-Counter')
})

//@ts-ignore
customIt.skip = (param1) => {
  originalIt(param1, () => {
    cy.task('${loggerName}', 'Hypertest-Skipped-Counter')
  })
}

it = customIt as Mocha.TestFunction`

const getE2eFilePath = (options: CypressPluginOptions) => `${options.projectPath}//cypress//support//e2e.ts`

const loggerCustomName = `logHypertest${v1()}`

export const overrideItCallback = (options: CypressPluginOptions) => new Promise<void>((resolve, reject) => {
  const e2eFilePath = getE2eFilePath(options)

  fs.readFile(e2eFilePath, 'utf8', (error, data) => {
    if (error) {
      reject(`Failed to get e2e file: ${error}`)
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

export const removeItCallbackOverride = (options: { projectPath: string }) => new Promise<void>((resolve, reject) => {
  const e2eFilePath = getE2eFilePath(options)

  fs.readFile(e2eFilePath, 'utf8', (error, modifiedData) => {
    if (error) {
      reject(`Failed to get e2e file: ${error}`)
    }

    const separatorIndex = modifiedData.lastIndexOf(HYPERTEST_FILE_MODIFICATION_SEPARATOR);
    if (separatorIndex === -1) {
      console.log('No modification founded')

      return resolve();
    }

    const modificationRemovedData = modifiedData.substring(0, separatorIndex).trim();

    fs.writeFile(e2eFilePath, modificationRemovedData, 'utf8', (err) => {
      if (error) {
        reject(`Failed to remove modification e2e file: ${error}`)
      }
      resolve()
    });
  });
})
