import aiohttp
import asyncio

async def gpt_generate_response(prompt):
    api_key = "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"
    url = "https://api.openai.com/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "gpt-4o-mini",  # Hier das Modell ändern
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 40
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data, headers=headers) as response:
            print(f"Response status: {response.status}")
            try:
                # Versuche, die JSON-Antwort zu erhalten 
                response_json = response.json()  # Korrektur:
                print("Response JSON:", response_json)  # Ausgabe der vollständigen JSON-Antwort

                # Zugriff auf die Antwort des Modells
                response_text = response_json["choices"][0]["message"]["content"].strip()
                return response_text
            except Exception as e:
                print(f"Error processing response: {e}")
                return None  # Gib None zurück, falls ein Fehler auftritt

async def update_gpt_response(prompt):
    response_text = gpt_generate_response(prompt)  
    if response_text is not None:
        # Verwende async_add_job, um den Status außerhalb des Event Loops zu setzen
        hass.async_add_job(hass.states.set, "input_text.gpt_response", response_text)
    else:
        print("No response received from GPT-4o-mini.")


@service
async def generate_response(prompt=None):
    if prompt is not None:
        await update_gpt_response(prompt)