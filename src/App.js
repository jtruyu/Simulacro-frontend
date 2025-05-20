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

  const [simulacroActivo, setSimulacroActivo] = useState(false);
  const [tiempoHastaInicio, setTiempoHastaInicio] = useState('');
  const [mensajeInicio, setMensajeInicio] = useState('');
  const [inicioSimulacro, setInicioSimulacro] = useState(null); // Nuevo estado para almacenar la hora de inicio


  // Definir horas de inicio y fin del simulacro
  const horaInicioSimulacro = new Date();
  horaInicioSimulacro.setHours(23, 5, 0); // 11:05 PM
  horaInicioSimulacro.setMinutes(5);
  horaInicioSimulacro.setSeconds(0);
  const horaFinSimulacro = new Date();
  horaFinSimulacro.setHours(23, 10, 0); // 11:10 PM
  horaFinSimulacro.setMinutes(10);
  horaFinSimulacro.setSeconds(0);

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

  useEffect(() => {
    const intervalo = setInterval(() => {
      const ahora = new Date();
      if (ahora < horaInicioSimulacro) {
        // Cuenta atrás para el inicio
        const diferencia = horaInicioSimulacro.getTime() - ahora.getTime();
        const minutos = Math.floor(diferencia / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);
        setTiempoHastaInicio(`El simulacro comenzará en ${minutos}m ${segundos}s`);
        setMensajeInicio(`El simulacro comenzará en breve. Por favor, espere.`);
        setSimulacroActivo(false); // Mantener el simulacro inactivo antes de la hora de inicio
      } else if (ahora >= horaInicioSimulacro && ahora < horaFinSimulacro) {
        // Simulacro activo
        setSimulacroActivo(true);
        setTiempoHastaInicio('');
        setMensajeInicio('¡El simulacro está activo! Haz clic en "Comenzar simulacro" para iniciar.');
        if (!inicioSimulacro) {
          setInicioSimulacro(new Date()); // Guarda la hora de inicio real
        }
      } else {
        // Simulacro finalizado
        setSimulacroActivo(false);
        setTiempoHastaInicio('');
        setMensajeInicio('El simulacro ha finalizado.');
        clearInterval(intervalo); // Detener el intervalo
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

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
        setPreguntas(preguntasObtenidas.slice(0, 10));
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
    if (!simulacroActivo) return; // Previene el inicio si el simulacro no está activo

    setTipoPrueba("simulacro");
    setCargando(true);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(5 * 60); // 5 minutos en segundos
    setTiempoInicial(5 * 60);
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
    });

    setResultados(nuevosResultados);
    setComentarioResultado(obtenerComentario(notaTotal));
    setPantalla("resultados");

    if (tipoPrueba === "simulacro" && validarFormulario()) {
      guardarResultados(nuevosResultados, notaTotal, preguntasCorrectas, preguntasIncorrectas, preguntasSinResponder, tiempoUsado);
    }
  };

  const guardarResultados = async (resultadosSimulacro, nota, correctas, incorrectas, sinResponder, tiempoUsado) => {
    try {
      const respuestasJSON = JSON.stringify(respuestas);
      const response = await axios.post("https://mi-proyecto-fastapi.onrender.com/guardar-simulacro", {
        nombre: datosUsuario.nombre,
        correo: datosUsuario.correo,
        resultado: nota,
        preguntas_correctas: correctas,
        preguntas_incorrectas: incorrectas,
        preguntas_sin_responder: sinResponder,
        tiempo_usado: tiempoUsado,
        respuestas: respuestasJSON
      });
      console.log("Respuesta al guardar resultados:", response.data);
    } catch (error) {
      console.error("Error al guardar resultados del simulacro:", error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  if (pantalla === "inicio") {
    return (
      <div className="container inicio-container">
        <h1>EDBOT<br />Preparación preuniversitaria implementada con IA</h1>
        <div className="inicio-content">
          <div className="columnas-inicio">
            <div className="columna-prueba card-estilo">
              <h2>Simulacro</h2>
              {tiempoHastaInicio && <p>{tiempoHastaInicio}</p>}
              {mensajeInicio && <p>{mensajeInicio}</p>}
              <button
                className="boton-iniciar"
                onClick={iniciarSimulacro}
                disabled={!simulacroActivo} // Deshabilitar si no está activo
              >
                Comenzar simulacro
              </button>
            </div>

            <div className="columna-prueba card-estilo">
              <h2>Prueba de diagnóstico</h2>
              <p>
                Esta prueba de diagnóstico contiene 10 ejercicios seleccionados de
                exámenes de admisión a la Universidad Nacional de Ingeniería
                (UNI), que te permitirán evaluar tu nivel de preparación.
              </p>
              <p>Dispondrás de 40 minutos para resolverlos.</p>
              <button
                className="boton-iniciar"
                onClick={iniciarDiagnostico}
                disabled={cargando}
              >
                Comenzar diagnóstico
              </button>
            </div>
          </div>
          <div className="form-usuario card-estilo">
            <h2>Datos del usuario</h2>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo"
              value={datosUsuario.nombre}
              onChange={handleInputChange}
            />
            <input
              type="email"
              name="correo"
              placeholder="Correo electrónico"
              value={datosUsuario.correo}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>
    );
  }

  if (pantalla === "simulacro") {
    const pregunta = preguntas[preguntaActual];
    const tiempoRestante = tiempoActivo ? formatTime(tiempo) : formatTime(tiempoInicial);

    return (
      <div className="container simulacro-container">
        <div className="encabezado-simulacro">
          <h1>{tipoPrueba === "diagnostico" ? "Prueba de diagnóstico" : "Simulacro"}</h1>
          <div className="tiempo-restante">
            Tiempo restante: {tiempoRestante}
          </div>
          <div className="progreso">
            Pregunta {preguntaActual + 1} de {preguntas.length}
          </div>
        </div>
        {cargando ? (
          <div className="cargando-container">
            <div className="spinner"></div>
            <p>Cargando preguntas...</p>
          </div>
        ) : (
          <>
            <div className="pregunta-container card-estilo">
              <h2 className="numero-pregunta">Pregunta {preguntaActual + 1}:</h2>
              <p className="enunciado-pregunta">{pregunta.enunciado}</p>
              <div className="opciones-container">
                {['a', 'b', 'c', 'd', 'e'].map((opcion) => (
                  <div
                    key={opcion}
                    className={`opcion ${respuestas[pregunta.ejercicio] === opcion ? "seleccionada" : ""}`}
                    onClick={() => seleccionarRespuesta(pregunta.ejercicio, opcion)}
                  >
                    <span className="letra-opcion">{opcion.toUpperCase()}.</span>
                    <span className="texto-opcion">{pregunta[`opcion_${opcion}`]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="controles-navegacion">
              <button
                className="boton-nav"
                onClick={preguntaAnterior}
                disabled={preguntaActual === 0}
              >
                Anterior
              </button>
              <button
                className="boton-nav"
                onClick={siguientePregunta}
                disabled={preguntaActual === preguntas.length - 1}
              >
                Siguiente
              </button>
              <button
                className="boton-finalizar"
                onClick={finalizarPrueba}
                disabled={preguntas.length === 0 || Object.keys(respuestas).length !== preguntas.length} // Asegura que todas las preguntas tengan respuesta
              >
                Finalizar {tipoPrueba === "diagnostico" ? "diagnóstico" : "simulacro"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (pantalla === "resultados") {
    const detalles = resultadosTemporales?.detalles || {};
    const correctas = resultadosTemporales?.correctas || 0;
    const incorrectas = resultadosTemporales?.incorrectas || 0;
    const sinResponder = resultadosTemporales?.sinResponder || 0;
    const porcentaje = resultadosTemporales?.porcentaje || 0;
    const notaVigesimal = resultadosTemporales?.notaVigesimal || 0;
    const tiempoUsado = resultadosTemporales?.tiempoUsado || 0;

    return (
      <div className="container resultados-container">
        <h1>Resultados {tipoPrueba === "diagnostico" ? "de la Prueba de Diagnóstico" : "del Simulacro"}</h1>
        <div className="resumen-resultados card-estilo">
          <div className="estadistica">
            <span className="label">Correctas:</span>
            <span className="valor">{correctas}</span>
          </div>
          <div className="estadistica">
            <span className="label">Incorrectas:</span>
            <span className="valor">{incorrectas}</span>
          </div>
          <div className="estadistica">
            <span className="label">Sin responder:</span>
            <span className="valor">{sinResponder}</span>
          </div>
          <div className="estadistica">
            <span className="label">Porcentaje:</span>
            <span className="valor">{porcentaje.toFixed(2)}%</span>
          </div>
          <div className="estadistica">
            <span className="label">Nota Vigesimal:</span>
            <span className="valor">{notaVigesimal.toFixed(2)}</span>
          </div>
          {tipoPrueba === "simulacro" && (
            <div className="estadistica">
              <span className="label">Tiempo Usado:</span>
              <span className="valor">{formatTime(tiempoUsado)}</span>
            </div>
          )}
        </div>

        <div className="detalles-resultados card-estilo">
          <h2>Detalle de Respuestas:</h2>
          {preguntas.map((pregunta) => {
            const detalle = detalles[pregunta.ejercicio] || "Sin responder";
            return (
              <div key={pregunta.ejercicio} className="detalle-pregunta">
                <span className="numero-pregunta">Pregunta {pregunta.ejercicio}: </span>
                <span className={detalle.startsWith("Correcta") ? "correcta" : "incorrecta"}>
                  {detalle}
                </span>
              </div>
            );
          })}
        </div>

        {tipoPrueba === "simulacro" && (
          <div className="comentario-resultado">
            <h2>¡Simulacro completado con éxito!</h2>
            <p>{comentarioResultado}</p>
            <p>Hemos registrado tus respuestas y calculado tu puntaje. Los resultados detallados, incluyendo tu desempeño por áreas y recomendaciones personalizadas, serán enviados a tu correo electrónico en las próximas horas.</p>
          </div>
        )}

        <button className="boton-reiniciar" onClick={() => {
          setPantalla("inicio");
          // Optionally reset states if needed for a fresh start
          setPreguntas([]);
          setRespuestas({});
          setResultados({});
          setResultadosTemporales(null);
          setDatosUsuario({ nombre: "", correo: "" });
        }}>
          Volver al inicio
        </button>
      </div>
    );
  }

  // Default loading screen or if pantalla state is unexpected
  return (
    <div className="container cargando-container">
      <div className="spinner"></div>
      <p>{cargando ? `Cargando ${tipoPrueba === "diagnostico" ? "prueba de diagnóstico" : "simulacro"}...` : "Cargando aplicación..."}</p>
    </div>
  );
}

export default App;
