// Helper function to update the horizontal progress bar
function updateProgressBar(elementId, score) {
    const progressBarFill = document.getElementById(elementId);
    const percentage = Math.min(Math.max(score, 0), 100); // Ensure score is between 0 and 100

    progressBarFill.style.width = `${percentage}%`;

    if (percentage > 70) {
        progressBarFill.style.backgroundColor = "#27ae60"; // Green for above average
    } else {
        progressBarFill.style.backgroundColor = "#e74c3c"; // Red for below average
    }
}

// Helper function to extract and capitalize the domain name
function extractDomain(url) {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain.toUpperCase();
    } catch {
        return "UNKNOWN";
    }
}

// URL Form Submission
document.getElementById('url-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const url = document.getElementById('website-url').value;

    // Fetch analysis results from the backend
    const response = await fetch('/analyze-url', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
    });

    const data = await response.json();

    // Update the result section for URL analysis
    document.getElementById('url-name').innerText = extractDomain(url);
    document.getElementById('url-score-text').innerText = `${data.score}%`;
    updateProgressBar("url-progress-bar-fill", data.score);

    const urlTipsList = document.getElementById('url-tips-list');
    urlTipsList.innerHTML = ""; // Clear previous tips
    data.tips.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        urlTipsList.appendChild(li);
    });

    // Show the result section
    document.getElementById('url-result').style.display = "block";
});

// Manual Permissions Form Submission
document.getElementById('privacy-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const selectedPermissions = Array.from(
        document.querySelectorAll('input[name="permissions"]:checked')
    ).map(input => input.value);

    // Fetch manual scoring results from the backend
    const response = await fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions: selectedPermissions })
    });

    const data = await response.json();

    // Update the result section for manual scoring
    document.getElementById('manual-score-text').innerText = `${data.score}%`;
    updateProgressBar("manual-progress-bar-fill", data.score);

    const manualTipsList = document.getElementById('manual-tips-list');
    manualTipsList.innerHTML = ""; // Clear previous tips
    data.tips.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        manualTipsList.appendChild(li);
    });

    // Show the result section
    document.getElementById('manual-result').style.display = "block";
});

// JavaScript for Chat Modal
document.addEventListener('DOMContentLoaded', function () {
    const chatButton = document.getElementById('chat-button');
    const chatModal = document.getElementById('chat-modal');
    const closeChat = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatResponse = document.getElementById('chat-response');

    // Open chat modal
    chatButton.addEventListener('click', () => {
        chatModal.style.display = 'flex';
    });

    // Close chat modal
    closeChat.addEventListener('click', () => {
        chatModal.style.display = 'none';
    });

    // Close modal when clicking outside the content
    window.addEventListener('click', (event) => {
        if (event.target === chatModal) {
            chatModal.style.display = 'none';
        }
    });

    // Handle Chat Form Submission
    chatForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent default form submission

        const query = document.getElementById('openai-query').value;

        // Send chat query to the backend
        const response = await fetch('/chat-bot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                openai_query: query,
            }),
        });

        if (response.ok) {
            // Extract and display the chatbot's response
            const data = await response.json(); // Expecting JSON response
            chatResponse.innerHTML = `<p>${data.response}</p>`; // Update chat response section
        } else {
            chatResponse.innerHTML = "<p>There was an error processing your request.</p>";
        }
    });

});
