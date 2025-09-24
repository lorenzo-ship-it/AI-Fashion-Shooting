import type { ClothingCategory, PromptDefinition } from './types';

export const ALL_CLOTHING_CATEGORIES: ClothingCategory[] = [
  'Top maniche corte',
  'Top maniche lunghe',
  'Maglia',
  'Felpa',
  'Giacca',
  'Pantalone',
  'Gonna',
];

const UPPER_BODY_ITEMS: ClothingCategory[] = ['Top maniche corte', 'Top maniche lunghe', 'Maglia', 'Felpa'];
const JACKET_ITEMS: ClothingCategory[] = ['Giacca'];
const LOWER_BODY_ITEMS: ClothingCategory[] = ['Pantalone', 'Gonna'];

export const NEGATIVE_PROMPT = `cartoon, illustration, sketch, blurry, low resolution, duplicate limbs, deformed hands, distorted clothing, logos, watermarks, text, busy background, patterns, jewelry not in reference, excessive makeup, fantasy elements, non-human.`;

export const PROMPT_DEFINITIONS: PromptDefinition[] = [
  // --- FULL BODY ---
  {
    id: 1, description: "Full-body side walking",
    prompt: "Full-body shot of the same fashion model, same outfit, walking naturally in profile view from the side, mid-step, elegant runway style. Studio lighting, solid beige background, high-resolution professional e-commerce fashion photography.",
    category: "FULL_BODY", requiredSlots: ["front"],
    getApplicableCategories: (confirmed) => [...confirmed],
  },
  {
    id: 2, description: "Full-body back shot",
    prompt: "Full-body shot of the same fashion model, same outfit, photographed from the back, standing straight, arms relaxed. Studio lighting, solid beige background, professional e-commerce style.",
    category: "FULL_BODY", requiredSlots: ["back"],
    getApplicableCategories: (confirmed) => [...confirmed],
  },
  {
    id: 3, description: "Full-body front neutral pose",
    prompt: "Full-body photo of a female fashion model, standing in a neutral, confident pose, wearing exactly the full outfit shown in the input reference images (combine all clothing pieces into one cohesive look: top, bottom, shoes, outerwear, and accessories). The garments must match the fabric, cut, color, texture, and fit from the references, with realistic tailoring and high-end fashion photography quality. The model should have natural, minimal makeup, a clean hairstyle (neat, without distracting elements), and an elegant but approachable expression. Lighting should be soft and even, eliminating harsh shadows. Background must be a solid beige studio backdrop, smooth and uniform, with no props or distractions. Photographic style should resemble professional e-commerce fashion photography: sharp focus, balanced colors, realistic shadows under the model, high resolution, studio lighting, 8k quality.",
    category: "FULL_BODY", requiredSlots: ["front"],
    getApplicableCategories: (confirmed) => [...confirmed],
  },
  {
    id: 21, description: "Full-body with handbag",
    prompt: "Full-body shot of the same fashion model, same outfit, holding the handbag from the input reference image. Handbag must match reference photo in shape, color, material, and details. Studio lighting, solid beige background, professional e-commerce style.",
    category: "FULL_BODY", requiredSlots: ["front", "detail"],
    getApplicableCategories: (confirmed) => [...confirmed],
  },
  {
    id: 22, description: "Full-body top/jacket recolored",
    prompt: "Full-body shot of the same fashion model, same outfit, but change the top/jacket color to match the reference input color. Keep shape, fabric texture, and tailoring identical. Studio lighting, solid beige background, professional e-commerce fashion style.",
    category: "FULL_BODY", requiredSlots: ["front", "detail"],
    getApplicableCategories: (confirmed) => [...confirmed],
  },
  // --- UPPER BODY (Top / T-shirt / Maglia / Felpa) ---
  {
    id: 4, description: "Upper body front",
    prompt: "Upper body shot of the same fashion model, same outfit, photographed from the front, sharp focus on torso and head. Studio lighting, solid beige background, professional e-commerce fashion style.",
    category: "UPPER_BODY_TOP", requiredSlots: ["front"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => UPPER_BODY_ITEMS.includes(c)),
  },
  {
    id: 5, description: "Upper body side",
    prompt: "Upper body shot of the same fashion model, same outfit, photographed from the side profile, focusing only on torso and head. Studio lighting, solid beige background.",
    category: "UPPER_BODY_TOP", requiredSlots: ["side"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => UPPER_BODY_ITEMS.includes(c)),
  },
  {
    id: 6, description: "Upper body back",
    prompt: "Upper body shot of the same fashion model, same outfit, photographed from the back, showing only torso and shoulders. Studio lighting, solid beige background.",
    category: "UPPER_BODY_TOP", requiredSlots: ["back"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => UPPER_BODY_ITEMS.includes(c)),
  },
  {
    id: 10, description: "Zoom neckline",
    prompt: "Close-up detail shot of the same outfit, focusing on the neckline/collar area of the top, sharp fabric texture. Studio lighting, solid beige background.",
    category: "UPPER_BODY_TOP", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => UPPER_BODY_ITEMS.includes(c)),
  },
  {
    id: 11, description: "Zoom shoulder",
    prompt: "Close-up detail shot of the same outfit, focusing on the shoulder area of the top, fabric texture visible. Studio lighting, solid beige background.",
    category: "UPPER_BODY_TOP", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => UPPER_BODY_ITEMS.includes(c)),
  },
  {
    id: 12, description: "Zoom sleeve cuff/wrist",
    prompt: "Close-up detail shot of the same outfit, focusing on the sleeve cuff/wrist area, showing stitching and fabric details. Studio lighting, solid beige background.",
    category: "UPPER_BODY_TOP", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => UPPER_BODY_ITEMS.includes(c)),
  },
  {
    id: 13, description: "Macro fabric close-up",
    prompt: "Macro close-up of the fabric of the top, showing weave, texture, and material quality. Studio lighting, solid beige background.",
    category: "UPPER_BODY_TOP", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => UPPER_BODY_ITEMS.includes(c)),
  },
  // --- UPPER BODY (Giacca / Giubbino) ---
  {
    id: 4, description: "Upper body front (Jacket)",
    prompt: "Upper body shot of the same fashion model, same outfit, photographed from the front, sharp focus on torso and head. Studio lighting, solid beige background, professional e-commerce fashion style.",
    category: "UPPER_BODY_JACKET", requiredSlots: ["front"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => JACKET_ITEMS.includes(c)),
  },
  {
    id: 5, description: "Upper body side (Jacket)",
    prompt: "Upper body shot of the same fashion model, same outfit, photographed from the side profile, focusing only on torso and head. Studio lighting, solid beige background.",
    category: "UPPER_BODY_JACKET", requiredSlots: ["side"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => JACKET_ITEMS.includes(c)),
  },
  {
    id: 6, description: "Upper body back (Jacket)",
    prompt: "Upper body shot of the same fashion model, same outfit, photographed from the back, showing only torso and shoulders. Studio lighting, solid beige background.",
    category: "UPPER_BODY_JACKET", requiredSlots: ["back"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => JACKET_ITEMS.includes(c)),
  },
  {
    id: 14, description: "Zoom collar",
    prompt: "Close-up detail shot of the jacket collar, sharp texture and stitching visible. Studio lighting, solid beige background.",
    category: "UPPER_BODY_JACKET", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => JACKET_ITEMS.includes(c)),
  },
  {
    id: 15, description: "Zoom shoulder",
    prompt: "Close-up detail shot of the jacket shoulder area, highlighting stitching and fabric texture. Studio lighting, solid beige background.",
    category: "UPPER_BODY_JACKET", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => JACKET_ITEMS.includes(c)),
  },
  {
    id: 16, description: "Zoom sleeve cuff/wrist",
    prompt: "Close-up detail shot of the jacket sleeve cuff/wrist, showing details of fabric and finish. Studio lighting, solid beige background.",
    category: "UPPER_BODY_JACKET", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => JACKET_ITEMS.includes(c)),
  },
  {
    id: 17, description: "Macro fabric close-up",
    prompt: "Macro close-up of the jacket fabric, focusing on weave, texture, and stitching. Studio lighting, solid beige background.",
    category: "UPPER_BODY_JACKET", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => JACKET_ITEMS.includes(c)),
  },
  // --- LOWER BODY (Pantalone / Gonna) ---
  {
    id: 7, description: "Lower body front",
    prompt: "Lower body shot of the same fashion model, same outfit, photographed from the front waist down. Focus on pants/skirt and shoes. Studio lighting, solid beige background.",
    category: "LOWER_BODY", requiredSlots: ["front"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => LOWER_BODY_ITEMS.includes(c)),
  },
  {
    id: 8, description: "Lower body side",
    prompt: "Lower body shot of the same fashion model, same outfit, photographed from the side waist down. Focus on pants/skirt silhouette and shoes. Studio lighting, solid beige background.",
    category: "LOWER_BODY", requiredSlots: ["side"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => LOWER_BODY_ITEMS.includes(c)),
  },
  {
    id: 9, description: "Lower body back",
    prompt: "Lower body shot of the same fashion model, same outfit, photographed from the back waist down. Focus on the fit of the pants/skirt. Studio lighting, solid beige background.",
    category: "LOWER_BODY", requiredSlots: ["back"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => LOWER_BODY_ITEMS.includes(c)),
  },
  {
    id: 18, description: "Zoom back pockets",
    prompt: "Close-up detail shot of the back pockets of the pants/skirt, showing stitching and fabric details. Studio lighting, solid beige background.",
    category: "LOWER_BODY", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => LOWER_BODY_ITEMS.includes(c)),
  },
  {
    id: 19, description: "Zoom front pockets",
    prompt: "Close-up detail shot of the front pockets of the pants/skirt, highlighting design and fabric. Studio lighting, solid beige background.",
    category: "LOWER_BODY", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => LOWER_BODY_ITEMS.includes(c)),
  },
  {
    id: 20, description: "Macro fabric close-up",
    prompt: "Macro close-up of the fabric of the pants/skirt, showing weave, texture, and material quality. Studio lighting, solid beige background.",
    category: "LOWER_BODY", requiredSlots: ["detail"],
    getApplicableCategories: (confirmed) => [...confirmed].filter(c => LOWER_BODY_ITEMS.includes(c)),
  },
];
