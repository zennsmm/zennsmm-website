/**
 * SMMZIO API Configuration
 */
export const SMM_API_URL = 'https://smmzio.com/api/v2';
export const SMM_API_KEY = 'ebe12e2d267d371d3ed3fba657eda085';

export interface SMMZIOService {
  service: string | number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill: boolean;
  cancel: boolean;
}
