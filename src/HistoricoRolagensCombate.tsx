import { useEffect, useState } from "react";
import { limitToLast, onValue, orderByChild, query, ref } from "firebase/database";
import { database } from "./lib/firebase";

type Evento = { id: string; ficha: string; jogador: string; resultado: string; quando: number; combateId?: string };
type Props = { combateId: string; mestre: boolean };

export default function HistoricoRolagensCombate({ combateId, mestre }: Props) {
  const [fontes, setFontes] = useState<Record<string, Evento[]>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendentes, setPendentes] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const caminhos = mestre ? ["rolagensRecentes", "rolagensCriaturas"] : ["rolagensRecentes"];
    let encerrado = false;
    setFontes({}); setErros({}); setPendentes(caminhos);
    const cancelar = caminhos.map((caminho) => onValue(
      query(ref(database, caminho), orderByChild("quando"), limitToLast(50)),
      (snapshot) => {
        if (encerrado) return;
        const eventos: Evento[] = [];
        snapshot.forEach((filho) => {
          const dado: unknown = filho.val();
          if (!dado || typeof dado !== "object") return;
          const r = dado as Record<string, unknown>;
          if (typeof r.resultado !== "string" || typeof r.quando !== "number" || !Number.isFinite(r.quando)) return;
          if (typeof r.combateId === "string" && r.combateId !== combateId) return;
          eventos.push({ id: `${caminho}/${filho.key}`, resultado: r.resultado,
            ficha: typeof r.ficha === "string" ? r.ficha : "Rolagem",
            jogador: typeof r.jogador === "string" ? r.jogador : "",
            quando: r.quando,
            combateId: typeof r.combateId === "string" ? r.combateId : undefined });
        });
        setFontes((atual) => ({ ...atual, [caminho]: eventos }));
        setErros((atual) => ({ ...atual, [caminho]: "" }));
        setPendentes((atual) => atual.filter((p) => p !== caminho));
      },
      (erro) => {
        if (encerrado) return;
        setFontes((atual) => ({ ...atual, [caminho]: [] }));
        setErros((atual) => ({ ...atual, [caminho]: `Não foi possível ler ${caminho === "rolagensCriaturas" ? "as rolagens das criaturas" : "as rolagens compartilhadas"}: ${erro.message}` }));
        setPendentes((atual) => atual.filter((p) => p !== caminho));
      },
    ));
    return () => { encerrado = true; cancelar.forEach((f) => f()); };
  }, [combateId, mestre]);

  const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const recentes = Object.values(fontes).flat().sort((a, b) => b.quando - a.quando || a.id.localeCompare(b.id)).slice(0, 100);
  const eventos = recentes.filter((r) => normalizar(`${r.ficha} ${r.jogador} ${r.resultado}`).includes(normalizar(busca)));
  return <section className="ac-historico" aria-label="Histórico de rolagens">
    <h2>Histórico de rolagens</h2>
    <p className="ac-ajuda">Rolagens recentes compartilhadas. Registros antigos sem identificação do combate podem incluir outras sessões.{mestre ? " Inclui os registros de criaturas disponíveis ao mestre." : ""}</p>
    <input aria-label="Pesquisar rolagens" placeholder="Personagem, jogador ou resultado…" value={busca} onChange={(e) => setBusca(e.target.value)} />
    {pendentes.length > 0 && <p role="status">Carregando rolagens…</p>}
    {Object.entries(erros).filter(([, mensagem]) => mensagem).map(([fonte, mensagem]) => <p className="erro" role="alert" key={fonte}>{mensagem}</p>)}
    {!pendentes.length && !eventos.length && <p>{busca ? "Nenhuma rolagem encontrada." : "Nenhuma rolagem disponível."}</p>}
    {eventos.map((r) => <details className="ac-rolagem" key={r.id}>
      <summary><strong>{r.ficha}</strong><span>{r.jogador}</span><time dateTime={new Date(r.quando).toISOString()}>{new Date(r.quando).toLocaleString("pt-BR")}</time></summary>
      <pre>{r.resultado}</pre>
    </details>)}
  </section>;
}
