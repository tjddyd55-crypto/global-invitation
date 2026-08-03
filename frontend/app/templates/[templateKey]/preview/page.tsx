import { notFound } from 'next/navigation';
import VisualTemplatePreviewScreen from '@/src/features/templates/ui/shared/VisualTemplatePreviewScreen';
import { isVisualTemplateId } from '@/src/templates/visualTemplate/ids';

type PageProps = {
  params: Promise<{ templateKey: string }> | { templateKey: string };
};

/**
 * Canonical: /templates/{visualTemplateId}/preview
 * Shares [templateKey] segment with marketplace detail; visual IDs take preview when valid.
 */
export default async function VisualTemplatePreviewPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const id = resolved.templateKey;
  if (!isVisualTemplateId(id)) {
    notFound();
  }
  return <VisualTemplatePreviewScreen visualTemplateId={id} />;
}
