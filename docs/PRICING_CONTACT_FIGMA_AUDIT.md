# Pricing / Contact SaaS Redesign Audit (Figma-first)

> **상태:** Figma 최신안 완료 · **사용자 디자인 승인 대기**  
> **금지:** 승인 전 `/pricing`·`/contact` runtime 변경, Payment Backend, DB, provider  
> **범위:** development 설계만 · main/production 미반영

## 1. 현재 코드 감사

| 항목 | 현황 |
|------|------|
| Branch / HEAD | `chore/cleanup-legacy` |
| Pricing route | `frontend/app/pricing/page.tsx` |
| Contact route | `frontend/app/contact/page.tsx` |
| Layout | `MarketingLayout` + `GlobalHeader` |
| Styles | **Legacy** `MarketingContent.module.css` (designTokens/giUi/mk 미사용) |
| Pricing UI | Free / Self Basic / Self Plus **3카드** · **금액 미표시** · CTA 없음 |
| Contact UI | 제목 + subtitle + **mailto만** · **폼/API 없음** |
| Support email | `tjddyd55@gmail.com` (하드코딩) |

## 2. SaaS SSOT (적용)

Source: `frontend/src/features/marketing/tokens/marketingTokens.css`

| Token | Value |
|-------|-------|
| Primary | `#4F46E5` |
| Primary Hover | `#4338CA` |
| Primary Soft | `#EEF2FF` |
| Background | `#F7F3EC` |
| Card | `#FFFFFF` |
| Border | `#E5E1D8` |
| Text | `#1F2937` / muted `#6B7280` |
| Card radius | 20 |
| Button radius | 14 · height 52 |

Payment CTA와 동일 Primary. Invitation navy `#0B1F3A` 미사용.

## 3. Figma

- File: https://www.figma.com/design/wzVSLwjMc2xn6spyuJytF4
- Page: **`07_PRICING_CONTACT`** (`28:2`)
- **`06_PAYMENT` 변경 없음**

### Pricing frames

| Frame | Node |
|-------|------|
| PRICING_MOBILE_390_SSOT | `28:3` |
| PRICING_MOBILE_360 | `28:72` |
| PRICING_MOBILE_430 | `28:141` |
| PRICING_LONG_DATA_QA | `28:210` |
| PRICING_DESKTOP_1280 | `29:2` |

정책: 정상가 **$30** · 오픈가 **$10** · 초대장 1개·1회 · CTA **무료로 초대장 만들기**

### Contact frames

| Frame | Node |
|-------|------|
| CONTACT_MOBILE_390_SSOT | `29:29` |
| CONTACT_MOBILE_360 | `29:46` |
| CONTACT_MOBILE_430 | `29:63` |
| CONTACT_DESKTOP_1280 | `29:153` |
| CONTACT_LOADING | `29:80` |
| CONTACT_SUCCESS | `29:96` |
| CONTACT_ERROR | `29:114` |
| CONTACT_LONG_DATA_QA | `29:134` |

Contract: **mailto only** (폼 필드 미발명). Loading/Success/Error = 메일 앱 오픈 상태.

## 4. 승인 후 구현 계획 (미착수)

1. Pricing frontend → Figma · Pricing SSOT ($30/$10) · CTA → create  
2. Contact frontend → Figma · mailto contract 유지 · Input/Button SSOT  
3. development 배포 · QA · Payment/Pricing price parity  
4. 이후 Payment Backend (기존 계획)

## 5. 중단 선언

Pricing / Contact 최신 SaaS Figma 설계 완료.  
사용자 디자인 승인 대기 중이며, 실제 `/pricing`, `/contact` frontend 변경은 아직 시작하지 않았습니다.
