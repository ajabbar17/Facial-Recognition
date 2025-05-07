import asyncpg
from fastapi import FastAPI

DATABASE_URL = "postgresql://postgres:1234@localhost:5432/faceRecognition"

async def connect_to_db(app: FastAPI):
    app.state.pool = await asyncpg.create_pool(dsn=DATABASE_URL)
    print("Connected to the database")

async def disconnect_from_db(app: FastAPI):
    await app.state.pool.close()
    print("Disconnected from the database")

def get_db(app: FastAPI):
    return app.state.pool
