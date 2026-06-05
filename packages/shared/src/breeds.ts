export interface BreedInfo {
  id: string;
  name: string;
  locked: boolean;
  description: string;
  needs: string[];
}

export const BREEDS: BreedInfo[] = [
  {
    id: 'labrador',
    name: 'Labrador Retriever',
    locked: false,
    description: 'Joueur, sociable et énergique. Race de référence pour la simulation 30 jours.',
    needs: ['2 repas/jour', '1h30 de marche', '15 min stimulation mentale', 'Brossage hebdo'],
  },
  {
    id: 'golden',
    name: 'Golden Retriever',
    locked: true,
    description: 'Doux et affectueux, besoins similaires au Labrador.',
    needs: ['2 repas/jour', '1h30 de marche', 'Soins réguliers'],
  },
  {
    id: 'berger',
    name: 'Berger Allemand',
    locked: true,
    description: 'Très actif, nécessite beaucoup d\'exercice.',
    needs: ['2 repas/jour', '2h d\'activité', 'Stimulation mentale'],
  },
  {
    id: 'beagle',
    name: 'Beagle',
    locked: true,
    description: 'Curieux et sociable, sensible à l\'alimentation.',
    needs: ['2 repas/jour', 'Marche quotidienne', 'Surveillance poids'],
  },
];

export function getBreed(id: string): BreedInfo | undefined {
  return BREEDS.find((b) => b.id === id);
}
