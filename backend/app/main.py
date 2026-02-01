from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health_router, items_router, orders_router
from migrate import run_migrations

app = FastAPI(title="Backend Exercise API", version="1.0.0")

# Register routers
app.include_router(health_router)
app.include_router(items_router)
app.include_router(orders_router)

# CORS for local frontend dev (Next.js on 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def apply_migrations():
    if run_migrations is not None:
        try:
            run_migrations("upgrade")
        except Exception as e:
            print(f"Startup migration error: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
