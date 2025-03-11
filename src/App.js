import React, { useState } from "react";
import axios from "axios";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [puntaje, setPuntaje] = useState(null);

  const iniciarSimulacro = async () => {
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro/1");
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
      if (respuestas[pregunta.id] === pregunta.Alt_Correcta) {
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
              <h2>{pregunta.Ejercicio}</h2>

              {/* Mostrar imagen si existe */}
              {pregunta.Imagen && <img src={pregunta.Imagen} alt="Ejercicio" style={{ maxWidth: "100%" }} />}

              <ul>
                {["A", "B", "C", "D", "E"].map((letra) => (
                  <li key={letra}>
                    <label>
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.id}`}
                        value={letra}
                        checked={respuestas[pregunta.id] === letra}
                        onChange={() => seleccionarRespuesta(pregunta.id, letra)}
                      />
                      {letra}: {pregunta[letra]}
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
