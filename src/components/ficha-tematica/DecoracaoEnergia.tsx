export function SimboloCentralEnergia() {
  return (
    <img
      className="energia-simbolo-central"
      src={`${import.meta.env.BASE_URL}temas/energia-simbolo.webp`}
      alt=""
      aria-hidden="true"
    />
  );
}

export function AnelEnergia() {
  return (
    <svg
      className="energia-anel"
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
    >
      {/* Contorno deslocado em ciano. */}
      <circle
        cx="82"
        cy="81"
        r="62"
        stroke="#00d9ff"
        strokeWidth="3"
        strokeDasharray="65 8 31 5 48 12"
      />

      {/* Contorno deslocado em magenta. */}
      <circle
        cx="78"
        cy="79"
        r="62"
        stroke="#ff35c8"
        strokeWidth="2.5"
        strokeDasharray="32 10 76 6 20 12"
        strokeDashoffset="35"
      />

      {/* Círculo principal com pequenas interrupções. */}
      <circle
        cx="80"
        cy="80"
        r="62"
        stroke="#d8c7ff"
        strokeWidth="3.5"
        strokeDasharray="102 3 58 5 81 4 131 6"
      />

      <circle
        cx="80"
        cy="80"
        r="57"
        stroke="#a43cff"
        strokeWidth="0.8"
        opacity="0.6"
      />

      {/* Fragmentos horizontais de glitch. */}
      <g stroke="#00d9ff" strokeWidth="2">
        <path d="M5 45h20 M14 52h17 M127 37h20" />
        <path d="M133 44h21 M5 105h22 M129 112h23" />
        <path d="M26 134h25 M96 145h23" />
      </g>

      <g stroke="#ff35c8" strokeWidth="2">
        <path d="M10 40h14 M131 57h24 M2 98h20" />
        <path d="M137 107h16 M30 141h17 M110 131h20" />
        <path d="M42 8v17 M119 12v14" />
      </g>

      {/* Partes do contorno deslocadas. */}
      <g fill="#e9ddff">
        <path d="M17 61h10v4H17z M132 88h10v4h-10z" />
        <path d="M39 23h9v3h-9z M102 136h12v3h-12z" />
      </g>

      <g fill="#a43cff">
        <path d="M13 76h12v5H13z M135 65h10v4h-10z" />
        <path d="M64 139h15v4H64z" />
      </g>
    </svg>
  );
}