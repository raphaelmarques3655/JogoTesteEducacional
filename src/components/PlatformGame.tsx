import React, { useEffect, useRef, useState } from 'react';

type Props = {
  level: number;
  onComplete: () => void;
  onExit: () => void;
};

type PowerType = 'grow' | 'shield' | 'speed' | 'jump' | 'life';

type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  walkFrame: number;
};

type Platform = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type Coin = {
  x: number;
  y: number;
  collected: boolean;
  phase: number;
};

type Enemy = {
  x: number;
  y: number;
  startX: number;
  endX: number;
  direction: number;
  width: number;
  height: number;
  alive: boolean;
};

type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  used: boolean;
};

type LetterPickup = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  letter: string;
  collected: boolean;
  onGround: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  gravity: number;
};

type Boss = {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: number;
  hp: number;
  maxHp: number;
  alive: boolean;
};

type Theme = 'day' | 'sunset' | 'night' | 'underground';

type LevelConfig = {
  width: number;
  startX: number;
  startY: number;
  finishX: number;
  checkpointX: number;
  timeLimit: number;
  theme: Theme;
  platforms: Platform[];
  coins: Coin[];
  enemies: Enemy[];
  blocks: Block[];
  boss: Boss | null;
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 450;

const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 42;
const BIG_PLAYER_WIDTH = 46;
const BIG_PLAYER_HEIGHT = 62;

const GRAVITY = 0.62;
const WALK_SPEED = 5;
const JUMP_FORCE = -12;

const GROW_DURATION = 12000;
const SHIELD_DURATION = 10000;
const SPEED_DURATION = 9000;
const JUMP_DURATION = 9000;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const POWER_COLORS: Record<PowerType, string> = {
  grow: '#ffd32a',
  shield: '#54d7ff',
  speed: '#ff9f43',
  jump: '#a55eea',
  life: '#ff5d8f'
};

const LETTER_POWER_MAP: Record<string, PowerType> = {
  A: 'grow',
  B: 'shield',
  C: 'speed',
  D: 'jump',
  E: 'life',

  F: 'grow',
  G: 'shield',
  H: 'speed',
  I: 'jump',

  // J agora possui um poder visível e testável:
  // ao coletá-lo, o personagem recebe ESCUDO.
  J: 'shield',

  K: 'grow',
  L: 'shield',
  M: 'speed',
  N: 'jump',
  O: 'life',

  P: 'grow',
  Q: 'shield',
  R: 'speed',
  S: 'jump',
  T: 'life',

  U: 'grow',
  V: 'shield',
  W: 'speed',
  X: 'jump',
  Y: 'life',

  Z: 'grow'
};

function getLetterPower(letter: string): PowerType {
  return LETTER_POWER_MAP[letter.toUpperCase()] ?? 'life';
}

function getPowerName(power: PowerType) {
  if (power === 'grow') return 'CRESCER';
  if (power === 'shield') return 'ESCUDO';
  if (power === 'speed') return 'VELOCIDADE';
  if (power === 'jump') return 'SUPER PULO';
  return 'VIDA EXTRA';
}

function makeCoin(x: number, y: number): Coin {
  return {
    x,
    y,
    collected: false,
    phase: Math.random() * Math.PI * 2
  };
}

function makeEnemy(
  x: number,
  y: number,
  startX: number,
  endX: number
): Enemy {
  return {
    x,
    y,
    startX,
    endX,
    direction: 1,
    width: 32,
    height: 35,
    alive: true
  };
}

function makeBlock(x: number, y: number): Block {
  return {
    x,
    y,
    w: 36,
    h: 36,
    used: false
  };
}

function createLevel(level: number): LevelConfig {
  const variation = ((level - 1) % 5) + 1;
  const difficulty = Math.min(1 + Math.floor((level - 1) / 5), 4);

  const theme: Theme =
    level % 4 === 1
      ? 'day'
      : level % 4 === 2
        ? 'sunset'
        : level % 4 === 3
          ? 'night'
          : 'underground';

  const bossLevel = level % 5 === 0;

  if (variation === 1) {
    const width = 2300 + difficulty * 100;
    const finishX = width - 100;

    return {
      width,
      startX: 60,
      startY: 330,
      finishX,
      checkpointX: 1100,
      timeLimit: 130 - difficulty * 8,
      theme,
      platforms: [
        { x: 0, y: 400, w: 450, h: 50 },
        { x: 520, y: 400, w: 430, h: 50 },
        { x: 1020, y: 400, w: 400, h: 50 },
        { x: 1510, y: 400, w: width - 1510, h: 50 },
        { x: 250, y: 320, w: 120, h: 20 },
        { x: 620, y: 310, w: 140, h: 20 },
        { x: 850, y: 250, w: 120, h: 20 },
        { x: 1150, y: 300, w: 130, h: 20 },
        { x: 1450, y: 250, w: 120, h: 20 },
        { x: 1750, y: 310, w: 150, h: 20 }
      ],
      coins: [
        makeCoin(300, 275),
        makeCoin(670, 265),
        makeCoin(900, 205),
        makeCoin(1200, 255),
        makeCoin(1500, 205),
        makeCoin(1800, 265)
      ],
      enemies: [
        makeEnemy(650, 365, 580, 900),
        makeEnemy(1600, 365, 1550, 1900)
      ],
      blocks: [
        makeBlock(740, 215),
        makeBlock(1320, 250),
        makeBlock(1900, 250)
      ],
      boss: bossLevel
        ? {
            x: finishX - 220,
            y: 340,
            width: 70,
            height: 60,
            direction: -1,
            hp: 3 + difficulty,
            maxHp: 3 + difficulty,
            alive: true
          }
        : null
    };
  }

  if (variation === 2) {
    const width = 2500 + difficulty * 100;
    const finishX = width - 100;

    return {
      width,
      startX: 50,
      startY: 330,
      finishX,
      checkpointX: 1250,
      timeLimit: 125 - difficulty * 8,
      theme,
      platforms: [
        { x: 0, y: 400, w: 350, h: 50 },
        { x: 430, y: 400, w: 320, h: 50 },
        { x: 820, y: 400, w: 380, h: 50 },
        { x: 1280, y: 400, w: 360, h: 50 },
        { x: 1720, y: 400, w: width - 1720, h: 50 },
        { x: 190, y: 290, w: 120, h: 20 },
        { x: 520, y: 270, w: 130, h: 20 },
        { x: 900, y: 310, w: 120, h: 20 },
        { x: 1080, y: 240, w: 110, h: 20 },
        { x: 1380, y: 290, w: 130, h: 20 },
        { x: 1800, y: 250, w: 140, h: 20 },
        { x: 2050, y: 300, w: 120, h: 20 }
      ],
      coins: [
        makeCoin(240, 245),
        makeCoin(570, 225),
        makeCoin(950, 265),
        makeCoin(1120, 195),
        makeCoin(1430, 245),
        makeCoin(1850, 205),
        makeCoin(2100, 255)
      ],
      enemies: [
        makeEnemy(500, 365, 450, 700),
        makeEnemy(1350, 365, 1300, 1600),
        makeEnemy(1850, 365, 1760, 2150)
      ],
      blocks: [
        makeBlock(650, 210),
        makeBlock(1180, 180),
        makeBlock(1960, 240)
      ],
      boss: bossLevel
        ? {
            x: finishX - 220,
            y: 340,
            width: 70,
            height: 60,
            direction: -1,
            hp: 3 + difficulty,
            maxHp: 3 + difficulty,
            alive: true
          }
        : null
    };
  }

  if (variation === 3) {
    const width = 2700 + difficulty * 100;
    const finishX = width - 100;

    return {
      width,
      startX: 60,
      startY: 330,
      finishX,
      checkpointX: 1350,
      timeLimit: 120 - difficulty * 7,
      theme,
      platforms: [
        { x: 0, y: 400, w: 400, h: 50 },
        { x: 500, y: 400, w: 300, h: 50 },
        { x: 900, y: 400, w: 360, h: 50 },
        { x: 1360, y: 400, w: 300, h: 50 },
        { x: 1780, y: 400, w: width - 1780, h: 50 },
        { x: 300, y: 300, w: 100, h: 20 },
        { x: 560, y: 260, w: 120, h: 20 },
        { x: 930, y: 300, w: 110, h: 20 },
        { x: 1160, y: 220, w: 110, h: 20 },
        { x: 1450, y: 280, w: 110, h: 20 },
        { x: 1830, y: 290, w: 130, h: 20 },
        { x: 2140, y: 240, w: 120, h: 20 }
      ],
      coins: [
        makeCoin(340, 255),
        makeCoin(610, 215),
        makeCoin(980, 255),
        makeCoin(1210, 175),
        makeCoin(1500, 235),
        makeCoin(1880, 245),
        makeCoin(2190, 195)
      ],
      enemies: [
        makeEnemy(550, 365, 520, 760),
        makeEnemy(980, 365, 930, 1220),
        makeEnemy(1900, 365, 1800, 2200)
      ],
      blocks: [
        makeBlock(700, 210),
        makeBlock(1300, 180),
        makeBlock(2250, 190)
      ],
      boss: bossLevel
        ? {
            x: finishX - 220,
            y: 340,
            width: 74,
            height: 60,
            direction: -1,
            hp: 4 + difficulty,
            maxHp: 4 + difficulty,
            alive: true
          }
        : null
    };
  }

  if (variation === 4) {
    const width = 2900 + difficulty * 100;
    const finishX = width - 100;

    return {
      width,
      startX: 50,
      startY: 330,
      finishX,
      checkpointX: 1450,
      timeLimit: 115 - difficulty * 7,
      theme,
      platforms: [
        { x: 0, y: 400, w: 300, h: 50 },
        { x: 390, y: 400, w: 280, h: 50 },
        { x: 760, y: 400, w: 300, h: 50 },
        { x: 1160, y: 400, w: 300, h: 50 },
        { x: 1560, y: 400, w: 320, h: 50 },
        { x: 1980, y: 400, w: width - 1980, h: 50 },
        { x: 180, y: 300, w: 110, h: 20 },
        { x: 450, y: 250, w: 120, h: 20 },
        { x: 810, y: 300, w: 110, h: 20 },
        { x: 1200, y: 250, w: 130, h: 20 },
        { x: 1600, y: 290, w: 120, h: 20 },
        { x: 2050, y: 260, w: 120, h: 20 },
        { x: 2350, y: 210, w: 130, h: 20 }
      ],
      coins: [
        makeCoin(220, 255),
        makeCoin(500, 205),
        makeCoin(860, 255),
        makeCoin(1250, 205),
        makeCoin(1650, 245),
        makeCoin(2100, 215),
        makeCoin(2400, 165)
      ],
      enemies: [
        makeEnemy(420, 365, 400, 640),
        makeEnemy(1200, 365, 1180, 1420),
        makeEnemy(2050, 365, 2010, 2400)
      ],
      blocks: [
        makeBlock(580, 190),
        makeBlock(1380, 200),
        makeBlock(2500, 170)
      ],
      boss: bossLevel
        ? {
            x: finishX - 220,
            y: 340,
            width: 74,
            height: 60,
            direction: -1,
            hp: 4 + difficulty,
            maxHp: 4 + difficulty,
            alive: true
          }
        : null
    };
  }

  const width = 3100 + difficulty * 100;
  const finishX = width - 100;

  return {
    width,
    startX: 50,
    startY: 330,
    finishX,
    checkpointX: 1550,
    timeLimit: 110 - difficulty * 6,
    theme,
    platforms: [
      { x: 0, y: 400, w: 320, h: 50 },
      { x: 430, y: 400, w: 250, h: 50 },
      { x: 800, y: 400, w: 280, h: 50 },
      { x: 1180, y: 400, w: 280, h: 50 },
      { x: 1580, y: 400, w: 300, h: 50 },
      { x: 2000, y: 400, w: width - 2000, h: 50 },
      { x: 180, y: 290, w: 100, h: 20 },
      { x: 480, y: 240, w: 120, h: 20 },
      { x: 850, y: 290, w: 110, h: 20 },
      { x: 1220, y: 230, w: 120, h: 20 },
      { x: 1620, y: 280, w: 110, h: 20 },
      { x: 2050, y: 250, w: 120, h: 20 },
      { x: 2400, y: 200, w: 140, h: 20 }
    ],
    coins: [
      makeCoin(220, 245),
      makeCoin(530, 195),
      makeCoin(900, 245),
      makeCoin(1270, 185),
      makeCoin(1670, 235),
      makeCoin(2100, 205),
      makeCoin(2450, 155)
    ],
    enemies: [
      makeEnemy(470, 365, 450, 650),
      makeEnemy(1220, 365, 1200, 1430),
      makeEnemy(1650, 365, 1600, 1850),
      makeEnemy(2200, 365, 2050, 2500)
    ],
    blocks: [
      makeBlock(610, 190),
      makeBlock(1400, 180),
      makeBlock(2580, 160)
    ],
    boss: {
      x: finishX - 240,
      y: 340,
      width: 80,
      height: 60,
      direction: -1,
      hp: 5 + difficulty,
      maxHp: 5 + difficulty,
      alive: true
    }
  };
}

function collides(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) {
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
}

function playSound(
  frequency: number,
  duration = 0.1,
  type: OscillatorType = 'square'
) {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextClass) return;

    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.035;

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + duration
    );

    oscillator.stop(audio.currentTime + duration);
  } catch {
    // sem suporte a áudio
  }
}

export default function PlatformGame({
  level,
  onComplete,
  onExit
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStageRef = useRef<HTMLDivElement | null>(null);
  const mobileHudRef = useRef<HTMLDivElement | null>(null);
  const leftButtonRef = useRef<HTMLButtonElement | null>(null);
  const rightButtonRef = useRef<HTMLButtonElement | null>(null);
  const jumpButtonRef = useRef<HTMLButtonElement | null>(null);

  const keys = useRef<Record<string, boolean>>({});

  const levelRef = useRef<LevelConfig>(createLevel(level));

  const player = useRef<Player>({
    x: levelRef.current.startX,
    y: levelRef.current.startY,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    facing: 1,
    walkFrame: 0
  });

  const cameraX = useRef(0);
  const checkpointReached = useRef(false);
  const jumpLocked = useRef(false);

  const particles = useRef<Particle[]>([]);
  const letterPickups = useRef<LetterPickup[]>([]);
  const collectedLetters = useRef<string[]>([]);

  const invulnerableUntil = useRef(0);
  const growUntil = useRef(0);
  const shieldUntil = useRef(0);
  const speedUntil = useRef(0);
  const jumpUntil = useRef(0);

  const victoryTime = useRef(0);
  const fireworkStage = useRef(0);

  const animationTime = useRef(0);

  const livesRef = useRef(3);
  const coinsRef = useRef(0);
  const timeRef = useRef(levelRef.current.timeLimit);

  const [lives, setLives] = useState(3);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [timeLeft, setTimeLeft] = useState(levelRef.current.timeLimit);
  const [finished, setFinished] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [bossHp, setBossHp] = useState(levelRef.current.boss?.hp ?? 0);
  const [activePowers, setActivePowers] = useState<PowerType[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const resetGame = () => {
    const config = createLevel(level);

    levelRef.current = config;

    player.current = {
      x: config.startX,
      y: config.startY,
      vx: 0,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      facing: 1,
      walkFrame: 0
    };

    cameraX.current = 0;
    checkpointReached.current = false;
    jumpLocked.current = false;

    particles.current = [];
    letterPickups.current = [];
    collectedLetters.current = [];

    invulnerableUntil.current = 0;
    growUntil.current = 0;
    shieldUntil.current = 0;
    speedUntil.current = 0;
    jumpUntil.current = 0;

    victoryTime.current = 0;
    fireworkStage.current = 0;

    livesRef.current = 3;
    coinsRef.current = 0;
    timeRef.current = config.timeLimit;

    setLives(3);
    setCoinsCollected(0);
    setTimeLeft(config.timeLimit);
    setBossHp(config.boss?.hp ?? 0);
    setActivePowers([]);
    setFinished(false);
    setGameOver(false);
    setStarted(false);
    setCountdown(3);
  };

  useEffect(() => {
    resetGame();
  }, [level]);

  useEffect(() => {
    if (started) return;

    if (countdown <= 0) {
      setStarted(true);
      playSound(660, 0.15, 'square');
      return;
    }

    const timer = window.setTimeout(() => {
      playSound(300 + countdown * 100, 0.08, 'square');
      setCountdown((current) => current - 1);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [countdown, started]);

  useEffect(() => {
    if (!started || finished || gameOver) return;

    const timer = window.setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);

      if (timeRef.current <= 0) {
        setGameOver(true);
        playSound(100, 0.35, 'sawtooth');
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, finished, gameOver]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keys.current[key] = true;

      if (
        key === 'arrowleft' ||
        key === 'arrowright' ||
        key === 'arrowup' ||
        key === ' '
      ) {
        event.preventDefault();
      }
    };

    const keyUp = (event: KeyboardEvent) => {
      keys.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let lastPowerSignature = '';

    const getActivePowers = (now = Date.now()): PowerType[] => {
      const powers: PowerType[] = [];

      if (now < growUntil.current) powers.push('grow');
      if (now < shieldUntil.current) powers.push('shield');
      if (now < speedUntil.current) powers.push('speed');
      if (now < jumpUntil.current) powers.push('jump');

      return powers;
    };

    const syncPowerUi = (now = Date.now()) => {
      const powers = getActivePowers(now);
      const signature = powers.join('|');

      if (signature !== lastPowerSignature) {
        lastPowerSignature = signature;
        setActivePowers(powers);
      }
    };

    const spawnParticles = (
      x: number,
      y: number,
      count = 8,
      color = '#ffd700',
      gravity = 0.2
    ) => {
      for (let i = 0; i < count; i++) {
        particles.current.push({
          x,
          y,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * -4 - 1,
          life: 1,
          color,
          size: 2.5 + Math.random() * 2.5,
          gravity
        });
      }
    };

    const spawnFireworkBurst = (
      centerX: number,
      centerY: number,
      color: string
    ) => {
      for (let i = 0; i < 42; i++) {
        const angle = (Math.PI * 2 * i) / 42 + Math.random() * 0.08;
        const speed = 1.8 + Math.random() * 4.5;

        particles.current.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.25 + Math.random() * 0.45,
          color,
          size: 2 + Math.random() * 3.5,
          gravity: 0.045
        });
      }
    };

    const spawnFireworks = (centerX: number) => {
      const colors = [
        '#ff4757',
        '#ffd32a',
        '#2ed573',
        '#1e90ff',
        '#a55eea',
        '#ff9f43',
        '#ffffff'
      ];

      for (let i = 0; i < 7; i++) {
        const x = centerX - 300 + Math.random() * 600;
        const y = 60 + Math.random() * 210;
        const color = colors[Math.floor(Math.random() * colors.length)];

        spawnFireworkBurst(x, y, color);
      }
    };

    const setPlayerBig = () => {
      const p = player.current;

      growUntil.current = Date.now() + GROW_DURATION;

      if (p.height === BIG_PLAYER_HEIGHT) {
        syncPowerUi();
        return;
      }

      // Mantém a base/pés no mesmo Y:
      // o personagem cresce para cima, sem "flutuar".
      const feetY = p.y + p.height;

      p.width = BIG_PLAYER_WIDTH;
      p.height = BIG_PLAYER_HEIGHT;
      p.y = feetY - BIG_PLAYER_HEIGHT;

      syncPowerUi();
    };

    const setPlayerSmall = () => {
      const p = player.current;

      if (p.height === PLAYER_HEIGHT) return;

      const feetY = p.y + p.height;

      p.width = PLAYER_WIDTH;
      p.height = PLAYER_HEIGHT;
      p.y = feetY - PLAYER_HEIGHT;
    };

    const applyLetterPower = (letter: string) => {
      const power = getLetterPower(letter);
      const now = Date.now();

      if (power === 'grow') {
        setPlayerBig();
        playSound(1120, 0.2, 'triangle');
      }

      if (power === 'shield') {
        shieldUntil.current = now + SHIELD_DURATION;
        playSound(920, 0.2, 'triangle');
      }

      if (power === 'speed') {
        speedUntil.current = now + SPEED_DURATION;
        playSound(1280, 0.14, 'square');
      }

      if (power === 'jump') {
        jumpUntil.current = now + JUMP_DURATION;
        playSound(1380, 0.14, 'triangle');
      }

      if (power === 'life') {
        livesRef.current += 1;
        setLives(livesRef.current);
        playSound(1500, 0.2, 'triangle');
      }

      syncPowerUi(now);
    };

    const clearTemporaryPowers = () => {
      setPlayerSmall();

      growUntil.current = 0;
      shieldUntil.current = 0;
      speedUntil.current = 0;
      jumpUntil.current = 0;

      syncPowerUi();
    };

    const resetPlayer = () => {
      const config = levelRef.current;
      const p = player.current;

      clearTemporaryPowers();

      if (checkpointReached.current) {
        p.x = config.checkpointX;
        p.y = 400 - PLAYER_HEIGHT;
      } else {
        p.x = config.startX;
        p.y = config.startY;
      }

      p.vx = 0;
      p.vy = 0;
    };

    const absorbDamage = () => {
      const now = Date.now();

      // 1) Escudo: absorve 1 golpe e quebra.
      if (now < shieldUntil.current) {
        shieldUntil.current = 0;
        invulnerableUntil.current = now + 900;

        spawnParticles(
          player.current.x + player.current.width / 2,
          player.current.y + player.current.height / 2,
          28,
          '#54d7ff',
          0.08
        );

        playSound(620, 0.2, 'triangle');
        syncPowerUi(now);
        return true;
      }

      // 2) Se estiver grande, o golpe apenas diminui o personagem.
      if (now < growUntil.current) {
        growUntil.current = 0;
        setPlayerSmall();
        invulnerableUntil.current = now + 1000;

        spawnParticles(
          player.current.x + player.current.width / 2,
          player.current.y + player.current.height / 2,
          22,
          '#ffd32a',
          0.12
        );

        playSound(360, 0.18, 'square');
        syncPowerUi(now);
        return true;
      }

      return false;
    };

    const loseLife = () => {
      const now = Date.now();

      if (absorbDamage()) return;
      if (now < invulnerableUntil.current) return;

      invulnerableUntil.current = now + 1200;

      livesRef.current -= 1;
      setLives(livesRef.current);

      playSound(110, 0.25, 'sawtooth');

      if (livesRef.current <= 0) {
        setGameOver(true);
        return;
      }

      resetPlayer();
    };

    const updatePowerExpirations = (now: number) => {
      if (growUntil.current > 0 && now >= growUntil.current) {
        growUntil.current = 0;
        setPlayerSmall();
      }

      if (shieldUntil.current > 0 && now >= shieldUntil.current) {
        shieldUntil.current = 0;
      }

      if (speedUntil.current > 0 && now >= speedUntil.current) {
        speedUntil.current = 0;
      }

      if (jumpUntil.current > 0 && now >= jumpUntil.current) {
        jumpUntil.current = 0;
      }

      syncPowerUi(now);
    };

    const loop = () => {
      const config = levelRef.current;
      const p = player.current;
      const now = Date.now();

      animationTime.current += 0.08;
      updatePowerExpirations(now);

      if (started && !finished && !gameOver) {
        const speed =
          now < speedUntil.current
            ? WALK_SPEED * 1.65
            : WALK_SPEED;

        const jump =
          now < jumpUntil.current
            ? JUMP_FORCE * 1.32
            : JUMP_FORCE;

        const left =
          keys.current['arrowleft'] || keys.current['a'];

        const right =
          keys.current['arrowright'] || keys.current['d'];

        if (left) {
          p.vx = -speed;
          p.facing = -1;
          p.walkFrame += 0.25;
        } else if (right) {
          p.vx = speed;
          p.facing = 1;
          p.walkFrame += 0.25;
        } else {
          p.vx *= 0.75;
        }

        const previousBottom = p.y + p.height;

        const wantsJump =
          keys.current['arrowup'] ||
          keys.current['w'] ||
          keys.current[' '];

        let standing = false;

        config.platforms.forEach((platform) => {
          if (
            p.x + p.width > platform.x &&
            p.x < platform.x + platform.w &&
            Math.abs(p.y + p.height - platform.y) < 7
          ) {
            standing = true;
          }
        });

        if (wantsJump && standing && !jumpLocked.current) {
          p.vy = jump;
          jumpLocked.current = true;
          playSound(420, 0.07, 'square');
        }

        if (!wantsJump) jumpLocked.current = false;

        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;

        // Colisão com plataformas.
        config.platforms.forEach((platform) => {
          const newBottom = p.y + p.height;

          const horizontal =
            p.x + p.width > platform.x &&
            p.x < platform.x + platform.w;

          const landing =
            horizontal &&
            previousBottom <= platform.y + 8 &&
            newBottom >= platform.y &&
            p.vy >= 0;

          if (landing) {
            p.y = platform.y - p.height;
            p.vy = 0;
          }
        });

        // Blocos "?".
        config.blocks.forEach((block) => {
          if (block.used) return;

          const hitFromBelow =
            p.vy < 0 &&
            collides(
              p.x,
              p.y,
              p.width,
              p.height,
              block.x,
              block.y,
              block.w,
              block.h
            );

          if (!hitFromBelow) return;

          block.used = true;
          p.vy = 2.2;

          const availableLetters = ALPHABET.filter(
            (letter) =>
              !collectedLetters.current.includes(letter) &&
              !letterPickups.current.some(
                (pickup) =>
                  pickup.letter === letter &&
                  !pickup.collected
              )
          );

          const letter =
            availableLetters.length > 0
              ? availableLetters[
                  Math.floor(Math.random() * availableLetters.length)
                ]
              : ALPHABET[Math.floor(Math.random() * ALPHABET.length)];

          letterPickups.current.push({
            x: block.x + block.w / 2 - 15,
            y: block.y - 12,
            vx: Math.random() > 0.5 ? 1.8 : -1.8,
            vy: -8.5,
            letter,
            collected: false,
            onGround: false
          });

          spawnParticles(
            block.x + block.w / 2,
            block.y,
            14,
            '#ffe066',
            0.16
          );

          playSound(760, 0.1, 'square');
        });

        // Letras soltas pelo bloco.
        letterPickups.current.forEach((pickup) => {
          if (pickup.collected) return;

          const previousBottomLetter = pickup.y + 30;

          if (!pickup.onGround) {
            pickup.vy += 0.38;
            pickup.x += pickup.vx;
            pickup.y += pickup.vy;
          } else {
            pickup.x += pickup.vx * 0.24;
          }

          let landed = false;

          config.platforms.forEach((platform) => {
            const bottom = pickup.y + 30;

            const horizontal =
              pickup.x + 30 > platform.x &&
              pickup.x < platform.x + platform.w;

            if (
              horizontal &&
              previousBottomLetter <= platform.y + 7 &&
              bottom >= platform.y &&
              pickup.vy >= 0
            ) {
              pickup.y = platform.y - 30;
              pickup.vy = 0;
              pickup.onGround = true;
              landed = true;
            }
          });

          if (!landed && pickup.onGround) {
            const stillSupported = config.platforms.some(
              (platform) =>
                pickup.x + 30 > platform.x &&
                pickup.x < platform.x + platform.w &&
                Math.abs(pickup.y + 30 - platform.y) < 7
            );

            if (!stillSupported) {
              pickup.onGround = false;
            }
          }

          if (pickup.x < 0) {
            pickup.x = 0;
            pickup.vx *= -1;
          }

          if (pickup.x + 30 > config.width) {
            pickup.x = config.width - 30;
            pickup.vx *= -1;
          }

          if (
            collides(
              p.x,
              p.y,
              p.width,
              p.height,
              pickup.x,
              pickup.y,
              30,
              30
            )
          ) {
            pickup.collected = true;
            collectedLetters.current.push(pickup.letter);

            applyLetterPower(pickup.letter);

            spawnParticles(
              pickup.x + 15,
              pickup.y + 15,
              22,
              POWER_COLORS[getLetterPower(pickup.letter)],
              0.08
            );

            playSound(1050, 0.15, 'triangle');
          }

          // Se cair num buraco, volta para perto do jogador.
          if (pickup.y > CANVAS_HEIGHT + 100) {
            pickup.x = Math.min(config.width - 80, p.x + 90);
            pickup.y = Math.max(70, p.y - 120);
            pickup.vy = -4;
            pickup.onGround = false;
          }
        });

        // Moedas.
        config.coins.forEach((coin) => {
          if (coin.collected) return;

          if (
            collides(
              p.x,
              p.y,
              p.width,
              p.height,
              coin.x - 12,
              coin.y - 12,
              24,
              24
            )
          ) {
            coin.collected = true;
            coinsRef.current += 1;
            setCoinsCollected(coinsRef.current);

            spawnParticles(coin.x, coin.y, 8, '#ffd700', 0.12);
            playSound(880, 0.07, 'square');
          }
        });

        // Inimigos.
        config.enemies.forEach((enemy) => {
          if (!enemy.alive) return;

          enemy.x += 1.4 * enemy.direction;

          if (enemy.x <= enemy.startX) enemy.direction = 1;
          if (enemy.x >= enemy.endX) enemy.direction = -1;

          if (
            collides(
              p.x,
              p.y,
              p.width,
              p.height,
              enemy.x,
              enemy.y,
              enemy.width,
              enemy.height
            )
          ) {
            const playerBottom = p.y + p.height;

            if (p.vy > 0 && playerBottom - enemy.y < 18) {
              enemy.alive = false;
              p.vy = -8;

              spawnParticles(
                enemy.x + enemy.width / 2,
                enemy.y,
                13,
                '#ff9f43',
                0.12
              );

              playSound(180, 0.07, 'square');
            } else {
              loseLife();
            }
          }
        });

        // Chefão.
        const boss = config.boss;

        if (boss && boss.alive) {
          boss.x += 1.1 * boss.direction;

          const minX = config.finishX - 320;
          const maxX = config.finishX - 80;

          if (boss.x < minX) boss.direction = 1;
          if (boss.x > maxX) boss.direction = -1;

          if (
            collides(
              p.x,
              p.y,
              p.width,
              p.height,
              boss.x,
              boss.y,
              boss.width,
              boss.height
            )
          ) {
            const playerBottom = p.y + p.height;

            if (p.vy > 0 && playerBottom - boss.y < 24) {
              boss.hp -= 1;
              setBossHp(Math.max(0, boss.hp));
              p.vy = -10;

              spawnParticles(
                boss.x + boss.width / 2,
                boss.y,
                22,
                '#ff4757',
                0.1
              );

              playSound(140, 0.15, 'square');

              if (boss.hp <= 0) {
                boss.alive = false;
                playSound(650, 0.3, 'triangle');
              }
            } else {
              loseLife();
            }
          }
        }

        // Checkpoint.
        if (
          !checkpointReached.current &&
          p.x >= config.checkpointX
        ) {
          checkpointReached.current = true;
          playSound(520, 0.15, 'triangle');
        }

        // Cair.
        if (p.y > CANVAS_HEIGHT + 150) {
          loseLife();
        }

        if (p.x < 0) p.x = 0;

        const bossCleared = !config.boss || !config.boss.alive;

        // Vitória.
        if (
          p.x >= config.finishX &&
          bossCleared &&
          victoryTime.current === 0
        ) {
          victoryTime.current = now;
          fireworkStage.current = 0;

          setFinished(true);
          playSound(760, 0.35, 'triangle');
        }

        const desiredCamera = p.x - CANVAS_WIDTH * 0.4;

        cameraX.current = Math.max(
          0,
          Math.min(desiredCamera, config.width - CANVAS_WIDTH)
        );
      }

      // Fogos continuam depois de finished=true.
      if (victoryTime.current > 0) {
        const elapsed = now - victoryTime.current;
        const thresholds = [0, 300, 650, 1000, 1400];

        while (
          fireworkStage.current < thresholds.length &&
          elapsed >= thresholds[fireworkStage.current]
        ) {
          spawnFireworks(config.finishX);
          playSound(
            800 + fireworkStage.current * 70,
            0.12,
            'triangle'
          );

          fireworkStage.current += 1;
        }
      }

      // Atualiza partículas.
      particles.current = particles.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.life -= 0.022;

        return particle.life > 0;
      });

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const camera = cameraX.current;

      drawBackground(
        ctx,
        config.theme,
        camera,
        config.width,
        animationTime.current
      );

      drawWorld(
        ctx,
        config,
        camera,
        checkpointReached.current,
        animationTime.current,
        letterPickups.current
      );

      drawParticles(ctx, particles.current, camera);

      drawPlayer(
        ctx,
        p,
        camera,
        now < invulnerableUntil.current,
        now < shieldUntil.current,
        now < speedUntil.current,
        now < jumpUntil.current,
        now < growUntil.current
      );

      drawHud(
        ctx,
        level,
        livesRef.current,
        coinsRef.current,
        config.coins.length,
        checkpointReached.current,
        timeRef.current,
        config.boss,
        p.x / Math.max(config.finishX, 1),
        getActivePowers(now),
        collectedLetters.current
      );

      if (!started) {
        drawCountdown(ctx, countdown);
      }

      if (gameOver) {
        drawOverlay(ctx, 'FIM DE JOGO', 'Tente novamente!');
      }

      if (finished) {
        drawVictoryMessage(ctx);
      }

      frame = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    started,
    finished,
    gameOver,
    countdown,
    level
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === gameStageRef.current
      );
    };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const stage = gameStageRef.current;

      if (!stage) {
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await stage.requestFullscreen();
    } catch (error) {
      console.error(
        'Não foi possível ativar a tela cheia:',
        error
      );
    }
  };

  /*
    MULTITOUCH MOBILE REAL

    Não dependemos de um botão "soltar" o outro.
    Em cada touchstart/touchmove/touchend, verificamos TODOS
    os dedos que continuam na tela e atualizamos as três teclas.
  */
  useEffect(() => {
    const hud = mobileHudRef.current;

    if (!hud) {
      return;
    }

    const touchIsInside = (
      touch: Touch,
      element: HTMLElement | null
    ) => {
      if (!element) {
        return false;
      }

      const rect = element.getBoundingClientRect();

      return (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      );
    };

    const updateControlsFromTouches = (
      touches: TouchList
    ) => {
      let leftPressed = false;
      let rightPressed = false;
      let jumpPressed = false;

      for (let index = 0; index < touches.length; index++) {
        const touch = touches.item(index);

        if (!touch) {
          continue;
        }

        if (touchIsInside(touch, leftButtonRef.current)) {
          leftPressed = true;
        }

        if (touchIsInside(touch, rightButtonRef.current)) {
          rightPressed = true;
        }

        if (touchIsInside(touch, jumpButtonRef.current)) {
          jumpPressed = true;
        }
      }

      keys.current['arrowleft'] = leftPressed;
      keys.current['arrowright'] = rightPressed;
      keys.current[' '] = jumpPressed;
    };

    const handleTouch = (
      event: TouchEvent
    ) => {
      event.preventDefault();
      updateControlsFromTouches(event.touches);
    };

    hud.addEventListener(
      'touchstart',
      handleTouch,
      { passive: false }
    );

    hud.addEventListener(
      'touchmove',
      handleTouch,
      { passive: false }
    );

    hud.addEventListener(
      'touchend',
      handleTouch,
      { passive: false }
    );

    hud.addEventListener(
      'touchcancel',
      handleTouch,
      { passive: false }
    );

    return () => {
      hud.removeEventListener(
        'touchstart',
        handleTouch
      );

      hud.removeEventListener(
        'touchmove',
        handleTouch
      );

      hud.removeEventListener(
        'touchend',
        handleTouch
      );

      hud.removeEventListener(
        'touchcancel',
        handleTouch
      );

      keys.current['arrowleft'] = false;
      keys.current['arrowright'] = false;
      keys.current[' '] = false;
    };
  }, []);

  const pressMobileKey = (
    key: 'arrowleft' | 'arrowright' | ' '
  ) => {
    keys.current[key] = true;
  };

  const releaseMobileKey = (
    key: 'arrowleft' | 'arrowright' | ' '
  ) => {
    keys.current[key] = false;
  };

  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center'
      }}
    >
      <style>{`
        .platform-game-stage {
          position: relative;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .platform-mobile-hud {
          display: none;
        }

        .platform-game-toolbar {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-bottom: 8px;
          box-sizing: border-box;
        }

        .platform-fullscreen-button {
          border: 0;
          border-radius: 12px;
          padding: 10px 14px;
          background: rgba(18,35,62,.95);
          color: white;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,.2);
        }

        .platform-fullscreen-button:hover {
          transform: translateY(-1px);
        }

        .platform-game-stage:fullscreen {
          width: 100vw;
          height: 100vh;
          max-width: none;
          margin: 0;
          padding: 12px;
          background: #0b1424;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .platform-game-stage:fullscreen .platform-game-toolbar {
          width: min(100%, 1100px);
          flex: 0 0 auto;
        }

        .platform-game-stage:fullscreen canvas {
          width: auto !important;
          height: auto !important;
          max-width: min(100%, 1100px) !important;
          max-height: calc(100vh - 130px) !important;
          object-fit: contain;
          flex: 0 1 auto;
        }

        .platform-game-stage:fullscreen .platform-mobile-hud {
          width: min(100%, 900px);
          flex: 0 0 auto;
        }

        @media (max-width: 768px), (pointer: coarse) {
          .platform-desktop-help {
            display: none;
          }

          .platform-game-stage canvas {
            border-radius: 16px !important;
            border-width: 3px !important;
          }

          /* Controles ficam FORA da área do jogo.
             Assim não escondem personagem, inimigos, moedas ou plataformas. */
          .platform-mobile-hud {
            position: static;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            width: 100%;
            padding: 12px 10px 4px;
            pointer-events: auto;
            z-index: 10;
            box-sizing: border-box;
            touch-action: none;
            overscroll-behavior: none;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
          }

          .platform-mobile-group {
            display: flex;
            gap: 10px;
            pointer-events: auto;
          }

          .platform-mobile-button {
            width: 54px;
            height: 54px;
            border: 2px solid rgba(255,255,255,.9);
            border-radius: 50%;
            background: rgba(18,35,62,.94);
            color: white;
            font-size: 24px;
            font-weight: 900;
            box-shadow:
              0 4px 12px rgba(0,0,0,.28),
              inset 0 0 10px rgba(255,255,255,.07);
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
          }

          .platform-mobile-button:active {
            transform: scale(.93);
            background: rgba(55,110,210,.95);
          }

          .platform-mobile-jump {
            width: 72px;
            height: 54px;
            border-radius: 18px;
            font-size: 14px;
            background: rgba(76,64,170,.95);
          }

          .platform-top-stats {
            font-size: 12px;
            gap: 7px !important;
          }

          .platform-game-toolbar {
            margin-bottom: 6px;
          }

          .platform-fullscreen-button {
            padding: 8px 11px;
            font-size: 13px;
          }

          .platform-game-stage:fullscreen {
            justify-content: flex-start;
            padding: 8px;
          }

          .platform-game-stage:fullscreen canvas {
            max-height: calc(100vh - 126px) !important;
          }
        }
      `}</style>
      <h2>🎮 FASE BÔNUS {level}</h2>

      <p className="platform-desktop-help">
        ← → ou A/D para andar • ↑, W ou Espaço para pular
      </p>
      <p
        style={{
          marginTop: '-4px',
          marginBottom: '12px',
          fontSize: '13px',
          opacity: 0.76
        }}
      >
        No celular, use os controles sobre o jogo.
      </p>

      <div
        className="platform-top-stats"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '12px',
          fontWeight: 800
        }}
      >
        <span>❤️ VIDAS: {lives}</span>
        <span>🪙 MOEDAS: {coinsCollected}</span>
        <span>⏱️ TEMPO: {timeLeft}</span>

        {activePowers.map((power) => (
          <span key={power}>
            ⚡ {getPowerName(power)}
          </span>
        ))}

        {levelRef.current.boss && (
          <span>👾 CHEFÃO: {bossHp}</span>
        )}
      </div>

      <div
        ref={gameStageRef}
        className="platform-game-stage"
      >
        <div className="platform-game-toolbar">
          <button
            type="button"
            className="platform-fullscreen-button"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '⤢ Sair da tela cheia' : '⛶ Tela cheia'}
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '900px',
            borderRadius: '24px',
            border: '6px solid white',
            boxShadow: '0 12px 35px rgba(0,0,0,.25)',
            touchAction: 'none'
          }}
        />

        <div
          ref={mobileHudRef}
          className="platform-mobile-hud"
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className="platform-mobile-group">
            <button
              ref={leftButtonRef}
              type="button"
              className="platform-mobile-button"
              aria-label="Andar para a esquerda"
              onPointerDown={(event) => {
                if (event.pointerType === 'touch') {
                  return;
                }

                event.preventDefault();
                event.currentTarget.setPointerCapture?.(event.pointerId);
                pressMobileKey('arrowleft');
              }}
              onPointerUp={(event) => {
                if (event.pointerType === 'touch') {
                  return;
                }

                event.preventDefault();
                releaseMobileKey('arrowleft');
              }}
              onPointerCancel={(event) => {
                if (event.pointerType !== 'touch') {
                  releaseMobileKey('arrowleft');
                }
              }}
            >
              ◀
            </button>

            <button
              ref={rightButtonRef}
              type="button"
              className="platform-mobile-button"
              aria-label="Andar para a direita"
              onPointerDown={(event) => {
                if (event.pointerType === 'touch') {
                  return;
                }

                event.preventDefault();
                event.currentTarget.setPointerCapture?.(event.pointerId);
                pressMobileKey('arrowright');
              }}
              onPointerUp={(event) => {
                if (event.pointerType === 'touch') {
                  return;
                }

                event.preventDefault();
                releaseMobileKey('arrowright');
              }}
              onPointerCancel={(event) => {
                if (event.pointerType !== 'touch') {
                  releaseMobileKey('arrowright');
                }
              }}
            >
              ▶
            </button>
          </div>

          <div className="platform-mobile-group">
            <button
              ref={jumpButtonRef}
              type="button"
              className="platform-mobile-button platform-mobile-jump"
              aria-label="Pular"
              onPointerDown={(event) => {
                if (event.pointerType === 'touch') {
                  return;
                }

                event.preventDefault();
                event.currentTarget.setPointerCapture?.(event.pointerId);
                pressMobileKey(' ');
              }}
              onPointerUp={(event) => {
                if (event.pointerType === 'touch') {
                  return;
                }

                event.preventDefault();
                releaseMobileKey(' ');
              }}
              onPointerCancel={(event) => {
                if (event.pointerType !== 'touch') {
                  releaseMobileKey(' ');
                }
              }}
            >
              PULAR
            </button>
          </div>
        </div>
      </div>

      {finished && (
        <div style={{ marginTop: '20px' }}>
          <h2>🏆 FASE CONCLUÍDA!</h2>

          <p>
            Você coletou <strong>{coinsCollected}</strong> moedas e{' '}
            <strong>{collectedLetters.current.length}</strong> letras.
          </p>

          <button
            className="primary"
            onClick={onComplete}
          >
            Continuar
          </button>
        </div>
      )}

      {gameOver && (
        <div style={{ marginTop: '20px' }}>
          <h2>💥 FIM DE JOGO</h2>

          <button
            className="primary"
            onClick={resetGame}
          >
            🔄 Tentar novamente
          </button>
        </div>
      )}

      {!finished && !gameOver && (
        <div style={{ marginTop: '16px' }}>
          <button
            className="primary"
            onClick={resetGame}
          >
            🔄 Reiniciar fase
          </button>
        </div>
      )}

      <div style={{ marginTop: '15px' }}>
        <button
          className="back"
          onClick={onExit}
        >
          Sair do jogo
        </button>
      </div>
    </div>
  );
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  camera: number,
  worldWidth: number,
  animation: number
) {
  if (theme === 'night') {
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);

    sky.addColorStop(0, '#07152f');
    sky.addColorStop(1, '#29456d');

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const moonGlow = ctx.createRadialGradient(
      760,
      75,
      5,
      760,
      75,
      68
    );

    moonGlow.addColorStop(0, 'rgba(255,255,220,.9)');
    moonGlow.addColorStop(1, 'rgba(255,255,220,0)');

    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(760, 75, 68, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffbd6';
    ctx.beginPath();
    ctx.arc(760, 75, 27, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 55; i++) {
      ctx.globalAlpha =
        0.45 + Math.abs(Math.sin(animation + i)) * 0.55;

      ctx.fillStyle = '#fff';

      const x = (i * 79) % CANVAS_WIDTH;
      const y = (i * 43) % 220;

      ctx.fillRect(
        x,
        y,
        i % 4 === 0 ? 2 : 1,
        i % 4 === 0 ? 2 : 1
      );
    }

    ctx.globalAlpha = 1;
  } else if (theme === 'underground') {
    const cave = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);

    cave.addColorStop(0, '#252734');
    cave.addColorStop(1, '#484b59');

    ctx.fillStyle = cave;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let x = -50; x < CANVAS_WIDTH + 100; x += 90) {
      ctx.fillStyle = '#555967';

      ctx.beginPath();
      ctx.ellipse(x, 75, 38, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);

    if (theme === 'sunset') {
      sky.addColorStop(0, '#ff8066');
      sky.addColorStop(0.55, '#ffc86b');
      sky.addColorStop(1, '#fff0bc');
    } else {
      sky.addColorStop(0, '#55c6ff');
      sky.addColorStop(0.6, '#bceeff');
      sky.addColorStop(1, '#f8fdff');
    }

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const sunY = theme === 'sunset' ? 120 : 70;

    const glow = ctx.createRadialGradient(
      760,
      sunY,
      5,
      760,
      sunY,
      75
    );

    glow.addColorStop(0, '#fff7a8');
    glow.addColorStop(0.55, 'rgba(255,213,74,.5)');
    glow.addColorStop(1, 'rgba(255,213,74,0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(760, sunY, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd447';
    ctx.beginPath();
    ctx.arc(760, sunY, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  if (theme !== 'underground') {
    // Montanhas distantes.
    const far = camera * 0.1;

    ctx.fillStyle = theme === 'night' ? '#243f63' : '#92c9aa';

    for (let x = -400; x < worldWidth; x += 500) {
      const px = x - far;

      ctx.beginPath();
      ctx.moveTo(px, 400);
      ctx.lineTo(px + 160, 210);
      ctx.lineTo(px + 330, 400);
      ctx.closePath();
      ctx.fill();
    }

    // Montanhas próximas.
    const near = camera * 0.22;

    ctx.fillStyle = theme === 'night' ? '#31547a' : '#68b98c';

    for (let x = -250; x < worldWidth; x += 420) {
      const px = x - near;

      ctx.beginPath();
      ctx.moveTo(px, 400);
      ctx.lineTo(px + 130, 270);
      ctx.lineTo(px + 270, 400);
      ctx.closePath();
      ctx.fill();
    }

    // Árvores.
    const treeCamera = camera * 0.38;

    for (let x = 120; x < worldWidth; x += 300) {
      const px = x - treeCamera;

      ctx.fillStyle = '#704a31';
      ctx.fillRect(px, 325, 16, 75);

      ctx.fillStyle = theme === 'night' ? '#225844' : '#2e9b50';

      ctx.beginPath();
      ctx.arc(px + 8, 310, 34, 0, Math.PI * 2);
      ctx.arc(px - 15, 330, 27, 0, Math.PI * 2);
      ctx.arc(px + 31, 330, 27, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nuvens.
    ctx.fillStyle =
      theme === 'night'
        ? 'rgba(190,205,225,.2)'
        : 'rgba(255,255,255,.92)';

    for (let x = 100; x < worldWidth; x += 520) {
      const px = x - camera * 0.3;
      const bob = Math.sin(animation + x * 0.01) * 3;

      ctx.beginPath();
      ctx.arc(px, 92 + bob, 23, 0, Math.PI * 2);
      ctx.arc(px + 30, 80 + bob, 33, 0, Math.PI * 2);
      ctx.arc(px + 65, 94 + bob, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWorld(
  ctx: CanvasRenderingContext2D,
  config: LevelConfig,
  camera: number,
  checkpointReached: boolean,
  animation: number,
  letterPickups: LetterPickup[]
) {
  // Plataformas.
  config.platforms.forEach((platform) => {
    const x = platform.x - camera;

    ctx.fillStyle = 'rgba(0,0,0,.17)';
    ctx.fillRect(
      x + 5,
      platform.y + 7,
      platform.w,
      platform.h
    );

    const ground = ctx.createLinearGradient(
      0,
      platform.y,
      0,
      platform.y + platform.h
    );

    if (config.theme === 'underground') {
      ground.addColorStop(0, '#707887');
      ground.addColorStop(1, '#3d424c');
    } else {
      ground.addColorStop(0, '#9c6740');
      ground.addColorStop(1, '#6c4027');
    }

    ctx.fillStyle = ground;
    ctx.fillRect(x, platform.y, platform.w, platform.h);

    ctx.fillStyle =
      config.theme === 'underground'
        ? '#7f8c8d'
        : '#49a942';

    ctx.fillRect(x, platform.y, platform.w, 10);

    if (config.theme !== 'underground') {
      ctx.fillStyle = '#86dc65';
      ctx.fillRect(x, platform.y, platform.w, 4);
    }

    ctx.fillStyle = 'rgba(255,255,255,.08)';

    for (let tx = 15; tx < platform.w; tx += 40) {
      ctx.fillRect(x + tx, platform.y + 22, 11, 4);
    }
  });

  // Blocos "?". 
  config.blocks.forEach((block) => {
    const x = block.x - camera;

    const gradient = ctx.createLinearGradient(
      x,
      block.y,
      x,
      block.y + block.h
    );

    if (block.used) {
      gradient.addColorStop(0, '#b0b5ba');
      gradient.addColorStop(1, '#777');
    } else {
      gradient.addColorStop(0, '#ffe56a');
      gradient.addColorStop(0.45, '#ffc928');
      gradient.addColorStop(1, '#d98f00');
    }

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.roundRect(x, block.y, block.w, block.h, 6);
    ctx.fill();

    ctx.strokeStyle = block.used ? '#666' : '#9f6800';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (!block.used) {
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#855500';
      ctx.shadowBlur = 3;
      ctx.font = 'bold 24px Arial';
      ctx.fillText('?', x + 11, block.y + 27);
      ctx.shadowBlur = 0;
    }
  });

  // Moedas.
  config.coins.forEach((coin) => {
    if (coin.collected) return;

    const x = coin.x - camera;
    const scale =
      0.52 +
      Math.abs(Math.sin(animation + coin.phase)) * 0.48;

    ctx.save();
    ctx.translate(x, coin.y);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);

    glow.addColorStop(0, 'rgba(255,250,170,.9)');
    glow.addColorStop(0.45, 'rgba(255,215,0,.5)');
    glow.addColorStop(1, 'rgba(255,215,0,0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(scale, 1);

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d89700';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff3a3';
    ctx.fillRect(-2, -8, 3, 12);

    ctx.restore();
  });

  // Letras/power-ups.
  letterPickups.forEach((pickup) => {
    if (pickup.collected) return;

    const x = pickup.x - camera;
    const y = pickup.y;

    const power = getLetterPower(pickup.letter);
    const color = POWER_COLORS[power];

    const pulse =
      1 + Math.sin(animation * 3 + pickup.x * 0.01) * 0.08;

    ctx.save();

    ctx.translate(x + 15, y + 15);
    ctx.scale(pulse, pulse);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);

    glow.addColorStop(0, 'rgba(255,255,255,.95)');
    glow.addColorStop(0.4, color);
    glow.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.globalAlpha = 0.55;
    ctx.fillStyle = glow;

    ctx.beginPath();
    ctx.arc(0, 0, 31, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    const orb = ctx.createLinearGradient(-15, -15, 15, 15);

    orb.addColorStop(0, '#ffffff');
    orb.addColorStop(0.2, color);
    orb.addColorStop(1, '#24489c');

    ctx.fillStyle = orb;

    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px Arial';

    ctx.fillText(pickup.letter, 0, 1);

    ctx.restore();
  });

  // Inimigos.
  config.enemies.forEach((enemy) => {
    if (!enemy.alive) return;

    const x = enemy.x - camera;

    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,.2)';

    ctx.beginPath();
    ctx.ellipse(
      x + enemy.width / 2,
      enemy.y + enemy.height + 3,
      17,
      5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const body = ctx.createLinearGradient(
      x,
      enemy.y,
      x,
      enemy.y + enemy.height
    );

    body.addColorStop(0, '#dc7c3d');
    body.addColorStop(1, '#813d20');

    ctx.fillStyle = body;

    ctx.beginPath();
    ctx.roundRect(
      x,
      enemy.y,
      enemy.width,
      enemy.height,
      10
    );
    ctx.fill();

    ctx.fillStyle = '#5c2f1c';
    ctx.fillRect(x - 2, enemy.y + 29, 15, 8);
    ctx.fillRect(x + 19, enemy.y + 29, 15, 8);

    ctx.fillStyle = '#fff';

    ctx.beginPath();
    ctx.arc(x + 10, enemy.y + 12, 5, 0, Math.PI * 2);
    ctx.arc(x + 22, enemy.y + 12, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222';

    ctx.beginPath();
    ctx.arc(x + 11, enemy.y + 13, 2, 0, Math.PI * 2);
    ctx.arc(x + 23, enemy.y + 13, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  if (config.boss && config.boss.alive) {
    drawBoss(ctx, config.boss, camera);
  }

  // Checkpoint.
  const checkpointScreen = config.checkpointX - camera;

  ctx.fillStyle = '#4b4b4b';
  ctx.fillRect(checkpointScreen, 320, 6, 80);

  ctx.fillStyle = checkpointReached ? '#2ecc71' : '#f1c40f';

  ctx.beginPath();
  ctx.moveTo(checkpointScreen + 6, 320);
  ctx.lineTo(checkpointScreen + 44, 332);
  ctx.lineTo(checkpointScreen + 6, 344);
  ctx.closePath();
  ctx.fill();

  if (checkpointReached) {
    ctx.fillStyle = 'rgba(46,204,113,.2)';

    ctx.beginPath();
    ctx.arc(
      checkpointScreen + 4,
      338,
      28,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Bandeira.
  const finish = config.finishX - camera;

  ctx.fillStyle = '#444';

  ctx.beginPath();
  ctx.roundRect(finish - 11, 389, 34, 11, 4);
  ctx.fill();

  const pole = ctx.createLinearGradient(
    finish,
    0,
    finish + 7,
    0
  );

  pole.addColorStop(0, '#b7c2cc');
  pole.addColorStop(0.5, '#fff');
  pole.addColorStop(1, '#8d99a6');

  ctx.fillStyle = pole;
  ctx.fillRect(finish, 270, 7, 120);

  ctx.fillStyle = '#ffd700';

  ctx.beginPath();
  ctx.arc(finish + 3.5, 267, 8, 0, Math.PI * 2);
  ctx.fill();

  const wave = Math.sin(animation * 2) * 5;

  const flag = ctx.createLinearGradient(
    finish,
    280,
    finish + 65,
    315
  );

  flag.addColorStop(0, '#ff6174');
  flag.addColorStop(1, '#d9203f');

  ctx.fillStyle = flag;

  ctx.beginPath();
  ctx.moveTo(finish + 7, 282);
  ctx.quadraticCurveTo(
    finish + 34,
    270 + wave,
    finish + 62,
    286
  );
  ctx.lineTo(finish + 62, 315);
  ctx.quadraticCurveTo(
    finish + 35,
    301 - wave,
    finish + 7,
    312
  );
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('★', finish + 25, 305);
}

function drawBoss(
  ctx: CanvasRenderingContext2D,
  boss: Boss,
  camera: number
) {
  const x = boss.x - camera;

  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,.3)';

  ctx.beginPath();
  ctx.ellipse(
    x + boss.width / 2,
    boss.y + boss.height + 5,
    35,
    8,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  const body = ctx.createLinearGradient(
    x,
    boss.y,
    x,
    boss.y + boss.height
  );

  body.addColorStop(0, '#9b3b42');
  body.addColorStop(1, '#511f28');

  ctx.fillStyle = body;

  ctx.beginPath();
  ctx.roundRect(
    x,
    boss.y,
    boss.width,
    boss.height,
    15
  );
  ctx.fill();

  ctx.fillStyle = '#f3c969';

  for (let i = 0; i < 3; i++) {
    const sx = x + 12 + i * 20;

    ctx.beginPath();
    ctx.moveTo(sx, boss.y);
    ctx.lineTo(sx + 8, boss.y - 15);
    ctx.lineTo(sx + 15, boss.y);
    ctx.fill();
  }

  ctx.fillStyle = '#fff';

  ctx.beginPath();
  ctx.arc(x + 20, boss.y + 22, 8, 0, Math.PI * 2);
  ctx.arc(
    x + boss.width - 20,
    boss.y + 22,
    8,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle = '#111';

  ctx.beginPath();
  ctx.arc(x + 21, boss.y + 23, 3, 0, Math.PI * 2);
  ctx.arc(
    x + boss.width - 19,
    boss.y + 23,
    3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  const hpWidth = 90;
  const hpPercent = Math.max(0, boss.hp / boss.maxHp);

  ctx.fillStyle = '#222';
  ctx.fillRect(
    x - (hpWidth - boss.width) / 2,
    boss.y - 25,
    hpWidth,
    10
  );

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(
    x - (hpWidth - boss.width) / 2,
    boss.y - 25,
    hpWidth * hpPercent,
    10
  );

  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  camera: number,
  blinking: boolean,
  shieldActive: boolean,
  speedActive: boolean,
  jumpActive: boolean,
  growActive: boolean
) {
  if (
    blinking &&
    Math.floor(Date.now() / 90) % 2 === 0
  ) {
    return;
  }

  const x = player.x - camera;
  const y = player.y;

  const scaleX = player.width / PLAYER_WIDTH;
  const scaleY = player.height / PLAYER_HEIGHT;

  const moving = Math.abs(player.vx) > 0.5;
  const legSwing = moving ? Math.sin(player.walkFrame) * 3.5 : 0;

  // Sombra no chão.
  ctx.fillStyle = 'rgba(0,0,0,.2)';

  ctx.beginPath();
  ctx.ellipse(
    x + player.width / 2,
    y + player.height + 5,
    18 * scaleX,
    5,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.save();

  if (growActive) {
    ctx.shadowColor = '#ffd32a';
    ctx.shadowBlur = 18;
  } else if (speedActive) {
    ctx.shadowColor = '#ff9f43';
    ctx.shadowBlur = 14;
  } else if (jumpActive) {
    ctx.shadowColor = '#a55eea';
    ctx.shadowBlur = 14;
  }

  // Tudo abaixo usa o personagem-base 32x42,
  // escalado para coincidir com a caixa de colisão real.
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);

  // Pernas/calça.
  ctx.fillStyle = '#1e3158';

  ctx.beginPath();
  ctx.roundRect(
    6,
    29 + Math.max(0, legSwing),
    8,
    13,
    3
  );
  ctx.roundRect(
    18,
    29 + Math.max(0, -legSwing),
    8,
    13,
    3
  );
  ctx.fill();

  // Tênis com sola.
  ctx.fillStyle = '#111b2b';

  ctx.beginPath();
  ctx.roundRect(
    2,
    38 + Math.max(0, legSwing),
    14,
    5,
    2
  );
  ctx.roundRect(
    17,
    38 + Math.max(0, -legSwing),
    14,
    5,
    2
  );
  ctx.fill();

  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(
    4,
    41 + Math.max(0, legSwing),
    11,
    2
  );
  ctx.fillRect(
    19,
    41 + Math.max(0, -legSwing),
    11,
    2
  );

  // Camiseta.
  const shirt = ctx.createLinearGradient(0, 12, 32, 36);

  shirt.addColorStop(0, '#6fa8ff');
  shirt.addColorStop(0.5, '#4076df');
  shirt.addColorStop(1, '#24479f');

  ctx.fillStyle = shirt;

  ctx.beginPath();
  ctx.roundRect(4, 14, 24, 22, 7);
  ctx.fill();

  // Faixa clara na camiseta.
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath();
  ctx.roundRect(7, 16, 5, 17, 3);
  ctx.fill();

  // Braços.
  ctx.fillStyle = '#f2c4a3';

  ctx.beginPath();
  ctx.roundRect(0, 17, 6, 16, 3);
  ctx.roundRect(26, 17, 6, 16, 3);
  ctx.fill();

  // Mãos.
  ctx.beginPath();
  ctx.arc(3, 32, 3.2, 0, Math.PI * 2);
  ctx.arc(29, 32, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Pescoço.
  ctx.fillStyle = '#efbd9b';
  ctx.fillRect(13, 11, 6, 6);

  // Cabeça.
  ctx.fillStyle = '#f3c5a6';

  ctx.beginPath();
  ctx.arc(16, 8, 12, 0, Math.PI * 2);
  ctx.fill();

  // Orelha voltada para trás.
  ctx.beginPath();
  ctx.arc(
    player.facing === 1 ? 6 : 26,
    9,
    3.2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Cabelo com topete.
  ctx.fillStyle = '#35251d';

  ctx.beginPath();
  ctx.arc(16, 4, 12, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(9, 1, 7, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(20, 1, 6, Math.PI, Math.PI * 2);
  ctx.fill();

  // Duas sobrancelhas.
  ctx.strokeStyle = '#5b3829';
  ctx.lineWidth = 1.15;

  ctx.beginPath();
  ctx.moveTo(8.5, 5.5);
  ctx.lineTo(13.5, 5.1);
  ctx.moveTo(18.5, 5.1);
  ctx.lineTo(23.5, 5.5);
  ctx.stroke();

  // Dois olhos: antes só um era desenhado dependendo da direção.
  const pupilOffset = player.facing === 1 ? 0.7 : -0.7;

  ctx.fillStyle = '#ffffff';

  ctx.beginPath();
  ctx.ellipse(11.5, 8.5, 3.1, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(20.5, 8.5, 3.1, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#263238';

  ctx.beginPath();
  ctx.arc(11.5 + pupilOffset, 8.7, 1.55, 0, Math.PI * 2);
  ctx.arc(20.5 + pupilOffset, 8.7, 1.55, 0, Math.PI * 2);
  ctx.fill();

  // Pontos de luz nos dois olhos.
  ctx.fillStyle = '#ffffff';

  ctx.beginPath();
  ctx.arc(12 + pupilOffset, 8.1, 0.55, 0, Math.PI * 2);
  ctx.arc(21 + pupilOffset, 8.1, 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Nariz.
  ctx.fillStyle = '#df9f7d';

  ctx.beginPath();
  ctx.arc(
    player.facing === 1 ? 24 : 8,
    11,
    1.5,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Sorriso.
  ctx.strokeStyle = '#994d46';
  ctx.lineWidth = 1.3;

  ctx.beginPath();
  ctx.arc(16, 12, 4.5, 0.15, Math.PI - 0.15);
  ctx.stroke();

  // Logo Alfabetiza+.
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 8px Arial';
  ctx.fillText('A+', 16, 25);

  ctx.restore();

  ctx.shadowBlur = 0;

  // Escudo: desenhado usando o tamanho REAL do personagem.
  if (shieldActive) {
    const pulse = 1 + Math.sin(Date.now() / 120) * 0.04;

    const centerX = x + player.width / 2;
    const centerY = y + player.height / 2;

    ctx.save();

    const shieldGradient = ctx.createRadialGradient(
      centerX - 8,
      centerY - 10,
      3,
      centerX,
      centerY,
      player.height * 0.8
    );

    shieldGradient.addColorStop(0, 'rgba(255,255,255,.25)');
    shieldGradient.addColorStop(0.45, 'rgba(84,215,255,.12)');
    shieldGradient.addColorStop(1, 'rgba(84,215,255,.03)');

    ctx.fillStyle = shieldGradient;
    ctx.strokeStyle = 'rgba(84,215,255,.95)';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY,
      (player.width / 2 + 12) * pulse,
      (player.height / 2 + 10) * pulse,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.lineWidth = 1.3;

    ctx.beginPath();
    ctx.ellipse(
      centerX - 4,
      centerY - 4,
      (player.width / 2 + 7) * pulse,
      (player.height / 2 + 5) * pulse,
      -0.1,
      Math.PI,
      Math.PI * 1.68
    );
    ctx.stroke();

    ctx.restore();
  }

  // Linhas de velocidade.
  if (speedActive) {
    ctx.save();

    ctx.strokeStyle = 'rgba(255,159,67,.75)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const startX = player.facing === 1
      ? x - 7
      : x + player.width + 7;

    const direction = player.facing === 1 ? -1 : 1;

    for (let i = 0; i < 3; i++) {
      const lineY = y + 14 + i * 10;

      ctx.beginPath();
      ctx.moveTo(startX, lineY);
      ctx.lineTo(
        startX + direction * (20 + i * 7),
        lineY
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  // Indicador do super pulo.
  if (jumpActive) {
    ctx.save();

    ctx.fillStyle = '#a55eea';
    ctx.shadowColor = '#a55eea';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'center';

    ctx.fillText(
      '↑',
      x + player.width / 2,
      y - 9
    );

    ctx.restore();
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  camera: number
) {
  particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, particle.life));
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 9;

    ctx.beginPath();
    ctx.arc(
      particle.x - camera,
      particle.y,
      particle.size,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  level: number,
  lives: number,
  coins: number,
  totalCoins: number,
  checkpoint: boolean,
  timeLeft: number,
  boss: Boss | null,
  progress: number,
  activePowers: PowerType[],
  letters: string[]
) {
  ctx.save();

  ctx.fillStyle = 'rgba(15,27,48,.86)';

  ctx.beginPath();
  ctx.roundRect(
    14,
    14,
    500,
    boss ? 132 : 108,
    18
  );
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';

  ctx.fillText(`🎮 FASE ${level}`, 28, 42);
  ctx.fillText(`❤️ ${lives}`, 150, 42);
  ctx.fillText(`🪙 ${coins}/${totalCoins}`, 220, 42);
  ctx.fillText(`⏱️ ${Math.max(0, timeLeft)}`, 340, 42);

  ctx.fillText(
    checkpoint
      ? '🚩 CHECKPOINT ✅'
      : '🚩 CHECKPOINT —',
    28,
    70
  );

  // Barra de progresso.
  ctx.fillStyle = '#35465d';

  ctx.beginPath();
  ctx.roundRect(235, 63, 240, 10, 5);
  ctx.fill();

  ctx.fillStyle = '#2ecc71';

  ctx.beginPath();
  ctx.roundRect(
    235,
    63,
    Math.max(4, Math.min(240, 240 * progress)),
    10,
    5
  );
  ctx.fill();

  // Letras coletadas.
  ctx.fillStyle = '#dfeaff';
  ctx.font = 'bold 13px Arial';

  const lastLetters = letters.slice(-8);

  ctx.fillText(
    lastLetters.length
      ? `🔤 ${lastLetters.join(' ')}`
      : '🔤 nenhuma letra coletada',
    28,
    96
  );

  // Poderes ativos.
  let powerX = 250;

  activePowers.forEach((power) => {
    ctx.fillStyle = POWER_COLORS[power];
    ctx.fillText(
      `⚡ ${getPowerName(power)}`,
      powerX,
      96
    );

    powerX += 115;
  });

  if (boss) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Arial';

    ctx.fillText(
      boss.alive
        ? `👾 CHEFÃO ${boss.hp}/${boss.maxHp}`
        : '👾 CHEFÃO DERROTADO ✅',
      28,
      122
    );
  }

  ctx.restore();
}

function drawCountdown(
  ctx: CanvasRenderingContext2D,
  countdown: number
) {
  ctx.fillStyle = 'rgba(0,0,0,.42)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 82px Arial';
  ctx.shadowColor = 'rgba(0,0,0,.4)';
  ctx.shadowBlur = 10;

  ctx.fillText(
    countdown > 0 ? String(countdown) : 'VAI!',
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2
  );

  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
}

function drawVictoryMessage(
  ctx: CanvasRenderingContext2D
) {
  ctx.save();

  ctx.fillStyle = 'rgba(10,20,35,.48)';
  ctx.fillRect(
    220,
    160,
    460,
    115
  );

  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = 2;

  ctx.strokeRect(
    220,
    160,
    460,
    115
  );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = 8;

  ctx.font = 'bold 43px Arial';

  ctx.fillText(
    '🏆 FASE CONCLUÍDA!',
    CANVAS_WIDTH / 2,
    210
  );

  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#f6f8ff';

  ctx.fillText(
    'Você chegou à bandeira!',
    CANVAS_WIDTH / 2,
    247
  );

  ctx.restore();
}
