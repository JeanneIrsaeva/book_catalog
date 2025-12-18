from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, SessionLocal
from models import Base, BookStatus
import routers
from routers import analytics
from middleware import LoggingMiddleware  

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Создание таблиц...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        from crud import get_book_statuses
        
        existing_statuses = get_book_statuses(db)
        if not existing_statuses:
            statuses = [
                BookStatus(name="В планах"),
                BookStatus(name="Читаю"),
                BookStatus(name="Прочитано")
            ]
            db.add_all(statuses)
            db.commit()
            print("Созданы предустановленные статусы книг")
    except Exception as e:
        print(f"Ошибка при создании статусов: {e}")
        db.rollback()
    finally:
        db.close()
    
    yield
    
    print("Приложение завершает работу...")

app = FastAPI(
    title="Каталогизатор персональной книжной коллекции",
    description="Программная система для учета личной библиотеки",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    # Отключаем OAuth2 в Swagger UI
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
    }
)

app.add_middleware(LoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routers.auth.router, prefix="/api")
app.include_router(routers.users.router, prefix="/api")
app.include_router(routers.authors.router, prefix="/api")
app.include_router(routers.genres.router, prefix="/api")
app.include_router(routers.publishers.router, prefix="/api")
app.include_router(routers.books.router, prefix="/api")
app.include_router(routers.reports.router, prefix="/api")
app.include_router(routers.statuses.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Добро пожаловать в Каталогизатор персональной книжной коллекции",
        "status": "ok",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)