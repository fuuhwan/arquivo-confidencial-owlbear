import OBR, {
  buildPath,
  buildText,
  Command,
} from "@owlbear-rodeo/sdk";
import type {
  Item,
  PathCommand,
} from "@owlbear-rodeo/sdk";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, database } from "./lib/firebase";

const VINCULO = "br.arquivo-confidencial.owlbear/vinculo";
const BARRA = "br.arquivo-confidencial.owlbear/barra-local";

type Recursos = {
  categoria: "personagem" | "npc" | "ameaca";
  vida: number;
  vidaMax: number;
  determinacao: number;
  determinacaoMax: number;
};

type Meta = {
  id: string;
  participantes?: Record<
    string,
    {
      jogadorUid?: string;
      usoPublicoLiberado?: boolean;
    }
  >;
};

type Observador = {
  assinatura: string;
  valor: Recursos | null;
  desligar: () => void;
};



export function iniciarBarrasToken() {
  if (!OBR.isAvailable) return;

  OBR.onReady(() => {
    let meta: Meta | null = null;
    let usuario = "";
    let revisao = 0;
    let executando = false;
    let pendente = false;

    let desligarCombate: () => void = () => {};

    const observadores = new Map<string, Observador>();

    function limpar() {
      observadores.forEach((o) => o.desligar());
      observadores.clear();
    }

    function agendar() {
      revisao++;
      pendente = true;

      if (!executando) {
        void executar();
      }
    }

    async function executar() {
      executando = true;

      try {
        while (pendente) {
          pendente = false;

          try {
            await atualizar();
          } catch (erro) {
            console.error("[Barras dos tokens]", erro);

console.error(
  "[Barras] Detalhe:",
  JSON.stringify(
    erro,
    (_chave, valor) => {
      if (valor instanceof Error) {
        return {
          ...valor,
          name: valor.name,
          message: valor.message,
          stack: valor.stack,
        };
      }

      return valor;
    },
    2,
  ),
);
          }
        }
      } finally {
        executando = false;
      }
    }

    async function atualizar() {
      const versao = revisao;

      if (
        !(await OBR.scene.isReady()) ||
        versao !== revisao
      ) {
        return;
      }

      const itens = await OBR.scene.items.getItems();

      const locais = await OBR.scene.local.getItems(
        (item) => item.metadata[BARRA] === true,
      );

      const dpi = await OBR.scene.grid.getDpi();

      if (versao !== revisao) return;

      const desejados = new Map<string, Item>();
      const caminhos = new Set<string>();

      for (const token of itens) {
        if (
          !usuario ||
          !meta ||
          token.type !== "IMAGE" ||
          token.layer !== "CHARACTER" ||
          !token.visible
        ) {
          continue;
        }

        const vinculo = token.metadata[VINCULO] as
          | {
              versao?: number;
              combateId?: string;
              participanteId?: string;
            }
          | undefined;

        if (
          vinculo?.versao !== 1 ||
          vinculo.combateId !== meta.id ||
          !vinculo.participanteId
        ) {
          continue;
        }

        const participante =
          meta.participantes?.[vinculo.participanteId];

        if (!participante) continue;

        const caminho =
          `combateBarras/${meta.id}/${vinculo.participanteId}`;

        caminhos.add(caminho);

        // Reinicia a leitura quando dono ou cadeado mudarem.
        const assinatura = JSON.stringify([
          usuario,
          participante.jogadorUid,
          participante.usoPublicoLiberado,
        ]);

        let observador = observadores.get(caminho);

        if (
          !observador ||
          observador.assinatura !== assinatura
        ) {
          observador?.desligar();

          const novo: Observador = {
            assinatura,
            valor: null,
            desligar: () => {},
          };

          observadores.set(caminho, novo);
          observador = novo;

          novo.desligar = onValue(
            ref(database, caminho),
            (snapshot) => {
              if (observadores.get(caminho) !== novo) return;

              const recursos = snapshot.val() as Recursos | null;

              novo.valor =
                recursos &&
                [
                  recursos.vida,
                  recursos.vidaMax,
                  recursos.determinacao,
                  recursos.determinacaoMax,
                ].every(Number.isFinite)
                  ? recursos
                  : null;

              agendar();
            },
            (erro) => {
  if (observadores.get(caminho) !== novo) return;

  console.warn(
    "[Barras] Leitura bloqueada:",
    caminho,
    erro.message,
  );

  novo.valor = null;
  agendar();
},
          );
        }

        const recursos = observador.valor;

        if (!recursos) continue;

        const limites =
          await OBR.scene.items.getItemBounds([token.id]);

        if (versao !== revisao) return;

        const largura = Math.max(
  dpi * 0.9,
  Math.min(dpi * 1.35, limites.width * 0.65),
);

        const escala = largura / 420;

const x = limites.center.x - largura / 2;
const y = limites.max.y - dpi * 0.05;

const assinaturaBase = JSON.stringify([
  recursos,
  x,
  y,
  largura,
  dpi,
  token.zIndex,
]);

function registrar(
  parte: string,
  item: Item,
  ordem: number,
) {
  const anterior = locais.find(
    (local) =>
      local.metadata.token === token.id &&
      local.metadata.parte === parte,
  );

  const id = anterior?.id ?? crypto.randomUUID();

  const pronto: Item = {
    ...item,
    id,
    name: "Vida e Determinação",
    layer: "ATTACHMENT",
    attachedTo: token.id,
    disableAttachmentBehavior: [
      "ROTATION",
      "SCALE",
      "COPY",
    ],
    locked: true,
    disableHit: true,
    disableAutoZIndex: true,
    zIndex: token.zIndex + 10000 + ordem,
    metadata: {
      [BARRA]: true,
      token: token.id,
      parte,
      assinatura: `${assinaturaBase}:${parte}`,
    },
  };

  desejados.set(id, pronto);
}

// Coordenadas do desenho: largura de 420 unidades.
const centroX = 210;
const centroY = 5;

function segmento(
  inicio: number,
  fim: number,
): PathCommand[] {
  const comandos: PathCommand[] = [];
  const passos = 24;

  // Borda externa da faixa curva.
  for (let i = 0; i <= passos; i++) {
    const angulo =
      inicio + (fim - inicio) * (i / passos);

    const px = centroX + Math.cos(angulo) * 190;
    const py = centroY + Math.sin(angulo) * 70;

    comandos.push([
      i === 0 ? Command.MOVE : Command.LINE,
      px,
      py,
    ]);
  }

  // Retorna pela borda interna.
  for (let i = passos; i >= 0; i--) {
    const angulo =
      inicio + (fim - inicio) * (i / passos);

    comandos.push([
      Command.LINE,
      centroX + Math.cos(angulo) * 162,
      centroY + Math.sin(angulo) * 45,
    ]);
  }

  comandos.push([Command.CLOSE]);
  return comandos;
}

function arco(
  parte: string,
  inicio: number,
  fim: number,
  cor: string,
  contorno: boolean,
  ordem: number,
) {
  const item = buildPath()
    .commands(segmento(inicio, fim))
    .fillColor(cor)
    .fillOpacity(1)
    .strokeColor("#b7a279")
    .strokeOpacity(contorno ? 1 : 0)
    .strokeWidth(2)
    .scale({ x: escala, y: escala })
    .position({ x, y })
    .build();

  registrar(parte, item, ordem);
}

function proporcao(atual: number, maximo: number) {
  return maximo > 0
    ? Math.max(0, Math.min(1, atual / maximo))
    : 0;
}

const temPD = recursos.determinacaoMax > 0;

// Com PD, Vida ocupa a metade esquerda.
// Sem PD, ocupa a curva inteira.
const inicioVida = Math.PI;
const fimVida = temPD ? Math.PI / 2 : 0;

arco(
  "vida-fundo-curvo",
  inicioVida,
  fimVida,
  "#151515",
  true,
  0,
);

const vidaPercentual = proporcao(
  recursos.vida,
  recursos.vidaMax,
);

if (vidaPercentual > 0) {
  arco(
    "vida-preenchimento-curvo",
    inicioVida,
    inicioVida +
      (fimVida - inicioVida) * vidaPercentual,
    "#b32932",
    false,
    1,
  );
}

// Determinação: curva da direita para o centro.
if (recursos.determinacaoMax > 0) {
  arco(
    "pd-fundo-curvo",
    0,
    Math.PI / 2,
    "#151515",
    true,
    0,
  );

  const pdPercentual = proporcao(
    recursos.determinacao,
    recursos.determinacaoMax,
  );

  if (pdPercentual > 0) {
    arco(
      "pd-preenchimento-curvo",
      0,
      (Math.PI / 2) * pdPercentual,
      "#246eb8",
      false,
      1,
    );
  }
}



// Valores abaixo das curvas.
function valorCurvo(
  parte: string,
  texto: string,
  esquerda: boolean,
  cor: string,
) {
  const item = buildText()
    .plainText(texto)
    .textType("PLAIN")
    .width((temPD ? 210 : 420) * escala)
    .height(30 * escala)
    .padding(0)
    .fontFamily("Arial")
    .fontSize(22 * escala)
    .fontWeight(800)
    .textAlign("CENTER")
    .textAlignVertical("MIDDLE")
    .lineHeight(1)
    .fillColor(cor)
    .fillOpacity(1)
    .strokeColor("#030303")
    .strokeOpacity(1)
    .strokeWidth(5 * escala)
    .position({
      x: x + (temPD && !esquerda ? 210 * escala : 0),
      y: y + 82 * escala,
    })
    .build();

  registrar(parte, item, 6);
}

valorCurvo(
  "valor-vida-curvo",
  `V.A. ${recursos.vida} / ${recursos.vidaMax}`,
  true,
  "#a80505",
);

if (recursos.determinacaoMax > 0) {
  valorCurvo(
    "valor-pd-curvo",
    `D.A. ${recursos.determinacao} / ${recursos.determinacaoMax}`,
    false,
    
    "#2891d8",
    
  );
}
      }

      if (versao !== revisao) return;

      for (const [caminho, observador] of observadores) {
        if (!caminhos.has(caminho)) {
          observador.desligar();
          observadores.delete(caminho);
        }
      }

      const remover = locais
        .filter((item) => !desejados.has(item.id))
        .map((item) => item.id);

      if (remover.length) {
        await OBR.scene.local.deleteItems(remover);
      }

      if (versao !== revisao) return;

      const existentes = new Set(
        locais.map((item) => item.id),
      );

      const adicionar = [...desejados.values()].filter(
        (item) => !existentes.has(item.id),
      );

      if (adicionar.length) {
        await OBR.scene.local.addItems(adicionar);
      }

      if (versao !== revisao) return;

      const alterar = locais.filter(
        (item) =>
          desejados.has(item.id) &&
          item.metadata.assinatura !==
            desejados.get(item.id)!.metadata.assinatura,
      );

      if (alterar.length) {
        await OBR.scene.local.updateItems(
          alterar,
          (rascunhos: Item[]) => {
            for (const item of rascunhos) {
              Object.assign(item, desejados.get(item.id)!);
            }
          },
        );
      }
    }

    onAuthStateChanged(auth, (atual) => {
        console.log("[Barras] Login no fundo:", Boolean(atual));
      desligarCombate();
      limpar();

      meta = null;
      usuario = atual?.uid ?? "";
      agendar();

      if (!atual) return;

      desligarCombate = onValue(
        ref(database, "combatePublico"),
        (snapshot) => {
          const dados = snapshot.val() as Meta | null;
          console.log(
  "[Barras] Combate:",
  dados?.id,
  "Participantes:",
  Object.keys(dados?.participantes ?? {}).length,
);

          if (meta?.id !== dados?.id) {
            limpar();
          }

          meta = dados;
          agendar();
        },
        () => {
          meta = null;
          limpar();
          agendar();
        },
      );
    });

    OBR.scene.items.onChange(agendar);
    OBR.scene.grid.onChange(agendar);

    OBR.scene.onReadyChange(() => {
      limpar();
      agendar();
    });

    agendar();
  });
}