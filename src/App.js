import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

// Define target times for the simulacro (Peru time)
const HORA_INICIO_SIMULACRO_HORA = 23; // 11 PM
const HORA_INICIO_SIMULACRO_MINUTO = 20;
const HORA_FIN_SIMULACRO_HORA = 23;    // 11 PM
const HORA_FIN_SIMULACRO_MINUTO = 25;

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

  // New states for simulacro schedule
  const [tiempoParaSimulacro, setTiempoParaSimulacro] = useState(null); // Seconds until simulacro starts
  const [puedeIniciarSimulacro, setPuedeIniciarSimulacro] = useState(false); // True if within the 11:20-11:25 PM window
  const [simulacroExpirado, setSimulacroExpirado] = useState(false); // True if past 11:25 PM

  useEffect(() => {
    const calcularEstadoSimulacro = () => {
      const ahora = new Date(); // Assumes client's local time is Peru time

      const inicioSimulacroHoy = new Date(ahora);
      inicioSimulacroHoy.setHours(HORA_INICIO_SIMULACRO_HORA, HORA_INICIO_SIMULACRO_MINUTO, 0, 0);

      const finSimulacroHoy = new Date(ahora);
      finSimulacroHoy.setHours(HORA_FIN_SIMULACRO_HORA, HORA_FIN_SIMULACRO_MINUTO, 0, 0);

      if (ahora >= finSimulacroHoy) {
        setTiempoParaSimulacro(0);
        setPuedeIniciarSimulacro(false);
        setSimulacroExpirado(true);
      } else if (ahora >= inicioSimulacroHoy) {
        setTiempoParaSimulacro(0); // Simulacro is active
        setPuedeIniciarSimulacro(true);
        setSimulacroExpirado(false);
      } else {
        // Countdown to start
        const diffMs = inicioSimulacroHoy - ahora;
        setTiempoParaSimulacro(Math.max(0, Math.floor(diffMs / 1000)));
        setPuedeIniciarSimulacro(false);
        setSimulacroExpirado(false);
      }
    };

    calcularEstadoSimulacro(); // Initial check
    const intervaloEstado = setInterval(calcularEstadoSimulacro, 1000); // Update every second

    return () => clearInterval(intervaloEstado);
  }, []);


useEffect(() => {
    let intervalo;
    if (tiempoActivo && tiempo > 0) {
      intervalo = setInterval(() => {
        setTiempo((tiempoAnterior) => tiempoAnterior - 1);
      }, 1000);
    } else if (tiempoActivo && tiempo === 0 && tiempoInicial > 0) { // Modified condition to ensure tiempoActivo
      finalizarPrueba();
    }

    return () => clearInterval(intervalo);
}, [tiempoActivo, tiempo, tiempoInicial]);

useEffect(() => {
    if (window.MathJax && preguntas.length > 0 && pantalla === "simulacro") {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado en simulacro"))
        .catch((err) => console.error("MathJax error en simulacro:", err));
    }
}, [preguntaActual, preguntas, pantalla]);

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
      "Química": 7,
      "RV": 8
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
let preguntasObtenidas = [...response.data].sort((a, b) => {
            return obtenerOrdenCurso(a.curso) - obtenerOrdenCurso(b.curso);
        });
setPreguntas(preguntasObtenidas.slice(0,10));
      } else {
        alert("No se pudieron cargar suficientes preguntas. Intenta nuevamente.");
setPantalla("inicio");
      }
    } catch (error) {
      console.error("Error al obtener preguntas de diagnóstico:", error);
alert("Error al cargar las preguntas de diagnóstico. Por favor, intenta de nuevo.");
      setPantalla("inicio");
} finally {
      setCargando(false);
    }
  };

  const iniciarSimulacro = async () => {
    const ahora = new Date();
    const inicioSimulacroHoy = new Date(ahora);
    inicioSimulacroHoy.setHours(HORA_INICIO_SIMULACRO_HORA, HORA_INICIO_SIMULACRO_MINUTO, 0, 0);
    const finSimulacroHoy = new Date(ahora);
    finSimulacroHoy.setHours(HORA_FIN_SIMULACRO_HORA, HORA_FIN_SIMULACRO_MINUTO, 0, 0);

    if (ahora < inicioSimulacroHoy) {
      alert(`El simulacro comienza a las ${String(HORA_INICIO_SIMULACRO_HORA).padStart(2, '0')}:${String(HORA_INICIO_SIMULACRO_MINUTO).padStart(2, '0')}.`);
      return;
    }
    if (ahora >= finSimulacroHoy) {
      alert("El tiempo para iniciar el simulacro ha finalizado.");
      setPuedeIniciarSimulacro(false); // Ensure button is disabled
      setSimulacroExpirado(true);    // Mark as expired
      return;
    }

    const duracionRestanteSegundos = Math.max(0, Math.floor((finSimulacroHoy - ahora) / 1000));
    if (duracionRestanteSegundos <= 0) {
        alert("El tiempo para el simulacro ha finalizado.");
        setPuedeIniciarSimulacro(false);
        setSimulacroExpirado(true);
        return;
    }

    setTipoPrueba("simulacro");
    setCargando(true);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(duracionRestanteSegundos); // Set time remaining until 11:25 PM
    setTiempoInicial(duracionRestanteSegundos); // Set time remaining until 11:25 PM
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
      console.error("Error al obtener preguntas de simulacro:", error);
alert("Error al cargar las preguntas de simulacro. Por favor, intenta de nuevo.");
      setPantalla("inicio");
} finally {
      setCargando(false);
    }
  };

const seleccionarRespuesta = (ejercicioId, letra) => {
    setRespuestas((prevRespuestas) => ({
      ...prevRespuestas,
      [ejercicioId]: letra,
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
const ejercicioId = pregunta.ejercicio; 
      const respuestaUsuario = respuestas[ejercicioId];
      
      if (!respuestaUsuario) {
        nuevosResultados[ejercicioId] = "Sin responder";
        preguntasSinResponder++;
      } else if (respuestaUsuario === pregunta.respuesta_correcta) {
        nuevosResultados[ejercicioId] = "Correcta";
        preguntasCorrectas++;
        notaTotal += calcularPuntajePorCurso(pregunta.curso);
      } else {
nuevosResultados[ejercicioId] = `Incorrecta (Respuesta correcta: ${pregunta.respuesta_correcta})`;
        preguntasIncorrectas++;
      }
    });

    const porcentaje = preguntas.length > 0 ?
(preguntasCorrectas / preguntas.length) * 100 : 0;
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
        ?
"https://mi-proyecto-fastapi.onrender.com/guardar-diagnostico" 
        : "https://mi-proyecto-fastapi.onrender.com/guardar-simulacro";
const dataToSend = {
        nombre: datosUsuario.nombre,
        correo: datosUsuario.correo,
        resultado: resultadosTemporales.notaVigesimal,
        preguntas_correctas: resultadosTemporales.correctas,
        preguntas_incorrectas: resultadosTemporales.incorrectas,
        preguntas_sin_responder: resultadosTemporales.sinResponder,
        tiempo_usado: resultadosTemporales.tiempoUsado,
        ...(tipoPrueba === "simulacro" && { respuestas: JSON.stringify(resultadosTemporales.respuestas) })
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
    if (segundos === null || segundos === undefined) return "00:00";
    const minutos = Math.floor(segundos / 60);
const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

if (pantalla === "inicio") {
    return (
      <div className="container inicio-container">
        <h1>EDBOT<br />Preparación preuniversitaria implementada con IA</h1>
        <div className="inicio-content">
          <div className="columnas-inicio">
            <div className="columna-prueba card-estilo">
              <h2>Prueba de diagnóstico</h2>
              <p>Esta prueba de diagnóstico contiene 10 
ejercicios seleccionados de exámenes de admisión a la Universidad Nacional de Ingeniería (UNI), que te permitirán evaluar tu nivel de preparación.</p>
              <p>Dispondrás de 40 minutos para resolverlos.</p>
              <button className="boton-iniciar" onClick={iniciarDiagnostico} disabled={cargando}>
                Comenzar diagnóstico
              </button>
            </div>
            
<div className="columna-prueba card-estilo">
              <h2>Simulacro</h2>
              <p>Este simulacro completo contiene 30 ejercicios similares a los del examen de admisión de la UNI, que te permitirán evaluar tu nivel de preparación en condiciones reales.</p>
              {/* Simulacro Time Logic Display */}
              {simulacroExpirado ? (
                <p style={{ fontWeight: 'bold', color: '#dc3545' }}>El tiempo para el simulacro ha terminado.</p>
              ) : tiempoParaSimulacro !== null && tiempoParaSimulacro > 0 ? (
                <p style={{ fontWeight: 'bold', color: '#007bff' }}>El simulacro programado comenzará en: {formatoTiempo(tiempoParaSimulacro)}</p>
              ) : puedeIniciarSimulacro ? (
                <p style={{ fontWeight: 'bold', color: 'green' }}>¡El simulacro está activo! Finaliza a las {`${String(HORA_FIN_SIMULACRO_HORA).padStart(2, '0')}:${String(HORA_FIN_SIMULACRO_MINUTO).padStart(2, '0')}H`}.</p>
              ) : (
                <p>Verificando horario del simulacro...</p> 
              )}
              <p>Dispondrás de tiempo limitado desde las {`${String(HORA_INICIO_SIMULACRO_HORA).padStart(2, '0')}:${String(HORA_INICIO_SIMULACRO_MINUTO).padStart(2, '0')}H`} hasta las {`${String(HORA_FIN_SIMULACRO_HORA).padStart(2, '0')}:${String(HORA_FIN_SIMULACRO_MINUTO).padStart(2, '0')}H`} (Hora Perú) para resolverlo.</p>
              <button 
                className="boton-iniciar" 
                onClick={iniciarSimulacro} 
                disabled={cargando || !puedeIniciarSimulacro || simulacroExpirado}
              >
                {simulacroExpirado ? "Simulacro Finalizado" : "Comenzar simulacro"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
}
  
  // ... (el resto de tu código: pantalla "formulario", "simulacro", "resultados", "cargando-container")
  // Permanece igual, solo asegúrate de que el flujo de `finalizarPrueba` y la lógica del timer `tiempo`
  // dentro del simulacro funcionen como se espera con la nueva duración dinámica.
  
if (pantalla === "formulario") {
    return (
      <div className="container formulario-container">
        <h1>{tipoPrueba === "diagnostico" ? "¡Prueba completada!" : "¡Simulacro completado!"}</h1>
        <div className="formulario-content card-estilo">
          <p>Por favor, completa tus datos para {tipoPrueba === "diagnostico" ? "ver tus resultados" : "recibir tus resultados por correo"}:</p>
          
          <form className="formulario-registro" onSubmit={(e) => e.preventDefault()}>
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
            
<div className="formulario-info">
              <p>Estos datos nos permitirán {tipoPrueba === "diagnostico" ?
"mostrarte tus resultados y recomendaciones" : "enviarte los resultados detallados de tu simulacro"}.</p>
            </div>
            
            <button 
              type="button" 
              className="boton-ver-resultados" 
              onClick={procesarFormulario} 
disabled={!validarFormulario() ||
cargando}
            >
              {cargando ?
"Procesando..." : (tipoPrueba === "diagnostico" ? "Ver mis resultados" : "Enviar mis resultados")}
            </button>
          </form>
        </div>
      </div>
    );
}
  
  if (pantalla === "simulacro" && preguntas.length > 0) {
    const pregunta = preguntas[preguntaActual];
if (!pregunta || typeof pregunta.ejercicio === 'undefined') {
        return (
            <div className="container cargando-container">
              <div className="spinner"></div>
              <p>Error: No se pudo cargar la pregunta actual.</p>
            </div>
        );
}
    const ejercicioId = pregunta.ejercicio; 

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
        
<div className="pregunta-container card-estilo" key={ejercicioId}> 
          <h2 className="ejercicio-texto">
            <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></span>
          </h2>

          {pregunta.imagen && (
            <img src={pregunta.imagen} alt={`Imagen para ${pregunta.ejercicio.substring(0,50)}`} className="imagen-ejercicio" />
          )}

<ul className="opciones-lista">
            {pregunta.alternativas.map((alt) => (
              <li key={alt.letra} className="opcion">
                <label>
                  <input
                    type="radio"
name={`pregunta-${ejercicioId}`} 
                    value={alt.letra}
                    checked={respuestas[ejercicioId] === alt.letra}
                    onChange={() => seleccionarRespuesta(ejercicioId, alt.letra)}
                  />
<span className="letra-alternativa">{alt.letra})</span>
                  <span className="texto-alternativa" dangerouslySetInnerHTML={{ __html: alt.texto }}></span>
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
          
          {preguntaActual === preguntas.length - 1 ?
(
            <button className="boton-finalizar" onClick={finalizarPrueba}>
              Finalizar {tipoPrueba === "diagnostico" ? "prueba" : "simulacro"}
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
  
  if (pantalla === "resultados") {
if (!resultados || Object.keys(resultados).length === 0) {
if(!resultadosTemporales) {
        setPantalla("formulario");
return null;
}
return (
            <div className="container cargando-container">
                <div className="spinner"></div>
                <p>Cargando resultados...</p>
            </div>
        );
}

    return (
      <div className="container resultados-container card-estilo">
        <h1>{tipoPrueba === "diagnostico" ? "Resultados del Diagnóstico" : "Simulacro Completado"}</h1>
        
        <div className="datos-usuario">
          <p><strong>Nombre:</strong> {datosUsuario.nombre}</p>
          <p><strong>Correo:</strong> {datosUsuario.correo}</p>
          {resultados.tiempoUsado !== undefined && <p><strong>Tiempo utilizado:</strong> {formatoTiempo(resultados.tiempoUsado)}</p>}
        </div>
      
{tipoPrueba === "diagnostico" && (
          <>
            <div className="resumen-resultados">
              <div className="estadistica correcta">
                <div className="valor">{resultados.correctas}</div>
                <div className="etiqueta">Correctas</div>
</div>
              <div className="estadistica incorrecta">
                <div className="valor">{resultados.incorrectas}</div>
                <div className="etiqueta">Incorrectas</div>
              </div>
              <div className="estadistica">
                <div className="valor">{resultados.sinResponder}</div>
<div className="etiqueta">Sin responder</div>
              </div>
              <div className="estadistica">
                <div className="valor">{resultados.notaVigesimal !== undefined ?
resultados.notaVigesimal.toFixed(1) : 'N/A'}</div>
                <div className="etiqueta">Nota (0-20)</div>
              </div>
            </div>
            
            <div className="comentario-resultado">
              <h2>Evaluación de tu desempeño</h2>
<p>{comentarioResultado}</p>
            </div>
            
            <h2>Detalle de respuestas</h2>
            <div className="lista-detalles">
              {preguntas.map((pregunta, index) => {
                const ejercicioId = pregunta.ejercicio; 
const respuestaUsuario = resultados.respuestas && resultados.respuestas[ejercicioId]; 
                const estado = !respuestaUsuario 
                                ? "sin-responder" 
: respuestaUsuario === pregunta.respuesta_correcta 
                                  ? "correcta" 
                                  : "incorrecta";

                return (
<div 
                    key={ejercicioId ||
index} 
                    className={`detalle-pregunta ${estado}`}
                  >
                    <div className="numero-pregunta">{index + 1}</div>
                    <div className="contenido-detalle">
<div className="texto-ejercicio" dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></div>
                      <div className="respuesta-detalle">
                        {!respuestaUsuario ?
(
                          <span className="estado-respuesta sin-responder">Sin responder</span>
                        ) : respuestaUsuario === pregunta.respuesta_correcta ?
(
                          <span className="estado-respuesta correcta">
                            Correcta: {pregunta.respuesta_correcta} ({calcularPuntajePorCurso(pregunta.curso)} pts)
                          </span>
) : (
                          <span className="estado-respuesta incorrecta">
                            Incorrecta: Elegiste {respuestaUsuario}, 
                            Correcta: {pregunta.respuesta_correcta}
</span>
                        )}
                      </div>
                    </div>
</div>
                );
})}
            </div>
          </>
        )}
        
        {tipoPrueba === "simulacro" && (
          <div className="comentario-resultado">
            <h2>¡Simulacro completado con éxito!</h2>
            <p>{comentarioResultado}</p>
<p>Hemos registrado tus respuestas y calculado tu puntaje. Los resultados detallados, incluyendo tu desempeño por áreas y recomendaciones personalizadas, serán enviados a tu correo electrónico en las próximas horas.</p>
          </div>
        )}
        
        <button className="boton-reiniciar" onClick={() => {
          setPantalla("inicio");
setPreguntas([]);
setRespuestas({});
          setResultados({});
          setResultadosTemporales(null);
          setDatosUsuario({ nombre: "", correo: "" });
          // Reset simulacro schedule states if needed, though they recalculate on "inicio"
          setTiempoParaSimulacro(null);
          setPuedeIniciarSimulacro(false);
          setSimulacroExpirado(false);
        }}>
          Volver al inicio
        </button>
      </div>
    );
}
  
  return (
    <div className="container cargando-container">
      <div className="spinner"></div>
      <p>{cargando ? `Cargando ${tipoPrueba === "diagnostico" ? "prueba de diagnóstico" : "simulacro"}...` : "Cargando aplicación..."}</p>
    </div>
  );
}

export default App;
