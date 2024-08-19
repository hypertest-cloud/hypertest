# hypertest-playground

_Space to play and test all our solutions together, in safe and controlled environment._

## Tests order verification

To verify deterministic order of tests, we've run hundreds of tests with random length and verify if they are always in the same order in tens of runs.

To run that experiment, you need to build `scripts/run.ts` file and run it:

```bash
npm run build
npm run test:run
```

If you want to increase number of times you want to run generated batch set, pass `--times` flag to the script:

```bash
npm run test:run -- --times 3
```
