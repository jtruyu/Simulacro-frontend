import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [pantalla, setPantalla] = useState("inicio"); // inicio, simulacro, resultados
  const [tiempo, setTiempo] = useState(60 * 60); // 60 minutos en segundos
  const [tiempoActivo, setTiempoActivo] = useState(false);

  // Controlar el temporizador
  useEffect(() => {
    let intervalo;
    if (tiempoActivo && tiempo > 0) {
      intervalo = setInterval(() => {
        setTiempo((tiempoAnterior) => tiempoAnterior - 1);
      }, 1000);
    } else if (tiempo === 0) {
      finalizarSimulacro();
    }

    return () => clearInterval(intervalo);
  }, [tiempoActivo, tiempo]);

  // Renderizar MathJax cuando cambie la pregunta actual
  useEffect(() => {
    if (window.MathJax && preguntas.length > 0) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado"))
        .catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntaActual, preguntas]);

  // Renderizar MathJax en la pantalla de resultados
useEffect(() => {
  if (pantalla === "resultados" && window.MathJax) {
    window.MathJax.typesetPromise()
      .then(() => console.log("MathJax renderizado en resultados"))
      .catch((err) => console.error("MathJax error en resultados:", err));
  }
}, [pantalla]);
  
  const iniciarSimulacro = async () => {
    setCargando(true);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(60 * 60); // Reiniciar el tiempo a 60 minutos
    setTiempoActivo(true);
    setPantalla("simulacro");
    
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro", {
        params: { 
          num_preguntas: 10, // Solicitamos 10 preguntas
          preguntas_vistas: [] // No excluimos ninguna pregunta para el simulacro
        }
      });

      if (response.data && response.data.length > 0) {
        setPreguntas(response.data);
      } else {
        alert("No se pudieron cargar suficientes preguntas. Intenta nuevamente.");
        setPantalla("inicio");
      }
    } catch (error) {
      console.error("Error al obtener preguntas:", error);
      alert("Error al cargar las preguntas. Por favor, intenta de nuevo.");
      setPantalla("inicio");
    } finally {
      setCargando(false);
    }
  };

  const seleccionarRespuesta = (ejercicio, letra) => {
    setRespuestas((prevRespuestas) => ({
      ...prevRespuestas,
      [ejercicio]: letra,
    }));
  };

  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1);
    }
  };

  const preguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1);
    }
  };

  const finalizarSimulacro = () => {
    setTiempoActivo(false);
    
    // Calcular resultados
    let nuevosResultados = {};
    let preguntasCorrectas = 0;
    let preguntasIncorrectas = 0;
    let preguntasSinResponder = 0;
    
    preguntas.forEach((pregunta) => {
      const respuestaUsuario = respuestas[pregunta.ejercicio];
      
      if (!respuestaUsuario) {
        nuevosResultados[pregunta.ejercicio] = "Sin responder";
        preguntasSinResponder++;
      } else if (respuestaUsuario === pregunta.respuesta_correcta) {
        nuevosResultados[pregunta.ejercicio] = "Correcta";
        preguntasCorrectas++;
      } else {
        nuevosResultados[pregunta.ejercicio] = `Incorrecta (Respuesta: ${pregunta.respuesta_correcta})`;
        preguntasIncorrectas++;
      }
    });
    
    setResultados({
      detalles: nuevosResultados,
      correctas: preguntasCorrectas,
      incorrectas: preguntasIncorrectas,
      sinResponder: preguntasSinResponder,
      porcentaje: (preguntasCorrectas / preguntas.length) * 100
    });
    
    setPantalla("resultados");
  };

  const formatoTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };
  
  // Pantalla de inicio
  if (pantalla === "inicio") {
    return (
      <div className="container inicio-container">
        <h1>EDBOT: Simulador de Examen</h1>
        <div className="inicio-content">
          <p>Este simulacro consiste en 10 ejercicios de física seleccionados aleatoriamente.</p>
          <p>Tendrás 60 minutos para completar el examen.</p>
          <p>¡Buena suerte!</p>
          <button className="boton-iniciar" onClick={iniciarSimulacro} disabled={cargando}>
            {cargando ? "Cargando..." : "Iniciar Simulacro"}
          </button>
        </div>
      </div>
    );
  }
  
  // Pantalla de simulacro
  if (pantalla === "simulacro" && preguntas.length > 0) {
    const pregunta = preguntas[preguntaActual];
    
    return (
      <div className="container simulacro-container">
        <div className="encabezado-simulacro">
          <div className="progreso">
            <div className="texto-progreso">Pregunta: {preguntaActual + 1} de {preguntas.length}</div>
            <div className="barra-progreso">
              <div 
                className="progreso-completado" 
                style={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="temporizador">⏱️ {formatoTiempo(tiempo)}</div>
        </div>
        
        <div className="pregunta-container" key={pregunta.ejercicio}>
          <h2 className="ejercicio-texto">
            <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></span>
          </h2>

          {pregunta.imagen && (
            <img src={pregunta.imagen} alt="Ejercicio" className="imagen-ejercicio" />
          )}

          <ul className="opciones-lista">
            {pregunta.alternativas.map((alt) => (
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
        </div>
        
        <div className="controles-navegacion">
          <button 
            className="boton-nav" 
            onClick={preguntaAnterior} 
            disabled={preguntaActual === 0}
          >
            Anterior
          </button>
          
          {preguntaActual === preguntas.length - 1 ? (
            <button className="boton-finalizar" onClick={finalizarSimulacro}>
              Finalizar y ver resultados
            </button>
          ) : (
            <button 
              className="boton-nav" 
              onClick={siguientePregunta}
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // Pantalla de resultados
  if (pantalla === "resultados") {
    return (
      <div className="container resultados-container">
        <h1>Resultados del Simulacro</h1>
        
        <div className="resumen-resultados">
          <div className="estadistica">
            <div className="valor">{resultados.correctas}</div>
            <div className="etiqueta">Correctas</div>
          </div>
          <div className="estadistica">
            <div className="valor">{resultados.incorrectas}</div>
            <div className="etiqueta">Incorrectas</div>
          </div>
          <div className="estadistica">
            <div className="valor">{resultados.sinResponder}</div>
            <div className="etiqueta">Sin responder</div>
          </div>
          <div className="estadistica">
            <div className="valor">{resultados.porcentaje.toFixed(1)}%</div>
            <div className="etiqueta">Puntuación</div>
          </div>
        </div>
        
        <h2>Detalle de respuestas</h2>
        
        <div className="lista-detalles">
          {preguntas.map((pregunta, index) => (
            <div 
              key={pregunta.ejercicio} 
              className={`detalle-pregunta ${
                !respuestas[pregunta.ejercicio] 
                  ? "sin-responder" 
                  : respuestas[pregunta.ejercicio] === pregunta.respuesta_correcta 
                    ? "correcta" 
                    : "incorrecta"
              }`}
            >
              <div className="numero-pregunta">{index + 1}</div>
              <div className="contenido-detalle">
                <div className="texto-ejercicio" dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></div>
                <div className="respuesta-detalle">
                  {!respuestas[pregunta.ejercicio] ? (
                    <span className="estado-respuesta sin-responder">Sin responder</span>
                  ) : respuestas[pregunta.ejercicio] === pregunta.respuesta_correcta ? (
                    <span className="estado-respuesta correcta">
                      Correcta: {pregunta.respuesta_correcta}
                    </span>
                  ) : (
                    <span className="estado-respuesta incorrecta">
                      Incorrecta: Elegiste {respuestas[pregunta.ejercicio]}, 
                      Correcta: {pregunta.respuesta_correcta}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="boton-reiniciar" onClick={() => setPantalla("inicio")}>
          Volver al inicio
        </button>
      </div>
    );
  }
  
  // Pantalla de carga
  return (
    <div className="container cargando-container">
      <div className="spinner"></div>
      <p>Cargando simulacro...</p>
    </div>
  );
}

export default App;
