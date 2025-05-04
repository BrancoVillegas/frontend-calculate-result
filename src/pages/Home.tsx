import React, { useState } from 'react';
import './Home.css';
import { sendFormData, SubmitPayload } from '../services/api';

const TOTAL_QUESTIONS = 66;
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
        const idx = currentStep - 1;
        const newRes = [...formData.resultados];
        const isLastSix = idx >= TOTAL_QUESTIONS - 6;
        if (isLastSix && newRes[idx] === value) {
            newRes[idx] = null;
        } else {
            newRes[idx] = value;
        }
        setFormData({ ...formData, resultados: newRes });
        setCurrentStep(s => Math.min(TOTAL_QUESTIONS + 1, s + 1));
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
        setCurrentStep(TOTAL_QUESTIONS + 1);
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
                {/* Preguntas */}
                {formData.resultados.map((res, i) => (
                    <div key={i} className="slide">
                        <h1>Pregunta {i + 1}</h1>
                        <div className="options">
                            {Array(i < TOTAL_QUESTIONS - 6 ? 5 : 6)
                                .fill(0)
                                .map((_, v) => (
                                    <button
                                        key={v}
                                        className={`option ${res === v + 1 ? 'selected' : ''}`}
                                        onClick={() => handleOption(v + 1)}
                                        disabled={isDisabledLastSix(i, v + 1)}
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
            {currentStep > 0 && currentStep <= TOTAL_QUESTIONS && <button className="back-button" onClick={goBack}>← Atrás</button>}
        </div>
    );
};

export default Home;