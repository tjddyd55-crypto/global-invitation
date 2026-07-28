# Maps (Google / Naver)

## Provider SSOT

- Selector: `frontend/src/invitation/mapSettings.ts` → `getInvitationMapSettings`
- Editor: `Step6Location` provider switch
- Preview/Public: `LocationMapSection` only

## Env

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=
NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=
```

- Google/Naver browser keys: HTTP referrer 제한
- secret을 `NEXT_PUBLIC_*`에 두지 않음
- development domains: `localhost:3000`, `frontend-development-1b8a.up.railway.app`

## Fallback

Naver Client ID가 없으면 Editor/Public은 crash하지 않고 fallback 문구를 표시합니다.
