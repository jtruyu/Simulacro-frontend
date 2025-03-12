import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [puntaje, setPuntaje] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const iniciarSimulacro = async () => {
    setCargando(true);
    setError("");
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro/1");
      if (response.data.error) {
        setError(response.data.error);
        setPreguntas([]);
      } else {
        setPreguntas(response.data);
      }
      setRespuestas({});
      setPuntaje(null);
    } catch (error) {
      console.error("Error al obtener preguntas", error);
      setError("No se pudieron cargar las preguntas. Inténtalo de nuevo.");
    }
    setCargando(false);
  };

  const seleccionarRespuesta = (ejercicio, letra) => {
    setRespuestas({ ...respuestas, [ejercicio]: letra });
  };

  const verificarRespuestas = () => {
    if (preguntas.length === 0) return;

    let correctas = preguntas.filter(
      (pregunta) => respuestas[pregunta.ejercicio] === pregunta.respuesta_correcta
    ).length;

    setPuntaje(`${correctas} / ${preguntas.length}`);
  };

  // Formatear texto con LaTeX
  const formatearLaTeX = (texto) => {
    return texto
      .replace(/\n/g, "<br/>") // Corregir saltos de línea
      .replace(/\$(.*?)\$/g, "\\($1\\)"); // Asegurar compatibilidad con MathJax
  };

  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise().catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntas]);

  return (
    <div>
      <h1>Simulacro de Examen</h1>
      <button onClick={iniciarSimulacro} disabled={cargando}>
        {cargando ? "Cargando..." : "Iniciar Simulacro"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {preguntas.length > 0 && (
        <div>
          {preguntas.map((pregunta) => (
            <div key={pregunta.ejercicio}>
              <h2 dangerouslySetInnerHTML={{ __html: formatearLaTeX(pregunta.ejercicio) }}></h2>

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
