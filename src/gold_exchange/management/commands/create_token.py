"""
Create the SPL token mint on Solana devnet.
"""
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import create_account, CreateAccountParams
from solders.transaction import Transaction
from solders.message import Message
from spl.token.constants import TOKEN_PROGRAM_ID, MINT_LEN
from spl.token.instructions import initialize_mint, InitializeMintParams
import base58


class Command(BaseCommand):
    help = 'Create the sGOLD SPL token mint on Solana devnet'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("="*60))
        self.stdout.write(self.style.WARNING("Creating sGOLD Token Mint on Solana Devnet"))
        self.stdout.write(self.style.WARNING("="*60 + "\n"))

        # Load mint authority from env
        mint_authority_key = settings.MINT_AUTHORITY_KEYPAIR
        if not mint_authority_key:
            raise CommandError("MINT_AUTHORITY_KEYPAIR not set in .env")

        try:
            mint_authority = Keypair.from_bytes(base58.b58decode(mint_authority_key))
            self.stdout.write(f"✓ Mint Authority: {mint_authority.pubkey()}")
        except Exception as e:
            raise CommandError(f"Invalid keypair: {e}")

        # Connect to Solana
        client = Client(settings.SOLANA_RPC_URL, commitment=Confirmed)
        self.stdout.write(f"✓ Connected to: {settings.SOLANA_RPC_URL}")

        # Check mint authority balance
        balance_info = client.get_balance(mint_authority.pubkey())
        balance_sol = balance_info.value / 1_000_000_000
        self.stdout.write(f"✓ Mint Authority Balance: {balance_sol} SOL\n")

        if balance_sol < 0.01:
            raise CommandError("Insufficient balance. Need at least 0.01 SOL.")

        # Create a new keypair for the mint account
        mint = Keypair()
        self.stdout.write(f"Step 1: Generated Mint Keypair")
        self.stdout.write(f"  Mint Address: {mint.pubkey()}\n")

        # Get rent exemption amount for mint account
        rent_exemption = client.get_minimum_balance_for_rent_exemption(MINT_LEN).value
        self.stdout.write(f"Step 2: Calculated rent exemption: {rent_exemption / 1_000_000_000} SOL\n")

        try:
            # Get recent blockhash
            recent_blockhash_resp = client.get_latest_blockhash()
            recent_blockhash = recent_blockhash_resp.value.blockhash

            # Create instructions
            instructions = [
                # 1. Create account for mint
                create_account(
                    CreateAccountParams(
                        from_pubkey=mint_authority.pubkey(),
                        to_pubkey=mint.pubkey(),
                        lamports=rent_exemption,
                        space=MINT_LEN,
                        owner=TOKEN_PROGRAM_ID,
                    )
                ),
                # 2. Initialize mint
                initialize_mint(
                    InitializeMintParams(
                        program_id=TOKEN_PROGRAM_ID,
                        mint=mint.pubkey(),
                        decimals=2,  # 2 decimals for cents (e.g., 10.00 = $10)
                        mint_authority=mint_authority.pubkey(),
                        freeze_authority=None,  # No freeze authority for simplicity
                    )
                ),
            ]

            self.stdout.write("Step 3: Creating transaction...\n")

            # Build and sign transaction
            message = Message.new_with_blockhash(
                instructions,
                mint_authority.pubkey(),
                recent_blockhash
            )
            transaction = Transaction([mint_authority, mint], message, recent_blockhash)

            # Send transaction
            self.stdout.write("Step 4: Sending transaction to Solana devnet...")
            tx_bytes = bytes(transaction)
            result = client.send_raw_transaction(tx_bytes)
            tx_signature = str(result.value)

            self.stdout.write(self.style.SUCCESS(f"\n✅ Token mint created successfully!"))
            self.stdout.write(f"   Transaction: {tx_signature}")
            self.stdout.write(f"   Mint Address: {mint.pubkey()}\n")

            self.stdout.write(self.style.SUCCESS("="*60))
            self.stdout.write(self.style.SUCCESS("UPDATE YOUR .ENV FILE"))
            self.stdout.write(self.style.SUCCESS("="*60))
            self.stdout.write(f"\nReplace this line in your .env:")
            self.stdout.write(f"  SGOLD_MINT_ADDRESS=8NAyFkqGSwZ8EA72oKw6gkRfg1gA2aY2gdTPHJgahZWY")
            self.stdout.write(f"\nWith this:")
            self.stdout.write(self.style.SUCCESS(f"  SGOLD_MINT_ADDRESS={mint.pubkey()}"))
            self.stdout.write(f"\nThen restart: docker-compose restart web\n")

            self.stdout.write(f"\nView on Solana Explorer:")
            self.stdout.write(f"  https://explorer.solana.com/address/{mint.pubkey()}?cluster=devnet\n")

        except Exception as e:
            raise CommandError(f"Failed to create token mint: {e}")
