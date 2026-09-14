import os
import asyncio
from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

async def list_models():
    key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ_API_KEY_1") or os.getenv("GROQ_API_KEY_2")
    if not key:
        print("Error: No se encontró ninguna GROQ_API_KEY en el entorno ni en .env")
        return
    client = AsyncGroq(api_key=key)
    try:
        models = await client.models.list()
        print("Modelos disponibles en tu cuenta:")
        for m in models.data:
            print(f"- {m.id}")
    except Exception as e:
        print(f"Error listando modelos: {e}")

asyncio.run(list_models())