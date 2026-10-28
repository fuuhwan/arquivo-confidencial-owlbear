import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "./lib/firebase";

type Ataque = {
  nome: string;
  quantidade: number;
  dados: number;
  bonus: number;
  acertoExtra?: string;
  dano: string;
  tipo: string;
  atributoDano?: number;
  atributoDanoNome?: string;
  critico: number;
  multiplicador: number;
  alcance: string;
  adicionais?: {
    dano: string;
    tipo: string;
    multiplicavel: boolean;
  }[];
};

type Ficha = {
  nome: string;
  classe?: string;
  nivel?: number;
  nex?: number;
  defesa?: number;
  bloqueio?: number;
  esquiva?: number;
  deslocamento?: string;
  atributos?: {
    fisico: number;
    mente: number;
    presenca: number;
  };
  ataques?: Ataque[];
};

type Props = {
  combateId: string;
  conteudoHash?: string;
};

function numero(valor?: number) {
  return typeof valor === "number" && Number.isFinite(valor)
    ? valor
    : "—";
}

export default function FichaPersonagem({
  combateId,
  conteudoHash,
}: Props) {
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    setFicha(null);
    setErro("");

    if (!conteudoHash) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    return onValue(
      ref(
        database,
        `combateConteudos/${combateId}/${conteudoHash}/json`,
      ),
      (snapshot) => {
        try {
          const json = snapshot.val();

          if (typeof json !== "string") {
            throw new Error("A ficha ainda não está disponível.");
          }

          const dados: unknown = JSON.parse(json);

          if (
            !dados ||
            typeof dados !== "object" ||
            Array.isArray(dados) ||
            !("nome" in dados) ||
            typeof dados.nome !== "string"
          ) {
            throw new Error("O formato da ficha é inválido.");
          }

          setFicha(dados as Ficha);
          setErro("");
        } catch (falha) {
          setFicha(null);
          setErro(
            falha instanceof Error
              ? falha.message
              : "Não foi possível consultar a ficha.",
          );
        } finally {
          setCarregando(false);
        }
      },
      (falha) => {
        setFicha(null);
        setErro(falha.message);
        setCarregando(false);
      },
    );
  }, [combateId, conteudoHash]);

  const ataques = Array.isArray(ficha?.ataques)
    ? ficha.ataques
    : [];

  return (
    <details className="ficha-consulta">
      <summary>Ficha e ataques do personagem</summary>

      {!conteudoHash && (
        <p>O conteúdo da ficha ainda não foi publicado.</p>
      )}

      {carregando && <p>Carregando ficha…</p>}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      {ficha && (
        <>
          <p>
            {ficha.classe || "Personagem"}
            {" · "}Nível {numero(ficha.nivel)}
            {" · "}NEX {numero(ficha.nex)}%
          </p>

          <div className="dados-token">
            <div>
              <span>Defesa</span>
              <strong>{numero(ficha.defesa)}</strong>
            </div>

            <div>
              <span>Bloqueio</span>
              <strong>{numero(ficha.bloqueio)}</strong>
            </div>

            <div>
              <span>Esquiva</span>
              <strong>{numero(ficha.esquiva)}</strong>
            </div>

            <div>
              <span>Deslocamento</span>
              <strong>{ficha.deslocamento || "—"}</strong>
            </div>
          </div>

          <div className="atributos-consulta">
            {([
              ["Físico", ficha.atributos?.fisico],
              ["Mente", ficha.atributos?.mente],
              ["Presença", ficha.atributos?.presenca],
            ] as const).map(([nome, valor]) => (
              <div key={nome}>
                <span>{nome}</span>
                <strong>{numero(valor)}</strong>
              </div>
            ))}
          </div>

          <section className="grupo-habilidades">
            <h3>Ataques</h3>

            {ataques.length === 0 && (
              <p>Nenhum ataque cadastrado ou arma equipada.</p>
            )}

            {ataques.map((ataque, indice) => (
              <details key={`${ataque.nome}-${indice}`}>
                <summary>{ataque.nome || "Ataque"}</summary>

                <p>
                  Acerto: {numero(ataque.dados)}d20
                  {" "}
                  {ataque.bonus >= 0 ? "+" : ""}
                  {numero(ataque.bonus)}
                </p>

                {ataque.acertoExtra && (
                  <p>Acerto extra: {ataque.acertoExtra}</p>
                )}

                <p>
                  Dano: {ataque.dano || "—"}
                  {ataque.tipo ? ` · ${ataque.tipo}` : ""}
                </p>

                {ataque.atributoDano !== undefined && (
                  <p>
                    Bônus de dano por atributo:{" "}
                    {numero(ataque.atributoDano)}
                    {ataque.atributoDanoNome
                      ? ` (${ataque.atributoDanoNome})`
                      : ""}
                  </p>
                )}

                <p>
                  Crítico: {numero(ataque.critico)}
                  {" · "}×{numero(ataque.multiplicador)}
                </p>

                <p>
                  Alcance: {ataque.alcance || "—"}
                  {" · "}Quantidade: {numero(ataque.quantidade)}
                </p>

                {(Array.isArray(ataque.adicionais)
                  ? ataque.adicionais
                  : []
                ).map((extra, indiceExtra) => (
                  <p key={indiceExtra}>
                    Adicional: {extra.dano}
                    {extra.tipo ? ` · ${extra.tipo}` : ""}
                    {" · "}
                    {extra.multiplicavel
                      ? "Multiplica no crítico"
                      : "Não multiplica no crítico"}
                  </p>
                ))}
              </details>
            ))}
          </section>
        </>
      )}
    </details>
  );
}