import React, { useState, useEffect } from "react";
import axios from "axios";
import { CSSTransition } from "react-transition-group";
import "./App.css"; // Puedes poner estilos para .fade, .barra-progreso, etc.

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [preguntasVistas, setPreguntasVistas] = useState([]);
  const [numeroPregunta, setNumeroPregunta] = useState(0);
  const [temporalizador, setTemporalizador] = useState(0);
  const [simulacroTerminado, setSimulacroTerminado] = useState(false);
  const [simulacroIniciado, setSimulacroIniciado] = useState(false); // NUEVO

  // ⏱ Temporizador solo cuando el simulacro ha comenzado
  useEffect(() => {
    let timer;
    if (simulacroIniciado && !simulacroTerminado) {
      timer = setInterval(() => {
        setTemporalizador((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [simulacroIniciado, simulacroTerminado]);

  // 👇 Función que se llama al hacer clic en "Iniciar Simulacro"
  const iniciarSimulacro = async () => {
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro", {
        params: {
          num_preguntas: 10,
          preguntas_vistas: preguntasVistas,
        },
        paramsSerializer: (params) => {
          return Object.keys(params)
            .map((key) => {
              if (Array.isArray(params[key])) {
                return params[key].map((val) => `${key}=${encodeURIComponent(val)}`).join("&");
              }
              return `${key}=${encodeURIComponent(params[key])}`;
            })
            .join("&");
        },
      });

      if (response.data) {
        const nuevasPreguntas = response.data;
        setPreguntas(nuevasPreguntas);
        setRespuestas({});
        setResultados({});
        setNumeroPregunta(0);
        setTemporalizador(0);
        setSimulacroTerminado(false);
        setSimulacroIniciado(true); // Activar simulacro

        setPreguntasVistas((prev) => [...prev, ...nuevasPreguntas.map((p) => p.id)]);
      }
    } catch (error) {
      console.error("Error al obtener preguntas:", error);
    }
  };

  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado"))
        .catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntas, numeroPregunta]);

  const seleccionarRespuesta = (ejercicio, letra) => {
    setRespuestas((prev) => ({
      ...prev,
      [ejercicio]: letra,
    }));
  };

  const verificarRespuestas = () => {
    const nuevosResultados = {};
    preguntas.forEach((pregunta) => {
      const r = respuestas[pregunta.ejercicio];
      if (r === pregunta.respuesta_correcta) {
        nuevosResultados[pregunta.ejercicio] = "✅ Respuesta correcta";
      } else {
        nuevosResultados[pregunta.ejercicio] = `❌ Incorrecto, la correcta es (${pregunta.respuesta_correcta})`;
      }
    });
    setResultados(nuevosResultados);
    setSimulacroTerminado(true);
  };

  const siguientePregunta = () => {
    if (numeroPregunta < preguntas.length - 1) {
      setNumeroPregunta((prev) => prev + 1);
    }
  };

  const mostrarBarraProgreso = () => {
    return `Pregunta ${numeroPregunta + 1} de ${preguntas.length}`;
  };

  return (
    <div className="container">
      <h1>EDBOT: Simulador</h1>

      {!simulacroIniciado && (
        <button onClick={iniciarSimulacro} className="btn-iniciar">
          Iniciar Simulacro
        </button>
      )}

      {simulacroIniciado && !simulacroTerminado && preguntas.length > 0 && (
        <>
          <div className="barra-progreso" style={{ marginBottom: "10px", fontWeight: "bold" }}>
            {mostrarBarraProgreso()}
          </div>

          <div className="temporizador">
            Tiempo: {Math.floor(temporalizador / 60)}:{temporalizador % 60 < 10 ? `0${temporalizador % 60}` : temporalizador % 60}
          </div>

          <CSSTransition
            key={preguntas[numeroPregunta].ejercicio}
            timeout={500}
            classNames="fade"
          >
            <div className="pregunta-container">
              <h2 className="ejercicio-texto">
                <span dangerouslySetInnerHTML={{ __html: preguntas[numeroPregunta].ejercicio }} />
              </h2>

              {preguntas[numeroPregunta].imagen && (
                <img src={preguntas[numeroPregunta].imagen} alt="Ejercicio" className="imagen-ejercicio" />
              )}

              <ul className="opciones-lista">
                {preguntas[numeroPregunta].alternativas.map((alt) => (
                  <li key={alt.letra} className="opcion">
                    <label>
                      <input
                        type="radio"
                        name={`pregunta-${preguntas[numeroPregunta].ejercicio}`}
                        value={alt.letra}
                        checked={respuestas[preguntas[numeroPregunta].ejercicio] === alt.letra}
                        onChange={() => seleccionarRespuesta(preguntas[numeroPregunta].ejercicio, alt.letra)}
                      />
                      <span className="texto-opcion">{alt.letra}: </span>
                      <span className="texto-opcion" dangerouslySetInnerHTML={{ __html: alt.texto }} />
                    </label>
                  </li>
                ))}
              </ul>

              <div className="botones" style={{ marginTop: "15px" }}>
                {numeroPregunta < preguntas.length - 1 ? (
                  <button onClick={siguientePregunta}>Siguiente Pregunta</button>
                ) : (
                  <button onClick={verificarRespuestas}>Finalizar y Ver Resultados</button>
                )}
              </div>
            </div>
          </CSSTransition>
        </>
      )}

      {simulacroTerminado && (
        <div>
          <h2>Resumen de Resultados</h2>
          <ul>
            {Object.entries(resultados).map(([ejercicio, resultado]) => (
              <li key={ejercicio}>
                {ejercicio}: {resultado}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
