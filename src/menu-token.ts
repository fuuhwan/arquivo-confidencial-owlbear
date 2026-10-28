import OBR from '@owlbear-rodeo/sdk';
const MENU_ID='br.arquivo-confidencial.owlbear/abrir-ficha';
const PAINEL_ID='br.arquivo-confidencial.owlbear/painel-ficha';
export function iniciarMenuToken() {
  if(!OBR.isAvailable)return;
  const canalId=`arquivo-ficha-${crypto.randomUUID()}`;
  const canal=new BroadcastChannel(canalId);
  let ultimaSelecao: string[] = [];
  let tokenAtual='',posicao={left:24,top:70},abrindo=false;
  async function abrir(tokenId:string,mover=false) {
    if(abrindo)return;
    abrindo=true;
    try {
      const [largura,altura]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
      const width=Math.max(280,Math.min(720,largura-32));
      const height=Math.max(300,Math.min(760,altura-32));
      posicao={left:Math.max(8,Math.min(posicao.left,Math.max(8,largura-width-8))),top:Math.max(8,Math.min(posicao.top,Math.max(8,altura-height-8)))};
      const url=new URL(import.meta.env.BASE_URL,location.origin);
      url.searchParams.set('token',tokenId);url.searchParams.set('canal',canalId);
      await OBR.popover.close(PAINEL_ID);
      await OBR.popover.open({id:PAINEL_ID,url:url.toString(),width,height,anchorReference:'POSITION',anchorPosition:posicao,anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},transformOrigin:{horizontal:'LEFT',vertical:'TOP'},disableClickAway:true,marginThreshold:8});
      tokenAtual=tokenId;
      if(mover)sessionStorage.setItem('arquivo-posicao-ficha',JSON.stringify(posicao));
    } finally {abrindo=false;}
  }
  canal.onmessage=evento=>{
    const d=evento.data;
    if(d?.tipo!=='mover'||d.token!==tokenAtual||!Number.isFinite(d.dx)||!Number.isFinite(d.dy))return;
    posicao={left:posicao.left+d.dx,top:posicao.top+d.dy};
    void abrir(tokenAtual,true).catch(console.error);
  };
  try {const salvo=JSON.parse(sessionStorage.getItem('arquivo-posicao-ficha')||'null');if(Number.isFinite(salvo?.left)&&Number.isFinite(salvo?.top))posicao=salvo;}catch{/* Posição padrão. */}
  
  let abrindoIniciativa = false;

async function abrirIniciativa() {
  if (abrindoIniciativa) return;
  abrindoIniciativa = true;

  try {
    const [largura, altura] = await Promise.all([
      OBR.viewport.getWidth(),
      OBR.viewport.getHeight(),
    ]);

    const url = new URL(
      import.meta.env.BASE_URL,
      location.origin,
    );

    url.searchParams.set("painel", "iniciativa");

    const id =
      "br.arquivo-confidencial.owlbear/painel-iniciativa";

    await OBR.popover.close(id);

    await OBR.popover.open({
      id,
      url: url.toString(),
      width: Math.max(280, Math.min(440, largura - 32)),
      height: Math.max(300, Math.min(700, altura - 32)),
      anchorReference: "POSITION",
      anchorPosition: { left: 20, top: 60 },
      anchorOrigin: {
        horizontal: "LEFT",
        vertical: "TOP",
      },
      transformOrigin: {
        horizontal: "LEFT",
        vertical: "TOP",
      },
      disableClickAway: true,
      marginThreshold: 8,
    });
  } finally {
    abrindoIniciativa = false;
  }
}
  OBR.onReady(()=>{
    void OBR.tool
  .create({
    id: "br.arquivo-confidencial.owlbear/ferramenta-iniciativa",
    icons: [
      {
        icon: `${import.meta.env.BASE_URL}iniciativa.svg`,
        label: "Iniciativa e combate",
      },
    ],
    onClick() {
      void abrirIniciativa().catch(console.error);
      return false;
    },
  })
  .catch(console.error);
    OBR.player.onChange((jogador) => {
  const selecao = jogador.selection;

  if (selecao && selecao.length > 0) {
    ultimaSelecao = [...selecao];
  }
});

OBR.scene.onReadyChange(() => {
  ultimaSelecao = [];
});

void OBR.player.getSelection()
  .then((selecao) => {
    if (selecao?.length) {
      ultimaSelecao = [...selecao];
    }
  })
  .catch(console.error);
    void OBR.tool.create({
  id: "br.arquivo-confidencial.owlbear/ferramenta-ficha",
  icons: [
    {
      icon: `${import.meta.env.BASE_URL}ficha.svg`,
      label: "Abrir ficha do token · Shift+F",
    },
  ],
  shortcut: "shift+f",
  onClick() {
    void (async () => {
      if (!(await OBR.scene.isReady())) return;

      const selecaoAtual = await OBR.player.getSelection();

const selecao =
  selecaoAtual && selecaoAtual.length > 0
    ? selecaoAtual
    : ultimaSelecao;

      if (!selecao || selecao.length !== 1) {
        await OBR.notification.show(
          "Selecione exatamente um token para abrir a ficha.",
          "INFO",
        );
        return;
      }

      const itens = await OBR.scene.items.getItems(selecao);
      const token = itens[0];

      if (
        !token ||
        token.type !== "IMAGE" ||
        token.layer !== "CHARACTER"
      ) {
        await OBR.notification.show(
          "Selecione um token da camada Personagem.",
          "INFO",
        );
        return;
      }

      await abrir(token.id);
    })().catch(console.error);

    return false;
  },
}).catch(console.error);
    void OBR.contextMenu.create({id:MENU_ID,icons:[{icon: `${import.meta.env.BASE_URL}ficha.svg`,label:'Abrir ficha · Shift+F',filter:{min:1,max:1,every:[{key:'type',value:'IMAGE'},{key:'layer',value:'CHARACTER'}]}}],onClick(contexto) {
  console.log(
    "[Arquivo Confidencial] Abrir ficha acionado",
    contexto.items,
  );

  const token = contexto.items[0];

  if (token) {
    void abrir(token.id).catch(console.error);
  }
}}).catch(console.error);
  });
}
