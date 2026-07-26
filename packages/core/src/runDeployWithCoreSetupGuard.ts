interface RunDeployWithCoreSetupGuardProps {
  setupCoreHandler: () => Promise<{ deploy: () => Promise<void> }>;
  onSetupFailure: () => void;
}

/**
 * Runs setup and deploy while distinguishing between the two failure modes:
 * if setup throws (before deploy starts), `onSetupFailure` is called so the
 * caller can clean up pre-deploy state (e.g. abort a mounted UI); if deploy
 * itself throws, `onSetupFailure` is intentionally skipped. The error is
 * always re-thrown so the caller can set the process exit code.
 */
export const runDeployWithCoreSetupGuard = async ({
  setupCoreHandler,
  onSetupFailure,
}: RunDeployWithCoreSetupGuardProps): Promise<void> => {
  let deployStarted = false;
  try {
    const core = await setupCoreHandler();
    deployStarted = true;
    await core.deploy();
  } catch (err) {
    if (!deployStarted) {
      onSetupFailure();
    }
    throw err;
  }
};
