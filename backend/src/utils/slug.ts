/**
 * Generate a unique slug for invitations
 * Length: 8-10 characters
 * Characters: lowercase letters + numbers (URL-safe)
 */
export function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8 + Math.floor(Math.random() * 3); // 8-10 characters
  
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return slug;
}
