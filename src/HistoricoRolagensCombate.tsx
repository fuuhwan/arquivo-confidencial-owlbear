import { useEffect, useState } from "react";
import {
  limitToLast,
  onValue,
  orderByChild,
  query,
  ref,
} from "firebase/database";
import { database } from "./lib/firebase";

type Evento = {
  id: string;
  ficha: string;
  jogador: string;
  resultado: string;
  quando: number;
  afinidade: string;
};

type Props = {
  combateId: string;
  mestre: boolean;
};

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function resumirResultado(texto: string) {
  const linhas = texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);

  const primeira = linhas[0] ?? "Rolagem";

  const titulo = primeira.includes(":")
    ? primeira.slice(0, primeira.indexOf(":"))
    : primeira;

  // Destaca um total apenas quando há um único
  // resultado explícito no texto.
  const totais = [
    ...texto.matchAll(/=\s*([+-]?\d+(?:[.,]\d+)?)/g),
  ];

  const danoDireto =
    totais.length === 0
      ? texto.match(/^\s*(?:Dano|Cura)\s*:\s*([+-]?\d+)/im)
      : null;

  return {
    titulo: titulo || "Rolagem",
    valor:
      totais.length === 1
        ? totais[0][1]
        : danoDireto?.[1] ?? "…",
    tipo:
      totais.length > 1
        ? "RESULTADOS"
        : /\bcr[ií]tico\b/i.test(texto)
          ? "CRÍTICO"
          : /^\s*dano\s*:/im.test(texto)
            ? "DANO"
            : /^\s*cura\s*:/im.test(texto)
              ? "CURA"
              : "TESTE",
  };
}

export default function HistoricoRolagensCombate({
  combateId,
  mestre,
}: Props) {
  const [fontes, setFontes] = useState<
    Record<string, Evento[]>
  >({});
  const [erros, setErros] = useState<
    Record<string, string>
  >({});
  const [pendentes, setPendentes] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const caminhos = mestre
      ? ["rolagensRecentes", "rolagensCriaturas"]
      : ["rolagensRecentes"];

    let encerrado = false;

    setFontes({});
    setErros({});
    setPendentes(caminhos);

    const cancelar = caminhos.map((caminho) =>
      onValue(
        query(
          ref(database, caminho),
          orderByChild("quando"),
          limitToLast(50),
        ),
        (snapshot) => {
          if (encerrado) return;

          const eventos: Evento[] = [];

          snapshot.forEach((filho) => {
            const dado: unknown = filho.val();

            if (!dado || typeof dado !== "object") {
              return;
            }

            const r = dado as Record<string, unknown>;

            if (
              typeof r.resultado !== "string" ||
              typeof r.quando !== "number" ||
              !Number.isFinite(r.quando) ||
              Number.isNaN(new Date(r.quando).getTime())
            ) {
              return;
            }

            if (
              typeof r.combateId === "string" &&
              r.combateId !== combateId
            ) {
              return;
            }

            const elemento =
              typeof r.afinidade === "string"
                ? normalizar(r.afinidade)
                : "nenhuma";

            eventos.push({
              id: `${caminho}/${filho.key}`,
              ficha:
                typeof r.ficha === "string"
                  ? r.ficha
                  : "Rolagem",
              jogador:
                typeof r.jogador === "string"
                  ? r.jogador
                  : "",
              resultado: r.resultado,
              quando: r.quando,
              afinidade: [
                "sangue",
                "morte",
                "energia",
                "conhecimento",
                "medo",
              ].includes(elemento)
                ? elemento
                : "nenhuma",
            });
          });

          setFontes((atual) => ({
            ...atual,
            [caminho]: eventos,
          }));

          setErros((atual) => ({
            ...atual,
            [caminho]: "",
          }));

          setPendentes((atual) =>
            atual.filter((p) => p !== caminho),
          );
        },
        (erro) => {
          if (encerrado) return;

          setFontes((atual) => ({
            ...atual,
            [caminho]: [],
          }));

          setErros((atual) => ({
            ...atual,
            [caminho]:
              `Não foi possível carregar ${
                caminho === "rolagensCriaturas"
                  ? "as rolagens das criaturas"
                  : "as rolagens compartilhadas"
              }: ${erro.message}`,
          }));

          setPendentes((atual) =>
            atual.filter((p) => p !== caminho),
          );
        },
      ),
    );

    return () => {
      encerrado = true;
      cancelar.forEach((desligar) => desligar());
    };
  }, [combateId, mestre]);

  const recentes = Object.values(fontes)
    .flat()
    .sort(
      (a, b) =>
        b.quando - a.quando ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 100);

  const eventos = recentes.filter((r) =>
    normalizar(
      `${r.ficha} ${r.jogador} ${r.resultado}`,
    ).includes(normalizar(busca)),
  );

  return (
    <section
      className="ac-historico"
      aria-label="Histórico de rolagens"
    >
      <h2>Histórico de rolagens</h2>

      <input
        aria-label="Pesquisar rolagens"
        placeholder="Pesquisar rolagens…"
        value={busca}
        onChange={(evento) =>
          setBusca(evento.target.value)
        }
      />

      {pendentes.length > 0 && (
        <p role="status">Carregando rolagens…</p>
      )}

      {Object.entries(erros)
        .filter(([, mensagem]) => mensagem)
        .map(([fonte, mensagem]) => (
          <p
            className="erro"
            role="alert"
            key={fonte}
          >
            {mensagem}
          </p>
        ))}

      {!pendentes.length && !eventos.length && (
        <p>
          {busca
            ? "Nenhuma rolagem encontrada."
            : "Nenhuma rolagem disponível."}
        </p>
      )}

      {eventos.map((r) => {
        const resumo = resumirResultado(r.resultado);

        return (
          <article
            className="ac-evento-rolagem"
            key={r.id}
            data-afinidade={r.afinidade}
          >
            <h3>{r.ficha}</h3>

            <details className="ac-dado-tematico">
              <summary>
                <span className="ac-dado-texto">
                  <strong>{resumo.titulo}</strong>
                  <span className="ac-ver-calculo">
                    Ver cálculo
                  </span>
                </span>

                <span className="ac-dado-resultado">
                  <strong>{resumo.valor}</strong>
                  <small>{resumo.tipo}</small>
                </span>
              </summary>

              <pre>{r.resultado}</pre>
            </details>

            <footer>
              <span>{r.jogador}</span>
              <time
                dateTime={new Date(
                  r.quando,
                ).toISOString()}
              >
                {new Date(r.quando).toLocaleString(
                  "pt-BR",
                )}
              </time>
            </footer>
          </article>
        );
      })}
    </section>
  );
}