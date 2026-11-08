import {
  get,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
} from "firebase/database";

import { auth, database } from "./firebase";

export async function pedirOperacaoFicha(
  combateId: string,
  participanteId: string,
  campo: "modeloFicha" | "testeOrdem2",
  valor: string,
): Promise<string> {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Entre na sua conta.");
  }

  const meta = (
    await get(ref(database, "combatePublico"))
  ).val();

  if (
    meta?.id !== combateId ||
    meta.participantes?.[participanteId]?.tipo !== "jogador" ||
    typeof meta.vez !== "string"
  ) {
    throw new Error("O combate mudou. Reabra a ficha.");
  }

  const destino = ref(
    database,
    `edicoesRecursosCombate/${crypto.randomUUID()}`,
  );

  await set(destino, {
    uid: usuario.uid,
    combateId,
    participanteId,
    campo,
    valor,
    modo: "definir",
    vez: meta.vez,
    quando: serverTimestamp(),
    status: "pendente",
  });

  return new Promise<string>((resolve, reject) => {
    let terminou = false;
    let desligar: () => void = () => {};

    function finalizar(
      erro?: Error,
      resposta = "",
      limpar = false,
    ) {
      if (terminou) return;

      terminou = true;
      clearTimeout(prazo);
      desligar();

      if (limpar) {
        void remove(destino).catch(() => {});
      }

      if (erro) reject(erro);
      else resolve(resposta);
    }

    const prazo = setTimeout(
      () =>
        finalizar(
          new Error(
            "Sem confirmação do mestre. Confira a ficha antes de repetir.",
          ),
        ),
      20000,
    );

    desligar = onValue(
      destino,
      (snapshot) => {
        const pedido = snapshot.val();

        if (pedido?.status === "aplicado") {
          finalizar(
            undefined,
            typeof pedido.resposta === "string"
              ? pedido.resposta
              : "",
            true,
          );
        } else if (
          pedido?.status === "recusado" ||
          pedido?.status === "incerto"
        ) {
          finalizar(
            new Error(
              pedido.mensagem ||
                "Não foi possível confirmar a operação.",
            ),
            "",
            pedido.status === "recusado",
          );
        }
      },
      () =>
        finalizar(
          new Error("Não foi possível acompanhar a operação."),
        ),
    );

    if (terminou) desligar();
  });
}