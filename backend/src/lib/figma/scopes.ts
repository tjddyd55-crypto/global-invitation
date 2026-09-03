/** Runtime Figma REST import scopes (admin PAT). Connection test aligns with these — not current_user:read. */
export const FIGMA_RUNTIME_IMPORT_SCOPES = ['file_content:read', 'file_metadata:read'] as const;

export type FigmaRuntimeImportScope = (typeof FIGMA_RUNTIME_IMPORT_SCOPES)[number];
