import type { CSSProperties } from "react";
import D20Icon from "./components/ficha-tematica/D20Icon";

function temaAfinidade(valor = ""): CSSProperties {
  const elemento = valor.trim().toUpperCase();

  const temas: Record<string, [string, string]> = {
    MORTE: ["#b7b7b7", "rgba(0,0,0,.85)"],
    SANGUE: ["#b72025", "rgba(30,3,3,.85)"],
    ENERGIA: ["#a43cff", "rgba(10,3,22,.85)"],
    CONHECIMENTO: ["#b58b14", "rgba(20,15,0,.85)"],
  };

  const tema = temas[elemento];
  if (!tema) return {};

  return {
    "--afinidade-cor": tema[0],
    backgroundImage: `linear-gradient(90deg, ${tema[1]}, rgba(0,0,0,.5)), url("${import.meta.env.BASE_URL}ameacas/${elemento}.PNG")`,
    backgroundSize: "cover",
    backgroundPosition: "right center",
  } as CSSProperties;
}

type Props = {
  texto: string;
  personagem: string;
  afinidade?: string;
  fechar: () => void;
};

export default function NotificacaoRolagem({
  texto,
  personagem,
  afinidade,
  fechar,
}: Props) {
  const linhas = texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);

  const temAtaque = linhas.some((linha) =>
    /^Ataque \d+:/.test(linha),
  );

  const resultados = temAtaque
    ? linhas.filter((linha) =>
        /^(Ataque \d+:|Dano:|Adicional:)/.test(linha),
      )
    : linhas.filter((linha) =>
        /=\s*-?\d/.test(linha),
      );

function resultadoFinal(linha: string) {
  const valores = [
    ...linha.matchAll(/=\s*(-?\d+(?:\.\d+)?)/g),
  ];

  // Usa o último resultado, incluindo multiplicações de crítico.
  if (valores.length) {
    return valores[valores.length - 1][1];
  }

  // Dano sem multiplicação: "Dano: 15 (...) Balístico".
  const inicial = linha.match(/:\s*(-?\d+(?:\.\d+)?)/);

  return inicial?.[1] ?? "—";
}

  function nomeDaOrigem(linha: string) {
    if (temAtaque) return linhas[0] || "Ataque";

    const separador = linha.indexOf(":");

    return separador >= 0
      ? linha.slice(0, separador).trim() || "Rolagem"
      : "Rolagem";
  }

  return (
    <aside
      className="pl-notificacao-dados"
      role="status"
      style={{
        ...temaAfinidade(afinidade),
        borderColor: "var(--afinidade-cor, #ffffff80)",
        right: 4,
        width: 320,
        maxWidth: "calc(100vw - 8px)",
        boxSizing: "border-box",
      }}
    >
      <header>
        <strong>{personagem}</strong>

        <button
          type="button"
          aria-label="Fechar resultado"
          onClick={fechar}
        >
          ×
        </button>
      </header>

      {temAtaque && <small>{linhas[0]}</small>}

      <div className="pl-notificacao-resultados">
        <D20Icon tamanho={32} />

        {resultados.map((linha, indice) => {
          const ataque = /^Ataque \d+:/.test(linha);

          const dano =
            /^(Dano:|Adicional:|Dano principal|Dano adicional|Dano total)/i.test(
              linha,
            );

          const tipoDano = dano
            ? linha
                .match(
                  /([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s/-]*)$/,
                )?.[1]
                .trim()
            : "";

          return (
            <details
              key={indice}
              className="pl-notificacao-valor"
            >
              <summary title={linha}>
                <small
                  style={{
                    display: "block",
                    width: "100%",
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: "center",
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                    marginBottom: 3,
                  }}
                >
                  {nomeDaOrigem(linha)}
                </small>

                <strong>{resultadoFinal(linha)}</strong>

                <span>
                  {ataque
                    ? "ATAQUE"
                    : dano
                      ? "DANO"
                      : "RESULTADO"}
                </span>

                {dano && tipoDano && (
                  <small className="pl-notificacao-tipo-dano">
                    {tipoDano}
                  </small>
                )}

                {ataque && linha.includes("CRÍTICO") && (
                  <em>CRÍTICO!</em>
                )}
              </summary>

              <pre>{linha}</pre>
            </details>
          );
        })}

        {resultados.length === 0 && <pre>{texto}</pre>}
      </div>
    </aside>
  );
}