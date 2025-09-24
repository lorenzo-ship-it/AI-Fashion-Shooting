export const ANGLES = {
  fullBody: ['front', 'side', 'back'],
  upperBody: ['front', 'side', 'back'],
  lowerBody: ['front', 'side', 'back'],
  details: ['detail-1', 'detail-2'],
} as const;

export type AngleView = keyof typeof ANGLES;
export type AngleValue = (typeof ANGLES)[AngleView][number];
