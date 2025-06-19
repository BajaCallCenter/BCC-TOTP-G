import os
import hvac
from dotenv import load_dotenv
import logging
from typing import Optional
import ssl

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def get_vault_client() -> Optional[hvac.Client]:
    """
    Configure and return an authenticated Vault client with KV secrets engine enabled.
    
    Returns:
        Optional[hvac.Client]: Authenticated Vault client or None if initialization fails
    """
    try:
        vault_addr = os.getenv("VAULT_ADDR")
        vault_token = os.getenv("VAULT_TOKEN")
        
        if not vault_addr or not vault_token:
            logger.error("VAULT_ADDR and VAULT_TOKEN must be set in environment variables")
            return None

        logger.info(f"Initializing Vault connection to: {vault_addr}")
        
        # Create custom SSL context to handle potential certificate issues
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Initialize client with connection timeout and custom SSL context
        client = hvac.Client(
            url=vault_addr,
            token=vault_token,
            timeout=30,
            verify=ssl_context  # Use our custom SSL context
        )
        
        # Verify authentication
        if not client.is_authenticated():
            logger.error("Vault authentication failed. Invalid or expired token")
            return None

        logger.info("Successfully authenticated with Vault")
        
        # Check server health
        try:
            health = client.sys.read_health_status(method='GET')
            if not health or not health.get('initialized'):
                logger.error("Vault server is not initialized")
                return None
            if health.get('sealed'):
                logger.error("Vault server is sealed")
                return None
        except Exception as e:
            logger.error(f"Failed to check Vault health status: {str(e)}")
            return None

        return client

    except hvac.exceptions.VaultDown as e:
        logger.error(f"Vault server is down or unreachable: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error initializing Vault client: {str(e)}", exc_info=True)
        return None