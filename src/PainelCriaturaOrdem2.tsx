import { useState } from "react";

import type {
  ExecutarRolagem,
} from "./useRolagemFicha";

import {
  NOMES_ATRIBUTOS_CRIATURA,
  rolarAtributoCriaturaOrdem2,
  rolarPericiaCriaturaOrdem2,
  rolarAtaqueCriaturaOrdem2,
  textoResultadoCriaturaOrdem2,
} from "./lib/criatura-ordem2/criatura";

import type {
  EstadoCriaturaOrdem2,
  HabilidadeCriaturaOrdem2,
} from "./lib/criatura-ordem2/criatura";

type Props = {
  estado: EstadoCriaturaOrdem2;
  executar: ExecutarRolagem;
  enviando: boolean;
  acoes: number;
};

type Aba =
  | "atributos"
  | "combate"
  | "pericias"
  | "habilidades";

const ABAS: [Aba, string][] = [
  ["atributos", "Atributos"],
  ["combate", "Combate"],
  ["pericias", "Perícias"],
  ["habilidades", "Habilidades"],
];

export default function PainelCriaturaOrdem2({
  estado,
  executar,
  enviando,
  acoes,
}: Props) {
  const [aba, setAba] = useState<Aba>("atributos");
  const [busca, setBusca] = useState("");

  function normalizar(texto: string) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function corresponde(...textos: string[]) {
    return normalizar(textos.join(" ")).includes(
      normalizar(busca),
    );
  }

  function renderHabilidades(
    habilidades: HabilidadeCriaturaOrdem2[],
    grupo: string,
  ) {
    const visiveis = habilidades.filter((habilidade) =>
      corresponde(
        habilidade.nome,
        habilidade.descricao,
        ...(habilidade.ataques ?? []).map(
          (ataque) => ataque.nome,
        ),
      ),
    );

    if (!visiveis.length) {
      return <p>Nenhum registro encontrado.</p>;
    }

    return visiveis.map((habilidade) => (
      <details
        key={`${grupo}/${habilidade.id}`}
        className="pl-registro-salvo"
      >
        <summary className="pl-item-resumo">
          {habilidade.nome}
        </summary>

        {habilidade.descricao && (
          <p style={{ whiteSpace: "pre-wrap" }}>
            {habilidade.descricao}
          </p>
        )}

        {(habilidade.ataques ?? []).map(
          (ataque, indice) => (
            <div
              key={`${ataque.id}/${indice}`}
              className="ow-o2-criatura-ataque"
            >
              <strong>{ataque.nome}</strong>

              <p>
                Dano: {ataque.dano}
                {ataque.rolagemDano
                  ? ` + ${ataque.rolagemDano}`
                  : ""}
                {ataque.tipo ? ` · ${ataque.tipo}` : ""}
              </p>

              {ataque.alcance && (
                <p>Alcance: {ataque.alcance}</p>
              )}

              {(ataque.danosAdicionais ?? []).map(
                (adicional, adicionalIndice) => (
                  <p key={adicionalIndice}>
                    Adicional: {adicional.dano}
                    {adicional.tipo
                      ? ` · ${adicional.tipo}`
                      : ""}
                  </p>
                ),
              )}

              {Array.from(
                {
                  length: Math.max(
                    1,
                    Math.min(100, ataque.quantidade || 1),
                  ),
                },
                (_, numero) => (
                  <button
                    key={numero}
                    type="button"
                    disabled={enviando || acoes < 1}
                    onClick={() =>
                      void executar(
                        () =>
                          textoResultadoCriaturaOrdem2(
                            rolarAtaqueCriaturaOrdem2(
                              estado,
                              ataque,
                            ),
                          ),
                        true,
                      )
                    }
                  >
                    {ataque.quantidade > 1
                      ? `Rolar ataque ${numero + 1}`
                      : "Rolar ataque"}
                    {" · 1 ação"}
                  </button>
                ),
              )}
            </div>
          ),
        )}
      </details>
    ));
  }

  return (
    <>
      <nav
        className="frc-abas"
        aria-label="Abas da criatura Ordem 2"
      >
        {ABAS.map(([chave, titulo]) => (
          <button
            key={chave}
            type="button"
            aria-pressed={aba === chave}
            onClick={() => setAba(chave)}
          >
            {titulo}
          </button>
        ))}
      </nav>

      <section className="pl-painel ow-conteudo">
        <input
          type="search"
          aria-label="Pesquisar na criatura"
          placeholder="Pesquisar..."
          value={busca}
          onChange={(evento) =>
            setBusca(evento.target.value)
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: 16,
          }}
        />

        {aba === "atributos" && (
          <div className="ow-atributos-simples">
            {(
              ["fisico", "mente", "presenca"] as const
            ).map((atributo) => (
              <button
                key={atributo}
                type="button"
                disabled={enviando}
                onClick={() =>
                  void executar(() =>
                    textoResultadoCriaturaOrdem2(
                      rolarAtributoCriaturaOrdem2(
                        estado,
                        atributo,
                      ),
                    ),
                  )
                }
              >
                <small>
                  {NOMES_ATRIBUTOS_CRIATURA[atributo]}
                </small>

                <strong>
                  D{estado.atributos[atributo]}
                </strong>
              </button>
            ))}
          </div>
        )}

        {aba === "pericias" && (
          <>
            {(estado.pericias ?? [])
              .filter((pericia) =>
                corresponde(pericia.nome),
              )
              .map((pericia) => (
                <div
                  key={pericia.id}
                  className="ow-o2-criatura-pericia"
                >
                  <div>
                    <strong>{pericia.nome}</strong>

                    <small>
                      {
                        NOMES_ATRIBUTOS_CRIATURA[
                          pericia.atributo
                        ]
                      }
                      {" "}
                      D{estado.atributos[pericia.atributo]}
                      {" + "}
                      Perícia D{pericia.treino}
                      {pericia.dadosExtras
                        ? ` · Extras: ${pericia.dadosExtras}`
                        : ""}
                    </small>
                  </div>

                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() =>
                      void executar(() =>
                        textoResultadoCriaturaOrdem2(
                          rolarPericiaCriaturaOrdem2(
                            estado,
                            pericia,
                          ),
                        ),
                      )
                    }
                  >
                    Rolar
                  </button>
                </div>
              ))}
          </>
        )}

        {aba === "combate" &&
          renderHabilidades(
            estado.acoes ?? [],
            "acoes",
          )}

        {aba === "habilidades" &&
          renderHabilidades(
            estado.poderes ?? [],
            "poderes",
          )}
      </section>
    </>
  );
}