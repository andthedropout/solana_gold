"""
Django management command to create Metaplex token metadata for sGOLD token.
This makes the token display properly in wallets like Phantom.
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from solana.rpc.api import Client
from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solders.instruction import Instruction, AccountMeta
from solders.system_program import ID as SYSTEM_PROGRAM_ID
from solana.transaction import Transaction
import base58


class Command(BaseCommand):
    help = 'Create Metaplex metadata for sGOLD token'

    def handle(self, *args, **options):
        # Metaplex Token Metadata Program ID
        METADATA_PROGRAM_ID = Pubkey.from_string("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

        # Get mint address and authority
        mint_address = Pubkey.from_string(settings.SGOLD_MINT_ADDRESS)
        mint_authority = Keypair.from_bytes(base58.b58decode(settings.MINT_AUTHORITY_KEYPAIR))

        # Derive metadata PDA
        metadata_pda, bump = Pubkey.find_program_address(
            [b"metadata", bytes(METADATA_PROGRAM_ID), bytes(mint_address)],
            METADATA_PROGRAM_ID
        )

        self.stdout.write(f"Mint: {mint_address}")
        self.stdout.write(f"Metadata PDA: {metadata_pda}")

        # Check if metadata already exists
        client = Client(settings.SOLANA_RPC_URL)
        account_info = client.get_account_info(metadata_pda)

        if account_info.value:
            self.stdout.write(self.style.WARNING("Metadata already exists!"))
            return

        # Create metadata instruction data
        # Metaplex CreateMetadataAccountV3 instruction discriminator
        instruction_data = bytes([
            33,  # CreateMetadataAccountV3 discriminator
        ])

        # Add metadata struct
        # DataV2 {
        #   name: String (max 32 bytes)
        #   symbol: String (max 10 bytes)
        #   uri: String (max 200 bytes)
        #   seller_fee_basis_points: u16
        #   creators: Option<Vec<Creator>>
        #   collection: Option<Collection>
        #   uses: Option<Uses>
        # }

        name = "Solana Gold"
        symbol = "sGOLD"
        uri = "https://gold-token.example.com/metadata.json"  # TODO: Host actual metadata JSON

        # Encode strings with length prefix
        def encode_string(s: str, max_len: int) -> bytes:
            s_bytes = s.encode('utf-8')[:max_len]
            return len(s_bytes).to_bytes(4, 'little') + s_bytes

        metadata_data = b''
        metadata_data += encode_string(name, 32)
        metadata_data += encode_string(symbol, 10)
        metadata_data += encode_string(uri, 200)
        metadata_data += (0).to_bytes(2, 'little')  # seller_fee_basis_points = 0
        metadata_data += bytes([0])  # creators = None
        metadata_data += bytes([0])  # collection = None
        metadata_data += bytes([0])  # uses = None

        # Add to instruction data
        instruction_data += metadata_data

        # Add boolean flags
        instruction_data += bytes([1])  # is_mutable = true
        instruction_data += bytes([0])  # collection_details = None

        # Create instruction
        create_metadata_ix = Instruction(
            program_id=METADATA_PROGRAM_ID,
            accounts=[
                AccountMeta(pubkey=metadata_pda, is_signer=False, is_writable=True),
                AccountMeta(pubkey=mint_address, is_signer=False, is_writable=False),
                AccountMeta(pubkey=mint_authority.pubkey(), is_signer=True, is_writable=False),
                AccountMeta(pubkey=mint_authority.pubkey(), is_signer=True, is_writable=True),
                AccountMeta(pubkey=mint_authority.pubkey(), is_signer=False, is_writable=False),
                AccountMeta(pubkey=SYSTEM_PROGRAM_ID, is_signer=False, is_writable=False),
            ],
            data=instruction_data
        )

        # Create and send transaction
        recent_blockhash = client.get_latest_blockhash().value.blockhash
        transaction = Transaction(
            recent_blockhash=recent_blockhash,
            fee_payer=mint_authority.pubkey()
        )
        transaction.add(create_metadata_ix)

        # Send transaction
        try:
            result = client.send_transaction(transaction, mint_authority)
            tx_signature = str(result.value)
            self.stdout.write(self.style.SUCCESS(f"✅ Metadata created!"))
            self.stdout.write(f"Transaction: {tx_signature}")
            self.stdout.write(f"View on explorer: https://explorer.solana.com/tx/{tx_signature}?cluster=devnet")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Failed to create metadata: {e}"))
