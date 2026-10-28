import { useRef,useState } from "react";

export default function CirculosVida({
  vida,
  marcas = [],
  onAlternar,
}: {
  vida: number;
  marcas?: boolean[];
  onAlternar?: (indice: number) => Promise<void>;
}) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const ocupado = useRef(false);

  async function alternar(indice: number) {
    if (!onAlternar || ocupado.current) return;

    ocupado.current = true;
    setSalvando(true);
    setErro("");

    try {
      await onAlternar(indice);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível salvar.",
      );
    } finally {
      ocupado.current = false;
      setSalvando(false);
    }
  }

  if (vida > 0) return null;

  return (
    <div className="circulos-vida">
      <style>{`
        .circulos-vida {
          margin: 8px 0 14px;
          text-align: center;
        }

        .circulos-vida-grupo {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .circulos-vida .circulos-vida-botao {
          display: block;
          width: 22px;
          height: 22px;
          min-width: 22px;
          padding: 0;
          border-radius: 50%;
          border: 1px solid #e4ddd0;
          background: transparent;
          cursor: pointer;
        }

        .circulos-vida .circulos-vida-botao[aria-pressed="true"] {
          background: #b82028;
          box-shadow: inset 0 0 0 3px #211c17;
        }

        .circulos-vida .circulos-vida-botao:disabled {
          opacity: 1;
          cursor: default;
        }

        .circulos-vida small {
          display: block;
          margin-top: 6px;
        }
      `}</style>

      <div className="circulos-vida-grupo" aria-label="Marcadores de Vida">
        {[0, 1, 2].map((indice) => (
          <button
            key={indice}
            type="button"
            className="circulos-vida-botao"
            aria-label={`Marcador de Vida ${indice + 1}`}
            aria-pressed={marcas[indice] === true}
            disabled={!onAlternar || salvando}
            onClick={() => void alternar(indice)}
          />
        ))}
      </div>

      {salvando && <small role="status">Salvando...</small>}
      {erro && <small role="alert">{erro}</small>}
    </div>
  );
}