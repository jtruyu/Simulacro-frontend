import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [pantalla, setPantalla] = useState("inicio");
  const [tiempo, setTiempo] = useState(0);
  const [tiempoInicial, setTiempoInicial] = useState(0);
  const [tiempoActivo, setTiempoActivo] = useState(false);
  const [tipoPrueba, setTipoPrueba] = useState("");
  
  const [datosUsuario, setDatosUsuario] = useState({
    nombre: "",
    correo: ""
  });
  
  const [comentarioResultado, setComentarioResultado] = useState("");
  const [resultadosTemporales, setResultadosTemporales] = useState(null);

  useEffect(() => {
    let intervalo;
    if (tiempoActivo && tiempo > 0) {
      intervalo = setInterval(() => {
        setTiempo((tiempoAnterior) => tiempoAnterior - 1);
      }, 1000);
    } else if (tiempo === 0 && tiempoInicial > 0) {
      finalizarPrueba();
    }

    return () => clearInterval(intervalo);
  }, [tiempoActivo, tiempo]);

  useEffect(() => {
    if (window.MathJax && preguntas.length > 0) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado"))
        .catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntaActual, preguntas]);

  useEffect(() => {
    if (pantalla === "resultados" && window.MathJax) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado en resultados"))
        .catch((err) => console.error("MathJax error en resultados:", err));
    }
  }, [pantalla]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosUsuario({
      ...datosUsuario,
      [name]: value
    });
  };

  const validarFormulario = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return datosUsuario.nombre.trim() !== "" && emailRegex.test(datosUsuario.correo);
  };

  const obtenerOrdenCurso = (curso) => {
    const ordenCursos = {
      "RM": 1,
      "Aritmética": 2,
      "Álgebra": 3,
      "Geometría": 4,
      "Trigonometría": 5,
      "Física": 6,
      "Química": 7
    };
    
    return ordenCursos[curso] || 999;
  };
    
  const iniciarDiagnostico = async () => {
    setTipoPrueba("diagnostico");
    setCargando(true);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(40 * 60);
    setTiempoInicial(40 * 60);
    setTiempoActivo(true);
    setPantalla("simulacro");
    
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/diagnostico", {
        params: { 
          num_preguntas: 10
        }
      });
  
      if (response.data && response.data.length > 0) {
        const preguntasOrdenadas = [...response.data].sort((a, b) => {
          return obtenerOrdenCurso(a.curso) - obtenerOrdenCurso(b.curso);
        });
        
        setPreguntas(preguntasOrdenadas);
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

  const iniciarSimulacro = async () => {
    setTipoPrueba("simulacro");
    setCargando(true);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(120 * 60);
    setTiempoInicial(120 * 60);
    setTiempoActivo(true);
    setPantalla("simulacro");
    
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro");
  
      if (response.data && response.data.length > 0) {
        const preguntasOrdenadas = [...response.data].sort((a, b) => {
          return obtenerOrdenCurso(a.curso) - obtenerOrdenCurso(b.curso);
        });
        
        setPreguntas(preguntasOrdenadas);
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

  const calcularPuntajePorCurso = (curso) => {
    switch (curso) {
      case "RM":
      case "RV":
        return 0.63;
      case "Aritmética":
      case "Álgebra":
      case "Geometría":
      case "Trigonometría":
        return 0.76;
      case "Física":
        return 0.81;
      case "Química":
        return 0.46;
      default:
        return 0.7;
    }
  };

  const obtenerComentario = (notaVigesimal) => {
    if (tipoPrueba === "diagnostico") {
      if (notaVigesimal < 10) {
        return "Es necesario fortalecer tu base para el examen de admisión a la UNI. Te animamos a practicar con dedicación y a revisar los conceptos fundamentales.";
      } else if (notaVigesimal < 14) {
        return "Tienes potencial para lograr el ingreso a la UNI, pero se requiere mayor consistencia. Identifica tus áreas de oportunidad y trabaja intensamente en ellas.";
      } else if (notaVigesimal < 18) {
        return "¡Vas por buen camino! Estás demostrando un buen nivel de preparación. Continúa practicando para afianzar tus conocimientos y aumentar tus posibilidades de éxito.";
      } else {
        return "¡Excelente desempeño! Tu preparación te posiciona para competir por los primeros puestos. ¡Sigue así y alcanzarás tus metas!";
      }
    } else {
      return "Los resultados detallados de tu simulacro serán enviados a tu correo electrónico. Revisa tu bandeja de entrada en las próximas horas.";
    }
  };

  const finalizarPrueba = () => {
    setTiempoActivo(false);
    
    let nuevosResultados = {};
    let preguntasCorrectas = 0;
    let preguntasIncorrectas = 0;
    let preguntasSinResponder = 0;
    let notaTotal = 0;
    
    preguntas.forEach((pregunta) => {
      const respuestaUsuario = respuestas[pregunta.ejercicio];
      
      if (!respuestaUsuario) {
        nuevosResultados[pregunta.ejercicio] = "Sin responder";
        preguntasSinResponder++;
      } else if (respuestaUsuario === pregunta.respuesta_correcta) {
        nuevosResultados[pregunta.ejercicio] = "Correcta";
        preguntasCorrectas++;
        notaTotal += calcularPuntajePorCurso(pregunta.curso);
      } else {
        nuevosResultados[pregunta.ejercicio] = `Incorrecta (Respuesta: ${pregunta.respuesta_correcta})`;
        preguntasIncorrectas++;
      }
    });
    
    const porcentaje = (preguntasCorrectas / preguntas.length) * 100;
    notaTotal = Math.min(notaTotal, 20);
    const tiempoUsado = tiempoInicial - tiempo;
    
    setResultadosTemporales({
      detalles: nuevosResultados,
      correctas: preguntasCorrectas,
      incorrectas: preguntasIncorrectas,
      sinResponder: preguntasSinResponder,
      porcentaje: porcentaje,
      notaVigesimal: notaTotal,
      tiempoUsado: tiempoUsado,
      respuestas: respuestas
    });
    
    setComentarioResultado(obtenerComentario(notaTotal));
    setPantalla("formulario");
  };

  const procesarFormulario = async () => {
    if (!validarFormulario()) {
      alert("Por favor, completa correctamente todos los campos del formulario");
      return;
    }

    setResultados(resultadosTemporales);
    
    try {
      const endpoint = tipoPrueba === "diagnostico" 
        ? "https://mi-proyecto-fastapi.onrender.com/guardar-diagnostico" 
        : "https://mi-proyecto-fastapi.onrender.com/guardar-simulacro";
      
      const dataToSend = {
        nombre: datosUsuario.nombre,
        correo: datosUsuario.correo,
        resultado: resultadosTemporales.notaVigesimal,
        preguntas_correctas: resultadosTemporales.correctas,
        preguntas_incorrectas: resultadosTemporales.incorrectas,
        preguntas_sin_responder: resultadosTemporales.sinResponder,
        tiempo_usado: resultadosTemporales.tiempoUsado,
        respuestas: JSON.stringify(resultadosTemporales.respuestas)
      };

      console.log("Datos a enviar:", dataToSend);
      
      const response = await axios.post(endpoint, dataToSend);
      console.log("Respuesta del servidor:", response.data);
    } catch (error) {
      console.error("Error al guardar el resultado:", error.response ? error.response.data : error.message);
      alert("Hubo un error al guardar tus resultados. Por favor intenta nuevamente.");
    }
    
    setPantalla("resultados");
  };

  const formatoTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };
  
  if (pantalla === "inicio") {
    return (
      <div className="container inicio-container">
        <header className="header">
          <h1>EDBOT</h1>
          <p>Preparación preuniversitaria implementada con IA</p>
        </header>
        
        <div className="card inicio-card">
          <div className="card-header">
            <h2>Evalúa tu preparación</h2>
          </div>
          
          <div className="card-body">
            <div className="test-option">
              <h3>Prueba de diagnóstico</h3>
              <p>10 ejercicios • 40 minutos</p>
              <p>Evalúa tu nivel actual con preguntas clave</p>
              <button className="btn-primary" onClick={iniciarDiagnostico}>
                Comenzar
              </button>
            </div>
            
            <div className="divider">o</div>
            
            <div className="test-option">
              <h3>Simulacro completo</h3>
              <p>30 ejercicios • 120 minutos</p>
              <p>Simulación real del examen de admisión</p>
              <button className="btn-primary" onClick={iniciarSimulacro}>
                Comenzar
              </button>
            </div>
          </div>
        </div>
        
        <footer className="footer">
          <p>© {new Date().getFullYear()} EDBOT - Todos los derechos reservados</p>
        </footer>
      </div>
    );
  }
  
  if (pantalla === "formulario") {
    return (
      <div className="container formulario-container">
        <header className="header">
          <h1>EDBOT</h1>
          <p>Preparación preuniversitaria implementada con IA</p>
        </header>
        
        <div className="card">
          <div className="card-header">
            <h2>{tipoPrueba === "diagnostico" ? "¡Prueba completada!" : "¡Simulacro completado!"}</h2>
          </div>
          
          <div className="card-body">
            <p className="form-description">Por favor, completa tus datos para {tipoPrueba === "diagnostico" ? "ver tus resultados" : "recibir tus resultados por correo"}:</p>
            
            <form className="formulario-registro">
              <div className="campo-formulario">
                <label htmlFor="nombre">Nombre completo:</label>
                <input 
                  type="text" 
                  id="nombre" 
                  name="nombre" 
                  value={datosUsuario.nombre}
                  onChange={handleInputChange}
                  placeholder="Ingresa tu nombre completo"
                  required
                />
              </div>
              
              <div className="campo-formulario">
                <label htmlFor="correo">Correo electrónico:</label>
                <input 
                  type="email" 
                  id="correo" 
                  name="correo" 
                  value={datosUsuario.correo}
                  onChange={handleInputChange}
                  placeholder="Ingresa tu correo electrónico"
                  required
                />
              </div>
              
              <div className="form-info">
                <p>Estos datos nos permitirán {tipoPrueba === "diagnostico" ? "mostrarte tus resultados y recomendaciones" : "enviarte los resultados detallados de tu simulacro"}.</p>
              </div>
              
              <button 
                type="button" 
                className="btn-primary" 
                onClick={procesarFormulario} 
                disabled={!validarFormulario()}
              >
                {tipoPrueba === "diagnostico" ? "Ver mis resultados" : "Enviar mis resultados"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  
  if (pantalla === "simulacro" && preguntas.length > 0) {
    const pregunta = preguntas[preguntaActual];
    const progreso = ((preguntaActual + 1) / preguntas.length) * 100;
    
    return (
      <div className="container test-container">
        <div className="test-header">
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progreso}%` }}></div>
            <span className="progress-text">
              Pregunta {preguntaActual + 1} de {preguntas.length}
            </span>
          </div>
          <div className="timer">
            <span className="timer-icon">⏱️</span>
            {formatoTiempo(tiempo)}
          </div>
        </div>
        
        <div className="question-card">
          <div className="question-text" dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></div>
          
          {pregunta.imagen && (
            <div className="question-image">
              <img src={pregunta.imagen} alt="Ejercicio" />
            </div>
          )}
          
          <div className="options-container">
            {pregunta.alternativas.map((alt) => (
              <div 
                key={alt.letra} 
                className={`option ${respuestas[pregunta.ejercicio] === alt.letra ? 'selected' : ''}`}
                onClick={() => seleccionarRespuesta(pregunta.ejercicio, alt.letra)}
              >
                <span className="option-letter">{alt.letra}</span>
                <span className="option-text" dangerouslySetInnerHTML={{ __html: alt.texto }}></span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="navigation-buttons">
          <button 
            className="btn-secondary" 
            onClick={preguntaAnterior} 
            disabled={preguntaActual === 0}
          >
            Anterior
          </button>
          
          {preguntaActual === preguntas.length - 1 ? (
            <button className="btn-primary" onClick={finalizarPrueba}>
              Finalizar prueba
            </button>
          ) : (
            <button className="btn-primary" onClick={siguientePregunta}>
              Siguiente
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (pantalla === "resultados") {
    return (
      <div className="container results-container">
        <header className="header">
          <h1>EDBOT</h1>
          <p>Preparación preuniversitaria implementada con IA</p>
        </header>
        
        <div className="card results-card">
          <div className="card-header">
            <h2>Resultados {tipoPrueba === "diagnostico" ? "del diagnóstico" : "del simulacro"}</h2>
          </div>
          
          <div className="card-body">
            <div className="user-data">
              <p><strong>Nombre:</strong> {datosUsuario.nombre}</p>
              <p><strong>Correo:</strong> {datosUsuario.correo}</p>
              <p><strong>Tiempo utilizado:</strong> {formatoTiempo(resultados.tiempoUsado)}</p>
            </div>
            
            <div className="results-summary">
              <div className="score-display">
                <div className="score-value">{resultados.notaVigesimal.toFixed(1)}</div>
                <div className="score-label">Puntuación (0-20)</div>
              </div>
              
              <div className="results-details">
                <div className="detail-item correct">
                  <span className="detail-value">{resultados.correctas}</span>
                  <span className="detail-label">Correctas</span>
                </div>
                <div className="detail-item incorrect">
                  <span className="detail-value">{resultados.incorrectas}</span>
                  <span className="detail-label">Incorrectas</span>
                </div>
                <div className="detail-item">
                  <span className="detail-value">{resultados.sinResponder}</span>
                  <span className="detail-label">Sin responder</span>
                </div>
              </div>
            </div>
            
            <div className="feedback-section">
              <h3>Evaluación de tu desempeño</h3>
              <p>{comentarioResultado}</p>
            </div>
            
            {tipoPrueba === "diagnostico" && (
              <div className="answers-review">
                <h3>Detalle de respuestas</h3>
                {preguntas.map((pregunta, index) => (
                  <div key={index} className={`answer-item ${
                    !respuestas[pregunta.ejercicio] 
                      ? 'unanswered' 
                      : respuestas[pregunta.ejercicio] === pregunta.respuesta_correcta 
                        ? 'correct' 
                        : 'incorrect'
                  }`}>
                    <div className="question-number">{index + 1}</div>
                    <div className="question-content">
                      <div className="question-text" dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></div>
                      <div className="answer-status">
                        {!respuestas[pregunta.ejercicio] ? (
                          <span>Sin responder</span>
                        ) : respuestas[pregunta.ejercicio] === pregunta.respuesta_correcta ? (
                          <span>Correcta: {pregunta.respuesta_correcta} ({calcularPuntajePorCurso(pregunta.curso)} pts)</span>
                        ) : (
                          <span>Tu respuesta: {respuestas[pregunta.ejercicio]} • Correcta: {pregunta.respuesta_correcta}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {tipoPrueba === "simulacro" && (
              <div className="simulacro-message">
                <p>Los resultados detallados de tu simulacro serán enviados a tu correo electrónico.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="actions-container">
          <button className="btn-primary" onClick={() => setPantalla("inicio")}>
            Volver al inicio
          </button>
        </div>
        
        <footer className="footer">
          <p>© {new Date().getFullYear()} EDBOT - Todos los derechos reservados</p>
        </footer>
      </div>
    );
  }
  
  return (
    <div className="container loading-container">
      <div className="spinner"></div>
      <p>Cargando {tipoPrueba === "diagnostico" ? "prueba de diagnóstico" : "simulacro"}...</p>
    </div>
  );
}

export default App;
