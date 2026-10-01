import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import PlatformGame from './components/PlatformGame';

import {
  Home,
  BookOpen,
  Gamepad2,
  Trophy,
  User,
  Volume2,
  ArrowLeft,
  Star,
  ShieldCheck,
  ClipboardCheck,
  BarChart3,
  Pencil,
  RefreshCw,
  Lock,
  KeyRound,
  Trash2
} from 'lucide-react';

import Canvas, { type CanvasHandle } from './components/Canvas';
import {
  letters,
  syllables,
  wordQuestions,
  readingQuestions
} from './data/content';

import {
  findLetterPool,
  letterWords,
  combineGames,
  organizeWords,
  completeWordGames,
  mathGames,
  type MathGame
} from './data/exercises';

import {
  initialProgress,
  reward,
  type Progress
} from './lib/progress';

type Page =
  | 'role'
  | 'teacher-login'
  | 'students'
  | 'assessment'
  | 'home'
  | 'learn'
  | 'letters'
  | 'syllables'
  | 'words'
  | 'reading'
  | 'writing'
  | 'games'
  | 'math'
  | 'achievements'
  | 'profile'
  | 'adult'
  | 'bonus-levels'
  | 'bonus-game';

type Level =
  | 'Garatuja'
  | 'Pré-silábico'
  | 'Silábico sem valor'
  | 'Silábico com valor'
  | 'Silábico-Alfabético'
  | 'Alfabético';

const LEVELS: Level[] = [
  'Garatuja',
  'Pré-silábico',
  'Silábico sem valor',
  'Silábico com valor',
  'Silábico-Alfabético',
  'Alfabético'
];

type LiteracyGameId = 1 | 2 | 3 | 4;

const UNLOCKED_MODULES_BY_LEVEL: Record<Level, Page[]> = {
  'Garatuja': [
    'letters',
    'writing',
    'math'
  ],

  'Pré-silábico': [
    'letters',
    'writing',
    'words',
    'math'
  ],

  'Silábico sem valor': [
    'letters',
    'syllables',
    'words',
    'writing',
    'math'
  ],

  'Silábico com valor': [
    'letters',
    'syllables',
    'words',
    'writing',
    'math'
  ],

  'Silábico-Alfabético': [
    'letters',
    'syllables',
    'words',
    'reading',
    'writing',
    'math'
  ],

  'Alfabético': [
    'letters',
    'syllables',
    'words',
    'reading',
    'writing',
    'math'
  ]
};

const UNLOCKED_GAMES_BY_LEVEL: Record<Level, LiteracyGameId[]> = {
  'Garatuja': [1],

  'Pré-silábico': [1, 2],

  'Silábico sem valor': [1, 2, 4],

  'Silábico com valor': [1, 2, 4],

  'Silábico-Alfabético': [1, 2, 3, 4],

  'Alfabético': [1, 2, 3, 4]
};

type Student = {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
};
const isPhotoAvatar = (avatar: string) =>
  avatar.startsWith('data:image/');

function StudentAvatar({
  avatar,
  size = 72
}: {
  avatar: string;
  size?: number;
}) {
  if (isPhotoAvatar(avatar)) {
    return (
      <img
        src={avatar}
        alt="Foto do aluno"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '4px solid white',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
        }}
      />
    );
  }

  return (
    <span
      style={{
        fontSize: `${size}px`
      }}
    >
      {avatar}
    </span>
  );
}

type LevelHistoryEntry = {
  level: Level;
  at: string;
  source: 'sondagem' | 'sistema' | 'professor';
};

type LearningState = {
  assessmentCompleted: boolean;
  assessmentScore: number;
  initialLevel: Level | null;
  suggestedLevel: Level | null;
  manualLevel: Level | null;
  correctAnswers: number;
  wrongAnswers: number;
  totalAttempts: number;
  updatedAt: string | null;
  levelHistory: LevelHistoryEntry[];
};

const STUDENTS_KEY = 'alfabetizacao-students';
const API_URL = `http://${window.location.hostname}:3001/api`;
const TEACHER_PASSWORD_KEY = 'alfabetizacao-teacher-password';
const DEFAULT_TEACHER_PASSWORD = '1234';

const loadTeacherPassword = () =>
  localStorage.getItem(TEACHER_PASSWORD_KEY) ??
  DEFAULT_TEACHER_PASSWORD;

const saveTeacherPassword = (password: string) => {
  localStorage.setItem(TEACHER_PASSWORD_KEY, password);
};

const cloneInitialProgress = (): Progress =>
  JSON.parse(JSON.stringify(initialProgress)) as Progress;

const initialLearningState: LearningState = {
  assessmentCompleted: false,
  assessmentScore: 0,
  initialLevel: null,
  suggestedLevel: null,
  manualLevel: null,
  correctAnswers: 0,
  wrongAnswers: 0,
  totalAttempts: 0,
  updatedAt: null,
  levelHistory: []
};

const studentProgressKey = (id: string) =>
  `alfabetizacao-progress-${id}`;

const studentLearningKey = (id: string) =>
  `alfabetizacao-learning-${id}`;

const loadStudents = (): Student[] => {
  try {
    const saved = localStorage.getItem(STUDENTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const loadStudentProgressLocal = (id: string): Progress => {
  try {
    const saved = localStorage.getItem(studentProgressKey(id));

    if (!saved) {
      return cloneInitialProgress();
    }

    const parsed = JSON.parse(saved);

    return {
      ...cloneInitialProgress(),
      ...parsed,
      practicedLetters: Array.isArray(parsed.practicedLetters)
        ? parsed.practicedLetters
        : [],
      practicedSyllables: Array.isArray(parsed.practicedSyllables)
        ? parsed.practicedSyllables
        : [],
      practicedWords: Array.isArray(parsed.practicedWords)
        ? parsed.practicedWords
        : [],
      usedCombineExercises: Array.isArray(parsed.usedCombineExercises)
        ? parsed.usedCombineExercises
        : [],
      usedOrganizeExercises: Array.isArray(parsed.usedOrganizeExercises)
        ? parsed.usedOrganizeExercises
        : [],
      usedCompleteExercises: Array.isArray(parsed.usedCompleteExercises)
        ? parsed.usedCompleteExercises
        : [],
      usedMathExercises: Array.isArray(parsed.usedMathExercises)
        ? parsed.usedMathExercises
        : [],
      usedWordExercises: Array.isArray(parsed.usedWordExercises)
        ? parsed.usedWordExercises
        : [],
      usedReadingExercises: Array.isArray(parsed.usedReadingExercises)
        ? parsed.usedReadingExercises
        : [],
      history: Array.isArray(parsed.history)
        ? parsed.history
        : []
    };
  } catch {
    return cloneInitialProgress();
  }
};

const loadLearningStateLocal = (id: string): LearningState => {
  try {
    const saved = localStorage.getItem(studentLearningKey(id));
    if (!saved) {
      return { ...initialLearningState, levelHistory: [] };
    }

    const parsed = JSON.parse(saved);

    return {
      ...initialLearningState,
      ...parsed,
      levelHistory: Array.isArray(parsed.levelHistory)
        ? parsed.levelHistory
        : []
    };
  } catch {
    return { ...initialLearningState, levelHistory: [] };
  }
};

const loadStudentProgress = async (id: string): Promise<Progress> => {
  try {
    const response = await fetch(`${API_URL}/progresso/${id}`);

    if (!response.ok) {
      throw new Error('Erro ao carregar progresso');
    }

    const data = await response.json();

    if (data) {
      return {
        ...cloneInitialProgress(),
        ...data,
        practicedLetters: Array.isArray(data.practicedLetters)
          ? data.practicedLetters
          : [],
        practicedSyllables: Array.isArray(data.practicedSyllables)
          ? data.practicedSyllables
          : [],
        practicedWords: Array.isArray(data.practicedWords)
          ? data.practicedWords
          : [],
        usedCombineExercises: Array.isArray(data.usedCombineExercises)
          ? data.usedCombineExercises
          : [],
        usedOrganizeExercises: Array.isArray(data.usedOrganizeExercises)
          ? data.usedOrganizeExercises
          : [],
        usedCompleteExercises: Array.isArray(data.usedCompleteExercises)
          ? data.usedCompleteExercises
          : [],
        usedMathExercises: Array.isArray(data.usedMathExercises)
          ? data.usedMathExercises
          : [],
        usedWordExercises: Array.isArray(data.usedWordExercises)
          ? data.usedWordExercises
          : [],
        usedReadingExercises: Array.isArray(data.usedReadingExercises)
          ? data.usedReadingExercises
          : [],
          bonusLevelsUnlocked:
  typeof data.bonusLevelsUnlocked === 'number'
    ? data.bonusLevelsUnlocked
    : 0,

bonusLevelsCompleted: Array.isArray(data.bonusLevelsCompleted)
  ? data.bonusLevelsCompleted
  : [],
          bonusLevelsUnlocked:
  typeof parsed.bonusLevelsUnlocked === 'number'
    ? parsed.bonusLevelsUnlocked
    : 0,

bonusLevelsCompleted: Array.isArray(parsed.bonusLevelsCompleted)
  ? parsed.bonusLevelsCompleted
  : [],
  
        history: Array.isArray(data.history) ? data.history : []
      };
    }

    // Migra automaticamente o progresso antigo salvo no navegador do host.
    const localProgress = loadStudentProgressLocal(id);
    await saveStudentProgress(id, localProgress);
    return localProgress;
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    return loadStudentProgressLocal(id);
  }
};

const saveStudentProgress = async (id: string, state: Progress) => {
  try {
    const response = await fetch(`${API_URL}/progresso/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar progresso');
    }
  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
  }
};

const loadLearningState = async (id: string): Promise<LearningState> => {
  try {
    const response = await fetch(`${API_URL}/aprendizagem/${id}`);

    if (!response.ok) {
      throw new Error('Erro ao carregar aprendizagem');
    }

    const data = await response.json();

    if (data) {
      return {
        ...initialLearningState,
        ...data,
        levelHistory: Array.isArray(data.levelHistory)
          ? data.levelHistory
          : []
      };
    }

    // Migra automaticamente sondagem/nível antigos do localStorage do host.
    const localLearning = loadLearningStateLocal(id);
    await saveLearningState(id, localLearning);
    return localLearning;
  } catch (error) {
    console.error('Erro ao buscar aprendizagem:', error);
    return loadLearningStateLocal(id);
  }
};

const saveLearningState = async (id: string, state: LearningState) => {
  try {
    const response = await fetch(`${API_URL}/aprendizagem/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar aprendizagem');
    }
  } catch (error) {
    console.error('Erro ao salvar aprendizagem:', error);
  }
};

const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.82;
    speechSynthesis.speak(utterance);
  }
};

const pct = (n: number, max: number) =>
  Math.min(100, Math.round((n / Math.max(max, 1)) * 100));

const levelIndex = (level: Level | null) =>
  level ? Math.max(0, LEVELS.indexOf(level)) : 0;

const levelFromAssessmentScore = (score: number): Level => {
  if (score <= 0) return 'Garatuja';
  if (score === 1) return 'Pré-silábico';
  if (score === 2) return 'Silábico sem valor';
  if (score === 3) return 'Silábico com valor';
  if (score === 4) return 'Silábico-Alfabético';
  return 'Alfabético';
};

const calculateSuggestedLevel = (
  state: LearningState,
  progress: Progress
): Level | null => {
  if (!state.assessmentCompleted || !state.initialLevel) return null;

  const base = levelIndex(state.initialLevel);
  const attempts = state.totalAttempts;
  const accuracy =
    attempts > 0 ? state.correctAnswers / attempts : 0;

  const lettersRate = progress.letters / 26;
  const syllablesRate = progress.syllables / 75;
  const wordsRate = progress.words / 25;

  let activityLevel = base;

  if (progress.activities >= 3 && lettersRate >= 0.15) {
    activityLevel = Math.max(activityLevel, 1);
  }

  if (
    progress.activities >= 6 &&
    lettersRate >= 0.3 &&
    accuracy >= 0.5
  ) {
    activityLevel = Math.max(activityLevel, 2);
  }

  if (
    progress.activities >= 10 &&
    syllablesRate >= 0.12 &&
    accuracy >= 0.55
  ) {
    activityLevel = Math.max(activityLevel, 3);
  }

  if (
    progress.activities >= 16 &&
    wordsRate >= 0.2 &&
    accuracy >= 0.65
  ) {
    activityLevel = Math.max(activityLevel, 4);
  }

  if (
    progress.activities >= 24 &&
    wordsRate >= 0.4 &&
    accuracy >= 0.75
  ) {
    activityLevel = Math.max(activityLevel, 5);
  }

  if (attempts >= 10 && accuracy < 0.35) {
    activityLevel = Math.max(0, activityLevel - 1);
  }

  return LEVELS[Math.min(5, activityLevel)];
};

const getCurrentLevel = (state: LearningState): Level | null =>
  state.manualLevel ?? state.suggestedLevel ?? state.initialLevel;


const addLevelHistory = (
  history: LevelHistoryEntry[],
  level: Level,
  source: LevelHistoryEntry['source']
): LevelHistoryEntry[] => {
  const last = history[history.length - 1];

  if (last?.level === level && last?.source === source) {
    return history;
  }

  return [
    ...history,
    {
      level,
      source,
      at: new Date().toISOString()
    }
  ].slice(-40);
};

export default function App() {
  const [page, setPage] = useState<Page>('role');

  const [selectedBonusLevel, setSelectedBonusLevel] = useState(1);

  const [students, setStudents] = useState<Student[]>([]);

  const [activeStudentId, setActiveStudentId] =
    useState<string | null>(null);

  const [teacherSelectedId, setTeacherSelectedId] =
    useState<string | null>(null);

  const [teacherRefresh, setTeacherRefresh] = useState(0);
  void teacherRefresh;

  const [progress, setProgress] =
    useState<Progress>(cloneInitialProgress());

  const [learning, setLearning] =
    useState<LearningState>({ ...initialLearningState });

  const [teacherProgress, setTeacherProgress] =
    useState<Progress | null>(null);

  const [teacherLearning, setTeacherLearning] =
    useState<LearningState | null>(null);

  const [name, setName] = useState('Aluno');
  const [avatar, setAvatar] = useState('🧒');


  useEffect(() => {
    if (!activeStudentId) return;
    void saveStudentProgress(activeStudentId, progress);

    if (teacherSelectedId === activeStudentId) {
      setTeacherProgress(progress);
    }
  }, [progress, activeStudentId, teacherSelectedId]);

  useEffect(() => {
    if (!activeStudentId) return;

    setLearning((current) => {
      if (!current.assessmentCompleted) return current;

      const suggested = calculateSuggestedLevel(current, progress);

      if (suggested === current.suggestedLevel) {
        return current;
      }

      const next = {
        ...current,
        suggestedLevel: suggested,
        updatedAt: new Date().toISOString(),
        levelHistory:
          suggested
            ? addLevelHistory(
              current.levelHistory ?? [],
              suggested,
              'sistema'
            )
            : current.levelHistory ?? []
      };

      void saveLearningState(activeStudentId, next);
      return next;
    });
  }, [progress, activeStudentId]);

  useEffect(() => {
    if (!activeStudentId) return;
    void saveLearningState(activeStudentId, learning);

    if (teacherSelectedId === activeStudentId) {
      setTeacherLearning(learning);
    }
  }, [learning, activeStudentId, teacherSelectedId]);

  useEffect(() => {
    if (!teacherSelectedId) {
      setTeacherProgress(null);
      setTeacherLearning(null);
      return;
    }

    let cancelled = false;

    const carregarDadosProfessor = async () => {
      const [progressData, learningData] = await Promise.all([
        loadStudentProgress(teacherSelectedId),
        loadLearningState(teacherSelectedId)
      ]);

      if (cancelled) return;

      setTeacherProgress(progressData);
      setTeacherLearning(learningData);
    };

    void carregarDadosProfessor();

    return () => {
      cancelled = true;
    };
  }, [teacherSelectedId, teacherRefresh]);

  useEffect(() => {
    const carregarAlunos = async () => {
      try {
        const response = await fetch(`${API_URL}/alunos`);

        if (!response.ok) {
          throw new Error('Erro ao carregar alunos');
        }

        const data = await response.json();

        const alunosConvertidos: Student[] = data.map(
          (aluno: any) => ({
            id: aluno.id,
            name: aluno.name ?? aluno.nome ?? '',
            avatar: aluno.avatar ?? '🧒',
            createdAt:
              aluno.createdAt ??
              aluno.criadoEm ??
              new Date().toISOString()
          })
        );

        setStudents(alunosConvertidos);
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
      }
    };

    carregarAlunos();
  }, []);

  const selectStudent = async (student: Student) => {
    const [savedProgress, savedLearning] = await Promise.all([
      loadStudentProgress(student.id),
      loadLearningState(student.id)
    ]);

    setName(student.name);
    setAvatar(student.avatar);
    setProgress(savedProgress);
    setLearning(savedLearning);
    setActiveStudentId(student.id);

    if (savedLearning.assessmentCompleted) {
      setPage('home');
    } else {
      setPage('assessment');
    }
  };

  const addStudent = async (
    studentName: string,
    studentAvatar: string
  ) => {
    const cleanName = studentName.trim();

    if (!cleanName) return false;

    try {
      const response = await fetch(`${API_URL}/alunos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: cleanName,
          avatar: studentAvatar
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao cadastrar aluno');
      }

      const alunoServidor = await response.json();

      const newStudent: Student = {
        id: alunoServidor.id,
        name:
          alunoServidor.name ??
          alunoServidor.nome ??
          cleanName,
        avatar:
          alunoServidor.avatar ??
          studentAvatar,
        createdAt:
          alunoServidor.createdAt ??
          alunoServidor.criadoEm ??
          new Date().toISOString()
      };

      setStudents((current) => [
        ...current,
        newStudent
      ]);

      await Promise.all([
        saveStudentProgress(newStudent.id, cloneInitialProgress()),
        saveLearningState(newStudent.id, {
          ...initialLearningState,
          levelHistory: []
        })
      ]);

      return true;

    } catch (error) {
      console.error('Erro ao cadastrar aluno:', error);
      return false;
    }
  };

  const updateStudentAvatar = async (
    studentId: string,
    newAvatar: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(
        `${API_URL}/alunos/${studentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            avatar: newAvatar
          })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar foto do aluno');
      }

      const alunoServidor = await response.json();

      const updatedStudent: Student = {
        id: String(alunoServidor.id ?? studentId),
        name:
          alunoServidor.name ??
          alunoServidor.nome ??
          students.find((student) => student.id === studentId)?.name ??
          '',
        avatar:
          alunoServidor.avatar ??
          newAvatar,
        createdAt:
          alunoServidor.createdAt ??
          alunoServidor.criadoEm ??
          students.find((student) => student.id === studentId)?.createdAt ??
          new Date().toISOString()
      };

      setStudents((current) =>
        current.map((student) =>
          student.id === studentId
            ? updatedStudent
            : student
        )
      );

      if (activeStudentId === studentId) {
        setAvatar(updatedStudent.avatar);
      }

      return true;
    } catch (error) {
      console.error(
        'Erro ao atualizar foto do aluno:',
        error
      );
      return false;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const response = await fetch(
        `${API_URL}/alunos/${id}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir aluno');
      }

      setStudents((current) =>
        current.filter((student) => student.id !== id)
      );

      if (teacherSelectedId === id) {
        setTeacherSelectedId(null);
      }

      if (activeStudentId === id) {
        setActiveStudentId(null);
        setLearning({ ...initialLearningState });
        setProgress(cloneInitialProgress());
      }

    } catch (error) {
      console.error('Erro ao excluir aluno:', error);
    }
  };

  const updateTeacherLevel = async (
    studentId: string,
    level: Level | null
  ) => {
    const current = await loadLearningState(studentId);

    const next: LearningState = {
      ...current,
      manualLevel: level,
      updatedAt: new Date().toISOString(),
      levelHistory:
        level
          ? addLevelHistory(
            current.levelHistory ?? [],
            level,
            'professor'
          )
          : current.levelHistory ?? []
    };

    await saveLearningState(studentId, next);
    setTeacherLearning(next);

    if (activeStudentId === studentId) {
      setLearning(next);
    }

    setTeacherRefresh((current) => current + 1);
  };

  const clearStudentActivityHistory = async (studentId: string) => {
    const currentProgress = await loadStudentProgress(studentId);

    const nextProgress: Progress = {
      ...currentProgress,
      history: []
    };

    await saveStudentProgress(studentId, nextProgress);
    setTeacherProgress(nextProgress);

    if (activeStudentId === studentId) {
      setProgress(nextProgress);
    }

    setTeacherRefresh((current) => current + 1);
  };

  const changeTeacherPassword = (
    currentPassword: string,
    newPassword: string
  ): { ok: boolean; message: string } => {
    if (currentPassword !== loadTeacherPassword()) {
      return {
        ok: false,
        message: 'A senha atual está incorreta.'
      };
    }

    const cleanPassword = newPassword.trim();

    if (cleanPassword.length < 4) {
      return {
        ok: false,
        message: 'A nova senha precisa ter pelo menos 4 caracteres.'
      };
    }

    saveTeacherPassword(cleanPassword);

    return {
      ok: true,
      message: 'Senha alterada com sucesso! ✅'
    };
  };

  const registerAttempt = (correct: boolean) => {
    if (!activeStudentId) return;

    setLearning((current) => {
      const next: LearningState = {
        ...current,
        correctAnswers:
          current.correctAnswers + (correct ? 1 : 0),
        wrongAnswers:
          current.wrongAnswers + (correct ? 0 : 1),
        totalAttempts: current.totalAttempts + 1,
        updatedAt: new Date().toISOString()
      };

      const suggested =
        calculateSuggestedLevel(next, progress);

      if (
        suggested &&
        suggested !== current.suggestedLevel
      ) {
        next.levelHistory = addLevelHistory(
          next.levelHistory ?? [],
          suggested,
          'sistema'
        );
      }

      next.suggestedLevel = suggested;

      void saveLearningState(activeStudentId, next);
      return next;
    });
  };

  const complete = (
  label: string,
  score = 10,
  kind?: 'letters' | 'syllables' | 'words',
  item?: string,
  affectsLiteracy = true
) => {
  if (affectsLiteracy) {
    registerAttempt(true);
  }

  setProgress((p) => {
    let next: Progress = {
      ...p,

      practicedLetters: Array.isArray(p.practicedLetters)
        ? [...p.practicedLetters]
        : [],

      practicedSyllables: Array.isArray(p.practicedSyllables)
        ? [...p.practicedSyllables]
        : [],

      practicedWords: Array.isArray(p.practicedWords)
        ? [...p.practicedWords]
        : []
    };

    if (kind && item) {
      const normalizedItem =
        item.trim().toUpperCase();

      if (kind === 'letters') {
        const alreadyPracticed =
          next.practicedLetters.includes(
            normalizedItem
          );

        if (!alreadyPracticed) {
          next.practicedLetters = [
            ...next.practicedLetters,
            normalizedItem
          ];
        }

        next.letters =
          next.practicedLetters.length;
      }

      if (kind === 'syllables') {
        const alreadyPracticed =
          next.practicedSyllables.includes(
            normalizedItem
          );

        if (!alreadyPracticed) {
          next.practicedSyllables = [
            ...next.practicedSyllables,
            normalizedItem
          ];
        }

        next.syllables =
          next.practicedSyllables.length;
      }

      if (kind === 'words') {
        const alreadyPracticed =
          next.practicedWords.includes(
            normalizedItem
          );

        if (!alreadyPracticed) {
          next.practicedWords = [
            ...next.practicedWords,
            normalizedItem
          ];
        }

        next.words =
          next.practicedWords.length;
      }
    }

    const rewarded = reward(next, label, score);

    return {
      ...rewarded,
      bonusLevelsUnlocked:
        affectsLiteracy
          ? Math.min(
              20,
              Math.max(
                rewarded.bonusLevelsUnlocked ?? 0,
                rewarded.activities
              )
            )
          : rewarded.bonusLevelsUnlocked ?? 0
    };
  });

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.65 }
  });
};

  const completeBonusLevel = (level: number) => {
  setProgress((current) => {
    const completed =
      Array.isArray(current.bonusLevelsCompleted)
        ? current.bonusLevelsCompleted
        : [];

    if (completed.includes(level)) {
      return current;
    }

    return {
      ...current,
      bonusLevelsCompleted: [
        ...completed,
        level
      ]
    };
  });

  confetti({
    particleCount: 140,
    spread: 100,
    origin: { y: 0.6 }
  });

  setPage('home');
};

  const wrong = (affectsLiteracy = true) => {
    if (affectsLiteracy) registerAttempt(false);
  };

  const finishAssessment = (score: number) => {
    if (!activeStudentId) return;

    const initialLevel = levelFromAssessmentScore(score);

    const next: LearningState = {
      ...learning,
      assessmentCompleted: true,
      assessmentScore: score,
      initialLevel,
      suggestedLevel: initialLevel,
      manualLevel: null,
      updatedAt: new Date().toISOString(),
      levelHistory: addLevelHistory(
        learning.levelHistory ?? [],
        initialLevel,
        'sondagem'
      )
    };

    setLearning(next);
    void saveLearningState(activeStudentId, next);
    setPage('home');
  };

  const speakCurrentPage = () => {
    const messages: Partial<Record<Page, string>> = {
      home: `Olá, ${name}! Vamos aprender brincando? Você pode escolher começar a aprender ou continuar nos jogos.`,
      learn: 'Escolha uma atividade. Você pode aprender letras, sílabas, palavras, leitura ou escrita.',
      letters: 'Nesta atividade, observe a letra, escute o som e veja uma palavra que começa com ela.',
      syllables: 'Nesta atividade, escute a sílaba e tente repetir em voz alta.',
      words: 'Olhe a imagem e escolha a letra que completa a palavra.',
      reading: 'Olhe a imagem e escolha a palavra correta.',
      writing: 'Passe o dedo ou o mouse por cima da letra e depois aperte em avaliar escrita.',
      games: 'Escolha um dos jogos. Você pode encontrar letras, combinar imagens com palavras ou organizar uma palavra.',
      achievements: 'Aqui estão suas conquistas e recompensas pelas atividades concluídas.',
      profile: `Este é o seu perfil, ${name}. Aqui você pode ver suas estrelas, pontos e atividades concluídas.`
    };

    speak(messages[page] ?? 'Vamos aprender juntos!');
  };

  if (page === 'role') {
    return (
      <RoleSelection
        onStudent={() => setPage('students')}
        onTeacher={() => {
          setTeacherSelectedId(null);
          setPage('teacher-login');
        }}
      />
    );
  }

  if (page === 'teacher-login') {
    return (
      <TeacherLogin
        onSuccess={() => setPage('adult')}
        onBack={() => setPage('role')}
      />
    );
  }

  if (page === 'students') {
    return (
      <StudentSelection
        students={students}
        onSelect={selectStudent}
        onBack={() => setPage('role')}
      />
    );
  }

  if (page === 'assessment') {
    return (
      <InitialAssessment
        name={name}
        onFinish={finishAssessment}
        onBack={() => setPage('students')}
      />
    );
  }

  if (page === 'adult') {
    const selectedStudent =
      students.find(
        (student) => student.id === teacherSelectedId
      ) || null;

    const selectedProgress = selectedStudent
      ? teacherProgress
      : null;

    const selectedLearning = selectedStudent
      ? teacherLearning
      : null;

    return (
      <TeacherArea
        students={students}
        selectedStudent={selectedStudent}
        selectedProgress={selectedProgress}
        selectedLearning={selectedLearning}
        onAddStudent={addStudent}
        onDeleteStudent={deleteStudent}
        onUpdateStudentAvatar={updateStudentAvatar}
        onViewStudent={(student) =>
          setTeacherSelectedId(student.id)
        }
        onChangeLevel={updateTeacherLevel}
        onClearActivityHistory={clearStudentActivityHistory}
        onChangePassword={changeTeacherPassword}
        onBack={() => setPage('role')}
      />
    );
  }

  const nav = [
  ['home', Home, 'Início'],
  ['learn', BookOpen, 'Aprender'],
  ['games', Gamepad2, 'Jogos'],
  ['bonus-levels', Gamepad2, 'Bônus'],
  ['achievements', Trophy, 'Conquistas'],
  ['profile', User, 'Perfil']
] as const;

  return (
    <div
      className="app student-area"
      style={{ textTransform: 'uppercase' }}
    >
      <header>
        <button
          className="brand"
          onClick={() => setPage('home')}
        >
          <span>🌈</span>
          <b>Alfabetiza+</b>
        </button>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button
            className="audio"
            onClick={speakCurrentPage}
            title="Ouvir instruções desta tela"
          >
            <Volume2 size={18} />
            Ouvir tela
          </button>

          <div className="score">
            <Star size={18} />
            {progress.stars}
            <b>⭐</b>
            <span>{progress.points} pts</span>
          </div>
        </div>
      </header>

      <main>
  {page !== 'home' && (
    <button
      className="back"
      onClick={() => setPage('home')}
    >
      <ArrowLeft />
      Voltar
    </button>
  )}

  {page === 'home' && (
    <HomePage
      name={name}
      avatar={avatar}
      progress={progress}
      learning={learning}
      go={setPage}
    />
  )}

  {page === 'learn' && (
    <Learn
      go={setPage}
      learning={learning}
    />
  )}

  {page === 'letters' && (
    <Letters
      complete={complete}
      wrong={wrong}
    />
  )}

  {page === 'syllables' && (
    <Syllables
      complete={complete}
      wrong={wrong}
    />
  )}

  {page === 'words' && (
    <Quiz
      title="🧩 Forme a palavra"
      questions={wordQuestions}
      progress={progress}
      setProgress={setProgress}
      complete={(word) =>
        complete(
          `Formação da palavra ${word}`,
          15,
          'words',
          word
        )
      }
      wrong={wrong}
    />
  )}

  {page === 'reading' && (
    <Reading
      progress={progress}
      setProgress={setProgress}
      complete={(word) =>
        complete(
          `Leitura da palavra ${word}`,
          15,
          'words',
          word
        )
      }
      wrong={wrong}
    />
  )}

  {page === 'writing' && (
    <Writing
      complete={(letter) =>
        complete(
          `Escrita da letra ${letter}`,
          12,
          'letters',
          letter
        )
      }
      wrong={wrong}
    />
  )}

  {page === 'games' && (
    <Games
      learning={learning}
      progress={progress}
      setProgress={setProgress}
      complete={complete}
      wrong={wrong}
      completeMath={(label, score) =>
        complete(
          label,
          score,
          undefined,
          undefined,
          false
        )
      }
      wrongMath={() => wrong(false)}
    />
  )}

  {page === 'math' && (
    <MathLearningGame
      progress={progress}
      setProgress={setProgress}
      complete={() =>
        complete(
          'Matemática',
          12,
          undefined,
          undefined,
          false
        )
      }
      wrong={() => wrong(false)}
    />
  )}

  {page === 'bonus-levels' && (
    <BonusLevelSelection
      progress={progress}
      onPlay={(level) => {
        setSelectedBonusLevel(level);
        setPage('bonus-game');
      }}
    />
  )}

  {page === 'bonus-game' && (
    <PlatformGame
      level={selectedBonusLevel}
      onComplete={() =>
        completeBonusLevel(selectedBonusLevel)
      }
      onExit={() =>
        setPage('bonus-levels')
      }
    />
  )}

  {page === 'achievements' && (
    <Achievements progress={progress} />
  )}

  {page === 'profile' && (
    <Profile
      name={name}
      avatar={avatar}
      progress={progress}
      learning={learning}
      go={setPage}
    />
  )}
</main>

<nav>
  {nav.map(([p, Icon, label]) => (
    <button
      className={page === p ? 'active' : ''}
      onClick={() => setPage(p as Page)}
      key={p}
    >
      <Icon />
      <span>{label}</span>
    </button>
  ))}
</nav>
    </div>
  );
}

  function BonusLevelSelection({
  progress,
  onPlay
}: {
  progress: Progress;
  onPlay: (level: number) => void;
}) {
  const unlocked =
    progress.bonusLevelsUnlocked ?? 0;

  const completed =
    progress.bonusLevelsCompleted ?? [];

  return (
    <section>
      <h1>🎮 Fases Bônus</h1>

      <p className="instruction">
        Complete atividades para desbloquear novas fases!
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginTop: '25px'
        }}
      >
        {Array.from(
          { length: 20 },
          (_, index) => index + 1
        ).map((level) => {
          const available =
            level <= unlocked;

          const done =
            completed.includes(level);

          return (
            <button
              key={level}
              disabled={!available}
              onClick={() =>
                available && onPlay(level)
              }
              style={{
                padding: '25px',
                borderRadius: '18px',
                border: 'none',
                cursor:
                  available
                    ? 'pointer'
                    : 'not-allowed',
                opacity:
                  available
                    ? 1
                    : 0.45,
                fontSize: '18px',
                fontWeight: 800
              }}
            >
              {done
                ? `✅ FASE ${level}`
                : available
                  ? `🎮 FASE ${level}`
                  : `🔒 FASE ${level}`}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ===========================
   ESCOLHA DE PERFIL
=========================== */

function RoleSelection({
  onStudent,
  onTeacher
}: {
  onStudent: () => void;
  onTeacher: () => void;
}) {
  return (
    <div
      className="app role-area"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textTransform: 'uppercase'
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '900px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '64px' }}>🌈📚</div>

        <h1>Alfabetiza+</h1>

        <p className="instruction">
          Escolha como você deseja entrar.
        </p>

        <button
          className="audio"
          onClick={() =>
            speak(
              'Bem-vindo ao Alfabetiza+. Se você é aluno, aperte em Entrar como Aluno. Se você é professor, aperte em Entrar como Professor.'
            )
          }
          style={{ margin: '10px auto 0' }}
        >
          <Volume2 />
          Ouvir instruções
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '32px'
          }}
        >
          <button
            className="module role-card"
            onClick={onStudent}
            style={{
              minHeight: '260px',
              cursor: 'pointer',
              padding: '28px'
            }}
          >
            <span style={{ fontSize: '72px' }}>🧒</span>
            <b style={{ fontSize: '28px' }}>
              Entrar como Aluno
            </b>
            <small style={{ fontSize: '16px' }}>
              Faça a sondagem inicial e comece a aprender.
            </small>
          </button>

          <button
            className="module role-card"
            onClick={onTeacher}
            style={{
              minHeight: '260px',
              cursor: 'pointer',
              padding: '28px'
            }}
          >
            <span style={{ fontSize: '72px' }}>👩‍🏫</span>
            <b style={{ fontSize: '28px' }}>
              Entrar como Professor
            </b>
            <small style={{ fontSize: '16px' }}>
              Cadastre alunos, acompanhe níveis e progresso.
            </small>
          </button>
        </div>
      </section>
    </div>
  );
}


/* ===========================
   LOGIN DO PROFESSOR
=========================== */

function TeacherLogin({
  onSuccess,
  onBack
}: {
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const enter = () => {
    if (password === loadTeacherPassword()) {
      setMessage('');
      onSuccess();
      return;
    }

    setMessage('Senha incorreta. Tente novamente.');
  };

  return (
    <div className="app teacher-login-area">
      <section className="teacher-login-card">
        <button className="back" onClick={onBack}>
          <ArrowLeft />
          Voltar
        </button>

        <div className="teacher-login-icon">
          <Lock size={34} />
        </div>

        <h1>Área do Professor</h1>

        <p>
          Digite a senha para acessar os dados pedagógicos dos
          alunos.
        </p>

        <label className="teacher-login-label">
          Senha
          <div className="teacher-password-field">
            <KeyRound size={20} />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') enter();
              }}
              placeholder="Digite a senha"
              autoFocus
            />
          </div>
        </label>

        <button className="primary" onClick={enter}>
          <Lock size={18} />
          Entrar
        </button>

        {message && <p className="teacher-login-error">{message}</p>}

        <small className="teacher-login-help">
          A senha inicial do sistema é <b>1234</b>. Depois de
          entrar, o professor pode alterá-la no painel.
        </small>
      </section>
    </div>
  );
}

/* ===========================
   ESCOLHA DO ALUNO
=========================== */

function StudentSelection({
  students,
  onSelect,
  onBack
}: {
  students: Student[];
  onSelect: (student: Student) => void;
  onBack: () => void;
}) {
  return (
    <div
      className="app student-area student-select-area"
      style={{
        minHeight: '100vh',
        padding: '24px',
        textTransform: 'uppercase'
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: '0 auto'
        }}
      >
        <button className="back" onClick={onBack}>
          <ArrowLeft />
          Voltar
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px' }}>🎒✨</div>
          <h1>Quem vai aprender hoje?</h1>
          <p className="instruction">
            Escolha o seu nome para entrar no seu perfil.
          </p>

          <button
            className="audio"
            onClick={() =>
              speak(
                students.length === 0
                  ? 'Ainda não há alunos cadastrados. Peça para o professor cadastrar um aluno primeiro.'
                  : 'Escolha o seu nome ou o seu desenho para entrar e começar a aprender.'
              )
            }
            style={{ margin: '10px auto 0' }}
          >
            <Volume2 />
            Ouvir instruções
          </button>
        </div>

        {students.length === 0 ? (
          <div
            className="gameCard"
            style={{
              maxWidth: '620px',
              margin: '32px auto',
              textAlign: 'center',
              padding: '32px'
            }}
          >
            <div style={{ fontSize: '54px' }}>👩‍🏫</div>
            <h3>Nenhum aluno cadastrado</h3>
            <p>
              Peça para a professora cadastrar um aluno
              antes de entrar.
            </p>

            <button
              className="audio"
              onClick={() =>
                speak(
                  'Nenhum aluno foi cadastrado ainda. Peça para o professor cadastrar seu perfil.'
                )
              }
            >
              <Volume2 />
              Ouvir
            </button>
          </div>
        ) : (
          <div className="grid" style={{ marginTop: '32px' }}>
            {students.map((student) => (
              <button
                className="module student-card"
                key={student.id}
                onClick={() => onSelect(student)}
                style={{
                  minHeight: '220px',
                  cursor: 'pointer'
                }}
              >
                <StudentAvatar
                  avatar={student.avatar}
                  size={96}
                />

                <b style={{ fontSize: '25px' }}>
                  {student.name}
                </b>

                <small>
                  Toque aqui para entrar
                </small>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ===========================
   SONDAGEM INICIAL
=========================== */

const assessmentQuestions = [
  {
    title: 'Qual destes é uma letra?',
    emoji: '🔤',
    options: ['A', '🚗', '⭐'],
    answer: 'A'
  },
  {
    title: 'Qual opção tem duas letras juntas formando uma sílaba?',
    emoji: '🧩',
    options: ['BA', 'B', '⚽'],
    answer: 'BA'
  },
  {
    title: 'Qual letra começa a palavra GATO?',
    emoji: '🐱',
    options: ['G', 'P', 'M'],
    answer: 'G'
  },
  {
    title: 'Complete: C _ S A',
    emoji: '🏠',
    options: ['A', 'O', 'U'],
    answer: 'A'
  },
  {
    title: 'Qual palavra combina com a imagem?',
    emoji: '⚽',
    options: ['BOLA', 'CASA', 'PATO'],
    answer: 'BOLA'
  },
  {
    title: 'Na frase “O GATO CORRE”, quem corre?',
    emoji: '📖',
    options: ['GATO', 'CASA', 'BOLA'],
    answer: 'GATO'
  }
] as const;

function InitialAssessment({
  name,
  onFinish,
  onBack
}: {
  name: string;
  onFinish: (score: number) => void;
  onBack: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');

  const question = assessmentQuestions[index];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      speak(
        `${question.title}. Opções: ${question.options.join(', ')}`
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [index]);

  const choose = (option: string) => {
    if (selected) return;

    setSelected(option);

    const correct = option === question.answer;

    if (correct) {
      setScore((current) => current + 1);
      setMessage('Muito bem! 🌟');
      speak('Muito bem!');
    } else {
      setMessage('Tudo bem! Vamos continuar 😊');
      speak('Tudo bem. Vamos continuar.');
    }
  };

  const next = () => {
    if (!selected) return;

    if (index === assessmentQuestions.length - 1) {
      onFinish(score);
      return;
    }

    setIndex((current) => current + 1);
    setSelected('');
    setMessage('');
  };

  return (
    <div
      className="app student-area assessment-area"
      style={{
        minHeight: '100vh',
        padding: '24px',
        textTransform: 'uppercase'
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '760px',
          margin: '0 auto'
        }}
      >
        <button className="back" onClick={onBack}>
          <ArrowLeft />
          Voltar
        </button>

        <div className="gameCard" style={{ padding: '28px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '54px' }}>📝✨</div>
            <h2>Sondagem inicial de {name}</h2>
            <p className="instruction">
              Vamos fazer algumas atividades rápidas antes de começar.
              Não se preocupe em acertar tudo. Apenas faça o seu melhor!
            </p>

            <button
              className="audio"
              onClick={() =>
                speak(
                  `Olá, ${name}. Vamos fazer algumas atividades rápidas antes de começar. Não se preocupe em acertar tudo. Faça o seu melhor.`
                )
              }
              style={{ margin: '8px auto 14px' }}
            >
              <Volume2 />
              Ouvir explicação
            </button>

            <p>
              Questão {index + 1} de {assessmentQuestions.length}
            </p>
          </div>

          <div className="picture" style={{ fontSize: '72px' }}>
            {question.emoji}
          </div>

          <h3 style={{ textAlign: 'center' }}>
            {question.title}
          </h3>

          <div className="row">
            <button
              className="audio"
              onClick={() => {
                speak(question.title);
                setTimeout(
                  () =>
                    speak(
                      `Opções: ${question.options.join(', ')}`
                    ),
                  1200
                );
              }}
            >
              <Volume2 />
              Ouvir pergunta e opções
            </button>
          </div>

          <div className="answers words">
            {question.options.map((option) => (
              <button
                key={option}
                disabled={Boolean(selected)}
                onClick={() => choose(option)}
                style={{
                  opacity:
                    selected && selected !== option ? 0.65 : 1
                }}
              >
                {option}
              </button>
            ))}
          </div>

          {message && (
            <p className="good" style={{ textAlign: 'center' }}>
              {message}
            </p>
          )}

          <div className="row">
            <button
              className="primary"
              disabled={!selected}
              onClick={next}
            >
              {index === assessmentQuestions.length - 1
                ? 'Ver resultado'
                : 'Próxima questão →'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ===========================
   HOME
=========================== */

function HomePage({
  name,
  avatar,
  progress,
  learning,
  go
}: {
  name: string;
  avatar: string;
  progress: Progress;
  learning: LearningState;
  go: (p: Page) => void;
}) {
  void learning;

  return (
    <section className="hero">
      <div>
        <div
          className="hello"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <StudentAvatar
            avatar={avatar}
            size={52}
          />

          <span>
            Olá, {name}!
          </span>
        </div>

        <h1>
          Vamos aprender <em>brincando?</em> ✨
        </h1>

        <p>
          Letras, sons, palavras e muitos desafios
          divertidos estão esperando por você.
        </p>

        <button
          className="audio"
          onClick={() =>
            speak(
              `Olá, ${name}! Vamos aprender brincando? Você pode apertar em começar a aprender para escolher uma atividade, ou continuar aprendendo para brincar com os jogos.`
            )
          }
          style={{ marginTop: '12px' }}
        >
          <Volume2 />
          Ouvir esta tela
        </button>

        <div className="actions">
          <button
            className="primary"
            onClick={() => go('learn')}
          >
            🚀 Começar a aprender
          </button>

          {progress.activities > 0 && (
            <button
              className="secondary"
              onClick={() => go('games')}
            >
              ▶ Continuar aprendendo
            </button>
          )}
        </div>

        <div className="progressCard">
          <b>Seu progresso</b>
          <div className="progressBar">
            <span
              style={{
                width: `${pct(progress.activities, 30)}%`
              }}
            />
          </div>
          <small>
            {progress.activities} atividades concluídas
          </small>
        </div>
      </div>

      <div className="heroArt">
        <StudentAvatar
          avatar={avatar}
          size={200}
        />

        
      </div>
    </section>
  );
}

/* ===========================
   MENU APRENDER
=========================== */

function Learn({
  go,
  learning
}: {
  go: (p: Page) => void;
  learning: LearningState;
}) {
  const currentLevel = getCurrentLevel(learning);

  const allModules: {
    page: Page;
    emoji: string;
    title: string;
    text: string;
  }[] = [
      {
        page: 'letters',
        emoji: '🔤',
        title: 'LETRAS',
        text: 'CONHEÇA AS LETRAS E SEUS SONS.'
      },
      {
        page: 'syllables',
        emoji: '🧩',
        title: 'SÍLABAS',
        text: 'JUNTE LETRAS E PRATIQUE OS SONS.'
      },
      {
        page: 'words',
        emoji: '📝',
        title: 'PALAVRAS',
        text: 'COMPLETE PALAVRAS COM A LETRA CERTA.'
      },
      {
        page: 'reading',
        emoji: '📚',
        title: 'LEITURA',
        text: 'ESCOLHA A PALAVRA QUE COMBINA COM A IMAGEM.'
      },
      {
        page: 'writing',
        emoji: '✍️',
        title: 'ESCRITA',
        text: 'PRATIQUE A ESCRITA DAS LETRAS.'
      },
      {
        page: 'math',
        emoji: '🧮',
        title: 'MATEMÁTICA',
        text: 'CONTE, SOME E SUBTRAIA BRINCANDO.'
      }
    ];

  const unlockedPages = currentLevel
    ? UNLOCKED_MODULES_BY_LEVEL[currentLevel]
    : ['letters', 'writing', 'math'];

  return (
    <section>
      <h2>📚 O QUE VAMOS APRENDER?</h2>

      <button
        className="audio"
        onClick={() =>
          speak(
            'ESCOLHA UMA ATIVIDADE LIBERADA. NOVAS ATIVIDADES SERÃO DESBLOQUEADAS CONFORME VOCÊ AVANÇAR.'
          )
        }
        style={{ marginBottom: '18px' }}
      >
        <Volume2 />
        OUVIR OPÇÕES
      </button>

      <p className="instruction">
        ⭐ CONTINUE APRENDENDO PARA DESBLOQUEAR NOVOS DESAFIOS
      </p>

      <div className="grid">
        {allModules.map((module) => {
          const unlocked = unlockedPages.includes(module.page);

          return (
            <button
              key={module.page}
              className="module"
              onClick={() => {
                if (unlocked) {
                  go(module.page);
                } else {
                  speak(
                    'ESSA ATIVIDADE AINDA ESTÁ BLOQUEADA. CONTINUE APRENDENDO PARA DESBLOQUEAR.'
                  );
                }
              }}
              style={{
                opacity: unlocked ? 1 : 0.5,
                filter: unlocked ? 'none' : 'grayscale(70%)',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                position: 'relative'
              }}
            >
              {!unlocked && (
                <Lock
                  size={24}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px'
                  }}
                />
              )}

              <span>{module.emoji}</span>

              <b>{module.title}</b>

              <small>{module.text}</small>

              <small>
                {unlocked
                  ? '✅ LIBERADA'
                  : '🔒 BLOQUEADA'}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ===========================
   COMPONENTE DE ATIVIDADE
=========================== */

function Activity({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="gameCard">{children}</div>
    </section>
  );
}

/* ===========================
   LETRAS
=========================== */

function Letters({
  complete,
  wrong
}: {
  complete: (
    label: string,
    score?: number,
    kind?: 'letters',
    item?: string
  ) => void;
  wrong: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState('');

  const [upper, _lower, word, emoji] = letters[index];
  void _lower;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      speak(`LETRA ${upper}. ${word}.`);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [index, upper, word]);

  const next = () => {
    setIndex((current) => (current + 1) % letters.length);
    setMessage('');
  };

  const previous = () => {
    setIndex(
      (current) =>
        (current - 1 + letters.length) % letters.length
    );
    setMessage('');
  };

  const check = () => {
    complete(
      `Letra ${upper}`,
      8,
      'letters',
      upper
    );
    setMessage(`Muito bem! ${upper} de ${word} 🎉`);
    speak(`${upper}. ${word}.`);
  };

  return (
    <Activity title="🔤 Conhecendo as letras">
      <p className="instruction">
        Letra {index + 1} de {letters.length}
      </p>

      <div className="picture">{emoji}</div>

      <div className="trace">
        {upper}
      </div>

      <h3 style={{ textAlign: 'center' }}>{word}</h3>

      <div className="row">
        <button
          className="audio"
          onClick={() => speak(`Letra ${upper}. ${word}`)}
        >
          <Volume2 />
          Ouvir
        </button>

        <button className="primary" onClick={check}>
          ⭐ Eu pratiquei
        </button>
      </div>

      {message && <p className="good">{message}</p>}

      <div className="row">
        <button className="soft" onClick={previous}>
          ← Anterior
        </button>

        <button className="soft" onClick={next}>
          Próxima →
        </button>
      </div>
    </Activity>
  );
}

/* ===========================
   SÍLABAS
=========================== */

function Syllables({
  complete,
  wrong
}: {
  complete: (
    label: string,
    score?: number,
    kind?: 'syllables',
    item?: string
  ) => void;
  wrong: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState('');
  const current = syllables[index];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      speak(`REPITA A SÍLABA ${current}`);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [index, current]);

  const next = () => {
    setIndex((currentIndex) =>
      (currentIndex + 1) % syllables.length
    );
    setMessage('');
  };

  return (
    <Activity title="🧩 Vamos praticar sílabas">
      <p className="instruction">
        Sílaba {index + 1} de {syllables.length}
      </p>

      <div className="trace">{current}</div>

      <div className="row">
        <button
          className="audio"
          onClick={() => speak(current)}
        >
          <Volume2 />
          Ouvir sílaba
        </button>

        <button
          className="primary"
          onClick={() => {
            complete(
              `Sílaba ${current}`,
              10,
              'syllables',
              current
            );
            setMessage(`Muito bem! Você praticou ${current} 🌟`);
            setTimeout(next, 900);
          }}
        >
          ✅ Consegui repetir
        </button>
      </div>

      {message && <p className="good">{message}</p>}

      <div className="row">
        <button
          className="soft"
          onClick={() => {
            wrong();
            setMessage('Tudo bem! Ouça novamente e tente repetir 😊');
          }}
        >
          Ainda estou aprendendo
        </button>

        <button className="soft" onClick={next}>
          Próxima →
        </button>
      </div>
    </Activity>
  );
}

/* ===========================
   PALAVRAS
=========================== */

type WordQuestion = {
  emoji: string;
  pattern: string;
  options: readonly string[];
  answer: string;
  word: string;
};

function Quiz({
  title,
  questions,
  progress,
  setProgress,
  complete,
  wrong
}: {
  title: string;
  questions: readonly WordQuestion[];
  progress: Progress;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;
  complete: (word: string) => void;
  wrong: () => void;
}) {
  const getQuestionId = (question: WordQuestion, questionIndex: number) =>
    `word-${questionIndex}-${question.word}-${question.pattern}`;

  const [index, setIndex] = useState(() =>
    pickUnusedIndex(
      [...questions],
      progress.usedWordExercises ?? [],
      (question, questionIndex) =>
        getQuestionId(question, questionIndex)
    )
  );

  const [selectedLetter, setSelectedLetter] = useState('');
  const [message, setMessage] = useState('');

  const question = questions[index];

  const shuffledWordOptions = useMemo(
    () => shuffle([...question.options]),
    [index, question]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      speak(
        `OLHE A IMAGEM E ESCOLHA A LETRA QUE COMPLETA A PALAVRA ${question.word}. OPÇÕES: ${shuffledWordOptions.join(', ')}`
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [index, shuffledWordOptions, question.word]);

  const displayedPattern = selectedLetter
    ? question.pattern.replace('_', selectedLetter)
    : question.pattern;

  const choose = (option: string) => {
    setSelectedLetter(option);

    if (option === question.answer) {
      setMessage(`Parabéns! 🎉 Você formou ${question.word}!`);
      speak(question.word);
      complete(question.word);

      const currentId = getQuestionId(question, index);

      const usedWithCurrent = Array.from(
        new Set([
          ...(progress.usedWordExercises ?? []),
          currentId
        ])
      );

      const nextIndex = pickUnusedIndex(
        [...questions],
        usedWithCurrent,
        (item, itemIndex) =>
          getQuestionId(item, itemIndex),
        index
      );

      setProgress((current) => ({
        ...current,
        usedWordExercises:
          usedWithCurrent.length >= questions.length
            ? []
            : Array.from(
                new Set([
                  ...(current.usedWordExercises ?? []),
                  currentId
                ])
              )
      }));

      setTimeout(() => {
        setMessage('');
        setSelectedLetter('');
        setIndex(nextIndex);
      }, 1100);
    } else {
      wrong();
      setMessage(
        'Quase! Veja a letra que você colocou e tente novamente 😊'
      );
    }
  };

  return (
    <Activity title={title}>
      <p className="instruction">
        Palavra {index + 1} de {questions.length}
      </p>

      <div className="picture">{question.emoji}</div>

      <div className="pattern">{displayedPattern}</div>

      <div className="answers">
        {shuffledWordOptions.map((option) => (
          <button
            key={option}
            onClick={() => choose(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {message && (
        <p
          className={
            message.includes('Parabéns') ? 'good' : 'hint'
          }
        >
          {message}
        </p>
      )}
    </Activity>
  );
}

/* ===========================
   LEITURA
=========================== */

function Reading({
  progress,
  setProgress,
  complete,
  wrong
}: {
  progress: Progress;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;
  complete: (word: string) => void;
  wrong: () => void;
}) {
  const getReadingId = (
    question: (typeof readingQuestions)[number],
    questionIndex: number
  ) => `reading-${questionIndex}-${question.answer}`;

  const [index, setIndex] = useState(() =>
    pickUnusedIndex(
      [...readingQuestions],
      progress.usedReadingExercises ?? [],
      (question, questionIndex) =>
        getReadingId(question, questionIndex)
    )
  );

  const [message, setMessage] = useState('');

  const question = readingQuestions[index];

  const shuffledReadingOptions = useMemo(
    () => shuffle([...question.options]),
    [index, question]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      speak(
        `OLHE A IMAGEM E ESCOLHA A PALAVRA CORRETA. OPÇÕES: ${shuffledReadingOptions.join(', ')}`
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [index, shuffledReadingOptions]);

  const choose = (option: string) => {
    if (option === question.answer) {
      setMessage(`Muito bem! É ${question.answer} 🎉`);
      speak(question.answer);
      complete(question.answer);

      const currentId = getReadingId(question, index);

      const usedWithCurrent = Array.from(
        new Set([
          ...(progress.usedReadingExercises ?? []),
          currentId
        ])
      );

      const nextIndex = pickUnusedIndex(
        [...readingQuestions],
        usedWithCurrent,
        (item, itemIndex) =>
          getReadingId(item, itemIndex),
        index
      );

      setProgress((current) => ({
        ...current,
        usedReadingExercises:
          usedWithCurrent.length >= readingQuestions.length
            ? []
            : Array.from(
                new Set([
                  ...(current.usedReadingExercises ?? []),
                  currentId
                ])
              )
      }));

      setTimeout(() => {
        setMessage('');
        setIndex(nextIndex);
      }, 1000);
    } else {
      wrong();
      setMessage('Quase! Observe a imagem e tente outra palavra 😊');
    }
  };

  return (
    <Activity title="📖 Vamos ler">
      <p className="instruction">
        Questão {index + 1} de {readingQuestions.length}
      </p>

      <div className="picture">{question.emoji}</div>

      <div className="answers words">
        {shuffledReadingOptions.map((option) => (
          <button
            key={option}
            onClick={() => choose(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {message && (
        <p
          className={
            message.includes('Muito bem') ? 'good' : 'hint'
          }
        >
          {message}
        </p>
      )}
    </Activity>
  );
}

/* ===========================
   ESCRITA
=========================== */

function Writing({
  complete,
  wrong
}: {
  complete: (letter: string) => void;
  wrong: () => void;
}) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState('');
  const canvasRef = React.useRef<CanvasHandle>(null);
  const upper = alphabet[index];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      speak(
        `FAÇA A LETRA ${upper}. PASSE O DEDO OU O MOUSE POR CIMA DO MODELO.`
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [index, upper]);

  const nextLetter = () => {
    setIndex((current) => (current + 1) % alphabet.length);
    setMessage('');
  };

  const previousLetter = () => {
    setIndex(
      (current) =>
        (current - 1 + alphabet.length) % alphabet.length
    );
    setMessage('');
  };

  const evaluateWriting = () => {
    const correct = canvasRef.current?.validate();

    if (!correct) {
      wrong();
      setMessage(
        `😊 Tente novamente! Passe o lápis por cima da letra ${upper}.`
      );
      speak(
        `Tente novamente. Faça a letra ${upper} seguindo o modelo.`
      );
      return;
    }

    setMessage(`🎉 Muito bem! Você escreveu a letra ${upper}!`);
    speak(`Muito bem! Letra ${upper}.`);
    complete(upper);

    setTimeout(nextLetter, 1000);
  };

  return (
    <Activity title="✍️ Hora de escrever">
      <p className="instruction">
        Letra {index + 1} de {alphabet.length}
      </p>

      <div className="trace">{upper}</div>

      <button
        className="audio"
        onClick={() => speak(`Letra ${upper}`)}
      >
        <Volume2 />
        Ouvir letra
      </button>

      <p className="instruction">
        Passe o dedo ou o mouse por cima da letra {upper}.
      </p>

      <Canvas
        key={upper}
        ref={canvasRef}
        letter={upper}
      />

      {message && (
        <p
          className={
            message.includes('Muito bem') ? 'good' : 'hint'
          }
        >
          {message}
        </p>
      )}

      <div className="row">
        <button className="soft" onClick={previousLetter}>
          ← Anterior
        </button>

        <button className="primary" onClick={evaluateWriting}>
          ✅ Avaliar escrita
        </button>

        <button className="soft" onClick={nextLetter}>
          Próxima →
        </button>
      </div>
    </Activity>
  );
}

/* ===========================
   JOGOS VARIADOS
=========================== */

const shuffle = <T,>(items: readonly T[]) =>
  [...items].sort(() => Math.random() - 0.5);


const getMathHelp = (game: MathGame) => {
  if (game.type === 'count') {
    return 'DICA: APONTE PARA CADA FIGURA E CONTE DEVAGAR, UMA DE CADA VEZ.';
  }

  if (game.type === 'add') {
    return 'DICA: CONTE O PRIMEIRO GRUPO, DEPOIS CONTE O SEGUNDO E JUNTE TUDO.';
  }

  return 'DICA: CONTE TODOS OS OBJETOS E DEPOIS RETIRE A QUANTIDADE INDICADA.';
};

const getMathVisualHint = (game: MathGame) => {
  const numbers = game.question.match(/\d+/g)?.map(Number) ?? [];

  if (numbers.length < 2) return null;

  const first = numbers[0];
  const second = numbers[1];

  if (game.type === 'add') {
    const left = Array(first).fill('🍎').join(' ');
    const right = Array(second).fill('🍌').join(' ');

    return {
      top: left,
      symbol: '+',
      bottom: right,
      text: `CONTE ${first} MAÇÃS E MAIS ${second} BANANAS. DEPOIS CONTE TODAS JUNTAS.`
    };
  }

  if (game.type === 'subtract') {
    const all = Array(first).fill('🍎');
    const removed = all
      .map((item, index) =>
        index >= first - second ? '❌' : item
      )
      .join(' ');

    return {
      top: Array(first).fill('🍎').join(' '),
      symbol: '−',
      bottom: removed,
      text: `COMECE COM ${first} MAÇÃS. TIRE ${second}. CONTE QUANTAS SOBRARAM SEM O X.`
    };
  }

  return null;
};

function pickUnusedIndex<T>(
  items: T[],
  usedIds: string[],
  getId: (item: T, index: number) => string,
  currentIndex?: number
) {
  if (items.length <= 1) return 0;

  const used = new Set(usedIds ?? []);

  const unusedIndexes = items
    .map((item, index) => ({
      index,
      id: getId(item, index)
    }))
    .filter(
      (entry) =>
        !used.has(entry.id) &&
        entry.index !== currentIndex
    )
    .map((entry) => entry.index);

  const availableIndexes =
    unusedIndexes.length > 0
      ? unusedIndexes
      : items
          .map((_, index) => index)
          .filter((index) => index !== currentIndex);

  return availableIndexes[
    Math.floor(Math.random() * availableIndexes.length)
  ];
}

function arrangeOptions<T>(
  options: T[],
  correctAnswer: T,
  seed: number
): T[] {
  const uniqueOptions = Array.from(new Set(options));
  const wrongOptions = uniqueOptions.filter(
    (option) => option !== correctAnswer
  );

  const shuffledWrong = shuffle(wrongOptions);
  const result = shuffledWrong.slice(0, Math.max(0, uniqueOptions.length - 1));
  const position = uniqueOptions.length > 0
    ? seed % uniqueOptions.length
    : 0;

  result.splice(position, 0, correctAnswer);
  return result;
}

function pickUnusedIndexAvoiding<T>(
  items: T[],
  usedIds: string[],
  getId: (item: T, index: number) => string,
  getWord: (item: T, index: number) => string,
  excludedWords: string[],
  currentIndex?: number
) {
  if (items.length <= 1) return 0;

  const used = new Set(usedIds ?? []);
  const excluded = new Set(
    excludedWords
      .filter(Boolean)
      .map((word) => word.trim().toUpperCase())
  );

  const candidates = items
    .map((item, index) => ({
      index,
      id: getId(item, index),
      word: getWord(item, index).trim().toUpperCase()
    }))
    .filter(
      (entry) =>
        !used.has(entry.id) &&
        !excluded.has(entry.word) &&
        entry.index !== currentIndex
    )
    .map((entry) => entry.index);

  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const fallback = items
    .map((item, index) => ({
      index,
      word: getWord(item, index).trim().toUpperCase()
    }))
    .filter(
      (entry) =>
        !excluded.has(entry.word) &&
        entry.index !== currentIndex
    )
    .map((entry) => entry.index);

  const pool =
    fallback.length > 0
      ? fallback
      : items
          .map((_, index) => index)
          .filter((index) => index !== currentIndex);

  return pool[Math.floor(Math.random() * pool.length)];
}


function pickUnusedCompleteIndex(
  items: typeof completeWordGames,
  usedIds: string[],
  excludedWords: string[],
  excludedAnswers: string[],
  currentIndex?: number
) {
  if (items.length <= 1) return 0;

  const used = new Set(usedIds ?? []);
  const excludedWordSet = new Set(
    excludedWords.filter(Boolean).map((word) => word.trim().toUpperCase())
  );
  const excludedAnswerSet = new Set(
    excludedAnswers.filter(Boolean).map((answer) => answer.trim().toUpperCase())
  );

  const candidates = items
    .map((item, index) => ({
      index,
      id: item.id,
      word: item.word.trim().toUpperCase(),
      answer: item.answer.trim().toUpperCase()
    }))
    .filter((entry) =>
      !used.has(entry.id) &&
      !excludedWordSet.has(entry.word) &&
      !excludedAnswerSet.has(entry.answer) &&
      entry.index !== currentIndex
    )
    .map((entry) => entry.index);

  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const fallback = items
    .map((item, index) => ({
      index,
      word: item.word.trim().toUpperCase(),
      answer: item.answer.trim().toUpperCase()
    }))
    .filter((entry) =>
      !excludedWordSet.has(entry.word) &&
      !excludedAnswerSet.has(entry.answer) &&
      entry.index !== currentIndex
    )
    .map((entry) => entry.index);

  if (fallback.length > 0) {
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  return pickUnusedIndex(
    items,
    usedIds,
    (item) => item.id,
    currentIndex
  );
}

function MathLearningGame({
  progress,
  setProgress,
  complete,
  wrong
}: {
  progress: Progress;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;
  complete: () => void;
  wrong: () => void;
}) {
  const QUESTION_TIME = 25;

  const [index, setIndex] = useState(() =>
    pickUnusedIndex(
      mathGames,
      progress.usedMathExercises ?? [],
      (game, gameIndex) =>
        game.id ?? `math-${gameIndex}-${game.question}`
    )
  );

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [message, setMessage] = useState('');
  const [help, setHelp] = useState('');
  const [visualHelp, setVisualHelp] =
    useState<ReturnType<typeof getMathVisualHint>>(null);
  const [locked, setLocked] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  const game = mathGames[index];

  const mathExerciseId = (
    gameToIdentify: MathGame,
    gameIndex: number
  ) =>
    gameToIdentify.id ??
    `math-${gameIndex}-${gameToIdentify.question}`;

  const recordMathExercise = (
    exerciseId: string,
    usedWithCurrent: string[]
  ) => {
    setProgress((current) => ({
      ...current,
      usedMathExercises:
        usedWithCurrent.length >= mathGames.length
          ? []
          : Array.from(
              new Set([
                ...(current.usedMathExercises ?? []),
                exerciseId
              ])
            )
    }));
  };

  const nextQuestion = () => {
    const currentId = mathExerciseId(game, index);

    const usedWithCurrent = Array.from(
      new Set([
        ...(progress.usedMathExercises ?? []),
        currentId
      ])
    );

    const next = pickUnusedIndex(
      mathGames,
      usedWithCurrent,
      mathExerciseId,
      index
    );

    recordMathExercise(currentId, usedWithCurrent);

    setIndex(next);
    setTimeLeft(QUESTION_TIME);
    setMessage('');
    setHelp('');
    setVisualHelp(null);
    setLocked(false);
    setWrongCount(0);
  };

  useEffect(() => {
    setTimeLeft(QUESTION_TIME);
    setMessage('');
    setHelp('');
    setVisualHelp(null);
    setLocked(false);
    setWrongCount(0);

    const audioTimer = window.setTimeout(() => {
      speak(
        `${game.question} ESCOLHA UMA DAS RESPOSTAS: ${game.options.join(', ')}`
      );
    }, 400);

    return () => window.clearTimeout(audioTimer);
  }, [index]);

  useEffect(() => {
    if (locked) return;

    if (timeLeft <= 0) {
      setLocked(true);
      wrong();

      setMessage(
        'O TEMPO ACABOU! VAMOS PARA A PRÓXIMA QUESTÃO ⏱️'
      );

      speak(
        'O TEMPO ACABOU. VAMOS PARA A PRÓXIMA QUESTÃO.'
      );

      const nextTimer = window.setTimeout(() => {
        nextQuestion();
      }, 1200);

      return () =>
        window.clearTimeout(nextTimer);
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((current) => current - 1);
    }, 1000);

    return () =>
      window.clearTimeout(timer);
  }, [timeLeft, locked, index]);

  const choose = (answer: number) => {
    if (locked) return;

    if (answer === game.answer) {
      setLocked(true);

      setMessage(
        `MUITO BEM! A RESPOSTA É ${game.answer}! 🎉`
      );

      setHelp('');

      speak(
        `MUITO BEM! A RESPOSTA É ${game.answer}.`
      );

      complete();

      setTimeout(nextQuestion, 1400);
      return;
    }

    wrong();

    const newWrongCount =
      wrongCount + 1;

    setWrongCount(newWrongCount);

    const hint =
      getMathHelp(game);

    const visual =
      getMathVisualHint(game);

    setMessage(
      'QUASE! OLHE A DICA VISUAL E TENTE DE NOVO 😊'
    );

    setHelp(
      newWrongCount >= 2
        ? `${hint} CONTE DEVAGAR, APONTANDO PARA CADA FIGURA.`
        : hint
    );

    setVisualHelp(visual);

    speak(`QUASE. ${hint}`);
  };

  const timePercent =
    Math.max(
      0,
      (timeLeft / QUESTION_TIME) * 100
    );

  return (
    <section>
      <h2>🧮 MATEMÁTICA</h2>

      <div className="gameCard math-learning-card">
        <div className="math-top-row">
          <div>
            <span className="math-game-badge">
              DESAFIO MATEMÁTICO
            </span>

            <h3>
              CONTE, SOME E SUBTRAIA
            </h3>
          </div>

          <div
            className={
              timeLeft <= 8
                ? 'math-timer math-timer-warning'
                : 'math-timer'
            }
          >
            ⏱️ {timeLeft}s
          </div>
        </div>

        <div className="math-time-track">
          <div
            className="math-time-fill"
            style={{
              width: `${timePercent}%`
            }}
          />
        </div>

        <p className="instruction">
          VOCÊ TEM {QUESTION_TIME} SEGUNDOS PARA CADA QUESTÃO.
          SE ERRAR, O JOGO VAI DAR UMA DICA PARA AJUDAR.
        </p>

        {game.visual && (
          <div className="math-visual">
            {game.visual}
          </div>
        )}

        <div className="math-question">
          {game.question}
        </div>

        <button
          className="audio"
          onClick={() =>
            speak(
              `${game.question} ESCOLHA UMA DAS RESPOSTAS: ${game.options.join(', ')}`
            )
          }
        >
          <Volume2 />
          OUVIR DESAFIO
        </button>

        <div className="answers math-answers">
          {game.options.map((option) => (
            <button
              key={option}
              disabled={locked}
              onClick={() =>
                choose(option)
              }
            >
              {option}
            </button>
          ))}
        </div>

        {message && (
          <div
            className={
              message.includes(
                'MUITO BEM'
              )
                ? 'math-feedback success'
                : 'math-feedback help'
            }
          >
            <b>{message}</b>

            {help && <p>{help}</p>}
          </div>
        )}

        {visualHelp && (
          <div className="math-visual-help">
            <p>{visualHelp.text}</p>

            <div className="math-object-row">
              {visualHelp.top}
            </div>

            <div className="math-operation-symbol">
              {visualHelp.symbol}
            </div>

            <div className="math-object-row">
              {visualHelp.bottom}
            </div>
          </div>
        )}

        <button
          className="soft"
          onClick={nextQuestion}
        >
          🔄 OUTRA QUESTÃO
        </button>
      </div>
    </section>
  );
}

function Games({
  learning,
  progress,
  setProgress,
  complete,
  wrong,
  completeMath,
  wrongMath
}: {
  learning: LearningState;
  progress: Progress;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;

  complete: (
    label: string,
    score?: number,
    kind?: 'letters' | 'syllables' | 'words',
    item?: string
  ) => void;

  wrong: () => void;

  completeMath: (
    label: string,
    score?: number
  ) => void;

  wrongMath: () => void;
}) {
  const currentLevel = getCurrentLevel(learning);

  const unlockedGames = currentLevel
    ? UNLOCKED_GAMES_BY_LEVEL[currentLevel]
    : [1];

  const gameUnlocked = (game: LiteracyGameId) =>
    unlockedGames.includes(game);
  const [target, setTarget] = useState(
    findLetterPool[Math.floor(Math.random() * findLetterPool.length)]
  );
  const [letterOptions, setLetterOptions] = useState<string[]>([]);
  const [letterMessage, setLetterMessage] = useState('');

  const [combineIndex, setCombineIndex] = useState(() =>
    pickUnusedIndex(
      combineGames,
      progress.usedCombineExercises ?? [],
      (game) => game.id
    )
  );
  const [combineMessage, setCombineMessage] = useState('');
  const [combineAnswerPosition, setCombineAnswerPosition] = useState(
    () => Math.floor(Math.random() * 3)
  );

  const [wordIndex, setWordIndex] = useState(() =>
    pickUnusedIndexAvoiding(
      organizeWords,
      progress.usedOrganizeExercises ?? [],
      (word) => `organize-${word}`,
      (word) => word,
      [combineGames[combineIndex]?.answer ?? '']
    )
  );
  const [order, setOrder] = useState<string[]>([]);
  const [organizeMessage, setOrganizeMessage] = useState('');

  const [completeIndex, setCompleteIndex] = useState(() =>
    pickUnusedCompleteIndex(
      completeWordGames,
      progress.usedCompleteExercises ?? [],
      [
        combineGames[combineIndex]?.answer ?? '',
        organizeWords[wordIndex] ?? ''
      ],
      []
    )
  );
  const [completeLetter, setCompleteLetter] = useState('');
  const [completeMessage, setCompleteMessage] = useState('');
  const [completeAnswerPosition, setCompleteAnswerPosition] = useState(
    () => Math.floor(Math.random() * 3)
  );

  const [mathIndex, setMathIndex] = useState(() =>
    pickUnusedIndex(
      mathGames,
      progress.usedMathExercises ?? [],
      (game, gameIndex) =>
        game.id ?? `math-${gameIndex}-${game.question}`
    )
  );
  const [mathMessage, setMathMessage] = useState('');
  const [mathHelp, setMathHelp] = useState('');
  const [mathVisualHelp, setMathVisualHelp] = useState<ReturnType<typeof getMathVisualHint>>(null);
  const [mathTimeLeft, setMathTimeLeft] = useState(25);
  const [mathLocked, setMathLocked] = useState(false);
  const [mathWrongCount, setMathWrongCount] = useState(0);
  const [mathStarted, setMathStarted] = useState(false);
  const [mathAnswerPosition, setMathAnswerPosition] = useState(
    () => Math.floor(Math.random() * 3)
  );

  const combine = combineGames[combineIndex];
  const organizeWord = organizeWords[wordIndex];
  const completeGame = completeWordGames[completeIndex];
  const mathGame = mathGames[mathIndex];

  // Sempre que mudar a palavra do Jogo 4, muda também a posição
  // da alternativa correta. Assim a resposta não fica presa
  // no primeiro botão.
  useEffect(() => {
    setCompleteAnswerPosition((current) => (current + 1) % 3);
  }, [completeIndex]);

  // Distribui a resposta correta entre os botões A, B e C.
  // A posição muda conforme a questão, evitando que a correta
  // fique sempre no mesmo botão.
  const combineOptions = useMemo(
    () => arrangeOptions(
      combine.options,
      combine.answer,
      combineAnswerPosition
    ),
    [combineIndex, combineAnswerPosition]
  );

  const completeOptions = useMemo(
    () => arrangeOptions(
      completeGame.options,
      completeGame.answer,
      completeAnswerPosition
    ),
    [completeIndex, completeAnswerPosition]
  );

  const mathOptions = useMemo(
    () => arrangeOptions(
      mathGame.options,
      mathGame.answer,
      mathAnswerPosition
    ),
    [mathIndex, mathAnswerPosition]
  );

  const recordUsedExercise = (
    key:
      | 'usedCombineExercises'
      | 'usedOrganizeExercises'
      | 'usedCompleteExercises'
      | 'usedMathExercises',
    exerciseId: string,
    usedWithCurrent: string[],
    totalExercises: number
  ) => {
    setProgress((current) => ({
      ...current,
      [key]:
        usedWithCurrent.length >= totalExercises
          ? []
          : Array.from(
              new Set([
                ...(current[key] ?? []),
                exerciseId
              ])
            )
    }));
  };

  const mathExerciseId = (
    game: MathGame,
    gameIndex: number
  ) =>
    game.id ??
    `math-${gameIndex}-${game.question}`;

  const refreshLetterGame = (newTarget?: string) => {
    const practiced =
      progress.practicedLetters ?? [];

    const unusedLetters =
      findLetterPool.filter(
        (letter) =>
          !practiced.includes(letter) &&
          letter !== target
      );

    const fallbackLetters =
      findLetterPool.filter(
        (letter) => letter !== target
      );

    const pool =
      unusedLetters.length > 0
        ? unusedLetters
        : fallbackLetters;

    const chosen =
      newTarget ??
      pool[
        Math.floor(Math.random() * pool.length)
      ];

    const distractors = shuffle(
      findLetterPool.filter((letter) => letter !== chosen)
    ).slice(0, 5);

    setTarget(chosen);
    setLetterOptions(shuffle([chosen, ...distractors]));
  };

  useEffect(() => {
    refreshLetterGame(target);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const examples = letterWords[target] ?? [];
      const exampleText = examples.length
        ? `COMO EM ${examples.join(', ')}`
        : '';

      speak(`ENCONTRE A LETRA ${target}. ${exampleText}`);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [target]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      speak(
        `OLHE A IMAGEM E ESCOLHA A PALAVRA CORRETA. OPÇÕES: ${combineOptions.join(', ')}`
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [combineIndex]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      speak(
        `ORGANIZE AS LETRAS PARA FORMAR A PALAVRA ${organizeWord}`
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [wordIndex]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      speak(
        `COMPLETE A PALAVRA ${completeGame.word}. ESCOLHA A LETRA QUE ESTÁ FALTANDO.`
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [completeIndex]);

  useEffect(() => {
    setMathTimeLeft(25);
    setMathLocked(false);
    setMathMessage('');
    setMathHelp('');
    setMathVisualHelp(null);
    setMathWrongCount(0);

    if (!mathStarted) return;

    const timer = window.setTimeout(() => {
      speak(
        `${mathGame.question} ESCOLHA UMA DAS RESPOSTAS: ${mathOptions.join(', ')}`
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [mathIndex, mathStarted]);

  useEffect(() => {
    if (!mathStarted || mathLocked) return;

    if (mathTimeLeft <= 0) {
      setMathLocked(true);
      wrongMath();
      setMathMessage(
        'O TEMPO ACABOU! VAMOS PARA A PRÓXIMA QUESTÃO ⏱️'
      );
      setMathHelp('');
      setMathVisualHelp(null);
      speak('O TEMPO ACABOU. VAMOS PARA A PRÓXIMA QUESTÃO.');

      const nextTimer = window.setTimeout(() => {
        const currentId =
          mathExerciseId(mathGame, mathIndex);

        const usedWithCurrent =
          Array.from(
            new Set([
              ...(progress.usedMathExercises ?? []),
              currentId
            ])
          );

        const nextIndex =
          pickUnusedIndex(
            mathGames,
            usedWithCurrent,
            mathExerciseId,
            mathIndex
          );

        recordUsedExercise(
          'usedMathExercises',
          currentId,
          usedWithCurrent,
          mathGames.length
        );

        setMathAnswerPosition((current) => (current + 1) % 3);
        setMathIndex(nextIndex);
      }, 1200);

      return () => window.clearTimeout(nextTimer);
    }

    const timer = window.setTimeout(() => {
      setMathTimeLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [mathTimeLeft, mathLocked, mathIndex, mathStarted]);

  const chooseLetter = (letter: string) => {
    if (letter === target) {
      const examples = letterWords[target] ?? [];
      const example =
        examples[Math.floor(Math.random() * examples.length)];

      setLetterMessage(
        `ACHOU A LETRA ${target}! ${example ? `${target} DE ${example}!` : ''} 🎉`
      );

      complete(
        `Jogo: encontre a letra ${target}`,
        10,
        'letters',
        target
      );

      setTimeout(() => {
        setLetterMessage('');
        refreshLetterGame();
      }, 1100);
    } else {
      wrong();
      setLetterMessage('QUASE! TENTE OUTRA LETRA 😊');
    }
  };

  const chooseCombine = (word: string) => {
    if (word === combine.answer) {
      setCombineMessage(
        `MUITO BEM! ${combine.emoji} É ${combine.answer}! 🎉`
      );

      speak(combine.answer);
      complete(
        `Jogo: imagem e palavra ${combine.answer}`,
        12,
        'words',
        combine.answer
      );

      const currentId =
        combine.id;

      const usedWithCurrent =
        Array.from(
          new Set([
            ...(progress.usedCombineExercises ?? []),
            currentId
          ])
        );

      const nextIndex =
        pickUnusedIndexAvoiding(
          combineGames,
          usedWithCurrent,
          (game) => game.id,
          (game) => game.answer,
          [organizeWord, completeGame.word],
          combineIndex
        );

      recordUsedExercise(
        'usedCombineExercises',
        currentId,
        usedWithCurrent,
        combineGames.length
      );

      setTimeout(() => {
        setCombineMessage('');
        setCombineAnswerPosition((current) => (current + 1) % 3);
        setCombineIndex(nextIndex);
      }, 1100);
    } else {
      wrong();
      setCombineMessage(
        'QUASE! OLHE A IMAGEM E TENTE OUTRA PALAVRA 😊'
      );
    }
  };

  const addLetter = (letter: string) => {
    if (order.length >= organizeWord.length) return;
    setOrder((current) => [...current, letter]);
  };

  const checkWord = () => {
    if (order.join('') === organizeWord) {
      setOrganizeMessage(
        `${organizeWord} FORMADA! 🌟`
      );

      speak(organizeWord);

      complete(
        `Jogo: organize ${organizeWord}`,
        12,
        'words',
        organizeWord
      );

      const currentId =
        `organize-${organizeWord}`;

      const usedWithCurrent =
        Array.from(
          new Set([
            ...(progress.usedOrganizeExercises ?? []),
            currentId
          ])
        );

      const nextIndex =
        pickUnusedIndexAvoiding(
          organizeWords,
          usedWithCurrent,
          (word) => `organize-${word}`,
          (word) => word,
          [combine.answer, completeGame.word],
          wordIndex
        );

      recordUsedExercise(
        'usedOrganizeExercises',
        currentId,
        usedWithCurrent,
        organizeWords.length
      );

      setTimeout(() => {
        setOrder([]);
        setOrganizeMessage('');
        setWordIndex(nextIndex);
      }, 1100);
    } else {
      wrong();

      setOrganizeMessage(
        'QUASE! LIMPE E TENTE OUTRA VEZ 😊'
      );
    }
  };

  const chooseCompleteLetter = (
    letter: string
  ) => {
    setCompleteLetter(letter);

    if (letter === completeGame.answer) {
      setCompleteMessage(
        `MUITO BEM! VOCÊ FORMOU ${completeGame.word}! 🎉`
      );

      speak(completeGame.word);

      complete(
        `Jogo: complete ${completeGame.word}`,
        12,
        'words',
        completeGame.word
      );

      const currentId =
        completeGame.id;

      const usedWithCurrent =
        Array.from(
          new Set([
            ...(progress.usedCompleteExercises ?? []),
            currentId
          ])
        );

      const nextIndex =
        pickUnusedCompleteIndex(
          completeWordGames,
          usedWithCurrent,
          [combine.answer, organizeWord],
          [completeGame.answer],
          completeIndex
        );

      recordUsedExercise(
        'usedCompleteExercises',
        currentId,
        usedWithCurrent,
        completeWordGames.length
      );

      setTimeout(() => {
        setCompleteLetter('');
        setCompleteMessage('');
        setCompleteIndex(nextIndex);
      }, 1100);
    } else {
      wrong();

      setCompleteMessage(
        'QUASE! TENTE OUTRA LETRA 😊'
      );
    }
  };

  const startMathChallenge = () => {
    setMathTimeLeft(25);
    setMathLocked(false);
    setMathMessage('');
    setMathHelp('');
    setMathVisualHelp(null);
    setMathWrongCount(0);
    setMathStarted(true);

    speak(
      `${mathGame.question} ESCOLHA UMA DAS RESPOSTAS: ${mathOptions.join(', ')}`
    );
  };

  const chooseMathAnswer = (answer: number) => {
    if (!mathStarted || mathLocked) return;

    if (answer === mathGame.answer) {
      setMathLocked(true);
      setMathMessage(
        `MUITO BEM! A RESPOSTA É ${mathGame.answer}! 🎉`
      );
      setMathHelp('');
      speak(`MUITO BEM! A RESPOSTA É ${mathGame.answer}.`);
      completeMath('Jogo de matemática', 12);

      const currentId =
        mathExerciseId(
          mathGame,
          mathIndex
        );

      const usedWithCurrent =
        Array.from(
          new Set([
            ...(progress.usedMathExercises ?? []),
            currentId
          ])
        );

      const nextIndex =
        pickUnusedIndex(
          mathGames,
          usedWithCurrent,
          mathExerciseId,
          mathIndex
        );

      recordUsedExercise(
        'usedMathExercises',
        currentId,
        usedWithCurrent,
        mathGames.length
      );

      setTimeout(() => {
        setMathAnswerPosition((current) => (current + 1) % 3);
        setMathIndex(nextIndex);
      }, 1400);
    } else {
      wrongMath();

      const newWrongCount = mathWrongCount + 1;
      setMathWrongCount(newWrongCount);

      const hint = getMathHelp(mathGame);
      const visual = getMathVisualHint(mathGame);

      setMathMessage('QUASE! OLHE A DICA VISUAL E TENTE DE NOVO 😊');
      setMathHelp(
        newWrongCount >= 2
          ? `${hint} CONTE DEVAGAR, APONTANDO PARA CADA FIGURA.`
          : hint
      );
      setMathVisualHelp(visual);

      speak(`QUASE. ${hint}`);
    }
  };

  const shuffledLetters = useMemo(
    () => shuffle(organizeWord.split('')),
    [organizeWord]
  );

  const displayedCompletePattern = completeLetter
    ? completeGame.pattern.replace('_', completeLetter)
    : completeGame.pattern;

  return (
    <section>
      <h2>🎮 JOGOS EDUCATIVOS VARIADOS</h2>

      <button
        className="audio"
        onClick={() =>
          speak(
            'AQUI TEM CINCO JOGOS DIFERENTES. TAMBÉM TEMOS UM JOGO DE MATEMÁTICA COM CONTAGEM, ADIÇÃO E SUBTRAÇÃO.'
          )
        }
        style={{ marginBottom: '18px' }}
      >
        <Volume2 />
        OUVIR COMO JOGAR
      </button>

      <div className="gameCard">
        <h3>JOGO 1 — ENCONTRE A LETRA</h3>

        <p>
          ENCONTRE A LETRA <b>{target}</b>
        </p>

        <button
          className="audio"
          onClick={() => {
            const examples = letterWords[target] ?? [];
            speak(
              `ENCONTRE A LETRA ${target}. ${examples.length ? `COMO EM ${examples.join(', ')}` : ''}`
            );
          }}
        >
          <Volume2 />
          OUVIR
        </button>

        <div className="answers">
          {letterOptions.map((letter) => (
            <button
              key={letter}
              onClick={() => chooseLetter(letter)}
            >
              {letter}
            </button>
          ))}
        </div>

        {letterMessage && <p className="good">{letterMessage}</p>}
      </div>

      <div className="grid mini">
        <div className="gameCard">
          <h3>JOGO 2 — IMAGEM E PALAVRA</h3>

          <div className="picture">{combine.emoji}</div>

          <button
            className="audio"
            onClick={() =>
              speak(
                `ESCOLHA A PALAVRA CORRETA. OPÇÕES: ${combineOptions.join(', ')}`
              )
            }
          >
            <Volume2 />
            OUVIR
          </button>

          <div className="answers words">
            {combineOptions.map((word) => (
              <button
                key={word}
                onClick={() => chooseCombine(word)}
              >
                {word}
              </button>
            ))}
          </div>

          {combineMessage && <p className="good">{combineMessage}</p>}
        </div>

        <div className="gameCard">
          <h3>JOGO 3 — ORGANIZE A PALAVRA</h3>

          <div className="pattern">
            {order.length
              ? order.join(' ')
              : organizeWord
                .split('')
                .map(() => '_')
                .join(' ')}
          </div>

          <button
            className="audio"
            onClick={() =>
              speak(
                `ORGANIZE AS LETRAS PARA FORMAR ${organizeWord}`
              )
            }
          >
            <Volume2 />
            OUVIR PALAVRA
          </button>

          <div className="answers">
            {shuffledLetters.map((letter, index) => (
              <button
                key={`${letter}-${index}`}
                onClick={() => addLetter(letter)}
              >
                {letter}
              </button>
            ))}
          </div>

          <div className="row">
            <button
              className="soft"
              onClick={() => {
                setOrder([]);
                setOrganizeMessage('');
              }}
            >
              LIMPAR
            </button>

            <button
              className="primary"
              onClick={checkWord}
            >
              CONFERIR
            </button>
          </div>

          {organizeMessage && (
            <p className="good">{organizeMessage}</p>
          )}
        </div>
      </div>

      <div className="gameCard" style={{ marginTop: '20px' }}>
        <h3>JOGO 4 — COMPLETE A PALAVRA</h3>

        <div className="picture">{completeGame.emoji}</div>

        <div className="pattern">
          {displayedCompletePattern}
        </div>

        <button
          className="audio"
          onClick={() =>
            speak(
              `COMPLETE A PALAVRA ${completeGame.word}. ESCOLHA A LETRA QUE ESTÁ FALTANDO.`
            )
          }
        >
          <Volume2 />
          OUVIR
        </button>

        <div className="answers">
          {completeOptions.map((letter) => (
            <button
              key={letter}
              onClick={() => chooseCompleteLetter(letter)}
            >
              {letter}
            </button>
          ))}
        </div>

        {completeMessage && (
          <p
            className={
              completeMessage.includes('MUITO BEM')
                ? 'good'
                : 'hint'
            }
          >
            {completeMessage}
          </p>
        )}
      </div>

      <div
        className="gameCard math-game-card"
        style={{
          marginTop: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {!mathStarted && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '24px'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '430px',
                textAlign: 'center',
                padding: '28px',
                borderRadius: '22px',
                background: 'rgba(255, 255, 255, 0.94)',
                boxShadow: '0 12px 35px rgba(15, 23, 42, 0.16)'
              }}
            >
              <div
                style={{
                  fontSize: '58px',
                  marginBottom: '8px'
                }}
              >
                🧮
              </div>

              <h3
                style={{
                  margin: '0 0 10px'
                }}
              >
                DESAFIO DE MATEMÁTICA
              </h3>

              <p
                style={{
                  margin: '0 0 18px',
                  lineHeight: 1.5
                }}
              >
                O TEMPO SÓ VAI COMEÇAR QUANDO VOCÊ APERTAR EM
                INICIAR DESAFIO.
              </p>

              <button
                className="primary"
                onClick={startMathChallenge}
                style={{
                  fontSize: '18px',
                  padding: '14px 24px'
                }}
              >
                ▶ INICIAR DESAFIO
              </button>
            </div>
          </div>
        )}

        <div className="math-game-heading">
          <div>
            <span className="math-game-badge">➕ MATEMÁTICA</span>
            <h3>JOGO 5 — DESAFIO DE MATEMÁTICA</h3>
          </div>
          <div className="math-heading-actions">
            <div
              className={
                mathTimeLeft <= 8
                  ? 'math-timer math-timer-warning'
                  : 'math-timer'
              }
            >
              ⏱️ {mathTimeLeft}s
            </div>
            <span className="math-game-icon">🧮</span>
          </div>
        </div>

        <div className="math-time-track">
          <div
            className="math-time-fill"
            style={{
              width: `${Math.max(
                0,
                (mathTimeLeft / 25) * 100
              )}%`
            }}
          />
        </div>

        <p className="instruction">
          CONTE, SOME OU SUBTRAIA. VOCÊ TEM 25 SEGUNDOS.
          SE ERRAR, O JOGO VAI DAR UMA DICA.
        </p>

        {mathGame.visual && (
          <div className="math-visual">{mathGame.visual}</div>
        )}

        <div className="math-question">
          {mathGame.question}
        </div>

        <button
          className="audio"
          onClick={() =>
            speak(
              `${mathGame.question} ESCOLHA UMA DAS RESPOSTAS: ${mathOptions.join(', ')}`
            )
          }
        >
          <Volume2 />
          OUVIR DESAFIO
        </button>

        <div className="answers math-answers">
          {mathOptions.map((option) => (
            <button
              key={option}
              disabled={mathLocked}
              onClick={() => chooseMathAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>

        {mathMessage && (
          <div
            className={
              mathMessage.includes('MUITO BEM')
                ? 'math-feedback success'
                : 'math-feedback help'
            }
          >
            <b>{mathMessage}</b>
            {mathHelp && <p>{mathHelp}</p>}
          </div>
        )}

        {mathVisualHelp && (
          <div className="math-visual-help">
            <p>{mathVisualHelp.text}</p>
            <div className="math-object-row">{mathVisualHelp.top}</div>
            <div className="math-operation-symbol">{mathVisualHelp.symbol}</div>
            <div className="math-object-row">{mathVisualHelp.bottom}</div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ===========================
   CONQUISTAS
=========================== */

function Achievements({
  progress
}: {
  progress: Progress;
}) {
  const achievements = [
    {
      emoji: '🌱',
      title: 'Primeiro passo',
      unlocked: progress.activities >= 1
    },
    {
      emoji: '⭐',
      title: 'Super estudante',
      unlocked: progress.activities >= 10
    },
    {
      emoji: '🔤',
      title: 'Mestre das letras',
      unlocked: progress.letters >= 20
    },
    {
      emoji: '📖',
      title: 'Leitor iniciante',
      unlocked: progress.words >= 10
    },
    {
      emoji: '🏆',
      title: 'Campeão das atividades',
      unlocked: progress.activities >= 25
    }
  ];

  return (
    <section>
      <h2>🏆 Minhas conquistas</h2>

      <button
        className="audio"
        onClick={() =>
          speak(
            'Aqui estão suas conquistas. Continue fazendo atividades para ganhar novas recompensas.'
          )
        }
        style={{ marginBottom: '18px' }}
      >
        <Volume2 />
        Ouvir
      </button>

      <div className="grid">
        {achievements.map((achievement) => (
          <div
            className="module"
            key={achievement.title}
            style={{
              opacity: achievement.unlocked ? 1 : 0.45
            }}
          >
            <span>{achievement.emoji}</span>
            <b>{achievement.title}</b>
            <small>
              {achievement.unlocked
                ? 'Conquistado! 🎉'
                : 'Continue aprendendo para desbloquear.'}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===========================
   PERFIL DO ALUNO
=========================== */

function Profile({
  name,
  avatar,
  progress,
  learning,
  go
}: {
  name: string;
  avatar: string;
  progress: Progress;
  learning: LearningState;
  go: (p: Page) => void;
}) {
  void learning;

  return (
    <section>
      <h2>👤 Meu perfil</h2>

      <div className="gameCard">
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <StudentAvatar
              avatar={avatar}
              size={120}
            />
          </div>
          <h2>{name}</h2>

          <button
            className="audio"
            onClick={() =>
              speak(
                `Este é o seu perfil, ${name}. Você tem ${progress.stars} estrelas, concluiu ${progress.activities} atividades e ganhou ${progress.points} pontos. Continue aprendendo!`
              )
            }
          >
            <Volume2 />
            Ouvir meu progresso
          </button>
        </div>

        <div className="grid mini" style={{ marginTop: '20px' }}>
          <Stat
            icon="⭐"
            label="Estrelas"
            value={String(progress.stars)}
          />
          <Stat
            icon="🎯"
            label="Atividades"
            value={String(progress.activities)}
          />
          <Stat
            icon="🏅"
            label="Pontos"
            value={String(progress.points)}
          />
        </div>

        <div
          className="gameCard"
          style={{ marginTop: '20px' }}
        >
          <h3>🌟 Continue aprendendo!</h3>
          <p>
            Cada atividade concluída ajuda você a praticar
            letras, sílabas, palavras, leitura e escrita.
          </p>

          <button
            className="audio"
            onClick={() =>
              speak(
                'Cada atividade concluída ajuda você a praticar letras, sílabas, palavras, leitura e escrita. Continue aprendendo!'
              )
            }
          >
            <Volume2 />
            Ouvir mensagem
          </button>
        </div>

        <button
          className="soft"
          onClick={() => go('role')}
        >
          🔄 Trocar perfil
        </button>
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="module">
      <span>{icon}</span>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  );
}

/* ===========================
   ÁREA DO PROFESSOR
=========================== */

function TeacherArea({
  students,
  selectedStudent,
  selectedProgress,
  selectedLearning,
  onAddStudent,
  onDeleteStudent,
  onUpdateStudentAvatar,
  onViewStudent,
  onChangeLevel,
  onClearActivityHistory,
  onChangePassword,
  onBack
}: {
  students: Student[];
  selectedStudent: Student | null;
  selectedProgress: Progress | null;
  selectedLearning: LearningState | null;
  onAddStudent: (
    studentName: string,
    studentAvatar: string
  ) => Promise<boolean>;
  onDeleteStudent: (id: string) => void;
  onUpdateStudentAvatar: (
    studentId: string,
    newAvatar: string
  ) => Promise<boolean>;
  onViewStudent: (student: Student) => void;
  onChangeLevel: (
    studentId: string,
    level: Level | null
  ) => void;
  onClearActivityHistory: (studentId: string) => void;
  onChangePassword: (
    currentPassword: string,
    newPassword: string
  ) => { ok: boolean; message: string };
  onBack: () => void;
}) {
  const [studentName, setStudentName] = useState('');
  const [studentAvatar, setStudentAvatar] = useState('🧒');
  const [message, setMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [photoUpdateMessage, setPhotoUpdateMessage] = useState('');
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  const avatars = ['🧒', '👧', '👦', '🧑', '👩', '👨'];

  const resizeStudentPhoto = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Escolha uma imagem válida.'));
        return;
      }

      const reader = new FileReader();

      reader.onerror = () =>
        reject(new Error('Não foi possível ler a imagem.'));

      reader.onload = () => {
        const image = new Image();

        image.onerror = () =>
          reject(new Error('Não foi possível carregar a imagem.'));

        image.onload = () => {
          const maxSize = 400;

          let width = image.width;
          let height = image.height;

          if (width > height && width > maxSize) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width / height) * maxSize;
            height = maxSize;
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);

          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Não foi possível processar a imagem.'));
            return;
          }

          ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          resolve(
            canvas.toDataURL('image/jpeg', 0.75)
          );
        };

        image.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    });

  const handleStudentPhoto = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const resizedImage = await resizeStudentPhoto(file);
      setStudentAvatar(resizedImage);
      setMessage('Foto selecionada ✅');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível processar a imagem.'
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleExistingStudentPhoto = async (
    event: React.ChangeEvent<HTMLInputElement>,
    studentId: string
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhotoUpdateMessage('');
    setUpdatingPhoto(true);

    try {
      const resizedImage = await resizeStudentPhoto(file);
      const ok = await onUpdateStudentAvatar(
        studentId,
        resizedImage
      );

      setPhotoUpdateMessage(
        ok
          ? 'Foto do aluno atualizada com sucesso! ✅'
          : 'Não foi possível atualizar a foto do aluno.'
      );
    } catch (error) {
      setPhotoUpdateMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível processar a imagem.'
      );
    } finally {
      setUpdatingPhoto(false);
      event.target.value = '';
    }
  };

  const add = async () => {
    const ok = await onAddStudent(
      studentName,
      studentAvatar
    );

    if (!ok) {
      setMessage('Não foi possível cadastrar o aluno.');
      return;
    }

    setStudentName('');
    setStudentAvatar('🧒');
    setMessage('Aluno cadastrado com sucesso! ✅');
  };

  const updatePassword = () => {
    const result = onChangePassword(
      currentPassword,
      newPassword
    );

    setPasswordMessage(result.message);

    if (result.ok) {
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  const accuracy =
    selectedLearning && selectedLearning.totalAttempts > 0
      ? Math.round(
        (selectedLearning.correctAnswers /
          selectedLearning.totalAttempts) *
        100
      )
      : 0;

  const currentLevel = selectedLearning
    ? getCurrentLevel(selectedLearning)
    : null;

  const lastUpdate =
    selectedLearning?.updatedAt
      ? new Date(selectedLearning.updatedAt).toLocaleString('pt-BR')
      : 'Nenhuma atividade registrada';

  const getPedagogicalRecommendation = () => {
    if (!selectedLearning || !selectedProgress || !currentLevel) {
      return {
        title: 'Acompanhamento pendente',
        text:
          'Ainda não existem dados suficientes para gerar uma recomendação pedagógica.'
      };
    }

    if (currentLevel === 'Garatuja') {
      return {
        title: 'Reconhecimento de letras e escrita',
        text:
          'Priorize atividades de reconhecimento das letras, diferenciação entre desenho e escrita e prática de traçado.'
      };
    }

    if (currentLevel === 'Pré-silábico') {
      return {
        title: 'Relação entre letras, sons e palavras',
        text:
          'Trabalhe letras iniciais, associação entre imagem e palavra e reconhecimento dos sons presentes nas palavras.'
      };
    }

    if (currentLevel === 'Silábico sem valor') {
      return {
        title: 'Consciência silábica',
        text:
          'Reforce a percepção das sílabas, a divisão das palavras em partes sonoras e a relação entre fala e escrita.'
      };
    }

    if (currentLevel === 'Silábico com valor') {
      return {
        title: 'Correspondência sonora',
        text:
          'Trabalhe a relação entre os sons das sílabas e as letras utilizadas, utilizando atividades de completar palavras.'
      };
    }

    if (currentLevel === 'Silábico-Alfabético') {
      return {
        title: 'Formação de palavras e leitura',
        text:
          'Estimule a formação completa de palavras, organização de letras, leitura e escrita de palavras simples.'
      };
    }

    if (accuracy < 60) {
      return {
        title: 'Reforço dos conteúdos',
        text:
          'A taxa de acerto está abaixo de 60%. Recomenda-se revisar conteúdos já trabalhados antes de avançar para atividades mais complexas.'
      };
    }

    return {
      title: 'Leitura e produção escrita',
      text:
        'Amplie as atividades de leitura, compreensão, escrita de palavras e produção de frases simples.'
    };
  };

  const recommendation = getPedagogicalRecommendation();
  const generateStudentReportPDF = () => {
  if (
    !selectedStudent ||
    !selectedProgress ||
    !selectedLearning
  ) {
    setMessage(
      'Selecione um aluno antes de gerar o relatório.'
    );
    return;
  }

  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  const level =
    getCurrentLevel(selectedLearning) ??
    'Não definido';

  const reportDate =
    new Date().toLocaleDateString('pt-BR');

  const lastUpdateReport =
    selectedLearning.updatedAt
      ? new Date(
          selectedLearning.updatedAt
        ).toLocaleString('pt-BR')
      : 'Nenhuma atividade registrada';

  const sourceLabel = (
    source: LevelHistoryEntry['source']
  ) => {
    if (source === 'sondagem') {
      return 'Sondagem inicial';
    }

    if (source === 'professor') {
      return 'Professor';
    }

    return 'Sistema';
  };

  /*
   * CABEÇALHO
   */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(
    'ALFABETIZA+',
    pageWidth / 2,
    18,
    { align: 'center' }
  );

  doc.setFontSize(14);
  doc.text(
    'RELATÓRIO PEDAGÓGICO INDIVIDUAL',
    pageWidth / 2,
    27,
    { align: 'center' }
  );

  doc.setDrawColor(200);
  doc.line(
    margin,
    32,
    pageWidth - margin,
    32
  );

  /*
   * FOTO DO ALUNO
   */
  let studentTextX = margin;
  let startY = 43;

  if (
    selectedStudent.avatar &&
    selectedStudent.avatar.startsWith(
      'data:image/'
    )
  ) {
    try {
      const imageType =
        selectedStudent.avatar.includes(
          'image/png'
        )
          ? 'PNG'
          : 'JPEG';

      doc.addImage(
        selectedStudent.avatar,
        imageType,
        margin,
        40,
        28,
        28
      );

      studentTextX = 48;
    } catch (error) {
      console.error(
        'Erro ao adicionar foto ao PDF:',
        error
      );
    }
  }

  /*
   * DADOS PRINCIPAIS
   */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);

  doc.text(
    selectedStudent.name,
    studentTextX,
    startY
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(
    `Data do relatório: ${reportDate}`,
    studentTextX,
    startY + 8
  );

  doc.text(
    `Última atualização: ${lastUpdateReport}`,
    studentTextX,
    startY + 14
  );

  /*
   * RESUMO
   */
  let y = 80;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    '1. RESUMO DO ALUNO',
    margin,
    y
  );

  y += 6;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [
      ['Indicador', 'Resultado']
    ],
    body: [
      [
        'Nível inicial',
        selectedLearning.initialLevel ??
          'Não definido'
      ],
      [
        'Nível atual',
        level
      ],
      [
        'Pontuação na sondagem',
        `${selectedLearning.assessmentScore} de 6`
      ],
      [
        'Atividades realizadas',
        String(selectedProgress.activities)
      ],
      [
        'Taxa de acerto',
        `${accuracy}%`
      ],
      [
        'Respostas corretas',
        String(
          selectedLearning.correctAnswers
        )
      ],
      [
        'Respostas incorretas',
        String(
          selectedLearning.wrongAnswers
        )
      ],
      [
        'Pontos',
        String(selectedProgress.points)
      ],
      [
        'Estrelas',
        String(selectedProgress.stars)
      ]
    ],
    styles: {
      fontSize: 9
    },
    headStyles: {
      fontStyle: 'bold'
    }
  });

  y =
    (doc as any).lastAutoTable.finalY +
    12;

  /*
   * PROGRESSO
   */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    '2. PROGRESSO DE APRENDIZAGEM',
    margin,
    y
  );

  y += 6;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [
      [
        'Habilidade',
        'Progresso',
        'Percentual'
      ]
    ],
    body: [
      [
        'Letras diferentes',
        `${selectedProgress.letters} de 26`,
        `${pct(
          selectedProgress.letters,
          26
        )}%`
      ],
      [
        'Sílabas diferentes',
        `${selectedProgress.syllables} de 75`,
        `${pct(
          selectedProgress.syllables,
          75
        )}%`
      ],
      [
        'Palavras diferentes',
        `${selectedProgress.words} de 25`,
        `${pct(
          selectedProgress.words,
          25
        )}%`
      ]
    ],
    styles: {
      fontSize: 9
    }
  });

  y =
    (doc as any).lastAutoTable.finalY +
    12;

  /*
   * EVOLUÇÃO DOS NÍVEIS
   */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    '3. EVOLUÇÃO DO NÍVEL DE ESCRITA',
    margin,
    y
  );

  y += 6;

  const levelHistory =
    selectedLearning.levelHistory ?? [];

  if (levelHistory.length > 0) {
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      head: [
        [
          'Data',
          'Nível',
          'Origem'
        ]
      ],
      body: levelHistory.map(
        (entry) => [
          new Date(
            entry.at
          ).toLocaleDateString(
            'pt-BR'
          ),
          entry.level,
          sourceLabel(entry.source)
        ]
      ),
      styles: {
        fontSize: 8
      }
    });

    y =
      (doc as any)
        .lastAutoTable.finalY +
      12;
  } else {
    doc.setFont(
      'helvetica',
      'normal'
    );
    doc.setFontSize(10);
    doc.text(
      'Ainda não há registros de evolução.',
      margin,
      y + 4
    );

    y += 14;
  }

  /*
   * NOVA PÁGINA SE PRECISAR
   */
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  /*
   * HISTÓRICO DE ATIVIDADES
   */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    '4. ATIVIDADES RECENTES',
    margin,
    y
  );

  y += 6;

  const activityHistory =
    selectedProgress.history ?? [];

  if (activityHistory.length > 0) {
    autoTable(doc, {
      startY: y,
      theme: 'striped',
      head: [
        [
          'Data',
          'Atividade',
          'Pontos'
        ]
      ],
      body: activityHistory
        .slice(0, 15)
        .map((activity) => [
          new Date(
            activity.at
          ).toLocaleDateString(
            'pt-BR'
          ),
          activity.label,
          String(activity.score)
        ]),
      styles: {
        fontSize: 8
      }
    });

    y =
      (doc as any)
        .lastAutoTable.finalY +
      12;
  } else {
    doc.setFont(
      'helvetica',
      'normal'
    );
    doc.setFontSize(10);

    doc.text(
      'Nenhuma atividade registrada.',
      margin,
      y + 4
    );

    y += 14;
  }

  /*
   * GARANTE ESPAÇO PARA RECOMENDAÇÃO
   */
  if (y > 235) {
    doc.addPage();
    y = 20;
  }

  /*
   * RECOMENDAÇÃO PEDAGÓGICA
   */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);

  doc.text(
    '5. RECOMENDAÇÃO PEDAGÓGICA',
    margin,
    y
  );

  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);

  doc.text(
    recommendation.title,
    margin,
    y
  );

  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const recommendationText =
    doc.splitTextToSize(
      recommendation.text,
      pageWidth - margin * 2
    );

  doc.text(
    recommendationText,
    margin,
    y
  );

  y +=
    recommendationText.length * 5 +
    10;

  /*
   * OBSERVAÇÃO
   */
  if (y > 255) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(200);
  doc.line(
    margin,
    y,
    pageWidth - margin,
    y
  );

  y += 8;

  doc.setFont(
    'helvetica',
    'italic'
  );
  doc.setFontSize(8);

  const observation =
    'Este relatório apresenta indicadores de acompanhamento pedagógico gerados a partir das atividades realizadas no Alfabetiza+. A análise e a definição do nível de escrita permanecem sob responsabilidade do professor.';

  doc.text(
    doc.splitTextToSize(
      observation,
      pageWidth - margin * 2
    ),
    margin,
    y
  );

  /*
   * RODAPÉ
   */
  const totalPages =
    doc.getNumberOfPages();

  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber++
  ) {
    doc.setPage(pageNumber);

    doc.setFont(
      'helvetica',
      'normal'
    );
    doc.setFontSize(8);

    doc.text(
      `Alfabetiza+ • Página ${pageNumber} de ${totalPages}`,
      pageWidth / 2,
      290,
      {
        align: 'center'
      }
    );
  }

  /*
   * DOWNLOAD
   */
  const safeName =
    selectedStudent.name
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /[^a-zA-Z0-9]+/g,
        '_'
      )
      .replace(
        /^_+|_+$/g,
        ''
      );

  doc.save(
    `relatorio_${safeName || 'aluno'}.pdf`
  );
};
  const skillProgress = [
    {
      label: 'Letras',
      icon: '🔤',
      value: pct(selectedProgress?.letters ?? 0, 26),
      current: selectedProgress?.letters ?? 0,
      max: 26
    },
    {
      label: 'Sílabas',
      icon: '🧩',
      value: pct(selectedProgress?.syllables ?? 0, 75),
      current: selectedProgress?.syllables ?? 0,
      max: 75
    },
    {
      label: 'Palavras',
      icon: '📝',
      value: pct(selectedProgress?.words ?? 0, 25),
      current: selectedProgress?.words ?? 0,
      max: 25
    }
  ];

  return (
    <div className="app teacher-area" style={{ minHeight: '100vh' }}>
      <header>
        <button className="brand" onClick={onBack}>
          <span>👩‍🏫</span>
          <b>Área do Professor</b>
        </button>

        <button className="soft" onClick={onBack}>
          Trocar perfil
        </button>
      </header>

      <main>
        <section>
          <h2>👩‍🏫 Painel pedagógico</h2>

          <div className="gameCard">
            <h3>➕ Cadastrar aluno</h3>

            <input
              value={studentName}
              onChange={(event) =>
                setStudentName(event.target.value)
              }
              placeholder="Nome do aluno"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid #ddd',
                fontSize: '16px',
                marginBottom: '14px'
              }}
            />

            <div className="answers">
              {avatars.map((item) => (
                <button
                  key={item}
                  onClick={() => setStudentAvatar(item)}
                  style={{
                    transform:
                      studentAvatar === item
                        ? 'scale(1.12)'
                        : 'none'
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div
              style={{
                margin: '18px 0',
                padding: '18px',
                borderRadius: '16px',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                textAlign: 'center'
              }}
            >
              <p
                style={{
                  marginTop: 0,
                  fontWeight: 700
                }}
              >
                📷 Foto do aluno
              </p>

              <p
                style={{
                  fontSize: '13px',
                  opacity: 0.7
                }}
              >
                A foto ajuda a criança a reconhecer o próprio perfil.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                <StudentAvatar
                  avatar={studentAvatar}
                  size={90}
                />
              </div>

              <label
                style={{
                  display: 'inline-block',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: '#2563eb',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📁 Escolher foto

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStudentPhoto}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <button className="primary" onClick={add}>
              Cadastrar aluno
            </button>

            {message && <p className="good">{message}</p>}
          </div>

          <div className="gameCard teacher-security-card">
            <h3>
              <Lock size={20} /> Segurança do professor
            </h3>

            <p>
              Altere a senha usada para entrar no painel do
              professor.
            </p>

            <div className="teacher-security-grid">
              <label>
                Senha atual
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  placeholder="Senha atual"
                />
              </label>

              <label>
                Nova senha
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="Nova senha"
                />
              </label>
            </div>

            <button className="secondary" onClick={updatePassword}>
              <KeyRound size={18} />
              Alterar senha
            </button>

            {passwordMessage && (
              <p
                className={
                  passwordMessage.includes('sucesso')
                    ? 'good'
                    : 'hint'
                }
              >
                {passwordMessage}
              </p>
            )}
          </div>

          <div className="grid" style={{ marginTop: '24px' }}>
            {students.map((student) => {
              return (
                <div className="module" key={student.id}>
                  <StudentAvatar
                    avatar={student.avatar}
                    size={72}
                  />

                  <b>{student.name}</b>

                  <small>
                    Clique em "Ver progresso" para consultar os dados atualizados.
                  </small>

                  <button
                    className="primary"
                    onClick={() => onViewStudent(student)}
                  >
                    <BarChart3 size={18} />
                    Ver progresso
                  </button>

                  <button
                    className="soft"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Excluir o aluno ${student.name}?`
                        )
                      ) {
                        onDeleteStudent(student.id);
                      }
                    }}
                  >
                    Excluir
                  </button>
                </div>
              );
            })}
          </div>

          {students.length === 0 && (
            <div
              className="gameCard"
              style={{
                marginTop: '24px',
                textAlign: 'center'
              }}
            >
              <p>
                Nenhum aluno cadastrado ainda.
              </p>
            </div>
          )}

          {selectedStudent &&
            selectedProgress &&
            selectedLearning && (
              <div
                className="gameCard"
                style={{ marginTop: '28px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    marginBottom: '18px'
                  }}
                >
                  <StudentAvatar
                    avatar={selectedStudent.avatar}
                    size={72}
                  />

                  <div>
                    <h2 style={{ margin: 0 }}>
                      {selectedStudent.name}
                    </h2>

                    <label
                      className="soft"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '10px',
                        cursor: updatingPhoto
                          ? 'wait'
                          : 'pointer',
                        opacity: updatingPhoto ? 0.65 : 1
                      }}
                    >
                      📷 {updatingPhoto
                        ? 'Atualizando foto...'
                        : 'Alterar foto'}

                      <input
                        type="file"
                        accept="image/*"
                        disabled={updatingPhoto}
                        onChange={(event) =>
                          handleExistingStudentPhoto(
                            event,
                            selectedStudent.id
                          )
                        }
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

                <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}
      >
        <button
          className="primary"
          onClick={generateStudentReportPDF}
        >
          📄 Exportar relatório PDF
        </button>
      </div>

                {photoUpdateMessage && (
                  <p
                    className={
                      photoUpdateMessage.includes('sucesso')
                        ? 'good'
                        : 'hint'
                    }
                  >
                    {photoUpdateMessage}
                  </p>
                )}

                <div className="grid mini">
                  <Stat
                    icon="📚"
                    label="Nível atual"
                    value={
                      currentLevel ??
                      'Sondagem pendente'
                    }
                  />
                  <Stat
                    icon="🎯"
                    label="Atividades"
                    value={String(
                      selectedProgress.activities
                    )}
                  />
                  <Stat
                    icon="⭐"
                    label="Pontos"
                    value={String(
                      selectedProgress.points
                    )}
                  />
                  <Stat
                    icon="✅"
                    label="Taxa de acerto"
                    value={`${accuracy}%`}
                  />
                  <Stat
                    icon="🕒"
                    label="Última atualização"
                    value={lastUpdate}
                  />
                </div>

                <div
                  className="gameCard"
                  style={{ marginTop: '20px' }}
                >
                  <h3>
                    <ClipboardCheck size={20} /> Indicadores
                    pedagógicos
                  </h3>

                  <p>
                    Sondagem inicial:{' '}
                    <b>
                      {selectedLearning.assessmentCompleted
                        ? `${selectedLearning.assessmentScore}/6`
                        : 'Não realizada'}
                    </b>
                  </p>

                  <p>
                    Nível inicial:{' '}
                    <b>
                      {selectedLearning.initialLevel ??
                        'Pendente'}
                    </b>
                  </p>

                  <p>
                    Nível sugerido pelo sistema:{' '}
                    <b>
                      {selectedLearning.suggestedLevel ??
                        'Pendente'}
                    </b>
                  </p>

                  <p>
                    Acertos:{' '}
                    <b>
                      {selectedLearning.correctAnswers}
                    </b>{' '}
                    • Dificuldades:{' '}
                    <b>
                      {selectedLearning.wrongAnswers}
                    </b>
                  </p>

                  <p className="instruction">
                    O nível apresentado pelo sistema é um
                    indicador automático baseado na sondagem e
                    no desempenho nas atividades. A decisão
                    pedagógica final continua sendo do professor.
                  </p>
                </div>

                <div
                  className="gameCard"
                  style={{ marginTop: '20px' }}
                >
                  <h3>💡 Recomendação pedagógica</h3>

                  <p
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      marginBottom: '8px'
                    }}
                  >
                    {recommendation.title}
                  </p>

                  <p>
                    {recommendation.text}
                  </p>

                  <div
                    style={{
                      marginTop: '16px',
                      padding: '14px',
                      borderRadius: '14px',
                      background: '#f5f7fb'
                    }}
                  >
                    <b>📊 Dados considerados</b>

                    <p style={{ marginBottom: 0 }}>
                      Nível atual: <b>{currentLevel}</b>
                      <br />

                      Taxa de acerto: <b>{accuracy}%</b>
                      <br />

                      Atividades concluídas:{' '}
                      <b>{selectedProgress.activities}</b>
                    </p>
                  </div>

                  <p
                    className="instruction"
                    style={{ marginTop: '14px' }}
                  >
                    Esta recomendação funciona como apoio ao acompanhamento.
                    A avaliação e a decisão pedagógica continuam sendo
                    responsabilidade do professor.
                  </p>
                </div>

                <div
                  className="gameCard"
                  style={{
                    marginTop: '20px',
                    padding: '24px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                      marginBottom: '22px'
                    }}
                  >
                    <div>
                      <h3 style={{ marginBottom: '4px' }}>
                        📊 Progresso por habilidade
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          opacity: 0.7,
                          fontSize: '14px'
                        }}
                      >
                        Acompanhe o desenvolvimento do aluno nas principais áreas.
                      </p>
                    </div>

                    <div
                      style={{
                        padding: '8px 14px',
                        borderRadius: '999px',
                        background: '#f1f5f9',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}
                    >
                      🎯 VISÃO GERAL
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gap: '22px'
                    }}
                  >
                    {skillProgress.map((skill) => (
                      <div key={skill.label}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px',
                            gap: '10px'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '9px'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '22px'
                              }}
                            >
                              {skill.icon}
                            </span>

                            <div>
                              <b
                                style={{
                                  fontSize: '16px'
                                }}
                              >
                                {skill.label}
                              </b>

                              <div
                                style={{
                                  fontSize: '12px',
                                  opacity: 0.65,
                                  marginTop: '2px'
                                }}
                              >
                                {skill.current} de {skill.max}{' '}
                                {skill.label === 'Letras'
                                  ? 'letras diferentes'
                                  : skill.label === 'Sílabas'
                                    ? 'sílabas diferentes'
                                    : 'palavras diferentes'}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              minWidth: '62px',
                              textAlign: 'center',
                              padding: '6px 10px',
                              borderRadius: '10px',
                              background: '#f8fafc',
                              fontWeight: 800,
                              fontSize: '15px'
                            }}
                          >
                            {skill.value}%
                          </div>
                        </div>

                        <div
                          style={{
                            width: '100%',
                            height: '18px',
                            background: '#e9eef5',
                            borderRadius: '999px',
                            overflow: 'hidden',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                          }}
                        >
                          <div
                            style={{
                              width: `${skill.value}%`,
                              height: '100%',
                              borderRadius: '999px',
                              background:
                                skill.value >= 75
                                  ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                                  : skill.value >= 40
                                    ? 'linear-gradient(90deg, #2563eb, #38bdf8)'
                                    : 'linear-gradient(90deg, #f59e0b, #facc15)',
                              transition: 'width 0.6s ease'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: '22px',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: '#f8fafc',
                      fontSize: '13px',
                      lineHeight: 1.5
                    }}
                  >
                    <b>💡 Leitura do gráfico:</b>{' '}
                    quanto maior a barra, maior o progresso registrado naquela habilidade.
                  </div>
                </div>

                <div
                  className="gameCard"
                  style={{ marginTop: '20px' }}
                >
                  <h3>
                    <Pencil size={20} /> Editar nível do aluno
                  </h3>

                  <p>
                    Se você discordar da sugestão automática,
                    selecione manualmente o nível que considera
                    adequado.
                  </p>

                  <select
                    value={
                      selectedLearning.manualLevel ??
                      'automatico'
                    }
                    onChange={(event) => {
                      const value = event.target.value;

                      onChangeLevel(
                        selectedStudent.id,
                        value === 'automatico'
                          ? null
                          : (value as Level)
                      );
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '14px',
                      border: '1px solid #ddd',
                      fontSize: '16px'
                    }}
                  >
                    <option value="automatico">
                      Usar nível sugerido automaticamente
                    </option>

                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>

                  {selectedLearning.manualLevel && (
                    <p className="good">
                      Nível definido manualmente pelo professor:
                      {' '}
                      <b>
                        {selectedLearning.manualLevel}
                      </b>
                    </p>
                  )}

                  {!selectedLearning.manualLevel &&
                    selectedLearning.assessmentCompleted && (
                      <p className="good">
                        O sistema está atualizando o nível
                        automaticamente conforme o desempenho.
                      </p>
                    )}
                </div>

                <div
                  className="gameCard"
                  style={{ marginTop: '20px' }}
                >
                  <div className="teacher-card-title-row">
                    <h3>📋 Histórico de atividades</h3>

                    <button
                      className="danger-button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Limpar o histórico de atividades de ${selectedStudent.name}? Os pontos, estrelas, nível e progresso continuarão salvos.`
                          )
                        ) {
                          onClearActivityHistory(
                            selectedStudent.id
                          );
                        }
                      }}
                      disabled={
                        selectedProgress.history.length === 0
                      }
                    >
                      <Trash2 size={17} />
                      Limpar histórico
                    </button>
                  </div>

                  <p className="instruction">
                    Esta opção remove somente a lista de
                    atividades registradas. Pontos, estrelas,
                    habilidades e nível do aluno não são
                    apagados.
                  </p>

                  {selectedProgress.history.length === 0 ? (
                    <p>Nenhuma atividade registrada.</p>
                  ) : (
                    <div className="teacher-activity-history">
                      {selectedProgress.history.map(
                        (item, index) => (
                          <div
                            className="teacher-history-item"
                            key={`${item.at}-${index}`}
                          >
                            <div>
                              <b>{item.label}</b>
                              <small>
                                {new Date(
                                  item.at
                                ).toLocaleString('pt-BR')}
                              </small>
                            </div>

                            <strong>+{item.score} PTS</strong>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div
                  className="gameCard"
                  style={{ marginTop: '20px' }}
                >
                  <h3>🕒 Histórico de evolução</h3>

                  {selectedLearning.levelHistory.length === 0 ? (
                    <p>
                      Ainda não há mudanças de nível registradas.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gap: '10px'
                      }}
                    >
                      {[...selectedLearning.levelHistory]
                        .reverse()
                        .map((entry, index) => (
                          <div
                            key={`${entry.at}-${index}`}
                            style={{
                              padding: '12px',
                              borderRadius: '12px',
                              border: '1px solid #ddd'
                            }}
                          >
                            <b>{entry.level}</b>
                            <div>
                              <small>
                                {new Date(
                                  entry.at
                                ).toLocaleDateString('pt-BR')}{' '}
                                •{' '}
                                {entry.source === 'sondagem'
                                  ? 'SONDAGEM INICIAL'
                                  : entry.source === 'professor'
                                    ? 'ALTERAÇÃO DO PROFESSOR'
                                    : 'ATUALIZAÇÃO AUTOMÁTICA'}
                              </small>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>


              </div>
            )}
        </section>
      </main>
    </div>
  );
}
