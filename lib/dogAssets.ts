/** On-brand placeholder for dogs without an uploaded photo. */
export const DEFAULT_DOG_AVATAR = "/images/default-dog-avatar.png";

export function getDogPhotoSrc(photoUrl: string | null | undefined): string {
  return photoUrl ?? DEFAULT_DOG_AVATAR;
}
