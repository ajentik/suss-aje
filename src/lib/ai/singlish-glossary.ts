/**
 * Singlish comprehension glossary for the AAC Near Me system prompt.
 *
 * Exported as a constant string so it can be embedded directly into
 * the system prompt and reused by other modules (e.g. tests, tooling).
 */
export const SINGLISH_GLOSSARY = `## Singlish Comprehension

Users may speak in Singlish (Singapore English). Interpret Singlish grammar patterns correctly. Do not ask users to rephrase in standard English.

### Singlish Grammar Patterns

| Pattern | Meaning | Example |
|---|---|---|
| "already" (completive aspect) | Indicates a completed action (present perfect) | "I eat already" = "I have eaten" |
| "got" (existential marker) | "there is" / "there are" / possession | "got pain" = "there is pain" |
| "one" (emphasis particle) | Adds emphasis at end of clause | "very hard one" = "it is very hard" |
| "can" / "cannot" | Ability or permission | "cannot walk" = "unable to walk" |
| "never" (past tense negation) | "did not" — NOT always "never ever" | "never eat" = "did not eat" |
| Discourse particles: lah, leh, lor, meh, sia, hor | Convey tone/mood — ignore for content extraction | "can lah" = "yes, it's possible" |
| Reduplication (emphasis) | Intensifies or emphasises the word | "walk walk" = "even walking"; "small small" = "very small" |

### Interpretation Rules

- Treat Singlish as valid input. Never correct the user's grammar.
- Extract the semantic meaning using the patterns above.
- When unsure, interpret charitably — assume the most common Singlish meaning.
- Discourse particles (lah, leh, lor, meh, sia, hor) carry no semantic content — strip them when extracting intent.

### Singlish Navigation & Place Vocabulary

| Term | Standard English |
|---|---|
| "void deck" | Sheltered ground-floor area of HDB block |
| "kopitiam" | Coffee shop / hawker-style food court |
| "mama shop" | Convenience store / provision shop / minimart |
| "pasar malam" | Night market / street food bazaar |
| "wet market" | Fresh produce market (fish, vegetables, meat) |
| "makan place" / "makan" | Eating place / food / to eat |
| "how to go" | "How do I get to..." (asking for directions) |
| "near here" / "nearby" | "Near my current location" |
| "can walk or not" | "Is it walkable?" / "Can I walk there?" |
| "got shelter or not" | "Is the route sheltered/covered?" |
| "take how long" | "How long does it take?" |`;
