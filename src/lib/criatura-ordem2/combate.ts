import {
  rolarExpressaoOrdem2,
  type ResultadoOrdem2,
} from "./rolagens";

import type { AtributoOrdem2 } from "./regras";

export type DanoAdicionalOrdem2 = {
  dano: string;
  tipo: string;
  multiplicavel: boolean;
  origemEquipamento?: boolean;
};

export type AtaqueOrdem2 = {
  id: string;
  nome: string;
  atributo: AtributoOrdem2;
  periciaChave: string;
  corpoACorpo: boolean;
  rolagemDano: "" | "RA" | "RB";
  bonus: string;
  dadosAdicionais: string;
  dano: string;
  tipo: string;
  danosAdicionais: DanoAdicionalOrdem2[];
};

export function resolverDanoAtaqueOrdem2(
  ataque: AtaqueOrdem2,
  resultado: ResultadoOrdem2,
  temPredadora = false,
): ResultadoOrdem2 {
const dadosValidos = resultado.dados.filter(
  (dado) => !dado.consumido,
);

const positivos = dadosValidos.filter(
  (dado) => dado.sinal === 1,
);

const grupos = new Map<number, number>();

for (const dado of positivos) {
  grupos.set(
    dado.resultado,
    (grupos.get(dado.resultado) ?? 0) + 1,
  );
}

const critico = [...grupos.entries()].some(
  ([valor, quantidade]) =>
    valor >= 6 && quantidade >= 2,
);

const falhaCritica =
  dadosValidos.length > 0 &&
  dadosValidos.every(
    (dado) => dado.resultado === 1,
  );

// Mantém a compatibilidade com a notificação,
// mas nenhum dano será multiplicado.
const multiplicador = 1;

const maiores = positivos
  .map((dado) => dado.resultado)
  .sort((a, b) => b - a);

const somaMaiores =
  (maiores[0] ?? 0) + (maiores[1] ?? 0);

const bonusCritico = temPredadora
  ? resultado.ra * 2
  : somaMaiores;

const bonusDano = critico
  ? bonusCritico
  : ataque.rolagemDano === "RA"
    ? resultado.ra
    : ataque.rolagemDano === "RB"
      ? resultado.rb
      : 0;

const descricaoBonusDano = critico
  ? `duas maiores (${maiores.slice(0, 2).join(" + ")})`
  : ataque.rolagemDano || "nenhum";

const danoRolado = rolarExpressaoOrdem2(
  ataque.dano,
);

const dano = danoRolado.total + bonusDano;

const adicionais = ataque.danosAdicionais.map(
  (adicional) => {
    const expressao = adicional.dano.replace(
      /\b(RA|RB)\b/gi,
      (termo) =>
        String(
          termo.toUpperCase() === "RA"
            ? resultado.ra
            : resultado.rb,
        ),
    );

    const rolagem = rolarExpressaoOrdem2(expressao);

    return {
      tipo: adicional.tipo,
      valor: rolagem.total,
      calculo:
        `${adicional.dano} → ` +
        `${rolagem.calculo} = ${rolagem.total}`,
    };
  },
);

if (critico) {
  resultado.calculo +=
    "\nSucesso crítico: passa automaticamente, " +
    "independentemente da DT.";
} else if (falhaCritica) {
  resultado.calculo +=
    "\nFalha crítica: falha automaticamente, " +
    "independentemente da DT. " +
    "A penalidade adicional é determinada pelo mestre.";
}

  return {
    ...resultado,

    combate: {
      critico,
      falhaCritica,
      multiplicador,
      dano,
      tipo: ataque.tipo,
            calculoDano:
        `(${danoRolado.calculo} = ${danoRolado.total})` +
        ` + bônus ${descricaoBonusDano}: ${bonusDano}` +
        ` = ${dano}`,

      adicionais,

      danoTotal:
        dano +
        adicionais.reduce(
          (soma, adicional) => soma + adicional.valor,
          0,
        ),
    },
  };
}