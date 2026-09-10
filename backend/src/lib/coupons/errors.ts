export const COUPON_ERROR_CODES = {
  COUPON_INVALID: 'COUPON_INVALID',
  COUPON_INACTIVE: 'COUPON_INACTIVE',
  COUPON_NOT_STARTED: 'COUPON_NOT_STARTED',
  COUPON_EXPIRED: 'COUPON_EXPIRED',
  COUPON_LIMIT_REACHED: 'COUPON_LIMIT_REACHED',
  COUPON_USER_LIMIT_REACHED: 'COUPON_USER_LIMIT_REACHED',
  COUPON_ALREADY_PAID: 'COUPON_ALREADY_PAID',
  COUPON_RATE_LIMITED: 'COUPON_RATE_LIMITED',
  COUPON_CURRENCY_MISMATCH: 'COUPON_CURRENCY_MISMATCH',
  COUPON_HAS_USAGE: 'COUPON_HAS_USAGE',
  COUPON_NOT_FOUND: 'COUPON_NOT_FOUND',
  COUPON_CODE_TAKEN: 'COUPON_CODE_TAKEN',
  COUPON_INVALID_DISCOUNT: 'COUPON_INVALID_DISCOUNT',
  COUPON_INVALID_WINDOW: 'COUPON_INVALID_WINDOW',
  COUPON_STATUS_CONFLICT: 'COUPON_STATUS_CONFLICT',
  COUPON_RESERVE_FAILED: 'COUPON_RESERVE_FAILED',
  COUPON_ACTIVE_EDIT_REQUIRES_PAUSE: 'COUPON_ACTIVE_EDIT_REQUIRES_PAUSE',
  COUPON_CODE_LOCKED: 'COUPON_CODE_LOCKED',
} as const;

export type CouponErrorCode = (typeof COUPON_ERROR_CODES)[keyof typeof COUPON_ERROR_CODES];

const PUBLIC_VALIDATE_CODES = new Set<CouponErrorCode>([
  COUPON_ERROR_CODES.COUPON_INVALID,
  COUPON_ERROR_CODES.COUPON_INACTIVE,
  COUPON_ERROR_CODES.COUPON_NOT_STARTED,
  COUPON_ERROR_CODES.COUPON_EXPIRED,
  COUPON_ERROR_CODES.COUPON_LIMIT_REACHED,
  COUPON_ERROR_CODES.COUPON_USER_LIMIT_REACHED,
  COUPON_ERROR_CODES.COUPON_ALREADY_PAID,
  COUPON_ERROR_CODES.COUPON_RATE_LIMITED,
]);

/** Public validate: collapse unknown/admin codes so callers cannot probe catalog details. */
export function toPublicCouponError(code: string): CouponErrorCode {
  if (PUBLIC_VALIDATE_CODES.has(code as CouponErrorCode)) {
    return code as CouponErrorCode;
  }
  return COUPON_ERROR_CODES.COUPON_INVALID;
}

export const COUPON_ERROR_MESSAGES_KO: Record<CouponErrorCode, string> = {
  COUPON_INVALID: '쿠폰 코드가 올바르지 않습니다.',
  COUPON_INACTIVE: '사용할 수 없는 쿠폰입니다.',
  COUPON_NOT_STARTED: '아직 사용할 수 없는 쿠폰입니다.',
  COUPON_EXPIRED: '만료된 쿠폰입니다.',
  COUPON_LIMIT_REACHED: '쿠폰 사용 한도에 도달했습니다.',
  COUPON_USER_LIMIT_REACHED: '이 쿠폰은 이미 사용하셨습니다.',
  COUPON_ALREADY_PAID: '이미 결제된 초대장은 쿠폰을 적용할 수 없습니다.',
  COUPON_RATE_LIMITED: '쿠폰 확인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  COUPON_CURRENCY_MISMATCH: '이 쿠폰은 현재 결제 통화에 사용할 수 없습니다.',
  COUPON_HAS_USAGE: '사용 이력이 있는 쿠폰은 삭제할 수 없습니다. 보관 처리하세요.',
  COUPON_NOT_FOUND: '쿠폰을 찾을 수 없습니다.',
  COUPON_CODE_TAKEN: '이미 사용 중인 쿠폰 코드입니다.',
  COUPON_INVALID_DISCOUNT: '할인 값 또는 할인 유형이 올바르지 않습니다.',
  COUPON_INVALID_WINDOW: '쿠폰 유효 기간이 올바르지 않습니다.',
  COUPON_STATUS_CONFLICT: '현재 상태에서는 이 작업을 할 수 없습니다.',
  COUPON_RESERVE_FAILED: '쿠폰을 적용하지 못했습니다. 다시 시도해 주세요.',
  COUPON_ACTIVE_EDIT_REQUIRES_PAUSE: '활성 쿠폰의 할인·한도·기간은 일시중지 후 수정할 수 있습니다.',
  COUPON_CODE_LOCKED: '사용 이력이 있는 쿠폰 코드는 변경할 수 없습니다.',
};

export function couponErrorMessageKo(code: string): string {
  const publicCode = toPublicCouponError(code);
  return COUPON_ERROR_MESSAGES_KO[publicCode];
}

export class CouponError extends Error {
  readonly code: CouponErrorCode;
  readonly httpStatus: number;

  constructor(code: CouponErrorCode, httpStatus = 400) {
    super(COUPON_ERROR_MESSAGES_KO[code]);
    this.name = 'CouponError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
