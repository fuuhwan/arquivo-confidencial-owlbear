const LINHAS = [
  "ABCDEFGHIJK",
  "LMNOPQRSTUV",
  "WXYZ",
];

function localizarLetra(letra: string) {
  for (let linha = 0; linha < LINHAS.length; linha++) {
    const coluna = LINHAS[linha].indexOf(letra);

    if (coluna !== -1) {
      return {
        x: 16 + coluna * 91.3,
        y: [14, 184, 366][linha],
      };
    }
  }

  return null;
}

export default function AnelAtributoConhecimento({
  nome,
}: {
  nome: string;
}) {
const nomeNormalizado = nome
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim()
  .toUpperCase();

// Repete somente o nome para preencher toda a circunferência.
const repeticoes = Math.max(
  1,
  Math.round(24 / (nomeNormalizado.length + 1)),
);

const letras = Array.from(
  `${nomeNormalizado} `.repeat(repeticoes),
);

const passo = 360 / letras.length;

  return (
    <svg
      className="conhecimento-anel conhecimento-anel-escrito"
      viewBox="0 0 160 160"
      aria-hidden="true"
      fill="none"
    >
      {letras.map((letra, indice) => {
        const recorte = localizarLetra(letra);

        if (!recorte) return null;

        return (
          <g
            key={indice}
            transform={`translate(80 80) rotate(${indice * passo}) translate(0 -63)`}
          >
            <svg
              x="-10"
              y="-11"
              width="20"
              height="22"
              viewBox={`${recorte.x} ${recorte.y} 64 68`}
              overflow="hidden"
              preserveAspectRatio="xMidYMid meet"
            >
              <image
                href={`${import.meta.env.BASE_URL}temas/conhecimento-alfabeto.webp`}
                x="0"
                y="0"
                width="1008"
                height="490"
              />
            </svg>
          </g>
        );
      })}
    </svg>
  );
}