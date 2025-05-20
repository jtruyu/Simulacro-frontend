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
  const [tiempo, setTiempo] = useState(0); // Tiempo restante en segundos
  const [tiempoInicial, setTiempoInicial] = useState(0); // Tiempo inicial para la barra de progreso
  const [tiempoActivo, setTiempoActivo] = useState(false); // Indica si el temporizador está corriendo
  const [tipoPrueba, setTipoPrueba] = useState("");
  const [datosUsuario, setDatosUsuario] = useState({
    nombre: "",
    correo: ""
  });
  const [comentarioResultado, setComentarioResultado] = useState("");
  const [resultadosTemporales, setResultadosTemporales] = useState(null);

  // --- NUEVOS ESTADOS PARA HORAS FIJAS DEL SIMULACRO ---
  // Define las horas fijas de inicio y fin del simulacro
  // IMPORTANTE: Estas fechas/horas usan la zona horaria local del navegador del usuario.
  // Para una hora fija global, se recomienda usar fechas UTC y convertirlas para mostrar.
  // Ejemplo: Hoy, 19 de mayo de 2025, de 22:00 (10 PM) a 22:30 (10:30 PM)
  const SIMULACRO_START_TIME = new Date("2025-05-19T22:00:00");
  const SIMULACRO_END_TIME = new Date("2025-05-19T22:30:00");

  const [simulacroAvailabilityStatus, setSimulacroAvailabilityStatus] = useState(''); // 'proximo', 'disponible', 'finalizado'
  const [remainingUntilSimulacroStart, setRemainingUntilSimulacroStart] = useState(0); // En segundos

  // --- NUEVO useEffect para gestionar la disponibilidad del simulacro por horas fijas ---
  useEffect(() => {
    let intervalId;

    const updateSimulacroState = () => {
      const now = new Date(); // Hora actual del cliente

      if (now < SIMULACRO_START_TIME) {
        // Simulacro aún no ha iniciado
        setSimulacroAvailabilityStatus('proximo');
        setRemainingUntilSimulacroStart(Math.max(0, Math.floor((SIMULACRO_START_TIME.getTime() - now.getTime()) / 1000)));
        // Si el usuario estaba en la pantalla del simulacro antes de la hora de inicio
        if (pantalla === "simulacro" && tipoPrueba === "simulacro") {
          setTiempo(0);
          setTiempoActivo(false); // Detener el temporizador activo
        }
      } else if (now >= SIMULACRO_START_TIME && now < SIMULACRO_END_TIME) {
        // Simulacro está activo/disponible
        setSimulacroAvailabilityStatus('disponible');
        setRemainingUntilSimulacroStart(0); // Resetear el conteo hasta el inicio

        if (pantalla === "simulacro" && tipoPrueba === "simulacro") {
          // Si el usuario está en la pantalla del simulacro, activar el temporizador
          const timeRemainingForTest = Math.max(0, Math.floor((SIMULACRO_END_TIME.getTime() - now.getTime()) / 1000));
          // Solo actualizar 'tiempo' y 'tiempoInicial' si es necesario para evitar renders innecesarios
          if (tiempo !== timeRemainingForTest) {
            setTiempo(timeRemainingForTest);
            setTiempoInicial(timeRemainingForTest); // 'tiempoInicial' es para la barra de progreso
          }
          setTiempoActivo(true);
        } else {
          setTiempoActivo(false); // El temporizador no está activo si no está en la pantalla del simulacro
        }
      } else {
        // Simulacro ya ha finalizado
        setSimulacroAvailabilityStatus('finalizado');
        setRemainingUntilSimulacroStart(0);
        setTiempoActivo(false); // Detener cualquier temporizador activo
        setTiempo(0); // Poner el tiempo a cero

        // Si el usuario estaba realizando el simulacro y este acaba de finalizar por tiempo
        if (pantalla === "simulacro" && tipoPrueba === "simulacro") {
          // Asegurarse de llamar a finalizarPrueba() solo una vez
          if (resultadosTemporales === null) {
            finalizarPrueba();
          }
        }
      }
    };

    // Ejecutar la verificación inmediatamente y luego cada segundo
    checkSimulacroAvailability();
    intervalId = setInterval(updateSimulacroState, 1000);

    // Limpiar el intervalo cuando el componente se desmonte o las dependencias cambien
    return () => clearInterval(intervalId);
  }, [pantalla, tipoPrueba, tiempo, resultadosTemporales]); // tiempo y resultadosTemporales son clave para evitar bucles o llamadas múltiples a finalizarPrueba


  // --- useEffect existente para la cuenta regresiva del tiempo ---
  useEffect(() => {
    let intervalo;
    if (tiempoActivo && tiempo > 0) {
      // Si el tiempo está activo y es mayor que 0, decrementa cada segundo
      intervalo = setInterval(() => {
        setTiempo((tiempoAnterior) => tiempoAnterior - 1);
      }, 1000);
    } else if (tiempo === 0 && tiempoInicial > 0 && pantalla === "simulacro" && tipoPrueba === "diagnostico") {
      // Esta condición es para la PRUEBA DE DIAGNÓSTICO cuando su temporizador interno se agota.
      // La finalización del SIMULACRO por tiempo fijo se maneja en el otro useEffect.
      finalizarPrueba();
    }

    return () => clearInterval(intervalo);
  }, [tiempoActivo, tiempo, tiempoInicial, pantalla, tipoPrueba]);


  const finalizarPrueba = async () => {
    setTiempoActivo(false); // Detiene el temporizador
    setTiempo(0); // Asegura que el tiempo se muestre como 0

    let correctas = 0;
    let incorrectas = 0;
    let sinResponder = 0;
    let notaTotal = 0; // Solo para diagnóstico

    const respuestasEnviadas = {}; // Para guardar las respuestas para el backend del simulacro

    preguntas.forEach((pregunta) => {
      const respuestaSeleccionada = respuestas[pregunta.id_pregunta];
      respuestasEnviadas[pregunta.id_pregunta] = respuestaSeleccionada || null; // Guarda null si no respondió

      if (respuestaSeleccionada === pregunta.respuesta_correcta) {
        correctas++;
        if (tipoPrueba === "diagnostico") {
          notaTotal += pregunta.puntaje;
        }
      } else if (respuestaSeleccionada) {
        incorrectas++;
      } else {
        sinResponder++;
      }
    });

    const resultadosCalculados = {
      correctas,
      incorrectas,
      sinResponder,
      notaTotal: tipoPrueba === "diagnostico" ? notaTotal : null, // Nota solo para diagnóstico
      tiempoUsado: tiempoInicial - tiempo, // Tiempo usado
      respuestas: respuestasEnviadas // Respuestas brutas para el simulacro
    };

    setResultadosTemporales(resultadosCalculados); // Guarda los resultados temporalmente

    // Comentario según el tipo de prueba
    if (tipoPrueba === "diagnostico") {
      if (notaTotal >= 1500) {
        setComentarioResultado("¡Excelente desempeño! Has demostrado un gran dominio en las áreas evaluadas. ¡Sigue así!");
      } else if (notaTotal >= 1000) {
        setComentarioResultado("Buen resultado, pero hay áreas donde puedes mejorar. ¡Repasa los temas y sigue practicando!");
      } else {
        setComentarioResultado("Necesitas reforzar varios conceptos. ¡No te desanimes! Con estudio y práctica constante, mejorarás.");
      }
    } else if (tipoPrueba === "simulacro") {
      setComentarioResultado("¡Simulacro completado con éxito! Hemos registrado tus respuestas y calcularemos tu puntaje. Los resultados detallados serán enviados a tu correo.");
    }

    setPantalla("formulario"); // Ir a la pantalla del formulario
  };

  const iniciarPrueba = async (tipo) => {
    setTipoPrueba(tipo);
    setCargando(true);

    let apiUrl = "";
    let duration = 0;

    if (tipo === "diagnostico") {
      apiUrl = "http://127.0.0.1:8000/diagnostico/";
      duration = 20 * 60; // 20 minutos para diagnóstico
      setTiempoInicial(duration); // Establecer tiempo inicial
      setTiempo(duration); // Establecer tiempo actual
      setTiempoActivo(true); // Activar temporizador
    } else if (tipo === "simulacro") {
      // Verificar la disponibilidad del simulacro por horas fijas
      if (simulacroAvailabilityStatus === 'proximo') {
        alert(`El simulacro aún no ha comenzado. Faltan ${Math.ceil(remainingUntilSimulacroStart / 60)} minutos para que inicie.`);
        setCargando(false);
        return;
      }
      if (simulacroAvailabilityStatus === 'finalizado') {
        alert('El simulacro ya ha finalizado y no está disponible para iniciar.');
        setCargando(false);
        return;
      }
      // Si está 'disponible', proceder. 'tiempo' ya está siendo actualizado por el useEffect de horas fijas.
      apiUrl = "http://127.0.0.1:8000/simulacro/";
      // Para el simulacro, 'duration' al iniciar es el 'tiempo' restante hasta la hora de fin fija
      duration = tiempo; // `tiempo` ya tiene el valor correcto desde el useEffect
      setTiempoInicial(duration); // Usar este tiempo para la barra de progreso
      // setTiempoActivo(true) se maneja automáticamente por el useEffect cuando el simulacro está 'disponible' y en pantalla 'simulacro'
    } else {
      console.error("Tipo de prueba desconocido:", tipo);
      setCargando(false);
      return;
    }

    try {
      const response = await axios.get(apiUrl);
      setPreguntas(response.data);
      setPreguntaActual(0);
      setRespuestas({});
      setResultados({}); // Limpiar resultados anteriores
      setResultadosTemporales(null); // Asegurarse de que no haya resultados temporales
      setPantalla("simulacro"); // Ir a la pantalla del simulacro
    } catch (error) {
      console.error("Error al cargar las preguntas:", error);
      alert("No se pudieron cargar las preguntas. Inténtalo de nuevo más tarde.");
      setPantalla("inicio");
    } finally {
      setCargando(false);
    }
  };


  const handleRespuestaChange = (preguntaId, valor) => {
    setRespuestas((prevRespuestas) => ({
      ...prevRespuestas,
      [preguntaId]: valor
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

  const handleSubmitDatosUsuario = async (e) => {
    e.preventDefault();
    setCargando(true);

    const { nombre, correo } = datosUsuario;
    let endpoint = "";
    let payload = {};

    if (tipoPrueba === "diagnostico") {
      endpoint = "http://127.0.0.1:8000/guardar-diagnostico/";
      payload = {
        nombre: nombre,
        correo: correo,
        resultado: resultadosTemporales.notaTotal,
        preguntas_correctas: resultadosTemporales.correctas,
        preguntas_incorrectas: resultadosTemporales.incorrectas,
        preguntas_sin_responder: resultadosTemporales.sinResponder,
        tiempo_usado: resultadosTemporales.tiempoUsado
      };
    } else if (tipoPrueba === "simulacro") {
      endpoint = "http://127.0.0.1:8000/guardar-simulacro/";
      payload = {
        nombre: nombre,
        correo: correo,
        resultado: resultadosTemporales.correctas, // Puedes ajustar esto a la nota del simulacro si tu backend la calcula
        preguntas_correctas: resultadosTemporales.correctas,
        preguntas_incorrectas: resultadosTemporales.incorrectas,
        preguntas_sin_responder: resultadosTemporales.sinResponder,
        tiempo_usado: resultadosTemporales.tiempoUsado,
        respuestas: JSON.stringify(resultadosTemporales.respuestas) // Envía las respuestas como JSON string
      };
    }

    try {
      await axios.post(endpoint, payload);
      setResultados(resultadosTemporales); // Guardar resultados finales para mostrar
      setPantalla("resultados"); // Ir a la pantalla de resultados
    } catch (error) {
      console.error("Error al guardar los resultados:", error);
      alert("Hubo un error al guardar tus resultados. Inténtalo de nuevo.");
      setPantalla("resultados"); // Aún así, intentar mostrar resultados si no se pudo guardar
    } finally {
      setCargando(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getProgresoPorcentaje = () => {
    if (tiempoInicial === 0) return 0;
    return ((tiempoInicial - tiempo) / tiempoInicial) * 100;
  };


  if (cargando) {
    return (
      <div className="container cargando-container">
        <div className="spinner"></div>
        <p>Cargando preguntas...</p>
      </div>
    );
  }

  if (pantalla === "inicio") {
    return (
      <div className="container inicio-container">
        <h1>Bienvenido a la Plataforma de Admisión</h1>
        <div className="inicio-content">
          <div className="columnas-inicio">
            {/* Columna de Diagnóstico */}
            <div className="columna-prueba card-estilo">
              <h2>Prueba de Diagnóstico</h2>
              <p>
                Evalúa tus conocimientos en las áreas clave y descubre tus
                fortalezas y debilidades. Duración: 20 minutos.
              </p>
              <button
                className="boton-iniciar"
                onClick={() => iniciarPrueba("diagnostico")}
              >
                Iniciar Prueba Diagnóstica
              </button>
            </div>

            {/* Columna de Simulacro */}
            <div className="columna-prueba card-estilo">
              <h2>Simulacro</h2>
              <p>
                Simula un examen de admisión real con un tiempo y formato definidos.
                ¡Prepárate para la presión!
              </p>
              <p>
                **Horario del Simulacro:**
                <br />
                Del {SIMULACRO_START_TIME.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                <br />
                al {SIMULACRO_END_TIME.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>

              {simulacroAvailabilityStatus === 'proximo' && (
                <p className="formulario-info" style={{ color: '#007bff', fontWeight: 'bold' }}>
                  El simulacro comenzará en: {Math.floor(remainingUntilSimulacroStart / 3600)}h {Math.floor((remainingUntilSimulacroStart % 3600) / 60)}m {remainingUntilSimulacroStart % 60}s
                </p>
              )}
              {simulacroAvailabilityStatus === 'finalizado' && (
                <p className="formulario-info" style={{ color: '#dc3545', fontWeight: 'bold' }}>
                  El simulacro ya ha finalizado y no está disponible.
                </p>
              )}
              {simulacroAvailabilityStatus === 'disponible' && (
                <p className="formulario-info" style={{ color: '#28a745', fontWeight: 'bold' }}>
                  ¡El simulacro está activo ahora! Tienes hasta las {SIMULACRO_END_TIME.toLocaleTimeString('es-ES', { timeStyle: 'short' })}.
                </p>
              )}

              <button
                className="boton-iniciar"
                onClick={() => iniciarPrueba("simulacro")}
                disabled={simulacroAvailabilityStatus !== 'disponible'}
              >
                Iniciar Simulacro
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pantalla === "simulacro") {
    const pregunta = preguntas[preguntaActual];
    if (!pregunta) {
      return (
        <div className="container cargando-container">
          <p>Cargando preguntas...</p>
        </div>
      );
    }
    const progresoPorcentaje = getProgresoPorcentaje();

    return (
      <div className="container simulacro-container">
        <div className="encabezado-simulacro">
          <div className="progreso">
            <p className="texto-progreso">
              Pregunta: {preguntaActual + 1} de {preguntas.length}
            </p>
            <div className="barra-progreso">
              <div
                className="progreso-completado"
                style={{ width: `${progresoPorcentaje}%` }}
              ></div>
            </div>
          </div>
          <div className="temporizador">Tiempo: {formatTime(tiempo)}</div>
        </div>

        <div className="pregunta-container card-estilo">
          <div
            className="ejercicio-texto"
            dangerouslySetInnerHTML={{ __html: pregunta.enunciado }}
          />
          {pregunta.imagen_url && (
            <img
              src={pregunta.imagen_url}
              alt="Ejercicio"
              className="imagen-ejercicio"
            />
          )}
          <ul className="opciones-lista">
            {pregunta.alternativas.map((alternativa, index) => (
              <li
                key={index}
                className={`opcion ${
                  respuestas[pregunta.id_pregunta] === alternativa.letra
                    ? "seleccionada"
                    : ""
                }`}
              >
                <label>
                  <input
                    type="radio"
                    name={`pregunta-${pregunta.id_pregunta}`}
                    value={alternativa.letra}
                    checked={
                      respuestas[pregunta.id_pregunta] === alternativa.letra
                    }
                    onChange={() =>
                      handleRespuestaChange(pregunta.id_pregunta, alternativa.letra)
                    }
                  />
                  <span className="letra-alternativa">
                    {alternativa.letra})
                  </span>
                  <span
                    className="texto-alternativa"
                    dangerouslySetInnerHTML={{ __html: alternativa.texto }}
                  />
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
          {preguntaActual < preguntas.length - 1 ? (
            <button className="boton-nav" onClick={siguientePregunta}>
              Siguiente
            </button>
          ) : (
            <button className="boton-finalizar" onClick={finalizarPrueba}>
              Finalizar Prueba
            </button>
          )}
        </div>
      </div>
    );
  }

  if (pantalla === "formulario") {
    return (
      <div className="container formulario-container">
        <div className="formulario-content card-estilo">
          <h1>¡Prueba Completada!</h1>
          <p>
            Por favor, ingresa tus datos para ver tus resultados y recibir
            información detallada.
          </p>
          <form className="formulario-registro" onSubmit={handleSubmitDatosUsuario}>
            <div className="campo-formulario">
              <label htmlFor="nombre">Nombre Completo:</label>
              <input
                type="text"
                id="nombre"
                value={datosUsuario.nombre}
                onChange={(e) =>
                  setDatosUsuario({ ...datosUsuario, nombre: e.target.value })
                }
                required
              />
            </div>
            <div className="campo-formulario">
              <label htmlFor="correo">Correo Electrónico:</label>
              <input
                type="email"
                id="correo"
                value={datosUsuario.correo}
                onChange={(e) =>
                  setDatosUsuario({ ...datosUsuario, correo: e.target.value })
                }
                required
              />
            </div>
            <p className="formulario-info">
              Al hacer clic en "Ver mis resultados", aceptas recibir tu
              desempeño por correo electrónico y futuras comunicaciones de
              nuestra plataforma.
            </p>
            <button type="submit" className="boton-ver-resultados">
              Ver mis Resultados
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (pantalla === "resultados") {
    // Asegurarse de que resultados estén cargados antes de renderizar
    if (!resultados || Object.keys(resultados).length === 0) {
      return (
        <div className="container cargando-container">
          <p>Cargando resultados...</p>
        </div>
      );
    }

    const { correctas, incorrectas, sinResponder, notaTotal, tiempoUsado } = resultados;

    return (
      <div className="container resultados-container card-estilo">
        <h1>Resultados de la {tipoPrueba === "diagnostico" ? "Prueba de Diagnóstico" : "Simulacro"}</h1>

        <div className="datos-usuario">
          <p><strong>Nombre:</strong> {datosUsuario.nombre}</p>
          <p><strong>Correo:</strong> {datosUsuario.correo}</p>
        </div>

        {tipoPrueba === "diagnostico" && (
          <div className="comentario-resultado">
            <h2>Comentario General</h2>
            <p>{comentarioResultado}</p>
          </div>
        )}

        <div className="resumen-resultados">
          <div className="estadistica correcta">
            <div className="valor">{correctas}</div>
            <div className="etiqueta">Correctas</div>
          </div>
          <div className="estadistica incorrecta">
            <div className="valor">{incorrectas}</div>
            <div className="etiqueta">Incorrectas</div>
          </div>
          <div className="estadistica">
            <div className="valor">{sinResponder}</div>
            <div className="etiqueta">Sin Responder</div>
          </div>
          {tipoPrueba === "diagnostico" && (
            <div className="estadistica">
              <div className="valor">{notaTotal}</div>
              <div className="etiqueta">Puntaje Total</div>
            </div>
          )}
          <div className="estadistica">
            <div className="valor">{formatTime(tiempoUsado)}</div>
            <div className="etiqueta">Tiempo Usado</div>
          </div>
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
          // Resetear todos los estados para una nueva prueba
          setPreguntas([]);
          setRespuestas({});
          setResultados({});
          setResultadosTemporales(null);
          setDatosUsuario({ nombre: "", correo: "" });
          setTiempo(0);
          setTiempoInicial(0);
          setTiempoActivo(false);
          setTipoPrueba("");
          setComentarioResultado("");
          setSimulacroAvailabilityStatus(''); // Resetear el estado de disponibilidad
          setRemainingUntilSimulacroStart(0); // Resetear el conteo
        }}>
          Volver al inicio
        </button>
      </div>
    );
  }

  // Pantalla de carga por defecto o si el estado de pantalla es inesperado
  return (
    <div className="container cargando-container">
      <div className="spinner"></div>
      <p>{cargando ? `Cargando ${tipoPrueba === "diagnostico" ? "prueba de diagnóstico" : "simulacro"}...` : "Cargando aplicación..."}</p>
    </div>
  );
}

export default App;
