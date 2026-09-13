# Planet and moon learning content

Add entries to [`learning-content.json`](./learning-content.json) using the celestial body's name as the key. Names are matched without regard to capitalization, so `"Jupiter"` is a good key for Jupiter's destination. The Sun uses `"Sun"`. For a named survey site, use the opening words of its name, such as `"Asteroid Belt"` for "Asteroid belt survey".

Each entry can have a `fact`, a `quiz`, or both. Quiz choices must contain exactly three strings, and `answer` must exactly match one of them. `explanation` is optional and appears after a correct answer.

```json
{
  "Europa": {
    "fact": "Europa is one of Jupiter's moons.",
    "quiz": {
      "question": "Which planet does Europa orbit?",
      "choices": ["Mars", "Jupiter", "Saturn"],
      "answer": "Jupiter",
      "explanation": "Europa is a moon of Jupiter."
    }
  }
}
```

Copy the entry into the main JSON object, adding a comma between entries. Entries without a matching discovery are ignored. A learning card appears only on the first visit to a matching destination; it can be dismissed at any time and never blocks flight.
