import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "./lib/firebase";

type Props = {
  combateId: string;
  participanteId: string;
};

type Vida = {
  atual: number;
  maxima: number;
};

export default function VidaAmeaca({
  combateId,
  participanteId,
}: Props) {
  const [vida, setVida] = useState<Vida | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setVida(null);
    setErro("");
    setCarregando(true);

    const caminho =
      `combateCriaturas/${combateId}/${participanteId}/json`;

    return onValue(
      ref(database, caminho),
      (snapshot) => {
        try {
          const json = snapshot.val();

          if (json === null) {
            setVida(null);
            setErro("A ficha da ameaça ainda não foi publicada.");
            return;
          }

          if (typeof json !== "string") {
            throw new Error("Formato inválido da ficha da ameaça.");
          }

          const ficha: unknown = JSON.parse(json);

          if (!ficha || typeof ficha !== "object") {
            throw new Error("A ficha da ameaça é inválida.");
          }

          const dados = ficha as Record<string, unknown>;

          if (
            typeof dados.vidaAtual !== "number" ||
            !Number.isFinite(dados.vidaAtual) ||
            typeof dados.vidaMaxima !== "number" ||
            !Number.isFinite(dados.vidaMaxima)
          ) {
            throw new Error(
              "Os campos de vida da ameaça são inválidos.",
            );
          }

          setVida({
            atual: dados.vidaAtual,
            maxima: dados.vidaMaxima,
          });
          setErro("");
        } catch (falha) {
          setVida(null);
          setErro(
            falha instanceof Error
              ? falha.message
              : "Não foi possível ler os PV da ameaça.",
          );
        } finally {
          setCarregando(false);
        }
      },
      (falha) => {
        setVida(null);
        setErro(falha.message);
        setCarregando(false);
      },
    );
  }, [combateId, participanteId]);

  if (carregando) {
    return <p>Carregando PV da ameaça…</p>;
  }

  if (erro) {
    return (
      <p className="erro" role="alert">
        {erro}
      </p>
    );
  }

  if (!vida) return null;

  return (
    <div className="dados-token">
      <div>
        <span>PV</span>
        <strong>
          {vida.atual} / {vida.maxima}
        </strong>
      </div>
    </div>
  );
}