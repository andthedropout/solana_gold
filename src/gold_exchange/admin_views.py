"""
Admin dashboard views for gold token exchange.
"""
import logging
import base58
from decimal import Decimal
from django.conf import settings
from django.db import models
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from solana.rpc.api import Client
from solders.pubkey import Pubkey
from solders.keypair import Keypair

from .utils import PriceOracle
from .models import GoldTransaction, ExchangeQuote

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    """
    Get admin dashboard data showing all wallet balances and system stats.
    Only accessible to Django admin users (staff/superuser).

    GET /api/v1/gold/admin/dashboard
    """
    try:
        client = Client(settings.SOLANA_RPC_URL)

        # Get all wallet addresses from settings
        # Mint authority is stored as keypair, extract pubkey
        mint_authority_keypair = Keypair.from_bytes(base58.b58decode(settings.MINT_AUTHORITY_KEYPAIR))
        mint_authority_pubkey = mint_authority_keypair.pubkey()
        mint_authority_address = str(mint_authority_pubkey)

        treasury_pubkey = Pubkey.from_string(settings.TREASURY_WALLET)
        dev_fund_pubkey = Pubkey.from_string(settings.DEV_FUND_WALLET)
        profit_pubkey = Pubkey.from_string(settings.PROFIT_WALLET)
        transaction_fee_pubkey = Pubkey.from_string(settings.TRANSACTION_FEE_WALLET)

        # Get SOL balances for each wallet
        # Note: mint_authority also serves as liquidity wallet (combined for devnet)
        mint_authority_balance = client.get_balance(mint_authority_pubkey).value / 1_000_000_000
        treasury_balance = client.get_balance(treasury_pubkey).value / 1_000_000_000
        dev_fund_balance = client.get_balance(dev_fund_pubkey).value / 1_000_000_000
        profit_balance = client.get_balance(profit_pubkey).value / 1_000_000_000
        transaction_fee_balance = client.get_balance(transaction_fee_pubkey).value / 1_000_000_000

        # Get current prices
        gold_price, sol_price = PriceOracle.get_prices()

        # Get transaction statistics
        total_transactions = GoldTransaction.objects.count()
        completed_transactions = GoldTransaction.objects.filter(status='completed').count()
        pending_transactions = GoldTransaction.objects.filter(status='pending').count()
        failed_transactions = GoldTransaction.objects.filter(status='failed').count()

        # Get volume statistics
        total_sol_volume = GoldTransaction.objects.filter(
            status='completed'
        ).aggregate(
            total=models.Sum('sol_amount')
        )['total'] or Decimal('0')

        total_sgold_minted = GoldTransaction.objects.filter(
            status='completed',
            transaction_type='buy'
        ).aggregate(
            total=models.Sum('token_amount')
        )['total'] or Decimal('0')

        total_fees_collected = GoldTransaction.objects.filter(
            status='completed'
        ).aggregate(
            total=models.Sum('fees_collected')
        )['total'] or Decimal('0')

        # Get recent transactions
        recent_transactions = GoldTransaction.objects.order_by('-created_at')[:10]

        response_data = {
            'system_info': {
                'solana_network': settings.SOLANA_NETWORK,
                'sgold_mint_address': settings.SGOLD_MINT_ADDRESS,
                'system_initialized': bool(settings.SGOLD_MINT_ADDRESS),
            },
            'wallets': {
                'liquidity_mint': {
                    'address': mint_authority_address,
                    'balance_sol': float(mint_authority_balance),
                    'balance_usd': float(Decimal(str(mint_authority_balance)) * sol_price),
                    'description': 'Liquidity pool (83.76%) + Mint authority for sGOLD tokens',
                },
                'treasury': {
                    'address': settings.TREASURY_WALLET,
                    'balance_sol': float(treasury_balance),
                    'balance_usd': float(Decimal(str(treasury_balance)) * sol_price),
                    'description': 'Receives 8% - Used to buy physical gold',
                },
                'profit': {
                    'address': settings.PROFIT_WALLET,
                    'balance_sol': float(profit_balance),
                    'balance_usd': float(Decimal(str(profit_balance)) * sol_price),
                    'description': 'Receives 8% - Business profit',
                },
                'transaction_fee': {
                    'address': settings.TRANSACTION_FEE_WALLET,
                    'balance_sol': float(transaction_fee_balance),
                    'balance_usd': float(Decimal(str(transaction_fee_balance)) * sol_price),
                    'description': 'Receives 0.24% - Operational costs',
                },
                'dev_fund': {
                    'address': settings.DEV_FUND_WALLET,
                    'balance_sol': float(dev_fund_balance),
                    'balance_usd': float(Decimal(str(dev_fund_balance)) * sol_price),
                    'description': 'Development fund (currently 0%)',
                },
            },
            'prices': {
                'gold_price_usd': float(gold_price),
                'sol_price_usd': float(sol_price),
                'sgold_rate': 10.0,
            },
            'statistics': {
                'total_transactions': total_transactions,
                'completed_transactions': completed_transactions,
                'pending_transactions': pending_transactions,
                'failed_transactions': failed_transactions,
                'total_sol_volume': float(total_sol_volume),
                'total_sgold_minted': float(total_sgold_minted),
                'total_fees_collected_sol': float(total_fees_collected),
                'total_fees_collected_usd': float(total_fees_collected * sol_price),
            },
            'recent_transactions': [
                {
                    'id': tx.id,
                    'user_wallet': tx.user_wallet,
                    'type': tx.transaction_type,
                    'sol_amount': float(tx.sol_amount),
                    'token_amount': float(tx.token_amount),
                    'status': tx.status,
                    'created_at': tx.created_at,
                    'tx_signature': tx.tx_signature,
                }
                for tx in recent_transactions
            ],
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error getting admin dashboard: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to load admin dashboard', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def withdraw_from_wallet(request):
    """
    Withdraw SOL from treasury, dev fund, or liquidity wallet.
    Only accessible to Django admin users (staff/superuser).

    POST /api/v1/gold/admin/withdraw
    Body: {
        "wallet": "treasury" | "dev_fund" | "liquidity",
        "destination": "recipient_wallet_address",
        "amount_sol": 0.5
    }
    """
    try:
        wallet_type = request.data.get('wallet')
        destination = request.data.get('destination')
        amount_sol = Decimal(str(request.data.get('amount_sol', 0)))

        # Validate inputs
        if not wallet_type or wallet_type not in ['liquidity_mint', 'treasury', 'dev_fund', 'profit', 'transaction_fee']:
            return Response(
                {'error': 'Invalid wallet type. Must be: liquidity_mint, treasury, dev_fund, profit, or transaction_fee'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not destination:
            return Response(
                {'error': 'Destination address required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount_sol <= 0:
            return Response(
                {'error': 'Amount must be greater than 0'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the appropriate keypair
        if wallet_type == 'liquidity_mint':
            keypair = Keypair.from_bytes(base58.b58decode(settings.MINT_AUTHORITY_KEYPAIR))
            wallet_name = 'Liquidity + Mint Authority'
        elif wallet_type == 'treasury':
            if not hasattr(settings, 'TREASURY_KEYPAIR'):
                return Response(
                    {'error': 'Treasury keypair not configured. Run: python manage.py regenerate_wallets'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            keypair = Keypair.from_bytes(base58.b58decode(settings.TREASURY_KEYPAIR))
            wallet_name = 'Treasury'
        elif wallet_type == 'dev_fund':
            if not hasattr(settings, 'DEV_FUND_KEYPAIR'):
                return Response(
                    {'error': 'Dev Fund keypair not configured. Run: python manage.py regenerate_wallets'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            keypair = Keypair.from_bytes(base58.b58decode(settings.DEV_FUND_KEYPAIR))
            wallet_name = 'Dev Fund'
        elif wallet_type == 'profit':
            if not hasattr(settings, 'PROFIT_KEYPAIR'):
                return Response(
                    {'error': 'Profit keypair not configured'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            keypair_data = eval(settings.PROFIT_KEYPAIR)  # Convert list string to actual list
            keypair = Keypair.from_bytes(bytes(keypair_data))
            wallet_name = 'Profit'
        else:  # transaction_fee
            if not hasattr(settings, 'TRANSACTION_FEE_KEYPAIR'):
                return Response(
                    {'error': 'Transaction fee keypair not configured'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            keypair_data = eval(settings.TRANSACTION_FEE_KEYPAIR)  # Convert list string to actual list
            keypair = Keypair.from_bytes(bytes(keypair_data))
            wallet_name = 'Transaction Fee'

        # Connect to Solana
        from solana.rpc.api import Client
        from solana.rpc.commitment import Confirmed
        from solders.system_program import transfer, TransferParams
        from solders.transaction import Transaction
        from solders.message import Message

        client = Client(settings.SOLANA_RPC_URL, commitment=Confirmed)

        # Check balance
        balance_info = client.get_balance(keypair.pubkey())
        balance_lamports = balance_info.value
        balance_sol = Decimal(balance_lamports) / Decimal('1000000000')

        # Convert amount to lamports
        amount_lamports = int(amount_sol * Decimal('1000000000'))

        # Check if enough balance (leave some for transaction fee)
        if balance_lamports < amount_lamports + 5000:  # 5000 lamports for fee
            return Response(
                {'error': f'Insufficient balance. Wallet has {float(balance_sol)} SOL, need {float(amount_sol)} + fee'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create transaction
        dest_pubkey = Pubkey.from_string(destination)
        recent_blockhash = client.get_latest_blockhash().value.blockhash

        transfer_ix = transfer(
            TransferParams(
                from_pubkey=keypair.pubkey(),
                to_pubkey=dest_pubkey,
                lamports=amount_lamports
            )
        )

        message = Message.new_with_blockhash(
            [transfer_ix],
            keypair.pubkey(),
            recent_blockhash
        )

        transaction = Transaction([keypair], message, recent_blockhash)

        # Send transaction
        tx_bytes = bytes(transaction)
        result = client.send_raw_transaction(tx_bytes)
        tx_signature = str(result.value)

        logger.info(f"Admin withdrawal: {amount_sol} SOL from {wallet_name} to {destination}. Tx: {tx_signature}")

        return Response({
            'success': True,
            'tx_signature': tx_signature,
            'wallet': wallet_name,
            'amount_sol': float(amount_sol),
            'destination': destination,
            'explorer_url': f'https://explorer.solana.com/tx/{tx_signature}?cluster=devnet'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error withdrawing from wallet: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to withdraw', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
