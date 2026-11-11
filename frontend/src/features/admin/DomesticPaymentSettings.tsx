'use client';
import { useI18n } from '@/src/contexts/I18nContext';

type Props = { settings: Record<string, unknown>; disabled: boolean;
  onSave: (settings: Record<string, unknown>) => unknown };
export default function DomesticPaymentSettings({ settings, disabled, onSave }: Props) {
  const { t } = useI18n();
  return <div>
    <label><input type="checkbox" checked={Boolean(settings.domesticKrwEnabled)} disabled={disabled}
      onChange={event => void onSave({ domesticKrwEnabled: event.target.checked })} />{t('checkout.method.adminEnabled')}</label>
    <label>{t('checkout.method.adminRate')}<input key={String(settings.usdKrwRate)} type="number" min={100} max={10000} step={1}
      defaultValue={settings.usdKrwRate == null ? '' : Number(settings.usdKrwRate)} disabled={disabled}
      onBlur={event => { if (event.target.reportValidity()) void onSave({ usdKrwRate: event.target.value === '' ? null : Number(event.target.value) }); }} /></label>
  </div>;
}
