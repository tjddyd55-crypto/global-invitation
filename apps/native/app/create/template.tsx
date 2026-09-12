import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { ConceptType } from '@/src/api/invitations';
import { createInvitation } from '@/src/api/invitations';
import { fetchVisualCatalog } from '@/src/api/templates';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppScreen } from '@/src/components/AppScreen';
import { ErrorState } from '@/src/components/ErrorState';
import { LoadingState } from '@/src/components/LoadingState';
import { TemplatePreviewCard } from '@/src/components/TemplatePreviewCard';
import { sizes, spacing } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

export default function CreateTemplateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ concept?: string }>();
  const concept = (params.concept as ConceptType) || 'WEDDING';
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['templates', concept],
    queryFn: () => fetchVisualCatalog(concept),
  });

  const onCreate = async () => {
    if (!selectedId) return;
    setCreating(true);
    try {
      const created = await createInvitation({ conceptType: concept, visualTemplateId: selectedId });
      router.replace(`/editor/${created.id}`);
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const templates = data ?? [];

  return (
    <AppScreen scroll={false} padded={false}>
      <View style={styles.headerWrap}>
        <AppHeader title={t('create.templateTitle')} showBack />
      </View>
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TemplatePreviewCard
            template={item}
            selected={selectedId === item.id}
            onPress={() => setSelectedId(item.id)}
          />
        )}
      />
      <View style={styles.footer}>
        <AppButton
          label={t('common.next')}
          onPress={onCreate}
          disabled={!selectedId}
          loading={creating}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: sizes.screenPadding },
  list: {
    paddingHorizontal: sizes.screenPadding,
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingHorizontal: sizes.screenPadding,
    paddingBottom: spacing.xxl,
  },
});
