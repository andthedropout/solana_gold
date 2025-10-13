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
        # Liquidity wallet is the same as mint authority (combined for devnet simplicity)
        self.liquidity_wallet = self.mint_authority.pubkey()
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

        Formula: $12.50 → 1 token worth $10 of gold
        tokens = (total_usd / 12.5)

        Args:
            sol_amount: Amount of SOL
            gold_price_usd: Current gold price per troy ounce in USD (unused but kept for compatibility)
            sol_price_usd: Current SOL price in USD

        Returns:
            Token amount where 1 token = $10 worth of gold
        """
        # Convert SOL to USD
        total_usd = sol_amount * sol_price_usd

        # For every $12.50 spent, user gets 1 token representing $10 of gold
        token_amount = total_usd / Decimal('12.5')

        return token_amount.quantize(Decimal('0.01'))

    def calculate_sol_amount(
        self, token_amount: Decimal, gold_price_usd: Decimal, sol_price_usd: Decimal
    ) -> Decimal:
        """
        Calculate SOL amount from sGOLD token amount.

        Formula: 1 token → $10 in SOL
        (When buying: pay $12.50, get 1 token worth $10)
        (When selling: sell 1 token worth $10, receive $10)

        Args:
            token_amount: Amount of sGOLD tokens
            gold_price_usd: Current gold price per troy ounce in USD (unused but kept for compatibility)
            sol_price_usd: Current SOL price in USD

        Returns:
            SOL amount
        """
        # Convert tokens to USD ($10 per token - the actual gold value)
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
        # Fee structure: 83.76% liquidity, 8% treasury, 8% profit, 0.24% transaction = 100%
        liquidity_rate = Decimal('0.8376')
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

    def create_sell_transaction_instructions(
        self,
        user_pubkey: Pubkey,
        token_amount: Decimal,
        sol_payout: Decimal,
    ) -> list:
        """
        Create instructions for sell transaction.
        User burns SOLGOLD tokens and receives SOL from liquidity wallet.

        Args:
            user_pubkey: User's wallet public key
            token_amount: Amount of SOLGOLD tokens to burn
            sol_payout: Amount of SOL to send to user

        Returns:
            List of transaction instructions
        """
        instructions = []

        # Get user's ATA
        user_ata = self.get_or_create_associated_token_account(user_pubkey)

        # Convert token amount to base units (2 decimals)
        token_base_units = int(token_amount * Decimal('100'))

        # Instruction 1: Burn tokens from user's ATA
        instructions.append(
            burn(
                BurnParams(
                    program_id=TOKEN_PROGRAM_ID,
                    account=user_ata,
                    mint=self.mint_address,
                    owner=user_pubkey,
                    amount=token_base_units,
                    signers=[user_pubkey]
                )
            )
        )

        # Instruction 2: Transfer SOL from liquidity wallet to user
        # This will be signed by the backend's liquidity wallet (mint authority)
        def to_lamports(sol: Decimal) -> int:
            return int(sol * Decimal('1000000000'))

        if sol_payout > 0:
            instructions.append(
                transfer(
                    TransferParams(
                        from_pubkey=self.liquidity_wallet,
                        to_pubkey=user_pubkey,
                        lamports=to_lamports(sol_payout)
                    )
                )
            )

        return instructions

    def burn_tokens_from_user(
        self,
        user_pubkey: Pubkey,
        token_amount: Decimal,
    ) -> str:
        """
        Burn sGOLD tokens from user's associated token account.
        NOTE: This requires the user to have already signed the burn instruction.
        This method is mainly for verification purposes.

        Args:
            user_pubkey: User's wallet public key
            token_amount: Amount of tokens to burn (in token units, e.g., 100.00)

        Returns:
            Transaction signature
        """
        # Get user's ATA
        user_ata = self.get_or_create_associated_token_account(user_pubkey)

        # Verify the user has sufficient balance
        current_balance = self.get_token_balance(user_pubkey)
        if current_balance < token_amount:
            raise ValueError(f"Insufficient token balance: {current_balance} < {token_amount}")

        logger.info(f"User {user_pubkey} burning {token_amount} sGOLD from {user_ata}")

        # NOTE: Actual burn happens in the sell transaction which user signs
        # This method is primarily for logging and validation
        return "burn_will_happen_in_user_signed_transaction"

    def verify_burn_transaction(self, tx_signature: str, expected_token_amount: Decimal) -> bool:
        """
        Verify that token burn was completed on-chain.

        Args:
            tx_signature: Transaction signature to verify
            expected_token_amount: Expected token amount burned

        Returns:
            True if burn is verified
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

            # TODO: Add more detailed verification of burn instruction

            return True

        except Exception as e:
            logger.error(f"Error verifying burn transaction {tx_signature}: {e}")
            return False
