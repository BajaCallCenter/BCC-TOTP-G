import pyotp
import hvac
import os
import time
from dotenv import load_dotenv
import logging
import re
from typing import Optional, List, Dict
from fastapi import HTTPException, status
import urllib3
import requests
from pathlib import Path

# Configuración de logging y carga de .env (sin cambios)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
project_root = Path(__file__).resolve().parents[3]
dotenv_path = project_root / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
else:
    logger.critical(f"CRITICAL: .env file not found at expected path: {dotenv_path}")


class TOTPService:
    def __init__(self):
        """
        Initializes the TOTPService.
        """
        # --- INICIO DE LA MODIFICACIÓN ---
        # Define la ruta del motor de secretos como una variable de instancia.
        # Cambia este valor si necesitas apuntar a otro motor (dev, test, etc.)
        self.mount_point = "prod_totp_secrets"
        # --- FIN DE LA MODIFICACIÓN ---

        self.vault_client = self._initialize_vault_client()

    def _initialize_vault_client(self) -> hvac.Client:
        vault_url = os.getenv("VAULT_ADDR")
        vault_token = os.getenv("VAULT_TOKEN")

        if not vault_url or not vault_token:
            logger.critical("CRITICAL: VAULT_ADDR and VAULT_TOKEN were not loaded from environment variables.")
            raise ValueError("VAULT_ADDR and VAULT_TOKEN must be set.")

        logger.info(f"Attempting to connect to Vault at: {vault_url}")
        verify_ssl = not os.getenv("VAULT_SKIP_VERIFY", "false").lower() == "true"
        if not verify_ssl:
            logger.info("Vault SSL certificate verification is ENABLED.")
        else:
            logger.warning("Vault SSL certificate verification is DISABLED. This is not recommended for production.")
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        try:
            client = hvac.Client(url=vault_url, token=vault_token, verify=verify_ssl, timeout=20)
            if not client.is_authenticated():
                raise ConnectionError("Vault authentication failed. The provided VAULT_TOKEN is invalid, expired, or lacks permissions.")
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Network connection to Vault ({vault_url}) failed.") from e
        except hvac.exceptions.VaultError as e:
            raise ConnectionError(f"An error occurred with the Vault request: {e}") from e
        
        logger.info("Successfully authenticated with Vault.")
        try:
            secrets_engines = client.sys.list_mounted_secrets_engines()
            # Usa la nueva variable de la ruta
            if f'{self.mount_point}/' not in secrets_engines.get('data', {}):
                logger.info(f"Enabling KV v2 secrets engine at path '{self.mount_point}'")
                client.sys.enable_secrets_engine(
                    backend_type='kv', path=self.mount_point, options={'version': '2'}
                )
            logger.info(f"KV engine '{self.mount_point}' is enabled and ready.")
            return client
        except Exception as e:
            raise ConnectionError(f"Failed to setup KV engine: {str(e)}") from e

    def _validate_secret(self, secret: str) -> bool:
        try:
            if not re.match(r'^[A-Z2-7=]+$', secret.upper()): return False
            if len(secret) < 16: return False
            pyotp.TOTP(secret).now()
            return True
        except Exception:
            return False

    def get_totp(self, user_id: str, totp_name: str) -> Optional[Dict]:
        try:
            read_response = self.vault_client.secrets.kv.v2.read_secret_version(
                path=f"{user_id}/{totp_name}", 
                mount_point=self.mount_point # Usa la nueva variable
            )
            secret_data = read_response.get('data', {}).get('data', {})
            if not secret_data or 'totp_secret' not in secret_data: return None
            totp_secret = secret_data['totp_secret']
            totp = pyotp.TOTP(totp_secret)
            return {'name': totp_name, 'otp': totp.now(), 'time_remaining': totp.interval - (int(time.time()) % totp.interval)}
        except hvac.exceptions.InvalidPath:
            return None
        except Exception as e:
            logger.error(f"Error getting TOTP: {str(e)}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error retrieving TOTP: {str(e)}")

    def get_all_totps(self, user_id: str) -> List[Dict]:
        try:
            list_response = self.vault_client.secrets.kv.v2.list_secrets(
                path=user_id, 
                mount_point=self.mount_point # Usa la nueva variable
            )
            totp_names = list_response.get('data', {}).get('keys', [])
            if not totp_names: return []
            totps = [self.get_totp(user_id, name) for name in totp_names if name and not name.endswith('/')]
            valid_totps = [totp for totp in totps if totp is not None]
            return valid_totps
        except hvac.exceptions.InvalidPath:
            return []
        except Exception as e:
            logger.error(f"Error getting all TOTPs: {str(e)}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error retrieving TOTPs: {str(e)}")

    def create_totp(self, user_id: str, totp_name: str, totp_secret: str) -> bool:
        clean_secret = re.sub(r'[^A-Z2-7=]', '', totp_secret.upper())
        if not (1 <= len(totp_name.strip()) <= 50):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP name must be between 1 and 50 characters")
        if not self._validate_secret(clean_secret):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP secret format. Must be a valid Base32 string.")
        try:
            logger.info(f"Creating Vault secret at mount point '{self.mount_point}' with path: {user_id}/{totp_name.strip()}")
            self.vault_client.secrets.kv.v2.create_or_update_secret(
                path=f"{user_id}/{totp_name.strip()}", 
                secret={"totp_secret": clean_secret}, 
                mount_point=self.mount_point # Usa la nueva variable
            )
            return True
        except Exception as e:
            logger.error(f"Error creating TOTP in Vault: {str(e)}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error creating TOTP in Vault: {str(e)}")