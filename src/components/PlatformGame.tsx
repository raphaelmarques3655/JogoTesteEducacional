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
};

type Enemy = {
  x: number;
  y: number;
  startX: number;
  endX: number;
  direction: number;
  width: number;
  height: number;
};

type LevelConfig = {
  width: number;
  startX: number;
  startY: number;
  finishX: number;
  platforms: Platform[];
  coins: Coin[];
  enemies: Enemy[];
  checkpointX: number;
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 450;

const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 42;

const GRAVITY = 0.6;
const WALK_SPEED = 5;
const JUMP_FORCE = -12;

function createLevel(level: number): LevelConfig {
  const variation = ((level - 1) % 5) + 1;

  if (variation === 1) {
    return {
      width: 2200,
      startX: 60,
      startY: 330,
      finishX: 2100,
      checkpointX: 1100,

      platforms: [
        { x: 0, y: 400, w: 450, h: 50 },

        { x: 520, y: 400, w: 430, h: 50 },

        { x: 1020, y: 400, w: 400, h: 50 },

        { x: 1510, y: 400, w: 690, h: 50 },

        { x: 250, y: 320, w: 120, h: 20 },

        { x: 620, y: 310, w: 140, h: 20 },

        { x: 850, y: 250, w: 120, h: 20 },

        { x: 1150, y: 300, w: 130, h: 20 },

        { x: 1450, y: 250, w: 120, h: 20 },

        { x: 1750, y: 310, w: 150, h: 20 }
      ],

      coins: [
        { x: 300, y: 280, collected: false },
        { x: 670, y: 270, collected: false },
        { x: 900, y: 210, collected: false },
        { x: 1200, y: 260, collected: false },
        { x: 1500, y: 210, collected: false },
        { x: 1800, y: 270, collected: false }
      ],

      enemies: [
        {
          x: 650,
          y: 365,
          startX: 580,
          endX: 900,
          direction: 1,
          width: 32,
          height: 35
        },

        {
          x: 1600,
          y: 365,
          startX: 1550,
          endX: 1900,
          direction: 1,
          width: 32,
          height: 35
        }
      ]
    };
  }

  if (variation === 2) {
    return {
      width: 2400,
      startX: 50,
      startY: 330,
      finishX: 2300,
      checkpointX: 1250,

      platforms: [
        { x: 0, y: 400, w: 350, h: 50 },

        { x: 430, y: 400, w: 320, h: 50 },

        { x: 820, y: 400, w: 380, h: 50 },

        { x: 1280, y: 400, w: 360, h: 50 },

        { x: 1720, y: 400, w: 680, h: 50 },

        { x: 190, y: 290, w: 120, h: 20 },

        { x: 520, y: 270, w: 130, h: 20 },

        { x: 900, y: 310, w: 120, h: 20 },

        { x: 1080, y: 240, w: 110, h: 20 },

        { x: 1380, y: 290, w: 130, h: 20 },

        { x: 1800, y: 250, w: 140, h: 20 },

        { x: 2050, y: 300, w: 120, h: 20 }
      ],

      coins: [
        { x: 240, y: 250, collected: false },
        { x: 570, y: 230, collected: false },
        { x: 950, y: 270, collected: false },
        { x: 1120, y: 200, collected: false },
        { x: 1430, y: 250, collected: false },
        { x: 1850, y: 210, collected: false },
        { x: 2100, y: 260, collected: false }
      ],

      enemies: [
        {
          x: 500,
          y: 365,
          startX: 450,
          endX: 700,
          direction: 1,
          width: 32,
          height: 35
        },

        {
          x: 1350,
          y: 365,
          startX: 1300,
          endX: 1600,
          direction: 1,
          width: 32,
          height: 35
        },

        {
          x: 1850,
          y: 365,
          startX: 1760,
          endX: 2150,
          direction: 1,
          width: 32,
          height: 35
        }
      ]
    };
  }

  if (variation === 3) {
    return {
      width: 2600,
      startX: 60,
      startY: 330,
      finishX: 2500,
      checkpointX: 1350,

      platforms: [
        { x: 0, y: 400, w: 400, h: 50 },

        { x: 500, y: 400, w: 300, h: 50 },

        { x: 900, y: 400, w: 360, h: 50 },

        { x: 1360, y: 400, w: 300, h: 50 },

        { x: 1780, y: 400, w: 820, h: 50 },

        { x: 300, y: 300, w: 100, h: 20 },

        { x: 560, y: 260, w: 120, h: 20 },

        { x: 930, y: 300, w: 110, h: 20 },

        { x: 1160, y: 220, w: 110, h: 20 },

        { x: 1450, y: 280, w: 110, h: 20 },

        { x: 1830, y: 290, w: 130, h: 20 },

        { x: 2140, y: 240, w: 120, h: 20 }
      ],

      coins: [
        { x: 340, y: 260, collected: false },
        { x: 610, y: 220, collected: false },
        { x: 980, y: 260, collected: false },
        { x: 1210, y: 180, collected: false },
        { x: 1500, y: 240, collected: false },
        { x: 1880, y: 250, collected: false },
        { x: 2190, y: 200, collected: false }
      ],

      enemies: [
        {
          x: 550,
          y: 365,
          startX: 520,
          endX: 760,
          direction: 1,
          width: 32,
          height: 35
        },

        {
          x: 980,
          y: 365,
          startX: 930,
          endX: 1220,
          direction: 1,
          width: 32,
          height: 35
        },

        {
          x: 1900,
          y: 365,
          startX: 1800,
          endX: 2200,
          direction: 1,
          width: 32,
          height: 35
        }
      ]
    };
  }

  if (variation === 4) {
    return {
      width: 2800,
      startX: 50,
      startY: 330,
      finishX: 2700,
      checkpointX: 1450,

      platforms: [
        { x: 0, y: 400, w: 300, h: 50 },

        { x: 390, y: 400, w: 280, h: 50 },

        { x: 760, y: 400, w: 300, h: 50 },

        { x: 1160, y: 400, w: 300, h: 50 },

        { x: 1560, y: 400, w: 320, h: 50 },

        { x: 1980, y: 400, w: 820, h: 50 },

        { x: 180, y: 300, w: 110, h: 20 },

        { x: 450, y: 250, w: 120, h: 20 },

        { x: 810, y: 300, w: 110, h: 20 },

        { x: 1200, y: 250, w: 130, h: 20 },

        { x: 1600, y: 290, w: 120, h: 20 },

        { x: 2050, y: 260, w: 120, h: 20 },

        { x: 2350, y: 210, w: 130, h: 20 }
      ],

      coins: [
        { x: 220, y: 260, collected: false },
        { x: 500, y: 210, collected: false },
        { x: 860, y: 260, collected: false },
        { x: 1250, y: 210, collected: false },
        { x: 1650, y: 250, collected: false },
        { x: 2100, y: 220, collected: false },
        { x: 2400, y: 170, collected: false }
      ],

      enemies: [
        {
          x: 420,
          y: 365,
          startX: 400,
          endX: 640,
          direction: 1,
          width: 32,
          height: 35
        },

        {
          x: 1200,
          y: 365,
          startX: 1180,
          endX: 1420,
          direction: 1,
          width: 32,
          height: 35
        },

        {
          x: 2050,
          y: 365,
          startX: 2010,
          endX: 2400,
          direction: 1,
          width: 32,
          height: 35
        }
      ]
    };
  }

  return {
    width: 3000,
    startX: 50,
    startY: 330,
    finishX: 2900,
    checkpointX: 1550,

    platforms: [
      { x: 0, y: 400, w: 320, h: 50 },

      { x: 430, y: 400, w: 250, h: 50 },

      { x: 800, y: 400, w: 280, h: 50 },

      { x: 1180, y: 400, w: 280, h: 50 },

      { x: 1580, y: 400, w: 300, h: 50 },

      { x: 2000, y: 400, w: 1000, h: 50 },

      { x: 180, y: 290, w: 100, h: 20 },

      { x: 480, y: 240, w: 120, h: 20 },

      { x: 850, y: 290, w: 110, h: 20 },

      { x: 1220, y: 230, w: 120, h: 20 },

      { x: 1620, y: 280, w: 110, h: 20 },

      { x: 2050, y: 250, w: 120, h: 20 },

      { x: 2400, y: 200, w: 140, h: 20 }
    ],

    coins: [
      { x: 220, y: 250, collected: false },
      { x: 530, y: 200, collected: false },
      { x: 900, y: 250, collected: false },
      { x: 1270, y: 190, collected: false },
      { x: 1670, y: 240, collected: false },
      { x: 2100, y: 210, collected: false },
      { x: 2450, y: 160, collected: false }
    ],

    enemies: [
      {
        x: 470,
        y: 365,
        startX: 450,
        endX: 650,
        direction: 1,
        width: 32,
        height: 35
      },

      {
        x: 1220,
        y: 365,
        startX: 1200,
        endX: 1430,
        direction: 1,
        width: 32,
        height: 35
      },

      {
        x: 1650,
        y: 365,
        startX: 1600,
        endX: 1850,
        direction: 1,
        width: 32,
        height: 35
      },

      {
        x: 2200,
        y: 365,
        startX: 2050,
        endX: 2500,
        direction: 1,
        width: 32,
        height: 35
      }
    ]
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

export default function PlatformGame({
  level,
  onComplete,
  onExit
}: Props) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const keys =
    useRef<Record<string, boolean>>({});

  const levelRef =
    useRef<LevelConfig>(createLevel(level));

  const player = useRef<Player>({
    x: levelRef.current.startX,
    y: levelRef.current.startY,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT
  });

  const checkpointReached =
    useRef(false);

  const cameraX =
    useRef(0);

  const jumpLocked =
    useRef(false);

  const [finished, setFinished] =
    useState(false);

  const [lives, setLives] =
    useState(3);

  const livesRef =
    useRef(3);

  const [coinsCollected, setCoinsCollected] =
    useState(0);

  const coinsCollectedRef =
    useRef(0);

  useEffect(() => {
    levelRef.current = createLevel(level);

    player.current = {
      x: levelRef.current.startX,
      y: levelRef.current.startY,
      vx: 0,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT
    };

    checkpointReached.current = false;

    cameraX.current = 0;

    livesRef.current = 3;
    setLives(3);

    coinsCollectedRef.current = 0;
    setCoinsCollected(0);

    setFinished(false);
  }, [level]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key =
        event.key.toLowerCase();

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

    const up = (event: KeyboardEvent) => {
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
      canvas.getContext('2d');

    if (!ctx) return;

    let animation = 0;

    const resetPlayer = () => {
      const config =
        levelRef.current;

      if (
        checkpointReached.current
      ) {
        player.current.x =
          config.checkpointX;

        player.current.y = 330;
      } else {
        player.current.x =
          config.startX;

        player.current.y =
          config.startY;
      }

      player.current.vx = 0;
      player.current.vy = 0;
    };

    const loseLife = () => {
      livesRef.current -= 1;

      setLives(
        livesRef.current
      );

      if (
        livesRef.current <= 0
      ) {
        livesRef.current = 3;
        setLives(3);

        checkpointReached.current =
          false;
      }

      resetPlayer();
    };

    const gameLoop = () => {
      const config =
        levelRef.current;

      const p =
        player.current;

      const movingLeft =
        keys.current['arrowleft'] ||
        keys.current['a'];

      const movingRight =
        keys.current['arrowright'] ||
        keys.current['d'];

      if (movingLeft) {
        p.vx = -WALK_SPEED;
      } else if (movingRight) {
        p.vx = WALK_SPEED;
      } else {
        p.vx *= 0.75;
      }

      const previousBottom =
        p.y + p.height;

      const wantsJump =
        keys.current['arrowup'] ||
        keys.current['w'] ||
        keys.current[' '];

      let standing = false;

      config.platforms.forEach(
        (platform) => {
          if (
            p.x + p.width >
              platform.x &&
            p.x <
              platform.x +
                platform.w &&
            Math.abs(
              p.y +
                p.height -
                platform.y
            ) < 5
          ) {
            standing = true;
          }
        }
      );

      if (
        wantsJump &&
        standing &&
        !jumpLocked.current
      ) {
        p.vy = JUMP_FORCE;
        jumpLocked.current = true;
      }

      if (!wantsJump) {
        jumpLocked.current = false;
      }

      p.vy += GRAVITY;

      p.x += p.vx;
      p.y += p.vy;

      config.platforms.forEach(
        (platform) => {
          const newBottom =
            p.y + p.height;

          const horizontallyInside =
            p.x + p.width >
              platform.x &&
            p.x <
              platform.x +
                platform.w;

          const fallingOnTop =
            horizontallyInside &&
            previousBottom <=
              platform.y + 6 &&
            newBottom >=
              platform.y &&
            p.vy >= 0;

          if (fallingOnTop) {
            p.y =
              platform.y -
              p.height;

            p.vy = 0;
          }
        }
      );

      if (p.x < 0) {
        p.x = 0;
      }

      config.enemies.forEach(
        (enemy) => {
          enemy.x +=
            1.5 *
            enemy.direction;

          if (
            enemy.x <=
              enemy.startX
          ) {
            enemy.direction = 1;
          }

          if (
            enemy.x >=
              enemy.endX
          ) {
            enemy.direction = -1;
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
            const playerBottom =
              p.y + p.height;

            if (
              p.vy > 0 &&
              playerBottom -
                enemy.y <
                18
            ) {
              enemy.x =
                -9999;

              p.vy = -8;
            } else {
              loseLife();
            }
          }
        }
      );

      config.coins.forEach(
        (coin) => {
          if (coin.collected) {
            return;
          }

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
            coin.collected =
              true;

            coinsCollectedRef.current +=
              1;

            setCoinsCollected(
              coinsCollectedRef.current
            );
          }
        }
      );

      if (
        !checkpointReached.current &&
        p.x >=
          config.checkpointX
      ) {
        checkpointReached.current =
          true;
      }

      if (
        p.y >
        CANVAS_HEIGHT + 150
      ) {
        loseLife();
      }

      if (
        p.x >=
          config.finishX &&
        !finished
      ) {
        setFinished(true);
      }

      const desiredCamera =
        p.x -
        CANVAS_WIDTH * 0.4;

      cameraX.current =
        Math.max(
          0,
          Math.min(
            desiredCamera,
            config.width -
              CANVAS_WIDTH
          )
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
        camera,
        config.width
      );

      drawWorld(
        ctx,
        config,
        camera,
        checkpointReached.current
      );

      drawPlayer(
        ctx,
        p,
        camera,
        movingLeft
      );

      drawHud(
        ctx,
        level,
        livesRef.current,
        coinsCollectedRef.current,
        config.coins.length,
        checkpointReached.current
      );

      if (!finished) {
        animation =
          requestAnimationFrame(
            gameLoop
          );
      }
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(
        animation
      );
    };
  }, [finished, level]);

  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center'
      }}
    >
      <h2>
        🎮 FASE BÔNUS {level}
      </h2>

      <p>
        ← → ou A/D para andar •
        ↑, W ou Espaço para pular
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '12px',
          fontWeight: 800
        }}
      >
        <span>
          ❤️ VIDAS: {lives}
        </span>

        <span>
          🪙 MOEDAS:
          {' '}
          {coinsCollected}
        </span>

        <span>
          🚩 FASE {level}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: '100%',
          maxWidth: '900px',
          borderRadius: '20px',
          border:
            '5px solid white',
          boxShadow:
            '0 8px 30px rgba(0,0,0,.2)',
          background: '#75cfff'
        }}
      />

      {finished && (
        <div
          style={{
            marginTop: '20px'
          }}
        >
          <h2>
            🏆 FASE CONCLUÍDA!
          </h2>

          <p>
            Você coletou
            {' '}
            <strong>
              {coinsCollected}
            </strong>
            {' '}
            moedas.
          </p>

          <button
            className="primary"
            onClick={onComplete}
          >
            Continuar
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: '15px'
        }}
      >
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
  camera: number,
  worldWidth: number
) {
  ctx.fillStyle = '#74cfff';

  ctx.fillRect(
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );

  ctx.fillStyle = '#ffd93d';

  ctx.beginPath();

  ctx.arc(
    760,
    70,
    35,
    0,
    Math.PI * 2
  );

  ctx.fill();

  const parallax =
    camera * 0.2;

  ctx.fillStyle = '#b8e994';

  for (
    let x = -300;
    x < worldWidth;
    x += 500
  ) {
    const screenX =
      x -
      parallax;

    ctx.beginPath();

    ctx.moveTo(
      screenX,
      400
    );

    ctx.lineTo(
      screenX + 180,
      220
    );

    ctx.lineTo(
      screenX + 360,
      400
    );

    ctx.fill();
  }

  ctx.fillStyle =
    'rgba(255,255,255,.9)';

  for (
    let x = 100;
    x < worldWidth;
    x += 550
  ) {
    const screenX =
      x -
      camera * 0.35;

    ctx.beginPath();

    ctx.arc(
      screenX,
      90,
      24,
      0,
      Math.PI * 2
    );

    ctx.arc(
      screenX + 30,
      78,
      32,
      0,
      Math.PI * 2
    );

    ctx.arc(
      screenX + 65,
      93,
      23,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}

function drawWorld(
  ctx: CanvasRenderingContext2D,
  config: LevelConfig,
  camera: number,
  checkpointReached: boolean
) {
  config.platforms.forEach(
    (platform) => {
      const x =
        platform.x -
        camera;

      ctx.fillStyle =
        '#55a630';

      ctx.fillRect(
        x,
        platform.y,
        platform.w,
        9
      );

      ctx.fillStyle =
        '#8b5a2b';

      ctx.fillRect(
        x,
        platform.y + 9,
        platform.w,
        platform.h - 9
      );
    }
  );

  config.coins.forEach(
    (coin) => {
      if (coin.collected) {
        return;
      }

      ctx.fillStyle =
        '#ffd700';

      ctx.beginPath();

      ctx.arc(
        coin.x - camera,
        coin.y,
        11,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.strokeStyle =
        '#f39c12';

      ctx.lineWidth = 3;

      ctx.stroke();
    }
  );

  config.enemies.forEach(
    (enemy) => {
      if (
        enemy.x < -1000
      ) {
        return;
      }

      const x =
        enemy.x -
        camera;

      ctx.fillStyle =
        '#8e5a2b';

      ctx.fillRect(
        x,
        enemy.y,
        enemy.width,
        enemy.height
      );

      ctx.fillStyle =
        'white';

      ctx.fillRect(
        x + 5,
        enemy.y + 7,
        7,
        7
      );

      ctx.fillRect(
        x + 20,
        enemy.y + 7,
        7,
        7
      );

      ctx.fillStyle =
        '#222';

      ctx.fillRect(
        x + 8,
        enemy.y + 9,
        3,
        3
      );

      ctx.fillRect(
        x + 23,
        enemy.y + 9,
        3,
        3
      );
    }
  );

  const checkpointScreen =
    config.checkpointX -
    camera;

  ctx.fillStyle =
    '#555';

  ctx.fillRect(
    checkpointScreen,
    330,
    5,
    70
  );

  ctx.fillStyle =
    checkpointReached
      ? '#2ecc71'
      : '#f1c40f';

  ctx.fillRect(
    checkpointScreen + 5,
    330,
    28,
    20
  );

  const finishScreen =
    config.finishX -
    camera;

  ctx.fillStyle =
    '#333';

  ctx.fillRect(
    finishScreen,
    285,
    6,
    115
  );

  ctx.fillStyle =
    '#ff4757';

  ctx.fillRect(
    finishScreen + 6,
    285,
    45,
    28
  );
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  camera: number,
  lookingLeft: boolean
) {
  const x =
    player.x -
    camera;

  ctx.fillStyle =
    '#4b7bec';

  ctx.fillRect(
    x,
    player.y + 10,
    player.width,
    player.height - 10
  );

  ctx.fillStyle =
    '#ffe0bd';

  ctx.beginPath();

  ctx.arc(
    x +
      player.width / 2,
    player.y + 4,
    14,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    '#222';

  const eyeX =
    lookingLeft
      ? x + 9
      : x + 21;

  ctx.beginPath();

  ctx.arc(
    eyeX,
    player.y + 2,
    2,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    '#2d3436';

  ctx.fillRect(
    x + 2,
    player.y +
      player.height,
    12,
    5
  );

  ctx.fillRect(
    x + 18,
    player.y +
      player.height,
    12,
    5
  );
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  level: number,
  lives: number,
  coins: number,
  totalCoins: number,
  checkpoint: boolean
) {
  ctx.fillStyle =
    'rgba(0,0,0,.55)';

  ctx.fillRect(
    12,
    12,
    310,
    74
  );

  ctx.fillStyle =
    'white';

  ctx.font =
    'bold 17px Arial';

  ctx.fillText(
    `FASE ${level}`,
    25,
    37
  );

  ctx.fillText(
    `VIDAS: ${lives}`,
    25,
    62
  );

  ctx.fillText(
    `MOEDAS: ${coins}/${totalCoins}`,
    130,
    37
  );

  ctx.fillText(
    checkpoint
      ? 'CHECKPOINT: ✅'
      : 'CHECKPOINT: —',
    130,
    62
  );
}