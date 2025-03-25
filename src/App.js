import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [temas, setTemas] = useState([]);
  const [temasSeleccionados, setTemasSeleccionados] = useState([]);

  useEffect(() => {
    const obtenerTemas = async () => {
      try {
        const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/temas");
        setTemas(response.data);
      } catch (error) {
        console.error("Error al obtener los temas:", error);
      }
    };

    obtenerTemas();
  }, []);

  const obtenerPregunta = async () => {
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro", {
        params: { num_preguntas: 1, temas: temasSeleccionados },
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

      setPreguntas(response.data);
      setRespuestas({});
      setResultados({});
    } catch (error) {
      console.error("Error al obtener preguntas:", error);
    }
  };

  const seleccionarRespuesta = (ejercicio, letra) => {
    setRespuestas((prevRespuestas) => ({
      ...prevRespuestas,
      [ejercicio]: letra,
    }));
  };

  const verificarRespuestas = () => {
    let nuevosResultados = {};

    preguntas.forEach((pregunta) => {
      const respuestaUsuario = respuestas[pregunta.ejercicio];

      if (respuestaUsuario === pregunta.respuesta_correcta) {
        nuevosResultados[pregunta.ejercicio] = "✅ Respuesta correcta";
      } else {
        nuevosResultados[pregunta.ejercicio] = `❌ Incorrecto, la respuesta correcta es (${pregunta.respuesta_correcta})`;
      }
    });

    setResultados(nuevosResultados);
  };

  const toggleTema = (tema) => {
    setTemasSeleccionados((prev) =>
      prev.includes(tema) ? prev.filter((t) => t !== tema) : [...prev, tema]
    );
  };

  return (
    <div className="container">
      <h1>Simulacro de Examen</h1>

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
      <button onClick={obtenerPregunta}>Nueva Pregunta</button>

      {preguntas.length > 0 && (
        <div>
          {preguntas.map((pregunta) => (
            <div key={pregunta.ejercicio} className="pregunta-container">
              {/* Renderizar ecuaciones en el enunciado */}
              <h2 dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></h2>

              {pregunta.imagen && <img src={pregunta.imagen} alt="Ejercicio" />}

              <ul>
                {pregunta.alternativas.map((alt) => (
                  <li key={alt.letra}>
                    <label>
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.ejercicio}`}
                        value={alt.letra}
                        checked={respuestas[pregunta.ejercicio] === alt.letra}
                        onChange={() => seleccionarRespuesta(pregunta.ejercicio, alt.letra)}
                      />
                      <span dangerouslySetInnerHTML={{ __html: `${alt.letra}: ${alt.texto}` }}></span>
                    </label>
                  </li>
                ))}
              </ul>

              {resultados[pregunta.ejercicio] && <p>{resultados[pregunta.ejercicio]}</p>}
            </div>
          ))}
          <button onClick={verificarRespuestas}>Verificar Respuestas</button>
        </div>
      )}
    </div>
  );
}

export default App;
