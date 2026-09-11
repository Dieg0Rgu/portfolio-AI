import os
import asyncio
from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

async def test():
    key = os.getenv("GROQ_API_KEY")
    client = AsyncGroq(api_key=key)
    chat = await client.chat.completions.create(
        messages=[{"role": "user", "content": "ping"}],
        model="openai/gpt-oss-20b",
    )
    print("Respuesta de Groq:", chat.choices[0].message.content)

asyncio.run(test())