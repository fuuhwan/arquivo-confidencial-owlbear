import { useRef, useState } from "react";
import { editarRecurso } from "./lib/editar-recurso";

type Props = {
  combateId: string;
  participanteId: string;
  temDeterminacao: boolean;
};

export default function EditarRecursos({
  combateId,
  participanteId,
  temDeterminacao,
}: Props) {
  const trava = useRef(false);
  const [quantidade, setQuantidade] = useState("1");
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function alterar(
    campo: "vida" | "determinacao",
    sinal: 1 | -1,
  ) {
    if (trava.current) return;

    setMensagem("");
    setErro("");

    const texto = quantidade.trim();
    const numero = Number(texto);

    if (
      !/^\d+$/.test(texto) ||
      !Number.isSafeInteger(numero) ||
      numero <= 0
    ) {
      setErro("Informe uma quantidade inteira maior que zero.");
      return;
    }

    trava.current = true;
    setOcupado(true);

    try {
      await editarRecurso(
        combateId,
        participanteId,
        campo,
        numero * sinal,
      );

      setMensagem("Alteração confirmada pelo mestre.");
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível alterar o recurso.",
      );
    } finally {
      trava.current = false;
      setOcupado(false);
    }
  }

  return (
    <section className="editar-recursos">
      <h2>Alterar recursos</h2>

      <label>
        Quantidade
        <input
          type="number"
          min="1"
          step="1"
          value={quantidade}
          disabled={ocupado}
          onChange={(evento) => setQuantidade(evento.target.value)}
        />
      </label>

      <div className="botoes-vinculo">
        <button
          disabled={ocupado}
          onClick={() => alterar("vida", -1)}
        >
          Descontar PV
        </button>

        <button
          disabled={ocupado}
          onClick={() => alterar("vida", 1)}
        >
          Recuperar PV
        </button>
      </div>

      {temDeterminacao && (
        <div className="botoes-vinculo">
          <button
            disabled={ocupado}
            onClick={() => alterar("determinacao", -1)}
          >
            Gastar Determinação
          </button>

          <button
            disabled={ocupado}
            onClick={() => alterar("determinacao", 1)}
          >
            Recuperar Determinação
          </button>
        </div>
      )}

      {ocupado && <p role="status">Aguardando o mestre…</p>}

      {mensagem && (
        <p className="sucesso" role="status">
          {mensagem}
        </p>
      )}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </section>
  );
}