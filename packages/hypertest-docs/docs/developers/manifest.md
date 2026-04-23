# Manifest

This document outlines the purpose, mechanics, and structure of the library's manifest file.

## Why do we need a manifest file?

**Context:** During a typical development cycle, a developer might deploy an image to the cloud but continue making changes to their local environment day-to-day. If we were to build the runtime context dynamically during the invocation phase, it would rely on the current local state rather than the deployed state. This creates a critical inconsistency between the local code and the cloud deployment, which can lead to execution errors—such as attempting to call non-existent tests or failing to trigger tests that should run.

**The Solution:** We introduced a manifest file to serve as a fixed "source of truth". The manifest freezes the required context and state at the exact moment of deployment, ensuring that the cloud deployment and the execution context remain perfectly synchronized.

**Consequences:**
* **Guarantees Consistency:** Completely prevents environmental drift between the local workspace and the cloud.
* **Reliable Invocation:** Ensures the `invoke` phase always operates on predictable parameters, eliminating the risk of test execution mismatches.
* *Trade-off:* Adds a slight overhead to the deployment process, as the manifest state must be generated and maintained alongside the code.

## How it Works: State & Consistency Checks

To guarantee that the execution context matches the deployed code, the manifest tracks the state of the tests and the deployment environment:

* **Directory Hashing:** The manifest generates and stores a hash based on the contents of the test directory at the time of deployment.
* **Image Digest Comparison:** When attempting to use the manifest (via the `invoke` method), the application compares the image digest recorded in the manifest with the image digest of the currently deployed cloud function.
* **Validation Flow:** Using the directory hash and the image digest, the application flow checks whether current local changes and the deployment target are consistent with what has been pushed to the cloud (i.e., the exact code that is scheduled to be run).

### Handling Inconsistencies

The system's response can be configured in the event that the application detects an inconsistency (e.g., a mismatch between the local test directory hash and the manifest's deployed hash). Developers are able to configure the application to do one of the following in the event of a mismatch:
* `silence` - Remain silent, ignore the mismatch,
* `warning` - Display a warning, notify the user, but continue,
* `error` - Throw an error and stop execution.

## Configuration and Naming

The name of the generated manifest file is customizable via the `buildManifestFileName` variable.

* **Default:** `hypertest.manifest`
* **Recommendation:** If you choose to customize the filename, it is highly recommended to follow a convention that includes `.manifest` (e.g., `custom-name.manifest`) to clearly identify its purpose within the project.

## Example Manifest Structure

```json
{
  "imageDigest": "sha256:77fe3a37721a5d5bd20d0cafe6946c5980201a8975b70dfba56a83d4e488e13b",
  "testDirHash": "74811828510f638d62d67d9bca795862010f05b52ef0e8ec9623c9697b318f26",
  "invokePayloadContexts": [
    {
      "grep": "^chromium foo/playwright\\\\x2dweb\\\\.spec\\\\.ts get started link$"
    }
    {
      "grep": "^chromium foo/bar/loops\\\\.spec\\\\.ts element1$"
    },
    {
      "grep": "^chromium foo/bar/loops\\\\.spec\\\\.ts element2$"
    },
    ...
  ],
}

