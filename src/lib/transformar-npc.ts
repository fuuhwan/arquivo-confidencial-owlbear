import {
  onValue,
  ref,
  serverTimestamp,
  set,
} from "firebase/database";
import { auth, database } from "./firebase";

export async function transformarNpc(
  combateId: string,
  participanteId: string,
  destino: "original" | "transformada",
): Promise<void> {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Entre na sua conta.");
  }

  const caminho = ref(
    database,
    `edicoesRecursosCombate/${crypto.randomUUID()}`,
  );

  await set(caminho, {
    uid: usuario.uid,
    combateId,
    participanteId,
    campo: "transformacao",
    modo: "definir",
    valor: destino,
    quando: serverTimestamp(),
    status: "pendente",
  });

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
          "Sem confirmação. Confira a forma atual antes de repetir: o pedido ainda pode ser aplicado.",
        ),
      );
    }, 20000);

    desligar = onValue(
      caminho,
      (snapshot) => {
        const pedido = snapshot.val();

        if (pedido?.status === "aplicado") {
          finalizar();
        } else if (
          pedido?.status === "recusado" ||
          pedido?.status === "incerto"
        ) {
          finalizar(
            new Error(
              pedido.mensagem ||
                "Confira a ficha antes de tentar novamente.",
            ),
          );
        }
      },
      () => {
        finalizar(
          new Error(
            "Não foi possível confirmar. Confira a ficha antes de repetir.",
          ),
        );
      },
    );

    if (terminou) desligar();
  });
}