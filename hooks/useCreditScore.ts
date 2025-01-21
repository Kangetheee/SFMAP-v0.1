// hooks/useCreditScore.js
import { useState } from 'react';
import axios from 'axios';

const useCreditScore = (inputData) => {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);

    const getPrediction = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:5000/predict', inputData);
            setPrediction(response.data.prediction);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    return { prediction, loading, getPrediction };
};

export default useCreditScore;
