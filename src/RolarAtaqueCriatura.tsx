import { useRef, useState } from "react";
import {
  get,
  push,
  ref,
  serverTimestamp,
  update,
} from "firebase/database";
import { auth, database } from "./lib/firebase";
import { rolarAtaqueCriatura } from "./lib/dados-criatura";
import type { AtaqueCriatura } from "./lib/dados-criatura";

type Props = {
  combateId: string;
  participanteId: string;
  nome: string;
  elemento: string;
  ataque: AtaqueCriatura;
};

export default function RolarAtaqueCriatura({
  combateId,
  participanteId,
  nome,
  elemento,
  ataque,
}: Props) {
  const trava = useRef(false);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function rolar() {
    if (trava.current) return;

    trava.current = true;
    setOcupado(true);
    setResultado("");
    setMensagem("");
    setErro("");

    try {
      const usuario = auth.currentUser;

      if (
        !usuario?.emailVerified ||
        usuario.email !== "jvictoranjos.silva@gmail.com"
      ) {
        throw new Error(
          "Nesta etapa, os ataques de criaturas são exclusivos do mestre.",
        );
      }

      const snapshot = await get(
        ref(database, "combatePublico"),
      );

      const combate = snapshot.val();
      const participante =
        combate?.participantes?.[participanteId];

      if (
        combate?.id !== combateId ||
        typeof combate.vez !== "string" ||
        !combate.vez ||
        participante?.tipo !== "criatura"
      ) {
        throw new Error(
          "O combate mudou. Atualize o painel e confira o vínculo.",
        );
      }

      if (!(participante.acoes > 0)) {
        throw new Error("A criatura não tem ações disponíveis.");
      }

      const texto = rolarAtaqueCriatura(ataque);
      setResultado(texto);

      const chave = push(
        ref(database, "rolagensCriaturas"),
      ).key;

      if (!chave) {
        throw new Error("Não foi possível criar o registro.");
      }

      const afinidade = elemento.trim().toLowerCase();

      // Registra o resultado e solicita uma ação no mesmo envio.
      await update(ref(database), {
        [`rolagensCriaturas/${chave}`]: {
          uid: usuario.uid,
          jogador: "Mestre",
          ficha: `${nome} · ${ataque.nome || "Ataque"}`.slice(0, 200),
          resultado: texto.slice(0, 10000),
          afinidade: [
            "sangue",
            "morte",
            "energia",
            "conhecimento",
            "medo",
          ].includes(afinidade)
            ? afinidade
            : "nenhuma",
          quando: serverTimestamp(),
        },

        [`consumosAcoesCombate/${chave}`]: {
          uid: usuario.uid,
          combateId,
          participanteId,
          vez: combate.vez,
          quando: serverTimestamp(),
        },
      });

      setMensagem(
        "Rolagem registrada e consumo de ação enviado. Confira o contador.",
      );
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível registrar o ataque.",
      );
    } finally {
      trava.current = false;
      setOcupado(false);
    }
  }

  return (
    <div>
      <button disabled={ocupado} onClick={rolar}>
        {ocupado ? "Enviando…" : "Rolar ataque · 1 ação"}
      </button>

      {resultado && (
        <p className="texto-ficha resultado-ataque">
          {resultado}
        </p>
      )}

      {mensagem && <p role="status">{mensagem}</p>}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}