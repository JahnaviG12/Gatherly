const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API inside route handler

router.post('/chat', async (req, res) => {
    try {
        let { message, history } = req.body;

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_actual_api_key_here' || process.env.GEMINI_API_KEY.trim() === '') {
            // Smart mock logic fallback when no API key is present
            const input = message.toLowerCase();
            let replyText = '';

            const placeMatch = input.match(/places? (in|at|near|around|for) ([a-zA-Z0-9\s]+)/i) || input.match(/(resorts?|hotels?|venues?) (in|at|near|around) ([a-zA-Z0-9\s]+)/i);
            
            if (placeMatch) {
              const location = placeMatch[3] || placeMatch[2];
              const locStr = location.trim().split('?')[0];
              const locCapitalized = locStr.charAt(0).toUpperCase() + locStr.slice(1);
              replyText = `Based on your request, here are a few highly-rated resort and retreat places for a team outing in **${locCapitalized}**:\n\n**1. The Grand Eco-Resort (${locCapitalized} Outskirts)**\n- *Why*: Great for disconnecting and deep-focus strategy sessions away from the city noise.\n- *Activities*: Zip-lining, team-building obstacle courses, evening bonfire.\n\n**2. Premium City Center Hotel (Heart of ${locCapitalized})**\n- *Why*: Close to dining, nightlife, and incredibly easy to commute for the whole team.\n- *Activities*: Rooftop dinner, access to premium conference rooms.\n\n**3. Serenity Lakeside Retreat (${locCapitalized} Region)**\n- *Why*: Perfect for team bonding and casual workshops by the water.\n- *Activities*: Boating, kayaking, outdoor barbecue.\n\n*(Note: This is a simulated backend response because no real Gemini API key is configured in .env)*`;
            } else if (input.includes('party') || input.includes('event')) {
              replyText = `Here are some excellent party ideas tailored for your workspace:\n\n**1. Neon Retro Night**\n- *Vibe*: 80s synth-wave, glow sticks, neon lights.\n- *Tasks*: Assign someone to curate a retro playlist and someone else to buy blacklights.\n\n**2. Murder Mystery Dinner**\n- *Vibe*: Interactive, engaging, theatrical.\n- *Tasks*: Purchase a script online, assign characters to members in advance.\n\n**3. Outdoor Backyard Cinema**\n- *Vibe*: Cozy, relaxed, under the stars.\n- *Tasks*: Rent a projector, organize a popcorn/snack bar, bring blankets.\n\n*(Note: This is a simulated backend response because no real Gemini API key is configured in .env)*`;
            } else if (input.includes('budget') || input.includes('expense') || input.includes('cost') || input.includes('split')) {
              replyText = `Managing expenses efficiently is critical. Here is a recommended strategy:\n\n1. **Establish a Base Budget**: Agree on a maximum per-person contribution before the event.\n2. **Log Everything Instantly**: Use the **Expenses** tab to log receipts the moment they occur.\n3. **Dynamic Splitting**: Not everyone consumes the same amount. When logging an expense, use the 'Custom Split' option rather than 'Equal Split' for items like alcohol or special diets.\n\n*(Note: This is a simulated backend response because no real Gemini API key is configured in .env)*`;
            } else if (input.includes('task') || input.includes('todo') || input.includes('assign')) {
              replyText = `To execute your project flawlessly, I recommend breaking it down into these phases:\n\n- **Phase 1: Planning (Days 1-3)**\n  - Define the core objective.\n  - Set the budget.\n- **Phase 2: Execution (Days 4-10)**\n  - Finalize bookings.\n  - Purchase supplies.\n- **Phase 3: Review (Day 11)**\n  - Settle all outstanding expenses.\n\n*(Note: This is a simulated backend response because no real Gemini API key is configured in .env)*`;
            } else if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
              replyText = `Hello! I am your advanced AI Planner. I am equipped to help you brainstorm ideas, manage your budget, structure your tasks, and keep your team organized.\n\n*(Note: This is a simulated backend response because no real Gemini API key is configured in .env)*`;
            } else {
              replyText = `That is an interesting point regarding "${message}". \n\nAs your AI Planner, I recommend looking at this from a project management perspective. Consider breaking this down into smaller, actionable items. \n\n*(Note: This is a simulated backend response because no real Gemini API key is configured in .env)*`;
            }

            return res.status(200).json({ text: replyText });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `You are a helpful, professional AI Planner for a workspace collaboration tool called LinkUp.
You help teams brainstorm ideas, create itineraries, estimate budgets, and manage tasks.
Keep your responses well-formatted using markdown. Be concise and actionable.
Format lists clearly and use bold text for emphasis.
If asked to generate tasks or an itinerary, structure them clearly with phases or days.`;

        // Format history for Gemini
        let formattedHistory = history ? history.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text || ' ' }]
        })) : [];

        // Gemini API strictly requires history to start with a 'user' role
        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift(); // Remove the frontend's default greeting
        }

        // Start chat
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            },
            systemInstruction: {
                parts: [{ text: systemInstruction }],
                role: 'system'
            }
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        res.status(200).json({ text: responseText });
    } catch (error) {
        console.error('AI API Error:', error);
        res.status(500).json({ error: 'Failed to generate AI response. Please check your API key or network connection.', details: error.message });
    }
});

module.exports = router;
