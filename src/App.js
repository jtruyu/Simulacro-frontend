import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [temas, setTemas] = useState([]);
  const [temasSeleccionados, setTemasSeleccionados] = useState([]);
  const [preguntasVistas, setPreguntasVistas] = useState([]);

  // Cargar los temas disponibles
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

  // Renderizar MathJax cada vez que cambian las preguntas
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado"))
        .catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntas]);

  const obtenerPregunta = async () => {
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro", {
        params: {
          num_preguntas: 1,
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
        setRespuestas({});
        setResultados({});
        setPreguntasVistas((prev) => [
          ...prev,
          ...nuevasPreguntas.map((p) => p.id),
        ]);
      }
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
      <h1>EDBOT: Simulador</h1>

      <h2>Selecciona los temas:</h2>
      {temas.map((tema) => (
        <label key={tema} style={{ marginRight: "10px" }}>
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
            <div key={pregunta.ejercicio} className="pregunta-container" style={{ marginBottom: "30px" }}>
              <h2 className="ejercicio-texto">
                <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></span>
              </h2>

              {pregunta.imagen && (
                <img src={pregunta.imagen} alt="Ejercicio" style={{ maxWidth: "100%", marginBottom: "10px" }} />
              )}

              <ul className="opciones-lista" style={{ listStyleType: "none", paddingLeft: 0 }}>
                {pregunta.alternativas.map((alt) => (
                  <li key={alt.letra} style={{ marginBottom: "5px" }}>
                    <label style={{ fontWeight: "normal" }}>
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.ejercicio}`}
                        value={alt.letra}
                        checked={respuestas[pregunta.ejercicio] === alt.letra}
                        onChange={() => seleccionarRespuesta(pregunta.ejercicio, alt.letra)}
                      />
                      <span style={{ marginLeft: "5px" }}>
                        {alt.letra}: <span dangerouslySetInnerHTML={{ __html: alt.texto }}></span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              {resultados[pregunta.ejercicio] && (
                <p className="resultado">
                  <span dangerouslySetInnerHTML={{ __html: resultados[pregunta.ejercicio] }}></span>
                </p>
              )}
            </div>
          ))}
          <button onClick={verificarRespuestas}>Verificar Respuestas</button>
        </div>
      )}
    </div>
  );
}

export default App;
