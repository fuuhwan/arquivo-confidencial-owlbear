import { useRef, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { onValue, push, ref, serverTimestamp, set } from "firebase/database";
import { auth, database } from "./lib/firebase";
import HistoricoRolagensCombate from "./HistoricoRolagensCombate";
import "./PainelIniciativa.css";
import RedimensionarIniciativa from "./RedimensionarIniciativa";
type Comando = "avancar" | "voltar" | "reiniciar";
type Props = { combateId: string; turno: number; vez?: string; ativo?: string | null; mestre: boolean;
  participantes: { id: string; nome: string; iniciativa: number; acoes?: number }[] };

async function solicitar(combateId: string, vez: string, comando: Comando) {
  const usuario = auth.currentUser;
  if (!usuario?.emailVerified || usuario.email !== "jvictoranjos.silva@gmail.com") throw new Error("Somente o mestre pode controlar os turnos.");
  const destino = push(ref(database, "comandosControleCombate"));
  await set(destino, { combateId, vez, comando, quando: serverTimestamp(), status: "pendente" });
  await new Promise<void>((resolve, reject) => {
    let terminou = false;
    let desligar: () => void = () => {};
    function finalizar(erro?: Error) {
      if (terminou) return;
      terminou = true; clearTimeout(prazo); desligar();
      if (erro) reject(erro); else resolve();
    }
    const prazo = setTimeout(() => finalizar(new Error("Sem confirmação do mestre. Confira o combate antes de repetir.")), 15000);
    desligar = onValue(destino, (snapshot) => {
      const pedido = snapshot.val();
      if (pedido?.status === "aplicado") finalizar();
      else if (pedido?.status === "recusado" || pedido?.status === "incerto") finalizar(new Error(pedido.mensagem || "Confira o combate antes de repetir."));
    }, () => finalizar(new Error("Não foi possível confirmar. Confira o combate antes de repetir.")));
    if (terminou) desligar();
  });
}

export default function PainelIniciativa({ combateId, turno, vez, ativo, mestre, participantes }: Props) {
  const trava = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  async function enviar(comando: Comando) {
    if (trava.current || !vez || !mestre) return;
    if (comando === "reiniciar" && !window.confirm("Reiniciar o contador do combate?")) return;
    trava.current = true; setEnviando(true); setErro("");
    try { await solicitar(combateId, vez, comando); }
    catch (falha) { setErro(falha instanceof Error ? falha.message : "Não foi possível controlar o combate."); }
    finally { trava.current = false; setEnviando(false); }
  }
  const bloqueado = enviando || !vez || participantes.length === 0;
  const ordenados = [...participantes].sort((a, b) => b.iniciativa - a.iniciativa);
  const atual = participantes.find((p) => p.id === ativo);
  return (
  <section
    className="painel-iniciativa ac-iniciativa"
    data-operacao-pendente={enviando}
  >
    <header className="cabecalho"><div><span className="etiqueta">ARQUIVO CONFIDENCIAL</span><h1>Iniciativa e rolagens</h1></div>
      <button type="button" className="secundario" aria-label="Fechar iniciativa" onClick={() => { void OBR.popover.close("br.arquivo-confidencial.owlbear/painel-iniciativa").catch(console.error); }}>×</button>
    </header>
    <div className="ac-iniciativa-colunas"><section aria-label="Controle de iniciativa">
      <div className="resumo"><div><span>Contador de turno</span><strong>{turno}</strong></div><div><span>Participantes</span><strong>{participantes.length}</strong></div></div>
      <p role="status">Na vez: <strong>{atual?.nome ?? "Nenhum participante ativo"}</strong></p>
      {mestre && <div className="iniciativa-controles">
        <button type="button" disabled={bloqueado} onClick={() => void enviar("voltar")}>← Voltar turno</button>
        <button type="button" disabled={bloqueado} onClick={() => void enviar("avancar")}>Passar turno →</button>
        <button type="button" className="secundario" disabled={bloqueado} onClick={() => void enviar("reiniciar")}>Reiniciar contador</button>
      </div>}
      {enviando && <p role="status">Aguardando confirmação do site do mestre…</p>}
      {erro && <p className="erro" role="alert">{erro}</p>}
      <section className="lista">{ordenados.map((p, i) => <article key={p.id} className={`participante ${ativo === p.id ? "ativo" : ""}`} aria-current={ativo === p.id ? "step" : undefined}>
        <div className="linha"><h2>{i + 1}. {p.nome}</h2>{ativo === p.id && <span className="vez">NA VEZ</span>}</div>
        <div className="valores"><span>Iniciativa: {p.iniciativa}</span><span>Ações: {p.acoes ?? 2}</span></div>
      </article>)}{!participantes.length && <p>O combate ainda não tem participantes.</p>}</section>
    </section> <HistoricoRolagensCombate
          key={combateId}
          combateId={combateId}
          mestre={mestre}
        />
      </div>
  <RedimensionarIniciativa />
    </section>
  );
}