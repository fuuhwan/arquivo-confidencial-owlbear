import { Fragment, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import D20Icon from './components/ficha-tematica/D20Icon';
import type { ConteudoFicha, AtaqueVisual, HabilidadeVisual, PericiaVisual } from './lib/modelos-ficha';
import type { ExecutarRolagem } from './useRolagemFicha';
import { ataquePersonagem, expressao, teste } from './lib/rolagens-ficha';
import { rolarAtaqueCriatura } from './lib/dados-criatura';
import {
  dadosPericiaCriatura,
} from "./lib/pericias-criatura";
const elementos:Record<string,string>={sangue:'#a72329',morte:'#484848',energia:'#8238bc',conhecimento:'#b58b14',medo:'#dedede'};
const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function Etiquetas({texto}:{texto:string}) {
  return <>{Object.entries(elementos).filter(([e])=>new RegExp(`\\b${e}\\b`).test(normal(texto))).map(([e,c])=><b key={e} className="pl-etiqueta-elemento" style={{background:c,color:e==='medo'?'#191919':'white'}}>{e.toUpperCase()}</b>)}</>;
}
export function Imagens({imagens,nome}:{imagens?:string[];nome:string}) {
  const [aberta,setAberta]=useState('');
  return <>{Boolean(imagens?.length)&&<div className="ow-imagens">{imagens!.filter(i=>typeof i==='string'&&i&&!i.startsWith('midia:')).map((src,i)=><button key={i} onClick={()=>setAberta(src)} aria-label={`Ampliar imagem de ${nome}`}><img src={src} alt={nome} loading="lazy"/></button>)}</div>}{aberta&&<div className="ow-imagem-overlay" role="dialog" aria-modal="true" aria-label={nome} onClick={()=>setAberta('')}><button onClick={()=>setAberta('')} aria-label="Fechar imagem">×</button><img src={aberta} alt={nome}/></div>}</>;
}
type Props={aba:string;ficha:ConteudoFicha;tipo:'jogador'|'criatura';acoes:number;executar:ExecutarRolagem;enviando:boolean};
export default function AbasFicha({aba,ficha:f,tipo,acoes,executar,enviando}:Props) {
  const [ajustesDados, setAjustesDados] = useState<
  Record<string, number>
>({});
  const [busca,setBusca]=useState(''),[informacao,setInformacao]=useState('');
  const filtrar=(s:string)=>normal(s).includes(normal(busca));
  const bloqueado=enviando||acoes<=0;
  function dado(calcular:()=>string,consumir=false,nome='Rolar dados') {
    return <button className="pl-ataque-dado" type="button" disabled={enviando||(consumir&&acoes<=0)} aria-label={nome} title={consumir&&acoes<=0?'Sem ações disponíveis':nome} onClick={(e:MouseEvent)=>{e.preventDefault();e.stopPropagation();void executar(calcular,consumir);}}><D20Icon tamanho={26}/></button>;
  }
  function cartaoAtaque(a:AtaqueVisual,i:number,criatura?:NonNullable<HabilidadeVisual['ataques']>[number]) {
    const calcular=()=>criatura?rolarAtaqueCriatura(criatura):ataquePersonagem(a);
    return <details className="pl-registro-salvo" key={`${a.nome}-${i}`}>
      <summary className="pl-ataque-topo"><span className="pl-ataque-chevron">⌄</span>{a.imagens?.[0]&&<img className="pl-ataque-foto" src={a.imagens[0]} alt=""/>}<span className="pl-ataque-titulo"><strong>{a.nome}<Etiquetas texto={[a.tipo,...(a.adicionais??[]).map(x=>x.tipo)].join(' ')}/></strong><small><span>Dano:</span> {a.dano} <span>Crítico:</span> {a.critico}/×{a.multiplicador}</small></span>{dado(calcular,true,`Rolar teste e dano de ${a.nome}`)}</summary>
      <div className="pl-ataque-informacoes"><Imagens imagens={a.imagens} nome={a.nome}/><p><span>Ataque Bônus:</span> {a.bonusAtaque??a.bonus}</p><p><span>Tipo de Dano:</span> {a.tipo||'Não informado'}</p><p><span>Alcance:</span> {a.alcance||'Não informado'}</p><p><span>Dados:</span> {a.dados>0?a.dados:2+Math.abs(a.dados)}d20 ({a.dados>0?'maior':'pior'}) · {a.quantidade??1} ataque(s)</p><p><span>Perícia:</span> {a.periciaNome||'Nenhuma'} ({a.bonusPericia??0})</p>{a.acertoExtra&&<p><span>Acerto extra:</span> {a.acertoExtra}</p>}<p><span>Atributo Dano:</span> {a.atributoDanoNome?.toUpperCase()||'Nenhum'}{a.atributoDanoNome?` (${(a.atributoDano??0)>=0?'+':''}${a.atributoDano??0})`:''}</p>{(a.adicionais??[]).map((x,j)=><p key={j}><span>Dano adicional:</span> {x.dano} · {x.tipo} · {x.multiplicavel?'Multiplica no crítico':'Não multiplica no crítico'}</p>)}{!criatura&&<div className="frc-botoes"><button disabled={enviando} onClick={()=>void executar(()=>ataquePersonagem(a,'dano'))}>Rolar dano</button><button disabled={enviando} onClick={()=>void executar(()=>ataquePersonagem(a,'critico'))}>Dano crítico</button></div>}</div>
    </details>;
  }

  
  function linhaPericia(
  p: PericiaVisual,
  i: number,
  aptidao = false,
) {
  const treino = p.treino ?? 0;

  const cor =
    treino >= 15 ? "#d47cff"
    : treino >= 10 ? "#30b9ed"
    : treino >= 5 ? "#75c780"
    : "#eee";

  const chave = `${aptidao ? "aptidao" : "pericia"}-${i}`;

 const extrasPublicados = p.dadosExtras ?? 0;
const extrasAtuais = ajustesDados[chave] ?? extrasPublicados;

const dadosPublicados =
  tipo === "criatura"
    ? dadosPericiaCriatura(f, p)
    : p.dados;

const dadosDoTeste =
  dadosPublicados - extrasPublicados + extrasAtuais;

    return <Fragment key={chave}><tr style={{color:cor}}><td style={{paddingLeft:aptidao?18:undefined}}><button className="pl-rolar" disabled={enviando} onClick={()=>void executar(()=>teste(p.nome, dadosDoTeste, p.bonus))}><D20Icon/> {p.nome}</button>{(p.penalidadeProtecao??0)>0&&<small className="frc-penalidade">Proteção pesada −{p.penalidadeProtecao}</small>}{(p.penalidadeCarga??0)>0&&<small className="frc-penalidade">Sobrecarga −{p.penalidadeCarga}</small>}</td><td>{tipo==='jogador'?<select disabled value={p.atributo??''} aria-label={`Atributo de ${p.nome}`}><option value="">—</option><option value="fisico">FÍSICO</option><option value="mente">MENTE</option><option value="presenca">PRESENÇA</option></select>:<span>
  {dadosDoTeste > 0
    ? dadosDoTeste
    : 2 + Math.abs(dadosDoTeste)}
  d20
  {dadosDoTeste <= 0 && " (pior)"}
</span>}</td><td><input
  aria-label={`Dados extras de ${p.nome}`}
  type="number"
  step={1}
  value={extrasAtuais}
  disabled={enviando}
  onChange={(e) => {
    const texto = e.currentTarget.value;
    const valor = texto === "" ? 0 : Number(texto);

    if (!Number.isSafeInteger(valor)) return;

    const total =
  dadosPublicados - extrasPublicados + valor;

    const quantidade =
      total > 0 ? total : 2 + Math.abs(total);

    if (quantidade > 100) return;

    setAjustesDados((anteriores) => ({
      ...anteriores,
      [chave]: valor,
    }));
  }}
/></td><td><select disabled value={treino} aria-label={`Treino de ${p.nome}`}><option value={treino}>{treino>0?'+':''}{treino}</option></select></td><td><label className="pl-campo"><span>Outros de {p.nome}</span><input aria-label={`Outros de ${p.nome}`} readOnly value={p.outros??(tipo==='criatura'?p.bonus:0)}/></label></td><td><button onClick={()=>setInformacao(informacao===chave?'':chave)}>Ações</button></td></tr>{informacao===chave&&<tr><td colSpan={6}><div className="frc-especialidade"><strong>{p.nome}</strong><p>{p.informacoes||p.descricao||'Nenhuma informação cadastrada.'}</p><p>
  Teste:{" "}
  {dadosDoTeste > 0
    ? dadosDoTeste
    : 2 + Math.abs(dadosDoTeste)}
  d20 ({dadosDoTeste > 0 ? "maior" : "pior"})
  {" + "}
  {p.bonus}
</p></div></td></tr>}</Fragment>;
  }
  function habilidade(h:HabilidadeVisual,i:number) {
    const detalhes=h.detalhes??{};
    const entradas=Object.entries(detalhes);
    const achar=(re:RegExp)=>entradas.find(([k])=>re.test(normal(k)))?.[1]??'';
    const elemento=achar(/elemento/),fonte=h.fonte||achar(/fonte/),afinidade=achar(/afinidade/);
    const etiquetas=entradas.filter(([k,v])=>v&&/classe|categoria|tipo|elemento/.test(normal(k))&&!/requisito/.test(normal(k)));
    return <details className="pl-registro-salvo" key={h.id||i} style={fundo(elemento)}><summary>{h.nome} <Etiquetas texto={elemento}/></summary><article className="pl-habilidade-cartao"><h2>{h.nome}</h2><div className="pl-habilidade-etiquetas">{etiquetas.map(([k,v])=><span key={k}>{v}</span>)}</div><Imagens imagens={h.imagens} nome={h.nome}/><p className="pl-habilidade-texto">{h.descricao||'Sem descrição publicada.'}</p>{achar(/requisito/)&&<div className="pl-habilidade-requisitos"><strong>Requisitos</strong><span>{achar(/requisito/)}</span></div>}{afinidade&&<div className="pl-habilidade-afinidade"><strong>AFINIDADE:</strong><p>{afinidade}</p></div>}{fonte&&<footer>{fonte}</footer>}</article></details>;
  }
  function fundo(elemento=''):CSSProperties {
    const e=normal(elemento).trim(),cor=elementos[e];
    if(!cor)return {};
    return {borderColor:cor,backgroundImage:`linear-gradient(90deg,rgba(0,0,0,.83),rgba(0,0,0,.6)),url("${import.meta.env.BASE_URL}ameacas/${e.toUpperCase()}.PNG")`,backgroundSize:'cover'};
  }
  return <>
    <input className="ow-busca" placeholder="Pesquisar…" aria-label={`Pesquisar em ${aba}`} value={busca} onChange={e=>setBusca(e.target.value)}/>
    {aba==='combate'&&<><p className="ow-ajuda">O dado do ataque rola acerto e dano e solicita 1 ação. Dano isolado não consome ação.</p>{bloqueado&&<small>{enviando?'Enviando rolagem…':'Sem ações disponíveis para atacar.'}</small>}{tipo==='jogador'?(f.ataques??[]).filter(a=>filtrar(a.nome)).map((a,i)=>cartaoAtaque(a,i)):<>{[...(f.acoes??[]),...(f.poderes??[])].filter(h=>filtrar(h.nome)).map((h,i)=><section className="ow-grupo-criatura" key={h.id||i}><h3>{h.nome}</h3>{h.descricao&&<p>{h.descricao}</p>}{(h.ataques??[]).map((a,j)=>cartaoAtaque({...a,adicionais:a.danosAdicionais},j,a))}</section>)}</>}</>}
    {aba==='pericias'&&<><h3>PERÍCIAS</h3><p className="ow-ajuda">Clique no dado ou no nome para rolar. Os campos mostram os valores publicados pela ficha.</p><div className="pl-tabela ow-tabela"><table><thead><tr><th>Perícia</th><th>Atrib.</th><th>Dados extras</th><th>Treino</th><th>Outros</th><th>Ações</th></tr></thead><tbody>{[...(f.pericias??[]),...(f.periciasAdicionais??[])].filter(p=>filtrar(p.nome)||(normal(p.nome)==='aptidao'&&(f.aptidoes??[]).some(a=>filtrar(a.nome)))).map((p,i)=><Fragment key={`p-${i}`}>{linhaPericia(p,i)}{normal(p.nome)==='aptidao'&&(f.aptidoes??[]).filter(x=>filtrar(x.nome)||filtrar(p.nome)).map((a,j)=>linhaPericia(a,j,true))}</Fragment>)}</tbody></table></div></>}
    {aba==='rituais'&&<><div className="pl-dt"><strong>{10+(f.nivel??1)*2+(f.atributos?.presenca??0)}</strong><span>DT DE RITUAIS</span></div>{(f.rituais??[]).filter(r=>filtrar(r.nome)).map((r,i)=><details key={i} className="pl-registro-salvo" style={fundo(r.elemento)}><summary>{r.nome} <Etiquetas texto={r.elemento??''}/></summary><section className="pl-ritual-cartao"><div className="pl-ritual-rolagens">{(r.dados??[]).filter(d=>d.dados).map((d,j)=><div key={j}><small>{d.nome}</small><button className="ow-rolagem-ritual" disabled={enviando} onClick={()=>void executar(()=>{const x=expressao(d.dados);return `${r.nome} · ${d.nome}: ${x.detalhes} = ${x.total}`;})}><D20Icon/> {d.dados}</button></div>)}</div><div className="pl-ritual-corpo"><span className="pl-ritual-elemento">{r.elemento||'Sem elemento'} {r.circulo}</span>{Boolean(r.imagens?.length)&&<div className="pl-ritual-simbolo"><Imagens imagens={r.imagens} nome={r.nome}/></div>}<div className="pl-ritual-status">{[['Execução',r.execucao],['Alcance',r.alcance],['Alvo',r.alvo],['Área',r.area],['Duração',r.duracao],['Resistência',r.resistencia]].filter(([,v])=>v).map(([k,v])=><p key={k}><span>{k}:</span> {v}</p>)}</div><p className="pl-ritual-texto">{r.descricao}</p>{(r.aprimoramentos??[]).map((a,j)=><p key={j} className="pl-ritual-texto"><span>{a.nome}{a.custo?` (${a.custo})`:''}:</span> {a.descricao}</p>)}</div></section></details>)}{!(f.rituais??[]).length&&<p>Nenhum ritual publicado.</p>}</>}
    {aba==='habilidades'&&<>{(tipo==='criatura'?(f.poderes??[]):(f.habilidades??[])).filter(h=>filtrar(`${h.nome} ${h.descricao??''}`)).map(habilidade)}</>}
  </>;
}
