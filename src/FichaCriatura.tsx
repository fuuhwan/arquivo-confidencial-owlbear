import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "./lib/firebase";
import RolarAtaqueCriatura from "./RolarAtaqueCriatura";

type Ataque = {
  nome: string;
  alcance: string;
  quantidade: number;
  dados: number;
  bonus: number;
  critico: number;
  multiplicador: number;
  dano: string;
  tipo: string;
  danosAdicionais?: {
    dano: string;
    tipo: string;
  }[];
};

type Habilidade = {
  id: string;
  nome: string;
  descricao: string;
  ataques?: Ataque[];
};

type Criatura = {
  nome: string;
  tipo: string;
  tamanho: string;
  elemento: string;
  vd: number;
  defesa: number;
  deslocamento: number;
  agi: number;
  for: number;
  int: number;
  pre: number;
  vig: number;
  atributos?: {
    fisico: number;
    mente: number;
    presenca: number;
  };
  acoes?: Habilidade[];
  poderes?: Habilidade[];
};

type Props = {
  combateId: string;
  participanteId: string;
};

function mostrar(numero?: number) {
  return typeof numero === "number" && Number.isFinite(numero)
    ? numero
    : "—";
}

function ListaHabilidades({
  titulo,
  habilidades,
  combateId,
  participanteId,
  nome,
  elemento,
}: {
  titulo: string;
  habilidades?: Habilidade[];
  combateId: string;
  participanteId: string;
  nome: string;
  elemento: string;
}) {
  const lista = Array.isArray(habilidades) ? habilidades : [];

  return (
    <section className="grupo-habilidades">
      <h3>{titulo}</h3>

      {lista.length === 0 && <p>Nenhuma cadastrada.</p>}

      {lista.map((habilidade, indice) => (
        <details key={`${habilidade.id}-${indice}`}>
          <summary>{habilidade.nome || "Sem nome"}</summary>

          {habilidade.descricao && (
            <p className="texto-ficha">
              {habilidade.descricao}
            </p>
          )}

          {(Array.isArray(habilidade.ataques)
            ? habilidade.ataques
            : []
          ).map((ataque, indiceAtaque) => (
            <article className="ataque-consulta" key={indiceAtaque}>
              <h4>{ataque.nome || "Ataque"}</h4>
              <RolarAtaqueCriatura
  combateId={combateId}
  participanteId={participanteId}
  nome={nome}
  elemento={elemento}
  ataque={ataque}
/>

              <p>
                Acerto: {mostrar(ataque.dados)}d20
                {" "}
                {ataque.bonus >= 0 ? "+" : ""}
                {mostrar(ataque.bonus)}
              </p>

              <p>
                Dano: {ataque.dano || "—"}
                {ataque.tipo ? ` · ${ataque.tipo}` : ""}
              </p>

              <p>
                Alcance: {ataque.alcance || "—"}
                {" · "}
                Quantidade: {mostrar(ataque.quantidade)}
              </p>

              <p>
                Crítico: {mostrar(ataque.critico)}
                {" · "}
                Multiplicador: ×{mostrar(ataque.multiplicador)}
              </p>

              {(Array.isArray(ataque.danosAdicionais)
                ? ataque.danosAdicionais
                : []
              ).map((extra, indiceExtra) => (
                <p key={indiceExtra}>
                  Adicional: {extra.dano || "—"}
                  {extra.tipo ? ` · ${extra.tipo}` : ""}
                </p>
              ))}
            </article>
          ))}
        </details>
      ))}
    </section>
  );
}

export default function FichaCriatura({
  combateId,
  participanteId,
}: Props) {
  const [ficha, setFicha] = useState<Criatura | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setFicha(null);
    setErro("");
    setCarregando(true);

    return onValue(
      ref(
        database,
        `combateCriaturas/${combateId}/${participanteId}/json`,
      ),
      (snapshot) => {
        try {
          const json = snapshot.val();

          if (typeof json !== "string") {
            throw new Error("A ficha ainda não está disponível.");
          }

          const dados: unknown = JSON.parse(json);

          if (
            !dados ||
            typeof dados !== "object" ||
            Array.isArray(dados) ||
            !("nome" in dados) ||
            typeof dados.nome !== "string"
          ) {
            throw new Error("O formato da ficha é inválido.");
          }

          setFicha(dados as Criatura);
          setErro("");
        } catch (falha) {
          setFicha(null);
          setErro(
            falha instanceof Error
              ? falha.message
              : "Não foi possível consultar a ficha.",
          );
        } finally {
          setCarregando(false);
        }
      },
      (falha) => {
        setFicha(null);
        setErro(falha.message);
        setCarregando(false);
      },
    );
  }, [combateId, participanteId]);

  return (
    <details className="ficha-consulta">
      <summary>Ficha e ataques</summary>

      {carregando && <p>Carregando ficha…</p>}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      {ficha && (
        <>
          <p>
            {[ficha.tipo, ficha.tamanho, ficha.elemento]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <div className="dados-token">
            <div>
              <span>Defesa</span>
              <strong>{mostrar(ficha.defesa)}</strong>
            </div>

            <div>
              <span>VD</span>
              <strong>{mostrar(ficha.vd)}</strong>
            </div>

            <div>
              <span>Deslocamento</span>
              <strong>{mostrar(ficha.deslocamento)} m</strong>
            </div>
          </div>

          <div className="atributos-consulta">
            {(
              ficha.atributos
                ? [
                    ["Físico", ficha.atributos.fisico],
                    ["Mente", ficha.atributos.mente],
                    ["Presença", ficha.atributos.presenca],
                  ] as const
                : [
                    ["AGI", ficha.agi],
                    ["FOR", ficha.for],
                    ["INT", ficha.int],
                    ["PRE", ficha.pre],
                    ["VIG", ficha.vig],
                  ] as const
            ).map(([nome, numero]) => (
              <div key={nome}>
                <span>{nome}</span>
                <strong>{mostrar(numero)}</strong>
              </div>
            ))}
          </div>

          <ListaHabilidades
  titulo="Ações"
  habilidades={ficha.acoes}
  combateId={combateId}
  participanteId={participanteId}
  nome={ficha.nome}
  elemento={ficha.elemento ?? ""}
/>

<ListaHabilidades
  titulo="Poderes"
  habilidades={ficha.poderes}
  combateId={combateId}
  participanteId={participanteId}
  nome={ficha.nome}
  elemento={ficha.elemento ?? ""}
/>

        </>
      )}
    </details>
  );
}