export type TossKeySafetyCode =
  | 'TOSS_KEY_MISMATCH'
  | 'TOSS_LIVE_KEY_FORBIDDEN_IN_TEST'
  | 'TOSS_TEST_KEY_FORBIDDEN_IN_PRODUCTION'
  | 'TOSS_LIVE_KEY_FORBIDDEN_IN_NON_PRODUCTION';

export class TossKeySafetyError extends Error {
  constructor(readonly code: TossKeySafetyCode) {
    super(code);
    this.name = 'TossKeySafetyError';
  }
}

/** Key prefixes must agree with each other, the active payment environment and deployment. */
export function assertTossKeySafety(
  clientKey: string,
  secretKey: string,
  environment: 'TEST' | 'LIVE',
  nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase()
): void {
  const clientTest = clientKey.startsWith('test_');
  const clientLive = clientKey.startsWith('live_');
  const secretTest = secretKey.startsWith('test_');
  const secretLive = secretKey.startsWith('live_');
  if ((clientTest && secretLive) || (clientLive && secretTest)) {
    throw new TossKeySafetyError('TOSS_KEY_MISMATCH');
  }
  if (nodeEnv !== 'production' && (clientLive || secretLive)) {
    throw new TossKeySafetyError('TOSS_LIVE_KEY_FORBIDDEN_IN_NON_PRODUCTION');
  }
  if (environment === 'TEST' && (clientLive || secretLive)) {
    throw new TossKeySafetyError('TOSS_LIVE_KEY_FORBIDDEN_IN_TEST');
  }
  if (environment === 'LIVE' && (clientTest || secretTest)) {
    throw new TossKeySafetyError('TOSS_TEST_KEY_FORBIDDEN_IN_PRODUCTION');
  }
}
