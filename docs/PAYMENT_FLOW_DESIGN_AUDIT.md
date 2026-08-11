# Payment Flow Design Audit (Figma-first)

> **상태:** Figma UI 미리보기 완료 · **사용자 디자인 승인 대기**  
> **금지:** 승인 전 DB migration / provider SDK / webhook / Public gate 코드 적용  
> **범위:** development only · main/production 미반영

## 1. 현재 코드 감사 요약

| 항목 | 현황 |
|------|------|
| Branch | `chore/cleanup-legacy` |
| Invitation status | `DRAFT` \| `SHARED` \| `PUBLISHED` |
| 관련 필드 | `shareSlug?`, `isPublished`, `isPaid`, `canShare`, `paidAt?`, `publishedAt?` |
| shareSlug 생성 | `POST /api/invitations/:id/publish` 시점에 생성 |
| Public `/i/{slug}` | `status === PUBLISHED` 만 조회 (현재 `isPaid` 미검사) |
| Payment 테이블 | **없음** |
| Stripe/Lemon/Paddle 런타임 | stub / 문서 수준 (`payments.ts`, Lemon checklist) |
| Editor 발행 CTA | `완료하고 공개하기` / `공개하기` → 즉시 publish |

## 2. 제품 정책 (확정)

- 제작·Editor Preview·Template Preview: **무료**
- 외부 공개/공유 직전 결제
- 초대장 1개(`invitationId`)당 1회
- List **$30** / Promotion **$10** (USD cents: 3000 / 1000)
- 결제 후 동일 invitation 수정 시 재결제 없음
- 신규 invitation: 신규 결제

## 3. Figma

- File: https://www.figma.com/design/wzVSLwjMc2xn6spyuJytF4
- Page: **`06_PAYMENT`**
- Mobile SSOT: `PAYMENT_MOBILE_DEFAULT_390`
- Desktop SSOT: `PAYMENT_DESKTOP_DEFAULT`
- Price SSOT: 정상가 $30 / 오픈 할인 -$20 / 결제 $10
- Variant B (`PAYMENT_PROMO_VARIANT_B`)는 비교용 · 최종 SSOT 아님
- Provider 브랜드 CTA 문구 없음 (`$10 결제하고 발행하기`)
- **Payment CTA color SSOT (SaaS Primary):** `#4F46E5`  
  - Source: Editor `desktopPublish`, Auth/Main Create CTA, Figma Categories indigo frames, `marketingTokens --mk-primary`  
  - Hover reference: `giUi --gi-primary-hover` `#4a3fc4` (token) / common indigo-700 `#4338CA`  
  - Disabled: opacity `0.55` (`giUi.primaryButton:disabled`)  
  - Secondary: white + border (`giUi.secondaryButton`)  
  - **Not used for Payment actions:** Invitation Organization navy `#0B1F3A` / Figma `Brand/Primary` (renderer theme)  
  - Success/Failed semantic colors = status only; action buttons stay Primary/Secondary

## 4. 승인 후 2차 구현 계획 (미착수)

1. Pricing SSOT (`listPriceCents`, `promotionPriceCents`)
2. `InvitationPayment` (또는 동등) transaction table · 금액은 cents integer
3. Global provider 선정 (수수료·세금·지원국가 조사 후)
4. Checkout session + **server-side verification** + webhook idempotency
5. Invitation ↔ Payment 관계 · duplicate payment 방지
6. Public publish gate: Editor Preview는 free, Public은 paid+published
7. success/fail/cancel recovery · refund handling
8. development E2E · Railway env · main/production은 별도 승인

## 5. 아키텍처 불변식

```
provider verification / webhook
  → Backend Payment PAID
  → Invitation publish eligibility
  → Public /i/{shareSlug}
```

- frontend `paymentSuccess=true` 단독으로 Public 활성화 **금지**
- provider redirect 단독 PAID **금지**
- 외부 guest를 결제 페이지로 redirect **금지**

## 6. 중단 선언

Figma 결제 UI 미리보기 단계 완료.  
사용자 디자인 승인 대기 중이며, 결제 Backend/DB/provider/Public gate 구현은 아직 시작하지 않았습니다.
