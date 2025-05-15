import React, { useState } from 'react';
import './Home.css';
import { questions } from '../hooks/questions';
import { sendFormData, SubmitPayload } from '../services/api';

const TOTAL_QUESTIONS = 66;
const TOTAL_STEPS = TOTAL_QUESTIONS + 4;
const RESULTS_STEP = TOTAL_STEPS - 1;
const DIMENSIONS = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
type Dimension = typeof DIMENSIONS[number];

interface FormDataType {
    nombre: string;
    apellido: string;
    seccion: string;
    genero: string;
    resultados: Array<number | null>;
}

interface Scores {
    Sum: Record<Dimension, number>;
    Sub: Record<Dimension, number>;
    P: Record<Dimension, number>;
    Self: Record<Dimension, number>;
    T: Record<Dimension, number>;
    top3: Dimension[];
}

const initialFormData: FormDataType = {
    nombre: '',
    apellido: '',
    seccion: '',
    genero: '',
    resultados: Array(TOTAL_QUESTIONS).fill(null),
};

const Home: React.FC = () => {
    const [formData, setFormData] = useState<FormDataType>(initialFormData);
    const [currentStep, setCurrentStep] = useState(0);
    const [scores, setScores] = useState<Scores | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleOption = (value: number) => {
        const newRes = [...formData.resultados];
        let nextStep = currentStep + 1;

        if (currentStep >= 2 && currentStep <= 61) {
            // preguntas 1–60
            newRes[currentStep - 2] = value;
        } else if (currentStep >= 63 && currentStep <= 68) {
            // preguntas 61–66
            const idx = currentStep - 3;
            const usedElsewhere = newRes
                .slice(60, 66)
                .some((v, i) => v === value && i !== idx - 60);
            if (!usedElsewhere) {
                newRes[idx] = value;
                // Si estamos en la última afirmación, vamos directo a resultados (slide 69)
                if (currentStep === 68) nextStep = TOTAL_STEPS - 1;
            } else {
                alert('Ya usaste ese valor en otra afirmación');
                return;
            }
        }

        setFormData({ ...formData, resultados: newRes });
        setCurrentStep(nextStep);
    };


    const calculateScores = () => {
        const Sum: Record<Dimension, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        const Sub: Record<Dimension, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        const Self: Record<Dimension, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

        for (let d = 0; d < 6; d++) {
            const dim = DIMENSIONS[d];
            const answers = formData.resultados.slice(d * 10, d * 10 + 10);
            const vals = answers.filter((v): v is number => v !== null);
            Sum[dim] = vals.reduce((sum, v) => sum + v, 0);
            Sub[dim] = 2 * vals.filter(v => v === 5).length + vals.filter(v => v === 4).length;
        }
        for (let d = 0; d < 6; d++) {
            const dim = DIMENSIONS[d];
            const val = formData.resultados[60 + d];
            if (val != null) Self[dim] = ((val - 1) / 6) * 10;
        }
        const P: Record<Dimension, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        const T: Record<Dimension, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        DIMENSIONS.forEach(dim => {
            P[dim] = Sum[dim] + 0.1 * Sub[dim];
            T[dim] = P[dim] + 0.5 * Self[dim];
        });
        const top3 = [...DIMENSIONS].sort((a, b) => T[b] - T[a]).slice(0, 3);
        setScores({ Sum, Sub, P, Self, T, top3 });
        setCurrentStep(RESULTS_STEP);
    };

    const goBack = () => setCurrentStep(s => Math.max(0, s - 1));

    const isDisabledLastSix = (qIdx: number, opt: number) => {
        if (qIdx < TOTAL_QUESTIONS - 6) return false;
        return formData.resultados
            .slice(TOTAL_QUESTIONS - 6)
            .some((v, i) => v === opt && i + TOTAL_QUESTIONS - 6 !== qIdx);
    };

    const handleSubmit = async () => {
        if (!scores) return;
        const payload: SubmitPayload = {
            nombre: formData.nombre,
            apellido: formData.apellido,
            seccion: formData.seccion,
            genero: formData.genero,
            resultados: formData.resultados,
            top3: scores.top3,
        };
        try {
            await sendFormData(payload);
            alert('Datos enviados correctamente');
            setFormData(initialFormData);
            setScores(null);
            setCurrentStep(0);
        } catch {
            alert('Error al enviar datos');
        }
    };

    return (
        <div className="wizard-container">
            <div className="slides" style={{ '--current-step': currentStep } as React.CSSProperties}>
                {/* Step 0: Datos Personales */}
                <div className="slide">
                    <h1>Datos Personales</h1>
                    <div className="form-fields">
                        <div className="input-group">
                            <label>Nombre:</label>
                            <input name="nombre" value={formData.nombre} onChange={handleInputChange} />
                        </div>
                        <div className="input-group">
                            <label>Apellido:</label>
                            <input name="apellido" value={formData.apellido} onChange={handleInputChange} />
                        </div>
                        <div className="radio-field">
                            <p>Sección:</p>
                            <div className="radio-buttons">
                                {['5to F', '5to D'].map(sec => (
                                    <button
                                        key={sec}
                                        className={`radio-option ${formData.seccion === sec ? 'selected' : ''}`}
                                        onClick={() => setFormData({ ...formData, seccion: sec })}
                                    >
                                        {sec}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="radio-field">
                            <p>Género:</p>
                            <div className="radio-buttons">
                                {['Masculino', 'Femenino', 'Otro'].map(gen => (
                                    <button
                                        key={gen}
                                        className={`radio-option ${formData.genero === gen ? 'selected' : ''}`}
                                        onClick={() => setFormData({ ...formData, genero: gen })}
                                        data-gender={gen === 'Masculino' ? 'Masc.' : gen === 'Femenino' ? 'Feme.' : 'Otro'}
                                    >
                                        <span>{gen}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            className="next-button"
                            onClick={() => setCurrentStep(1)}
                            disabled={!formData.nombre || !formData.apellido || !formData.seccion || !formData.genero}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>

                {/* Step 1: Instrucciones preguntas 1-60 */}
                <div className="slide instructions-screen">
                    <h2>Instrucciones</h2>
                    <h2>(Afirmaciones 1 a 60)</h2>
                    <p className="question-text">
                        Lee cada afirmación con atención.Marca sólo un valor según tu grado de acuerdo:
                    </p>
                    <p className="option-meaning">
                        <ul>
                            <li>1 = Muy en desacuerdo</li>
                            <li>2 = En desacuerdo</li>
                            <li>3 = Ni acuerdo ni en desacuerdo</li>
                            <li>4 = De acuerdo</li>
                            <li>5 = Muy de acuerdo</li>
                        </ul>
                    </p>
                    <p>Sé honesto/a; no hay respuestas “buenas” o “malas”.</p>
                    <button className="next-button" onClick={() => setCurrentStep(2)}>Comenzar</button>
                </div>

                {/* Preguntas 1-60 (steps 2-61) */}
                {formData.resultados.slice(0,60).map((res, i) => (
                    <div key={i} className="slide">
                        <h2>Afirmación {i + 1}</h2>
                        <p className="question-text">{questions[i]}</p>
                        <p className="option-meaning">
                            <ul>
                                <li>1 = Muy en desacuerdo</li>
                                <li>2 = En desacuerdo</li>
                                <li>3 = Ni acuerdo ni en desacuerdo</li>
                                <li>4 = De acuerdo</li>
                                <li>5 = Muy de acuerdo</li>
                            </ul>
                        </p>
                        <div className="options">
                            {Array(5).fill(0).map((_, v) => (
                                <button
                                    key={v}
                                    className={`option ${res === v + 1 ? 'selected' : ''}`}
                                    onClick={() => handleOption(v + 1)}
                                >
                                    {v + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Step 62: Instrucciones preguntas 61-66 */}
                <div className="slide instructions-screen">
                    <h2>Instrucciones</h2>
                    <h2>(Afirmaciones 61 a 66)</h2>
                    <p className="question-text">
                        Para cada aspecto, selecciona un único valor del 1 al 6 según cómo te percibes:
                    </p>
                    <p className="option-meaning">
                        <ul>
                            <li>1 = Muy baja</li>
                            <li>2 = Baja</li>
                            <li>3 = Algo Baja</li>
                            <li>4 = Algo Alta</li>
                            <li>5 = Alta</li>
                            <li>6 = Muy Alta</li>
                        </ul>
                    </p>
                    <p className="question-text">No repitas el mismo número en más de un aspecto. Cada valor sólo puede usarse una vez.</p>
                    <button className="next-button" onClick={() => setCurrentStep(63)}>Continuar</button>
                </div>

                {/* Preguntas 61-66 (steps 63-68) */}
                {formData.resultados.slice(60).map((res, i) => (
                    <div key={i+60} className="slide">
                        <h3>Afirmación {i + 61}</h3>
                        <p className="question-text">{questions[i + 60]}</p>
                        <p className="option-meaning">
                            <ul>
                                <li>1 = Muy baja</li>
                                <li>2 = Baja</li>
                                <li>3 = Algo Baja</li>
                                <li>4 = Algo Alta</li>
                                <li>5 = Alta</li>
                                <li>6 = Muy Alta</li>
                            </ul>
                        </p>
                        <div className="options">
                            {Array(6).fill(0).map((_, v) => (
                                <button
                                    key={v}
                                    className={`option ${res === v + 1 ? 'selected' : ''}`}
                                    onClick={() => handleOption(v + 1)}
                                    disabled={isDisabledLastSix(i + 60, v + 1)}
                                >
                                    {v + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}


                {/* Resultados */}
                <div className="slide">
                    <h1>Resultados RIASEC</h1>
                    {scores ? (
                        <div className="results">
                            <div className="top3-container">
                                {scores.top3.map(dim => (
                                    <div key={dim} className="top3-item">{dim}</div>
                                ))}
                            </div>
                            <button className="submit-button" onClick={handleSubmit}>Enviar</button>
                        </div>
                    ) : (
                        <button className="calculate-button" onClick={calculateScores}>Calcular Resultados</button>
                    )}
                </div>
            </div>
            {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
                <button className="back-button" onClick={goBack}>← Atrás</button>
            )}
        </div>
    );
};

export default Home;