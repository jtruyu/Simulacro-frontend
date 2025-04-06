import React, { useState, useEffect } from "react";
import axios from "axios";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "./App.css";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [temas, setTemas] = useState([]);
  const [temasSeleccionados, setTemasSeleccionados] = useState([]);
  const [preguntasVistas, setPreguntasVistas] = useState([]);
  const [temporizador, setTemporizador] = useState(0);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  useEffect(() => {
    const obtenerTemas = async () => {
      try {
        const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/temas");
        const ordenDeseado = [
          "Sistema Internacional",
          "Análisis dimensional",
          "Vectores",
          "Funciones",
          "Cantidades cinemáticas",
          "MRU",
          "MRUV",
          "Caída libre",
          "Movimiento bidimensional",
          "Movimiento de proyectil",
          "Cantidades cinemáticas angulares",
          "MCU",
          "MCUV",
          "Velocidad y aceleración en el movimiento circular"
        ];
        const temasOrdenados = ordenDeseado.filter((tema) => response.data.includes(tema));
        setTemas(temasOrdenados);
      } catch (error) {
        console.error("Error al obtener los temas:", error);
      }
    };
    obtenerTemas();
  }, []);

  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise().catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntas, preguntaActual]);

  useEffect(() => {
    let timer;
    if (!mostrarResultados && preguntas.length > 0 && preguntaActual < preguntas.length) {
      timer = setInterval(() => {
        setTemporizador((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [preguntaActual, preguntas.length, mostrarResultados]);

  const obtenerPreguntas = async () => {
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro", {
        params: {
          num_preguntas: 10,
          temas: temasSeleccionados,
          preguntas_vistas: preguntasVistas
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
        setPreguntas(response.data);
        setPreguntaActual(0);
        setRespuestas({});
        setResultados({});
        setMostrarResultados(false);
        setTemporizador(0);
        setPreguntasVistas((prev) => [...prev, ...response.data.map((p) => p.id)]);
      }
    } catch (error) {
      console.error("Error al obtener preguntas:", error);
    }
  };

  const seleccionarRespuesta = (ejercicio, letra) => {
    setRespuestas((prev) => ({ ...prev, [ejercicio]: letra }));
  };

  const verificarRespuestas = () => {
    const nuevosResultados = {};
    preguntas.forEach((pregunta) => {
      const respuestaUsuario = respuestas[pregunta.ejercicio];
      nuevosResultados[pregunta.ejercicio] =
        respuestaUsuario === pregunta.respuesta_correcta
          ? "✅ Correcta"
          : `❌ Incorrecta. Respuesta correcta: (${pregunta.respuesta_correcta})`;
    });
    setResultados(nuevosResultados);
    setMostrarResultados(true);
  };

  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual((prev) => prev + 1);
    }
  };

  const toggleTema = (tema) => {
    setTemasSeleccionados((prev) =>
      prev.includes(tema) ? prev.filter((t) => t !== tema) : [...prev, tema]
    );
  };

  return (
    <div className="container">
      <h1>EDBOT: Simulador</h1>

      {!preguntas.length ? (
        <>
          <h2>Selecciona los temas:</h2>
          {temas.map((tema) => (
            <label key={tema}>
              <input
                type="checkbox"
                value={tema}
                checked={temasSeleccionados.includes(tema)}
                onChange={() => toggleTema(tema)}
              />
              {tema}
            </label>
          ))}
          <br />
          <button onClick={obtenerPreguntas}>Comenzar Simulacro</button>
        </>
      ) : mostrarResultados ? (
        <div>
          <h2>Resumen de Resultados</h2>
          {preguntas.map((pregunta, index) => (
            <div key={pregunta.ejercicio}>
              <p>
                <strong>{index + 1}.</strong>{" "}
                <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }} />
              </p>
              <p><strong>Tu respuesta:</strong> {respuestas[pregunta.ejercicio]}</p>
              <p>{resultados[pregunta.ejercicio]}</p>
              <hr />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="header-simulacro">
            <span>Pregunta {preguntaActual + 1} de {preguntas.length}</span>
            <span>⏱ {temporizador}s</span>
          </div>

          <TransitionGroup>
            <CSSTransition
              key={preguntas[preguntaActual].ejercicio}
              timeout={300}
              classNames="fade"
            >
              <div className="pregunta-container">
                <h2 className="ejercicio-texto">
                  <span dangerouslySetInnerHTML={{ __html: preguntas[preguntaActual].ejercicio }}></span>
                </h2>

                {preguntas[preguntaActual].imagen && (
                  <img
                    src={preguntas[preguntaActual].imagen}
                    alt="Ejercicio"
                    className="imagen-ejercicio"
                  />
                )}

                <ul className="opciones-lista">
                  {preguntas[preguntaActual].alternativas.map((alt) => (
                    <li key={alt.letra} className="opcion">
                      <label>
                        <input
                          type="radio"
                          name={`pregunta-${preguntas[preguntaActual].ejercicio}`}
                          value={alt.letra}
                          checked={respuestas[preguntas[preguntaActual].ejercicio] === alt.letra}
                          onChange={() => seleccionarRespuesta(preguntas[preguntaActual].ejercicio, alt.letra)}
                        />
                        <span className="texto-opcion">{alt.letra}: </span>
                        <span
                          className="texto-opcion"
                          dangerouslySetInnerHTML={{ __html: alt.texto }}
                        ></span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </CSSTransition>
          </TransitionGroup>

          <div className="botones-simulacro">
            {preguntaActual < preguntas.length - 1 ? (
              <button onClick={siguientePregunta}>Siguiente</button>
            ) : (
              <button onClick={verificarRespuestas}>Finalizar y Ver Resultados</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
