export function AuthBrandPanel() {
  return (
    <aside className="flex min-h-[320px] flex-col justify-between bg-[#0f1d45] px-8 py-9 text-white lg:min-h-screen lg:px-12">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#f5c400] text-sm font-bold text-[#f5c400]">
          IE
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">
            I.E. Libertadores de América
          </p>
          <p className="mt-1 text-sm text-white/70">Cusco</p>
        </div>
      </div>

      <div className="max-w-md pb-8 lg:pb-36">
        <h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
          Seguimiento académico más claro y oportuno.
        </h1>
        <p className="mt-5 text-base leading-7 text-white/75">
          Centraliza asistencia, calificaciones, incidencias y recomendaciones
          de apoyo en un solo lugar.
        </p>
      </div>
    </aside>
  );
}
