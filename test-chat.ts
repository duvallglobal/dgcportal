import { callNvidiaAI } from './lib/nvidia-ai'

import { callNvidiaAI } from './lib/nvidia-ai'

async function run() {
    try {
        const res = await callNvidiaAI('chatbot', [{ role: 'user', content: 'Hello this is a test' }])
        console.log('SUCCESS:', res)
    } catch (e) {
        console.error('ERROR CAUGHT:')
        console.error(e)
    }
}

run()
