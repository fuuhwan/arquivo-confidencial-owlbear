import { useRef, useState } from "react";
import type { ConteudoFicha } from "./lib/modelos-ficha";
import { pedirOperacaoFicha } from "./lib/pedido-ficha";
import { registrarResultado } from "./lib/rolagens-ficha";
import RecursoFicha from "./RecursoFicha";
import { editarRecurso } from "./lib/editar-recurso";
import type { CampoRecurso } from "./lib/editar-recurso";
import AbasFicha from "./AbasFicha";
import useRolagemFicha from "./useRolagemFicha";

type Props = {
  combateId: string;
  participanteId: string;
  nome: string;
  ficha: ConteudoFicha;
  vida: number;
  vidaMax: number;
  determinacao: number;
  determinacaoMax: number;
  acoes: number;
};

type Resultado = {
  nome: string;
  total: number;
  ra: number;
  rb: number;
  calculo: string;

  pavor?: {
    valor: number;
  };

  combate?: {
    critico: boolean;
    falhaCritica: boolean;
    dano: number;
    tipo: string;
    calculoDano: string;
    danoTotal: number;
    adicionais: {
      tipo: string;
      valor: number;
      calculo: string;
    }[];
  };
};

const ATRIBUTOS = [
  ["fisico", "Físico"],
  ["mente", "Mente"],
  ["presenca", "Emoção"],
] as const;

export default function PainelOrdem2({
  combateId,
  participanteId,
  nome,
  ficha,
  vida,
  vidaMax,
  determinacao,
  determinacaoMax,
  acoes,
}: Props) {
  const [aba, setAba] = useState("atributos");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [pavor, setPavor] = useState(false);
  const [resultado, setResultado] =
    useState<Resultado | null>(null);

  const trava = useRef(false);
  const o2 = ficha.ordem2Combate;

  const afinidade = (
    o2?.afinidade ||
    ficha.afinidade ||
    "nenhuma"
  ).toLowerCase();

  const rolagensLivres = useRolagemFicha({
    combateId,
    participanteId,
    tipo: "jogador",
    nome,
    afinidade,
  });

  async function operar(executar: () => Promise<void>) {
    if (trava.current) return;

    trava.current = true;
    setOcupado(true);
    setErro("");

    try {
      await executar();
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível concluir.",
      );
    } finally {
      trava.current = false;
      setOcupado(false);
    }
  }

  async function alterar(
    campo: CampoRecurso,
    valor: number,
    modo: "somar" | "definir",
  ) {
    await operar(() =>
      editarRecurso(
        combateId,
        participanteId,
        campo,
        valor,
        modo,
        "ordem2",
      ),
    );
  }

  function rolar(
    tipo: "atributo" | "pericia" | "ataque",
    chave: string,
  ) {
    void operar(async () => {
      if (tipo === "ataque" && acoes <= 0) {
        throw new Error("Sem ações disponíveis.");
      }

      const resposta = await pedirOperacaoFicha(
        combateId,
        participanteId,
        "testeOrdem2",
        JSON.stringify({ tipo, chave, pavor }),
      );

      const novo = JSON.parse(resposta) as Resultado;

      if (
        !novo ||
        typeof novo.nome !== "string" ||
        !Number.isFinite(novo.total)
      ) {
        throw new Error("Resposta de rolagem inválida.");
      }

      if (novo.pavor?.valor === 1) {
        setPavor(false);
      }

      setResultado(novo);

      const linhas = [
        `${novo.nome}: = ${novo.total}`,
        novo.calculo,
        `Total do teste: ${novo.total}`,
        `RA: ${novo.ra}`,
        `RB: ${novo.rb}`,
      ];

      if (novo.combate) {
        const c = novo.combate;

        linhas.push(
          c.critico
            ? "SUCESSO CRÍTICO"
            : c.falhaCritica
              ? "FALHA CRÍTICA"
              : "",
          `Dano: ${c.dano} ${c.tipo}`,
          c.calculoDano,
          ...c.adicionais.map(
            (item) =>
              `Adicional ${item.tipo}: ${item.valor}\n${item.calculo}`,
          ),
          `Dano total: ${c.danoTotal}`,
        );
      }

      try {
        await registrarResultado(
          {
            combateId,
            participanteId,
            tipo: "jogador",
            nome,
            afinidade,
            sistema: "ordem2",
          },
          linhas.join("\n"),
          tipo === "ataque",
        );
      } catch (falha) {
        throw new Error(
          "Rolagem realizada. Confira o histórico antes de repetir. " +
            (falha instanceof Error ? falha.message : ""),
        );
      }
    });
  }

  if (!o2) {
    return <p>Aguarde a publicação da ficha Ordem 2.</p>;
  }

  const fichaRituais: ConteudoFicha = {
    nome,

    rituais: (o2.rituais ?? []).map((ritual) => ({
      nome: ritual.nome,
      favorito: ritual.detalhes.favoritoOrdem2 === "true",
      elemento: ritual.detalhes.elemento,
      circulo: ritual.detalhes.circulo,
      execucao: ritual.detalhes.execucao,
      alcance: ritual.detalhes.alcance,
      alvo: ritual.detalhes.alvo,
      area: ritual.detalhes.area,
      duracao: ritual.detalhes.duracao,
      resistencia: ritual.detalhes.resistencia,
      imagens: ritual.imagens,
      descricao: ritual.descricaoRitual || ritual.descricao,
      dados: ritual.dadosRituais,
    })),
  };

  return (
    <div>
      <h3>{nome} — Ordem 2</h3>

      <RecursoFicha
        campo="vida"
        atual={vida}
        maximo={vidaMax}
        permiteTemporario
        temporarioTotal={ficha.vidaTemporariaTotal}
        temporarioAtual={ficha.vidaTemporariaAtual}
        salvando={ocupado}
        editar={alterar}
      />

      <RecursoFicha
        campo="determinacao"
        atual={determinacao}
        maximo={determinacaoMax}
        permiteTemporario
        temporarioTotal={ficha.determinacaoTemporariaTotal}
        temporarioAtual={ficha.determinacaoTemporariaAtual}
        salvando={ocupado}
        editar={alterar}
      />

      <p>
        Defesa: {ficha.defesa ?? "—"} · PA:{" "}
        {o2.pontosArmadura ?? 0} · Deslocamento:{" "}
        {ficha.deslocamento ?? "—"}
      </p>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <input
          type="checkbox"
          checked={pavor}
          disabled={ocupado}
          onChange={(evento) => setPavor(evento.target.checked)}
        />
        D6 — Dado de Pavor
      </label>

      <nav className="frc-abas">
        {[
          ["atributos", "Atributos"],
          ["pericias", "Perícias"],
          ["combate", "Combate"],
          ["habilidades", "Habilidades"],
          ["rituais", "Rituais"],
        ].map(([id, titulo]) => (
          <button
            key={id}
            type="button"
            aria-pressed={aba === id}
            onClick={() => setAba(id)}
          >
            {titulo}
          </button>
        ))}
      </nav>

      {erro && <p role="alert">{erro}</p>}
      {ocupado && <p role="status">Aguardando confirmação…</p>}

      <section className="pl-painel">
        {aba === "atributos" && (
          <div className="ow-atributos-simples">
            {ATRIBUTOS.map(([chave, titulo]) => (
              <button
                key={chave}
                type="button"
                disabled={ocupado}
                onClick={() => rolar("atributo", chave)}
              >
                <small>{titulo}</small>
                <strong>D{o2.atributos[chave]}</strong>
              </button>
            ))}
          </div>
        )}

        {aba === "pericias" &&
          o2.pericias.map((pericia, indice) => (
            <article
              key={indice}
              className="pl-registro-salvo"
            >
              <strong>
                {pericia.nome}
                {pericia.especialidadeAptidao
                  ? ` — ${pericia.especialidadeAptidao}`
                  : ""}
              </strong>

              <p>
                Atributo: D{o2.atributos[pericia.atributo]} ·
                Treino: D{pericia.passo ?? pericia.treino}
                {pericia.dadosExtras
                  ? ` · Extras: ${pericia.dadosExtras}`
                  : ""}
              </p>

              <button
                type="button"
                disabled={ocupado}
                onClick={() => rolar("pericia", String(indice))}
              >
                Rolar
              </button>
            </article>
          ))}

        {aba === "combate" &&
          (o2.combateOrdem2 ?? []).map((ataque) => (
            <details
              key={ataque.id}
              className="pl-registro-salvo"
            >
              <summary>{ataque.nome}</summary>

              <p>
                Dano: {ataque.dano}
                {ataque.rolagemDano
                  ? ` + ${ataque.rolagemDano}`
                  : ""}
                {" · "}
                {ataque.tipo}
              </p>

              {ataque.danosAdicionais.map((extra, indice) => (
                <p key={indice}>
                  Adicional: {extra.dano} · {extra.tipo}
                </p>
              ))}

              <button
                type="button"
                disabled={ocupado || acoes <= 0}
                onClick={() => rolar("ataque", ataque.id)}
              >
                Rolar ataque · 1 ação
              </button>
            </details>
          ))}

        {aba === "habilidades" &&
          (o2.habilidades ?? []).map((habilidade) => (
            <details
              key={habilidade.id}
              className="pl-registro-salvo"
            >
              <summary>{habilidade.nome}</summary>
              <p style={{ whiteSpace: "pre-wrap" }}>
                {habilidade.descricao}
              </p>
            </details>
          ))}

        {aba === "rituais" && (
          <AbasFicha
            aba="rituais"
            ficha={fichaRituais}
            tipo="jogador"
            acoes={acoes}
            executar={rolagensLivres.executar}
            enviando={ocupado || rolagensLivres.enviando}
          />
        )}

        {rolagensLivres.erro && (
          <p role="alert">{rolagensLivres.erro}</p>
        )}

        {rolagensLivres.resultado && (
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {rolagensLivres.resultado}
          </pre>
        )}
      </section>

      {resultado && (
        <section
          role="status"
          className="pl-registro-salvo"
          style={{ marginTop: 16 }}
        >
          <button
            type="button"
            onClick={() => setResultado(null)}
            style={{ float: "right" }}
          >
            ×
          </button>

          <strong>{resultado.nome}</strong>

          <p>
            TESTE: <b>{resultado.total}</b>
            {" · "}RA: <b>{resultado.ra}</b>
            {" · "}RB: <b>{resultado.rb}</b>
          </p>

          {resultado.pavor && (
            <p>
              Dado de Pavor: <b>{resultado.pavor.valor}</b>
            </p>
          )}

          {resultado.combate && (
            <>
              <p>
                {resultado.combate.critico
                  ? "SUCESSO CRÍTICO"
                  : resultado.combate.falhaCritica
                    ? "FALHA CRÍTICA"
                    : ""}
              </p>

              <p>
                Dano total:{" "}
                <b>{resultado.combate.danoTotal}</b>
              </p>
            </>
          )}

          <details>
            <summary>Ver cálculo completo</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {resultado.calculo}
              {resultado.combate
                ? `\n${resultado.combate.calculoDano}\n` +
                  resultado.combate.adicionais
                    .map((item) => item.calculo)
                    .join("\n")
                : ""}
            </pre>
          </details>
        </section>
      )}
    </div>
  );
}