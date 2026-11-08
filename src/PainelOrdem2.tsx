import { useRef, useState } from "react";
import type { ConteudoFicha } from "./lib/modelos-ficha";
import { pedirOperacaoFicha } from "./lib/pedido-ficha";
import {
  expressao,
  registrarResultado,
} from "./lib/rolagens-ficha";
import RecursoFicha from "./RecursoResumoOrdem2";
import { editarRecurso } from "./lib/editar-recurso";
import type { CampoRecurso } from "./lib/editar-recurso";
import AbasFicha from "./AbasFicha";
import useRolagemFicha from "./useRolagemFicha";
import D20Icon from "./components/ficha-tematica/D20Icon";
import { Etiquetas } from "./AbasFicha";



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
  const [busca, setBusca] = useState("");
const [expressaoLivre, setExpressaoLivre] = useState("");

function filtrar(nome: string) {
  return nome
    .toLocaleLowerCase("pt-BR")
    .includes(busca.toLocaleLowerCase("pt-BR"));
}
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
      <header className="frc-identidade">
  {ficha.foto && (
    <img src={ficha.foto} alt={nome} />
  )}

  <div>
    <h2>{nome}</h2>

    <p>
      {o2.classe || ficha.classe || "Personagem"}
      {" · "}Nível {o2.nivel ?? ficha.nivel ?? 1}
      {" · "}NEX {o2.nex ?? ficha.nex ?? 0}%
    </p>
  </div>
</header>

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

     

      <nav className="frc-abas">
  {[
    ["atributos", "Atributos"],
    ["combate", "Combate"],
    ["habilidades", "Habilidades"],
    ["efeitos", "Efeitos"],
    ["rituais", "Rituais"],
    ["pericias", "Perícias"],
    ["itens", "Itens"],
  ].map(([id, titulo]) => (
    <button
      key={id}
      type="button"
      aria-pressed={aba === id}
      onClick={() => {
        setAba(id);
        setBusca("");
      }}
    >
      {titulo}
    </button>
  ))}
</nav>

      {erro && <p role="alert">{erro}</p>}
      {ocupado && <p role="status">Aguardando confirmação…</p>}

      <section className="pl-painel">
        <input
  className="pl-busca"
  type="search"
  placeholder="Pesquisar…"
  aria-label="Pesquisar na ficha"
  value={busca}
  onChange={(evento) => setBusca(evento.target.value)}
/>
        {aba === "atributos" && (
  <>
    <label className="ow-o2-pavor">
      <span className="ow-o2-pavor-dado">D6</span>
      <span>Dado de Pavor</span>

      <input
        type="checkbox"
        checked={pavor}
        disabled={ocupado}
        onChange={(evento) =>
          setPavor(evento.target.checked)
        }
      />
    </label>

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

    <div className="frc-defesas">
      <div>
        <strong>{ficha.defesa ?? "—"}</strong>
        Defesa
      </div>

      <div>
        <strong>{o2.pontosArmadura ?? 0}</strong>
        Pontos de armadura
      </div>

      <div>
        <strong>{ficha.deslocamento ?? "—"}</strong>
        Deslocamento
      </div>
    </div>
  </>
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

        {aba === "combate" && (
  <>
    <form
      className="pl-rolagem-livre"
      onSubmit={(evento) => {
        evento.preventDefault();

        void operar(async () => {
          await rolagensLivres.executar(() => {
            const resultado = expressao(expressaoLivre);

            return (
              `Dados livres: = ${resultado.total}\n` +
              resultado.detalhes
            );
          });
        });
      }}
    >
      <input
        aria-label="Expressão de dados"
        placeholder="Rolar dados — 2d6+3"
        value={expressaoLivre}
        onChange={(evento) =>
          setExpressaoLivre(evento.target.value)
        }
      />

      <button
        type="submit"
        disabled={
          ocupado ||
          rolagensLivres.enviando ||
          !expressaoLivre.trim()
        }
      >
        <D20Icon tamanho={18} /> Rolar
      </button>
    </form>

    {(o2.combateOrdem2 ?? [])
      .filter((ataque) => filtrar(ataque.nome))
      .map((ataque) => {
        const item = ataque.id.startsWith("arma:")
          ? o2.equipamento?.find(
              (registro) =>
                registro.id === ataque.id.slice(5),
            )
          : undefined;

        const elementos = [
          ataque.tipo,
          ...ataque.danosAdicionais.map(
            (extra) => extra.tipo,
          ),
        ].join(" ");

        return (
          <details
            key={ataque.id}
            className="pl-registro-salvo"
          >
            <summary className="pl-ataque-topo">
              <span
                className="pl-ataque-chevron"
                aria-hidden="true"
              >
                ⌄
              </span>

              {item?.imagens?.[0] && (
                <img
                  className="pl-ataque-foto"
                  src={item.imagens[0]}
                  alt=""
                />
              )}

              <span className="pl-ataque-titulo">
                <strong>
                  {ataque.nome}
                  {" "}
                  <Etiquetas texto={elementos} />
                </strong>

                <small>
                  Dano: {ataque.dano}
                  {ataque.rolagemDano
                    ? ` + ${ataque.rolagemDano}`
                    : ""}
                  {" · "}Crítico Ordem 2
                </small>
              </span>

              <button
                type="button"
                className="pl-ataque-dado"
                title="Rolar teste e dano · 1 ação"
                aria-label={`Rolar ${ataque.nome}`}
                disabled={ocupado || acoes <= 0}
                onClick={(evento) => {
                  evento.preventDefault();
                  evento.stopPropagation();

                  rolar("ataque", ataque.id);
                }}
                onKeyDown={(evento) =>
                  evento.stopPropagation()
                }
              >
                <D20Icon tamanho={28} />
              </button>
            </summary>

            <div className="pl-ataque-informacoes">
              <p>
                Dano: {ataque.dano}
                {ataque.rolagemDano
                  ? ` + ${ataque.rolagemDano}`
                  : ""}
                {" · "}{ataque.tipo}
              </p>

              {ataque.danosAdicionais.map(
                (extra, indice) => (
                  <p key={indice}>
                    Adicional: {extra.dano}
                    {" · "}{extra.tipo}
                  </p>
                ),
              )}
            </div>
          </details>
        );
      })}

    <h3 className="ow-o2-subtitulo">MUNIÇÕES</h3>

    {(o2.equipamento ?? []).some((item) =>
      /munic/.test(
        (item.detalhes.tipo ?? "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
      ),
    ) ? (
      (o2.equipamento ?? [])
        .filter((item) =>
          /munic/.test(
            (item.detalhes.tipo ?? "")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase(),
          ),
        )
        .map((item) => (
          <article
            key={item.id}
            className="pl-registro-salvo"
          >
            <strong>
              {item.nome} ×{item.quantidade ?? 1}
            </strong>
          </article>
        ))
    ) : (
      <p>Nenhuma munição adicionada.</p>
    )}

    <h3 className="ow-o2-subtitulo">
      RITUAIS FAVORITOS
    </h3>

    {fichaRituais.rituais?.some(
      (ritual) => ritual.favorito,
    ) ? (
      <AbasFicha
        aba="rituais"
        ficha={fichaRituais}
        tipo="jogador"
        acoes={acoes}
        executar={rolagensLivres.executar}
        enviando={ocupado || rolagensLivres.enviando}
        somenteFavoritos
      />
    ) : (
      <p>Nenhum ritual favorito publicado.</p>
    )}
  </>
)}

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
          {aba === "efeitos" && (
  <>
    {(o2.efeitosAtivos ?? [])
      .filter((efeito) => filtrar(efeito.nome ?? ""))
      .map((efeito, indice) => (
        <details
          key={efeito.id ?? indice}
          className="pl-registro-salvo"
        >
          <summary>{efeito.nome || "Efeito"}</summary>

          <p style={{ whiteSpace: "pre-wrap" }}>
            {efeito.descricao}
          </p>
        </details>
      ))}

    {!o2.efeitosAtivos?.length && (
      <p>Nenhum efeito ativo.</p>
    )}
  </>
)}

{aba === "itens" && (
  <>
    {(o2.equipamento ?? [])
      .filter((item) => filtrar(item.nome))
      .map((item) => (
        <details
          key={item.id}
          className="pl-registro-salvo"
        >
          <summary>
            {item.nome} ×{item.quantidade ?? 1}
          </summary>

          {item.imagens?.[0] && (
            <img
              src={item.imagens[0]}
              alt={item.nome}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: 240,
                objectFit: "contain",
                marginBlock: 12,
              }}
            />
          )}

          <p style={{ whiteSpace: "pre-wrap" }}>
            {item.descricao}
          </p>
        </details>
      ))}
  </>
)}
        </section>
      )}
    </div>
  );
}