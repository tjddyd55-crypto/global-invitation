import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InvitationSummary } from '@/src/api/invitations';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

type Props = {
  invitation: InvitationSummary;
  onPress?: () => void;
  onEdit?: () => void;
  onPreview?: () => void;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export function InvitationCard({ invitation, onPress, onEdit, onPreview }: Props) {
  const isPublished = invitation.status === 'PUBLISHED';

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.thumb} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {invitation.title || '제목 없음'}
        </Text>
        <Text style={styles.meta}>
          {isPublished ? t('invitations.statusPublished') : t('invitations.statusDraft')} ·{' '}
          {formatDate(invitation.updatedAt)}
        </Text>
        <View style={styles.actions}>
          {onEdit ? (
            <Pressable onPress={onEdit} style={styles.actionBtn}>
              <Text style={styles.actionText}>{t('invitations.edit')}</Text>
            </Pressable>
          ) : null}
          {onPreview ? (
            <Pressable onPress={onPreview} style={styles.actionBtn}>
              <Text style={styles.actionText}>{t('invitations.preview')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  body: { flex: 1, gap: spacing.xs },
  title: { ...typography.bodyMedium, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionBtn: { minHeight: 32, justifyContent: 'center' },
  actionText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
