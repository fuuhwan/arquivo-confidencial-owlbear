import { useRef, useState } from "react";
import {
  onValue,
  ref,
  serverTimestamp,
  set,
} from "firebase/database";
import { auth, database } from "./lib/firebase";

type Props = {
  combateId: string;
  participanteId: string;
  vez?: string;
  acoes: number;
};

export default function ControleAcoes({
  combateId,
  participanteId,
  vez,
  acoes,
}: Props) {
  const trava = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function alterar(valor: number) {
    if (trava.current) return;

    const usuario = auth.currentUser;

    if (!usuario) {
      setErro("Entre na sua conta.");
      return;
    }

    if (!vez) {
      setErro("Aguarde o combate carregar.");
      return;
    }

    if (
      !Number.isSafeInteger(valor) ||
      valor < 0 ||
      valor > 20 ||
      valor === acoes
    ) {
      return;
    }

    trava.current = true;
    setEnviando(true);
    setErro("");

    try {
      await set(
        ref(database, `pedidosAcoesCombate/${usuario.uid}`),
        {
          id: crypto.randomUUID(),
          participanteId,
          vez,
          valor,
          quando: serverTimestamp(),
        },
      );

      await new Promise<void>((resolve, reject) => {
        let terminou = false;
        let desligar: () => void = () => {};

        function finalizar(erro?: Error) {
          if (terminou) return;
          terminou = true;

          clearTimeout(prazo);
          desligar();

          if (erro) reject(erro);
          else resolve();
        }

        const prazo = setTimeout(() => {
          finalizar(
            new Error(
              "Sem confirmação do mestre. Confira as ações antes de repetir.",
            ),
          );
        }, 15000);

        desligar = onValue(
          ref(database, "combatePublico"),
          (snapshot) => {
            const combate = snapshot.val();

            if (combate?.id !== combateId) {
              finalizar(
                new Error("O combate foi encerrado ou substituído."),
              );
              return;
            }

            const participante =
              combate.participantes?.[participanteId];

            if (!participante) {
              finalizar(
                new Error("O participante saiu do combate."),
              );
              return;
            }

            if (participante.acoes === valor) {
              finalizar();
            }
          },
          () => {
            finalizar(
              new Error(
                "Não foi possível confirmar. Confira as ações antes de repetir.",
              ),
            );
          },
        );

        if (terminou) desligar();
      });
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível alterar as ações.",
      );
    } finally {
      trava.current = false;
      setEnviando(false);
    }
  }

  return (
    <div
      className="ow-controle-acoes"
      data-operacao-pendente={enviando}
    >
      <span>Ações</span>

      <div className="ow-controle-acoes-botoes">
        <button
          type="button"
          aria-label="Remover uma ação"
          disabled={enviando || !vez || acoes <= 0}
          onClick={() => void alterar(acoes - 1)}
        >
          −
        </button>

        <strong>{acoes}</strong>

        <button
          type="button"
          aria-label="Adicionar uma ação"
          disabled={enviando || !vez || acoes >= 20}
          onClick={() => void alterar(acoes + 1)}
        >
          +
        </button>
      </div>

      {enviando && <small role="status">Aguardando mestre…</small>}
      {erro && <small role="alert">{erro}</small>}
    </div>
  );
}
