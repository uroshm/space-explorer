# Toma’s Space Ship

A little space-exploration game that began as a father-son project. Our son’s love of space sparked a shared curiosity about visiting the planets and learning something along the way.

## Run the game

Install [Node.js](https://nodejs.org/), then run these commands from the project folder:

```sh
npm install
npm run dev
```

Open the local address printed in the terminal.

## Add your own planet questions

The guide at [`src/data/learning-content.md`](src/data/learning-content.md) has examples. To make a question appear in the game, add it to [`src/data/learning-content.json`](src/data/learning-content.json)—the game reads that file. Use the planet’s name as the entry name. A quiz needs a question, three answer choices, and the correct answer written exactly as one of the choices. You can also add a short explanation or a space fact.

For example, add a `quiz` inside Jupiter’s entry:

```json
"Jupiter": {
  "quiz": {
    "question": "What is Jupiter’s Great Red Spot?",
    "choices": ["A giant storm", "A moon", "A ring"],
    "answer": "A giant storm",
    "explanation": "It is a huge storm in Jupiter’s clouds."
  }
}
```

Write your own questions and answers, or look up ideas on NASA or anywhere else you like.
