// Regular expressions for detecting personal information
const patterns = {
  // Danish CPR numbers (DDMMYY-XXXX)
  cpr: /\b\d{6}-\d{4}\b/g,

  // Danish phone numbers (various formats)
  phone: /\b(?:\+45[ ]?)?(?:\d{2}[ ]?\d{2}[ ]?\d{2}[ ]?\d{2}|\d{8})\b/g,

  // Danish addresses (including apartment numbers and multi-word city names)
  address: /\b\d+(?:[ ]?[A-ZÆØÅ][a-zæøå]+(?:[ ][A-ZÆØÅ]?[a-zæøå]+)*)+(?:[ ](?:st|[1-9](?:\.|))[ ]?(?:tv|th|mf)|,[ ](?:st|[1-9](?:\.|))\.?[ ](?:tv|th|mf))?(?:[ ]?,[ ]?\d{4}[ ]?(?:[A-ZÆØÅ][a-zæøå]+(?:[ ][A-ZÆØÅ][a-zæøå]+)*)+)\b/gi,

  // Danish names (including æ, ø, å)
  name: /\b[A-ZÆØÅ][a-zæøå]+(?:[ ][A-ZÆØÅ][a-zæøå]+){1,2}\b/g,

  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Credit card numbers (with spaces, dashes, or continuous)
  creditCard: /\b(?:\d{4}[\s-]?){4}\b/g,

  // Bank account numbers (Danish format)
  bankAccount: /\b\d{4}[\s-]?\d{6,10}\b/g,

  // Danish CVR numbers (always 8 digits, often with CVR prefix)
  cvr: /\b(?:CVR(?:[:\s-]+))?\d{8}\b/g,

  // Danish postal codes with city
  postalCode: /\b\d{4}[ ]?(?:[A-ZÆØÅ][a-zæøå]+(?:[ ][A-ZÆØÅ][a-zæøå]+)*)\b/g,

  // Dates (Danish format)
  date: /\b\d{1,2}\.?\s*(?:januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)\s+\d{4}\b/gi,

  // Age
  age: /\b\d{1,3}\s*(?:år(?:\sgammel)?)\b/gi,

  // PIN codes (4 digits, with optional prefix)
  pin: /\b(?:pinkode:?\s*)?\d{4}\b/gi,

  // Money amounts (Danish format)
  money: /\b\d+(?:\.\d{3})*(?:,\d{2})?\s*(?:kr\.?|DKK)\b/gi
};

type PatternType = keyof typeof patterns;

const replacements: Record<PatternType, string> = {
  cpr: "[CPR-NUMMER]",
  phone: "[TELEFONNUMMER]",
  address: "[ADRESSE]",
  name: "[NAVN]",
  email: "[EMAIL]",
  creditCard: "[BETALINGSKORT]",
  bankAccount: "[KONTONUMMER]",
  cvr: "[CVR-NUMMER]",
  postalCode: "[POSTNUMMER OG BY]",
  date: "[DATO]",
  age: "[ALDER]",
  pin: "[PIN-KODE]",
  money: "[BELØB]"
};

export function anonymizeText(text: string): string {
  let result = text;

  // Apply each pattern replacement
  (Object.keys(patterns) as PatternType[]).forEach((key) => {
    result = result.replace(patterns[key], replacements[key]);
  });

  return result;
}

export function hasPersonalInfo(text: string): boolean {
  return (Object.keys(patterns) as PatternType[]).some((key) => 
    patterns[key].test(text)
  );
}

export function getDetectedTypes(text: string): PatternType[] {
  return (Object.keys(patterns) as PatternType[]).filter((key) => 
    patterns[key].test(text)
  );
}