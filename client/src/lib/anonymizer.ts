import { pipeline } from '@xenova/transformers';

const modelState = {
  tokenizer: null as any,
  isLoading: false,
  error: null as string | null
};

const MODEL_LOAD_TIMEOUT = 30000; // 30 seconds timeout

const basicPatterns = {
  cpr: /\b\d{6}[-]?\d{4}\b/g,
  phone: /\b(?:\+45[ ]?)?(?:\d{2}[ ]?\d{2}[ ]?\d{2}[ ]?\d{2}|\d{8})\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Fallback patterns only used if AI fails
  name: /\b[A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)+\b/g,
  address: /\b[A-ZÆØÅ][a-zæøå]+(?:vej|gade|allé|plads)\s+\d+\b/gi,
};

async function initializeModel() {
  if (modelState.tokenizer) {
    console.log('Using cached model');
    return modelState.tokenizer;
  }

  if (modelState.isLoading) {
    console.log('Model is already loading, waiting...');
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (modelState.tokenizer) {
          clearInterval(checkInterval);
          resolve(modelState.tokenizer);
        }

        if (Date.now() - startTime > MODEL_LOAD_TIMEOUT) {
          clearInterval(checkInterval);
          modelState.isLoading = false;
          modelState.error = 'Model loading timed out';
          reject(new Error('Model loading timed out after 30 seconds'));
        }
      }, 100);
    });
  }

  try {
    console.log('Starting model initialization...');
    modelState.isLoading = true;
    modelState.error = null;

    // Create a promise that will reject after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Model loading timed out')), MODEL_LOAD_TIMEOUT);
    });

    // Create the model loading promise
    const modelPromise = pipeline(
      'token-classification',
      'Xenova/bert-base-NER',
      {
        quantized: true,
        progress_callback: (progress: any) => {
          const percent = Math.round(progress.progress * 100);
          console.log(`Model loading progress: ${percent}%`);
          console.log('Progress details:', progress);
        }
      }
    );

    // Race between the timeout and the model loading
    modelState.tokenizer = await Promise.race([modelPromise, timeoutPromise]);

    if (!modelState.tokenizer) {
      throw new Error('Pipeline returned null tokenizer');
    }

    console.log('Model initialized successfully');
    return modelState.tokenizer;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Model initialization failed:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    modelState.error = errorMessage;
    throw error; // Re-throw to handle in the calling function
  } finally {
    modelState.isLoading = false;
  }
}

export async function anonymizeText(text: string): Promise<string> {
  if (!text.trim()) {
    throw new Error('Ingen tekst at anonymisere');
  }

  console.log('Starting anonymization of text:', text);
  let result = text;

  try {
    console.log('Attempting to initialize model...');
    const model = await initializeModel();

    console.log('Model loaded successfully, running inference...');
    const entities = await model(text, {
      aggregation_strategy: 'simple'
    });

    console.log('AI model returned entities:', entities);

    if (entities && entities.length > 0) {
      entities
        .filter((e: any) => {
          const isValid = e.score > 0.7;
          console.log(`Entity "${text.slice(e.start, e.end)}" score: ${e.score}, valid: ${isValid}`);
          return isValid;
        })
        .sort((a: any, b: any) => b.start - a.start)
        .forEach((entity: any) => {
          const originalText = text.slice(entity.start, entity.end);
          console.log(`Processing entity: "${originalText}" (${entity.entity_group})`);

          let replacement = '[INFORMATION]';
          switch(entity.entity_group.toUpperCase()) {
            case 'PER':
            case 'PERSON':
              replacement = '[NAVN]';
              break;
            case 'LOC':
            case 'LOCATION':
              replacement = '[STED]';
              break;
            case 'ORG':
            case 'ORGANIZATION':
              replacement = '[ORGANISATION]';
              break;
          }

          console.log(`Replacing "${originalText}" with "${replacement}"`);
          result = result.slice(0, entity.start) + replacement + result.slice(entity.end);
        });
    } else {
      console.log('AI model found no entities, falling back to patterns');
    }
  } catch (error) {
    console.error('AI processing failed, falling back to pattern matching:', error);
    // Continue with pattern matching
  }

  // Always apply pattern matching as a fallback
  console.log('Applying pattern matching...');
  Object.entries(basicPatterns).forEach(([type, pattern]) => {
    const matches = result.match(pattern);
    if (matches) {
      console.log(`Pattern found ${type} matches:`, matches);
    }

    result = result.replace(pattern, (match) => {
      if (match.toLowerCase().match(/^(jeg|du|han|hun|den|det|de|vi|i|på|og|eller|men)$/)) {
        return match;
      }
      const replacement = `[${type.toUpperCase()}]`;
      console.log(`Regex replacing "${match}" with "${replacement}"`);
      return replacement;
    });
  });

  console.log('Final anonymized text:', result);
  return result;
}

export async function getDetectedTypes(text: string): Promise<string[]> {
  if (!text.trim()) {
    return [];
  }

  const types = new Set<string>();

  try {
    const model = await initializeModel();
    const entities = await model(text, {
      aggregation_strategy: 'simple'
    });

    entities
      .filter((e: any) => e.score > 0.7)
      .forEach((e: any) => {
        const type = e.entity_group.toUpperCase();
        switch(type) {
          case 'PER':
          case 'PERSON':
            types.add('PER');
            break;
          case 'LOC':
          case 'LOCATION':
            types.add('LOC');
            break;
          case 'ORG':
          case 'ORGANIZATION':
            types.add('ORG');
            break;
          default:
            types.add(type);
        }
      });
  } catch (error) {
    console.error('AI model detection failed:', error instanceof Error ? error.message : error);
    // Continue with pattern detection
  }

  Object.entries(basicPatterns).forEach(([type, pattern]) => {
    if (pattern.test(text)) {
      types.add(type.toUpperCase());
    }
  });

  return Array.from(types);
}