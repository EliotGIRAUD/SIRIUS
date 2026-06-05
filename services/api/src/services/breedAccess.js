import { FREE_BREED_ID } from '@sirius/shared';

export function userOwnsBreed(user, breedId) {
  const owned = user.ownedBreeds || [FREE_BREED_ID];
  if (breedId === FREE_BREED_ID) return true;
  if (user.plan === 'premium') return true;
  return owned.includes(breedId);
}

export function assertBreedAccess(user, breedId) {
  if (!userOwnsBreed(user, breedId)) {
    throw new Error(`Race "${breedId}" verrouillée — débloquez pour 2,99 €`);
  }
}

export function hasPdfAccess(user) {
  if (user.plan === 'premium') return true;
  return (user.purchases || []).some((p) => p.productId === 'pdf_report');
}
