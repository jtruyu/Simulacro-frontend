import React, { useState } from "react";
import axios from "axios";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [puntaje, setPuntaje] = useState(null);

  const iniciarSimulacro = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/simulacro/5");
      setPreguntas(response.data);
      setRespuestas({}); // Resetear respuestas
      setPuntaje(null);
    } catch (error) {
      console.error("Error al obtener preguntas", error);
    }
  };

  const seleccionarRespuesta = (preguntaId, letra) => {
    setRespuestas({ ...respuestas, [preguntaId]: letra });
  };

  const verificarRespuestas = () => {
    let correctas = 0;
    preguntas.forEach((pregunta) => {
      if (respuestas[pregunta.id] === pregunta.respuesta_correcta) {
        correctas++;
      }
    });
    setPuntaje(correctas + " / " + preguntas.length);
  };

  return (
    <div>
      <h1>Simulacro de Examen</h1>
      <button onClick={iniciarSimulacro}>Iniciar Simulacro</button>

      {preguntas.length > 0 && (
        <div>
          {preguntas.map((pregunta) => (
            <div key={pregunta.id}>
              <h2>{pregunta.enunciado}</h2>
              <ul>
                {pregunta.alternativas.map((alt) => (
                  <li key={alt.letra}>
                    <label>
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.id}`}
                        value={alt.letra}
                        checked={respuestas[pregunta.id] === alt.letra}
                        onChange={() => seleccionarRespuesta(pregunta.id, alt.letra)}
                      />
                      {alt.letra}: {alt.texto}
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
