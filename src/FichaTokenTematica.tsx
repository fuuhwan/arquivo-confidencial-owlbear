import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { get, onValue, ref } from "firebase/database";
import { database } from "./lib/firebase";
import { editarRecurso } from "./lib/editar-recurso";
import MunicoesCombate from "./MunicoesCombate";
import RecursoFicha from "./RecursoFicha";
import AbasFicha from "./AbasFicha";
import useRolagemFicha from "./useRolagemFicha";
import { teste } from "./lib/rolagens-ficha";
import type { ConteudoFicha } from "./lib/modelos-ficha";
import type { CampoRecurso } from "./lib/editar-recurso";
import SimboloAfinidade from "./components/ficha-tematica/SimboloAfinidade";
import AnelAtributoConhecimento from "./components/ficha-tematica/AnelAtributoConhecimento";
import { AnelEnergia, SimboloCentralEnergia } from "./components/ficha-tematica/DecoracaoEnergia";
import { AnelMorte, SimboloCentralMorte } from "./components/ficha-tematica/DecoracaoMorte";
import ConsumirAcao from "./ConsumirAcao";
import { createPortal } from "react-dom";
import NotificacaoRolagem from "./NotificacaoRolagem";
import ControleAcoes from "./ControleAcoes";
import { solicitarIniciativa } from "./lib/solicitar-iniciativa";
import D20Icon from "./components/ficha-tematica/D20Icon";
import {
  dadosPericiaCriatura,
} from "./lib/pericias-criatura";
import { transformarNpc } from "./lib/transformar-npc";
import PainelOrdem2 from "./PainelOrdem2";
import { pedirOperacaoFicha } from "./lib/pedido-ficha";
import "./components/ficha-tematica/base-ficha.css";
import "./FichaTokenTematica.css";
import PainelCriaturaOrdem2 from "./PainelCriaturaOrdem2";


export type ParticipanteVisual = {
  id: string;
  tipo: "jogador" | "criatura";
  nome: string;
  iniciativa: number;
  acoes?: number;
  conteudoHash?: string;
  recursos?: {
    vida?: number;
    vidaMax?: number;
    determinacao?: number;
    determinacaoMax?: number;
    marcasVida?: boolean[];
  };
};
type Conteudo = ConteudoFicha;
type Props = {
  combateId: string;
  participante: ParticipanteVisual;
  ativo?: string | null;
  vez?: string;
};
type Aba = "atributos" | "combate" | "pericias" | "rituais" | "habilidades" | "efeitos";
const ABAS: [Aba, string][] = [
  ["atributos", "Atributos"], ["combate", "Combate"],
  ["pericias", "Perícias"], ["rituais", "Rituais"],
  ["habilidades", "Habilidades"], ["efeitos", "Efeitos"],
];
function numero(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : "—";
}
function tema(afinidade: string): CSSProperties {
  const elemento = afinidade.toUpperCase();
  const cores: Record<string, [string, string]> = {
    MORTE: ["#b7b7b7", "rgba(0,0,0,.85)"],
    SANGUE: ["#b72025", "rgba(30,3,3,.85)"],
    ENERGIA: ["#a43cff", "rgba(10,3,22,.85)"],
    CONHECIMENTO: ["#b58b14", "rgba(20,15,0,.85)"],
  };
  const cor = cores[elemento];
  if (!cor) return {};
  return {
    "--afinidade-cor": cor[0],
    backgroundImage: `linear-gradient(90deg, ${cor[1]}, rgba(0,0,0,.5)), url("${import.meta.env.BASE_URL}ameacas/${elemento}.PNG")`,
    backgroundSize: "cover", backgroundPosition: "right center",
  } as CSSProperties;
}
const cacheMidias = new Map<string,Promise<string>>();
async function resolverMidias(v:unknown, combateId:string, criaturaId?:string):Promise<unknown> {
  if(typeof v==='string'&&v.startsWith('midia:')) {
    const caminho=criaturaId?`combateCriaturaMidias/${combateId}/${criaturaId}/${v.slice(6)}`:`combateMidias/${combateId}/${v.slice(6)}`;
    let promessa=cacheMidias.get(caminho);
    if(!promessa) { promessa=get(ref(database,caminho)).then(s=>typeof s.val()==='string'?s.val():'').catch(()=>{cacheMidias.delete(caminho);return '';});cacheMidias.set(caminho,promessa); if(cacheMidias.size>150)cacheMidias.delete(cacheMidias.keys().next().value!); }
    return promessa;
  }
  if(Array.isArray(v))return Promise.all(v.map(x=>resolverMidias(x,combateId,criaturaId)));
  if(v&&typeof v==='object')return Object.fromEntries(await Promise.all(Object.entries(v).map(async([k,x])=>[k,await resolverMidias(x,combateId,criaturaId)])));
  return v;
}
export default function FichaTokenTematica({ combateId, participante: p, ativo, vez }: Props) {
  const [rolandoIniciativa, setRolandoIniciativa] = useState(false);
const [erroIniciativa, setErroIniciativa] = useState("");
const travaIniciativa = useRef(false);
  const [conteudo, setConteudo] = useState<Conteudo | null>(null);
  const [foto, setFoto] = useState("");
  const [erroLeitura, setErroLeitura] = useState("");
  const [erroEdicao, setErroEdicao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>(() => { const salvo=sessionStorage.getItem(`aba-ficha-${combateId}-${p.id}`); return ABAS.some(([a])=>a===salvo)?salvo as Aba:"atributos"; });
  const [salvando, setSalvando] = useState(false);
  const trava = useRef(false);
const [trocandoModelo, setTrocandoModelo] = useState(false);
const [erroModelo, setErroModelo] = useState("");
const travaModelo = useRef(false);
const chaveModeloCriatura =
  `modelo-criatura-${combateId}-${p.id}`;

const [
  modeloCriaturaEscolhido,
  setModeloCriaturaEscolhido,
] = useState<"normal" | "ordem2" | null>(() => {
  const salvo = sessionStorage.getItem(
    chaveModeloCriatura,
  );

  return salvo === "normal" || salvo === "ordem2"
    ? salvo
    : null;
});

  useEffect(() => {
    let encerrado = false;
    let versao = 0;
    setConteudo(null); setFoto(""); setErroLeitura(""); setCarregando(true);
    if (p.tipo === "jogador" && !p.conteudoHash) {
      setErroLeitura("O conteúdo desta ficha ainda não foi publicado.");
      setCarregando(false);
      return;
    }
    const caminho = p.tipo === "criatura"
      ? `combateCriaturas/${combateId}/${p.id}/json`
      : `combateConteudos/${combateId}/${p.conteudoHash}/json`;
    const desligar = onValue(ref(database, caminho), snapshot => {
      const consulta = ++versao;
      void (async () => {
        try {
          const json: unknown = snapshot.val();
          if (typeof json !== "string") throw new Error("Ficha ainda não disponível.");
          const dados = await resolverMidias(JSON.parse(json), combateId, p.tipo === "criatura" ? p.id : undefined) as Conteudo;
          if (!dados || typeof dados !== "object" || typeof dados.nome !== "string") throw new Error("Formato de ficha inválido.");
          if (encerrado || consulta !== versao) return;
          setConteudo(dados); setErroLeitura(""); setCarregando(false);
          let imagem = typeof dados.foto === "string" ? dados.foto : "";
          if (imagem.startsWith("midia:")) {
            const hash = imagem.slice(6);
            const midia = p.tipo === "criatura"
              ? `combateCriaturaMidias/${combateId}/${p.id}/${hash}`
              : `combateMidias/${combateId}/${hash}`;
            const valor = (await get(ref(database, midia))).val();
            imagem = typeof valor === "string" ? valor : "";
          }
          if (!encerrado && consulta === versao) setFoto(imagem);
        } catch (falha) {
          if (encerrado || consulta !== versao) return;
          setErroLeitura(falha instanceof Error ? falha.message : "Falha ao ler a ficha.");
          setCarregando(false);
        }
      })();
    }, falha => {
      if (!encerrado) { setErroLeitura(falha.message); setCarregando(false); }
    });
    return () => { encerrado = true; versao++; desligar(); };
  }, [combateId, p.id, p.tipo, p.conteudoHash]);

  async function alterar(campo: CampoRecurso, valor:number, modo:'somar'|'definir') {
    if (trava.current) return;
    trava.current = true; setSalvando(true); setErroEdicao("");
    try {
      if(p.tipo==='criatura') {
        if(campo!=='vida')throw new Error('Esta criatura não usa esse recurso.');
        const atual=conteudo?.vidaAtual;
        if(typeof atual!=='number')throw new Error('Aguarde a vida da criatura carregar.');
        const variacao=modo==='definir'?valor-atual:valor;
        if(variacao!==0)await editarRecurso(combateId,p.id,'vida',variacao,'somar');
      } else await editarRecurso(combateId,p.id,campo,valor,modo);
    } catch(falha) { setErroEdicao(falha instanceof Error?falha.message:'Falha ao editar recurso.'); }
    finally { trava.current=false;setSalvando(false); }
  }
  const f = conteudo;
  const afinidade = (f?.afinidade || f?.elemento || "nenhuma").trim().toLowerCase();
  async function alternarFormaNpc() {
  const forma = conteudo?.transformacaoNpc;

  if (
    !forma ||
    trava.current ||
    salvando ||
    rolandoIniciativa
  ) {
    return;
  }

  trava.current = true;
  setSalvando(true);
  setErroEdicao("");

  try {
    await transformarNpc(
      combateId,
      p.id,
      forma.ativa === "original" ? "transformada" : "original",
    );
  } catch (falha) {
    setErroEdicao(
      falha instanceof Error
        ? falha.message
        : "Não foi possível transformar o NPC.",
    );
  } finally {
    trava.current = false;
    setSalvando(false);
  }
}
  const rolagem = useRolagemFicha({combateId,participanteId:p.id,tipo:p.tipo,nome:p.nome,afinidade});
  async function rolarIniciativa() {
  if (
    travaIniciativa.current ||
    rolagem.enviando ||
    salvando
  ) {
    return;
  }

  if (!vez || !f) {
    setErroIniciativa("Aguarde a ficha carregar.");
    return;
  }

  const reacao = [
  ...(f.pericias ?? []),
  ...(f.periciasAdicionais ?? []),
].find(
    (pericia) =>
      pericia.nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase() === "reacao",
  );

  if (!reacao) {
    setErroIniciativa(
      "A perícia Reação não foi encontrada na ficha publicada.",
    );
    return;
  }

  travaIniciativa.current = true;
  setRolandoIniciativa(true);
  setErroIniciativa("");

  try {
    const quantidadeDados =
  p.tipo === "criatura"
    ? dadosPericiaCriatura(f, reacao)
    : reacao.dados;

const texto = teste(
  "Iniciativa — Reação",
  quantidadeDados,
  reacao.bonus,
);

    const resultado = texto.match(/=\s*(-?\d+)\s*$/);

    if (!resultado) {
      throw new Error("Não foi possível interpretar a iniciativa.");
    }

    await solicitarIniciativa(
      combateId,
      p.id,
      vez,
      Number(resultado[1]),
    );

    // Mostra a notificação e registra sem consumir ação.
    await rolagem.executar(() => texto);
  } catch (falha) {
    setErroIniciativa(
      falha instanceof Error
        ? falha.message
        : "Não foi possível rolar a iniciativa.",
    );
  } finally {
    travaIniciativa.current = false;
    setRolandoIniciativa(false);
  }
}
  const vida = p.tipo === "criatura" ? f?.vidaAtual : p.recursos?.vida;
  const vidaMax = p.tipo === "criatura" ? f?.vidaMaxima : p.recursos?.vidaMax;
  const pd = p.recursos?.determinacao;
  const pdMax = p.recursos?.determinacaoMax;
  const temPd = p.tipo === "jogador" && typeof pd === "number" && typeof pdMax === "number";
async function trocarModelo(sistema: "normal" | "ordem2") {
  if (
    travaModelo.current ||
    salvando ||
    rolagem.enviando ||
    rolandoIniciativa
  ) {
    return;
  }

  travaModelo.current = true;
  setTrocandoModelo(true);
  setErroModelo("");

  try {
    await pedirOperacaoFicha(
      combateId,
      p.id,
      "modeloFicha",
      sistema,
    );
  } catch (falha) {
    setErroModelo(
      falha instanceof Error
        ? falha.message
        : "Não foi possível trocar o modelo.",
    );
  } finally {
    travaModelo.current = false;
    setTrocandoModelo(false);
  }
}

const seletorModeloJogador = p.tipo === "jogador" && (
  <div style={{ marginBottom: 16 }}>
    <label>
      Modelo da ficha{" "}

      <select
        value={f?.sistemaCombate ?? "normal"}
        disabled={
          carregando ||
          !f ||
          trocandoModelo ||
          salvando ||
          rolagem.enviando ||
          rolandoIniciativa
        }
        onChange={(evento) =>
          void trocarModelo(
            evento.target.value as "normal" | "ordem2",
          )
        }
      >
        <option value="normal">Ficha normal</option>

        <option
          value="ordem2"
          disabled={!f?.possuiOrdem2 && !f?.ordem2Combate}
        >
          Ordem 2
        </option>
      </select>
    </label>

    {trocandoModelo && (
      <p role="status">Aguardando troca da ficha…</p>
    )}

    {erroModelo && <p role="alert">{erroModelo}</p>}
  </div>
);
const modeloCriatura =
  modeloCriaturaEscolhido ??
  f?.sistemaFicha ??
  "normal";

const seletorModelo =
  p.tipo === "jogador" ? (
    seletorModeloJogador
  ) : (
    <div style={{ marginBottom: 16 }}>
      <label>
        Modelo da criatura{" "}

        <select
          value={modeloCriatura}
          disabled={
            carregando ||
            !f ||
            salvando ||
            rolagem.enviando ||
            rolandoIniciativa
          }
          onChange={(evento) => {
            const modelo = evento.target.value;

            if (
              modelo !== "normal" &&
              modelo !== "ordem2"
            ) {
              return;
            }

            setModeloCriaturaEscolhido(modelo);

            sessionStorage.setItem(
              chaveModeloCriatura,
              modelo,
            );
          }}
        >
          <option value="normal">Ficha normal</option>

          <option
            value="ordem2"
            disabled={!f?.ordem2}
          >
            Ordem 2
          </option>
        </select>
      </label>

      {f && !f.ordem2 && (
        <p>
          Abra esta criatura no site e selecione
          Ordem 2 para salvar essa versão.
        </p>
      )}
    </div>
  );
  if (
  p.tipo === "criatura" &&
  f &&
  modeloCriatura === "ordem2"
) {
  return (
    <article
      className="pl-root frc-ficha ow-ficha"
      data-afinidade={afinidade}
      style={tema(afinidade)}
      data-operacao-pendente={
        salvando || rolagem.enviando
      }
    >
      {seletorModelo}

      <header className="frc-identidade">
        {foto && (
          <img
            src={foto}
            alt={p.nome}
            onError={() => setFoto("")}
          />
        )}

        <div>
          <h2>{p.nome}</h2>
          <p>Criatura / NPC · Ordem 2</p>

          <small>
            {afinidade === "nenhuma"
              ? "Sem afinidade"
              : afinidade.toUpperCase()}
          </small>
        </div>
      </header>

      <div className="ow-turno">
        <span>
          Iniciativa <b>{p.iniciativa}</b>
        </span>

        <ControleAcoes
          key={`${combateId}/${p.id}`}
          combateId={combateId}
          participanteId={p.id}
          vez={vez}
          acoes={p.acoes ?? 2}
        />

        {p.id === ativo && <strong>NA VEZ</strong>}
      </div>

      {typeof vida === "number" &&
        typeof vidaMax === "number" && (
          <RecursoFicha
            campo="vida"
            atual={vida}
            maximo={vidaMax}
            permiteTemporario={false}
            salvando={salvando}
            editar={alterar}
          />
        )}

      {salvando && (
        <p role="status">
          Aguardando confirmação do mestre…
        </p>
      )}

      {erroEdicao && (
        <p className="ow-erro" role="alert">
          {erroEdicao}
        </p>
      )}

      {erroLeitura && (
        <p className="ow-erro" role="alert">
          {erroLeitura}
        </p>
      )}

      {f.ordem2 ? (
        <PainelCriaturaOrdem2
          estado={f.ordem2}
          executar={rolagem.executar}
          enviando={rolagem.enviando || salvando}
          acoes={p.acoes ?? 2}
        />
      ) : (
        <p role="alert">
          Esta criatura ainda não possui uma versão
          Ordem 2 publicada. Selecione Ficha normal
          ou salve a versão Ordem 2 no site.
        </p>
      )}

      {rolagem.resultado &&
        createPortal(
          <div
            className="pl-root notificacao-compartilhada"
            data-afinidade={afinidade}
          >
            <NotificacaoRolagem
              texto={rolagem.resultado}
              personagem={p.nome}
              afinidade={afinidade}
              fechar={rolagem.limpar}
            />
          </div>,
          document.body,
        )}

      {rolagem.erro && (
        <p className="ow-erro" role="alert">
          {rolagem.erro}
        </p>
      )}
    </article>
  );
}

if (
  p.tipo === "jogador" &&
  f?.sistemaCombate === "ordem2"
) {
  return (
    <article
  className="pl-root frc-ficha ow-ficha ow-ordem2-resumo"
  data-afinidade={(
    f.ordem2Combate?.afinidade ?? afinidade
  ).trim().toLowerCase()}
  style={tema(f.ordem2Combate?.afinidade ?? afinidade)}
>
      {seletorModelo}

      {carregando ? (
        <p>Carregando ficha…</p>
      ) : (
        <PainelOrdem2
          key={`${combateId}/${p.id}/ordem2`}
          combateId={combateId}
          participanteId={p.id}
          nome={p.nome}
          ficha={f}
          vida={p.recursos?.vida ?? 0}
          vidaMax={p.recursos?.vidaMax ?? 0}
          determinacao={p.recursos?.determinacao ?? 0}
          determinacaoMax={p.recursos?.determinacaoMax ?? 0}
          acoes={p.acoes ?? 2}
        />
      )}
    </article>
  );
}
  return <article className="pl-root frc-ficha ow-ficha" data-operacao-pendente={
  salvando || rolagem.enviando || rolandoIniciativa
} data-afinidade={afinidade} style={tema(afinidade)}>
  {seletorModelo}
    <header className="frc-identidade">
      {foto && <img src={foto} alt={p.nome} onError={() => setFoto("")} />}
      <div><h2>{p.nome}</h2><p>{p.tipo === "criatura" ? "Criatura / NPC" : `${f?.classe || "Personagem"} · Nível ${numero(f?.nivel)} · NEX ${numero(f?.nex)}%`}</p>
      <small>{afinidade === "nenhuma" ? "Sem afinidade" : afinidade.toUpperCase()}</small></div>
    </header>
    {f?.transformacaoNpc && (
  <div style={{ marginBottom: 12 }}>
    <button
      type="button"
      disabled={
        salvando ||
        rolagem.enviando ||
        rolandoIniciativa
      }
      onClick={() => void alternarFormaNpc()}
    >
      {salvando
        ? "Aguardando confirmação…"
        : f.transformacaoNpc.ativa === "transformada"
          ? "Voltar à forma original"
          : "Transformar ficha"}
    </button>

    <p>
      Forma:{" "}
      {f.transformacaoNpc.ativa === "transformada"
        ? "Transformada"
        : "Original"}
    </p>
  </div>
)}
    <div className="ow-turno">
 <div className="ow-controle-iniciativa">
  <span>
    Iniciativa <b>{p.iniciativa}</b>
  </span>

    <button
      type="button"
      title="Rolar iniciativa com Reação"
      aria-label={`Rolar iniciativa de ${p.nome}`}
      disabled={
        carregando ||
        !f ||
        !vez ||
        rolandoIniciativa ||
        rolagem.enviando ||
        salvando
      }
      onClick={() => void rolarIniciativa()}
    >
      <D20Icon tamanho={20} />
      {rolandoIniciativa ? "Aguardando…" : "Rolar"}
    </button>


  {erroIniciativa && (
    <small role="alert">{erroIniciativa}</small>
  )}
</div>

  <ControleAcoes
  key={`${combateId}/${p.id}`}
  combateId={combateId}
  participanteId={p.id}
  vez={vez}
  acoes={p.acoes ?? 2}
/>

  {p.id === ativo && <strong>NA VEZ</strong>}
</div>
    {carregando && <p role="status">Carregando ficha…</p>}
    {erroLeitura && <p className="ow-erro" role="alert">{erroLeitura}</p>}
    {typeof vida === "number" && typeof vidaMax === "number" && <RecursoFicha campo="vida" atual={vida} maximo={vidaMax} permiteTemporario={p.tipo==='jogador'} temporarioTotal={f?.vidaTemporariaTotal} temporarioAtual={f?.vidaTemporariaAtual} salvando={salvando} editar={alterar}/>}
    {temPd && <RecursoFicha campo="determinacao" atual={pd} maximo={pdMax} permiteTemporario temporarioTotal={f?.determinacaoTemporariaTotal} temporarioAtual={f?.determinacaoTemporariaAtual} salvando={salvando} editar={alterar}/>}
    {salvando && <p role="status">Aguardando confirmação do mestre…</p>}
    {erroEdicao && <p className="ow-erro" role="alert">{erroEdicao}</p>}
    <nav className="frc-abas" aria-label="Abas da ficha">{ABAS.filter(([chave]) => p.tipo === "jogador" || ["atributos", "combate", "pericias", "habilidades"].includes(chave)).map(([chave, nome]) => <button key={chave} aria-pressed={aba === chave} onClick={() => { setAba(chave); sessionStorage.setItem(`aba-ficha-${combateId}-${p.id}`,chave); }}>{nome}</button>)}</nav>
    {f && <section className="pl-painel ow-conteudo">
      {aba === "atributos" && <>
        {f.atributos ? <div className="pl-atributos pl-atributos-pdf" aria-label="Atributos">
          <img className="pl-simbolo-sem-afinidade" src={`${import.meta.env.BASE_URL}temas/ordo-realitas.png`} alt="" />
          <span className="sangue-simbolo-fundo" aria-hidden="true" style={{maskImage:`url("${import.meta.env.BASE_URL}temas/diabo-simbolo.png")`, WebkitMaskImage:`url("${import.meta.env.BASE_URL}temas/diabo-simbolo.png")`}} />
          <svg className="pl-atributos-conexoes" viewBox="0 0 400 310" fill="none" aria-hidden="true"><path d="M72 112 328 112 200 252Z"/><circle cx="200" cy="149" r="65"/></svg>
          <SimboloAfinidade afinidade={afinidade} className="afinidade-simbolo-central"/><SimboloCentralMorte/><SimboloCentralEnergia/>
          <img className="conhecimento-simbolo-central" src={`${import.meta.env.BASE_URL}temas/conhecimento-simbolo.webp`} alt=""/>
          {([ ["fisico", "Físico"], ["mente", "Mente"], ["presenca", "Presença"] ] as const).map(([chave, nome]) => <div key={chave} className={`pl-atributo pl-atributo-${chave}`}><AnelAtributoConhecimento nome={nome}/><AnelMorte/><AnelEnergia/><button className="pl-atributo-rolagem" disabled={rolagem.enviando} title={`Rolar ${nome}`} onClick={()=>void rolagem.executar(()=>teste(nome,f.atributos![chave]))}><span>{nome}</span><strong>{f.atributos![chave]}</strong></button></div>)}
        </div> : <div className="ow-atributos-simples">{([ ["AGI", f.agi], ["FOR", f.for], ["INT", f.int], ["PRE", f.pre], ["VIG", f.vig] ] as const).map(([nome,n]) => <button key={nome} disabled={rolagem.enviando||typeof n!=="number"} onClick={()=>void rolagem.executar(()=>teste(nome,n!))}><small>{nome}</small><strong>{numero(n)}</strong></button>)}</div>}
        <div className="frc-defesas">{[["Defesa",f.defesa],["Bloqueio",f.bloqueio],["Esquiva",f.esquiva],["Deslocamento",typeof f.deslocamento === "number" ? `${f.deslocamento} m` : f.deslocamento]].filter(([,v])=>v!==undefined).map(([nome,v])=><div key={String(nome)}><strong>{v}</strong>{nome}</div>)}</div>
      </>}
      {aba === "combate" && <ConsumirAcao key={`${p.id}/${vez}/${p.acoes}`} combateId={combateId} participanteId={p.id} vez={vez} acoes={p.acoes ?? 2}/>}
      {aba === "combate" && p.tipo === "jogador" && (
  <MunicoesCombate
    key={`${combateId}/${p.id}/municoes`}
    combateId={combateId}
    participanteId={p.id}
    municoes={f.municoes ?? []}
  />
)}
      {aba !== "atributos" && aba !== "efeitos" && <AbasFicha key={`${p.id}-${aba}`} aba={aba} ficha={f} tipo={p.tipo} acoes={p.acoes??2} executar={rolagem.executar} enviando={rolagem.enviando}/>}
      {aba === "combate" && p.tipo === "jogador" && (
  <section style={{ marginTop: 20 }}>
    <h2>RITUAIS FAVORITOS</h2>

    {(f.rituais ?? []).some(
      (ritual) => ritual.favorito === true,
    ) ? (
      <AbasFicha
        key={`${p.id}-rituais-combate`}
        aba="rituais"
        ficha={f}
        tipo={p.tipo}
        acoes={p.acoes ?? 2}
        executar={rolagem.executar}
        enviando={rolagem.enviando}
        somenteFavoritos
      />
    ) : (
      <p>Nenhum ritual favorito publicado.</p>
    )}
  </section>
)}
      {(aba === "efeitos" || aba === "combate") &&  <>{(f.efeitosAtivos??[]).map((e,i)=><details key={e.id||i}><summary>{e.nome||"Efeito"}</summary><p>{e.descricao}</p></details>)}{!(f.efeitosAtivos??[]).length&&<p>Nenhum efeito publicado.</p>}</>}
    </section>}
    {rolagem.resultado &&
  createPortal(
    <div
      className="pl-root notificacao-compartilhada"
      data-afinidade={afinidade}
    >
      <NotificacaoRolagem
        texto={rolagem.resultado}
        personagem={p.nome}
        afinidade={afinidade}
        fechar={rolagem.limpar}
      />
    </div>,
    document.body,
  )}
    {rolagem.erro&&<p className="ow-erro" role="alert">{rolagem.erro}</p>}
  </article>;
}
