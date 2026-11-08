import {
  DADOS_ORDEM2,
  type DadoOrdem2,
} from "./regras";
type DadoEfetivoOrdem2 = {
  faces: DadoOrdem2;
  piorDeDois: boolean;
};
type DadoRolado = {
  faces: number;
  resultado: number;
  sinal: 1 | -1;
  consumido?: boolean;
};

export type ResultadoOrdem2 = {
  nome: string;
  pavor?: {
  valor: number;
  consumidos: DadoRolado[];
};
  tipoResultado?: "ritual";
  
  dados: DadoRolado[];
  total: number;
  ra: number;
  rb: number;
  calculo: string;
  combate?: {
  critico: boolean;
  falhaCritica: boolean;
  multiplicador: number;
  dano: number;
  tipo: string;
  calculoDano: string;
  adicionais: {
    tipo: string;
    valor: number;
    calculo: string;
  }[];
  danoTotal: number;
};
};

function rolarDado(faces: number): number {
  const intervalo = 0x100000000;
  const limite = intervalo - (intervalo % faces);
  const amostra = new Uint32Array(1);

  do {
    crypto.getRandomValues(amostra);
  } while (amostra[0] >= limite);

  return (amostra[0] % faces) + 1;
}

type TermoExtra =
  | {
      tipo: "dado";
      quantidade: number;
      faces: number;
      sinal: 1 | -1;
    }
  | {
      tipo: "numero";
      valor: number;
      sinal: 1 | -1;
    };

export function interpretarExtras(
  expressao: string,
): TermoExtra[] {
  const texto = expressao.replace(/\s+/g, "").toLowerCase();

  if (!texto) return [];

  if (texto.length > 1000) {
    throw new Error("A expressão de dados extras é muito longa.");
  }

  const padrao = /([+-]?)(?:(\d*)d(\d+)|(\d+))/gy;
  const termos: TermoExtra[] = [];
  let posicao = 0;

  while (posicao < texto.length) {
    padrao.lastIndex = posicao;
    const trecho = padrao.exec(texto);

    if (
      !trecho ||
      (posicao > 0 && trecho[1] === "")
    ) {
      throw new Error(
        "Expressão inválida. Exemplo: 1d4+1d8-2d6+3.",
      );
    }

    const sinal: 1 | -1 = trecho[1] === "-" ? -1 : 1;

    if (trecho[3] !== undefined) {
      const quantidade = Number(trecho[2] || "1");
      const faces = Number(trecho[3]);

      if (
        !Number.isSafeInteger(quantidade) ||
        quantidade < 1 ||
        quantidade > 100 ||
        !Number.isSafeInteger(faces) ||
        faces < 2 ||
        faces > 1000
      ) {
        throw new Error(
          "Use de 1 a 100 dados por termo, com 2 a 1000 faces.",
        );
      }

      termos.push({
        tipo: "dado",
        quantidade,
        faces,
        sinal,
      });
    } else {
      const valor = Number(trecho[4]);

      if (
        !Number.isSafeInteger(valor) ||
        valor > 1000000
      ) {
        throw new Error("Bônus numérico fora do limite.");
      }

      termos.push({ tipo: "numero", valor, sinal });
    }

    posicao = padrao.lastIndex;
  }

  return termos;
}
function aplicarPavorNoTeste(
  teste: ResultadoOrdem2,
  ativo: boolean,
): ResultadoOrdem2 {
  if (!ativo) return teste;

  const valor = rolarDado(6);

  const dados = teste.dados.map((dado) => ({
    ...dado,
    consumido: dado.resultado < valor,
  }));

  const consumidos = dados.filter(
    (dado) => dado.consumido,
  );

  const retirado = consumidos.reduce(
    (soma, dado) =>
      soma + dado.sinal * dado.resultado,
    0,
  );

  const total = teste.total - retirado;

  if (!Number.isSafeInteger(total)) {
    throw new Error("Resultado acima do limite.");
  }

  const positivos = dados
    .filter(
      (dado) =>
        !dado.consumido && dado.sinal === 1,
    )
    .map((dado) => dado.resultado);

  const listaConsumidos = consumidos.length
    ? consumidos
        .map(
          (dado) =>
            `${dado.sinal < 0 ? "-" : "+"}` +
            `1d${dado.faces} [${dado.resultado}]`,
        )
        .join(", ")
    : "Nenhum";

  return {
    ...teste,
    dados,
    total,
    ra: positivos.length
      ? Math.max(...positivos)
      : 0,
    rb: positivos.length
      ? Math.min(...positivos)
      : 0,

    pavor: {
      valor,
      consumidos,
    },

    calculo: [
      teste.calculo,
      `Dado de Pavor: 1d6 [${valor}]`,
      `Dados consumidos: ${listaConsumidos}`,
      `Total após o Pavor: ${total}`,
      ...(valor === 1
        ? ["Pavor desativado automaticamente."]
        : []),
    ].join("\n"),
  };
}
export function rolarTesteOrdem2(
  nome: string,
  faces: readonly (DadoOrdem2 | DadoEfetivoOrdem2 | 20)[],
  extras = "",
  permitirD20 = false,
  pavorAtivo = false,
): ResultadoOrdem2 {
    const bases: { faces: number; piorDeDois: boolean }[] = faces.map(
  (dado) =>
    typeof dado === "number"
      ? { faces: dado, piorDeDois: false }
      : dado,
);
 if (
  bases.length === 0 ||
  bases.some(
    (dado) =>
      (!DADOS_ORDEM2.some(faces => faces === dado.faces) && !(permitirD20 && dado.faces === 20)) ||
      (dado.piorDeDois && dado.faces !== 4),
  )
) {
  throw new Error("Dados inválidos para o teste.");
}

  // Valida toda a expressão antes de iniciar a rolagem.
  const termos = interpretarExtras(extras);

  const quantidade =
    bases.reduce(
  (soma, dado) => soma + (dado.piorDeDois ? 2 : 1),
  0,
) +
    termos.reduce(
      (soma, termo) =>
        soma + (termo.tipo === "dado" ? termo.quantidade : 0),
      0,
    );

  if (quantidade > 100) {
    throw new Error("O teste permite no máximo 100 dados.");
  }

  const dados: DadoRolado[] = [];
  const partes: string[] = [];
  let total = 0;

  function adicionarDado(faces: number, sinal: 1 | -1) {
    const resultado = rolarDado(faces);

    dados.push({ faces, resultado, sinal });
    total += sinal * resultado;

    partes.push(
      `${sinal < 0 ? "-" : "+"} 1d${faces} [${resultado}]`,
    );
  }

  for (const dado of bases) {
  if (!dado.piorDeDois) {
    adicionarDado(dado.faces, 1);
    continue;
  }

  const primeiro = rolarDado(4);
  const segundo = rolarDado(4);
  const escolhido = Math.min(primeiro, segundo);

  // Apenas o resultado escolhido participa do teste.
  dados.push({
    faces: 4,
    resultado: escolhido,
    sinal: 1,
  });

  total += escolhido;

  partes.push(
    `+ 2d4 [${primeiro}, ${segundo}] → menor ${escolhido}`,
  );
}

  for (const termo of termos) {
    if (termo.tipo === "dado") {
      for (let i = 0; i < termo.quantidade; i++) {
        adicionarDado(termo.faces, termo.sinal);
      }
    } else {
      total += termo.sinal * termo.valor;

      partes.push(
        `${termo.sinal < 0 ? "-" : "+"} ${termo.valor}`,
      );
    }
  }

  const positivos = dados
    .filter((dado) => dado.sinal === 1)
    .map((dado) => dado.resultado);

return aplicarPavorNoTeste(
  {
    nome,
    dados,
    total,
    ra: positivos.length
      ? Math.max(...positivos)
      : 0,
    rb: positivos.length
      ? Math.min(...positivos)
      : 0,
    calculo: partes
      .join(" ")
      .replace(/^\+\s*/, ""),
  },
  pavorAtivo,
);
}

export function validarExpressaoOrdem2(expressao: string) {
  const termos = interpretarExtras(expressao);

  const quantidade = termos.reduce(
    (soma, termo) =>
      soma + (termo.tipo === "dado" ? termo.quantidade : 0),
    0,
  );

  if (quantidade > 100) {
    throw new Error("A expressão permite no máximo 100 dados.");
  }

  return termos;
}

export function rolarExpressaoOrdem2(expressao: string) {
  const termos = validarExpressaoOrdem2(expressao);
  const partes: string[] = [];
  let total = 0;

  for (const termo of termos) {
    const sinal = termo.sinal < 0 ? "-" : "+";

    if (termo.tipo === "numero") {
      total += termo.sinal * termo.valor;
      partes.push(`${sinal} ${termo.valor}`);
      continue;
    }

    const resultados = Array.from(
      { length: termo.quantidade },
      () => rolarDado(termo.faces),
    );

    total +=
      termo.sinal *
      resultados.reduce((soma, resultado) => soma + resultado, 0);

    partes.push(
      `${sinal} ${termo.quantidade}d${termo.faces}` +
        ` [${resultados.join(", ")}]`,
    );
  }

  return {
    total,
    calculo:
      partes.join(" ").replace(/^\+\s*/, "") || "0",
  };
}