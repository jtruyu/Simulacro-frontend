import React, { useState, useEffect } from "react";
import axios from "axios";
import { CSSTransition } from "react-transition-group";  // Importar CSSTransition para animación

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [preguntasVistas, setPreguntasVistas] = useState([]);
  const [numeroPregunta, setNumeroPregunta] = useState(0);  // Número de la pregunta actual
  const [temporalizador, setTemporalizador] = useState(0);  // Temporizador
  const [simulacroTerminado, setSimulacroTerminado] = useState(false);

  // Temporizador para contar el tiempo
  useEffect(() => {
    const timer = setInterval(() => {
      if (!simulacroTerminado) {
        setTemporalizador((prev) => prev + 1);  // Sumar un segundo
      }
    }, 1000); // Cada segundo

    return () => clearInterval(timer); // Limpiar intervalo al desmontar
  }, [simulacroTerminado]);

  useEffect(() => {
    const obtenerPregunta = async () => {
      try {
        const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro", {
          params: { 
            num_preguntas: 10,
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
          setNumeroPregunta(0);  // Empezamos desde la primera pregunta

          setPreguntasVistas((prev) => [
            ...prev,
            ...nuevasPreguntas.map((p) => p.id),
          ]);
        }
      } catch (error) {
        console.error("Error al obtener preguntas:", error);
      }
    };

    obtenerPregunta();
  }, [preguntasVistas]);

  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado"))
        .catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntas]);

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
    setSimulacroTerminado(true);  // Marcamos el simulacro como terminado
  };

  const siguientePregunta = () => {
    if (numeroPregunta < preguntas.length - 1) {
      setNumeroPregunta(numeroPregunta + 1);  // Avanzar a la siguiente pregunta
    }
  };

  const mostrarBarraProgreso = () => {
    return `Pregunta ${numeroPregunta + 1} de ${preguntas.length}`;
  };

  const renderBarraProgreso = () => {
    const porcentaje = ((numeroPregunta + 1) / preguntas.length) * 100;
    return <div className="barra-progreso" style={{ width: `${porcentaje}%` }}></div>;
  };

  return (
    <div className="container">
      <h1>EDBOT: Simulador</h1>

      {/* Barra de progreso */}
      <div className="barra-progreso-container">
        {mostrarBarraProgreso()}
        {renderBarraProgreso()}
      </div>

      {/* Temporizador */}
      <div className="temporizador">
        Tiempo: {Math.floor(temporalizador / 60)}:{temporalizador % 60 < 10 ? `0${temporalizador % 60}` : temporalizador % 60}
      </div>

      {/* Pregunta y opciones */}
      {!simulacroTerminado && preguntas.length > 0 && (
        <div>
          <CSSTransition
            key={preguntas[numeroPregunta].ejercicio}
            timeout={500}
            classNames="fade"
          >
            <div key={preguntas[numeroPregunta].ejercicio} className="pregunta-container">
              <h2 className="ejercicio-texto">
                <span dangerouslySetInnerHTML={{ __html: preguntas[numeroPregunta].ejercicio }}></span>
              </h2>

              {/* Mostrar imagen si existe */}
              {preguntas[numeroPregunta].imagen && (
                <img src={preguntas[numeroPregunta].imagen} alt="Ejercicio" className="imagen-ejercicio" />
              )}

              {/* Opciones de respuesta */}
              <ul className="opciones-lista">
                {preguntas[numeroPregunta].alternativas.map((alt) => (
                  <li key={alt.letra} className="opcion">
                    <label>
                      <input
                        type="radio"
                        name={`pregunta-${preguntas[numeroPregunta].ejercicio}`}
                        value={alt.letra}
                        checked={respuestas[preguntas[numeroPregunta].ejercicio] === alt.letra}
                        onChange={() => seleccionarRespuesta(preguntas[numeroPregunta].ejercicio, alt.letra)}
                      />
                      <span className="texto-opcion">{alt.letra}: </span>
                      <span className="texto-opcion" dangerouslySetInnerHTML={{ __html: alt.texto }}></span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </CSSTransition>

          {/* Botón siguiente o finalizar */}
          <div className="botones">
            {numeroPregunta < preguntas.length - 1 ? (
              <button onClick={siguientePregunta}>Siguiente Pregunta</button>
            ) : (
              <button onClick={verificarRespuestas}>Finalizar y Ver Resultados</button>
            )}
          </div>
        </div>
      )}

      {/* Resultados al finalizar */}
      {simulacroTerminado && (
        <div>
          <h2>Resumen de Resultados</h2>
          <ul>
            {Object.entries(resultados).map(([ejercicio, resultado]) => (
              <li key={ejercicio}>
                {ejercicio}: {resultado}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
