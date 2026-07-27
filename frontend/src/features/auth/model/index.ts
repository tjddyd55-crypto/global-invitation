export { useLoginForm } from './useLoginForm';
export type { UseLoginFormResult } from './useLoginForm';

export { useSignupForm, CREATOR_BENEFITS } from './useSignupForm';
export type { SignupRole, UseSignupFormResult, UseSignupFormOptions } from './useSignupForm';

export { useEmailAuthFlow } from './useEmailAuthFlow';
export type { UseEmailAuthFlowResult, EmailAuthStep } from './useEmailAuthFlow';

export { resolveAuthNextPath, DEFAULT_AUTH_NEXT_PATH } from './authNextPath';
export { useEmailStartForm } from './useEmailStartForm';
export type { UseEmailStartFormResult } from './useEmailStartForm';
export { useEmailVerifyForm, OTP_CODE_LENGTH, formatRemaining } from './useEmailVerifyForm';
export type { UseEmailVerifyFormResult } from './useEmailVerifyForm';

export { buildAdminIdCandidates, tryAdminLoginFallback } from './adminFallback';
