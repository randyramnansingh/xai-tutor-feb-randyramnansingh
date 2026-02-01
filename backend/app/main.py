from fastapi import FastAPI

from migrate import run_migrations

app = FastAPI(title="Backend Exercise API", version="1.0.0")

# Register routers
app.include_router(health_router)
app.include_router(items_router)

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
