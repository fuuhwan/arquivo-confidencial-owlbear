import { useState } from "react";
import BarraRecurso from "./components/ficha-tematica/BarraRecurso";
import type { CampoRecurso } from "./lib/editar-recurso";

type Props = {
  campo: "vida" | "determinacao";
  atual: number;
  maximo: number;
  temporarioTotal?: number;
  temporarioAtual?: number;
  permiteTemporario: boolean;
  salvando: boolean;
  editar: (
    campo: CampoRecurso,
    valor: number,
    modo: "somar" | "definir",
  ) => Promise<void>;
};

export default function RecursoResumoOrdem2({
  campo,
  atual,
  maximo,
  temporarioTotal = 0,
  temporarioAtual = 0,
  permiteTemporario,
  salvando,
  editar,
}: Props) {
  const [passo, setPasso] = useState(5);
  const vida = campo === "vida";
  const titulo = vida ? "Vida" : "PD";

  return (
    <section className="frc-recurso-grupo">
      <h3>{titulo}</h3>

      <BarraRecurso
        titulo={titulo}
        atual={atual}
        maximo={maximo}
        cor={vida ? "#a71928" : "#007f9b"}
        passo={passo}
        variante="resumida"
        salvando={salvando}
        temporario={temporarioAtual}
        onSomar={(valor) => editar(campo, valor, "somar")}
        conteudoCentro={
          <strong>
            {vida ? "V.A." : "D.A."} {atual} /{" "}
            {vida ? "V.M." : "D.M."} {maximo}

            {temporarioAtual > 0 && (
              <small className="frc-excedente">
                +{temporarioAtual}
              </small>
            )}
          </strong>
        }
      />

      <details className="frc-edicao-recurso">
        <summary>Editar valores</summary>

        <div className="frc-edicao-recurso-campos">
          <label>
            <span>Passos</span>

            <input
              type="number"
              min={1}
              step={1}
              value={passo}
              onChange={(evento) => {
                const valor = evento.target.valueAsNumber;

                if (Number.isSafeInteger(valor) && valor >= 1) {
                  setPasso(valor);
                }
              }}
            />
          </label>

          <label>
            <span>Valor atual</span>

            <input
              key={`atual-${atual}`}
              type="number"
              step={1}
              defaultValue={atual}
              disabled={salvando}
              onKeyDown={(evento) => {
                if (evento.key === "Enter") {
                  evento.currentTarget.blur();
                }

                if (evento.key === "Escape") {
                  evento.currentTarget.value = String(atual);
                  evento.currentTarget.blur();
                }
              }}
              onBlur={(evento) => {
                const input = evento.currentTarget;
                const valor = input.valueAsNumber;

                if (!Number.isSafeInteger(valor)) {
                  input.value = String(atual);
                  return;
                }

                if (valor !== atual) {
                  void editar(campo, valor, "definir");
                }
              }}
            />
          </label>

          {permiteTemporario && (
            <label>
              <span>Temporário total</span>

              <input
                key={`temporario-${temporarioTotal}`}
                type="number"
                min={0}
                step={1}
                defaultValue={temporarioTotal}
                disabled={salvando}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter") {
                    evento.currentTarget.blur();
                  }

                  if (evento.key === "Escape") {
                    evento.currentTarget.value =
                      String(temporarioTotal);

                    evento.currentTarget.blur();
                  }
                }}
                onBlur={(evento) => {
                  const input = evento.currentTarget;
                  const valor = input.valueAsNumber;

                  if (
                    !Number.isSafeInteger(valor) ||
                    valor < 0
                  ) {
                    input.value = String(temporarioTotal);
                    return;
                  }

                  if (valor !== temporarioTotal) {
                    void editar(
                      vida
                        ? "vidaTemporaria"
                        : "determinacaoTemporaria",
                      valor,
                      "definir",
                    );
                  }
                }}
              />

              <small>Restantes: {temporarioAtual}</small>
            </label>
          )}
        </div>
      </details>
    </section>
  );
}