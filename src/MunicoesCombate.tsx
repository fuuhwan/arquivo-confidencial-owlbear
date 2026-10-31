import { useRef, useState } from "react";
import {
  onValue,
  ref,
  serverTimestamp,
  set,
} from "firebase/database";
import { auth, database } from "./lib/firebase";
import type { MunicaoVisual } from "./lib/modelos-ficha";

type Props = {
  combateId: string;
  participanteId: string;
  municoes: MunicaoVisual[];
};

async function solicitarMunicao(
  combateId: string,
  participanteId: string,
  itemId: string,
  tipo: "consumir" | "desfazer",
  operacaoId: string,
) {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Entre na sua conta.");
  }

  const destino = ref(
    database,
    `edicoesRecursosCombate/${crypto.randomUUID()}`,
  );

  await set(destino, {
    uid: usuario.uid,
    combateId,
    participanteId,
    campo: "municao",
    modo: "definir",
    valor: JSON.stringify({
      tipo,
      itemId,
      operacaoId,
    }),
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

    const prazo = setTimeout(
      () =>
        finalizar(
          new Error(
            "Sem confirmação. Confira a ficha antes de repetir: o pedido ainda pode ser aplicado.",
          ),
        ),
      20000,
    );

    desligar = onValue(
      destino,
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
                "Confira a ficha antes de repetir.",
            ),
          );
        }
      },
      () =>
        finalizar(
          new Error(
            "Não foi possível confirmar. Confira a ficha antes de repetir.",
          ),
        ),
    );

    if (terminou) desligar();
  });
}

export default function MunicoesCombate({
  combateId,
  participanteId,
  municoes,
}: Props) {
  const trava = useRef(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ultimo, setUltimo] = useState<{
    itemId: string;
    operacaoId: string;
  } | null>(null);

  async function executar(
    itemId: string,
    tipo: "consumir" | "desfazer",
  ) {
    if (trava.current) return;

    const operacaoId =
      tipo === "desfazer"
        ? ultimo?.itemId === itemId
          ? ultimo.operacaoId
          : null
        : crypto.randomUUID();

    if (!operacaoId) return;

    trava.current = true;
    setOcupado(true);
    setErro("");
    setMensagem("");

    try {
      await solicitarMunicao(
        combateId,
        participanteId,
        itemId,
        tipo,
        operacaoId,
      );

      setUltimo(
        tipo === "consumir"
          ? { itemId, operacaoId }
          : null,
      );

      setMensagem(
        tipo === "consumir"
          ? "Consumo confirmado."
          : "Consumo desfeito.",
      );
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível alterar a munição.",
      );
    } finally {
      trava.current = false;
      setOcupado(false);
    }
  }

  return (
    <section
      data-operacao-pendente={ocupado}
      style={{ marginTop: 20 }}
    >
      <h2>MUNIÇÕES</h2>

      {!municoes.length && (
        <p>Nenhuma munição publicada.</p>
      )}

      {municoes.map((item) => (
        <article
          className="pl-registro-salvo"
          key={item.id}
          style={{ padding: 12, marginTop: 10 }}
        >
          <strong>
            {item.nome} ×{item.quantidade}
          </strong>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 8,
            }}
          >
            {item.unidade ? (
              <>
                <span>
                  {item.unidade === "cena"
                    ? "Cenas:"
                    : "Turnos:"}{" "}
                  {item.restante}
                </span>

                <button
                  type="button"
                  disabled={
                    ocupado ||
                    item.quantidade <= 0 ||
                    item.restante <= 0
                  }
                  onClick={() =>
                    void executar(item.id, "consumir")
                  }
                >
                  Consumir {item.unidade}
                </button>
              </>
            ) : (
              <span>
                Cadastre a duração no site.
              </span>
            )}

            {ultimo?.itemId === item.id && (
              <button
                type="button"
                disabled={ocupado}
                onClick={() =>
                  void executar(item.id, "desfazer")
                }
              >
                Desfazer
              </button>
            )}
          </div>

          {item.quantidade <= 0 && (
            <p>Sem munição — compre mais munições.</p>
          )}
        </article>
      ))}

      {ocupado && (
        <p role="status">
          Aguardando confirmação do mestre…
        </p>
      )}

      {mensagem && <p role="status">{mensagem}</p>}

      {erro && (
        <p className="ow-erro" role="alert">
          {erro}
        </p>
      )}
    </section>
  );
}