export type CvLayoutKey = 'modern' | 'topcv' | 'classic';

export function resolveCvLayout(templateConfig: unknown): CvLayoutKey {
  if (templateConfig && typeof templateConfig === 'object') {
    const layout = (templateConfig as { layout?: string }).layout;
    if (layout === 'topcv') return 'topcv';
    if (layout === 'modern') return 'modern';
    if (layout === 'classic') return 'classic';
  }
  return 'modern';
}
