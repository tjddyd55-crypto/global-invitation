# Native Store Readiness

Native app implementation (`apps/native`) is separate from App Store / Play Store release.

## Payment policy

- Digital invitation publishing may require **Apple IAP** or **Google Play Billing** depending on jurisdiction and product classification.
- Current web Toss checkout is **not** wired as live native in-app charge.
- Native `NATIVE_PAYMENT_MODE` defaults to policy-blocked UI until legal review.

## Live payment

- Toss international USD approval: **BLOCKED_PENDING_TOSS_OVERSEAS_APPROVAL**
- Native must not perform live charges without store policy sign-off.

## Account deletion

- Self-service account deletion: audit `STORE_READINESS_GAP` if not present in backend.

## Privacy & support

- Privacy policy URL, terms, support email (`frontend/src/shared/marketing/supportContact.ts`) required before store submission.

## Maps

- Google/Naver **native SDK credentials** may differ from web API keys; register Android/iOS app IDs separately.
