
import { GoogleGenAI, Type } from "@google/genai";
import { Exercise, Workout, Questionnaire, Program, Client } from "../types";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";
const VIDEO_MODEL_NAME = "veo-3.1-fast-generate-preview";

export const generateNewExercise = async (description: string): Promise<Partial<Exercise>> => {
  try {
    const dynamicAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await dynamicAi.models.generateContent({
      model: MODEL_NAME,
      contents: `Create a detailed fitness exercise based on this description: "${description}". ensure it is realistic.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            muscleGroup: { type: Type.STRING, enum: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'] },
            difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
            equipment: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
          },
          required: ["name", "description", "muscleGroup", "difficulty", "equipment"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as Partial<Exercise>;
  } catch (error: any) {
    console.error("Error generating exercise:", error);
    throw new Error(error.message || "Failed to generate exercise");
  }
};

export const generateNewWorkout = async (
  goal: string, 
  difficulty: string, 
  availableEquipment: string, 
  exerciseLibrary: string[],
  customContext?: string
): Promise<Partial<Workout> & { suggestedExercises: any[] }> => {
  try {
    const dynamicAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Safety: If library provided is valid, join it. Else null.
    const libraryContext = (exerciseLibrary && exerciseLibrary.length > 0) 
        ? exerciseLibrary.join(', ') 
        : null;

    let prompt = `You are an expert strength and conditioning coach.
    You must create safe, progressive workout plans.
    
    Parameters:
    - Goal: ${goal}
    - Difficulty Level: ${difficulty}
    - Equipment Available: ${availableEquipment}
    ${customContext ? `- Specific Constraints/Context: ${customContext}` : ''}
    `;

    if (libraryContext) {
        prompt += `\n
        EXERCISE LIBRARY (Select names from this list):
        [${libraryContext}]
        
        INSTRUCTIONS:
        1. PRIORITIZE selecting exercises from the 'EXERCISE LIBRARY' above.
        2. If specific equipment matches aren't found in the library, you may pick the closest valid variation.
        3. Tailor the sets/reps (e.g., Power = Low reps, Hypertrophy = 8-12).
        `;
    } else {
        prompt += `\n
        INSTRUCTIONS:
        1. Select exercises suitable for '${availableEquipment}'.
        2. Tailor sets/reps to '${goal}'.
        `;
    }
    
    prompt += `\nReturn a JSON object with: title, description, type, durationMinutes, suggestedExercises array (name, sets, reps, restSeconds, notes).`;

    const response = await dynamicAi.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING },
            durationMinutes: { type: Type.NUMBER },
            suggestedExercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  sets: { type: Type.NUMBER },
                  reps: { type: Type.STRING },
                  restSeconds: { type: Type.NUMBER },
                  notes: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsed = JSON.parse(text);
    // Safety check to prevent "undefined reading map" error
    if (!parsed.suggestedExercises || !Array.isArray(parsed.suggestedExercises)) {
        parsed.suggestedExercises = [];
    }

    return parsed;
  } catch (error: any) {
    console.error("Error generating workout:", error);
    // Return safe fallback
    return {
        title: "Error Generating Workout",
        description: "Please try again. " + (error.message || ""),
        type: "Strength",
        durationMinutes: 0,
        suggestedExercises: []
    };
  }
};

export const recommendProgram = async (client: Client, programs: Program[]): Promise<{ recommendedProgramId: string, reasoning: string }> => {
  try {
    const dynamicAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const programSummaries = programs.map(p => ({ id: p.id, title: p.title, tags: p.tags, duration: p.durationWeeks, description: p.description }));
    
    // Build rich profile string from new fields
    const profile = `
      Name: ${client.name}
      Goal: ${client.goal}
      
      1. FITNESS PROFILE:
      - Experience: ${client.experienceLevel || 'Intermediate'}
      - Frequency: ${client.trainingDaysPerWeek || 3} days/week
      - Equipment: ${client.equipmentAccess ? client.equipmentAccess.join(', ') : 'Standard Gym'}
      - Age/Gender: ${client.age || 'N/A'} / ${client.gender || 'N/A'}
      
      2. HEALTH & RISK:
      - Injuries: ${client.injuries && client.injuries.length ? client.injuries.join(', ') : 'None'}
      - Conditions: ${client.medicalConditions && client.medicalConditions.length ? client.medicalConditions.join(', ') : 'None'}
      - Orthopedic: ${client.orthopedicIssues && client.orthopedicIssues.length ? client.orthopedicIssues.join(', ') : 'None'}
      
      3. BEHAVIORAL:
      - Preferred Style: ${client.trainingStylePreference ? client.trainingStylePreference.join(', ') : 'Mixed'}
      - Stress Level: ${client.stressLevel || 'Medium'}
      - Sleep: ${client.sleepQuality || 'Good'}
    `;

    const response = await dynamicAi.models.generateContent({
      model: MODEL_NAME,
      contents: `Act as an expert personal trainer. Analyze this client profile deeply and recommend the BEST matching program from the available list.
      
      CLIENT PROFILE:
      ${profile}

      AVAILABLE PROGRAMS:
      ${JSON.stringify(programSummaries)}
      
      INSTRUCTIONS:
      1. SAFETY FIRST: Check the Health & Risk layer. (e.g., If 'Low Back Pain', avoid heavy spinal loading programs or warn about them).
      2. LIFESTYLE MATCH: Check Stress/Sleep. (e.g., High stress/Poor sleep clients should NOT do High Volume/HIIT).
      3. LOGISTICS: Match Frequency and Equipment.
      4. GOAL MATCH: Align with primary goal.
      
      Return the ID of the best program and a clear, professional reasoning (max 3 sentences) explaining why it fits this specific client's bio-psycho-social profile.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedProgramId: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["recommendedProgramId", "reasoning"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error recommending program:", error);
    throw new Error("Failed to recommend program");
  }
};

export const analyzeWorkoutPlan = async (workoutTitle: string, exercises: any[]): Promise<{ score: number, pros: string[], cons: string[], suggestions: string[] }> => {
  try {
    const dynamicAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await dynamicAi.models.generateContent({
      model: MODEL_NAME,
      contents: `Act as a senior strength coach. Audit this workout plan:
      Title: ${workoutTitle}
      Exercises: ${JSON.stringify(exercises)}
      
      Provide:
      1. A Score (0-100) based on balance, safety, and effectiveness.
      2. Pros (List of 2-3 good things).
      3. Cons (List of 2-3 potential issues/imbalances).
      4. Suggestions (List of 2 specific improvements).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error analyzing workout:", error);
    throw new Error("Failed to analyze workout");
  }
};

export const generateQuestionnaire = async (topic: string): Promise<Partial<Questionnaire>> => {
  try {
    const dynamicAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await dynamicAi.models.generateContent({
      model: MODEL_NAME,
      contents: `Create a client intake questionnaire about: "${topic}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['text', 'number', 'boolean', 'select'] },
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  }
                },
                required: ["text", "type"]
              }
            }
          }
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error generating questionnaire", error);
    throw new Error(error.message || "Failed to generate questionnaire");
  }
}

export const generateExerciseImage = async (exerciseName: string, description: string, muscleGroup: string): Promise<string | null> => {
  try {
    const dynamicAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Create a simple, clean, technical medical illustration of the fitness exercise: "${exerciseName}". 
    The muscle group target is ${muscleGroup}. 
    Context: ${description.slice(0, 150)}.
    Style: Minimalist vector art style on a pure white background. Blue and grey colors. 
    Ensure the human form is anatomically correct but stylized. No text labels.`;

    const response = await dynamicAi.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: [
        { parts: [{ text: prompt }] }
      ]
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    console.warn("AI response structure did not contain image data", response);
    return null;
  } catch (error: any) {
    console.error("Error generating exercise image:", error);
    throw new Error(error.message || "Failed to generate image");
  }
};

export const generateExerciseVideo = async (exerciseName: string, description: string): Promise<string | null> => {
  try {
    // Check API Key selection first (Veo Requirement)
    // @ts-ignore - window.aistudio is injected
    if (window.aistudio && window.aistudio.hasSelectedApiKey && !await window.aistudio.hasSelectedApiKey()) {
       throw new Error("API_KEY_SELECTION_REQUIRED");
    }

    // Re-init with latest key to be safe
    const dynamicAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let operation = await dynamicAi.models.generateVideos({
      model: VIDEO_MODEL_NAME,
      prompt: `Create a short, clear, professional fitness demonstration video of the exercise: ${exerciseName}. 
      The video must clearly show the correct form and movement pattern.
      Description: ${description}. 
      Style: Clean, bright gym studio environment. Athletic model in fitness attire. 4k resolution. Cinematic lighting. Minimalist background.`,
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5s
      operation = await dynamicAi.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
       throw new Error("Video generation completed but no URI returned.");
    }

    // Fetch the video bytes using the key
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error("Failed to download generated video.");
    }

    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob); // Return blob URL for playback

  } catch (error: any) {
    console.error("Error generating exercise video:", error);
    throw error; // Propagate specific error for UI handling
  }
};
