import type {
  AtributoOrdem2,
  DadoOrdem2,
} from "./regras";

import {
  resolverDanoAtaqueOrdem2,
  type AtaqueOrdem2,
} from "./combate";

import {
  rolarTesteOrdem2,
  validarExpressaoOrdem2,
  type ResultadoOrdem2,
} from "./rolagens";

export type DadoCriaturaOrdem2 = DadoOrdem2 | 20;

export type PericiaCriaturaOrdem2 = {
  id: string;
  nome: string;
  atributo: AtributoOrdem2;
  treino: DadoOrdem2;
  dadosExtras: string;
};

export type AtaqueCriaturaOrdem2 = AtaqueOrdem2 & {
  alcance: string;
  quantidade: number;
};

export type HabilidadeCriaturaOrdem2 = {
  id: string;
  nome: string;
  descricao: string;
  ataques: AtaqueCriaturaOrdem2[];
};

export type EstadoCriaturaOrdem2 = {
  versao: 1;
  atributos: Record<AtributoOrdem2, DadoCriaturaOrdem2>;
  pericias: PericiaCriaturaOrdem2[];
  acoes: HabilidadeCriaturaOrdem2[];
  poderes: HabilidadeCriaturaOrdem2[];
};

export const NOMES_ATRIBUTOS_CRIATURA = {
  fisico: "Físico",
  mente: "Mente",
  presenca: "Presença",
};

function juntar(...partes: string[]) {
  return partes
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte, indice) =>
      indice === 0 || /^[+-]/.test(parte)
        ? parte
        : `+${parte}`,
    )
    .join("");
}

export function rolarAtributoCriaturaOrdem2(
  estado: EstadoCriaturaOrdem2,
  atributo: AtributoOrdem2,
) {
  return rolarTesteOrdem2(
    NOMES_ATRIBUTOS_CRIATURA[atributo],
    [estado.atributos[atributo]],
    "",
    true,
  );
}

export function rolarPericiaCriaturaOrdem2(
  estado: EstadoCriaturaOrdem2,
  pericia: PericiaCriaturaOrdem2,
) {
  return rolarTesteOrdem2(
    pericia.nome,
    [
      estado.atributos[pericia.atributo],
      pericia.treino,
    ],
    pericia.dadosExtras,
    true,
  );
}

export function rolarAtaqueCriaturaOrdem2(
  estado: EstadoCriaturaOrdem2,
  ataque: AtaqueCriaturaOrdem2,
) {
  const pericia = estado.pericias.find(
    (item) => item.id === ataque.periciaChave,
  );

  if (!pericia) {
    throw new Error(
      "A perícia deste ataque não foi encontrada.",
    );
  }

  if (!ataque.nome.trim()) {
    throw new Error("Informe o nome do ataque no site.");
  }

  if (!ataque.dano.trim()) {
    throw new Error("Informe o dano do ataque no site.");
  }

  if (
    !Number.isSafeInteger(ataque.quantidade) ||
    ataque.quantidade < 1 ||
    ataque.quantidade > 100
  ) {
    throw new Error("Use de 1 a 100 ataques.");
  }

  const extras = juntar(
    pericia.dadosExtras,
    ataque.bonus,
    ataque.dadosAdicionais,
  );

  validarExpressaoOrdem2(ataque.dano);
  validarExpressaoOrdem2(extras);

  for (const adicional of ataque.danosAdicionais ?? []) {
    if (!adicional.dano.trim()) {
      throw new Error(
        "Preencha ou remova o dano adicional vazio no site.",
      );
    }

    validarExpressaoOrdem2(
      adicional.dano.replace(/\b(RA|RB)\b/gi, "0"),
    );
  }

  const resultado = rolarTesteOrdem2(
    ataque.nome,
    [
      estado.atributos[ataque.atributo],
      pericia.treino,
    ],
    extras,
    true,
  );

  return resolverDanoAtaqueOrdem2(
    {
      ...ataque,
      danosAdicionais: ataque.danosAdicionais ?? [],
    },
    resultado,
  );
}

export function textoResultadoCriaturaOrdem2(
  resultado: ResultadoOrdem2,
) {
  const linhas = [
    resultado.nome,
    `Teste: ${resultado.calculo} = ${resultado.total}`,
    `RA: ${resultado.ra} · RB: ${resultado.rb}`,
  ];

  if (resultado.combate) {
    const combate = resultado.combate;

    if (combate.critico) {
      linhas.push("Crítico Ordem 2");
    }

    if (combate.falhaCritica) {
      linhas.push("Falha crítica");
    }

    linhas.push(
      `Dano (${combate.tipo}): ${combate.calculoDano}`,
    );

    for (const adicional of combate.adicionais) {
      linhas.push(
        `Adicional (${adicional.tipo}): ${adicional.calculo}`,
      );
    }

    linhas.push(`Dano total: ${combate.danoTotal}`);
  }

  return linhas.join("\n");
}