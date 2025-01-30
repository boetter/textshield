import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as tf from '@tensorflow/tfjs';

export default function Test() {
  const [modelStatus, setModelStatus] = useState<string>("Ikke startet");
  const [error, setError] = useState<string | null>(null);

  const testModel = async () => {
    try {
      setModelStatus("Starter test...");
      console.log("Starting TensorFlow.js test");

      // Create a simple model
      const model = tf.sequential();
      model.add(tf.layers.dense({units: 1, inputShape: [1]}));
      
      // Compile model
      model.compile({
        loss: 'meanSquaredError',
        optimizer: 'sgd'
      });

      setModelStatus("Model oprettet og kompileret");
      console.log("Model created and compiled");

      // Create some dummy data
      const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
      const ys = tf.tensor2d([2, 4, 6, 8], [4, 1]);

      // Train model
      setModelStatus("Træner model...");
      await model.fit(xs, ys, {
        epochs: 10,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss}`);
            setModelStatus(`Træning epoch ${epoch + 1}/10`);
          }
        }
      });

      // Test prediction
      const result = model.predict(tf.tensor2d([5], [1, 1])) as tf.Tensor;
      const prediction = await result.data();
      
      setModelStatus(`Success! Prediction for input 5: ${prediction[0]}`);
      console.log("Test completed successfully");

    } catch (err) {
      console.error("Test failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setModelStatus("Test fejlede");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">AI Model Test</h1>
        
        <Card className="p-4">
          <div className="space-y-4">
            <p><strong>Status:</strong> {modelStatus}</p>
            {error && (
              <p className="text-red-500">
                <strong>Fejl:</strong> {error}
              </p>
            )}
            <Button onClick={testModel}>Start Test</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
