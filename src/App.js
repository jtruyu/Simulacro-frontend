import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});

  const iniciarSimulacro = async () => {
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro/1");
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

  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado"))
        .catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntas]);

  return (
    <div className="container">
      <h1>Simulacro de Examen</h1>
      <button onClick={iniciarSimulacro}>Iniciar Simulacro</button>

      {preguntas.length > 0 && (
        <div>
          {preguntas.map((pregunta) => (
            <div key={pregunta.ejercicio} className="pregunta-container">
              
              {/* Ejercicio */}
              <h2 className="ejercicio-texto">
                <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></span>
              </h2>

              {/* Mostrar imagen si existe */}
              {pregunta.imagen && (
                <img src={pregunta.imagen} alt="Ejercicio" className="imagen-ejercicio" />
              )}

              {/* Opciones de respuesta */}
              <ul className="opciones-lista">
                {pregunta.alternativas?.map((alt) => (
                  <li key={alt.letra} className="opcion">
                    <label>
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.ejercicio}`}
                        value={alt.letra}
                        checked={respuestas[pregunta.ejercicio] === alt.letra}
                        onChange={() => seleccionarRespuesta(pregunta.ejercicio, alt.letra)}
                      />
                      <span className="texto-opcion">{alt.letra}: </span>
                      <span className="texto-opcion" dangerouslySetInnerHTML={{ __html: alt.texto }}></span>
                    </label>
                  </li>
                ))}
              </ul>

              {/* Mostrar resultado si ya se verificaron las respuestas */}
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
