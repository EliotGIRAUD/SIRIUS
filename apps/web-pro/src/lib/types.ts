export type UserRole = 'adopter' | 'shelter' | 'breeder' | 'sponsor';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  pseudo?: string;
  shelterId?: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
}

export interface ShelterInfo {
  id: string;
  name: string;
  proCode: string;
}

export interface BreederInfo {
  id: string;
  name: string;
  description: string;
  breeds: string[];
  lat: number;
  lng: number;
  verified: boolean;
  subscriptionStatus: string;
  subscriptionValidUntil?: string;
  monthlyViews: number;
}

export interface SponsorCampaign {
  id: string;
  _id?: string;
  name: string;
  tier: string;
  status: string;
  impressionsLimit: number;
  impressionsCount: number;
  validUntil?: string;
  placement: string;
}
