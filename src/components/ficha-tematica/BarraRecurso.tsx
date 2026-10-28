import type { CSSProperties, ReactNode } from "react";
import DecoracaoBarraRecurso from "./DecoracaoBarraRecurso";

type Props = {
  titulo: string;
  atual: number;
  maximo: number;
  cor: string;
  passo: number;
  temporario?: number;
  variante?: "normal" | "resumida";
  salvando?: boolean;
  onSomar?: (variacao: number) => void | Promise<void>;
  conteudoCentro?: ReactNode;
};

export default function BarraRecurso({
  titulo,
  atual,
  maximo,
  cor,
  passo,
  temporario = 0,
  variante = "normal",
  salvando = false,
  onSomar,
  conteudoCentro,
}: Props) {
  const resumida = variante === "resumida";

  const percentual =
    maximo > 0
      ? Math.max(0, Math.min(100, (atual / maximo) * 100))
      : 0;

  function seta(variacao: number, simbolo: string) {
    if (!onSomar) return null;

    return (
      <button
        type="button"
        disabled={salvando}
        aria-label={
          `${variacao < 0 ? "Diminuir" : "Aumentar"} ` +
          `${Math.abs(variacao)} de ${titulo}`
        }
        onClick={() => void onSomar(variacao)}
      >
        {simbolo}
      </button>
    );
  }

  const valor = (
    <strong
      className={resumida ? undefined : "pl-recurso-valor"}
    >
      {atual} / {maximo}

      {temporario > 0 && (
  <small
    className={
      resumida
        ? "frc-excedente"
        : "pl-recurso-excedente"
    }
    title={`${titulo} temporária restante: ${temporario}`}
    aria-label={`${temporario} pontos temporários restantes`}
  >
    +{temporario}
  </small>
)}

      {atual > maximo && (
        <small
          className={
            resumida
              ? "frc-excedente"
              : "pl-recurso-excedente"
          }
        >
          +{atual - maximo}
        </small>
      )}
    </strong>
  );

  return (
    <div
      className={
        resumida
          ? "frc-recurso frc-recurso-tematico frc-barra-editavel"
          : "pl-barra"
      }
      style={
        resumida
          ? undefined
          : ({
              "--recurso": cor,
              "--percentual": `${percentual}%`,
            } as CSSProperties)
      }
    >
      <DecoracaoBarraRecurso />

      {resumida && (
        <span
          className="frc-recurso-preenchimento"
          style={{
            width: `${percentual}%`,
            background: cor,
          }}
        />
      )}

      {seta(-passo, "«")}
      {seta(-1, "‹")}

      {resumida ? (
        <div className="frc-recurso-centro">
          {conteudoCentro ?? valor}
        </div>
      ) : (
        conteudoCentro ?? valor
      )}

      {seta(1, "›")}
      {seta(passo, "»")}
    </div>
  );
}