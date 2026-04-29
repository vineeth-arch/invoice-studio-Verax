export interface SACCode {
  code: string;
  description: string;
  category: string;
  defaultGstRate: number;
  tags: string[];
}

export const SAC_CODES: SACCode[] = [

  // Design Innsaeit primary codes
  {
    code: "998392",
    description: "Design originals — logo, brand identity, packaging artwork, original graphic design",
    category: "Specialty Design",
    defaultGstRate: 18,
    tags: ["logo", "brand", "identity", "packaging", "graphic", "design", "artwork", "creative"],
  },
  {
    code: "998391",
    description: "Specialty design services — interior, fashion, industrial, visual design consultancy",
    category: "Specialty Design",
    defaultGstRate: 18,
    tags: ["design", "consultancy", "packaging", "product", "visual", "specialty"],
  },
  {
    code: "998311",
    description: "Management consulting — brand strategy, business strategy, positioning, marketing strategy",
    category: "Consulting",
    defaultGstRate: 18,
    tags: ["strategy", "consulting", "brand strategy", "positioning", "marketing", "management"],
  },
  {
    code: "998312",
    description: "Business consulting and public relations services",
    category: "Consulting",
    defaultGstRate: 18,
    tags: ["business", "consulting", "PR", "public relations", "advisory"],
  },
  {
    code: "998313",
    description: "Information technology consulting and support services",
    category: "IT Services",
    defaultGstRate: 18,
    tags: ["IT", "technology", "consulting", "support", "digital", "technical"],
  },
  {
    code: "998314",
    description: "IT design and development — website design, UI/UX, software design",
    category: "IT Services",
    defaultGstRate: 18,
    tags: ["website", "UI", "UX", "design", "development", "web", "app", "software"],
  },
  {
    code: "998361",
    description: "Advertising services — ad campaign creative, advertising agency services",
    category: "Advertising",
    defaultGstRate: 18,
    tags: ["advertising", "campaign", "ad", "creative", "agency"],
  },
  {
    code: "998362",
    description: "Purchase or sale of advertising space or time, on commission",
    category: "Advertising",
    defaultGstRate: 18,
    tags: ["media", "advertising", "space", "commission"],
  },
  {
    code: "998399",
    description: "Other professional, technical and business services",
    category: "Professional Services",
    defaultGstRate: 18,
    tags: ["professional", "technical", "business", "other", "general"],
  },

  // Broad SAC headings
  {
    code: "9954",
    description: "Construction services",
    category: "Construction",
    defaultGstRate: 18,
    tags: ["construction", "building"],
  },
  {
    code: "9971",
    description: "Financial and related services",
    category: "Finance",
    defaultGstRate: 18,
    tags: ["financial", "finance", "banking"],
  },
  {
    code: "9972",
    description: "Real estate services",
    category: "Real Estate",
    defaultGstRate: 18,
    tags: ["real estate", "property", "rent"],
  },
  {
    code: "9982",
    description: "Legal and accounting services",
    category: "Legal & Accounting",
    defaultGstRate: 18,
    tags: ["legal", "accounting", "audit", "CA", "lawyer"],
  },
  {
    code: "9983",
    description: "Other professional, technical and business services",
    category: "Professional Services",
    defaultGstRate: 18,
    tags: ["professional", "technical", "business"],
  },
  {
    code: "9984",
    description: "Telecommunications, broadcasting and information supply services",
    category: "Telecom",
    defaultGstRate: 18,
    tags: ["telecom", "broadcasting", "internet", "communication"],
  },
  {
    code: "9992",
    description: "Education services",
    category: "Education",
    defaultGstRate: 18,
    tags: ["education", "training", "teaching", "school", "college"],
  },
  {
    code: "9993",
    description: "Human health and social care services",
    category: "Health",
    defaultGstRate: 18,
    tags: ["health", "medical", "care", "hospital"],
  },
  {
    code: "9996",
    description: "Recreation, cultural and sporting services",
    category: "Recreation",
    defaultGstRate: 18,
    tags: ["recreation", "sport", "culture", "entertainment"],
  },
  {
    code: "9997",
    description: "Other services",
    category: "Other",
    defaultGstRate: 18,
    tags: ["other", "miscellaneous"],
  },
];

export function searchSACCodes(query: string): SACCode[] {
  if (!query || query.trim().length < 2) 
    return SAC_CODES;
  const q = query.toLowerCase().trim();
  return SAC_CODES.filter(
    (s) =>
      s.code.includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.tags.some((tag) => tag.includes(q))
  );
}

export function getSACByCode(
  code: string
): SACCode | undefined {
  return SAC_CODES.find((s) => s.code === code.trim());
}
