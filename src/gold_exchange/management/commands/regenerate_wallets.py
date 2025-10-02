"""
Regenerate all system wallets with keypairs saved.
This will create NEW wallets - any SOL in old wallets will be lost.
"""
from django.core.management.base import BaseCommand
from solders.keypair import Keypair
import base58


class Command(BaseCommand):
    help = 'Regenerate all system wallets with keypairs saved to .env'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("REGENERATING SYSTEM WALLETS")
        self.stdout.write("=" * 60)
        self.stdout.write("")

        self.stdout.write(self.style.WARNING(
            "⚠️  WARNING: This will generate NEW wallets!"
        ))
        self.stdout.write(self.style.WARNING(
            "   Any SOL in the old wallets will be LOST."
        ))
        self.stdout.write("")

        # Generate keypairs
        self.stdout.write("Generating keypairs...")
        mint_authority = Keypair()
        treasury = Keypair()
        dev_fund = Keypair()
        liquidity = Keypair()

        # Convert to base58
        mint_authority_keypair = base58.b58encode(bytes(mint_authority)).decode('utf-8')
        treasury_keypair = base58.b58encode(bytes(treasury)).decode('utf-8')
        dev_fund_keypair = base58.b58encode(bytes(dev_fund)).decode('utf-8')
        liquidity_keypair = base58.b58encode(bytes(liquidity)).decode('utf-8')

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("✅ Keypairs generated!"))
        self.stdout.write("")
        self.stdout.write("=" * 60)
        self.stdout.write("ADD THESE TO YOUR .env FILE:")
        self.stdout.write("=" * 60)
        self.stdout.write("")
        self.stdout.write(f"# Wallet Keypairs (KEEP THESE SECRET!)")
        self.stdout.write(f"MINT_AUTHORITY_KEYPAIR={mint_authority_keypair}")
        self.stdout.write(f"TREASURY_KEYPAIR={treasury_keypair}")
        self.stdout.write(f"DEV_FUND_KEYPAIR={dev_fund_keypair}")
        self.stdout.write(f"LIQUIDITY_KEYPAIR={liquidity_keypair}")
        self.stdout.write("")
        self.stdout.write(f"# Wallet Public Addresses")
        self.stdout.write(f"TREASURY_WALLET={treasury.pubkey()}")
        self.stdout.write(f"DEV_FUND_WALLET={dev_fund.pubkey()}")
        self.stdout.write(f"LIQUIDITY_WALLET={liquidity.pubkey()}")
        self.stdout.write("")
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.WARNING("IMPORTANT NEXT STEPS:"))
        self.stdout.write("=" * 60)
        self.stdout.write("")
        self.stdout.write("1. Copy the values above to your .env file")
        self.stdout.write("2. Restart Docker: docker-compose down && docker-compose up -d")
        self.stdout.write("3. Fund mint authority: " + str(mint_authority.pubkey()))
        self.stdout.write("   Get devnet SOL: https://faucet.solana.com/")
        self.stdout.write("4. Create new token: docker-compose exec web python manage.py create_token")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("✅ Wallet regeneration complete!"))
