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
  const [datosUsuario, setDatosUsuario] = useState({ nombre: "", correo: "" });
  const [comentarioResultado, setComentarioResultado] = useState("");
  const [resultadosTemporales, setResultadosTemporales] = useState(null);
  const [simulacroDisponible, setSimulacroDisponible] = useState(false);
  const [contadorInicio, setContadorInicio] = useState(null);
  const [simulacroCerrado, setSimulacroCerrado] = useState(false);

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
    const actualizarEstadoSimulacro = () => {
      const ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
      const hora = ahora.getHours();
      const minutos = ahora.getMinutes();
      const segundos = ahora.getSeconds();
      const tiempoActual = hora * 3600 + minutos * 60 + segundos;

      const inicio = 22 * 3600 + 55 * 60; // 10:55 p.m.
      const fin = 23 * 3600;             // 11:00 p.m.

      if (tiempoActual >= inicio && tiempoActual < fin) {
        setSimulacroDisponible(true);
        setContadorInicio(null);
        setSimulacroCerrado(false);
      } else if (tiempoActual < inicio) {
        setSimulacroDisponible(false);
        setContadorInicio(inicio - tiempoActual);
        setSimulacroCerrado(false);
      } else {
        setSimulacroDisponible(false);
        setContadorInicio(null);
        setSimulacroCerrado(true);
      }
    };

    actualizarEstadoSimulacro();
    const intervalo = setInterval(actualizarEstadoSimulacro, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const seleccionarRespuesta = (id, letra) => {
    setRespuestas(prev => ({ ...prev, [id]: letra }));
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

  const finalizarPrueba = () => {
    setTiempoActivo(false);
    let correctas = 0, incorrectas = 0, sinResponder = 0, nota = 0;
    const detalles = {};

    preguntas.forEach(p => {
      const id = p.ejercicio;
      const r = respuestas[id];
      if (!r) {
        detalles[id] = "Sin responder";
        sinResponder++;
      } else if (r === p.respuesta_correcta) {
        detalles[id] = "Correcta";
        correctas++;
        nota += calcularPuntajePorCurso(p.curso);
      } else {
        detalles[id] = `Incorrecta (Respuesta correcta: ${p.respuesta_correcta})`;
        incorrectas++;
      }
    });

    const tiempoUsado = tiempoInicial - tiempo;
    nota = Math.min(nota, 20);

    setResultadosTemporales({
      detalles,
      correctas,
      incorrectas,
      sinResponder,
      porcentaje: (correctas / preguntas.length) * 100,
      notaVigesimal: nota,
      tiempoUsado,
      respuestas
    });

    setComentarioResultado(obtenerComentario(nota));
    setPantalla("formulario");
  };

  const calcularPuntajePorCurso = (curso) => {
    switch (curso) {
      case "RM": case "RV": return 0.63;
      case "Aritmética": case "Álgebra": case "Geometría": case "Trigonometría": return 0.76;
      case "Física": return 0.81;
      case "Química": return 0.46;
      default: return 0.7;
    }
  };

  const obtenerComentario = (nota) => {
    if (tipoPrueba === "diagnostico") {
      if (nota < 10) return "Es necesario fortalecer tu base para el examen de admisión a la UNI.";
      if (nota < 14) return "Tienes potencial, pero necesitas mayor consistencia.";
      if (nota < 18) return "¡Vas por buen camino! Continúa practicando.";
      return "¡Excelente desempeño! Sigue así.";
    }
    return "Los resultados detallados serán enviados a tu correo.";
  };

  const procesarFormulario = async () => {
    if (!datosUsuario.nombre.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosUsuario.correo)) {
      alert("Por favor, completa correctamente todos los campos.");
      return;
    }

    setResultados(resultadosTemporales);

    try {
      const endpoint = tipoPrueba === "diagnostico"
        ? "https://mi-proyecto-fastapi.onrender.com/guardar-diagnostico"
        : "https://mi-proyecto-fastapi.onrender.com/guardar-simulacro";

      const body = {
        nombre: datosUsuario.nombre,
        correo: datosUsuario.correo,
        resultado: resultadosTemporales.notaVigesimal,
        preguntas_correctas: resultadosTemporales.correctas,
        preguntas_incorrectas: resultadosTemporales.incorrectas,
        preguntas_sin_responder: resultadosTemporales.sinResponder,
        tiempo_usado: resultadosTemporales.tiempoUsado,
        ...(tipoPrueba === "simulacro" && {
          respuestas: JSON.stringify(resultadosTemporales.respuestas)
        })
      };

      await axios.post(endpoint, body);
    } catch (e) {
      alert("Hubo un error al guardar tus resultados.");
    }

    setPantalla("resultados");
  };

  const formatoTiempo = (segundos) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container cargando-container">
      <div className="spinner"></div>
      <p>{cargando ? "Cargando..." : "Cargando aplicación..."}</p>
    </div>
  );
}

export default App;
