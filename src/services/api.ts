export interface SubmitPayload {
    nombre: string;
    apellido: string;
    seccion: string;
    genero: string;
    resultados: Array<number | null>;
    top3: string[];
}

export const sendFormData = async (data: SubmitPayload) => {
    try {
        const response = await fetch('https://holland-calculator-c0h6eydkf0frhtay.eastus2-01.azurewebsites.net/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en el servidor');
        }
        return await response.json();
    } catch (err) {
        console.error('Error enviando datos al backend:', err);
        throw err;
    }
};