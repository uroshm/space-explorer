import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLearningCardContent, isValidLearningQuiz } from '../src/learning.js';

const content = JSON.parse(
  readFileSync(new URL('../src/data/learning-content.json', import.meta.url)),
);

test('learning notes match discoveries by body id and destination name', () => {
  assert.equal(
    getLearningCardContent(content, { id: 'jupiter', name: 'Jupiter approach' }).fact,
    content.Jupiter.fact,
  );
  assert.equal(
    getLearningCardContent(content, { id: 'asteroid-belt', name: 'Asteroid belt survey' }).fact,
    content['Asteroid Belt'].fact,
  );
});

test('Solar flyby uses the Sun note and missing destinations have no card content', () => {
  assert.equal(
    getLearningCardContent(
      { Sun: { fact: 'The Sun is our star.' } },
      {
        id: 'solar-flyby',
        name: 'Solar flyby',
      },
    ).fact,
    'The Sun is our star.',
  );
  assert.deepEqual(getLearningCardContent(content, { id: 'eris', name: 'Eris flyby' }), {
    fact: '',
    quiz: null,
  });
});

test('learning quizzes require three text choices and a matching answer', () => {
  assert.equal(isValidLearningQuiz(content.Jupiter.quiz), true);
  assert.equal(
    isValidLearningQuiz({ question: 'Pick one', choices: ['A', 'B'], answer: 'A' }),
    false,
  );
  assert.equal(
    isValidLearningQuiz({ question: 'Pick one', choices: ['A', 'B', 'C'], answer: 'D' }),
    false,
  );
});
