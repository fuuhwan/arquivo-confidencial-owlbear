import { useRef, useState } from 'react';
import { registrarResultado } from './lib/rolagens-ficha';
import type { ContextoRolagem } from './lib/rolagens-ficha';
export type ExecutarRolagem=(calcular:()=>string,consumir?:boolean)=>Promise<void>;
export default function useRolagemFicha(contexto:ContextoRolagem) {
  const trava=useRef(false);
  const [enviando,setEnviando]=useState(false),[resultado,setResultado]=useState(''),[erro,setErro]=useState('');
  const executar:ExecutarRolagem=async(calcular,consumir=false)=>{
    if(trava.current)return;
    trava.current=true;setEnviando(true);setErro('');
    try { const texto=calcular();setResultado(texto);await registrarResultado(contexto,texto,consumir); }
    catch(e){setErro(e instanceof Error?e.message:'Falha ao enviar a rolagem. Confira o histórico antes de repetir.');}
    finally{trava.current=false;setEnviando(false);}
  };
  return {executar,enviando,resultado,erro,limpar:()=>{setResultado('');setErro('');}};
}
