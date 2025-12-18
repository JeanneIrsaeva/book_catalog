from database import engine, Base
from models import *

Base.metadata.create_all(bind=engine)
print("Таблицы успешно созданы")