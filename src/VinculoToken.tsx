import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

const CHAVE = "br.arquivo-confidencial.owlbear/vinculo";

type Participante = {
  id: string;
  nome: string;
};

type Props = {
  combateId: string;
  participantes: Participante[];
};

export default function VinculoToken({
  combateId,
  participantes,
}: Props) {
  const [pronto, setPronto] = useState(false);
  const [participanteId, setParticipanteId] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    if (OBR.isAvailable) {
      OBR.onReady(() => {
        if (ativo) setPronto(true);
      });
    }

    return () => {
      ativo = false;
    };
  }, []);

  async function alterarVinculo(remover: boolean) {
    setMensagem("");
    setErro("");
    setOcupado(true);

    try {
      if (!pronto) {
        throw new Error("Abra este painel dentro do Owlbear.");
      }

      if (!(await OBR.scene.isReady())) {
        throw new Error("Abra uma cena no Owlbear primeiro.");
      }

      // Nesta etapa, o mestre administra os vínculos.
      if ((await OBR.player.getRole()) !== "GM") {
        throw new Error("Somente o mestre pode alterar os vínculos.");
      }

      const selecao = await OBR.player.getSelection();

      if (!selecao || selecao.length !== 1) {
        throw new Error("Selecione exatamente um token no mapa.");
      }

      const itens = await OBR.scene.items.getItems(selecao);
      const token = itens[0];

      if (
        !token ||
        token.type !== "IMAGE" ||
        token.layer !== "CHARACTER"
      ) {
        throw new Error(
          "Selecione uma imagem na camada Personagem/Character.",
        );
      }

      const participante = participantes.find(
        (p) => p.id === participanteId,
      );

      if (!remover && !participante) {
        throw new Error("Escolha um participante do combate.");
      }

      await OBR.scene.items.updateItems([token.id], (rascunhos) => {
        for (const item of rascunhos) {
          if (remover) {
            delete item.metadata[CHAVE];
          } else {
            item.metadata[CHAVE] = {
              versao: 1,
              combateId,
              participanteId: participante!.id,
            };
          }
        }
      });

      setMensagem(
        remover
          ? `Vínculo removido de "${token.name}".`
          : `"${token.name}" vinculado a ${participante!.nome}.`,
      );
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível alterar o vínculo.",
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="bloco vinculo-token">
      <h2>Vincular token</h2>

      <p>
        Selecione um token no mapa, escolha o participante
        e clique em Vincular.
      </p>

      <label htmlFor="participante-token">
        Participante do combate
      </label>

      <select
        id="participante-token"
        value={participanteId}
        onChange={(evento) => {
          setParticipanteId(evento.target.value);
          setMensagem("");
          setErro("");
        }}
        disabled={ocupado}
      >
        <option value="">Selecione…</option>

        {participantes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>

      <div className="botoes-vinculo">
        <button
          disabled={!pronto || ocupado || !participanteId}
          onClick={() => alterarVinculo(false)}
        >
          {ocupado ? "Aguarde…" : "Vincular token selecionado"}
        </button>

        <button
          className="secundario"
          disabled={!pronto || ocupado}
          onClick={() => alterarVinculo(true)}
        >
          Remover vínculo
        </button>
      </div>

      {!pronto && (
        <p>Abra a extensão dentro de uma sala do Owlbear.</p>
      )}

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