function sortearDado(faces: number): number {
  const limite = Math.floor(4294967296 / faces) * faces;
  const valores = new Uint32Array(1);

  do {
    crypto.getRandomValues(valores);
  } while (valores[0] >= limite);

  return (valores[0] % faces) + 1;
}

function rolarExpressaoDano(expressao: string) {
  const texto = expressao.trim().toLowerCase();

  const formato =
    /^[+-]?\s*(?:\d*d\d+|\d+)(?:\s*[+-]\s*(?:\d*d\d+|\d+))*$/;

  if (!formato.test(texto)) {
    throw new Error(`Dano inválido: "${expressao}". Use 2d6 + d4 - 3.`);
  }

  const termos = texto.replace(/\s+/g, "").match(/[+-]?[^+-]+/g) ?? [];
  let quantidadeTotal = 0;

  // Valida os termos antes de rolar.
  for (const termo of termos) {
    const conteudo = termo.replace(/^[+-]/, "");

    if (conteudo.includes("d")) {
      const [quantidadeTexto, facesTexto] = conteudo.split("d");
      const quantidade = Number(quantidadeTexto || "1");
      const faces = Number(facesTexto);

      if (
        !Number.isSafeInteger(quantidade) || quantidade < 1 ||
        !Number.isSafeInteger(faces) || faces < 2 || faces > 1000000
      ) {
        throw new Error("Quantidade ou lados do dado inválidos.");
      }

      quantidadeTotal += quantidade;

      if (quantidadeTotal > 100) {
        throw new Error("Use até 100 dados por expressão.");
      }
    } else if (!Number.isSafeInteger(Number(conteudo))) {
      throw new Error("Número inteiro muito grande.");
    }
  }

  let total = 0;
  const partes: string[] = [];

  for (const termo of termos) {
    const sinal = termo.startsWith("-") ? -1 : 1;
    const conteudo = termo.replace(/^[+-]/, "");
    const prefixo = partes.length === 0
      ? sinal < 0 ? "− " : ""
      : sinal < 0 ? " − " : " + ";

    if (conteudo.includes("d")) {
      const [quantidadeTexto, facesTexto] = conteudo.split("d");
      const quantidade = Number(quantidadeTexto || "1");
      const faces = Number(facesTexto);
      const valores = Array.from(
        { length: quantidade },
        () => sortearDado(faces)
      );

      total += sinal * valores.reduce((soma, valor) => soma + valor, 0);
      partes.push(
        `${prefixo}${quantidade}d${faces} [${valores.join(", ")}]`
      );
    } else {
      const valor = Number(conteudo);
      total += sinal * valor;
      partes.push(`${prefixo}${valor}`);
    }

    if (!Number.isSafeInteger(total)) {
      throw new Error("Resultado acima do limite permitido.");
    }
  }

  return { total, detalhes: partes.join("") };
}

export type AtaqueCriatura = {
  nome: string;
  dados: number;
  bonus: number;
  critico: number;
  multiplicador: number;
  dano: string;
  tipo: string;
  danosAdicionais?: {
    dano: string;
    tipo: string;
  }[];
};

export function rolarAtaqueCriatura(
  ataque: AtaqueCriatura,
): string {
  const quantidade =
    ataque.dados > 0
      ? ataque.dados
      : 2 + Math.abs(ataque.dados);

  if (
    !Number.isSafeInteger(ataque.dados) ||
    quantidade > 100 ||
    !Number.isSafeInteger(ataque.bonus) ||
    !Number.isInteger(ataque.critico) ||
    ataque.critico < 1 ||
    ataque.critico > 20 ||
    !Number.isSafeInteger(ataque.multiplicador) ||
    ataque.multiplicador < 1
  ) {
    throw new Error("Confira os dados, bônus e crítico do ataque.");
  }

  const valores = Array.from(
    { length: quantidade },
    () => sortearDado(20),
  );

  const pior = ataque.dados <= 0;

  const natural = pior
    ? Math.min(...valores)
    : Math.max(...valores);

  const acerto = natural + ataque.bonus;

  const critico =
    ataque.multiplicador > 1 &&
    natural >= ataque.critico;

  const principal = rolarExpressaoDano(ataque.dano);
  const multiplicador = critico ? ataque.multiplicador : 1;
  const danoPrincipal = principal.total * multiplicador;

  let totalDano = danoPrincipal;

  const linhas = [
    `Teste${critico ? " · CRÍTICO!" : ""}: ` +
      `[${valores.join(", ")}] · ${pior ? "Menor" : "Maior"}: ` +
      `${natural} ${ataque.bonus < 0 ? "−" : "+"} ` +
      `${Math.abs(ataque.bonus)} = ${acerto}`,

    `Dano principal · ${ataque.tipo || "sem tipo"}: ` +
      principal.detalhes +
      (critico
        ? ` → ${principal.total} × ${multiplicador}`
        : "") +
      ` = ${danoPrincipal}`,
  ];

  for (const extra of ataque.danosAdicionais ?? []) {
    const dano = rolarExpressaoDano(extra.dano);

    totalDano += dano.total;

    linhas.push(
      `Dano adicional · ${extra.tipo || "sem tipo"}: ` +
        `${dano.detalhes} = ${dano.total}`,
    );
  }

  if (
    !Number.isSafeInteger(acerto) ||
    !Number.isSafeInteger(danoPrincipal) ||
    !Number.isSafeInteger(totalDano)
  ) {
    throw new Error("Resultado acima do limite permitido.");
  }

  linhas.push(
    `Dano total: Dano principal após o crítico + danos adicionais = ${totalDano}`,
  );

  return linhas.join("\n");
}