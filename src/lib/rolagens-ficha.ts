import { get, push, ref, serverTimestamp, update } from 'firebase/database';
import { auth, database } from './firebase';
import type { AtaqueVisual } from './modelos-ficha';
export function dado(faces:number) {
  if (!Number.isSafeInteger(faces) || faces<2 || faces>1000000) throw new Error('Número de faces inválido.');
  const limite=Math.floor(4294967296/faces)*faces;
  const v=new Uint32Array(1);
  do { crypto.getRandomValues(v); } while(v[0]>=limite);
  return v[0]%faces+1;
}
export function expressao(texto:string) {
  const t=texto.toLowerCase().replace(/\s+/g,'');
  if (!/^[+-]?(?:\d*d\d+|\d+)(?:[+-](?:\d*d\d+|\d+))*$/.test(t)) throw new Error('Use dados como 2d6+1d4-3.');
  let total=0, quantidadeTotal=0;
  const partes:string[]=[];
  for (const termo of t.match(/[+-]?[^+-]+/g)??[]) {
    const sinal=termo.startsWith('-')?-1:1;
    const limpo=termo.replace(/^[+-]/,'');
    if(limpo.includes('d')) {
      const [q,f]=limpo.split('d'); const n=Number(q||1),faces=Number(f);
      quantidadeTotal+=n;
      if(!Number.isSafeInteger(n)||n<1||quantidadeTotal>100||!Number.isSafeInteger(faces)||faces<2||faces>1000000) throw new Error('Limite de 100 dados por expressão. Confira os lados.');
      const valores=Array.from({length:n},()=>dado(faces));
      total+=sinal*valores.reduce((a,b)=>a+b,0);
      partes.push(`${sinal<0?'−':'+'}${n}d${faces} [${valores.join(', ')}]`);
    } else { const n=Number(limpo); if(!Number.isSafeInteger(n))throw new Error('Valor inválido.'); total+=sinal*n; partes.push(`${sinal<0?'−':'+'}${n}`); }
    if(!Number.isSafeInteger(total))throw new Error('Resultado acima do limite.');
  }
  return {total,detalhes:partes.join(' ')};
}
export function teste(nome:string,dados:number,bonus=0) {
  const q=dados>0?dados:2+Math.abs(dados);
  if(!Number.isSafeInteger(dados)||q>100||!Number.isSafeInteger(bonus))throw new Error('Dados ou bônus inválidos.');
  const valores=Array.from({length:q},()=>dado(20));
  const natural=dados>0?Math.max(...valores):Math.min(...valores);
  const total=natural+bonus;
  if(!Number.isSafeInteger(total))throw new Error('Resultado acima do limite.');
  return `${nome}: [${valores.join(', ')}] → ${dados>0?'maior':'pior'} ${natural} + (${bonus}) = ${total}`;
}
function linhasDano(a:AtaqueVisual,critico:boolean) {
  const r=expressao(a.dano), atributo=a.atributoDano??0;
  const base=r.total+atributo, m=critico?a.multiplicador:1;
  if(!Number.isSafeInteger(atributo)||!Number.isSafeInteger(base*m))throw new Error('Dano acima do limite.');
  const linhas=[`Dano: ${r.total} (${r.detalhes})${a.atributoDanoNome?` + ${a.atributoDanoNome.toUpperCase()} (${atributo}) = ${base}`:''}${critico?` × ${m} = ${base*m}`:''} ${a.tipo}`];
  for(const extra of a.adicionais??[]) {
    const x=expressao(extra.dano), multiplicar=critico&&extra.multiplicavel;
    if(!Number.isSafeInteger(x.total*(multiplicar?m:1)))throw new Error('Dano adicional acima do limite.');
    linhas.push(`Adicional: ${x.total} (${x.detalhes})${multiplicar?` × ${m} = ${x.total*m}`:''} ${extra.tipo}`);
  }
  return linhas.join('\n');
}
export function ataquePersonagem(a:AtaqueVisual,modo:'ataque'|'dano'|'critico'='ataque') {
  if(!Number.isInteger(a.critico)||a.critico<1||a.critico>20||!Number.isSafeInteger(a.multiplicador)||a.multiplicador<1)throw new Error('Confira o crítico do ataque.');
  if(modo!=='ataque')return `${a.nome}\n${linhasDano(a,modo==='critico')}`;
  const q=a.dados>0?a.dados:2+Math.abs(a.dados),n=a.quantidade??1;
  if(!Number.isSafeInteger(a.dados)||q>100||!Number.isSafeInteger(n)||n<1||n>100||!Number.isSafeInteger(a.bonus))throw new Error('Confira dados, quantidade e bônus.');
  const linhas=[a.nome];
  for(let i=0;i<n;i++) {
    const valores=Array.from({length:q},()=>dado(20));
    const natural=a.dados>0?Math.max(...valores):Math.min(...valores);
    const extra=a.acertoExtra?.trim()?expressao(a.acertoExtra):null;
    const total=natural+a.bonus+(extra?.total??0);
    if(!Number.isSafeInteger(total))throw new Error('Acerto acima do limite.');
    const critico=natural>=a.critico;
    linhas.push(`Ataque ${i+1}: [${valores.join(', ')}] → ${a.dados>0?'maior':'pior'} ${natural} + (${a.bonus})${extra?` + (${extra.total})`:''} = ${total}${critico?' · CRÍTICO!':''}`);
    if(extra)linhas.push(`Acerto extra (${a.acertoExtra}): ${extra.total} (${extra.detalhes})`);
    linhas.push(linhasDano(a,critico));
  }
  return linhas.join('\n');
}
export type ContextoRolagem={combateId:string;participanteId:string;tipo:'jogador'|'criatura';nome:string;afinidade:string};
export async function registrarResultado(c:ContextoRolagem,texto:string,consumir=false) {
  const u=auth.currentUser;
  if(!u)throw new Error('Entre na sua conta.');
  if(texto.length>10000)throw new Error('Resultado muito longo para o histórico. Reduza a quantidade de ataques.');
  const meta=(await get(ref(database,'combatePublico'))).val();
  if(meta?.id!==c.combateId||meta?.participantes?.[c.participanteId]?.tipo!==c.tipo)throw new Error('O combate mudou. Reabra a ficha.');
  if(consumir&&!(meta.participantes[c.participanteId].acoes>0))throw new Error('Sem ações disponíveis.');
  if(auth.currentUser?.uid!==u.uid)throw new Error('A conta foi alterada.');
  const afinidade=['sangue','morte','energia','conhecimento','medo'].includes(c.afinidade)?c.afinidade:'nenhuma';
  const key=push(ref(database,'rolagens')).key!;
  const mestre=u.emailVerified&&u.email==='jvictoranjos.silva@gmail.com';
  if(c.tipo==='criatura') {
    if(mestre) {
      const patch:Record<string,unknown>={ [`rolagensCriaturas/${key}`]:{uid:u.uid,jogador:'Mestre',ficha:c.nome.slice(0,200),resultado:texto,afinidade,quando:serverTimestamp()} };
      if(consumir)patch[`consumosAcoesCombate/${key}`]={uid:u.uid,combateId:c.combateId,participanteId:c.participanteId,vez:meta.vez,quando:serverTimestamp()};
      await update(ref(database),patch);
    } else {
      await update(ref(database,`rolagensCriaturasJogadores/${u.uid}/${key}`),{combateId:c.combateId,participanteId:c.participanteId,vez:meta.vez,ficha:c.nome.slice(0,200),resultado:texto,afinidade,consumirAcao:consumir,quando:serverTimestamp()});
    }
    return;
  }
  const perfil=(await get(ref(database,`perfis/${u.uid}/nick`))).val();
  if(auth.currentUser?.uid!==u.uid)throw new Error('A conta foi alterada.');
  const evento={jogador:(typeof perfil==='string'?perfil:u.displayName||'Jogador').slice(0,200),ficha:c.nome.slice(0,200),resultado:texto,afinidade,quando:serverTimestamp(),...(consumir?{ataqueCombate:{participanteId:c.participanteId,vez:meta.vez}}:{})};
  await update(ref(database),{[`rolagens/${u.uid}/${key}`]:evento,[`rolagensRecentes/${key}`]:{...evento,uid:u.uid}});
}
