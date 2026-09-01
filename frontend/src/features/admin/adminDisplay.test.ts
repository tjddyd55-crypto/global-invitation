/**
 * Admin Korean display formatters and tab deep-link helpers.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatCatalogStatus,
  formatConceptLabel,
  formatGiSection,
  formatInvitationStatus,
  formatPaymentChannel,
  formatPaymentStatus,
  formatSourceType,
} from './adminDisplay';

test('formatConceptLabel returns Korean labels', () => {
  assert.equal(formatConceptLabel('WEDDING'), '웨딩');
  assert.equal(formatConceptLabel('FUNERAL'), '장례');
});

test('formatInvitationStatus and formatCatalogStatus', () => {
  assert.equal(formatInvitationStatus('DRAFT'), '작성 중');
  assert.equal(formatInvitationStatus('PUBLISHED'), '공개 완료');
  assert.equal(formatCatalogStatus('QA_READY'), '검수 준비');
});

test('formatPaymentStatus and formatPaymentChannel', () => {
  assert.equal(formatPaymentStatus('PAID'), '결제 완료');
  assert.equal(formatPaymentChannel('INTERNATIONAL_USD'), '해외카드 USD 결제');
});

test('formatGiSection and formatSourceType', () => {
  assert.equal(formatGiSection('HERO'), '히어로');
  assert.equal(formatSourceType('FIGMA_DEFINITION'), 'Figma 템플릿');
});

function parsePaymentsTab(value: string | null) {
  if (value === 'pricing' || value === 'toss') return value;
  return 'transactions';
}

function parseSystemTab(value: string | null) {
  if (value === 'figma' || value === 'audit') return value;
  return 'runtime';
}

test('payment tab deep-link fallback', () => {
  assert.equal(parsePaymentsTab(null), 'transactions');
  assert.equal(parsePaymentsTab('invalid'), 'transactions');
  assert.equal(parsePaymentsTab('toss'), 'toss');
});

test('system tab deep-link fallback', () => {
  assert.equal(parseSystemTab('figma'), 'figma');
  assert.equal(parseSystemTab('unknown'), 'runtime');
});
