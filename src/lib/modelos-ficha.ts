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
  nome:string; elemento?:string; circulo?: string; imagens?:string[];
  execucao?:string; alcance?:string; alvo?:string; area?:string;
  duracao?:string; resistencia?:string; descricao?:string;
  aprimoramentos?:{nome:string;custo?:string;descricao:string}[];
  dados?:{nome:string;dados:string}[];
};
export type ConteudoFicha = {
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
