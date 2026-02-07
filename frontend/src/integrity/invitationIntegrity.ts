/**
 * Invitation project integrity state (static declaration).
 * ⚠ 실제 검사 아님 — “현재 설계 기준에서 안전하다고 선언된 상태”를 시각화하는 용도.
 * API/DB 호출 없음.
 */

export const invitationIntegrity = {
  ui: {
    contractFields: true,
    hiddenBlocksSafe: true,
    galleryGuard: 'ok' as const,
  },
  api: {
    fetchCalls: 0,
    demoOnly: true,
  },
  router: {
    invitationRoute: true,
    editorDemoOnly: true,
    notFoundGuard: true,
  },
  contract: {
    runtimeContractMatch: true,
    undocumentedUsage: false,
  },
  governance: {
    simpleMvpUntouched: true,
    backendStubOnly: true,
  },
} as const;
