export interface BreedInfo {
  id: string;
  name: string;
  locked: boolean;
  description: string;
  needs: string[];
  baseBudget: number;
  variancePercent: number;
  monthlyCostEur: number;
  healthIssues: string[];
  careRequirements: string[];
  behavioralAdvice: string[];
}

export const BREEDS: BreedInfo[] = [
  {
    id: 'labrador',
    name: 'Labrador Retriever',
    locked: false,
    description: 'Joueur, sociable et énergique. Race de référence pour la simulation 30 jours.',
    needs: ['2 repas/jour', '1h30 de marche', '15 min stimulation mentale', 'Brossage hebdo'],
    baseBudget: 450,
    variancePercent: 15,
    monthlyCostEur: 120,
    healthIssues: ['Dysplasie hanche', 'Obésité'],
    careRequirements: ['2 repas équilibrés', 'Brossage hebdo', 'Vermifuge mensuel'],
    behavioralAdvice: ['Récompenser le calme', 'Éviter excitation avant sortie'],
  },
  {
    id: 'golden',
    name: 'Golden Retriever',
    locked: true,
    description: 'Doux et affectueux, besoins similaires au Labrador.',
    needs: ['2 repas/jour', '1h30 de marche', 'Soins réguliers'],
    baseBudget: 480,
    variancePercent: 18,
    monthlyCostEur: 135,
    healthIssues: ['Otites', 'Problèmes cutanés'],
    careRequirements: ['Toilettage fréquent', 'Contrôle oreilles'],
    behavioralAdvice: ['Socialisation précoce', 'Jeux de rapport'],
  },
  {
    id: 'berger',
    name: 'Berger Allemand',
    locked: true,
    description: 'Très actif, nécessite beaucoup d\'exercice.',
    needs: ['2 repas/jour', '2h d\'activité', 'Stimulation mentale'],
    baseBudget: 520,
    variancePercent: 20,
    monthlyCostEur: 150,
    healthIssues: ['Dysplasie', 'Maladies digestives'],
    careRequirements: ['Activité intense', 'Dressage structuré'],
    behavioralAdvice: ['Canaliser l\'énergie', 'Éviter l\'ennui'],
  },
  {
    id: 'beagle',
    name: 'Beagle',
    locked: true,
    description: 'Curieux et sociable, sensible à l\'alimentation.',
    needs: ['2 repas/jour', 'Marche quotidienne', 'Surveillance poids'],
    baseBudget: 400,
    variancePercent: 12,
    monthlyCostEur: 110,
    healthIssues: ['Surpoids', 'Problèmes auditifs'],
    careRequirements: ['Portions strictes', 'Marche régulière'],
    behavioralAdvice: ['Renforcer le rappel', 'Éviter nourriture humaine'],
  },
];

export function getBreed(id: string): BreedInfo | undefined {
  return BREEDS.find((b) => b.id === id);
}

export function computeBreedBudget(breedId: string, seed = Date.now()): number {
  const breed = getBreed(breedId) || getBreed('labrador')!;
  const variance = breed.baseBudget * (breed.variancePercent / 100);
  const offset = ((seed % 200) - 100) / 100;
  return Math.round(breed.baseBudget + variance * offset);
}
