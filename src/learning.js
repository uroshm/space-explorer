function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isValidLearningQuiz(quiz) {
  return Boolean(
    quiz &&
    typeof quiz.question === 'string' &&
    Array.isArray(quiz.choices) &&
    quiz.choices.length === 3 &&
    quiz.choices.every((choice) => typeof choice === 'string') &&
    quiz.choices.includes(quiz.answer),
  );
}

export function getLearningCardContent(content, destination) {
  const bodyKey = destination.id === 'solar-flyby' ? 'sun' : destination.id;
  const entry = Object.entries(content).find(
    ([name]) =>
      normalize(name) === normalize(bodyKey) ||
      normalize(destination.name).startsWith(normalize(name)),
  )?.[1];
  const fact = typeof entry?.fact === 'string' && entry.fact.trim().length > 0 ? entry.fact : '';
  const quiz = isValidLearningQuiz(entry?.quiz) ? entry.quiz : null;

  return { fact, quiz };
}
