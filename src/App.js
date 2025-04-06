import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [temas, setTemas] = useState([]);
  const [temasSeleccionados, setTemasSeleccionados] = useState([]);
  const [preguntasVistas, setPreguntasVistas] = useState([]);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [temporizadorActivo, setTemporizadorActivo] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (temporizadorActivo) {
        setTiempo((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [temporizadorActivo]);

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
  }, [preguntas, indiceActual, mostrarResumen]);

  const obtenerPregunta = async () => {
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
        const nuevasPreguntas = response.data;
        setPreguntas(nuevasPreguntas);
        setIndiceActual(0);
        setRespuestas({});
        setResultados({});
        setPreguntasVistas((prev) => [...prev, ...nuevasPreguntas.map((p) => p.id)]);
        setMostrarResumen(false);
        setTiempo(0);
        setTemporizadorActivo(true);
      }
    } catch (error) {
      console.error("Error al obtener preguntas:", error);
    }
  };

  const seleccionarRespuesta = (ejercicio, letra) => {
    setRespuestas((prev) => ({ ...prev, [ejercicio]: letra }));
  };

  const verificarRespuestas = () => {
    let nuevosResultados = {};
    preguntas.forEach((pregunta) => {
      const rUsuario = respuestas[pregunta.ejercicio];
      nuevosResultados[pregunta.ejercicio] =
        rUsuario === pregunta.respuesta_correcta
          ? "✅ Respuesta correcta"
          : `❌ Incorrecto, la respuesta correcta es (${pregunta.respuesta_correcta})`;
    });
    setResultados(nuevosResultados);
    setMostrarResumen(true);
    setTemporizadorActivo(false);
  };

  const siguiente = () => {
    if (indiceActual < preguntas.length - 1) {
      setIndiceActual(indiceActual + 1);
    }
  };

  const anterior = () => {
    if (indiceActual > 0) {
      setIndiceActual(indiceActual - 1);
    }
  };

  return (
    <div className="container">
      <h1>EDBOT: Simulador</h1>

      {!preguntas.length && (
        <div>
          <h2>Selecciona los temas:</h2>
          {temas.map((tema) => (
            <label key={tema}>
              <input
                type="checkbox"
                value={tema}
                checked={temasSeleccionados.includes(tema)}
                onChange={() =>
                  setTemasSeleccionados((prev) =>
                    prev.includes(tema) ? prev.filter((t) => t !== tema) : [...prev, tema]
                  )
                }
              />
              {tema}
            </label>
          ))}
          <br />
          <button onClick={obtenerPregunta}>Iniciar Simulacro</button>
        </div>
      )}

      {preguntas.length > 0 && !mostrarResumen && (
        <div className="pregunta-container fade-in">
          <div className="barra-progreso">
            Pregunta: {indiceActual + 1} de {preguntas.length}
            <span className="temporizador">⏱️ {tiempo}s</span>
          </div>

          <h2><span dangerouslySetInnerHTML={{ __html: preguntas[indiceActual].ejercicio }} /></h2>

          {preguntas[indiceActual].imagen && (
            <img
              src={preguntas[indiceActual].imagen}
              alt="Ejercicio"
              className="imagen-ejercicio"
              style={{ float: "left", marginRight: "10px", maxWidth: "300px" }}
            />
          )}

          <ul className="opciones-lista">
            {preguntas[indiceActual].alternativas.map((alt) => (
              <li key={alt.letra} className="opcion">
                <label>
                  <input
                    type="radio"
                    name={`pregunta-${indiceActual}`}
                    value={alt.letra}
                    checked={respuestas[preguntas[indiceActual].ejercicio] === alt.letra}
                    onChange={() =>
                      seleccionarRespuesta(preguntas[indiceActual].ejercicio, alt.letra)
                    }
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

          <div className="navegacion">
            <button onClick={anterior} disabled={indiceActual === 0}>
              Anterior
            </button>
            {indiceActual < preguntas.length - 1 ? (
              <button onClick={siguiente}>Siguiente</button>
            ) : (
              <button onClick={verificarRespuestas}>Finalizar y ver resultados</button>
            )}
          </div>
        </div>
      )}

      {mostrarResumen && (
        <div className="resumen">
          <h2>Resumen del Simulacro</h2>
          <p>Tiempo total: {tiempo} segundos</p>
          {preguntas.map((pregunta, index) => (
            <div key={pregunta.ejercicio}>
              <p>
                <strong>Pregunta {index + 1}:</strong>
                <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></span>
              </p>
              <p>Tu respuesta: {respuestas[pregunta.ejercicio]}</p>
              <p>{resultados[pregunta.ejercicio]}</p>
              <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
