type Props = {
  afinidade?: string;
  className?: string;
};

export function AnelConhecimento() {
  const sigilos = [
    "M-5-6 Q5-9 5-2 Q5 5-3 5 M-3-3 V8 M-6 0 H3",
    "M0-8 V8 M-5-5 L0 0 L5-5 M-4 5 H4",
    "M-6 5 L-3-6 L3 3 L6-5 M-6 5 L5 7",
    "M-5-5 Q0-9 5-5 Q8 0 2 4 Q-5 8-5 1 M0-8 V8",
    "M-6-6 L5-3 L-3 2 L5 7 M-5 6 L1-7",
    "M-5 4 Q-7-5 0-6 Q7-5 5 4 M-4 0 H4 M0-8 V8",
    "M-6 5 L0-7 L6 5 Z M-5-1 H5 M0 5 V9",
    "M-5-7 Q3-5 1 1 Q-2 6 5 7 M-5 1 H6 M3-7 V3",
    "M-6-4 L0 1 L6-4 M-5 7 L0-5 L5 7 M-3 3 H3",
    "M-5-5 Q5-8 4 0 Q3 7-4 5 M-1-7 V8 M-6 1 H6",
    "M-5-7 L5 7 M5-7 L-5 7 M-6-1 H6 M0-8 V8",
    "M-5 6 Q-5-2 1-5 Q6-7 5-1 Q4 4-2 2 M1-8 V8",
    "M-6-5 H4 L-2 1 L5 6 H-4 M-2-8 V8",
    "M-5 5 L-3-5 L3-7 L5 4 M-6 0 H6 M0-4 V8",
    "M-5-5 Q0 1 5-5 M-5 5 Q0-1 5 5 M0-8 V8",
    "M-6 3 L-1-7 L3 0 L6-4 M-5 6 H5 M1 0 V8",
  ];

  return (
    <svg
      className="conhecimento-anel"
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Limites da faixa de sigilos */}
      <circle cx="80" cy="80" r="71" />
      <circle cx="80" cy="80" r="68" />
      <circle cx="80" cy="80" r="49" />
      <circle cx="80" cy="80" r="46" />

      {/* Sigilos distribuídos ao redor do atributo */}
      {Array.from({ length: 24 }, (_, indice) => (
        <g
          key={`sigilo-${indice}`}
          transform={`rotate(${indice * 15} 80 80)`}
        >
          <g transform="translate(80 21.5) scale(.75)">
            <path
              className="conhecimento-sigilo"
              d={sigilos[indice % sigilos.length]}
            />
          </g>
        </g>
      ))}

      {/* Acabamento ornamental em quatro pontos */}
      {Array.from({ length: 4 }, (_, indice) => (
        <g
          key={`acabamento-${indice}`}
          transform={`rotate(${indice * 90} 80 80)`}
        >
          <path d="M68 10 Q74 2 80 7 Q86 2 92 10" />
          <path d="M75 8 L80 2 L85 8" />
          <circle cx="80" cy="2" r="1" />
        </g>
      ))}
    </svg>
  );
}

export default function SimboloAfinidade({
  afinidade,
  className,
}: Props) {
  const elemento = (afinidade ?? "").trim().toLowerCase();

  if (
    !["conhecimento", "sangue", "morte", "energia", "medo"]
      .includes(elemento)
  ) {
    return null;
  }

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {elemento === "conhecimento" && (
        <>
          <path
            d="
              M35 22
              C76 12 77 27 58 44
              L42 59
              C22 78 35 85 65 77
              C76 72 62 61 51 51
              L39 39
              C28 29 25 25 35 22
              Z
            "
          />
          <path d="M38 26 Q55 21 65 25" opacity=".45" />
          <path d="M38 75 Q54 79 63 74" opacity=".45" />
        </>
      )}

      {elemento === "sangue" && (
        <>
          <path d="M50 12 V79" strokeWidth="7" />
          <path d="M19 43 H81" strokeWidth="6" />
          <path d="M18 75 Q50 81 82 73" strokeWidth="7" />
          <path d="M50 12 L47 31 M50 12 L53 31" strokeWidth="2" />
        </>
      )}

      {elemento === "morte" && (
        <>
          <path
            d="
              M62 52
              C62 35 39 34 37 49
              C34 68 64 72 72 53
              C83 26 41 13 23 36
              C3 63 34 90 63 78
              C91 67 91 29 65 18
            "
          />
          <path d="M48 38 V91 M52 38 V91" />
          <path d="M24 28 L13 17 M20 68 L9 81 M73 74 L84 88" />
        </>
      )}

      {elemento === "energia" && (
        <>
          <path d="M48 8 L28 31 L45 43 L34 65 L49 91" />
          <path d="M57 12 L72 34 L58 48 L70 65 L55 88" />
          <path d="M15 36 L32 48 L17 63 L34 60" />
          <path d="M85 36 L68 48 L83 63 L66 60" />
          <path d="M50 27 L46 51 L54 69" strokeWidth="2" />
        </>
      )}

      {elemento === "medo" && (
        <>
          <path
            d="
              M24 25
              C28 3 74 8 75 31
              C77 51 37 51 35 73
              C32 92 58 94 70 77
              M35 73 L59 38
              M47 53 V89
            "
          />
          <circle cx="22" cy="29" r="5" />
          <circle cx="72" cy="75" r="5" />
        </>
      )}
    </svg>
  );
}
export function GlifoConhecimento({
  atributo,
}: {
  atributo: "fisico" | "mente" | "presenca";
}) {
  return (
    <svg
      className="conhecimento-glifo-interno"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {atributo === "fisico" && (
        <>
          <path d="M50 12 V88 M23 32 L50 49 L77 32" />
          <path d="M25 69 L50 53 L75 69 M34 80 H66" />
          <circle cx="50" cy="26" r="11" />
        </>
      )}

      {atributo === "mente" && (
        <>
          <path d="M29 24 Q72 8 75 40 Q77 69 39 70" />
          <path d="M48 24 V88 M29 48 H71" />
          <path d="M35 82 L48 70 L61 82" />
        </>
      )}

      {atributo === "presenca" && (
        <>
          <path d="M50 12 L22 69 H78 Z" />
          <path d="M50 35 V88 M20 49 H80" />
          <path d="M32 24 Q50 41 68 24" />
          <circle cx="50" cy="65" r="12" />
        </>
      )}
    </svg>
  );
}