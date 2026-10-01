import React, {
  useEffect,
  useRef,
  useState
} from 'react';

type Props = {
  level: number;
  onComplete: () => void;
  onExit: () => void;
};

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

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
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

type Theme =
  | 'day'
  | 'sunset'
  | 'night'
  | 'underground';

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

const GRAVITY = 0.62;
const WALK_SPEED = 5;
const JUMP_FORCE = -12;

function makeCoin(
  x: number,
  y: number
): Coin {
  return {
    x,
    y,
    collected: false,
    phase:
      Math.random() *
      Math.PI *
      2
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

function makeBlock(
  x: number,
  y: number
): Block {
  return {
    x,
    y,
    w: 36,
    h: 36,
    used: false
  };
}

function createLevel(
  level: number
): LevelConfig {
  const variation =
    ((level - 1) % 5) + 1;

  const difficulty =
    Math.min(
      1 +
        Math.floor(
          (level - 1) / 5
        ),
      4
    );

  const theme: Theme =
    level % 4 === 1
      ? 'day'
      : level % 4 === 2
        ? 'sunset'
        : level % 4 === 3
          ? 'night'
          : 'underground';

  const isBoss =
    level % 5 === 0;

  if (variation === 1) {
    return {
      width:
        2300 +
        difficulty * 100,

      startX: 60,
      startY: 330,

      finishX:
        2200 +
        difficulty * 100,

      checkpointX: 1100,

      timeLimit:
        130 -
        difficulty * 8,

      theme,

      platforms: [
        {
          x: 0,
          y: 400,
          w: 450,
          h: 50
        },

        {
          x: 520,
          y: 400,
          w: 430,
          h: 50
        },

        {
          x: 1020,
          y: 400,
          w: 400,
          h: 50
        },

        {
          x: 1510,
          y: 400,
          w: 900,
          h: 50
        },

        {
          x: 250,
          y: 320,
          w: 120,
          h: 20
        },

        {
          x: 620,
          y: 310,
          w: 140,
          h: 20
        },

        {
          x: 850,
          y: 250,
          w: 120,
          h: 20
        },

        {
          x: 1150,
          y: 300,
          w: 130,
          h: 20
        },

        {
          x: 1450,
          y: 250,
          w: 120,
          h: 20
        },

        {
          x: 1750,
          y: 310,
          w: 150,
          h: 20
        }
      ],

      coins: [
        makeCoin(
          300,
          275
        ),

        makeCoin(
          670,
          265
        ),

        makeCoin(
          900,
          205
        ),

        makeCoin(
          1200,
          255
        ),

        makeCoin(
          1500,
          205
        ),

        makeCoin(
          1800,
          265
        )
      ],

      enemies: [
        makeEnemy(
          650,
          365,
          580,
          900
        ),

        makeEnemy(
          1600,
          365,
          1550,
          1900
        )
      ],

      blocks: [
        makeBlock(
          740,
          215
        ),

        makeBlock(
          1320,
          250
        ),

        makeBlock(
          1900,
          250
        )
      ],

      boss: isBoss
        ? {
            x: 2000,
            y: 340,
            width: 65,
            height: 60,
            direction: -1,
            hp:
              3 +
              difficulty,
            maxHp:
              3 +
              difficulty,
            alive: true
          }
        : null
    };
  }

  if (variation === 2) {
    return {
      width:
        2500 +
        difficulty * 100,

      startX: 50,
      startY: 330,

      finishX:
        2400 +
        difficulty * 100,

      checkpointX: 1250,

      timeLimit:
        125 -
        difficulty * 8,

      theme,

      platforms: [
        {
          x: 0,
          y: 400,
          w: 350,
          h: 50
        },

        {
          x: 430,
          y: 400,
          w: 320,
          h: 50
        },

        {
          x: 820,
          y: 400,
          w: 380,
          h: 50
        },

        {
          x: 1280,
          y: 400,
          w: 360,
          h: 50
        },

        {
          x: 1720,
          y: 400,
          w: 850,
          h: 50
        },

        {
          x: 190,
          y: 290,
          w: 120,
          h: 20
        },

        {
          x: 520,
          y: 270,
          w: 130,
          h: 20
        },

        {
          x: 900,
          y: 310,
          w: 120,
          h: 20
        },

        {
          x: 1080,
          y: 240,
          w: 110,
          h: 20
        },

        {
          x: 1380,
          y: 290,
          w: 130,
          h: 20
        },

        {
          x: 1800,
          y: 250,
          w: 140,
          h: 20
        },

        {
          x: 2050,
          y: 300,
          w: 120,
          h: 20
        }
      ],

      coins: [
        makeCoin(
          240,
          245
        ),

        makeCoin(
          570,
          225
        ),

        makeCoin(
          950,
          265
        ),

        makeCoin(
          1120,
          195
        ),

        makeCoin(
          1430,
          245
        ),

        makeCoin(
          1850,
          205
        ),

        makeCoin(
          2100,
          255
        )
      ],

      enemies: [
        makeEnemy(
          500,
          365,
          450,
          700
        ),

        makeEnemy(
          1350,
          365,
          1300,
          1600
        ),

        makeEnemy(
          1850,
          365,
          1760,
          2150
        )
      ],

      blocks: [
        makeBlock(
          650,
          210
        ),

        makeBlock(
          1180,
          180
        ),

        makeBlock(
          1960,
          240
        )
      ],

      boss: isBoss
        ? {
            x: 2200,
            y: 340,
            width: 65,
            height: 60,
            direction: -1,
            hp:
              3 +
              difficulty,
            maxHp:
              3 +
              difficulty,
            alive: true
          }
        : null
    };
  }

  if (variation === 3) {
    return {
      width:
        2700 +
        difficulty * 100,

      startX: 60,
      startY: 330,

      finishX:
        2600 +
        difficulty * 100,

      checkpointX: 1350,

      timeLimit:
        120 -
        difficulty * 7,

      theme,

      platforms: [
        {
          x: 0,
          y: 400,
          w: 400,
          h: 50
        },

        {
          x: 500,
          y: 400,
          w: 300,
          h: 50
        },

        {
          x: 900,
          y: 400,
          w: 360,
          h: 50
        },

        {
          x: 1360,
          y: 400,
          w: 300,
          h: 50
        },

        {
          x: 1780,
          y: 400,
          w: 1000,
          h: 50
        },

        {
          x: 300,
          y: 300,
          w: 100,
          h: 20
        },

        {
          x: 560,
          y: 260,
          w: 120,
          h: 20
        },

        {
          x: 930,
          y: 300,
          w: 110,
          h: 20
        },

        {
          x: 1160,
          y: 220,
          w: 110,
          h: 20
        },

        {
          x: 1450,
          y: 280,
          w: 110,
          h: 20
        },

        {
          x: 1830,
          y: 290,
          w: 130,
          h: 20
        },

        {
          x: 2140,
          y: 240,
          w: 120,
          h: 20
        }
      ],

      coins: [
        makeCoin(
          340,
          255
        ),

        makeCoin(
          610,
          215
        ),

        makeCoin(
          980,
          255
        ),

        makeCoin(
          1210,
          175
        ),

        makeCoin(
          1500,
          235
        ),

        makeCoin(
          1880,
          245
        ),

        makeCoin(
          2190,
          195
        )
      ],

      enemies: [
        makeEnemy(
          550,
          365,
          520,
          760
        ),

        makeEnemy(
          980,
          365,
          930,
          1220
        ),

        makeEnemy(
          1900,
          365,
          1800,
          2200
        )
      ],

      blocks: [
        makeBlock(
          700,
          210
        ),

        makeBlock(
          1300,
          180
        ),

        makeBlock(
          2250,
          190
        )
      ],

      boss: isBoss
        ? {
            x: 2400,
            y: 340,
            width: 70,
            height: 60,
            direction: -1,
            hp:
              4 +
              difficulty,
            maxHp:
              4 +
              difficulty,
            alive: true
          }
        : null
    };
  }

  if (variation === 4) {
    return {
      width:
        2900 +
        difficulty * 100,

      startX: 50,
      startY: 330,

      finishX:
        2800 +
        difficulty * 100,

      checkpointX: 1450,

      timeLimit:
        115 -
        difficulty * 7,

      theme,

      platforms: [
        {
          x: 0,
          y: 400,
          w: 300,
          h: 50
        },

        {
          x: 390,
          y: 400,
          w: 280,
          h: 50
        },

        {
          x: 760,
          y: 400,
          w: 300,
          h: 50
        },

        {
          x: 1160,
          y: 400,
          w: 300,
          h: 50
        },

        {
          x: 1560,
          y: 400,
          w: 320,
          h: 50
        },

        {
          x: 1980,
          y: 400,
          w: 1000,
          h: 50
        },

        {
          x: 180,
          y: 300,
          w: 110,
          h: 20
        },

        {
          x: 450,
          y: 250,
          w: 120,
          h: 20
        },

        {
          x: 810,
          y: 300,
          w: 110,
          h: 20
        },

        {
          x: 1200,
          y: 250,
          w: 130,
          h: 20
        },

        {
          x: 1600,
          y: 290,
          w: 120,
          h: 20
        },

        {
          x: 2050,
          y: 260,
          w: 120,
          h: 20
        },

        {
          x: 2350,
          y: 210,
          w: 130,
          h: 20
        }
      ],

      coins: [
        makeCoin(
          220,
          255
        ),

        makeCoin(
          500,
          205
        ),

        makeCoin(
          860,
          255
        ),

        makeCoin(
          1250,
          205
        ),

        makeCoin(
          1650,
          245
        ),

        makeCoin(
          2100,
          215
        ),

        makeCoin(
          2400,
          165
        )
      ],

      enemies: [
        makeEnemy(
          420,
          365,
          400,
          640
        ),

        makeEnemy(
          1200,
          365,
          1180,
          1420
        ),

        makeEnemy(
          2050,
          365,
          2010,
          2400
        )
      ],

      blocks: [
        makeBlock(
          580,
          190
        ),

        makeBlock(
          1380,
          200
        ),

        makeBlock(
          2500,
          170
        )
      ],

      boss: isBoss
        ? {
            x: 2600,
            y: 340,
            width: 70,
            height: 60,
            direction: -1,
            hp:
              4 +
              difficulty,
            maxHp:
              4 +
              difficulty,
            alive: true
          }
        : null
    };
  }

  return {
    width:
      3100 +
      difficulty * 100,

    startX: 50,
    startY: 330,

    finishX:
      3000 +
      difficulty * 100,

    checkpointX: 1550,

    timeLimit:
      110 -
      difficulty * 6,

    theme,

    platforms: [
      {
        x: 0,
        y: 400,
        w: 320,
        h: 50
      },

      {
        x: 430,
        y: 400,
        w: 250,
        h: 50
      },

      {
        x: 800,
        y: 400,
        w: 280,
        h: 50
      },

      {
        x: 1180,
        y: 400,
        w: 280,
        h: 50
      },

      {
        x: 1580,
        y: 400,
        w: 300,
        h: 50
      },

      {
        x: 2000,
        y: 400,
        w: 1200,
        h: 50
      },

      {
        x: 180,
        y: 290,
        w: 100,
        h: 20
      },

      {
        x: 480,
        y: 240,
        w: 120,
        h: 20
      },

      {
        x: 850,
        y: 290,
        w: 110,
        h: 20
      },

      {
        x: 1220,
        y: 230,
        w: 120,
        h: 20
      },

      {
        x: 1620,
        y: 280,
        w: 110,
        h: 20
      },

      {
        x: 2050,
        y: 250,
        w: 120,
        h: 20
      },

      {
        x: 2400,
        y: 200,
        w: 140,
        h: 20
      }
    ],

    coins: [
      makeCoin(
        220,
        245
      ),

      makeCoin(
        530,
        195
      ),

      makeCoin(
        900,
        245
      ),

      makeCoin(
        1270,
        185
      ),

      makeCoin(
        1670,
        235
      ),

      makeCoin(
        2100,
        205
      ),

      makeCoin(
        2450,
        155
      )
    ],

    enemies: [
      makeEnemy(
        470,
        365,
        450,
        650
      ),

      makeEnemy(
        1220,
        365,
        1200,
        1430
      ),

      makeEnemy(
        1650,
        365,
        1600,
        1850
      ),

      makeEnemy(
        2200,
        365,
        2050,
        2500
      )
    ],

    blocks: [
      makeBlock(
        610,
        190
      ),

      makeBlock(
        1400,
        180
      ),

      makeBlock(
        2580,
        160
      )
    ],

    boss: {
      x: 2750,
      y: 340,
      width: 75,
      height: 60,
      direction: -1,
      hp:
        5 +
        difficulty,
      maxHp:
        5 +
        difficulty,
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
  type: OscillatorType =
    'square'
) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as any
      ).webkitAudioContext;

    if (
      !AudioContextClass
    ) {
      return;
    }

    const context =
      new AudioContextClass();

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type =
      type;

    oscillator.frequency.value =
      frequency;

    gain.gain.value =
      0.04;

    oscillator.connect(
      gain
    );

    gain.connect(
      context.destination
    );

    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime +
        duration
    );

    oscillator.stop(
      context.currentTime +
        duration
    );
  } catch {
    // sem áudio
  }
}

export default function PlatformGame({
  level,
  onComplete,
  onExit
}: Props) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const keys =
    useRef<
      Record<
        string,
        boolean
      >
    >({});

  const levelRef =
    useRef<LevelConfig>(
      createLevel(level)
    );

  const player =
    useRef<Player>({
      x:
        levelRef.current
          .startX,

      y:
        levelRef.current
          .startY,

      vx: 0,
      vy: 0,

      width:
        PLAYER_WIDTH,

      height:
        PLAYER_HEIGHT,

      facing: 1,

      walkFrame: 0
    });

  const cameraX =
    useRef(0);

  const checkpointReached =
    useRef(false);

  const jumpLocked =
    useRef(false);

  const particles =
    useRef<
      Particle[]
    >([]);

  const invulnerableUntil =
    useRef(0);

  const animationTime =
    useRef(0);

  const livesRef =
    useRef(3);

  const coinsRef =
    useRef(0);

  const timeRef =
    useRef(
      levelRef.current
        .timeLimit
    );

  const [lives, setLives] =
    useState(3);

  const [
    coinsCollected,
    setCoinsCollected
  ] = useState(0);

  const [
    timeLeft,
    setTimeLeft
  ] = useState(
    levelRef.current
      .timeLimit
  );

  const [
    finished,
    setFinished
  ] = useState(false);

  const [
    gameOver,
    setGameOver
  ] = useState(false);

  const [
    started,
    setStarted
  ] = useState(false);

  const [
    countdown,
    setCountdown
  ] = useState(3);

  const [
    bossHp,
    setBossHp
  ] = useState(
    levelRef.current
      .boss?.hp ?? 0
  );

  const resetGame = () => {
    const config =
      createLevel(level);

    levelRef.current =
      config;

    player.current = {
      x: config.startX,
      y: config.startY,

      vx: 0,
      vy: 0,

      width:
        PLAYER_WIDTH,

      height:
        PLAYER_HEIGHT,

      facing: 1,
      walkFrame: 0
    };

    cameraX.current = 0;

    checkpointReached.current =
      false;

    jumpLocked.current =
      false;

    particles.current = [];

    invulnerableUntil.current =
      0;

    livesRef.current = 3;

    coinsRef.current = 0;

    timeRef.current =
      config.timeLimit;

    setLives(3);

    setCoinsCollected(
      0
    );

    setTimeLeft(
      config.timeLimit
    );

    setBossHp(
      config.boss?.hp ??
        0
    );

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

    if (
      countdown <= 0
    ) {
      setStarted(true);

      playSound(
        660,
        0.15,
        'square'
      );

      return;
    }

    const timer =
      window.setTimeout(
        () => {
          playSound(
            300 +
              countdown *
                100,
            0.08,
            'square'
          );

          setCountdown(
            (
              current
            ) =>
              current - 1
          );
        },
        700
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    countdown,
    started
  ]);

  useEffect(() => {
    if (
      !started ||
      finished ||
      gameOver
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          timeRef.current -=
            1;

          setTimeLeft(
            timeRef.current
          );

          if (
            timeRef.current <=
            0
          ) {
            setGameOver(
              true
            );

            playSound(
              100,
              0.35,
              'sawtooth'
            );
          }
        },
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    started,
    finished,
    gameOver
  ]);

  useEffect(() => {
    const down = (
      event: KeyboardEvent
    ) => {
      const key =
        event.key.toLowerCase();

      keys.current[key] =
        true;

      if (
        key ===
          'arrowleft' ||
        key ===
          'arrowright' ||
        key ===
          'arrowup' ||
        key === ' '
      ) {
        event.preventDefault();
      }
    };

    const up = (
      event: KeyboardEvent
    ) => {
      keys.current[
        event.key.toLowerCase()
      ] = false;
    };

    window.addEventListener(
      'keydown',
      down
    );

    window.addEventListener(
      'keyup',
      up
    );

    return () => {
      window.removeEventListener(
        'keydown',
        down
      );

      window.removeEventListener(
        'keyup',
        up
      );
    };
  }, []);

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext(
        '2d'
      );

    if (!ctx) return;

    let animation = 0;

    const spawnParticles = (
      x: number,
      y: number,
      count = 8
    ) => {
      for (
        let i = 0;
        i < count;
        i++
      ) {
        particles.current.push(
          {
            x,
            y,

            vx:
              Math.random() *
                4 -
              2,

            vy:
              Math.random() *
                -4 -
              1,

            life: 1
          }
        );
      }
    };

    const resetPlayer = () => {
      const config =
        levelRef.current;

      if (
        checkpointReached.current
      ) {
        player.current.x =
          config.checkpointX;

        player.current.y =
          330;
      } else {
        player.current.x =
          config.startX;

        player.current.y =
          config.startY;
      }

      player.current.vx =
        0;

      player.current.vy =
        0;
    };

    const loseLife = () => {
      if (
        Date.now() <
        invulnerableUntil.current
      ) {
        return;
      }

      invulnerableUntil.current =
        Date.now() +
        1000;

      livesRef.current -=
        1;

      setLives(
        livesRef.current
      );

      playSound(
        110,
        0.25,
        'sawtooth'
      );

      if (
        livesRef.current <=
        0
      ) {
        setGameOver(
          true
        );

        return;
      }

      resetPlayer();
    };

    const loop = () => {
      const config =
        levelRef.current;

      const p =
        player.current;

      animationTime.current +=
        0.08;

      if (
        started &&
        !finished &&
        !gameOver
      ) {
        const left =
          keys.current[
            'arrowleft'
          ] ||
          keys.current['a'];

        const right =
          keys.current[
            'arrowright'
          ] ||
          keys.current['d'];

        if (left) {
          p.vx =
            -WALK_SPEED;

          p.facing =
            -1;

          p.walkFrame +=
            0.25;
        } else if (
          right
        ) {
          p.vx =
            WALK_SPEED;

          p.facing =
            1;

          p.walkFrame +=
            0.25;
        } else {
          p.vx *=
            0.75;
        }

        const previousBottom =
          p.y +
          p.height;

        const wantsJump =
          keys.current[
            'arrowup'
          ] ||
          keys.current['w'] ||
          keys.current[' '];

        let standing =
          false;

        config.platforms.forEach(
          (
            platform
          ) => {
            if (
              p.x +
                  p.width >
                platform.x &&
              p.x <
                platform.x +
                  platform.w &&
              Math.abs(
                p.y +
                  p.height -
                  platform.y
              ) <
                7
            ) {
              standing =
                true;
            }
          }
        );

        if (
          wantsJump &&
          standing &&
          !jumpLocked.current
        ) {
          p.vy =
            JUMP_FORCE;

          jumpLocked.current =
            true;

          playSound(
            420,
            0.07,
            'square'
          );
        }

        if (
          !wantsJump
        ) {
          jumpLocked.current =
            false;
        }

        p.vy +=
          GRAVITY;

        p.x +=
          p.vx;

        p.y +=
          p.vy;

        config.platforms.forEach(
          (
            platform
          ) => {
            const newBottom =
              p.y +
              p.height;

            const horizontal =
              p.x +
                  p.width >
                platform.x &&
              p.x <
                platform.x +
                  platform.w;

            const falling =
              horizontal &&
              previousBottom <=
                platform.y +
                  8 &&
              newBottom >=
                platform.y &&
              p.vy >= 0;

            if (
              falling
            ) {
              p.y =
                platform.y -
                p.height;

              p.vy = 0;
            }
          }
        );

        config.blocks.forEach(
          (block) => {
            if (
              block.used
            ) {
              return;
            }

            if (
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
              )
            ) {
              block.used =
                true;

              p.vy = 2;

              coinsRef.current +=
                1;

              setCoinsCollected(
                coinsRef.current
              );

              spawnParticles(
                block.x +
                  block.w /
                    2,
                block.y,
                10
              );

              playSound(
                760,
                0.1
              );
            }
          }
        );

        config.coins.forEach(
          (coin) => {
            if (
              coin.collected
            ) {
              return;
            }

            if (
              collides(
                p.x,
                p.y,
                p.width,
                p.height,
                coin.x -
                  12,
                coin.y -
                  12,
                24,
                24
              )
            ) {
              coin.collected =
                true;

              coinsRef.current +=
                1;

              setCoinsCollected(
                coinsRef.current
              );

              spawnParticles(
                coin.x,
                coin.y,
                6
              );

              playSound(
                880,
                0.07
              );
            }
          }
        );

        config.enemies.forEach(
          (enemy) => {
            if (
              !enemy.alive
            ) {
              return;
            }

            enemy.x +=
              1.4 *
              enemy.direction;

            if (
              enemy.x <=
              enemy.startX
            ) {
              enemy.direction =
                1;
            }

            if (
              enemy.x >=
              enemy.endX
            ) {
              enemy.direction =
                -1;
            }

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
              const bottom =
                p.y +
                p.height;

              if (
                p.vy > 0 &&
                bottom -
                  enemy.y <
                  18
              ) {
                enemy.alive =
                  false;

                p.vy = -8;

                spawnParticles(
                  enemy.x +
                    16,
                  enemy.y,
                  10
                );

                playSound(
                  180,
                  0.07
                );
              } else {
                loseLife();
              }
            }
          }
        );

        const boss =
          config.boss;

        if (
          boss &&
          boss.alive
        ) {
          boss.x +=
            1.1 *
            boss.direction;

          const minX =
            config.finishX -
            320;

          const maxX =
            config.finishX -
            80;

          if (
            boss.x <
            minX
          ) {
            boss.direction =
              1;
          }

          if (
            boss.x >
            maxX
          ) {
            boss.direction =
              -1;
          }

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
            const bottom =
              p.y +
              p.height;

            if (
              p.vy > 0 &&
              bottom -
                boss.y <
                22
            ) {
              boss.hp -=
                1;

              setBossHp(
                boss.hp
              );

              p.vy =
                -10;

              spawnParticles(
                boss.x +
                  boss.width /
                    2,
                boss.y,
                18
              );

              playSound(
                140,
                0.15
              );

              if (
                boss.hp <=
                0
              ) {
                boss.alive =
                  false;

                playSound(
                  650,
                  0.3,
                  'triangle'
                );
              }
            } else {
              loseLife();
            }
          }
        }

        if (
          !checkpointReached.current &&
          p.x >=
            config.checkpointX
        ) {
          checkpointReached.current =
            true;

          playSound(
            520,
            0.15,
            'triangle'
          );
        }

        if (
          p.y >
          CANVAS_HEIGHT +
            150
        ) {
          loseLife();
        }

        if (
          p.x < 0
        ) {
          p.x = 0;
        }

        const bossCleared =
          !config.boss ||
          !config.boss
            .alive;

        if (
          p.x >=
            config.finishX &&
          bossCleared
        ) {
          setFinished(
            true
          );

          playSound(
            760,
            0.35,
            'triangle'
          );
        }

        const targetCamera =
          p.x -
          CANVAS_WIDTH *
            0.4;

        cameraX.current =
          Math.max(
            0,
            Math.min(
              targetCamera,
              config.width -
                CANVAS_WIDTH
            )
          );
      }

      particles.current =
        particles.current.filter(
          (
            particle
          ) => {
            particle.x +=
              particle.vx;

            particle.y +=
              particle.vy;

            particle.vy +=
              0.2;

            particle.life -=
              0.025;

            return (
              particle.life >
              0
            );
          }
        );

      ctx.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );

      const camera =
        cameraX.current;

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
        animationTime.current
      );

      drawParticles(
        ctx,
        particles.current,
        camera
      );

      drawPlayer(
        ctx,
        p,
        camera,
        Date.now() <
          invulnerableUntil.current
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
        p.x /
          Math.max(
            config.finishX,
            1
          )
      );

      if (
        !started
      ) {
        drawCountdown(
          ctx,
          countdown
        );
      }

      if (
        gameOver
      ) {
        drawOverlay(
          ctx,
          'FIM DE JOGO',
          'Tente novamente!'
        );
      }

      if (
        finished
      ) {
        drawOverlay(
          ctx,
          'FASE CONCLUÍDA!',
          'Muito bem!'
        );
      }

      animation =
        requestAnimationFrame(
          loop
        );
    };

    loop();

    return () => {
      cancelAnimationFrame(
        animation
      );
    };
  }, [
    started,
    finished,
    gameOver,
    countdown,
    level
  ]);

  return (
    <div
      style={{
        width:
          '100%',
        textAlign:
          'center'
      }}
    >
      <h2>
        🎮 FASE BÔNUS{' '}
        {level}
      </h2>

      <p>
        ← → ou A/D para
        andar • ↑, W ou
        Espaço para pular
      </p>

      <div
        style={{
          display:
            'flex',

          justifyContent:
            'center',

          gap: '18px',

          flexWrap:
            'wrap',

          marginBottom:
            '12px',

          fontWeight:
            800
        }}
      >
        <span>
          ❤️ VIDAS:{' '}
          {lives}
        </span>

        <span>
          🪙 MOEDAS:{' '}
          {coinsCollected}
        </span>

        <span>
          ⏱️ TEMPO:{' '}
          {timeLeft}
        </span>

        {levelRef.current
          .boss && (
          <span>
            👾 CHEFÃO:{' '}
            {bossHp}
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={
          CANVAS_WIDTH
        }
        height={
          CANVAS_HEIGHT
        }
        style={{
          width:
            '100%',

          maxWidth:
            '900px',

          borderRadius:
            '24px',

          border:
            '6px solid white',

          boxShadow:
            '0 12px 35px rgba(0,0,0,.25)'
        }}
      />

      {finished && (
        <div
          style={{
            marginTop:
              '20px'
          }}
        >
          <h2>
            🏆 FASE
            CONCLUÍDA!
          </h2>

          <p>
            Você coletou{' '}
            <strong>
              {
                coinsCollected
              }
            </strong>{' '}
            moedas.
          </p>

          <button
            className="primary"
            onClick={
              onComplete
            }
          >
            Continuar
          </button>
        </div>
      )}

      {gameOver && (
        <div
          style={{
            marginTop:
              '20px'
          }}
        >
          <h2>
            💥 FIM DE JOGO
          </h2>

          <button
            className="primary"
            onClick={
              resetGame
            }
          >
            🔄 Tentar
            novamente
          </button>
        </div>
      )}

      {!finished &&
        !gameOver && (
          <div
            style={{
              marginTop:
                '16px'
            }}
          >
            <button
              className="primary"
              onClick={
                resetGame
              }
            >
              🔄 Reiniciar
              fase
            </button>
          </div>
        )}

      <div
        style={{
          marginTop:
            '15px'
        }}
      >
        <button
          className="back"
          onClick={
            onExit
          }
        >
          Sair do jogo
        </button>
      </div>
    </div>
  );
}

/* ========================================
   FUNDO
======================================== */

function drawBackground(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  camera: number,
  worldWidth: number,
  animation: number
) {
  if (
    theme === 'night'
  ) {
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        CANVAS_HEIGHT
      );

    gradient.addColorStop(
      0,
      '#07152f'
    );

    gradient.addColorStop(
      1,
      '#29456d'
    );

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    // lua
    const glow =
      ctx.createRadialGradient(
        760,
        75,
        5,
        760,
        75,
        65
      );

    glow.addColorStop(
      0,
      'rgba(255,255,220,.8)'
    );

    glow.addColorStop(
      1,
      'rgba(255,255,220,0)'
    );

    ctx.fillStyle =
      glow;

    ctx.beginPath();

    ctx.arc(
      760,
      75,
      65,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      '#fffbd6';

    ctx.beginPath();

    ctx.arc(
      760,
      75,
      28,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // estrelas
    ctx.fillStyle =
      '#fff';

    for (
      let i = 0;
      i < 55;
      i++
    ) {
      const x =
        (i * 79) %
        CANVAS_WIDTH;

      const y =
        (i * 43) %
        220;

      ctx.globalAlpha =
        0.5 +
        Math.abs(
          Math.sin(
            animation +
              i
          )
        ) *
          0.5;

      ctx.fillRect(
        x,
        y,
        i % 4 === 0
          ? 2
          : 1,
        i % 4 === 0
          ? 2
          : 1
      );
    }

    ctx.globalAlpha =
      1;
  } else if (
    theme ===
    'underground'
  ) {
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        CANVAS_HEIGHT
      );

    gradient.addColorStop(
      0,
      '#252734'
    );

    gradient.addColorStop(
      1,
      '#484b59'
    );

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    // pedras
    for (
      let x = -50;
      x <
      CANVAS_WIDTH +
        100;
      x += 90
    ) {
      ctx.fillStyle =
        '#555967';

      ctx.beginPath();

      ctx.ellipse(
        x,
        75,
        38,
        22,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  } else {
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        CANVAS_HEIGHT
      );

    if (
      theme ===
      'sunset'
    ) {
      gradient.addColorStop(
        0,
        '#ff8066'
      );

      gradient.addColorStop(
        0.55,
        '#ffc86b'
      );

      gradient.addColorStop(
        1,
        '#fff0bc'
      );
    } else {
      gradient.addColorStop(
        0,
        '#55c6ff'
      );

      gradient.addColorStop(
        0.6,
        '#bceeff'
      );

      gradient.addColorStop(
        1,
        '#f8fdff'
      );
    }

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    // sol
    const sunY =
      theme ===
      'sunset'
        ? 120
        : 70;

    const glow =
      ctx.createRadialGradient(
        760,
        sunY,
        5,
        760,
        sunY,
        75
      );

    glow.addColorStop(
      0,
      '#fff7a8'
    );

    glow.addColorStop(
      0.5,
      'rgba(255,213,74,.55)'
    );

    glow.addColorStop(
      1,
      'rgba(255,213,74,0)'
    );

    ctx.fillStyle =
      glow;

    ctx.beginPath();

    ctx.arc(
      760,
      sunY,
      75,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      '#ffd447';

    ctx.beginPath();

    ctx.arc(
      760,
      sunY,
      30,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  if (
    theme !==
    'underground'
  ) {
    // montanha distante
    const far =
      camera * 0.1;

    ctx.fillStyle =
      theme ===
      'night'
        ? '#243f63'
        : '#92c9aa';

    for (
      let x = -400;
      x < worldWidth;
      x += 500
    ) {
      const px =
        x - far;

      ctx.beginPath();

      ctx.moveTo(
        px,
        400
      );

      ctx.lineTo(
        px + 160,
        210
      );

      ctx.lineTo(
        px + 330,
        400
      );

      ctx.closePath();

      ctx.fill();
    }

    // montanhas da frente
    const near =
      camera * 0.22;

    ctx.fillStyle =
      theme ===
      'night'
        ? '#31547a'
        : '#68b98c';

    for (
      let x = -250;
      x < worldWidth;
      x += 420
    ) {
      const px =
        x - near;

      ctx.beginPath();

      ctx.moveTo(
        px,
        400
      );

      ctx.lineTo(
        px + 130,
        270
      );

      ctx.lineTo(
        px + 270,
        400
      );

      ctx.closePath();

      ctx.fill();
    }

    // árvores
    const treeCamera =
      camera * 0.38;

    for (
      let x = 120;
      x < worldWidth;
      x += 300
    ) {
      const px =
        x -
        treeCamera;

      ctx.fillStyle =
        '#704a31';

      ctx.fillRect(
        px,
        325,
        16,
        75
      );

      ctx.fillStyle =
        theme ===
        'night'
          ? '#225844'
          : '#2e9b50';

      ctx.beginPath();

      ctx.arc(
        px + 8,
        310,
        34,
        0,
        Math.PI * 2
      );

      ctx.arc(
        px - 15,
        330,
        27,
        0,
        Math.PI * 2
      );

      ctx.arc(
        px + 31,
        330,
        27,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    // nuvens
    ctx.fillStyle =
      theme ===
      'night'
        ? 'rgba(180,200,220,.25)'
        : 'rgba(255,255,255,.93)';

    for (
      let x = 100;
      x < worldWidth;
      x += 520
    ) {
      const px =
        x -
        camera * 0.3;

      const bob =
        Math.sin(
          animation +
            x *
              0.01
        ) * 3;

      ctx.beginPath();

      ctx.arc(
        px,
        92 + bob,
        23,
        0,
        Math.PI * 2
      );

      ctx.arc(
        px + 30,
        80 + bob,
        33,
        0,
        Math.PI * 2
      );

      ctx.arc(
        px + 65,
        94 + bob,
        24,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }
}

/* ========================================
   MUNDO
======================================== */

function drawWorld(
  ctx: CanvasRenderingContext2D,
  config: LevelConfig,
  camera: number,
  checkpointReached: boolean,
  animation: number
) {
  // plataformas
  config.platforms.forEach(
    (
      platform
    ) => {
      const x =
        platform.x -
        camera;

      // sombra
      ctx.fillStyle =
        'rgba(0,0,0,.17)';

      ctx.fillRect(
        x + 5,
        platform.y + 7,
        platform.w,
        platform.h
      );

      const ground =
        ctx.createLinearGradient(
          0,
          platform.y,
          0,
          platform.y +
            platform.h
        );

      if (
        config.theme ===
        'underground'
      ) {
        ground.addColorStop(
          0,
          '#707887'
        );

        ground.addColorStop(
          1,
          '#3d424c'
        );
      } else {
        ground.addColorStop(
          0,
          '#9c6740'
        );

        ground.addColorStop(
          1,
          '#6c4027'
        );
      }

      ctx.fillStyle =
        ground;

      ctx.fillRect(
        x,
        platform.y,
        platform.w,
        platform.h
      );

      ctx.fillStyle =
        config.theme ===
        'underground'
          ? '#7f8c8d'
          : '#49a942';

      ctx.fillRect(
        x,
        platform.y,
        platform.w,
        10
      );

      if (
        config.theme !==
        'underground'
      ) {
        ctx.fillStyle =
          '#86dc65';

        ctx.fillRect(
          x,
          platform.y,
          platform.w,
          4
        );
      }

      // textura
      ctx.fillStyle =
        'rgba(255,255,255,.08)';

      for (
        let tx = 15;
        tx <
        platform.w;
        tx += 40
      ) {
        ctx.fillRect(
          x + tx,
          platform.y +
            22,
          11,
          4
        );
      }
    }
  );

  // blocos especiais
  config.blocks.forEach(
    (block) => {
      const x =
        block.x -
        camera;

      const gradient =
        ctx.createLinearGradient(
          x,
          block.y,
          x,
          block.y +
            block.h
        );

      if (
        block.used
      ) {
        gradient.addColorStop(
          0,
          '#b0b5ba'
        );

        gradient.addColorStop(
          1,
          '#777'
        );
      } else {
        gradient.addColorStop(
          0,
          '#ffd84d'
        );

        gradient.addColorStop(
          1,
          '#e69d00'
        );
      }

      ctx.fillStyle =
        gradient;

      ctx.beginPath();

      ctx.roundRect(
        x,
        block.y,
        block.w,
        block.h,
        5
      );

      ctx.fill();

      ctx.strokeStyle =
        '#8e6600';

      ctx.lineWidth = 2;

      ctx.stroke();

      if (
        !block.used
      ) {
        ctx.fillStyle =
          '#fff';

        ctx.font =
          'bold 23px Arial';

        ctx.fillText(
          '?',
          x + 11,
          block.y +
            27
        );
      }
    }
  );

  // moedas
  config.coins.forEach(
    (coin) => {
      if (
        coin.collected
      ) {
        return;
      }

      const x =
        coin.x -
        camera;

      const scale =
        0.55 +
        Math.abs(
          Math.sin(
            animation +
              coin.phase
          )
        ) *
          0.45;

      ctx.save();

      ctx.translate(
        x,
        coin.y
      );

      // brilho
      const glow =
        ctx.createRadialGradient(
          0,
          0,
          2,
          0,
          0,
          23
        );

      glow.addColorStop(
        0,
        'rgba(255,250,170,.9)'
      );

      glow.addColorStop(
        0.4,
        'rgba(255,215,0,.5)'
      );

      glow.addColorStop(
        1,
        'rgba(255,215,0,0)'
      );

      ctx.fillStyle =
        glow;

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        23,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.scale(
        scale,
        1
      );

      ctx.fillStyle =
        '#ffd700';

      ctx.beginPath();

      ctx.ellipse(
        0,
        0,
        10,
        14,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.strokeStyle =
        '#d89700';

      ctx.lineWidth = 2;

      ctx.stroke();

      ctx.fillStyle =
        '#fff3a3';

      ctx.fillRect(
        -2,
        -8,
        3,
        12
      );

      ctx.restore();
    }
  );

  // inimigos
  config.enemies.forEach(
    (enemy) => {
      if (
        !enemy.alive
      ) {
        return;
      }

      const x =
        enemy.x -
        camera;

      ctx.save();

      // sombra
      ctx.fillStyle =
        'rgba(0,0,0,.2)';

      ctx.beginPath();

      ctx.ellipse(
        x + 16,
        enemy.y +
          enemy.height +
          3,
        17,
        5,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

      const body =
        ctx.createLinearGradient(
          x,
          enemy.y,
          x,
          enemy.y +
            enemy.height
        );

      body.addColorStop(
        0,
        '#dc7c3d'
      );

      body.addColorStop(
        1,
        '#813d20'
      );

      ctx.fillStyle =
        body;

      ctx.beginPath();

      ctx.roundRect(
        x,
        enemy.y,
        enemy.width,
        enemy.height,
        10
      );

      ctx.fill();

      // pés
      ctx.fillStyle =
        '#5c2f1c';

      ctx.fillRect(
        x - 2,
        enemy.y + 29,
        15,
        8
      );

      ctx.fillRect(
        x + 19,
        enemy.y + 29,
        15,
        8
      );

      // olhos
      ctx.fillStyle =
        '#fff';

      ctx.beginPath();

      ctx.arc(
        x + 10,
        enemy.y + 12,
        5,
        0,
        Math.PI * 2
      );

      ctx.arc(
        x + 22,
        enemy.y + 12,
        5,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle =
        '#222';

      ctx.beginPath();

      ctx.arc(
        x + 11,
        enemy.y + 13,
        2,
        0,
        Math.PI * 2
      );

      ctx.arc(
        x + 23,
        enemy.y + 13,
        2,
        0,
        Math.PI * 2
      );

      ctx.fill();

      // sobrancelha
      ctx.strokeStyle =
        '#422';

      ctx.lineWidth = 2;

      ctx.beginPath();

      ctx.moveTo(
        x + 5,
        enemy.y + 6
      );

      ctx.lineTo(
        x + 13,
        enemy.y + 9
      );

      ctx.moveTo(
        x + 27,
        enemy.y + 6
      );

      ctx.lineTo(
        x + 19,
        enemy.y + 9
      );

      ctx.stroke();

      ctx.restore();
    }
  );

  // chefão
  if (
    config.boss &&
    config.boss.alive
  ) {
    drawBoss(
      ctx,
      config.boss,
      camera
    );
  }

  // checkpoint
  const checkpointScreen =
    config.checkpointX -
    camera;

  ctx.fillStyle =
    '#4b4b4b';

  ctx.fillRect(
    checkpointScreen,
    320,
    6,
    80
  );

  ctx.fillStyle =
    checkpointReached
      ? '#2ecc71'
      : '#f1c40f';

  ctx.beginPath();

  ctx.moveTo(
    checkpointScreen +
      6,
    320
  );

  ctx.lineTo(
    checkpointScreen +
      44,
    332
  );

  ctx.lineTo(
    checkpointScreen +
      6,
    344
  );

  ctx.closePath();

  ctx.fill();

  if (
    checkpointReached
  ) {
    ctx.fillStyle =
      'rgba(46,204,113,.2)';

    ctx.beginPath();

    ctx.arc(
      checkpointScreen +
        4,
      338,
      28,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  // BANDEIRA FINAL
  const finishScreen =
    config.finishX -
    camera;

  // base
  ctx.fillStyle =
    '#444';

  ctx.beginPath();

  ctx.roundRect(
    finishScreen -
      11,
    389,
    34,
    11,
    4
  );

  ctx.fill();

  // poste
  const poleGradient =
    ctx.createLinearGradient(
      finishScreen,
      0,
      finishScreen +
        7,
      0
    );

  poleGradient.addColorStop(
    0,
    '#dfe6e9'
  );

  poleGradient.addColorStop(
    0.5,
    '#fff'
  );

  poleGradient.addColorStop(
    1,
    '#aeb6bf'
  );

  ctx.fillStyle =
    poleGradient;

  ctx.fillRect(
    finishScreen,
    270,
    7,
    120
  );

  // bola dourada
  ctx.fillStyle =
    '#ffd700';

  ctx.beginPath();

  ctx.arc(
    finishScreen +
      3.5,
    267,
    8,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // brilho da bola
  ctx.fillStyle =
    '#fff6a2';

  ctx.beginPath();

  ctx.arc(
    finishScreen +
      1,
    264,
    2,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // bandeira ondulando
  const wave =
    Math.sin(
      animation * 2
    ) * 5;

  const flagGradient =
    ctx.createLinearGradient(
      finishScreen,
      280,
      finishScreen +
        60,
      315
    );

  flagGradient.addColorStop(
    0,
    '#ff5b6e'
  );

  flagGradient.addColorStop(
    1,
    '#d9203f'
  );

  ctx.fillStyle =
    flagGradient;

  ctx.beginPath();

  ctx.moveTo(
    finishScreen + 7,
    282
  );

  ctx.quadraticCurveTo(
    finishScreen +
      34,
    270 + wave,
    finishScreen +
      62,
    286
  );

  ctx.lineTo(
    finishScreen +
      62,
    315
  );

  ctx.quadraticCurveTo(
    finishScreen +
      35,
    301 - wave,
    finishScreen + 7,
    312
  );

  ctx.closePath();

  ctx.fill();

  // estrela na bandeira
  ctx.fillStyle =
    '#fff';

  ctx.font =
    'bold 20px Arial';

  ctx.fillText(
    '★',
    finishScreen +
      25,
    305
  );
}

function drawBoss(
  ctx: CanvasRenderingContext2D,
  boss: Boss,
  camera: number
) {
  const x =
    boss.x -
    camera;

  ctx.save();

  // sombra
  ctx.fillStyle =
    'rgba(0,0,0,.3)';

  ctx.beginPath();

  ctx.ellipse(
    x +
      boss.width /
        2,
    boss.y +
      boss.height +
      5,
    34,
    8,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  const gradient =
    ctx.createLinearGradient(
      x,
      boss.y,
      x,
      boss.y +
        boss.height
    );

  gradient.addColorStop(
    0,
    '#9b3b42'
  );

  gradient.addColorStop(
    1,
    '#511f28'
  );

  ctx.fillStyle =
    gradient;

  ctx.beginPath();

  ctx.roundRect(
    x,
    boss.y,
    boss.width,
    boss.height,
    15
  );

  ctx.fill();

  // espinhos
  ctx.fillStyle =
    '#f3c969';

  for (
    let i = 0;
    i < 3;
    i++
  ) {
    const sx =
      x +
      12 +
      i * 20;

    ctx.beginPath();

    ctx.moveTo(
      sx,
      boss.y
    );

    ctx.lineTo(
      sx + 8,
      boss.y - 15
    );

    ctx.lineTo(
      sx + 15,
      boss.y
    );

    ctx.fill();
  }

  // olhos
  ctx.fillStyle =
    '#fff';

  ctx.beginPath();

  ctx.arc(
    x + 20,
    boss.y + 22,
    8,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x +
      boss.width -
      20,
    boss.y + 22,
    8,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    '#111';

  ctx.beginPath();

  ctx.arc(
    x + 21,
    boss.y + 23,
    3,
    0,
    Math.PI * 2
  );

  ctx.arc(
    x +
      boss.width -
      19,
    boss.y + 23,
    3,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // barra HP
  const hpWidth = 90;

  const hp =
    boss.hp /
    boss.maxHp;

  ctx.fillStyle =
    '#222';

  ctx.fillRect(
    x -
      (hpWidth -
        boss.width) /
        2,
    boss.y - 25,
    hpWidth,
    10
  );

  ctx.fillStyle =
    '#e74c3c';

  ctx.fillRect(
    x -
      (hpWidth -
        boss.width) /
        2,
    boss.y - 25,
    hpWidth * hp,
    10
  );

  ctx.restore();
}

/* ========================================
   PERSONAGEM
======================================== */

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  camera: number,
  blinking: boolean
) {
  if (
    blinking &&
    Math.floor(
      Date.now() / 90
    ) %
      2 ===
      0
  ) {
    return;
  }

  const x =
    player.x -
    camera;

  const y =
    player.y;

  const moving =
    Math.abs(
      player.vx
    ) > 0.5;

  const leg =
    moving
      ? Math.sin(
          player.walkFrame
        ) * 4
      : 0;

  ctx.save();

  // sombra
  ctx.fillStyle =
    'rgba(0,0,0,.18)';

  ctx.beginPath();

  ctx.ellipse(
    x + 16,
    y +
      player.height +
      6,
    18,
    5,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // pernas
  ctx.fillStyle =
    '#263a5f';

  ctx.fillRect(
    x + 5,
    y + 30,
    8,
    14 +
      Math.max(
        0,
        leg
      )
  );

  ctx.fillRect(
    x + 19,
    y + 30,
    8,
    14 +
      Math.max(
        0,
        -leg
      )
  );

  // tênis
  ctx.fillStyle =
    '#222';

  ctx.fillRect(
    x + 2,
    y +
      41 +
      Math.max(
        0,
        leg
      ),
    14,
    6
  );

  ctx.fillRect(
    x + 18,
    y +
      41 +
      Math.max(
        0,
        -leg
      ),
    14,
    6
  );

  // camiseta
  const shirt =
    ctx.createLinearGradient(
      x,
      y,
      x + 32,
      y + 38
    );

  shirt.addColorStop(
    0,
    '#69a0ff'
  );

  shirt.addColorStop(
    1,
    '#3154c8'
  );

  ctx.fillStyle =
    shirt;

  ctx.beginPath();

  ctx.roundRect(
    x,
    y + 12,
    32,
    27,
    7
  );

  ctx.fill();

  // braços
  ctx.fillStyle =
    '#ffd6b5';

  ctx.beginPath();

  ctx.roundRect(
    x - 4,
    y + 17,
    7,
    18,
    4
  );

  ctx.fill();

  ctx.beginPath();

  ctx.roundRect(
    x + 29,
    y + 17,
    7,
    18,
    4
  );

  ctx.fill();

  // cabeça
  ctx.fillStyle =
    '#ffd6b5';

  ctx.beginPath();

  ctx.arc(
    x + 16,
    y + 4,
    14,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // cabelo
  ctx.fillStyle =
    '#493125';

  ctx.beginPath();

  ctx.arc(
    x + 16,
    y,
    14,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();

  // topete
  ctx.beginPath();

  ctx.arc(
    x + 9,
    y - 4,
    7,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();

  // olho
  const eyeX =
    player.facing === -1
      ? x + 10
      : x + 22;

  ctx.fillStyle =
    '#222';

  ctx.beginPath();

  ctx.arc(
    eyeX,
    y + 5,
    2,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // sorriso
  ctx.strokeStyle =
    '#9c5147';

  ctx.lineWidth =
    1.5;

  ctx.beginPath();

  ctx.arc(
    x + 16,
    y + 7,
    5,
    0.15,
    Math.PI -
      0.15
  );

  ctx.stroke();

  ctx.restore();
}

/* ========================================
   PARTÍCULAS
======================================== */

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  camera: number
) {
  particles.forEach(
    (
      particle
    ) => {
      ctx.globalAlpha =
        Math.max(
          0,
          particle.life
        );

      ctx.fillStyle =
        '#ffd700';

      ctx.beginPath();

      ctx.arc(
        particle.x -
          camera,
        particle.y,
        4,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  );

  ctx.globalAlpha =
    1;
}

/* ========================================
   HUD
======================================== */

function drawHud(
  ctx: CanvasRenderingContext2D,
  level: number,
  lives: number,
  coins: number,
  totalCoins: number,
  checkpoint: boolean,
  timeLeft: number,
  boss: Boss | null,
  progress: number
) {
  ctx.save();

  ctx.fillStyle =
    'rgba(15,27,48,.84)';

  ctx.beginPath();

  ctx.roundRect(
    14,
    14,
    420,
    boss
      ? 104
      : 84,
    18
  );

  ctx.fill();

  ctx.strokeStyle =
    'rgba(255,255,255,.18)';

  ctx.lineWidth = 2;

  ctx.stroke();

  ctx.fillStyle =
    '#fff';

  ctx.font =
    'bold 16px Arial';

  ctx.fillText(
    `🎮 FASE ${level}`,
    28,
    42
  );

  ctx.fillText(
    `❤️ ${lives}`,
    150,
    42
  );

  ctx.fillText(
    `🪙 ${coins}/${totalCoins}`,
    220,
    42
  );

  ctx.fillText(
    `⏱️ ${Math.max(
      0,
      timeLeft
    )}`,
    330,
    42
  );

  ctx.fillText(
    checkpoint
      ? '🚩 CHECKPOINT ✅'
      : '🚩 CHECKPOINT —',
    28,
    70
  );

  // barra
  ctx.fillStyle =
    '#35465d';

  ctx.beginPath();

  ctx.roundRect(
    220,
    63,
    180,
    10,
    5
  );

  ctx.fill();

  ctx.fillStyle =
    '#2ecc71';

  ctx.beginPath();

  ctx.roundRect(
    220,
    63,
    Math.max(
      4,
      Math.min(
        180,
        180 * progress
      )
    ),
    10,
    5
  );

  ctx.fill();

  if (boss) {
    ctx.fillStyle =
      '#fff';

    ctx.fillText(
      boss.alive
        ? `👾 CHEFÃO ${boss.hp}/${boss.maxHp}`
        : '👾 CHEFÃO DERROTADO ✅',
      28,
      98
    );
  }

  ctx.restore();
}

/* ========================================
   CONTAGEM
======================================== */

function drawCountdown(
  ctx: CanvasRenderingContext2D,
  countdown: number
) {
  ctx.fillStyle =
    'rgba(0,0,0,.42)';

  ctx.fillRect(
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );

  ctx.fillStyle =
    '#fff';

  ctx.textAlign =
    'center';

  ctx.font =
    'bold 82px Arial';

  ctx.shadowColor =
    'rgba(0,0,0,.4)';

  ctx.shadowBlur =
    10;

  ctx.fillText(
    countdown > 0
      ? String(
          countdown
        )
      : 'VAI!',
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT /
      2
  );

  ctx.shadowBlur = 0;

  ctx.textAlign =
    'left';
}

/* ========================================
   OVERLAY
======================================== */

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string
) {
  ctx.fillStyle =
    'rgba(10,20,35,.72)';

  ctx.fillRect(
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );

  ctx.fillStyle =
    '#fff';

  ctx.textAlign =
    'center';

  ctx.font =
    'bold 50px Arial';

  ctx.fillText(
    title,
    CANVAS_WIDTH /
      2,
    205
  );

  ctx.font =
    'bold 24px Arial';

  ctx.fillStyle =
    '#e9f5ff';

  ctx.fillText(
    subtitle,
    CANVAS_WIDTH /
      2,
    248
  );

  ctx.textAlign =
    'left';
}