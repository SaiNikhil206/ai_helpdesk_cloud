from fastapi import FastAPI
from contextlib import asynccontextmanager
from routes import chat,tickets,metrics,auth
from init_db import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    yield

app = FastAPI(lifespan=lifespan)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(tickets.router)
app.include_router(metrics.router)


