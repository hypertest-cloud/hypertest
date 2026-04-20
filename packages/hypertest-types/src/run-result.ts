export interface HypertestTestResult {
  testId: string;
  name: string;
  filePath: string;
  status: 'success' | 'failed' | 'skipped';
  startDate: string;
  endDate: string;
  duration: number; // in ms
  error?: {
    message: string;
    stackTrace?: string;
  };
}

export interface HypertestRunResult {
  runId: string;
  startDate: string;
  endDate: string;
  duration: number; // in ms
  tests: {
    total: number;
    success: number;
    skipped: number;
    failed: number;
  };
  results: HypertestTestResult[];
}
