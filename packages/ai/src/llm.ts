import { ChatOpenAI } from '@langchain/openai'
import { config } from '@jd-match/config'

// ============================================
// LLM Configuration
// ============================================

let llmInstance: ChatOpenAI | null = null

export function getLLM(temperature: number = 0.7): ChatOpenAI {
    if (!llmInstance) {
        llmInstance = new ChatOpenAI({
            openAIApiKey: config.OPENAI_API_KEY,
            modelName: config.OPENAI_MODEL,
            temperature,
            streaming: true, // Enable streaming for real-time responses
        })
    }
    return llmInstance
}

export function getStreamingLLM(temperature: number = 0.7): ChatOpenAI {
    return new ChatOpenAI({
        openAIApiKey: config.OPENAI_API_KEY,
        modelName: config.OPENAI_MODEL,
        temperature,
        streaming: true,
    })
}
