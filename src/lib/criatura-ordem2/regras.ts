export const DADOS_ORDEM2 = [4, 6, 8, 10, 12] as const;

export type DadoOrdem2 = (typeof DADOS_ORDEM2)[number];

export type AtributoOrdem2 =
  | "fisico"
  | "mente"
  | "presenca";