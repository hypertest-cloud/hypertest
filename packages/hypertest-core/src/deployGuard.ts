export const runWithDeployGuard = async (
  getCore: () => Promise<{ deploy: () => Promise<void> }>,
  onSetupFailure: () => void,
): Promise<void> => {
  let deployStarted = false;
  try {
    const core = await getCore();
    deployStarted = true;
    await core.deploy();
  } catch (err) {
    if (!deployStarted) onSetupFailure();
    throw err;
  }
};
