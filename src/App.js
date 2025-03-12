import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [puntaje, setPuntaje] = useState(null);

  const iniciarSimulacro = async () => {
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro/1");
      setPreguntas(response.data);
      setRespuestas({});
      setPuntaje(null);
    } catch (error) {
      console.error("Error al obtener preguntas", error);
    }
  };

  const seleccionarRespuesta = (ejercicio, letra) => {
    setRespuestas({ ...respuestas, [ejercicio]: letra });
  };

  const verificarRespuestas = () => {
    let correctas = 0;
    preguntas.forEach((pregunta) => {
      if (respuestas[pregunta.ejercicio] === pregunta.respuesta_correcta) {
        correctas++;
      }
    });
    setPuntaje(correctas + " / " + preguntas.length);
  };

  // Función para procesar ecuaciones LaTeX
  const formatearLaTeX = (texto) => texto.replaceAll("\\(", "$").replaceAll("\\)", "$");

  // Renderizar MathJax cada vez que cambian las preguntas
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise();
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
              <h2 dangerouslySetInnerHTML={{ __html: formatearLaTeX(pregunta.ejercicio) }}></h2>

              {/* Mostrar imagen si existe */}
              {pregunta.imagen && (
                <img src={pregunta.imagen} alt="Ejercicio" style={{ maxWidth: "100%" }} />
              )}

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
                      {alt.letra}: <span dangerouslySetInnerHTML={{ __html: formatearLaTeX(alt.texto) }}></span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <button onClick={verificarRespuestas}>Verificar Respuestas</button>
          {puntaje !== null && <h2>Puntaje: {puntaje}</h2>}
        </div>
      )}
    </div>
  );
}

export default App;
