import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  // ... (todas las variables y funciones ya definidas previamente)

  // Aquí colocamos el renderizado según la pantalla actual
  if (pantalla === "inicio") {
    return (
      <div className="container inicio-container">
        <h1>EDBOT<br />Preparación preuniversitaria implementada con IA</h1>
        <div className="inicio-content">
          <div className="columnas-inicio">
            <div className="columna-prueba card-estilo">
              <h2>Prueba de diagnóstico</h2>
              <p>Contiene 10 ejercicios. Dispones de 40 minutos.</p>
              <button className="boton-iniciar" onClick={iniciarDiagnostico} disabled={cargando}>
                Comenzar diagnóstico
              </button>
            </div>

            <div className="columna-prueba card-estilo">
              <h2>Simulacro</h2>
              <p>Contiene 30 ejercicios. Disponible entre 10:55 p.m. y 11:00 p.m. hora peruana.</p>
              {contadorInicio !== null && (
                <p style={{ color: "#dc3545" }}>
                  ⏳ Comienza en {formatoTiempo(contadorInicio)}
                </p>
              )}
              {simulacroCerrado && (
                <p style={{ color: "#888" }}>
                  El simulacro ya ha cerrado. Vuelve mañana.
                </p>
              )}
              <button
                className="boton-iniciar"
                onClick={iniciarSimulacro}
                disabled={!simulacroDisponible || cargando}
              >
                {cargando ? "Cargando..." : "Comenzar simulacro"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pantalla === "formulario") {
    return (
      <div className="container formulario-container">
        <h1>{tipoPrueba === "diagnostico" ? "¡Prueba completada!" : "¡Simulacro completado!"}</h1>
        <div className="formulario-content card-estilo">
          <p>Por favor, completa tus datos para {tipoPrueba === "diagnostico" ? "ver tus resultados" : "recibir tus resultados por correo"}:</p>
          <form className="formulario-registro" onSubmit={(e) => e.preventDefault()}>
            <div className="campo-formulario">
              <label htmlFor="nombre">Nombre completo:</label>
              <input type="text" id="nombre" name="nombre" value={datosUsuario.nombre} onChange={(e) => setDatosUsuario({ ...datosUsuario, nombre: e.target.value })} required />
            </div>
            <div className="campo-formulario">
              <label htmlFor="correo">Correo electrónico:</label>
              <input type="email" id="correo" name="correo" value={datosUsuario.correo} onChange={(e) => setDatosUsuario({ ...datosUsuario, correo: e.target.value })} required />
            </div>
            <button className="boton-ver-resultados" onClick={procesarFormulario} disabled={cargando}>
              {cargando ? "Procesando..." : "Enviar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (pantalla === "simulacro" && preguntas.length > 0) {
    const pregunta = preguntas[preguntaActual];
    const ejercicioId = pregunta.ejercicio;

    return (
      <div className="container simulacro-container">
        <div className="encabezado-simulacro">
          <div className="progreso">
            <div className="texto-progreso">Pregunta: {preguntaActual + 1} de {preguntas.length}</div>
            <div className="barra-progreso">
              <div className="progreso-completado" style={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%` }}></div>
            </div>
          </div>
          <div className="temporizador">⏱️ {formatoTiempo(tiempo)}</div>
        </div>

        <div className="pregunta-container card-estilo" key={ejercicioId}>
          <h2 className="ejercicio-texto">
            <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></span>
          </h2>
          {pregunta.imagen && <img src={pregunta.imagen} alt="Ejercicio" className="imagen-ejercicio" />}
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
          <button className="boton-nav" onClick={preguntaAnterior} disabled={preguntaActual === 0}>Anterior</button>
          {preguntaActual === preguntas.length - 1 ? (
            <button className="boton-finalizar" onClick={finalizarPrueba}>Finalizar</button>
          ) : (
            <button className="boton-nav" onClick={siguientePregunta}>Siguiente</button>
          )}
        </div>
      </div>
    );
  }

  if (pantalla === "resultados") {
    return (
      <div className="container resultados-container card-estilo">
        <h1>{tipoPrueba === "diagnostico" ? "Resultados del Diagnóstico" : "Simulacro Completado"}</h1>
        <div className="datos-usuario">
          <p><strong>Nombre:</strong> {datosUsuario.nombre}</p>
          <p><strong>Correo:</strong> {datosUsuario.correo}</p>
          <p><strong>Tiempo utilizado:</strong> {formatoTiempo(resultados.tiempoUsado)}</p>
        </div>
        {tipoPrueba === "diagnostico" && (
          <>
            <div className="resumen-resultados">
              <div className="estadistica correcta"><div className="valor">{resultados.correctas}</div><div className="etiqueta">Correctas</div></div>
              <div className="estadistica incorrecta"><div className="valor">{resultados.incorrectas}</div><div className="etiqueta">Incorrectas</div></div>
              <div className="estadistica"><div className="valor">{resultados.sinResponder}</div><div className="etiqueta">Sin responder</div></div>
              <div className="estadistica"><div className="valor">{resultados.notaVigesimal?.toFixed(1)}</div><div className="etiqueta">Nota (0-20)</div></div>
            </div>
            <div className="comentario-resultado">
              <h2>Evaluación</h2>
              <p>{comentarioResultado}</p>
            </div>
          </>
        )}
        {tipoPrueba === "simulacro" && (
          <div className="comentario-resultado">
            <h2>¡Simulacro completado con éxito!</h2>
            <p>{comentarioResultado}</p>
            <p>Recibirás los resultados detallados por correo.</p>
          </div>
        )}
        <button className="boton-reiniciar" onClick={() => {
          setPantalla("inicio");
          setPreguntas([]);
          setRespuestas({});
          setResultados({});
          setResultadosTemporales(null);
          setDatosUsuario({ nombre: "", correo: "" });
        }}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="container cargando-container">
      <div className="spinner"></div>
      <p>{cargando ? "Cargando..." : "Cargando aplicación..."}</p>
    </div>
  );
}

export default App;
