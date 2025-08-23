/**
 * Contact data structure
 */
export interface Contact {
  id: string;
  name: string;
  phone?: string;
  discord?: string;
  instagram?: string;
  telegram?: string;
  signal?: string;
  address?: string;
  notes?: string;
  image_url?: string;
  personal_code_hash: string;
  created_at: number;
  updated_at: number;
}

/**
 * Contact input data for creation
 */
export interface ContactInput {
  name: string;
  phone?: string;
  discord?: string;
  instagram?: string;
  telegram?: string;
  signal?: string;
  address?: string;
  notes?: string;
  image_url?: string;
  personal_code?: string;
}

/**
 * Contact update data
 */
export interface ContactUpdate extends ContactInput {
  personal_code: string; // Required for updates
}

/**
 * Public contact data (without sensitive fields)
 */
export interface PublicContact {
  id: string;
  name: string;
  phone?: string;
  discord?: string;
  instagram?: string;
  telegram?: string;
  signal?: string;
  address?: string;
  notes?: string;
  image_url?: string;
  created_at: number;
  updated_at: number;
}