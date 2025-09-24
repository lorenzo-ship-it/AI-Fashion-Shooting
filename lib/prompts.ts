import type { AngleValue } from './angles';

export const SYSTEM_PROMPT = `Generate high-quality studio fashion photography for e-commerce. Keep the same female model across all images of the same outfit and its color variants. Lighting: soft, even, studio; solid beige background #E6DFD3; soft floor shadow; neutral color science; no props, no logos, no extra accessories unless present in the reference. Respect garment fit, cut, and construction exactly as shown in the provided mannequin references. Do not crop originals; always regenerate a new shot at the requested framing.`;

export type PromptContext = {
  category: 'abito' | 'top' | 'maglieria' | 'pantaloni' | 'gonne' | 'borse';
  angle: AngleValue;
  view: 'full body' | 'upper body' | 'lower body';
  detailFocus?: string;
  hexColor?: string;
};

const sharedFollowUp = ({ hexColor }: { hexColor?: string } = {}) => {
  const hints = ['Use the previous “base model” image of this outfit for identity consistency.', 'Recreate the garment exactly from the matching mannequin reference for this view.'];
  if (hexColor) {
    hints.push(`If this is a color variant, match garment color exactly to HEX ${hexColor} taken from the hanging reference.`);
  }
  return hints.join(' ');
};

export const buildBaseMotherPrompt = () =>
  'Create the base image for this outfit: same female model to be reused in subsequent shots. Pose: relaxed runway stance, arms naturally by the sides. Camera: full body, front. Background: solid beige #E6DFD3. Lighting: soft studio, even exposure. Recreate each garment exactly from the mannequin front reference. Keep proportions and drape faithful; realistic fabric texture and stitching; neutral color rendering.';

export const buildBaseAnglePrompt = ({ angle }: { angle: AngleValue }) =>
  `Same model as the base image and same outfit. Camera: full body ${angle}. Background: solid beige #E6DFD3. Lighting: soft studio. Recreate the garments exactly from the mannequin ${angle} reference for precise fit, seams, and closures. ${sharedFollowUp({})}`;

export const buildDetailPrompt = ({ detailFocus }: { detailFocus: string }) =>
  `Same model and outfit. Generate a close-up detail focusing on ${detailFocus}. Frame only the relevant area; high micro-contrast to show fabric, stitching, and trims. Background: solid beige #E6DFD3. Recreate materials exactly from the mannequin detail reference. ${sharedFollowUp({})}`;

export const buildUpperBodyPrompt = ({ angle }: { angle: AngleValue }) =>
  `Same model and outfit. Camera: upper body ${angle}. Background: solid beige #E6DFD3. Ensure neckline, shoulders, sleeves, and closures match the mannequin ${angle} reference precisely. ${sharedFollowUp({})}`;

export const buildLowerBodyPrompt = ({ angle }: { angle: AngleValue }) =>
  `Same model and outfit. Camera: lower body ${angle}. Background: solid beige #E6DFD3. Preserve true rise, silhouette, hem length, and pocket placement exactly as the mannequin ${angle} reference. ${sharedFollowUp({})}`;

export const buildVariantMotherPrompt = (hexColor: string) =>
  `Same model as the outfit’s base image. Recreate the garment(s) using the hanging reference as the source for color and material. Match color exactly to ${hexColor} extracted from the hanging reference; preserve fabric sheen/texture. Camera: full body front. Background: solid beige #E6DFD3. Keep fit and construction identical to the original mannequin outfit. ${sharedFollowUp({ hexColor })}`;

export const buildVariantAnglePrompt = ({ angle, view, hexColor }: PromptContext) =>
  `Same model and variant color as established. Camera: ${view} ${angle}. Background: solid beige #E6DFD3. Maintain identical fit to the original outfit; keep color exactly at ${hexColor} from the hanging reference. Use the mannequin ${angle} reference to reproduce seams and construction. ${sharedFollowUp({ hexColor })}`;

export const buildVariantDetailPrompt = ({ detailFocus, hexColor }: { detailFocus: string; hexColor: string }) =>
  `Same model and variant color. Generate a close-up of ${detailFocus}. Match color exactly ${hexColor}; show weave/texture; no cropping originals—create a new rendered close-up. Background: solid beige #E6DFD3. ${sharedFollowUp({ hexColor })}`;

export const CATEGORY_HINTS: Record<PromptContext['category'], string[]> = {
  abito: [
    'Work through full body front, side, back, and detail prompts focusing on waistline, zipper, hem.',
  ],
  top: [
    'Generate upper body front, side, back and details about collar, buttons, cuffs.',
  ],
  maglieria: [
    'Upper body angles must emphasise knit texture, zipper, pockets, and ribbing depending on garment.',
  ],
  pantaloni: [
    'Lower body framing must capture rise, silhouette, hem length, waistband, belt loops, and pockets.',
  ],
  gonne: [
    'Lower body framing focusing on waistband, pleats, hem texture, and drape.',
  ],
  borse: [
    'Full body front, side, back with natural hand pose and detail shots of handles, seams, and closures.',
  ],
};
