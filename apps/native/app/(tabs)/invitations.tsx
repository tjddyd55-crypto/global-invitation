import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { listMyInvitations } from '@/src/api/invitations';
import { AppHeader } from '@/src/components/AppHeader';
import { AppScreen } from '@/src/components/AppScreen';
import { EmptyState } from '@/src/components/EmptyState';
import { ErrorState } from '@/src/components/ErrorState';
import { InvitationCard } from '@/src/components/InvitationCard';
import { LoadingState } from '@/src/components/LoadingState';
import { colors, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

export default function InvitationsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['invitations', 'mine'],
    queryFn: listMyInvitations,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const items = data ?? [];

  return (
    <AppScreen scroll={false} padded={false}>
      <View style={styles.headerWrap}>
        <AppHeader title={t('invitations.title')} />
      </View>
      {items.length === 0 ? (
        <EmptyState
          title={t('invitations.emptyTitle')}
          description={t('invitations.emptyDesc')}
          actionLabel={t('invitations.create')}
          onAction={() => router.push('/create/concept')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <InvitationCard
              invitation={item}
              onEdit={() => router.push(`/editor/${item.id}`)}
              onPreview={() => router.push(`/preview/${item.id}`)}
            />
          )}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});
