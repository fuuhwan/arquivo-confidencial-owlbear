import { onValue, ref, remove, serverTimestamp, set } from 'firebase/database';
import { auth, database } from './firebase';
export type CampoRecurso='vida'|'determinacao'|'vidaTemporaria'|'determinacaoTemporaria';
export async function editarRecurso(combateId:string,participanteId:string,campo:CampoRecurso,valor:number,modo:'somar'|'definir'='somar'):Promise<void> {
  const usuario=auth.currentUser;
  if(!usuario)throw new Error('Entre na sua conta.');
  if(!Number.isSafeInteger(valor)||(modo==='somar'&&valor===0))throw new Error('Informe um número inteiro válido.');
  if(campo.endsWith('Temporaria')&&(modo!=='definir'||valor<0))throw new Error('Temporários devem ser um total inteiro a partir de zero.');
  const destino=ref(database,`edicoesRecursosCombate/${crypto.randomUUID()}`);
  await set(destino,{uid:usuario.uid,combateId,participanteId,campo,valor,modo,quando:serverTimestamp(),status:'pendente'});
  await new Promise<void>((resolve,reject)=>{
    let terminou=false;let desligar:()=>void=()=>{};
    function finalizar(erro?:Error,limpar=false) {
      if(terminou)return;terminou=true;clearTimeout(prazo);desligar();
      if(limpar)void remove(destino).catch(()=>{});
      if(erro)reject(erro);else resolve();
    }
    const prazo=setTimeout(()=>finalizar(new Error('Sem confirmação do mestre. Confira o valor antes de repetir: o pedido ainda pode ser aplicado.')),20000);
    desligar=onValue(destino,s=>{
      const p=s.val();
      if(p?.status==='aplicado')finalizar(undefined,true);
      else if(p?.status==='recusado')finalizar(new Error(p.mensagem||'Alteração recusada.'),true);
      else if(p?.status==='incerto')finalizar(new Error(p.mensagem||'Gravação sem confirmação. Confira a ficha antes de repetir.'));
    },()=>finalizar(new Error('Não foi possível confirmar a alteração. Confira a ficha antes de repetir.')));
    if(terminou)desligar();
  });
}
