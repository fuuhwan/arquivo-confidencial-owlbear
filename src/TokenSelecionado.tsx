import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import FichaTokenTematica from "./FichaTokenTematica";
import type { ParticipanteVisual } from "./FichaTokenTematica";

const CHAVE = "br.arquivo-confidencial.owlbear/vinculo";
type Vinculo = { versao: number; combateId: string; participanteId: string };
type Props = {
  combateId: string;
  ativo?: string | null;
  vez?: string;
  participantes: ParticipanteVisual[];
  tokenId?: string;
};
function lerVinculo(v: unknown): Vinculo | null {
  if (!v || typeof v !== "object") return null;
  const dado = v as Partial<Vinculo>;
  return dado.versao === 1 && typeof dado.combateId === "string" && typeof dado.participanteId === "string" ? dado as Vinculo : null;
}
export default function TokenSelecionado({ combateId, ativo, vez, participantes, tokenId }: Props) {
  const [vinculo, setVinculo] = useState<Vinculo | null>(null);
  const [aviso, setAviso] = useState("Consultando token…");
  useEffect(() => {
    let encerrado = false;
    let consulta = 0;
    const cancelar: (() => void)[] = [];
    function limpar(texto: string) { setVinculo(null); setAviso(texto); }
    async function atualizar() {
      const atual = ++consulta;
      const vigente = () => !encerrado && atual === consulta;
      try {
        const pronta = await OBR.scene.isReady();
        if (!vigente()) return;
        if (!pronta) { limpar("Abra uma cena no Owlbear."); return; }
        const selecao = tokenId ? [tokenId] : await OBR.player.getSelection();
        if (!vigente()) return;
        if (!selecao || selecao.length !== 1) { limpar("Selecione exatamente um token no mapa."); return; }
        const token = (await OBR.scene.items.getItems(selecao))[0];
        if (!vigente()) return;
        if (!token || token.type !== "IMAGE" || token.layer !== "CHARACTER") { limpar("Selecione um token da camada Personagem."); return; }
        const associado = lerVinculo(token.metadata[CHAVE]);
        if (!associado) { limpar("Este token ainda não tem vínculo. Use o painel principal para vinculá-lo."); return; }
        setVinculo(anterior => anterior?.combateId === associado.combateId && anterior?.participanteId === associado.participanteId ? anterior : associado);
        setAviso("");
      } catch (erro) {
        if (vigente()) limpar(erro instanceof Error ? erro.message : "Não foi possível consultar o token.");
      }
    }
    if (!OBR.isAvailable) { limpar("Abra este painel dentro do Owlbear."); return; }
    OBR.onReady(() => {
      if (encerrado) return;
      cancelar.push(OBR.scene.items.onChange(() => { void atualizar(); }), OBR.scene.onReadyChange(() => { void atualizar(); }));
      if (!tokenId) cancelar.push(OBR.player.onChange(() => { void atualizar(); }));
      void atualizar();
    });
    return () => { encerrado = true; consulta++; cancelar.forEach(f => f()); };
  }, [tokenId]);
  if (aviso) return <section className="bloco"><p>{aviso}</p></section>;
  if (vinculo?.combateId !== combateId) return <section className="bloco"><p>Este vínculo pertence a outro combate. Vincule o token novamente.</p></section>;
  const participante = participantes.find(p => p.id === vinculo.participanteId);
  if (!participante) return <section className="bloco"><p>O participante não está mais no combate.</p></section>;
  return <FichaTokenTematica key={`${combateId}/${participante.id}`} combateId={combateId} participante={participante} ativo={ativo} vez={vez}/>;
}
