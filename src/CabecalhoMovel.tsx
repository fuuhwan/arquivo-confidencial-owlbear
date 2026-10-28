import { useRef, useState } from 'react';
import OBR from '@owlbear-rodeo/sdk';
export default function CabecalhoMovel() {
  const inicio=useRef<{x:number;y:number;id:number}|null>(null);
  const [arrastando,setArrastando]=useState(false);
  const [aviso,setAviso]=useState('');
  return <><header className="cabecalho cabecalho-ficha-token ow-cabecalho-movel"
    title="Arraste e solte para reposicionar a ficha"
    onPointerDown={e=>{
      if(e.button!==0||(e.target as HTMLElement).closest('button'))return;
      if(document.querySelector('[data-operacao-pendente="true"]')){setAviso('Aguarde a confirmação da operação antes de mover.');return;}
      inicio.current={x:e.screenX,y:e.screenY,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);setArrastando(true);setAviso('');
    }}
    onPointerCancel={()=>{inicio.current=null;setArrastando(false);}}
    onPointerUp={e=>{
      const comeco=inicio.current;inicio.current=null;setArrastando(false);
      if(!comeco)return;
      const dx=e.screenX-comeco.x,dy=e.screenY-comeco.y;
      if(Math.abs(dx)+Math.abs(dy)<6)return;
      const params=new URLSearchParams(location.search),canal=params.get('canal'),token=params.get('token');
      if(!canal||!token){setAviso('Reabra a ficha pelo ícone do token para habilitar o movimento.');return;}
      const transmissor=new BroadcastChannel(canal);transmissor.postMessage({tipo:'mover',token,dx,dy});transmissor.close();
    }}>
    <div><span className="etiqueta">{arrastando?'SOLTE PARA REPOSICIONAR':'⠿ ARQUIVO CONFIDENCIAL'}</span><h1>Ficha do token</h1></div>
    <button className="secundario" aria-label="Fechar ficha" onClick={()=>void OBR.popover.close('br.arquivo-confidencial.owlbear/painel-ficha').catch(console.error)}>×</button>
  </header>{aviso&&<p className="ow-aviso-movimento" role="status">{aviso}</p>}</>;
}
