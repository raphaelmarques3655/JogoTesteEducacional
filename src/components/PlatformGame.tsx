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
};

const WIDTH = 900;
const HEIGHT = 450;

export default function PlatformGame({
  level,
  onComplete,
  onExit
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const keys = useRef<Record<string, boolean>>({});

  const [finished, setFinished] = useState(false);

  const player = useRef<Player>({
    x: 50,
    y: 330,
    vx: 0,
    vy: 0
  });

  const platforms = [
    { x: 0, y: 400, w: 900, h: 50 },

    { x: 180, y: 330, w: 120, h: 20 },
    { x: 380, y: 280, w: 130, h: 20 },
    { x: 600, y: 330, w: 120, h: 20 }
  ];

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.key.toLowerCase()] = true;
    };

    const up = (event: KeyboardEvent) => {
      keys.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    let animation = 0;

    const gameLoop = () => {
      const p = player.current;

      if (keys.current['arrowleft'] || keys.current['a']) {
        p.vx = -4;
      } else if (
        keys.current['arrowright'] ||
        keys.current['d']
      ) {
        p.vx = 4;
      } else {
        p.vx *= 0.8;
      }

      const onGround =
        p.y >= 350 ||
        platforms.some((platform) => {
          const feet = p.y + 40;

          return (
            p.x + 30 > platform.x &&
            p.x < platform.x + platform.w &&
            feet >= platform.y - 5 &&
            feet <= platform.y + 8 &&
            p.vy >= 0
          );
        });

      if (
        (keys.current['arrowup'] ||
          keys.current['w'] ||
          keys.current[' ']) &&
        onGround
      ) {
        p.vy = -11;
      }

      p.vy += 0.55;

      p.x += p.vx;
      p.y += p.vy;

      platforms.forEach((platform) => {
        const feet = p.y + 40;

        if (
          p.x + 30 > platform.x &&
          p.x < platform.x + platform.w &&
          feet >= platform.y &&
          feet <= platform.y + 15 &&
          p.vy >= 0
        ) {
          p.y = platform.y - 40;
          p.vy = 0;
        }
      });

      if (p.x < 0) p.x = 0;

      if (p.x > WIDTH - 30) {
        p.x = WIDTH - 30;
      }

      if (p.y > HEIGHT) {
        p.x = 50;
        p.y = 330;
        p.vx = 0;
        p.vy = 0;
      }

      if (p.x >= 830 && !finished) {
        setFinished(true);
      }

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Céu
      ctx.fillStyle = '#75cfff';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Sol
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.arc(780, 80, 35, 0, Math.PI * 2);
      ctx.fill();

      // Nuvens
      ctx.fillStyle = 'white';

      ctx.beginPath();
      ctx.arc(130, 80, 25, 0, Math.PI * 2);
      ctx.arc(160, 70, 30, 0, Math.PI * 2);
      ctx.arc(195, 82, 23, 0, Math.PI * 2);
      ctx.fill();

      // Plataformas
      ctx.fillStyle = '#6ab04c';

      platforms.forEach((platform) => {
        ctx.fillRect(
          platform.x,
          platform.y,
          platform.w,
          platform.h
        );

        ctx.fillStyle = '#8b5a2b';

        ctx.fillRect(
          platform.x,
          platform.y + 8,
          platform.w,
          platform.h - 8
        );

        ctx.fillStyle = '#6ab04c';
      });

      // Moedas
      const coins = [
        { x: 230, y: 285 },
        { x: 440, y: 235 },
        { x: 650, y: 285 }
      ];

      coins.forEach((coin) => {
        ctx.fillStyle = '#ffd700';

        ctx.beginPath();
        ctx.arc(
          coin.x,
          coin.y,
          10,
          0,
          Math.PI * 2
        );

        ctx.fill();
      });

      // Chegada
      ctx.fillStyle = '#444';
      ctx.fillRect(850, 300, 6, 100);

      ctx.fillStyle = '#ff4757';
      ctx.fillRect(856, 300, 35, 25);

      // Personagem
      ctx.fillStyle = '#6c5ce7';

      ctx.fillRect(
        p.x,
        p.y,
        30,
        40
      );

      ctx.fillStyle = '#ffeaa7';

      ctx.beginPath();
      ctx.arc(
        p.x + 15,
        p.y - 7,
        13,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle = '#222';
      ctx.font = 'bold 18px Arial';

      ctx.fillText(
        `FASE ${level}`,
        20,
        30
      );

      if (!finished) {
        animation =
          requestAnimationFrame(gameLoop);
      }
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animation);
    };
  }, [finished, level]);

  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center'
      }}
    >
      <h2>🎮 FASE BÔNUS {level}</h2>

      <p>
        Use ← → para andar e ↑ ou espaço para pular.
      </p>

      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          width: '100%',
          maxWidth: '900px',
          borderRadius: '20px',
          border: '5px solid white',
          boxShadow: '0 8px 30px rgba(0,0,0,.2)'
        }}
      />

      {finished && (
        <div
          style={{
            marginTop: '20px'
          }}
        >
          <h2>🏆 FASE CONCLUÍDA!</h2>

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