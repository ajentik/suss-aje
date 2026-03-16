/**
 * Singlish glossary for clinical transcription context.
 *
 * Exports structured glossary entries and a prompt-injectable string block
 * that teaches the AI model how to interpret Singlish patterns in a
 * healthcare / eldercare context.
 */

export interface GlossaryEntry {
  term: string;
  function: string;
  examples: ReadonlyArray<{ singlish: string; standard: string }>;
}

export const SINGLISH_GLOSSARY: ReadonlyArray<GlossaryEntry> = [
  {
    term: "already",
    function: "Completive aspect marker — indicates an action has been completed",
    examples: [
      { singlish: "I eat already", standard: "I have eaten" },
      { singlish: "take medicine already", standard: "medication has been taken" },
      { singlish: "fall down already", standard: "has already fallen" },
    ],
  },
  {
    term: "got",
    function:
      "Existential marker — indicates existence or possession, equivalent to 'there is' or 'have'",
    examples: [
      { singlish: "got pain", standard: "there is pain" },
      { singlish: "got fall before", standard: "has had a fall before" },
      { singlish: "got fever", standard: "has a fever" },
    ],
  },
  {
    term: "one",
    function: "Sentence-final particle for emphasis or assertion",
    examples: [
      { singlish: "very pain one", standard: "it is really painful" },
      { singlish: "always like that one", standard: "it is always like that" },
      { singlish: "he very stubborn one", standard: "he is very stubborn" },
    ],
  },
  {
    term: "lah",
    function:
      "Sentence-final particle expressing emphasis, reassurance, or mild frustration",
    examples: [
      { singlish: "okay lah", standard: "it is okay" },
      { singlish: "cannot walk lah", standard: "unable to walk" },
      { singlish: "no choice lah", standard: "there is no choice" },
    ],
  },
  {
    term: "leh",
    function:
      "Sentence-final particle expressing uncertainty, suggestion, or mild assertion",
    examples: [
      { singlish: "like that how leh", standard: "what should we do then" },
      { singlish: "pain leh", standard: "it is painful" },
    ],
  },
  {
    term: "lor",
    function:
      "Sentence-final particle expressing resignation or acceptance",
    examples: [
      { singlish: "take medicine lor", standard: "just take the medicine then" },
      { singlish: "no choice lor", standard: "there is no choice" },
    ],
  },
  {
    term: "meh",
    function: "Sentence-final particle expressing doubt or surprise",
    examples: [
      { singlish: "really meh", standard: "is that really so" },
      { singlish: "got problem meh", standard: "is there a problem" },
    ],
  },
  {
    term: "hor",
    function:
      "Sentence-final particle seeking agreement or used as a discourse marker",
    examples: [
      { singlish: "this one hor, very pain", standard: "this one, it is very painful" },
      { singlish: "you know hor", standard: "you know, right" },
    ],
  },
  {
    term: "can",
    function:
      "Used alone as affirmation; doubled ('can can') for enthusiastic agreement",
    examples: [
      { singlish: "can", standard: "yes / that is fine" },
      { singlish: "can can", standard: "yes, absolutely" },
      { singlish: "can walk", standard: "is able to walk" },
    ],
  },
  {
    term: "never",
    function:
      "Often means 'did not' (past tense negation), not necessarily 'never ever'",
    examples: [
      { singlish: "I never eat", standard: "I did not eat" },
      { singlish: "never take medicine", standard: "did not take medication" },
      { singlish: "never go doctor", standard: "did not visit the doctor" },
    ],
  },
  {
    term: "very",
    function:
      "Intensifier used more broadly than in standard English, sometimes without an adjective following",
    examples: [
      { singlish: "very pain", standard: "very painful" },
      { singlish: "very cannot", standard: "really unable to" },
    ],
  },
  {
    term: "until",
    function: "Indicates consequence or extent, often meaning 'to the point that'",
    examples: [
      { singlish: "pain until cannot walk", standard: "in so much pain that walking is not possible" },
      { singlish: "cry until eyes swollen", standard: "cried so much that eyes are swollen" },
    ],
  },
] as const;

/**
 * Singlish particles that appear at sentence boundaries.
 * Used for detection and stripping in clinical normalization.
 */
export const SINGLISH_PARTICLES = [
  "lah",
  "leh",
  "lor",
  "loh",
  "meh",
  "hor",
  "ah",
  "sia",
  "seh",
  "wor",
  "hah",
  "mah",
  "ar",
  "one",
] as const;

export type SinglishParticle = (typeof SINGLISH_PARTICLES)[number];

/**
 * Prompt-injectable glossary string for AI system prompts.
 *
 * This block can be concatenated directly into a system prompt to give the
 * model contextual understanding of Singlish expressions in clinical /
 * eldercare conversations.
 */
export const SINGLISH_GLOSSARY_PROMPT = `## Singlish Language Context (Clinical Transcription)

When processing transcripts from Singaporean patients or caregivers, be aware of Singlish (Singapore Colloquial English) patterns. Interpret them correctly rather than literally.

### Key Patterns

${SINGLISH_GLOSSARY.map(
  (entry) =>
    `**"${entry.term}"** — ${entry.function}\n${entry.examples
      .map((ex) => `  - "${ex.singlish}" means "${ex.standard}"`)
      .join("\n")}`,
).join("\n\n")}

### Sentence-Final Particles

The following particles appear at the end of sentences and carry pragmatic (not lexical) meaning. They convey tone, emphasis, or attitude but do not change the factual content:
${SINGLISH_PARTICLES.map((p) => `- "${p}"`).join(", ")}

When generating clinical notes, strip these particles and rephrase in standard medical English while preserving all factual information.

### Important Notes

1. "Never" often means "did not" (past tense), not "never ever". Ask for clarification when the distinction matters clinically.
2. "Already" signals completion, not timing. "Take medicine already" = "medication has been taken".
3. "Got" is existential. "Got pain" = "there is pain", not "obtained pain".
4. "Can can" (doubled) = enthusiastic yes. Single "can" = standard agreement.
5. "Very" + noun is valid Singlish. "Very pain" = "very painful".
6. Code-switching (mixing English with Mandarin/Malay/Tamil) is common. Preserve untranslatable terms and flag them.
`;
