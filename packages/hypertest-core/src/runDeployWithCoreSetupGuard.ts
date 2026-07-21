interface DeployGuardProps {
  setupCoreHandler: () => Promise<{ deploy: () => Promise<void> }>;
  onSetupFailure: () => void;
}

export const runDeployWithCoreSetupGuard = async ({
  setupCoreHandler,
  onSetupFailure,
}: DeployGuardProps): Promise<void> => {
  let deployStarted = false;
  try {
    const core = await setupCoreHandler();
    deployStarted = true;
    await core.deploy();
  } catch (err) {
    if (!deployStarted) onSetupFailure();
    throw err;
  }
};
