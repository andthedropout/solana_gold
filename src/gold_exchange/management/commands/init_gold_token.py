"""
Management command to initialize the sGOLD token on Solana.
This is a one-time setup command.

Usage:
    python manage.py init_gold_token
"""
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from solana.rpc.api import Client
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from gold_exchange.models import SystemWallet
import base58


class Command(BaseCommand):
    help = 'Initialize sGOLD SPL token on Solana blockchain'

    def add_arguments(self, parser):
        parser.add_argument(
            '--network',
            type=str,
            default='devnet',
            choices=['devnet', 'mainnet-beta', 'testnet'],
            help='Solana network to use (default: devnet)',
        )
        parser.add_argument(
            '--decimals',
            type=int,
            default=2,
            help='Token decimals (default: 2 for cents)',
        )
        parser.add_argument(
            '--skip-wallets',
            action='store_true',
            help='Skip creating system wallet records in database',
        )

    def handle(self, *args, **options):
        network = options['network']
        decimals = options['decimals']
        skip_wallets = options['skip_wallets']

        self.stdout.write(self.style.WARNING(
            "\n" + "="*60 + "\n"
            "sGOLD Token Initialization\n"
            "="*60 + "\n"
        ))

        self.stdout.write(f"Network: {network}")
        self.stdout.write(f"Decimals: {decimals}\n")

        # Step 1: Generate keypairs
        self.stdout.write(self.style.HTTP_INFO("\nStep 1: Generating keypairs..."))

        mint_authority = Keypair()
        treasury = Keypair()
        dev_fund = Keypair()
        liquidity = Keypair()

        self.stdout.write(f"Mint Authority: {mint_authority.pubkey()}")
        self.stdout.write(f"Treasury: {treasury.pubkey()}")
        self.stdout.write(f"Dev Fund: {dev_fund.pubkey()}")
        self.stdout.write(f"Liquidity Pool: {liquidity.pubkey()}")

        # Step 2: Display instructions
        self.stdout.write(self.style.HTTP_INFO("\nStep 2: Fund the mint authority wallet"))
        self.stdout.write(
            "Please fund the mint authority wallet with SOL for transaction fees:"
        )
        self.stdout.write(
            f"  Address: {mint_authority.pubkey()}\n"
            f"  Required: ~0.1 SOL for devnet, more for mainnet\n"
        )

        if network == 'devnet':
            self.stdout.write(
                "  You can use the Solana faucet: https://faucet.solana.com/"
            )

        input("\nPress Enter after funding the wallet...")

        # Step 3: Connect to Solana
        self.stdout.write(self.style.HTTP_INFO("\nStep 3: Connecting to Solana..."))

        if network == 'devnet':
            rpc_url = "https://api.devnet.solana.com"
        elif network == 'mainnet-beta':
            rpc_url = "https://api.mainnet-beta.solana.com"
        else:
            rpc_url = f"https://api.{network}.solana.com"

        client = Client(rpc_url)

        # Check balance
        balance_result = client.get_balance(mint_authority.pubkey())
        balance_sol = balance_result.value / 1_000_000_000
        self.stdout.write(f"Mint authority balance: {balance_sol} SOL")

        if balance_sol < 0.01:
            raise CommandError(
                "Insufficient balance. Please fund the mint authority wallet."
            )

        # Step 4: Create token mint
        self.stdout.write(self.style.HTTP_INFO("\nStep 4: Creating SPL token mint..."))

        try:
            # Note: This is simplified. In production, you'd need to:
            # 1. Create the mint account
            # 2. Initialize it with spl-token
            # For now, we'll output instructions for manual creation

            self.stdout.write(self.style.WARNING(
                "\nNOTE: For MVP, you should create the token using Solana CLI:\n\n"
                f"1. Save the mint authority private key:\n"
                f"   {base58.b58encode(bytes(mint_authority)).decode()}\n\n"
                f"2. Create the token using CLI:\n"
                f"   spl-token create-token --decimals {decimals}\n\n"
                f"3. Save the mint address and update your .env file\n"
            ))

            # Step 5: Save wallet information
            if not skip_wallets:
                self.stdout.write(self.style.HTTP_INFO("\nStep 5: Saving wallet information..."))

                wallets = [
                    ('mint_authority', str(mint_authority.pubkey()), base58.b58encode(bytes(mint_authority)).decode()),
                    ('treasury', str(treasury.pubkey()), ''),
                    ('dev_fund', str(dev_fund.pubkey()), ''),
                    ('liquidity', str(liquidity.pubkey()), ''),
                ]

                for wallet_type, public_key, private_key in wallets:
                    wallet, created = SystemWallet.objects.update_or_create(
                        wallet_type=wallet_type,
                        defaults={
                            'public_key': public_key,
                            'encrypted_private_key': private_key if wallet_type == 'mint_authority' else '',
                            'is_active': True,
                        }
                    )
                    status = "Created" if created else "Updated"
                    self.stdout.write(f"  {status}: {wallet_type} - {public_key[:8]}...")

            # Step 6: Output environment variables
            self.stdout.write(self.style.SUCCESS("\n" + "="*60))
            self.stdout.write(self.style.SUCCESS("Setup Complete!"))
            self.stdout.write(self.style.SUCCESS("="*60 + "\n"))

            self.stdout.write("Add these to your .env file:\n")
            self.stdout.write(f"SOLANA_NETWORK={network}")
            self.stdout.write(f"SOLANA_RPC_URL={rpc_url}")
            self.stdout.write(f"SGOLD_MINT_ADDRESS=<your_mint_address_from_spl_token>")
            self.stdout.write(f"MINT_AUTHORITY_KEYPAIR={base58.b58encode(bytes(mint_authority)).decode()}")
            self.stdout.write(f"TREASURY_WALLET={treasury.pubkey()}")
            self.stdout.write(f"DEV_FUND_WALLET={dev_fund.pubkey()}")
            self.stdout.write(f"LIQUIDITY_WALLET={liquidity.pubkey()}")
            self.stdout.write(f"\n# Fee structure (basis points)")
            self.stdout.write(f"BUY_FEE_TREASURY=300")
            self.stdout.write(f"BUY_FEE_DEV=200")
            self.stdout.write(f"SELL_FEE_TREASURY=300")
            self.stdout.write(f"SELL_FEE_BURN=200")

            self.stdout.write("\n" + self.style.WARNING(
                "IMPORTANT: Keep the MINT_AUTHORITY_KEYPAIR secret and secure!"
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\nError: {e}"))
            raise CommandError(f"Failed to initialize token: {e}")
