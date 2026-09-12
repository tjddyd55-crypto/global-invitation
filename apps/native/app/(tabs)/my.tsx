import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { logout } from '@/src/api/auth';
import { queryClient } from '@/src/providers/AppProviders';
import { AppHeader } from '@/src/components/AppHeader';
import { AppScreen } from '@/src/components/AppScreen';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

const SUPPORT_EMAIL = 'tjddyd55@gmail.com';

export default function MyScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const onLogout = async () => {
    try {
      await logout();
    } catch {
      /* server revoke best-effort */
    }
    await clearSession();
    queryClient.clear();
    router.replace('/(auth)/login');
  };

  return (
    <AppScreen>
      <AppHeader title={t('my.title')} />
      <View style={styles.card}>
        <Text style={styles.label}>{t('my.accountInfo')}</Text>
        <Text style={styles.value}>{user?.username}</Text>
        <Text style={styles.subValue}>{user?.email}</Text>
      </View>

      <MenuItem label={t('my.security')} onPress={() => router.push('/account-security')} />
      <MenuItem
        label={t('my.support')}
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
      />

      <Pressable onPress={onLogout} style={styles.logout}>
        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
      </Pressable>
    </AppScreen>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Text style={styles.menuText}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.heading, color: colors.text },
  subValue: { ...typography.body, color: colors.textSecondary },
  menuItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  menuText: { ...typography.bodyMedium, color: colors.text },
  chevron: { color: colors.textSecondary, fontSize: 20 },
  logout: { marginTop: spacing.xxxl, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  logoutText: { ...typography.bodyMedium, color: colors.error },
});
