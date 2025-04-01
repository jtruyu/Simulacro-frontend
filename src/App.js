import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [pregunta, setPregunta] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [resultado, setResultado] = useState("");
  const [temas, setTemas] = useState([]);
  const [temasSeleccionados, setTemasSeleccionados] = useState([]);
  const [userId, setUserId] = useState(() => Math.random().toString(36).substring(7)); // Generar ID único para la sesión

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

  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }
  }, [pregunta]);

  const obtenerPregunta = async () => {
    try {
      const response = await axios.get(`https://mi-proyecto-fastapi.onrender.com/siguiente_pregunta/${userId}`, {
        params: { temas: temasSeleccionados },
        paramsSerializer: (params) => {
          return Object.keys(params)
            .map((key) => (Array.isArray(params[key]) ? params[key].map((val) => `${key}=${encodeURIComponent(val)}`).join("&") : `${key}=${encodeURIComponent(params[key])}`))
            .join("&");
        },
      });

      setPregunta(response.data);
      setRespuesta("");
      setResultado("");
    } catch (error) {
      console.error("Error al obtener la pregunta:", error);
    }
  };

  const seleccionarRespuesta = (letra) => {
    setRespuesta(letra);
  };

  const verificarRespuesta = () => {
    if (pregunta && respuesta === pregunta.respuesta_correcta) {
      setResultado("✅ Respuesta correcta");
    } else {
      setResultado(`❌ Incorrecto, la respuesta correcta es (${pregunta?.respuesta_correcta})`);
    }
  };

  return (
    <div className="container">
      <h1>EDBOT: Simulador</h1>

      <h2>Selecciona los temas:</h2>
      {temas.map((tema) => (
        <label key={tema}>
          <input
            type="checkbox"
            value={tema}
            checked={temasSeleccionados.includes(tema)}
            onChange={() => setTemasSeleccionados((prev) => (prev.includes(tema) ? prev.filter((t) => t !== tema) : [...prev, tema]))}
          />
          {tema}
        </label>
      ))}

      <br />
      <button onClick={obtenerPregunta}>Nueva Pregunta</button>

      {pregunta && (
        <div className="pregunta-container">
          <h2 dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></h2>

          {pregunta.imagen && <img src={pregunta.imagen} alt="Ejercicio" className="imagen-ejercicio" />}

          <ul className="opciones-lista">
            {pregunta.alternativas.map((alt) => (
              <li key={alt.letra}>
                <label>
                  <input type="radio" name="pregunta" value={alt.letra} checked={respuesta === alt.letra} onChange={() => seleccionarRespuesta(alt.letra)} />
                  <span dangerouslySetInnerHTML={{ __html: `${alt.letra}: ${alt.texto}` }}></span>
                </label>
              </li>
            ))}
          </ul>

          <button onClick={verificarRespuesta}>Verificar Respuesta</button>

          {resultado && <p>{resultado}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
