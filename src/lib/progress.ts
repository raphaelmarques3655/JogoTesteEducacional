export type Progress = {
  points: number;
  stars: number;
  activities: number;

  letters: number;
  syllables: number;
  words: number;

  practicedLetters: string[];
  practicedSyllables: string[];
  practicedWords: string[];

  usedCombineExercises: string[];
  usedOrganizeExercises: string[];
  usedCompleteExercises: string[];
  usedMathExercises: string[];

  usedWordExercises: string[];
  usedReadingExercises: string[];

  bonusLevelsUnlocked: number;
  bonusLevelsCompleted: number[];

  streak: number;
  badges: string[];

  history: {
    label: string;
    at: number;
    score: number;
  }[];
};

export const initialProgress: Progress = {
  points: 0,
  stars: 0,
  activities: 0,

  letters: 0,
  syllables: 0,
  words: 0,

  practicedLetters: [],
  practicedSyllables: [],
  practicedWords: [],

  usedCombineExercises: [],
  usedOrganizeExercises: [],
  usedCompleteExercises: [],
  usedMathExercises: [],

  usedWordExercises: [],
  usedReadingExercises: [],

  bonusLevelsUnlocked: 0,
  bonusLevelsCompleted: [],

  streak: 1,
  badges: [],
  history: []
};

const KEY = 'alfabetizacao-progress-v2';

export const loadProgress = (): Progress => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(KEY) || '{}'
    );

    return {
      ...initialProgress,
      ...saved,

      practicedLetters: Array.isArray(saved.practicedLetters)
        ? saved.practicedLetters
        : [],

      practicedSyllables: Array.isArray(saved.practicedSyllables)
        ? saved.practicedSyllables
        : [],

      practicedWords: Array.isArray(saved.practicedWords)
        ? saved.practicedWords
        : [],

      usedCombineExercises: Array.isArray(saved.usedCombineExercises)
        ? saved.usedCombineExercises
        : [],

      usedOrganizeExercises: Array.isArray(saved.usedOrganizeExercises)
        ? saved.usedOrganizeExercises
        : [],

      usedCompleteExercises: Array.isArray(saved.usedCompleteExercises)
        ? saved.usedCompleteExercises
        : [],

      usedMathExercises: Array.isArray(saved.usedMathExercises)
        ? saved.usedMathExercises
        : [],

      usedWordExercises: Array.isArray(saved.usedWordExercises)
        ? saved.usedWordExercises
        : [],

      usedReadingExercises: Array.isArray(saved.usedReadingExercises)
        ? saved.usedReadingExercises
        : [],
        bonusLevelsUnlocked:
  typeof saved.bonusLevelsUnlocked === 'number'
    ? saved.bonusLevelsUnlocked
    : 0,

bonusLevelsCompleted: Array.isArray(saved.bonusLevelsCompleted)
  ? saved.bonusLevelsCompleted
  : [],

      history: Array.isArray(saved.history)
        ? saved.history
        : []
    };
  } catch {
    return {
      ...initialProgress,
      practicedLetters: [],
      practicedSyllables: [],
      practicedWords: [],
      usedCombineExercises: [],
      usedOrganizeExercises: [],
      usedCompleteExercises: [],
      usedMathExercises: [],
      usedWordExercises: [],
      usedReadingExercises: [],
      bonusLevelsUnlocked: 0,
      bonusLevelsCompleted: [],
      history: []
    };
  }
};

export const saveProgress = (p: Progress) =>
  localStorage.setItem(KEY, JSON.stringify(p));

export function reward(
  p: Progress,
  label: string,
  score = 10
): Progress {
  const activities = p.activities + 1;
  const points = p.points + score;
  const stars = p.stars + 1;

  const badges = [...p.badges];

  if (
    activities >= 1 &&
    !badges.includes('primeira')
  ) {
    badges.push('primeira');
  }

  if (
    activities >= 10 &&
    !badges.includes('super')
  ) {
    badges.push('super');
  }

  if (
    p.letters >= 9 &&
    !badges.includes('letras')
  ) {
    badges.push('letras');
  }

  return {
    ...p,
    activities,
    points,
    stars,
    badges,
    history: [
      {
        label,
        at: Date.now(),
        score
      },
      ...p.history
    ].slice(0, 30)
  };
}
