import logging
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Логируем входящий запрос
        start_time = time.time()
        
        logger.info(f"→ {request.method} {request.url.path}")
        if request.url.query:
            logger.info(f"  Query params: {request.url.query}")
        
        # Пропускаем запрос дальше
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            logger.info(f"← {request.method} {request.url.path} - {response.status_code} - {process_time:.2f}s")
            
            return response
        except Exception as e:
            logger.error(f"Ошибка обработки запроса {request.method} {request.url.path}: {e}")
            raise