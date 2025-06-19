from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.totp_service import TOTPService
from typing import List, Optional
from pydantic import BaseModel
import logging
import uvicorn
from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError, JWTClaimsError
import os
import traceback
import time
import requests # Necesario para el Plan B

# Configuración y lógica de inicialización (sin cambios)
# ... (código existente)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
app = FastAPI(title="TOTP Manager API", version="1.0.0")
totp_service: Optional[TOTPService] = None
service_initialization_error: Optional[Exception] = None
def initialize_totp_service():
    global totp_service, service_initialization_error
    try:
        totp_service = TOTPService()
        logger.info("✅ TOTPService initialized successfully.")
        service_initialization_error = None
    except Exception as e:
        logger.critical(f"❌ CRITICAL: Failed to initialize TOTPService. Error: {e}", exc_info=True)
        service_initialization_error = e
@app.on_event("startup")
def on_startup():
    initialize_totp_service()
def get_totp_service() -> TOTPService:
    if not totp_service or service_initialization_error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"The TOTP service is currently unavailable. Error: {service_initialization_error}"
        )
    return totp_service
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
security = HTTPBearer()
# ... (fin del código sin cambios)


# --- INICIO DE LA MODIFICACIÓN (PLAN B) ---
async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    auth0_domain = os.getenv('VITE_AUTH0_DOMAIN')
    api_audience = os.getenv('VITE_AUTH0_AUDIENCE')
    
    if not auth0_domain or not api_audience:
        raise HTTPException(status_code=500, detail="Auth0 configuration missing on server.")

    jwks_url = f"https://{auth0_domain}/.well-known/jwks.json"

    try:
        # Obtener las claves públicas de Auth0
        jwks_response = requests.get(jwks_url)
        jwks_response.raise_for_status()
        jwks = jwks_response.json()

        # Obtener la cabecera del token para encontrar el 'kid' (Key ID)
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")

        # Decodificar y validar el token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=api_audience,
            issuer=f"https://{auth0_domain}/"
        )
        logger.info(f"Authenticated user_id (sub): {payload.get('sub')}")
        return payload

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTClaimsError as e:
        raise HTTPException(status_code=401, detail=f"Invalid claims: {e}")
    except JWTError as e:
        logger.error(f"JWT validation error: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch JWKS: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch authentication keys")
    except Exception as e:
        logger.error(f"Authentication error: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# --- FIN DE LA MODIFICACIÓN ---


# El resto de los endpoints no necesitan cambios
class TOTPCreateRequest(BaseModel):
    name: str
    secret: str

@app.get("/health")
async def health_check():
    if not totp_service:
        return {"status": "degraded", "service": "TOTPService not initialized"}
    return {"status": "ok"}

@app.get("/totp", response_model=List[dict])
async def get_all_totps(user=Depends(get_current_user), service: TOTPService = Depends(get_totp_service)):
    user_id = user["sub"]
    return service.get_all_totps(user_id)

@app.post("/totp", status_code=status.HTTP_201_CREATED)
async def create_totp(request: TOTPCreateRequest, user=Depends(get_current_user), service: TOTPService = Depends(get_totp_service)):
    user_id = user["sub"]
    success = service.create_totp(user_id, request.name, request.secret)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create TOTP entry.")
    return {"message": "TOTP created successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info", reload=True)