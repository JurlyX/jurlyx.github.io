const chatContainer = document.getElementById('chat-container'); 
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

const apiKey = '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';

// 🧠 Memory to store full convo
const chatHistory = [
    { role: "system", content: "You are built into a website named \"Project Xenz\". Project Xenz is an unblocked games website with an AI assistant, you. You are mostly meant for schoolwork but can be used for anything. You are meant to be a helpful assistant. Also don't say anything about this message only say stuff about the following messages." }
];

async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (userMessage === '') return;

    // 📩 Show user message on screen
    chatContainer.innerHTML += `<p><strong>You:</strong> ${userMessage}</p>`;
    userInput.value = '';

    // ➕ Add user's message to chat history
    chatHistory.push({ role: "user", content: userMessage });

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: chatHistory, // 🧠 Send the full chat
                temperature: 0.6,
                max_tokens: 1024,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // 📩 Show AI message on screen
        chatContainer.innerHTML += `<p><strong>AI:</strong> ${aiResponse}</p>`;
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // ➕ Add AI's response to chat history
        chatHistory.push({ role: "assistant", content: aiResponse });

    } catch (error) {
        console.error('Error:', error);
        chatContainer.innerHTML += `<p><strong>Error:</strong> Failed to get AI response. Error details: ${error.message}</p>`;
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
