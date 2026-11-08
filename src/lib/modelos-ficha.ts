export type MunicaoVisual = {
  id: string;
  nome: string;
  quantidade: number;
  unidade: "cena" | "turno" | "";
  restante: number;
  duracao: number;
};

export type PericiaVisual = {
  nome: string; atributo?: string; dados: number; bonus: number;
  dadosExtras?: number; treino?: number; outros?: number;
  informacoes?: string; descricao?: string;
  penalidadeCarga?: number; penalidadeProtecao?: number;
};
export type AtaqueVisual = {
  nome: string; imagens?: string[]; alcance?: string; quantidade?: number;
  dados: number; bonus: number; bonusAtaque?: number; bonusPericia?: number;
  periciaNome?: string; acertoExtra?: string; dano: string; tipo: string;
  atributoDano?: number; atributoDanoNome?: string;
  critico: number; multiplicador: number;
  adicionais?: { dano: string; tipo: string; multiplicavel?: boolean }[];
};
export type HabilidadeVisual = {
  id?: string; nome: string; descricao?: string; fonte?: string;
  detalhes?: Record<string,string>; imagens?: string[];
  ataques?: { nome:string; alcance:string; quantidade:number; dados:number; bonus:number; critico:number; multiplicador:number; dano:string;tipo:string;danosAdicionais?:{dano:string;tipo:string}[] }[];
};
export type RitualVisual = {
  favorito?: boolean;
  nome:string; elemento?:string; circulo?: string; imagens?:string[];
  execucao?:string; alcance?:string; alvo?:string; area?:string;
  duracao?:string; resistencia?:string; descricao?:string;
  aprimoramentos?:{nome:string;custo?:string;descricao:string}[];
  dados?:{nome:string;dados:string}[];
};
export type ConteudoFicha = {
  sistemaCombate?: "normal" | "ordem2";
possuiOrdem2?: boolean;

ordem2Combate?: {
    equipamento?: {
    id: string;
    nome: string;
    quantidade?: number;
    imagens?: string[];
    descricao?: string;
    detalhes: Record<string, string>;
  }[];

  efeitosAtivos?: {
    id?: string;
    nome?: string;
    descricao?: string;
  }[];
  classe?: string;
  nivel?: number;
  nex?: number;
  afinidade?: string;
  pontosArmadura?: number;

  atributos: {
    fisico: number;
    mente: number;
    presenca: number;
  };

  pericias: {
    nome: string;
    atributo: "fisico" | "mente" | "presenca";
    treino: number;
    passo?: number | null;
    dadosExtras?: string;
    especialidadeAptidao?: string;
  }[];

  combateOrdem2?: {
    id: string;
    nome: string;
    dano: string;
    tipo: string;
    rolagemDano: "" | "RA" | "RB";
    danosAdicionais: {
      dano: string;
      tipo: string;
    }[];
    equipamento?: {
  id: string;
  nome: string;
  quantidade?: number;
  imagens?: string[];
  descricao?: string;
  detalhes: Record<string, string>;
}[];

efeitosAtivos?: {
  id?: string;
  nome?: string;
  descricao?: string;
}[];
  }[];

  habilidades?: {
    id: string;
    nome: string;
    descricao?: string;
  }[];

  rituais?: {
    id: string;
    nome: string;
    descricao?: string;
    descricaoRitual?: string;
    detalhes: Record<string, string>;
    dadosRituais?: {
      nome: string;
      dados: string;
    }[];
    imagens?: string[];
  }[];
} | null;
  transformacaoNpc?: {
  ativa: "original" | "transformada";
} | null;
  municoes?: MunicaoVisual[];
  nome:string;foto?:string;afinidade?:string;elemento?:string;
  classe?:string;nivel?:number;nex?:number;
  atributos?:{fisico:number;mente:number;presenca:number};
  agi?:number;for?:number;int?:number;pre?:number;vig?:number;
  defesa?:number;bloqueio?:number;esquiva?:number;deslocamento?:string|number;
  vidaAtual?:number;vidaMaxima?:number;
  vidaTemporariaTotal?:number;vidaTemporariaAtual?:number;
  determinacaoTemporariaTotal?:number;determinacaoTemporariaAtual?:number;
  pericias?:PericiaVisual[];periciasAdicionais?:PericiaVisual[];aptidoes?:PericiaVisual[];
  ataques?:AtaqueVisual[];acoes?:HabilidadeVisual[];poderes?:HabilidadeVisual[];
  habilidades?:HabilidadeVisual[];rituais?:RitualVisual[];
  efeitosAtivos?:{id?:string;nome?:string;descricao?:string}[];
};
