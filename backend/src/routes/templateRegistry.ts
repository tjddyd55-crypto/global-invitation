import { Router } from 'express';
import { getTemplateById, listVisibleTemplates } from '../admin/templateStore';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const templates = await listVisibleTemplates();
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error listing public templates:', error);
    return res.status(500).json({ error: 'FAILED_TO_LIST_PUBLIC_TEMPLATES' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template || !template.isActive || template.isDeleted) {
      return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND' });
    }
    return res.status(200).json(template);
  } catch (error) {
    console.error('Error fetching public template:', error);
    return res.status(500).json({ error: 'FAILED_TO_FETCH_PUBLIC_TEMPLATE' });
  }
});

export default router;
