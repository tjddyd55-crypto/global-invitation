import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { requestOwnerPreviewToken } from '@/src/api/invitations';
import { buildOwnerPreviewUrl } from '@/src/config/environment';
import { AppHeader } from '@/src/components/AppHeader';
import { AppScreen } from '@/src/components/AppScreen';
import { ErrorState } from '@/src/components/ErrorState';
import { FeedbackBanner } from '@/src/components/FeedbackBanner';
import { LoadingState } from '@/src/components/LoadingState';
import { spacing } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const invitationId = id ?? '';

  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['preview-token', invitationId],
    queryFn: () => requestOwnerPreviewToken(invitationId),
    enabled: Boolean(invitationId),
    retry: false,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data?.token) {
    const message =
      error instanceof Error
        ? error.message
        : '미리보기 토큰 API가 아직 배포되지 않았습니다. (POST /api/invitations/:id/owner-preview-token)';
    return (
      <AppScreen>
        <AppHeader title={t('editor.preview')} showBack />
        <FeedbackBanner message={message} variant="warning" />
        <ErrorState message={message} onRetry={() => refetch()} />
      </AppScreen>
    );
  }

  const previewUrl = buildOwnerPreviewUrl(data.token);

  return (
    <AppScreen scroll={false} padded={false}>
      <View style={styles.header}>
        <AppHeader title={t('editor.preview')} showBack />
      </View>
      <WebView source={{ uri: previewUrl }} style={styles.webview} startInLoadingState />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg },
  webview: { flex: 1 },
});
