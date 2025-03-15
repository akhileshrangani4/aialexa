document.addEventListener("DOMContentLoaded", function() {
    // Ensure the target div exists
    var targetDiv = document.getElementById("aialexa-chatbot");
    if (!targetDiv) {
        console.error("Target div 'aialexa-chatbot' not found.");
        return;
    }

    // Get the chatbot ID from the window
    var chatbotId = window.chatbotConfig ? window.chatbotConfig.chatbotId : null;
    if (!chatbotId) {
        console.error("Chatbot ID not found in window.chatbotConfig.");
        return;
    }

    // Create the iframe element
    var iframe = document.createElement('iframe');
    iframe.src = `https://aialexa.org/embed/${chatbotId}/window?chatbox=false`;
    iframe.setAttribute("style", `
    overflow: hidden;
    height: 75vh;
    width: 55rem;
    bottom: -30px;
    border: 2px solid #e2e8f0;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`);
    iframe.allowFullscreen = true;
    iframe.allow = "clipboard-read; clipboard-write";

    // Append the iframe to the target div
    targetDiv.appendChild(iframe);
});
