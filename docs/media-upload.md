# Media Upload (Cloudflare R2)

## 목표 구조

- 프론트엔드 -> `POST /api/media/presign`
- 브라우저 -> presigned URL로 R2 직접 `PUT`
- 프론트엔드 -> `POST /api/media/confirm`
- 서버 -> `media_files` 저장 + invitation/template 참조 갱신
- 화면 렌더링 -> `publicUrl`만 사용

`presigned URL`은 업로드 전용이며, 화면 렌더링에 사용하지 않습니다.
Frontend는 `environment`/`invitation/` 경로를 조합하지 않고 Backend 응답(`objectKey`, `publicUrl`)만 저장합니다.

## Object key SSOT (Global Invitation)

버킷: `platform-assets`  
프로젝트 root: `invitation`  
환경: `development` | `production` (서버에서만 결정)

### 신규 canonical — 사용자 업로드

```
invitation/{environment}/users/{userId}/invitations/{invitationId}/{assetScope}/{uuid}.{ext}
```

예:

```
invitation/development/users/{userId}/invitations/{invitationId}/gallery/{uuid}.jpg
invitation/development/users/{userId}/invitations/{invitationId}/hero/{uuid}.webp
invitation/development/users/{userId}/invitations/{invitationId}/couple/groom/{uuid}.jpg
invitation/development/users/{userId}/invitations/{invitationId}/couple/bride/{uuid}.jpg
invitation/development/users/{userId}/invitations/{invitationId}/music/{uuid}.mp3
invitation/production/users/{userId}/invitations/{invitationId}/gallery/{uuid}.jpg
```

### Shared (environment 없음)

```
invitation/shared/images/{concept}/...
invitation/shared/music/{concept}/...
```

`concept`: `wedding` | `funeral` | `general` | `common`  
금지: `invitation/development/shared/...`, `invitation/production/shared/...`

### Temp

```
invitation/{environment}/temp/{userId}/{uploadId}/{uuid}.{ext}
```

### Legacy 호환 (읽기·삭제만)

기존 잘못 조합된 경로:

```
development/invitation/users/{userId}/invitations/{invitationId}/...
```

- 신규 업로드는 canonical만 생성한다.
- 기존 object / `dataJson` URL은 일괄 이동·자동 변경하지 않는다.
- parser는 canonical + legacy를 모두 허용한다.

## 필수 환경 변수 (Backend)

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=platform-assets
R2_PUBLIC_BASE_URL=https://pub-xxxxxxxx.r2.dev
R2_REGION=auto
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com

# Global Invitation 전용 (사용자/shared/temp 키). R2_KEY_PREFIX 와 분리.
INVITATION_R2_ROOT_PREFIX=invitation
INVITATION_ASSET_ENVIRONMENT=development
```

`INVITATION_ASSET_ENVIRONMENT` 우선순위:

1. `INVITATION_ASSET_ENVIRONMENT`
2. `RAILWAY_ENVIRONMENT_NAME`
3. `NODE_ENV` fallback

금지: Frontend가 environment를 보내게 함, client body의 environment 신뢰, hostname 파싱으로 environment 판단.

`R2_KEY_PREFIX`는 Invitation 사용자 자산 builder에서 사용하지 않습니다.
다른 서비스가 같은 변수를 쓰면 전역 삭제는 하지 말고 Invitation builder만 분리합니다.

커스텀 CDN 도메인이 있으면 `R2_PUBLIC_BASE_URL=https://cdn.example.com` 형태로 사용합니다.
호환성용으로 `R2_PUBLIC_URL`도 읽지만 신규 설정은 `R2_PUBLIC_BASE_URL`을 사용합니다.

## 선택 환경 변수 (Frontend)

```env
NEXT_PUBLIC_MEDIA_BASE_URL=https://pub-xxxxxxxx.r2.dev
```

프론트는 가능하면 직접 조합하지 말고 API 응답의 `publicUrl`을 그대로 렌더링합니다.

## R2 CORS 권장 설정

브라우저 PUT은 Express CORS가 아니라 **버킷 CORS**가 필요합니다.
`platform-assets` 버킷에 아래를 Cloudflare Dashboard → R2 → Settings → CORS 에 적용합니다.
(API 토큰에 `PutBucketCors` 권한이 없으면 Access Denied — Dashboard에서 적용)

```json
[
  {
    "AllowedOrigins": [
      "https://frontend-development-1b8a.up.railway.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

스크립트(권한 있을 때): `cd backend && railway run -s Backend -e development -- npx tsx scripts/apply-r2-cors.ts`

Production origin은 운영 배포 직전에 별도 추가합니다.

## 캐시 전략

- 객체 업로드 시 `Cache-Control: public, max-age=31536000, immutable`
- 이미지 교체는 덮어쓰기 대신 **새 object key 발급**
- 기본적으로 query cache-busting 없이 최신 이미지 반영 가능

## API 요약

### `POST /api/media/presign`

요청 예:

```json
{
  "scope": "invitationHero",
  "invitationId": "uuid-or-slug",
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "size": 123456
}
```

응답 예 (development):

```json
{
  "objectKey": "invitation/development/users/{userId}/invitations/{invitationId}/hero/{uuid}.jpg",
  "stagingObjectKey": "invitation/development/temp/{userId}/{uploadId}/{uuid}.jpg",
  "uploadUrl": "https://...",
  "publicUrl": "https://cdn.example.com/invitation/development/users/.../hero/{uuid}.jpg",
  "expiresIn": 3600
}
```

presign의 최종 `objectKey`는 반드시 `invitation/{environment}/users/` 로 시작합니다.
`development/invitation/...` 형태는 신규 생성하지 않습니다.

### `POST /api/media/confirm`

요청 예:

```json
{
  "objectKey": "invitation/development/users/{userId}/invitations/{invitationId}/hero/{uuid}.jpg",
  "publicUrl": "https://cdn.example.com/invitation/development/users/.../hero/{uuid}.jpg",
  "contentType": "image/jpeg",
  "size": 123456,
  "usage": "INVITATION_HERO",
  "invitationId": "{invitationId}"
}
```

처리:

- canonical / legacy object key parse
- owner / invitationId 검증
- shared 업로드·삭제 거부
- R2 `HeadObject` 존재 확인
- `media_files` 저장
- 대표 이미지 참조(Invitation/Template) 갱신

## 삭제 / orphan 정책

- 빈 갤러리 항목(URL·objectKey 없음)은 local-only 제거한다.
- 정상 legacy / canonical object는 owner 검증 후 삭제 가능하다.
- shared/`invitation/shared/**` 경로는 일반 사용자 업로드·삭제 대상이 아니다.
- 저장 후에도 이전 object는 orphan 이 될 수 있으며, 주기적 cleanup 또는 수동 purge로 정리한다.
- 기존 R2 object를 일괄 이동하지 않는다.
