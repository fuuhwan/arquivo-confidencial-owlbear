const TOTAL_PONTOS = 540;
const VOLTAS = 3.25;

function pontoEspiral(progresso: number) {
  const angulo = progresso * Math.PI * 2 * VOLTAS - 0.7;
  const raio = 73 - progresso * 55;

  const irregularidade =
    (Math.sin(angulo * 3.2) * 1.1 +
      Math.sin(angulo * 7.4) * 0.4) *
    (1 - progresso * 0.6);

  return {
    x: 80 + Math.cos(angulo) * (raio + irregularidade),
    y: 80 + Math.sin(angulo) * (raio + irregularidade),
  };
}

function criarFaixaEspiral() {
  const esquerda: string[] = [];
  const direita: string[] = [];

  for (let indice = 0; indice <= TOTAL_PONTOS; indice++) {
    const progresso = indice / TOTAL_PONTOS;

    const ponto = pontoEspiral(progresso);
    const anterior = pontoEspiral(
      Math.max(0, progresso - 0.001),
    );
    const seguinte = pontoEspiral(
      Math.min(1, progresso + 0.001),
    );

    const dx = seguinte.x - anterior.x;
    const dy = seguinte.y - anterior.y;
    const comprimento = Math.hypot(dx, dy) || 1;

    const normalX = -dy / comprimento;
    const normalY = dx / comprimento;

    const afinamento =
      Math.pow(Math.sin(Math.PI * progresso), 0.55);

    const espessura =
      0.15 +
      afinamento *
        (1.35 + Math.sin(progresso * 31) * 0.35);

    esquerda.push(
      `${(ponto.x + normalX * espessura).toFixed(2)},` +
      `${(ponto.y + normalY * espessura).toFixed(2)}`,
    );

    direita.push(
      `${(ponto.x - normalX * espessura).toFixed(2)},` +
      `${(ponto.y - normalY * espessura).toFixed(2)}`,
    );
  }

  return (
    `M${esquerda.join(" L")}` +
    ` L${direita.reverse().join(" L")} Z`
  );
}

const faixaEspiral = criarFaixaEspiral();

export function SimboloCentralMorte() {
  return (
    <img
      className="morte-simbolo-central"
      src={`${import.meta.env.BASE_URL}temas/morte-simbolo.webp`}
      alt=""
      aria-hidden="true"
    />
  );
}

export function AnelMorte() {
  return (
    <svg
      className="morte-anel"
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={faixaEspiral}
        fill="currentColor"
      />
    </svg>
  );
}