# Media Upload (Cloudflare R2)

## 목표 구조

- 프론트엔드 -> `POST /api/media/presign`
- 브라우저 -> presigned URL로 R2 직접 `PUT`
- 프론트엔드 -> `POST /api/media/confirm`
- 서버 -> `media_files` 저장 + invitation/template 참조 갱신
- 화면 렌더링 -> `publicUrl`만 사용

`presigned URL`은 업로드 전용이며, 화면 렌더링에 사용하지 않습니다.

## 필수 환경 변수 (Backend)

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=invitation-media
R2_PUBLIC_BASE_URL=https://pub-xxxxxxxx.r2.dev
R2_REGION=auto
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
```

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

응답 예:

```json
{
  "objectKey": "invitations/{invitationId}/hero/{timestamp}-{random}.jpg",
  "uploadUrl": "https://...",
  "publicUrl": "https://pub-xxxx.r2.dev/invitations/{invitationId}/hero/{timestamp}-{random}.jpg",
  "expiresIn": 3600
}
```

### `POST /api/media/confirm`

요청 예:

```json
{
  "objectKey": "invitations/{invitationId}/hero/{timestamp}-{random}.jpg",
  "publicUrl": "https://pub-xxxx.r2.dev/invitations/{invitationId}/hero/{timestamp}-{random}.jpg",
  "contentType": "image/jpeg",
  "size": 123456,
  "usage": "INVITATION_HERO",
  "invitationId": "{invitationId}"
}
```

처리:

- object key prefix 검증
- 소유권 검증
- R2 `HeadObject` 존재 확인
- `media_files` 저장
- 대표 이미지 참조(Invitation/Template) 갱신

## 삭제 / orphan 정책

- Editor에서 이미지 제거는 **draft reference만 제거**합니다 (즉시 R2 object 삭제 강제 없음).
- 저장 후에도 이전 object는 orphan 이 될 수 있으며, 주기적 cleanup 또는 수동 purge로 정리합니다.
- shared/`invitation/shared/**` 경로는 일반 사용자 업로드·삭제 대상이 아닙니다.
