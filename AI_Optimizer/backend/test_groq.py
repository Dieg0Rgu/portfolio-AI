import os
import asyncio
from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

async def test():
    key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ_API_KEY_1") or os.getenv("GROQ_API_KEY_2")
    if not key:
        print("Error: No se encontró ninguna GROQ_API_KEY en el entorno ni en .env")
        return
    client = AsyncGroq(api_key=key)
    chat = await client.chat.completions.create(
        messages=[{"role": "user", "content": "ping"}],
        model="openai/gpt-oss-20b",
    )
    print("Respuesta de Groq:", chat.choices[0].message.content)

asyncio.run(test())