import { useRef, useState } from "react";
import {
  push,
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

export default function ConsumirAcao({
  combateId,
  participanteId,
  vez,
  acoes,
}: Props) {
  const trava = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function consumir() {
    if (trava.current || !vez || acoes <= 0) return;

    const usuario = auth.currentUser;

    if (!usuario) {
      setErro("Entre na sua conta primeiro.");
      return;
    }

    trava.current = true;
    setEnviando(true);
    setMensagem("");
    setErro("");

    try {
      const pedido = push(
        ref(database, "consumosAcoesCombate"),
      );

      await set(pedido, {
        uid: usuario.uid,
        combateId,
        participanteId,
        vez,
        quando: serverTimestamp(),
      });

      setMensagem(
        "Pedido enviado. Confira a atualização no contador de ações.",
      );
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível enviar o pedido.",
      );
    } finally {
      trava.current = false;
      setEnviando(false);
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <button
        disabled={enviando || !vez || acoes <= 0}
        onClick={consumir}
      >
        {enviando ? "Enviando…" : "Consumir 1 ação"}
      </button>

      {mensagem && <p role="status">{mensagem}</p>}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}