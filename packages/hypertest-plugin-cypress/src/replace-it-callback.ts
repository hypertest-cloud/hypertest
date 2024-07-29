import fs from 'fs'
import { v1 } from 'uuid'
import { CUSTOM_LOGGER_CONFIG_BEGIN_MARK, CUSTOM_LOGGER_CONFIG_END_MARK, HYPERTEST_FILE_MODIFICATION_SEPARATOR, SKIPPED_TEST_COUNTER_MARK } from './constant.js'
import { CypressPluginOptions } from './types.js'

const loggerCustomName = `logHypertest${v1().slice(0, 4)}`

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
    cy.task('${loggerName}', '${SKIPPED_TEST_COUNTER_MARK}')
  })
}

it = customIt as Mocha.TestFunction`

const getModifiedConfigurationData = (data: string, loggerName: string) => {
  const index = data.indexOf('setupNodeEvents(');
  if (index === -1) {
    throw new Error('Missing setupNodeEvents in cypress config')
  }

  const openingBraceIndex = data.indexOf('{', index);
  if (openingBraceIndex === -1) {
      throw new Error('Opening bracket missing');
  }

  const modifiedCode = `${data.slice(0, openingBraceIndex + 1)}
${CUSTOM_LOGGER_CONFIG_BEGIN_MARK}
      on('task', {
        ${loggerName}(message) {
          console.log(message)
          return null
        },
      })
${CUSTOM_LOGGER_CONFIG_END_MARK}
${data.slice(openingBraceIndex + 1)}`;

  return modifiedCode
}

const getE2eFilePath = (options: CypressPluginOptions) => `${options.projectPath}//cypress//support//e2e.ts`
const getConfigFilePath = (options: CypressPluginOptions) => `${options.projectPath}//cypress.config.ts`

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

  const configFilePath = getConfigFilePath(options)

  fs.readFile(configFilePath, 'utf8', (error, data) => {
    if (error) {
      reject(`Failed to get cypress config file: ${error}`)
    }
    const modifiedData = getModifiedConfigurationData(data, loggerCustomName)

    fs.writeFile(configFilePath, modifiedData, 'utf8', (err) => {
      if (error) {
        reject(`Failed to modify cypress config file: ${error}`)
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

  const configFilePath = getConfigFilePath(options)

  fs.readFile(configFilePath, 'utf8', (error, modifiedData) => {
    if (error) {
      reject(`Failed to get cypress config file: ${error}`)
    }

    const startIndex = modifiedData.indexOf(CUSTOM_LOGGER_CONFIG_BEGIN_MARK);
    if (startIndex === -1) {
      throw reject("Config modification start mark is missing");
    }
    const endIndex = modifiedData.indexOf(CUSTOM_LOGGER_CONFIG_END_MARK, startIndex);
    if (endIndex === -1) {
        throw new Error("Config modification end mark is missing");
    }

    const beforeInsertedCode = modifiedData.slice(0, startIndex).trimEnd();
    const afterInsertedCode = modifiedData.slice(endIndex + CUSTOM_LOGGER_CONFIG_END_MARK.length).trimStart();

    const modificationRemovedData = beforeInsertedCode + afterInsertedCode;

    fs.writeFile(configFilePath, modificationRemovedData, 'utf8', (err) => {
      if (error) {
        reject(`Failed to remove modification cypress config file: ${error}`)
      }
      resolve()
    });
  });
})
