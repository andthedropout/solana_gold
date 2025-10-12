"""
Solana token service for gold exchange operations.
Handles SPL token minting, burning, and transaction creation.
"""
import base64
import logging
from decimal import Decimal
from typing import Dict, Optional, Tuple

from django.conf import settings
from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction as SoldersTransaction
from solders.system_program import transfer, TransferParams
from solders.message import Message
from solders.signature import Signature
from solana.transaction import Transaction as LegacyTransaction
from spl.token.constants import TOKEN_PROGRAM_ID
from spl.token.instructions import (
    get_associated_token_address,
    create_associated_token_account,
    mint_to,
    MintToParams,
    burn,
    BurnParams,
)

logger = logging.getLogger(__name__)


class GoldTokenService:
    """
    Service class for interacting with Solana blockchain for gold token operations.
    """

    def __init__(self):
        self.client = Client(settings.SOLANA_RPC_URL, commitment=Confirmed)
        self.mint_address = Pubkey.from_string(settings.SGOLD_MINT_ADDRESS)
        self.mint_authority = self._load_mint_authority()

        # System wallets
        self.treasury_wallet = Pubkey.from_string(settings.TREASURY_WALLET)
        self.dev_fund_wallet = Pubkey.from_string(settings.DEV_FUND_WALLET)
        self.liquidity_wallet = Pubkey.from_string(settings.LIQUIDITY_WALLET)
        self.profit_wallet = Pubkey.from_string(settings.PROFIT_WALLET)
        self.transaction_fee_wallet = Pubkey.from_string(settings.TRANSACTION_FEE_WALLET)

    def _load_mint_authority(self) -> Keypair:
        """Load mint authority keypair from settings"""
        try:
            # Decode base58 private key from settings
            import base58
            private_key_bytes = base58.b58decode(settings.MINT_AUTHORITY_KEYPAIR)
            return Keypair.from_bytes(private_key_bytes)
        except Exception as e:
            logger.error(f"Failed to load mint authority keypair: {e}")
            raise

    def calculate_token_amount(
        self, sol_amount: Decimal, gold_price_usd: Decimal, sol_price_usd: Decimal
    ) -> Decimal:
        """
        Calculate sGOLD token amount from SOL amount.

        Args:
            sol_amount: Amount of SOL
            gold_price_usd: Current gold price per troy ounce in USD
            sol_price_usd: Current SOL price in USD

        Returns:
            Token amount (100 units = $10.00 worth of gold)
        """
        # Convert SOL to USD
        usd_value = sol_amount * sol_price_usd

        # Calculate how much gold in troy ounces
        gold_ounces = usd_value / gold_price_usd

        # Convert to $10 units (1 token = $10 of gold)
        token_amount = gold_ounces * gold_price_usd / Decimal('10')

        return token_amount.quantize(Decimal('0.01'))

    def calculate_sol_amount(
        self, token_amount: Decimal, gold_price_usd: Decimal, sol_price_usd: Decimal
    ) -> Decimal:
        """
        Calculate SOL amount from sGOLD token amount.

        Args:
            token_amount: Amount of sGOLD tokens
            gold_price_usd: Current gold price per troy ounce in USD
            sol_price_usd: Current SOL price in USD

        Returns:
            SOL amount
        """
        # Convert tokens to USD ($10 per token unit)
        usd_value = token_amount * Decimal('10')

        # Convert USD to SOL
        sol_amount = usd_value / sol_price_usd

        return sol_amount.quantize(Decimal('0.000000001'))

    def calculate_fees(
        self, sol_amount: Decimal, transaction_type: str
    ) -> Tuple[Decimal, Decimal, Decimal, Decimal]:
        """
        Calculate fees for a transaction.

        Args:
            sol_amount: Amount of SOL
            transaction_type: 'buy' or 'sell'

        Returns:
            Tuple of (treasury_fee, profit_fee, transaction_fee, liquidity_amount)
        """
        # Fee structure: 84% liquidity, 8% treasury, 8% profit, 0.24% transaction
        liquidity_rate = Decimal('0.84')
        treasury_rate = Decimal('0.08')
        profit_rate = Decimal('0.08')
        transaction_rate = Decimal('0.0024')

        liquidity_amount = (sol_amount * liquidity_rate).quantize(Decimal('0.000000001'))
        treasury_fee = (sol_amount * treasury_rate).quantize(Decimal('0.000000001'))
        profit_fee = (sol_amount * profit_rate).quantize(Decimal('0.000000001'))
        transaction_fee = (sol_amount * transaction_rate).quantize(Decimal('0.000000001'))

        return treasury_fee, profit_fee, transaction_fee, liquidity_amount

    def get_or_create_associated_token_account(
        self, owner: Pubkey
    ) -> Pubkey:
        """
        Get or create associated token account for user.

        Args:
            owner: User's wallet public key

        Returns:
            Associated token account address
        """
        ata = get_associated_token_address(owner, self.mint_address)

        # Check if ATA exists
        try:
            account_info = self.client.get_account_info(ata)
            if account_info.value is not None:
                return ata
        except Exception as e:
            logger.info(f"ATA does not exist for {owner}, will need to create: {e}")

        return ata

    def create_buy_transaction_instructions(
        self,
        user_pubkey: Pubkey,
        sol_amount: Decimal,
        treasury_fee: Decimal,
        profit_fee: Decimal,
        transaction_fee: Decimal,
        liquidity_amount: Decimal,
    ) -> list:
        """
        Create instructions for buy transaction.
        User sends SOL to liquidity/treasury/profit/transaction_fee wallets.
        Backend will mint tokens separately after verification.

        Returns:
            List of transaction instructions
        """
        instructions = []

        # Convert Decimal to lamports (1 SOL = 1e9 lamports)
        def to_lamports(sol: Decimal) -> int:
            return int(sol * Decimal('1000000000'))

        # Instruction 1: Transfer to liquidity pool (84%)
        if liquidity_amount > 0:
            instructions.append(
                transfer(
                    TransferParams(
                        from_pubkey=user_pubkey,
                        to_pubkey=self.liquidity_wallet,
                        lamports=to_lamports(liquidity_amount)
                    )
                )
            )

        # Instruction 2: Transfer to treasury (8%)
        if treasury_fee > 0:
            instructions.append(
                transfer(
                    TransferParams(
                        from_pubkey=user_pubkey,
                        to_pubkey=self.treasury_wallet,
                        lamports=to_lamports(treasury_fee)
                    )
                )
            )

        # Instruction 3: Transfer to profit wallet (8%)
        if profit_fee > 0:
            instructions.append(
                transfer(
                    TransferParams(
                        from_pubkey=user_pubkey,
                        to_pubkey=self.profit_wallet,
                        lamports=to_lamports(profit_fee)
                    )
                )
            )

        # Instruction 4: Transfer to transaction fee wallet (0.24%)
        if transaction_fee > 0:
            instructions.append(
                transfer(
                    TransferParams(
                        from_pubkey=user_pubkey,
                        to_pubkey=self.transaction_fee_wallet,
                        lamports=to_lamports(transaction_fee)
                    )
                )
            )

        return instructions

    def mint_tokens_to_user(
        self,
        user_pubkey: Pubkey,
        token_amount: Decimal,
    ) -> str:
        """
        Mint sGOLD tokens to user's associated token account.
        This is called by backend after verifying SOL payment.

        Args:
            user_pubkey: User's wallet public key
            token_amount: Amount of tokens to mint (in token units, e.g., 100.00)

        Returns:
            Transaction signature
        """
        # Get or create user's ATA
        user_ata = self.get_or_create_associated_token_account(user_pubkey)

        # Convert token amount to base units (2 decimals)
        token_base_units = int(token_amount * Decimal('100'))

        # Check if ATA exists, create if not
        ata_exists = False
        try:
            account_info = self.client.get_account_info(user_ata)
            ata_exists = account_info.value is not None
        except:
            pass

        instructions = []

        # Add create ATA instruction if needed
        if not ata_exists:
            instructions.append(
                create_associated_token_account(
                    payer=self.mint_authority.pubkey(),
                    owner=user_pubkey,
                    mint=self.mint_address
                )
            )

        # Add mint instruction
        instructions.append(
            mint_to(
                MintToParams(
                    program_id=TOKEN_PROGRAM_ID,
                    mint=self.mint_address,
                    dest=user_ata,
                    mint_authority=self.mint_authority.pubkey(),
                    amount=token_base_units,
                    signers=[self.mint_authority.pubkey()]
                )
            )
        )

        # Get recent blockhash
        recent_blockhash = self.client.get_latest_blockhash().value.blockhash

        # Create legacy transaction for minting (required by send_transaction)
        transaction = LegacyTransaction(
            recent_blockhash=recent_blockhash,
            fee_payer=self.mint_authority.pubkey()
        )

        # Add all instructions
        for instruction in instructions:
            transaction.add(instruction)

        # Send transaction with mint authority as signer
        result = self.client.send_transaction(transaction, self.mint_authority)
        tx_signature = str(result.value)

        logger.info(f"Minted {token_amount} sGOLD to {user_pubkey}: {tx_signature}")

        return tx_signature

    def verify_sol_payment(self, tx_signature: str, expected_amount: Decimal) -> bool:
        """
        Verify that SOL payment was received on-chain.

        Args:
            tx_signature: Transaction signature to verify
            expected_amount: Expected SOL amount

        Returns:
            True if payment is verified
        """
        try:
            # Convert string signature to Signature object
            sig = Signature.from_string(tx_signature)

            # Get transaction details
            tx_info = self.client.get_transaction(
                sig,
                encoding="json",
                max_supported_transaction_version=0
            )

            if not tx_info.value:
                logger.warning(f"Transaction not found: {tx_signature}")
                return False

            # Verify transaction succeeded
            if tx_info.value.transaction.meta.err is not None:
                logger.warning(f"Transaction failed: {tx_signature}")
                return False

            # TODO: Add more detailed verification of transfers to correct wallets

            return True

        except Exception as e:
            logger.error(f"Error verifying transaction {tx_signature}: {e}")
            return False

    def get_token_balance(self, user_pubkey: Pubkey) -> Decimal:
        """
        Get user's sGOLD token balance.

        Args:
            user_pubkey: User's wallet public key

        Returns:
            Token balance in display units (e.g., 100.00)
        """
        try:
            ata = self.get_or_create_associated_token_account(user_pubkey)
            logger.info(f"Getting balance for ATA: {ata}")
            balance_info = self.client.get_token_account_balance(ata)
            logger.info(f"Balance info: {balance_info}")

            if balance_info.value:
                ui_amount = Decimal(balance_info.value.ui_amount or 0)
                logger.info(f"Token balance for {user_pubkey}: {ui_amount}")
                return ui_amount

            logger.warning(f"No balance info value for {user_pubkey}")
            return Decimal('0')

        except Exception as e:
            logger.error(f"Error getting token balance for {user_pubkey}: {e}", exc_info=True)
            return Decimal('0')
