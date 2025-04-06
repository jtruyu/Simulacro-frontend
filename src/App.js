import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [temas, setTemas] = useState([]);
  const [temasSeleccionados, setTemasSeleccionados] = useState([]);
  const [preguntasVistas, setPreguntasVistas] = useState([]);
  const [preguntaActualIndex, setPreguntaActualIndex] = useState(0);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [tiempo, setTiempo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTiempo((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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
        setRespuestas({});
        setResultados({});
        setPreguntaActualIndex(0);
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
          : `❌ Incorrecta. Respuesta: (${pregunta.respuesta_correcta})`;
    });
    setResultados(nuevosResultados);
  };

  const siguientePregunta = () => {
    if (preguntaActualIndex < preguntas.length - 1) {
      setPreguntaActualIndex(preguntaActualIndex + 1);
    }
  };

  const finalizar = () => {
    verificarRespuestas();
    setMostrarResumen(true);
  };

  const toggleTema = (tema) => {
    setTemasSeleccionados((prev) =>
      prev.includes(tema) ? prev.filter((t) => t !== tema) : [...prev, tema]
    );
  };

  const formatTiempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // UseEffect para renderizar las ecuaciones con MathJax
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise().catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntas]);

  return (
    <div className="container">
      <h1>EDBOT: Simulador</h1>

      {!preguntas.length && !mostrarResumen && (
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
          <button onClick={obtenerPreguntas}>Iniciar Simulacro</button>
        </>
      )}

      {preguntas.length > 0 && !mostrarResumen && (
        <div>
          <div className="barra-superior">
            <span>Preguntas: {preguntaActualIndex + 1} de {preguntas.length}</span>
            <span>⏱️ {formatTiempo(tiempo)}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={preguntas[preguntaActualIndex].ejercicio}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="pregunta-container"
            >
              <h2><span dangerouslySetInnerHTML={{ __html: preguntas[preguntaActualIndex].ejercicio }} /></h2>
              {preguntas[preguntaActualIndex].imagen && (
                <img src={preguntas[preguntaActualIndex].imagen} alt="Ejercicio" />
              )}
              <ul>
                {preguntas[preguntaActualIndex].alternativas.map((alt) => (
                  <li key={alt.letra}>
                    <label>
                      <input
                        type="radio"
                        name={`pregunta-${preguntas[preguntaActualIndex].ejercicio}`}
                        value={alt.letra}
                        checked={respuestas[preguntas[preguntaActualIndex].ejercicio] === alt.letra}
                        onChange={() => seleccionarRespuesta(preguntas[preguntaActualIndex].ejercicio, alt.letra)}
                      />
                      <span className="texto-opcion">{alt.letra}: </span>
                      <span dangerouslySetInnerHTML={{ __html: alt.texto }} />
                    </label>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          {preguntaActualIndex < preguntas.length - 1 ? (
            <button onClick={siguientePregunta}>Siguiente</button>
          ) : (
            <button onClick={finalizar}>Finalizar y ver resultados</button>
          )}
        </div>
      )}

      {mostrarResumen && (
        <div className="resumen-final">
          <h2>Resumen del Simulacro</h2>
          <p>Tiempo total: ⏱️ {formatTiempo(tiempo)}</p>
          {preguntas.map((pregunta, index) => (
            <div key={index}>
              <p>
                <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }} />
                <br />
                Tu respuesta: {respuestas[pregunta.ejercicio] || "No respondida"}
                <br />
                Resultado: {resultados[pregunta.ejercicio]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
