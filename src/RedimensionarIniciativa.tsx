import { useEffect, useRef, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

const PAINEL_ID =
  "br.arquivo-confidencial.owlbear/painel-iniciativa";

type Arraste = {
  ponteiro: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
};

export default function RedimensionarIniciativa() {
  const inicio = useRef<Arraste | null>(null);
  const destino = useRef<{
    largura: number;
    altura: number;
  } | null>(null);
  const aplicando = useRef(false);
  const montado = useRef(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    montado.current = true;

    return () => {
      montado.current = false;
      inicio.current = null;
      destino.current = null;
    };
  }, []);

  async function aplicar() {
    if (aplicando.current) return;

    aplicando.current = true;

    try {
      while (montado.current && destino.current) {
        const tamanho = destino.current;
        destino.current = null;

        await OBR.popover.setWidth(
          PAINEL_ID,
          tamanho.largura,
        );

        if (!montado.current) break;

        await OBR.popover.setHeight(
          PAINEL_ID,
          tamanho.altura,
        );
      }
    } catch {
      destino.current = null;

      if (montado.current) {
        setErro(
          "Não foi possível redimensionar a janela.",
        );
      }
    } finally {
      aplicando.current = false;
    }
  }

  function atualizar(x: number, y: number) {
    const comeco = inicio.current;

    if (!comeco) return;

    destino.current = {
      largura: Math.max(
        320,
        Math.min(
          1400,
          Math.round(
            comeco.largura + x - comeco.x,
          ),
        ),
      ),
      altura: Math.max(
        300,
        Math.min(
          1100,
          Math.round(
            comeco.altura + y - comeco.y,
          ),
        ),
      ),
    };

    void aplicar();
  }

  return (
    <>
      {erro && (
        <p
          className="ac-erro-redimensionar"
          role="alert"
        >
          {erro}
        </p>
      )}

      <button
        type="button"
        className="ac-redimensionar"
        aria-label="Arraste para redimensionar a janela"
        title="Segure e arraste para redimensionar"
        onPointerDown={(evento) => {
          if (evento.button !== 0) return;

          evento.preventDefault();
          setErro("");

          inicio.current = {
            ponteiro: evento.pointerId,
            x: evento.screenX,
            y: evento.screenY,
            largura: window.innerWidth,
            altura: window.innerHeight,
          };

          evento.currentTarget.setPointerCapture(
            evento.pointerId,
          );
        }}
        onPointerMove={(evento) => {
          if (
            inicio.current?.ponteiro !==
            evento.pointerId
          ) {
            return;
          }

          atualizar(evento.screenX, evento.screenY);
        }}
        onPointerUp={(evento) => {
          if (
            inicio.current?.ponteiro !==
            evento.pointerId
          ) {
            return;
          }

          atualizar(evento.screenX, evento.screenY);
          inicio.current = null;

          if (
            evento.currentTarget.hasPointerCapture(
              evento.pointerId,
            )
          ) {
            evento.currentTarget.releasePointerCapture(
              evento.pointerId,
            );
          }
        }}
        onPointerCancel={() => {
          inicio.current = null;
        }}
        onLostPointerCapture={() => {
          inicio.current = null;
        }}
      >
        ◢
      </button>
    </>
  );
}