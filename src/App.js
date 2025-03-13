import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({}); // Estado para mensajes de respuesta

  const iniciarSimulacro = async () => {
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro/1");
      setPreguntas(response.data);
      setRespuestas({});
      setResultados({}); // Reiniciar mensajes al iniciar un nuevo simulacro
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
    let nuevosResultados = {}; // Objeto para almacenar los mensajes

    preguntas.forEach((pregunta) => {
      const respuestaUsuario = respuestas[pregunta.ejercicio];

      if (respuestaUsuario === pregunta.respuesta_correcta) {
        nuevosResultados[pregunta.ejercicio] = "✅ Respuesta correcta";
      } else {
        nuevosResultados[pregunta.ejercicio] = `❌ Incorrecto, la respuesta correcta es (${pregunta.respuesta_correcta})`;
      }
    });

    setResultados(nuevosResultados); // Guardamos los mensajes
  };

  // Renderizar MathJax cada vez que cambian las preguntas
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado"))
        .catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntas]);

  return (
    <div>
      <h1>Simulacro de Examen</h1>
      <button onClick={iniciarSimulacro}>Iniciar Simulacro</button>

      {preguntas.length > 0 && (
        <div>
          {preguntas.map((pregunta) => (
            <div key={pregunta.ejercicio}>
              <h2 dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></h2>

              {/* Mostrar imagen si existe */}
              {pregunta.imagen && (
                <img src={pregunta.imagen} alt="Ejercicio" style={{ maxWidth: "100%" }} />
              )}

              <ul>
                {pregunta.alternativas?.map((alt) => (
                  <li key={alt.letra}>
                    <label>
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.ejercicio}`}
                        value={alt.letra}
                        checked={respuestas[pregunta.ejercicio] === alt.letra}
                        onChange={() => seleccionarRespuesta(pregunta.ejercicio, alt.letra)}
                      />
                      {alt.letra}: <span dangerouslySetInnerHTML={{ __html: alt.texto }}></span>
                    </label>
                  </li>
                ))}
              </ul>

              {/* Mostrar mensaje de respuesta debajo de cada pregunta */}
              {resultados[pregunta.ejercicio] && (
                <p>{resultados[pregunta.ejercicio]}</p>
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
