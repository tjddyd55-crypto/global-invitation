import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { listRecentInvitations } from '@/src/api/invitations';
import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { InvitationCard } from '@/src/components/InvitationCard';
import { LoadingState } from '@/src/components/LoadingState';
import { ErrorState } from '@/src/components/ErrorState';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invitations', 'recent'],
    queryFn: listRecentInvitations,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const recent = data ?? [];

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('home.greeting')}</Text>
        <Text style={styles.name}>{user?.nickname || user?.username || ''}</Text>
      </View>

      <AppButton label={t('home.createNew')} onPress={() => router.push('/create/concept')} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.recent')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/invitations')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        {recent.length === 0 ? (
          <Text style={styles.emptyHint}>{t('invitations.emptyDesc')}</Text>
        ) : (
          recent.map((item) => (
            <InvitationCard
              key={item.id}
              invitation={item}
              onEdit={() => router.push(`/editor/${item.id}`)}
              onPreview={() => router.push(`/preview/${item.id}`)}
            />
          ))
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.lg, marginBottom: spacing.xxl, gap: spacing.xs },
  greeting: { ...typography.caption, color: colors.textSecondary },
  name: { ...typography.title, color: colors.text },
  section: { marginTop: spacing.xxxl, gap: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.heading, color: colors.text },
  seeAll: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  emptyHint: { ...typography.body, color: colors.textSecondary },
});
