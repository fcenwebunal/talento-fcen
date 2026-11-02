// Same markup as the FCEN masthead used across fcen.unal.edu.co (sitio/eventos-fcen), renamed for this platform.
export function FcenBanner() {
  return (
    <div className="fcen-masthead">
      <div className="fm-inner">
        <div className="fm-heading">
          <p className="fm-kicker">Prácticas y conexión con las organizaciones</p>
          <p className="fm-title">
            Talento <span className="fm-accent">FCEN</span>
          </p>
        </div>

        <a className="fm-brand" href="https://fcen.unal.edu.co/" target="_top" aria-label="FCEN, Facultad de Ciencias Exactas y Naturales: ir al inicio">
          <span className="fm-brand-mark" aria-hidden="true">
            FCEN
          </span>
          <span className="fm-brand-name" aria-hidden="true">
            <span>Facultad de</span>
            <span>Ciencias Exactas</span>
            <span>&amp; Naturales</span>
          </span>
        </a>
      </div>
    </div>
  );
}
