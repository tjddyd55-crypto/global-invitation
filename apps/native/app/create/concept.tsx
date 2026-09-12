import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ConceptType } from '@/src/api/invitations';
import { AppHeader } from '@/src/components/AppHeader';
import { AppScreen } from '@/src/components/AppScreen';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

const CONCEPTS: ConceptType[] = ['WEDDING', 'FUNERAL', 'GENERAL', 'ORGANIZATION'];

export default function CreateConceptScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <AppHeader title={t('create.conceptTitle')} showBack />
      <View style={styles.list}>
        {CONCEPTS.map((concept) => (
          <Pressable
            key={concept}
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/create/template', params: { concept } })
            }
          >
            <Text style={styles.title}>{t(`concepts.${concept}`)}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...typography.bodyMedium, color: colors.text },
  chevron: { color: colors.textSecondary, fontSize: 22 },
});
