export function isE2eFactoryDisabled(): boolean {
  return process.env.NODE_ENV === 'production';
}
