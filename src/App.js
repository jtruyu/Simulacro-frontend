import React, { useState, useEffect } from 'react';
import './App.css';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

function App() {
  const [iniciado, setIniciado] = useState(false);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(600); // 10 min
  const [preguntas, setPreguntas] = useState([]);

  // Cargar preguntas de ejemplo
  useEffect(() => {
    const ejemploPreguntas = [
      { id: 1, texto: '¿Cuál es la velocidad de la luz?', imagen: null },
      { id: 2, texto: '¿Quién formuló la ley de la gravedad?', imagen: null },
    ];
    setPreguntas(ejemploPreguntas);
  }, []);

  // Temporizador
  useEffect(() => {
    let intervalo = null;
    if (iniciado && tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante(t => t - 1);
      }, 1000);
    } else {
      clearInterval(intervalo);
    }
    return () => clearInterval(intervalo);
  }, [iniciado, tiempoRestante]);

  const iniciarSimulacro = () => {
    setIniciado(true);
    setTiempoRestante(600); // 10 minutos
    setPreguntaActual(0);
  };

  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(p => p + 1);
    }
  };

  return (
    <div className="App">
      {iniciado && <div className="temporizador">{`Tiempo restante: ${Math.floor(tiempoRestante / 60)}:${String(tiempoRestante % 60).padStart(2, '0')}`}</div>}

      <div className="container">
        {!iniciado ? (
          <button className="btn-iniciar" onClick={iniciarSimulacro}>Iniciar Simulacro</button>
        ) : (
          <>
            <div className="barra-progreso">
              Pregunta {preguntaActual + 1} de {preguntas.length}
            </div>

            <TransitionGroup>
              <CSSTransition key={preguntas[preguntaActual].id} timeout={500} classNames="fade">
                <div className="pregunta-container">
                  <div className="ejercicio-texto">{preguntas[preguntaActual].texto}</div>
                  {preguntas[preguntaActual].imagen && (
                    <img src={preguntas[preguntaActual].imagen} alt="Ejercicio" className="imagen-ejercicio" />
                  )}
                </div>
              </CSSTransition>
            </TransitionGroup>

            <div className="botones">
              <button onClick={siguientePregunta}>Siguiente</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
