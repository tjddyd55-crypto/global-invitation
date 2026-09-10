# Coupon operations (invitation publish)

이 문서는 초대장 공개 결제에 붙는 쿠폰의 **운영 정책**과 체인이다. 구현 SSOT는 Backend `src/lib/coupons/*` + `src/lib/payments/*` 이다.

## Chain

```
validate (no hold, rate-limited)
  → quote (server recalculates from current sale price)
  → prepare (RESERVE + pending payment snapshot)
  → provider confirm / settle-zero
  → REDEEMED + PAID entitlement
  → publish (unpaid stays 402)
```

실패·만료·쿠폰 변경 시: pending CANCELED + reservation RELEASED.  
환불: payment REFUNDED, coupon **REDEEMED 유지** (재사용 금지).

## Pricing SSOT

- 상품 금액은 서버 `invitationPricing` 만 신뢰한다.
- Client `finalAmount` 는 쓰지 않는다. prepare/confirm 의 provider 청구액 = `chargedAmount` / final cents → Toss major units.
- Confirm 에서 amount / currency / coupon snapshot 불일치 → typed 실패, **PAID 없음**.

## Snapshot + pending policy

**Honor snapshot for the 24h pending window** (`PENDING_REUSE_WINDOW_MS`).

- prepare 시점의 coupon/payment snapshot 이 confirm 금액의 권위다.
- Confirm 은 live coupon ACTIVE/PAUSED 를 다시 보지 않는다.
- `reservationExpiresAt` = pending 만료. 만료분은 lazy cleanup (GET/prepare). 별도 cron 없음.
- Admin 이 쿠폰을 수정해도 기존 pending/paid/redemption snapshot 은 불변.

## Reservation limits

- `RESERVED` + `REDEEMED` 만 한도에 포함. `RELEASED` / 결제 CANCELED 는 제외.
- 동일 invitation + coupon + pricing 의 pending 은 재사용 (중복 클릭 idempotent).
- 쿠폰 변경/제거 시 기존 pending 취소 + reservation release 후 신규 prepare.

## $0 (DEVFREE100, Dev-only seed)

- prepare 후 `POST .../settle-zero`. provider(Toss) 호출 없음.
- Toss 미설정이어도 $0 정산은 가능하다.
- 동일 paymentId 재호출은 alreadyPaid. 이중 redeem 없음.

## Admin

- `/admin/payments?tab=coupons` — SUPER_ADMIN 생성/상태변경.
- 목록/상세: reserved / redeemed / 할인 합계. 사용 이력 페이지네이션.
- ACTIVE 경제 필드(할인·한도·기간) 수정은 일시중지 후. 사용 이력 있으면 코드 변경 금지.
- 결제 상세에 coupon 필드. 레거시 null-coupon 결제는 정상.
- 감사: `COUPON_CREATED` / `UPDATED` / `PAUSED` / `ACTIVATED` / `ARCHIVED`.

## Codes

- 저장: trim + UPPERCASE, `A-Z0-9-_` 4–32. unique (대소문자 무시 = 정규화로 보장).
- Public catalog 없음. validate 는 invitation 소유자만 (403). 추측 로그에 코드 기록 금지.

## Rate limit

validate: user + IP, production 8 / 5분, development 20 / 5분.

## Errors

사용자에게 stack / Prisma / raw env 를 보여주지 않는다.  
미설정 결제는 `PAYMENT_PROVIDER_NOT_CONFIGURED` | `PAYMENT_SERVICE_NOT_AVAILABLE` → **HTTP 503**.  
UI: “현재 해외 결제 서비스 준비 중입니다…” + 할인 견적 표시, 유료 CTA 비활성. $0 쿠폰 CTA 는 허용.

## Seed

`npm run coupons:seed-dev` (`JCI50`, `DEVFREE100`) — Development only. Production 금지.
