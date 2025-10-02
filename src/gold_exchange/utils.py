"""
Utility functions for gold exchange.
"""
import logging
import requests
from decimal import Decimal
from typing import Tuple, Optional
from datetime import datetime
from django.core.cache import cache

logger = logging.getLogger(__name__)


class PriceOracle:
    """
    Fetches current gold and SOL prices from external APIs.
    Implements caching to reduce API calls.
    """

    CACHE_TIMEOUT = 60  # Cache prices for 60 seconds
    GOLD_CACHE_KEY = 'gold_price_usd'
    SOL_CACHE_KEY = 'sol_price_usd'

    @classmethod
    def get_gold_price(cls) -> Optional[Decimal]:
        """
        Get current gold price in USD per troy ounce.
        Uses multiple API fallbacks for reliability.
        """
        # Check cache first
        cached_price = cache.get(cls.GOLD_CACHE_KEY)
        if cached_price:
            return Decimal(str(cached_price))

        # Try multiple APIs
        apis = [
            {
                'url': 'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd',
                'extract': lambda data: data.get('pax-gold', {}).get('usd'),
            },
            {
                'url': 'https://api.metals.live/v1/spot/gold',
                'extract': lambda data: data.get('price') or data.get('bid') or data.get('ask'),
            },
        ]

        for api in apis:
            try:
                response = requests.get(api['url'], timeout=5)
                if response.ok:
                    data = response.json()
                    price = api['extract'](data)
                    if price and price > 0:
                        price_decimal = Decimal(str(price))
                        # Cache the price
                        cache.set(cls.GOLD_CACHE_KEY, float(price), cls.CACHE_TIMEOUT)
                        logger.info(f"Fetched gold price: ${price_decimal}")
                        return price_decimal
            except Exception as e:
                logger.warning(f"Failed to fetch gold price from {api['url']}: {e}")
                continue

        # Fallback to demo price
        logger.warning("Using fallback gold price")
        fallback_price = Decimal('2023.45')
        cache.set(cls.GOLD_CACHE_KEY, float(fallback_price), cls.CACHE_TIMEOUT)
        return fallback_price

    @classmethod
    def get_sol_price(cls) -> Optional[Decimal]:
        """
        Get current SOL price in USD.
        """
        # Check cache first
        cached_price = cache.get(cls.SOL_CACHE_KEY)
        if cached_price:
            return Decimal(str(cached_price))

        # Try CoinGecko API
        apis = [
            {
                'url': 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
                'extract': lambda data: data.get('solana', {}).get('usd'),
            },
        ]

        for api in apis:
            try:
                response = requests.get(api['url'], timeout=5)
                if response.ok:
                    data = response.json()
                    price = api['extract'](data)
                    if price and price > 0:
                        price_decimal = Decimal(str(price))
                        # Cache the price
                        cache.set(cls.SOL_CACHE_KEY, float(price), cls.CACHE_TIMEOUT)
                        logger.info(f"Fetched SOL price: ${price_decimal}")
                        return price_decimal
            except Exception as e:
                logger.warning(f"Failed to fetch SOL price from {api['url']}: {e}")
                continue

        # Fallback to demo price
        logger.warning("Using fallback SOL price")
        fallback_price = Decimal('20.00')
        cache.set(cls.SOL_CACHE_KEY, float(fallback_price), cls.CACHE_TIMEOUT)
        return fallback_price

    @classmethod
    def get_prices(cls) -> Tuple[Decimal, Decimal]:
        """
        Get both gold and SOL prices.

        Returns:
            Tuple of (gold_price_usd, sol_price_usd)
        """
        gold_price = cls.get_gold_price()
        sol_price = cls.get_sol_price()

        if not gold_price or not sol_price:
            raise Exception("Failed to fetch prices from oracle")

        return gold_price, sol_price


def generate_quote_id() -> str:
    """Generate a unique quote ID"""
    import uuid
    return str(uuid.uuid4())


def validate_solana_address(address: str) -> bool:
    """
    Validate that a string is a valid Solana address.

    Args:
        address: Address to validate

    Returns:
        True if valid, False otherwise
    """
    if not address or not isinstance(address, str):
        return False

    # Solana addresses are base58 and typically 32-44 characters
    if len(address) < 32 or len(address) > 44:
        return False

    # Try to decode as base58
    try:
        import base58
        decoded = base58.b58decode(address)
        # Solana public keys are 32 bytes
        return len(decoded) == 32
    except Exception:
        return False
