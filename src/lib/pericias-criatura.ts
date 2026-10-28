import type {
  ConteudoFicha,
  PericiaVisual,
} from "./modelos-ficha";

type Atributo = "fisico" | "mente" | "presenca";

export function atributoPericiaCriatura(
  nome: string,
): Atributo | null {
  const normalizado = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  const mapa: Record<string, Atributo> = {
    percepcao: "mente",
    reacao: "fisico",
    vigor: "fisico",
    vontade: "presenca",
  };

  return mapa[normalizado] ?? null;
}

export function dadosPericiaCriatura(
  ficha: ConteudoFicha,
  pericia: PericiaVisual,
): number {
  const atributo = atributoPericiaCriatura(pericia.nome);

  // Mesma regra do site: perícias adicionais e registros
  // sem extras válidos conservam seus dados próprios.
  if (
    !atributo ||
    !Number.isSafeInteger(pericia.dadosExtras)
  ) {
    return pericia.dados;
  }

  return (
    (ficha.atributos?.[atributo] ?? 0) +
    pericia.dadosExtras!
  );
}