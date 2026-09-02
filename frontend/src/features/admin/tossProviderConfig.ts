export type TossEnvironment = 'TEST' | 'LIVE';

export type TossDraft = {
  clientKey: string;
  secretKey: string;
  variantKey: string;
};

export function buildTossProviderPayload(
  environment: TossEnvironment,
  draft: TossDraft
): Record<string, unknown> {
  const payload: Record<string, unknown> = { environment, enabled: true };
  const clientKey = draft.clientKey.trim();
  const secretKey = draft.secretKey.trim();
  const variantKey = draft.variantKey.trim();
  if (clientKey) payload.clientKey = clientKey;
  if (secretKey) payload.secretKey = secretKey;
  if (variantKey) payload.variantKey = variantKey;
  return payload;
}

export function validateTossSaveDraft(
  draft: TossDraft,
  encryptionConfigured: boolean
): { ok: true } | { ok: false; message: string } {
  if (draft.secretKey.trim() && !encryptionConfigured) {
    return {
      ok: false,
      message:
        '암호화 설정이 없어 Secret Key를 저장할 수 없습니다. Railway Backend의 ADMIN_SETTINGS_ENCRYPTION_KEY 설정을 확인해 주세요.',
    };
  }

  const hasAny =
    Boolean(draft.clientKey.trim()) ||
    Boolean(draft.secretKey.trim()) ||
    Boolean(draft.variantKey.trim());
  if (!hasAny) {
    return {
      ok: false,
      message: '저장할 변경 내용이 없습니다. 변경할 키를 입력해 주세요.',
    };
  }

  return { ok: true };
}

export function mapTossProviderError(error: unknown): string {
  const code = error instanceof Error ? error.message : '';
  const messages: Record<string, string> = {
    ADMIN_SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED:
      '암호화 설정이 없어 Secret Key를 저장할 수 없습니다. Railway Backend의 ADMIN_SETTINGS_ENCRYPTION_KEY 설정을 확인해 주세요.',
    PROVIDER_CONFIG_NOTHING_TO_SAVE:
      '저장할 변경 내용이 없습니다. 변경할 키를 입력해 주세요.',
    SUPER_ADMIN_REQUIRED: 'SUPER_ADMIN 권한이 필요합니다.',
    PROVIDER_CONFIG_UPDATE_FAILED: 'Toss Payments 설정 저장에 실패했습니다.',
  };
  return messages[code] || (error instanceof Error ? error.message : 'Toss 설정 저장에 실패했습니다.');
}
