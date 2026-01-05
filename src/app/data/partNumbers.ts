/**
 * Part Numbers by Product Option
 * Each product option (MIDNIGHT, URBAN) has its own set of part numbers
 */

export const MIDNIGHT_PART_NUMBERS = [
  '52092696-1',
  '52092696-2',
  '52092696-3',
  '52092697-1',
  '52092697-2',
  '52092698-1',
  '52092699-1',
  '52092700-1',
  '52092700-2',
  '52092701-1',
];

export const URBAN_PART_NUMBERS = [
  '52100001-1',
  '52100001-2',
  '52100002-1',
  '52100002-2',
  '52100003-1',
  '52100004-1',
  '52100004-2',
  '52100005-1',
  '52100006-1',
  '52100007-1',
];

/**
 * Get part numbers for a specific product option
 */
export function getPartNumbersForProduct(productOption: 'MIDNIGHT' | 'URBAN'): string[] {
  return productOption === 'MIDNIGHT' ? MIDNIGHT_PART_NUMBERS : URBAN_PART_NUMBERS;
}


