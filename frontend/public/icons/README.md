# PWA Icons

이 폴더는 PWA 설치 아이콘을 둔다.

## 현재 상태

- `icon.svg` : 임시 SVG 아이콘 (manifest 에 우선 등록됨). 대부분의 안드로이드 Chrome 에서 PWA 설치 가능.
- `icon-192.png` / `icon-512.png` : **아직 없음**. iOS Safari / 일부 Android 는 PNG 를 요구하므로 아래 지침대로 생성 후 업로드할 것.

## PNG 생성 (프로덕션 전 반드시 교체)

1. `icon.svg` 를 디자이너 소스(예: Figma) 로 대체하거나 그대로 사용.
2. 192x192, 512x512 PNG 로 export. 투명 배경 가능.
3. `purpose: "any maskable"` 를 만족하도록 캔버스 가장자리 10% 는 안전영역(subject 배치 금지) 유지.
4. 파일명 `icon-192.png`, `icon-512.png` 로 이 폴더에 저장.

`manifest.webmanifest` 는 이미 세 경로를 모두 참조하고 있으므로 PNG 파일만 추가하면 자동으로 인식된다.
