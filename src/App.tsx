import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import VinculoToken from "./VinculoToken";
import {
  auth,
  database,
  googleProvider,
} from "./lib/firebase";
import "./App.css";
import TokenSelecionado from "./TokenSelecionado";
import CabecalhoMovel from "./CabecalhoMovel";
import PainelIniciativa from "./PainelIniciativa";
type Participante = {
  id: string;
  tipo: "jogador" | "criatura";
  nome: string;
  conteudoHash?: string;
  iniciativa: number;
  acoes?: number;
  recursos?: {
    vida?: number;
    vidaMax?: number;
    determinacao?: number;
    determinacaoMax?: number;
  };
};

type Combate = {
  versao: number;
  id: string;
  turno: number;
  ativo?: string | null;
  vez?: string;
  participantes?: Record<string, Participante>;
};

function mensagemErro(erro: unknown) {
  return erro instanceof Error
    ? erro.message
    : "Ocorreu um erro inesperado.";
}

export default function App() {
  const tokenId = new URLSearchParams(
  window.location.search,
).get("token") || undefined;
const painelIniciativa =
  new URLSearchParams(window.location.search)
    .get("painel") === "iniciativa";
  const [usuario, setUsuario] = useState<User | null>(null);
  const [verificandoLogin, setVerificandoLogin] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [combate, setCombate] = useState<Combate | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      (atual) => {
        setUsuario(atual);
        setVerificandoLogin(false);
      },
      (falha) => {
        setErro(mensagemErro(falha));
        setVerificandoLogin(false);
      },
    );
  }, []);

  useEffect(() => {
    setCombate(null);
    setErro("");

    if (!usuario) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    return onValue(
      ref(database, "combatePublico"),
      (snapshot) => {
        const dados = snapshot.val() as Combate | null;

        if (dados && dados.versao !== 2) {
          setCombate(null);
          setErro("O formato do combate não é compatível.");
        } else {
          setCombate(dados);
          setErro("");
        }

        setCarregando(false);
      },
      (falha) => {
        setCombate(null);
        setErro(mensagemErro(falha));
        setCarregando(false);
      },
    );
  }, [usuario]);

  async function entrar() {
    setErro("");
    setEntrando(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (falha) {
      setErro(mensagemErro(falha));
    } finally {
      setEntrando(false);
    }
  }

  async function sair() {
    setErro("");

    try {
      await signOut(auth);
    } catch (falha) {
      setErro(mensagemErro(falha));
    }
  }

  const participantes = Object.values(
    combate?.participantes ?? {},
  ).sort((a, b) => b.iniciativa - a.iniciativa);
  if (painelIniciativa && usuario && !verificandoLogin) {
  const mestre =
    usuario.emailVerified &&
    usuario.email === "jvictoranjos.silva@gmail.com";

  return (
    <main className="painel">
      {carregando ? (
        <p>Carregando combate…</p>
      ) : erro ? (
        <p className="erro" role="alert">
          {erro}
        </p>
      ) : combate ? (
        <PainelIniciativa
          key={combate.id}
          combateId={combate.id}
          turno={combate.turno}
          vez={combate.vez}
          ativo={combate.ativo}
          participantes={participantes}
          mestre={mestre}
        />
      ) : (
        <section className="bloco">
          <h2>Nenhum combate compartilhado</h2>
          <p>
            Ative o compartilhamento no site do mestre.
          </p>
        </section>
      )}
    </main>
  );
}
  if (tokenId && usuario && !verificandoLogin) {
  return (
    <main className="painel painel-ficha-token">
      <CabecalhoMovel />

      {carregando ? (
        <p>Carregando combate…</p>
      ) : erro ? (
        <p className="erro" role="alert">
          {erro}
        </p>
      ) : combate ? (
        <TokenSelecionado
          key={`ficha-${combate.id}-${tokenId}`}
          tokenId={tokenId}
          combateId={combate.id}
          ativo={combate.ativo}
          vez={combate.vez}
          participantes={participantes}
        />
      ) : (
        <p>
          Nenhum combate compartilhado. Ative o
          compartilhamento no Arquivo Confidencial.
        </p>
      )}
    </main>
  );
}

  return (
    <main className="painel">
      <header className="cabecalho">
        <span className="etiqueta">INTEGRAÇÃO OWLBEAR</span>
        <h1>Arquivo Confidencial</h1>
      </header>

      {verificandoLogin ? (
        <p>Verificando conexão…</p>
      ) : !usuario ? (
        <section className="bloco">
          <p>
            Entre com a conta usada no Arquivo Confidencial
            para acompanhar o combate compartilhado.
          </p>

          <button
            onClick={entrar}
            disabled={entrando}
          >
            {entrando ? "Conectando…" : "Entrar com Google"}
          </button>
        </section>
      ) : (
        <>
          <section className="conta">
            <span>
              {usuario.displayName ?? usuario.email ?? "Conectado"}
            </span>

            <button className="secundario" onClick={sair}>
              Sair
            </button>
          </section>

          {carregando ? (
            <p>Carregando combate…</p>
          ) : !erro && !combate ? (
            <section className="bloco">
              <h2>Nenhum combate compartilhado</h2>
              <p>
                No Arquivo Confidencial, abra o combate
                do mestre e ative o compartilhamento.
              </p>
            </section>
          ) : !erro && combate ? (
            <>
              <section className="resumo">
                <div>
                  <span>Contador de turno</span>
                  <strong>{combate.turno}</strong>
                </div>

                <div>
                  <span>Participantes</span>
                  <strong>{participantes.length}</strong>
                </div>
              </section>

              <TokenSelecionado
              vez={combate.vez}
  key={`selecao-${combate.id}`}
  combateId={combate.id}
  ativo={combate.ativo}
  participantes={participantes}
/>

              <VinculoToken
  key={combate.id}
  combateId={combate.id}
  participantes={participantes}
/>

              <section className="lista">
                {participantes.length === 0 && (
                  <p>O combate ainda não tem participantes.</p>
                )}

                {participantes.map((p) => {
                  const ativo = p.id === combate.ativo;

                  return (
                    <article
                      key={p.id}
                      className={`participante ${ativo ? "ativo" : ""}`}
                    >
                      <div className="linha">
                        <h2>{p.nome}</h2>

                        {ativo && (
                          <span className="vez">NA VEZ</span>
                        )}
                      </div>

                      <div className="valores">
                        <span>Iniciativa: {p.iniciativa}</span>
                        <span>Ações: {p.acoes ?? 2}</span>
                      </div>
                    </article>
                  );
                })}
              </section>
            </>
          ) : null}
        </>
      )}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </main>
  );
}