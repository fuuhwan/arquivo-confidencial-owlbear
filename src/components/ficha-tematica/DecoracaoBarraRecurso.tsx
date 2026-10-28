import { useId } from "react";

const ALFABETO = [
  "ABCDEFGHIJK",
  "LMNOPQRSTUV",
  "WXYZ",
];

function localizarGlifo(letra: string) {
  for (let linha = 0; linha < ALFABETO.length; linha++) {
    const coluna = ALFABETO[linha].indexOf(letra);

    if (coluna >= 0) {
      return {
        x: 16 + coluna * 91.3,
        y: [14, 184, 366][linha],
      };
    }
  }

  return null;
}

function FaixaSigilos({ y }: { y: number }) {
  const letras = Array.from("ABCDEFGHIJKLMNOPQRSTUV");

  return (
    <g>
      {letras.map((letra, indice) => {
        const glifo = localizarGlifo(letra);

        if (!glifo) return null;

        return (
          <svg
            key={indice}
            x={20 + indice * 25.5}
            y={y}
            width="22"
            height="18"
            viewBox={`${glifo.x} ${glifo.y} 64 68`}
            overflow="hidden"
            preserveAspectRatio="xMidYMid meet"
          >
            <image
              href={`${import.meta.env.BASE_URL}temas/conhecimento-alfabeto.webp`}
              width="1008"
              height="490"
            />
          </svg>
        );
      })}
    </g>
  );
}

const LINHAS_MORTE = `
  M8 18
  C50 5 75 25 112 14
  C145 4 162 7 181 14
  C205 25 227 22 246 9
  C269 -6 294 2 305 12
  C319 26 345 23 364 11
  C391 -5 420 2 439 13
  C468 28 496 17 519 10
  C546 2 574 8 592 18

  M8 12
  C49 0 76 19 110 9
  C145 -2 168 1 186 10
  C205 20 222 17 240 4
  C265 -13 297 -6 312 7
  C327 20 344 17 361 6
  C391 -12 425 -4 445 8
  C469 21 494 11 517 4
  C547 -5 575 2 592 12

  M15 19
  C52 12 69 24 97 19
  C118 15 135 9 149 13
  C165 17 157 24 146 21
  C137 19 141 15 148 17

  M222 19
  C248 15 256 2 274 3
  C292 4 298 17 284 20
  C272 23 261 16 270 11
  C277 7 285 12 279 15

  M403 19
  C427 23 442 13 460 12
  C480 11 486 24 472 25
  C462 26 457 19 465 17

  M8 58
  C47 72 77 52 112 63
  C145 73 163 70 182 63
  C206 52 227 55 246 68
  C270 83 294 75 305 65
  C320 51 345 54 364 66
  C392 82 421 75 439 64
  C468 49 496 60 519 67
  C546 75 574 69 592 59

  M8 64
  C48 77 77 58 110 68
  C145 79 167 76 186 67
  C205 57 222 60 240 73
  C265 90 297 83 312 70
  C327 57 344 60 361 71
  C391 89 425 81 445 69
  C469 56 494 66 517 73
  C547 82 575 75 592 65

  M106 59
  C128 55 144 62 144 69
  C144 78 124 77 125 69
  C126 64 136 64 136 69

  M330 58
  C349 53 369 62 367 70
  C365 79 348 75 352 68
  C355 63 362 67 358 70

  M505 60
  C525 54 546 63 540 72
  C535 80 521 74 526 68
  C529 64 536 68 532 71

  M8 18 C1 30 2 47 8 58
  M592 18 C599 30 598 47 592 59
`;

export default function DecoracaoBarraRecurso() {
  const id = useId();
  const mascaraId = `moldura-${id.replace(/:/g, "")}`;

  return (
    <svg
      className="pl-recurso-decoracao"
      viewBox="12 22 576 32"
      preserveAspectRatio="none"
      fill="none"
      overflow="visible"
      aria-hidden="true"
    >
      <defs>
        <mask
          id={mascaraId}
          maskUnits="userSpaceOnUse"
          x="-100"
          y="-100"
          width="800"
          height="300"
          style={{ maskType: "luminance" }}
        >
          <rect
            x="-100"
            y="-100"
            width="800"
            height="300"
            fill="white"
          />

          <rect
  className="pl-mascara-interior"
  x="12"
  y="22"
  width="576"
  height="32"
  fill="black"
/>
        </mask>
      </defs>

      <g mask={`url(#${mascaraId})`}>
        {/* Energia */}
        <g className="pl-moldura-energia">
          <rect
            x="8"
            y="11"
            width="584"
            height="54"
            rx="23"
            stroke="#a43cff"
            strokeWidth="3"
          />

          <rect
            x="13"
            y="15"
            width="574"
            height="46"
            rx="20"
            stroke="#00d9ff"
            strokeWidth="2"
          />

          <path
            d="M30 9h94m20 0h38m174 0h72m41 0h91
               M22 67h73m31 0h41m114 0h93m44 0h136"
            stroke="#ff35c8"
            strokeWidth="4"
          />

          <path
            d="M3 28h23m-18 7h14m550 5h26m-23 8h22
               M99 4v15m5-10v14m355 36v14m7-17v12"
            stroke="#00eaff"
            strokeWidth="3"
          />

          <path
            d="M181 6h24v10h-13v-5h-11
               M392 60h17v10h-28v-5h11
               M568 18h22v9h-12v-4h-10"
            stroke="#ff35c8"
            strokeWidth="2"
          />
        </g>

        {/* Sangue */}
        <g className="pl-moldura-sangue">
          <path
            d="M9 14 5 2 17 15 51 13 62 5 60 14
               108 13 123 8 117 15 169 12 180 3 181 14
               235 13 247 7 245 15 306 12 321 3 319 15
               377 13 391 6 388 15 447 13 462 2 460 15
               518 13 534 7 531 15 582 13 588 3 591 23
               595 36 589 42 591 61 579 59
               563 70 566 61 510 63 495 70 499 62
               440 64 425 72 426 63 367 64 353 71 356 62
               295 65 279 72 282 63 224 65 209 70 211 62
               151 64 133 72 138 62 80 64 65 70 67 62
               16 64 5 72 9 53 6 39 11 26Z"
            stroke="#d82c38"
            strokeWidth="5"
          />

          <path
            d="M19 23 91 21 151 23 218 20 283 23
               350 21 415 23 482 20 578 23
               578 52 514 54 449 52 382 55
               314 52 245 54 180 52 112 55 20 53Z"
            stroke="#d82c38"
            strokeWidth="2"
          />

          <path
            d="M26 18h45m129 0h54m184 0h43
               M82 59h59m177 1h45m149-2h39"
            stroke="#ff6a6a"
            strokeWidth="1.5"
            opacity="0.65"
          />
        </g>

        {/* Morte */}
<g className="pl-moldura-morte">
  <path
    d={LINHAS_MORTE}
    stroke="#111113"
    strokeWidth="5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />

  <path
    d={LINHAS_MORTE}
    stroke="#aaa99b"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    opacity="0.8"
  />
</g>

        {/* Conhecimento */}
        <g className="pl-moldura-conhecimento">
          <path
            d="M12 11H588V65H12Z"
            stroke="#b58b14"
            strokeWidth="2"
          />

          <path
            d="M17 22H583M17 54H583"
            stroke="#e6c453"
            strokeWidth="1"
          />

          <g className="pl-faixa-sigilos">
            <FaixaSigilos y={0} />
            <FaixaSigilos y={58} />
          </g>

          <path
            d="M12 11l7-7 7 7-7 7Z
               M588 11l-7-7-7 7 7 7Z
               M12 65l7-7 7 7-7 7Z
               M588 65l-7-7-7 7 7 7Z"
            fill="#d4b44b"
          />
        </g>
      </g>
    </svg>
  );
}