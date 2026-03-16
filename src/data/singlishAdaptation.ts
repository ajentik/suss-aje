export const singlishParticles = [
  "lah", "leh", "loh", "lor", "meh", "sia", "hor",
  "ah", "wah", "kan", "one", "nia",
];

export const singlishExclamations = [
  "alamak", "shiok", "aiyoh", "aiyo", "wah lau",
  "die die", "jialat", "sian", "bo jio",
];

export const singlishGrammar = [
  "cannot", "can can", "already", "got", "is it",
  "how come", "never mind", "last time", "next time",
  "still got", "no more", "so far so good",
];

export const medicalTerms = [
  "dementia", "incontinence", "dysphagia", "polypharmacy",
  "physiotherapy", "occupational therapy", "geriatrician",
  "palliative", "comorbidity", "delirium", "sarcopenia",
  "osteoporosis", "hypertension", "diabetes", "stroke",
  "Parkinsons", "Alzheimers",
];

export const cgaTerms = [
  "NRIC", "ACP", "AMD", "LPA", "ADL", "IADL",
  "CPR", "DNR", "MMSE", "AMT", "GDS", "MNA",
  "Barthel", "Lawton", "Tinetti", "FRAIL",
  "caregiver", "walker", "wheelchair", "commode",
  "feeding tube", "nasogastric",
];

export const singaporePlaces = [
  "polyclinic", "void deck", "HDB", "MRT", "NTUC",
  "SGH", "NUH", "TTSH", "CGH", "KKH", "KTPH",
  "AH", "Changi", "Tan Tock Seng", "Mount Elizabeth",
  "Woodlands", "Tampines", "Jurong", "Bedok",
];

/** Combined list for Google STT phrase biasing */
export function getAdaptationPhrases(): { value: string; boost?: number }[] {
  return [
    ...medicalTerms.map((v) => ({ value: v, boost: 10 })),
    ...cgaTerms.map((v) => ({ value: v, boost: 15 })),
    ...singlishParticles.map((v) => ({ value: v, boost: 5 })),
    ...singlishExclamations.map((v) => ({ value: v, boost: 5 })),
    ...singlishGrammar.map((v) => ({ value: v, boost: 3 })),
    ...singaporePlaces.map((v) => ({ value: v, boost: 8 })),
  ];
}
