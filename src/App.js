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
          "Sistema Internacional", "Análisis dimensional", "Vectores", "Funciones",
          "Cantidades cinemáticas", "MRU", "MRUV", "Caída libre",
          "Movimiento bidimensional", "Movimiento de proyectil",
          "Cantidades cinemáticas angulares", "MCU", "MCUV",
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
        paramsSerializer: (params) =>
          Object.keys(params).map((key) => {
            if (Array.isArray(params[key])) {
              return params[key].map((val) => `${key}=${encodeURIComponent(val)}`).join("&");
            }
            return `${key}=${encodeURIComponent(params[key])}`;
          }).join("&"),
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
        respuestaUsuario === pregunta.respuesta_correcta ? "correcta" : "incorrecta";
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

  useEffect(() => {
    if (window.MathJax) window.MathJax.typeset();
  }, [preguntas]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-center mb-4">EDBOT: Simulador</h1>

      {!preguntas.length && !mostrarResumen && (
        <>
          <h2 className="text-xl mb-2">Selecciona los temas:</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {temas.map((tema) => (
              <label key={tema} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={tema}
                  checked={temasSeleccionados.includes(tema)}
                  onChange={() => toggleTema(tema)}
                />
                <span>{tema}</span>
              </label>
            ))}
          </div>
          <button
            onClick={obtenerPreguntas}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Iniciar Simulacro
          </button>
        </>
      )}

      {preguntas.length > 0 && !mostrarResumen && (
        <div>
          <div className="flex justify-between items-center mb-4 text-sm text-gray-700">
            <span>Pregunta {preguntaActualIndex + 1} de {preguntas.length}</span>
            <span>⏱️ {formatTiempo(tiempo)}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={preguntas[preguntaActualIndex].ejercicio}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-4 rounded shadow mb-4"
            >
              <h2 className="mb-2 text-lg font-medium">
                <span dangerouslySetInnerHTML={{ __html: preguntas[preguntaActualIndex].ejercicio }} />
              </h2>
              {preguntas[preguntaActualIndex].imagen && (
                <img src={preguntas[preguntaActualIndex].imagen} alt="Ejercicio" className="mb-4 w-full" />
              )}
              <ul className="space-y-2">
                {preguntas[preguntaActualIndex].alternativas.map((alt) => (
                  <li key={alt.letra}>
                    <label className="flex items-start space-x-2">
                      <input
                        type="radio"
                        name={`pregunta-${preguntas[preguntaActualIndex].ejercicio}`}
                        value={alt.letra}
                        checked={respuestas[preguntas[preguntaActualIndex].ejercicio] === alt.letra}
                        onChange={() =>
                          seleccionarRespuesta(preguntas[preguntaActualIndex].ejercicio, alt.letra)
                        }
                      />
                      <span>
                        <strong>{alt.letra}:</strong>{" "}
                        <span dangerouslySetInnerHTML={{ __html: alt.texto }} />
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          {preguntaActualIndex < preguntas.length - 1 ? (
            <button
              onClick={siguientePregunta}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={finalizar}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Finalizar y ver resultados
            </button>
          )}
        </div>
      )}

      {mostrarResumen && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Resumen del Simulacro</h2>
          <p className="mb-4">⏱️ Tiempo total: {formatTiempo(tiempo)}</p>
          <div className="space-y-4">
            {preguntas.map((pregunta, index) => {
              const esCorrecta = resultados[pregunta.ejercicio] === "correcta";
              const respuestaUsuario = respuestas[pregunta.ejercicio] || "No respondida";
              const respuestaCorrecta = pregunta.respuesta_correcta;

              return (
                <div
                  key={index}
                  className={`p-4 rounded shadow ${
                    esCorrecta ? "bg-green-100 border-l-4 border-green-600" : "bg-red-100 border-l-4 border-red-600"
                  }`}
                >
                  <p className="mb-2 font-medium">
                    <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }} />
                  </p>
                  <p>
                    Tu respuesta: <strong>{respuestaUsuario}</strong><br />
                    {esCorrecta ? (
                      <span className="text-green-700 font-semibold">✅ Correcta</span>
                    ) : (
                      <span className="text-red-700 font-semibold">❌ Incorrecta</span>
                    )}{" "}
                    {!esCorrecta && (
                      <span className="ml-2">
                        Respuesta correcta: <strong>{respuestaCorrecta}</strong>
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
