export type StarType = 'discipline' | 'event';
export type StarStatus = 'locked' | 'available' | 'obtained' | 'failed';

export interface StarDefinition {
  id: string;
  day: number;
  type: StarType;
  title: string;
  description: string;
}

export const CONSTELLATION_STARS: StarDefinition[] = [
  { id: 'd01', day: 1, type: 'discipline', title: 'Premier repas', description: '2 repas équilibrés le jour 1' },
  { id: 'd02', day: 2, type: 'discipline', title: 'Première sortie', description: '90 min de marche' },
  { id: 'd03', day: 3, type: 'discipline', title: 'Hygiène', description: 'Brossage ou soin' },
  { id: 'd04', day: 4, type: 'discipline', title: 'Budget sage', description: 'Achat vital priorisé' },
  { id: 'd05', day: 5, type: 'discipline', title: 'Routine stable', description: 'Journée sans pénalité majeure' },
  { id: 'd06', day: 6, type: 'discipline', title: 'Mental actif', description: '15 min stimulation' },
  { id: 'd07', day: 7, type: 'discipline', title: 'Semaine 1', description: '7 jours de soins' },
  { id: 'd08', day: 8, type: 'discipline', title: 'Alimentation', description: 'Portions correctes' },
  { id: 'd09', day: 9, type: 'discipline', title: 'Activité', description: 'Sorties fractionnées' },
  { id: 'd10', day: 10, type: 'discipline', title: 'Mi-parcours', description: 'Score jour > 70' },
  { id: 'd11', day: 11, type: 'discipline', title: 'Santé', description: 'Jauges > 50' },
  { id: 'd12', day: 12, type: 'discipline', title: 'Discipline', description: 'Pas de repas extra' },
  { id: 'd13', day: 13, type: 'discipline', title: 'Endurance', description: 'Marche complète' },
  { id: 'd14', day: 14, type: 'discipline', title: 'Semaine 2', description: '14 jours consécutifs' },
  { id: 'd15', day: 15, type: 'discipline', title: 'Équilibre', description: 'Budget > 200€' },
  { id: 'e01', day: 1, type: 'event', title: 'Bienvenue', description: 'Démarrer la simulation' },
  { id: 'e02', day: 3, type: 'event', title: 'Premier achat', description: 'Acheter en boutique' },
  { id: 'e03', day: 5, type: 'event', title: 'Première balade GPS', description: 'Valider une sortie' },
  { id: 'e04', day: 7, type: 'event', title: 'Premier brossage', description: 'Action brossage' },
  { id: 'e05', day: 10, type: 'event', title: 'Vermifuge', description: 'Acheter vermifuge' },
  { id: 'e06', day: 12, type: 'event', title: 'Soin véto', description: 'Consultation' },
  { id: 'e07', day: 14, type: 'event', title: 'Streak 7', description: '7 jours sans échec' },
  { id: 'e08', day: 18, type: 'event', title: 'Joueur', description: 'Action jouer' },
  { id: 'e09', day: 21, type: 'event', title: 'Semaine 3', description: '21 jours atteints' },
  { id: 'e10', day: 24, type: 'event', title: 'Croquettes premium', description: 'Achat croquettes' },
  { id: 'e11', day: 26, type: 'event', title: 'Antiparasitaire', description: 'Administration' },
  { id: 'e12', day: 28, type: 'event', title: 'Pré-attestation', description: 'Score > 60' },
  { id: 'e13', day: 29, type: 'event', title: 'Dernière ligne', description: 'Budget vital couvert' },
  { id: 'e14', day: 30, type: 'event', title: 'Trophée J+30', description: 'Terminer la simulation' },
  { id: 'e15', day: 30, type: 'event', title: 'Certification', description: 'Attestation validée' },
];
