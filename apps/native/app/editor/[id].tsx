import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getInvitation, patchInvitation } from '@/src/api/invitations';
import { uploadInvitationImage } from '@/src/api/media';
import { buildPublicInvitationUrl } from '@/src/config/environment';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppInput } from '@/src/components/AppInput';
import { AppScreen } from '@/src/components/AppScreen';
import { EditorStepHeader } from '@/src/components/EditorStepHeader';
import { EditorStepNavigator } from '@/src/components/EditorStepNavigator';
import { EditorStepSheet } from '@/src/components/EditorStepSheet';
import { KeyboardFormContext } from '@/src/components/KeyboardFormContext';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';
import { ErrorState } from '@/src/components/ErrorState';
import { FeedbackBanner } from '@/src/components/FeedbackBanner';
import { LoadingState } from '@/src/components/LoadingState';
import { SegmentedControl } from '@/src/components/SegmentedControl';
import { StickyFooter } from '@/src/components/StickyFooter';
import { Toggle } from '@/src/components/Toggle';
import { getEditorSteps, type EditorStepKey } from '@/src/hooks/useEditorSteps';
import { mergeEditorPatch, parseEditorData, type EditorDataJson, type MapProvider } from '@/src/types/editorData';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function EditorScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const invitationId = id ?? '';
  const steps = useMemo(() => getEditorSteps(), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editorData, setEditorData] = useState<EditorDataJson>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invitation', invitationId],
    queryFn: () => getInvitation(invitationId),
    enabled: Boolean(invitationId),
  });

  useEffect(() => {
    if (!data) return;
    const raw = data.dataJson ?? data.data ?? {};
    setEditorData(parseEditorData(raw));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (patch: EditorDataJson) => patchInvitation(invitationId, patch as Record<string, unknown>),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['invitation', invitationId] });
    },
    onError: () => setSaveStatus('error'),
  });

  const updateData = useCallback((patch: Partial<EditorDataJson>) => {
    setEditorData((prev) => mergeEditorPatch(prev, patch));
  }, []);

  const saveNow = useCallback(async () => {
    await saveMutation.mutateAsync(editorData);
  }, [editorData, saveMutation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(editorData).length > 0) {
        saveMutation.mutate(editorData);
      }
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorData]);

  const currentStep = steps[stepIndex];
  const stepKey = currentStep?.key ?? 'basic';

  const goNext = async () => {
    Keyboard.dismiss();
    await saveNow();
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
  };

  const goPrev = () => {
    Keyboard.dismiss();
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  const keyboardHeight = useKeyboardHeight();

  const scrollToField = useCallback((field: View) => {
    const scrollNode = scrollContentRef.current;
    if (!scrollNode) return;
    field.measureLayout(
      scrollNode,
      (_x, y, _width, height) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y + height - 96), animated: true });
      },
      () => undefined,
    );
  }, []);

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <AppScreen scroll={false} padded={false}>
      <View style={styles.headerWrap}>
        <AppHeader showBack />
        <EditorStepHeader
          stepIndex={stepIndex}
          title={currentStep.title}
          onOpenSheet={() => setSheetOpen(true)}
          onPreview={() => router.push(`/preview/${invitationId}`)}
        />
        <EditorStepNavigator
          steps={steps}
          currentIndex={stepIndex}
          onSelect={(index) => {
            Keyboard.dismiss();
            setStepIndex(index);
          }}
        />
        {saveStatus === 'saving' ? <FeedbackBanner message={t('common.saving')} /> : null}
        {saveStatus === 'saved' ? <FeedbackBanner message={t('common.saved')} variant="success" /> : null}
        {saveStatus === 'error' ? <FeedbackBanner message={t('common.saveFailed')} variant="error" /> : null}
      </View>

      <KeyboardFormContext.Provider value={{ scrollToField }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: keyboardHeight + spacing.xxxl }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View ref={scrollContentRef}>
            <EditorStepContent
              stepKey={stepKey}
              data={editorData}
              invitationId={invitationId}
              canShare={Boolean(data.canShare)}
              shareSlug={data.shareSlug}
              onChange={updateData}
              onPayment={() => router.push(`/payment/${invitationId}`)}
            />
          </View>
        </ScrollView>
      </KeyboardFormContext.Provider>

      <StickyFooter style={keyboardHeight > 0 ? { marginBottom: keyboardHeight } : undefined}>
        <View style={styles.footerRow}>
          <AppButton label={t('common.prev')} onPress={goPrev} variant="secondary" disabled={stepIndex === 0} style={styles.footerBtn} />
          <AppButton
            label={stepIndex === steps.length - 1 ? t('common.save') : t('common.next')}
            onPress={goNext}
            style={styles.footerBtn}
          />
        </View>
      </StickyFooter>

      <EditorStepSheet
        visible={sheetOpen}
        steps={steps}
        currentIndex={stepIndex}
        onClose={() => setSheetOpen(false)}
        onSelect={setStepIndex}
      />
    </AppScreen>
  );
}

type StepProps = {
  stepKey: EditorStepKey;
  data: EditorDataJson;
  invitationId: string;
  canShare: boolean;
  shareSlug?: string | null;
  onChange: (patch: Partial<EditorDataJson>) => void;
  onPayment: () => void;
};

function EditorStepContent({ stepKey, data, invitationId, canShare, shareSlug, onChange, onPayment }: StepProps) {
  switch (stepKey) {
    case 'basic':
      return (
        <View style={styles.step}>
          <AppInput label="제목" value={data.title ?? ''} onChangeText={(v) => onChange({ title: v })} />
          <AppInput label="일시" value={data.eventDate ?? ''} onChangeText={(v) => onChange({ eventDate: v })} placeholder="2026-05-01T14:00" />
        </View>
      );
    case 'message':
      return (
        <View style={styles.step}>
          <AppInput
            label={t('editor.steps.message')}
            value={data.message ?? ''}
            onChangeText={(v) => onChange({ message: v })}
            multiline
            returnKeyType="default"
            blurOnSubmit={false}
          />
        </View>
      );
    case 'hero':
      return <HeroStep invitationId={invitationId} heroImage={data.heroImage} onChange={onChange} />;
    case 'hosts':
      return (
        <View style={styles.step}>
          <AppInput label="신랑" value={data.groomName ?? ''} onChangeText={(v) => onChange({ groomName: v })} />
          <AppInput label="신부" value={data.brideName ?? ''} onChangeText={(v) => onChange({ brideName: v })} />
          <AppInput label="신랑 아버지" value={data.groomFather ?? ''} onChangeText={(v) => onChange({ groomFather: v })} />
          <AppInput label="신랑 어머니" value={data.groomMother ?? ''} onChangeText={(v) => onChange({ groomMother: v })} />
          <AppInput label="신부 아버지" value={data.brideFather ?? ''} onChangeText={(v) => onChange({ brideFather: v })} />
          <AppInput label="신부 어머니" value={data.brideMother ?? ''} onChangeText={(v) => onChange({ brideMother: v })} />
        </View>
      );
    case 'gallery':
      return <GalleryStep invitationId={invitationId} gallery={data.gallery ?? []} onChange={onChange} />;
    case 'location':
      return <LocationStep location={data.location} onChange={onChange} />;
    case 'account':
      return <AccountStep accounts={data.accounts ?? []} onChange={onChange} />;
    case 'rsvp':
      return (
        <View style={styles.step}>
          <Toggle
            label="RSVP 사용"
            value={Boolean(data.rsvp?.enabled)}
            onValueChange={(enabled) => onChange({ rsvp: { ...data.rsvp, enabled } })}
          />
          <AppInput
            label="RSVP 안내 문구"
            value={data.rsvp?.message ?? ''}
            onChangeText={(message) => onChange({ rsvp: { ...data.rsvp, message } })}
          />
        </View>
      );
    case 'music':
      return <MusicStep music={data.music} onChange={onChange} />;
    case 'share':
      return (
        <View style={styles.step}>
          <Text style={styles.label}>공개 URL</Text>
          <Text style={styles.shareUrl}>
            {shareSlug ? buildPublicInvitationUrl(shareSlug) : '결제 후 공개 가능'}
          </Text>
          {!canShare ? (
            <FeedbackBanner message="결제가 필요합니다." variant="warning" />
          ) : null}
          <AppButton label="결제하기" onPress={onPayment} />
        </View>
      );
    default:
      return null;
  }
}

function HeroStep({
  invitationId,
  heroImage,
  onChange,
}: {
  invitationId: string;
  heroImage?: string;
  onChange: (patch: Partial<EditorDataJson>) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const url = await uploadInvitationImage({
        invitationId,
        fileUri: asset.uri,
        contentType: asset.mimeType ?? 'image/jpeg',
        fileSize: asset.fileSize ?? 0,
        scope: 'invitationHero',
      });
      onChange({ heroImage: url });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.step}>
      {heroImage ? <Image source={{ uri: heroImage }} style={styles.heroImage} /> : null}
      <AppButton label={uploading ? t('common.saving') : '사진 선택'} onPress={pickImage} variant="secondary" />
    </View>
  );
}

function GalleryStep({
  invitationId,
  gallery,
  onChange,
}: {
  invitationId: string;
  gallery: Array<{ id: string; url: string }>;
  onChange: (patch: Partial<EditorDataJson>) => void;
}) {
  const addImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const url = await uploadInvitationImage({
      invitationId,
      fileUri: asset.uri,
      contentType: asset.mimeType ?? 'image/jpeg',
      fileSize: asset.fileSize ?? 0,
      scope: 'invitationGallery',
    });
    onChange({ gallery: [...gallery, { id: `g-${Date.now()}`, url }] });
  };

  const removeAt = (index: number) => {
    onChange({ gallery: gallery.filter((_, i) => i !== index) });
  };

  return (
    <View style={styles.step}>
      <View style={styles.galleryGrid}>
        {gallery.map((item, index) => (
          <View key={item.id} style={styles.galleryItem}>
            <Image source={{ uri: item.url }} style={styles.galleryImage} />
            <Pressable onPress={() => removeAt(index)} style={styles.galleryRemove}>
              <Text style={styles.galleryRemoveText}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <AppButton label="사진 추가" onPress={addImage} variant="secondary" />
    </View>
  );
}

function LocationStep({
  location,
  onChange,
}: {
  location?: EditorDataJson['location'];
  onChange: (patch: Partial<EditorDataJson>) => void;
}) {
  const provider: MapProvider = location?.mapProvider ?? 'google';

  const setLocation = (patch: Partial<NonNullable<EditorDataJson['location']>>) => {
    onChange({ location: { ...location, ...patch } });
  };

  return (
    <View style={styles.step}>
      <Text style={styles.label}>지도 제공자</Text>
      <SegmentedControl<MapProvider>
        options={[
          { value: 'google', label: 'Google Maps' },
          { value: 'naver', label: 'Naver Map' },
        ]}
        value={provider}
        onChange={(value) => setLocation({ mapProvider: value })}
      />
      <AppInput label="장소명" value={location?.venueName ?? ''} onChangeText={(v) => setLocation({ venueName: v })} />
      <AppInput label="주소" value={location?.address ?? ''} onChangeText={(v) => setLocation({ address: v })} />
      <AppInput label="위도" value={location?.lat ?? ''} onChangeText={(v) => setLocation({ lat: v })} />
      <AppInput label="경도" value={location?.lng ?? ''} onChangeText={(v) => setLocation({ lng: v })} />
      <AppInput label="교통 안내" value={location?.transport ?? ''} onChangeText={(v) => setLocation({ transport: v })} multiline />
      <AppInput label="주차 안내" value={location?.parking ?? ''} onChangeText={(v) => setLocation({ parking: v })} multiline />
      <FeedbackBanner message="네이티브 지도 SDK 미연동 — MVP는 주소 폼 입력. WebView picker는 후속 작업." variant="info" />
    </View>
  );
}

function AccountStep({
  accounts,
  onChange,
}: {
  accounts: Array<{ id: string; role: string; bank: string; number: string; holder: string }>;
  onChange: (patch: Partial<EditorDataJson>) => void;
}) {
  const updateAccount = (index: number, field: string, value: string) => {
    const next = accounts.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    onChange({ accounts: next });
  };

  const addAccount = () => {
    onChange({
      accounts: [
        ...accounts,
        { id: `acc-${Date.now()}`, role: '', bank: '', number: '', holder: '' },
      ],
    });
  };

  return (
    <View style={styles.step}>
      {accounts.map((account, index) => (
        <View key={account.id} style={styles.accountCard}>
          <AppInput label="관계" value={account.role} onChangeText={(v) => updateAccount(index, 'role', v)} />
          <AppInput label="은행" value={account.bank} onChangeText={(v) => updateAccount(index, 'bank', v)} />
          <AppInput label="계좌번호" value={account.number} onChangeText={(v) => updateAccount(index, 'number', v)} />
          <AppInput label="예금주" value={account.holder} onChangeText={(v) => updateAccount(index, 'holder', v)} />
        </View>
      ))}
      <AppButton label="계좌 추가" onPress={addAccount} variant="secondary" />
    </View>
  );
}

function MusicStep({
  music,
  onChange,
}: {
  music?: EditorDataJson['music'];
  onChange: (patch: Partial<EditorDataJson>) => void;
}) {
  return (
    <View style={styles.step}>
      <Toggle
        label="배경음악 사용"
        value={Boolean(music?.enabled)}
        onValueChange={(enabled) => onChange({ music: { ...music, enabled } })}
      />
      <AppInput
        label="음악 라이브러리 트랙 ID"
        value={music?.trackId ?? ''}
        onChangeText={(trackId) => onChange({ music: { ...music, trackId } })}
      />
      <FeedbackBanner message="음악 카탈로그 연동은 /api/music-library API로 후속 연결합니다." variant="info" />
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  step: { gap: spacing.lg },
  label: { ...typography.label, color: colors.text },
  multiline: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text,
  },
  footerRow: { flexDirection: 'row', gap: spacing.md },
  footerBtn: { flex: 1 },
  heroImage: { width: '100%', height: 220, borderRadius: radius.lg },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  galleryItem: { width: '30%', aspectRatio: 1, position: 'relative' },
  galleryImage: { width: '100%', height: '100%', borderRadius: radius.sm },
  galleryRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.overlay,
    borderRadius: radius.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryRemoveText: { color: colors.surface, fontWeight: '700' },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  shareUrl: { ...typography.caption, color: colors.textSecondary },
});
