import requests
from bs4 import BeautifulSoup
from flask import Flask, render_template, request, jsonify
import json
import openai
import markdown
from dotenv import load_dotenv
import os

load_dotenv()
# Initialize OpenAI API client
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

# Load privacy score data
try:
    with open('privacy_scores.json') as f:
        privacy_data = json.load(f)
except FileNotFoundError:
    print("Error: privacy_scores.json file not found.")
    privacy_data = {}
except json.JSONDecodeError:
    print("Error: privacy_scores.json is not properly formatted.")
    privacy_data = {}


# Calculate privacy score
def calculate_privacy_score(selected_permissions):
    max_score = sum(permission_data.get('score', 0) for permission_data in privacy_data.values())
    user_score = 0
    tips = []

    for permission in selected_permissions:
        user_score += privacy_data.get(permission, {}).get('score', 0)
        tips.append(privacy_data.get(permission, {}).get('tip', "No tips available."))

    privacy_percentage = max(0, 100 - ((user_score / max_score) * 100))
    return round(privacy_percentage, 2), tips


# Extract permissions or data from a website
def extract_permissions_from_url(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')

        scripts = soup.find_all('script', text=True)
        permissions = []

        keywords = {
            'location': ['geo', 'location'],
            'contacts': ['contact', 'phonebook'],
            'marketing_cookies': ['marketing', 'advertising', 'tracking'],
            'analytics_cookies': ['analytics', 'google-analytics', 'performance']
        }

        for script in scripts:
            for key, values in keywords.items():
                if any(value in script.text.lower() for value in values):
                    permissions.append(key)

        return list(set(permissions))
    except requests.RequestException as e:
        print(f"Network error: {e}")
        return []
    except Exception as e:
        print(f"Unexpected error: {e}")
        return []


@app.route('/')
def index():
    return render_template('index.html', permissions=list(privacy_data.keys()))


@app.route('/calculate', methods=['POST'])
def calculate():
    selected_permissions = request.json.get('permissions', [])
    score, tips = calculate_privacy_score(selected_permissions)
    return jsonify({'score': score, 'tips': tips})


@app.route('/analyze-url', methods=['POST'])
def analyze_url():
    url = request.json.get('url')
    extracted_permissions = extract_permissions_from_url(url)
    score, tips = calculate_privacy_score(extracted_permissions)
    return jsonify({'score': score, 'permissions': extracted_permissions, 'tips': tips})


@app.route('/chat-bot', methods=['GET', 'POST'])
def chat_bot():
    chat_message = ''
    if request.method == 'POST':
        if 'openai_query' in request.form and request.form['openai_query']:
            user_query = request.form['openai_query']
            try:
                # OpenAI API call
                response = openai.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are an assistant to a data privacy application. Give me a maximum of 3 sentence response."},
                        {"role": "user", "content": user_query}
                    ]
                )
                response_text = response.choices[0].message.content
                return jsonify({'response': response_text})  # Return JSON response
            except Exception as e:
                return jsonify({'response': f"Error occurred while calling OpenAI: {str(e)}"})  # Handle errors as JSON
        return jsonify({'response': "No query provided."})
    return render_template('index.html')  # Handle GET requ




if __name__ == '__main__':
    app.run(debug=True)
