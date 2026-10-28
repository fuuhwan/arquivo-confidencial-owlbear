import {
  onValue,
  ref,
  serverTimestamp,
  set,
} from "firebase/database";
import { auth, database } from "./firebase";

export async function solicitarIniciativa(
  combateId: string,
  participanteId: string,
  vez: string,
  valor: number,
): Promise<void> {
  const usuario = auth.currentUser;

  if (!usuario) throw new Error("Entre na sua conta.");

  if (
    !Number.isSafeInteger(valor) ||
    Math.abs(valor) > 1000000
  ) {
    throw new Error("Resultado de iniciativa inválido.");
  }

  const destino = ref(
    database,
    `pedidosIniciativaCombate/${usuario.uid}/${crypto.randomUUID()}`,
  );

  await set(destino, {
    combateId,
    participanteId,
    vez,
    valor,
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
          "Sem confirmação do mestre. Confira a iniciativa antes de rolar novamente.",
        ),
      );
    }, 15000);

    desligar = onValue(
      destino,
      (snapshot) => {
        const pedido = snapshot.val();

        if (pedido?.status === "aplicado") {
          finalizar();
        } else if (pedido?.status === "recusado") {
          finalizar(
            new Error(
              pedido.mensagem || "Alteração recusada.",
            ),
          );
        }
      },
      () => {
        finalizar(
          new Error(
            "Não foi possível confirmar. Confira a iniciativa antes de repetir.",
          ),
        );
      },
    );

    if (terminou) desligar();
  });
}