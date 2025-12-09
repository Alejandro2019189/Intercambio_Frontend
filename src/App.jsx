import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/intercambio";
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || "1234";

function App() {
  // Intercambio (todos lo ven)
  const [nombre, setNombre] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [contador, setContador] = useState(null);

  // Admin / resumen (solo tú)
  const [isAdmin, setIsAdmin] = useState(false);
  const [mostrarPin, setMostrarPin] = useState(false);
  const [pin, setPin] = useState("");
  const [errorPin, setErrorPin] = useState(null);

  const [resumen, setResumen] = useState([]);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [errorResumen, setErrorResumen] = useState(null);

  const iniciarContador = () => {
    let segundos = 10;
    setContador(segundos);

    const intervalId = setInterval(() => {
      segundos -= 1;
      setContador(segundos);

      if (segundos <= 0) {
        clearInterval(intervalId);
        window.location.reload();
      }
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError("Escribe tu nombre.");
      setResultado(null);
      return;
    }

    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch(`${API_URL}/asignar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreLimpio }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.message ||
            (data.errors && data.errors[0]?.msg) ||
            "Ocurrió un error"
        );
      } else {
        setResultado(data);
      }

      iniciarContador();
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
      iniciarContador();
    } finally {
      setCargando(false);
    }
  };

  // Función para cargar el resumen SOLO cuando seas admin
  const cargarResumen = async () => {
    setCargandoResumen(true);
    setErrorResumen(null);

    try {
      const res = await fetch(`${API_URL}/resumen`);
      const data = await res.json();

      if (!res.ok) {
        setErrorResumen("No se pudo cargar el resumen.");
      } else {
        setResumen(data);
      }
    } catch (err) {
      console.error(err);
      setErrorResumen("Error de conexión al cargar el resumen.");
    } finally {
      setCargandoResumen(false);
    }
  };

  // Cuando se cambia a admin por primera vez, cargar resumen
  useEffect(() => {
    if (isAdmin) {
      cargarResumen();
    }
  }, [isAdmin]);

  const manejarConfirmarPin = (e) => {
    e.preventDefault();
    setErrorPin(null);

    if (pin === ADMIN_PIN) {
      setIsAdmin(true);
      setMostrarPin(false);
      setPin("");
    } else {
      setErrorPin("PIN incorrecto.");
    }
  };

  return (
    <div className="page">
      <div className="card card-wide">
        <h1>Intercambio 2025</h1>
        <p className="subtitle">
          Escribe tu nombre exactamente como fue registrado.
        </p>

        {/* Formulario visible para todos */}
        <form onSubmit={handleSubmit} className="form">
          <label htmlFor="nombre">Tu nombre:</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Brandon Mendoza"
            autoComplete="off"
          />
          <button type="submit" disabled={cargando}>
            {cargando ? "Buscando..." : "Ver quién te tocó"}
          </button>
        </form>

        {error && <div className="alert error">{error}</div>}

        {resultado && (
          <div className="alert success">
            <p>{resultado.message}</p>
            <p>
              Te tocó:{" "}
              <strong>{resultado.asignadoA?.nombre || "Desconocido"}</strong>
              {resultado.asignadoA?.familia && (
                <>
                  {" "}
                  <span>
                    (familia: {resultado.asignadoA.familia})
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {contador !== null && (
          <p className="counter">
            La página se recargará en <strong>{contador}</strong> segundos...
          </p>
        )}

        {/* Sección solo organizador */}
        <div className="admin-section">
          {!isAdmin && !mostrarPin && (
            <button
              type="button"
              className="admin-toggle"
              onClick={() => setMostrarPin(true)}
            >
              Soy el organizador
            </button>
          )}

          {mostrarPin && !isAdmin && (
            <form className="pin-form" onSubmit={manejarConfirmarPin}>
              <label htmlFor="pin">
                PIN de organizador (solo tú deberías tenerlo):
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <button type="submit">Entrar</button>
              {errorPin && <div className="alert error">{errorPin}</div>}
            </form>
          )}

          {isAdmin && (
            <div className="admin-panel">
              <div className="admin-header">
                <h2>Resumen de asignaciones</h2>
                <button type="button" onClick={cargarResumen}>
                  Recargar
                </button>
              </div>
              <p className="subtitle">
                Solo visible para el organizador: quién le da a quién.
              </p>

              {cargandoResumen && <p>Cargando resumen...</p>}
              {errorResumen && (
                <div className="alert error">{errorResumen}</div>
              )}

              {!cargandoResumen && !errorResumen && resumen.length === 0 && (
                <p>No hay datos para mostrar.</p>
              )}

              {!cargandoResumen && resumen.length > 0 && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Persona</th>
                        <th>Familia</th>
                        <th>Le da a</th>
                        <th>Familia destino</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.map((item, idx) => (
                        <tr key={item.nombre + idx}>
                          <td>{idx + 1}</td>
                          <td>{item.nombre}</td>
                          <td>{item.familia}</td>
                          <td>{item.asignadoA?.nombre || "Sin asignar"}</td>
                          <td>{item.asignadoA?.familia || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;