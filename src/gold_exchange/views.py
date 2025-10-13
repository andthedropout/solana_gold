"""
API views for gold token exchange.
"""
import logging
import base64
from decimal import Decimal
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.db import transaction as db_transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from solders.pubkey import Pubkey
from solders.transaction import Transaction as SolanaTransaction

from .models import GoldTransaction, ExchangeQuote
from .serializers import (
    QuoteRequestSerializer,
    QuoteResponseSerializer,
    BuyInitiateSerializer,
    BuyConfirmSerializer,
    SellInitiateSerializer,
    SellConfirmSerializer,
    GoldTransactionSerializer,
    BalanceResponseSerializer,
    PriceResponseSerializer,
)
from .services import GoldTokenService
from .utils import PriceOracle, generate_quote_id, validate_solana_address

logger = logging.getLogger(__name__)


@api_view(['POST'])
def get_quote(request):
    """
    Get a quote for buying/selling gold tokens.

    POST /api/v1/gold/quote
    Body: {
        "sol_amount": "1.5",
        "action": "buy"  // or "sell"
    }
    """
    serializer = QuoteRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    sol_amount = serializer.validated_data.get('sol_amount')
    usd_amount = serializer.validated_data.get('usd_amount')
    action = serializer.validated_data['action']

    try:
        # Get current prices FIRST (before any calculations)
        gold_price, sol_price = PriceOracle.get_prices()

        # If USD amount provided, calculate SOL amount using this price
        if usd_amount:
            sol_amount = (usd_amount / sol_price).quantize(Decimal('0.000000001'))
            logger.info(f"USD→SOL conversion: ${usd_amount} ÷ ${sol_price} = {sol_amount} SOL")

        # Calculate token amount and fees based on action
        if action == 'buy':
            # Buy: $12.50 → 1 token worth $10 of gold
            # Fee calculation: 83.76% liquidity, 8% treasury, 8% profit, 0.24% transaction = 100% total
            liquidity_amount = (sol_amount * Decimal('0.8376')).quantize(Decimal('0.000000001'))
            treasury_fee = (sol_amount * Decimal('0.08')).quantize(Decimal('0.000000001'))
            profit_fee = (sol_amount * Decimal('0.08')).quantize(Decimal('0.000000001'))
            transaction_fee = (sol_amount * Decimal('0.0024')).quantize(Decimal('0.000000001'))
            net_sol = liquidity_amount

            total_usd = sol_amount * sol_price
            # For every $12.50 spent, user gets 1 token representing $10 of gold
            token_amount = (total_usd / Decimal('12.5')).quantize(Decimal('0.01'))
        else:  # sell
            # Sell: 1 token → $10 worth of SOL (no fees on redemption)
            treasury_fee = Decimal('0')
            profit_fee = Decimal('0')
            transaction_fee = Decimal('0')
            liquidity_amount = sol_amount  # Full amount returned to user
            net_sol = sol_amount

            total_usd = sol_amount * sol_price
            # Each token represents $10 of gold value
            token_amount = (total_usd / Decimal('10')).quantize(Decimal('0.01'))

        # Generate quote ID
        quote_id = generate_quote_id()

        # Set expiration (30 seconds from now)
        expires_at = timezone.now() + timedelta(seconds=30)

        # Save quote to database
        ExchangeQuote.objects.create(
            quote_id=quote_id,
            user_wallet='',  # Will be filled when used
            action=action,
            sol_amount=sol_amount,
            token_amount=token_amount,
            gold_price_usd=gold_price,
            sol_price_usd=sol_price,
            treasury_fee=treasury_fee,
            dev_fee=Decimal('0'),  # No longer used, kept for backwards compatibility
            profit_fee=profit_fee,
            transaction_fee=transaction_fee,
            expires_at=expires_at,
        )

        # Prepare response
        total_fees = treasury_fee + profit_fee + transaction_fee
        response_data = {
            'quote_id': quote_id,
            'sol_amount': sol_amount,
            'sgold_amount': token_amount,
            'gold_price_usd': gold_price,
            'sol_price_usd': sol_price,
            'fees': {
                'treasury': float(treasury_fee),
                'profit': float(profit_fee),
                'transaction': float(transaction_fee),
                'total_fee_sol': float(total_fees),
            },
            'net_sol_to_liquidity': liquidity_amount,  # Pass Decimal directly
            'exchange_rate': '1 sGOLD unit = $10 worth of gold',
            'expires_in': 30,
            'expires_at': expires_at,
        }

        serializer = QuoteResponseSerializer(data=response_data)
        if serializer.is_valid():
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            logger.error(f"QuoteResponseSerializer validation failed: {serializer.errors}")
            logger.error(f"Response data was: {response_data}")
            return Response(serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.error(f"Error generating quote: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to generate quote', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def buy_initiate(request):
    """
    Initiate a buy transaction.
    Creates unsigned transaction for user to sign.

    POST /api/v1/gold/buy/initiate
    Body: {
        "wallet_address": "7xK...",
        "quote_id": "abc-123-..."
    }
    """
    serializer = BuyInitiateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    wallet_address = serializer.validated_data['wallet_address']
    quote_id = serializer.validated_data['quote_id']

    # Validate wallet address
    if not validate_solana_address(wallet_address):
        return Response(
            {'error': 'Invalid Solana wallet address'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Get quote
        quote = ExchangeQuote.objects.get(quote_id=quote_id)

        # Validate quote
        if not quote.is_valid:
            return Response(
                {'error': 'Quote has expired or already been used'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update quote with user wallet
        quote.user_wallet = wallet_address
        quote.save()

        # Create transaction record
        total_fees = quote.treasury_fee + quote.profit_fee + quote.transaction_fee
        gold_tx = GoldTransaction.objects.create(
            user_wallet=wallet_address,
            transaction_type='buy',
            sol_amount=quote.sol_amount,
            token_amount=quote.token_amount,
            gold_price_usd=quote.gold_price_usd,
            sol_price_usd=quote.sol_price_usd,
            treasury_fee=quote.treasury_fee,
            dev_fee=Decimal('0'),  # No longer used
            profit_fee=quote.profit_fee,
            transaction_fee=quote.transaction_fee,
            fees_collected=total_fees,
            status='pending',
            quote_id=quote_id,
            quote_expires_at=quote.expires_at,
        )

        # Create complete transaction
        from solana.rpc.api import Client
        from solana.rpc.commitment import Confirmed
        from solders.system_program import transfer, TransferParams
        from solders.transaction import Transaction as SolanaTransaction
        from solders.message import Message
        import base64

        service = GoldTokenService()
        user_pubkey = Pubkey.from_string(wallet_address)
        client = Client(settings.SOLANA_RPC_URL, commitment=Confirmed)

        # Calculate fees: treasury, profit, transaction, liquidity
        treasury_fee, profit_fee, transaction_fee, liquidity_amount = service.calculate_fees(quote.sol_amount, 'buy')

        # Build transfer instructions for all 4 wallets
        instructions = service.create_buy_transaction_instructions(
            user_pubkey=user_pubkey,
            sol_amount=quote.sol_amount,
            treasury_fee=treasury_fee,
            profit_fee=profit_fee,
            transaction_fee=transaction_fee,
            liquidity_amount=liquidity_amount
        )

        # Get recent blockhash
        recent_blockhash = client.get_latest_blockhash().value.blockhash

        # Build transaction
        message = Message.new_with_blockhash(
            instructions,
            user_pubkey,
            recent_blockhash
        )

        # Create unsigned transaction (user will sign it)
        transaction = SolanaTransaction.new_unsigned(message)

        # Serialize transaction to base64
        tx_bytes = bytes(transaction)
        serialized_tx = base64.b64encode(tx_bytes).decode('utf-8')

        response_data = {
            'exchange_id': gold_tx.id,
            'serialized_transaction': serialized_tx,
            'total_sol': float(quote.sol_amount),
            'expected_sgold': float(quote.token_amount),
            'expires_at': quote.expires_at,
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except ExchangeQuote.DoesNotExist:
        return Response(
            {'error': 'Quote not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error initiating buy: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to initiate buy transaction', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def buy_confirm(request):
    """
    Confirm buy transaction with signed transaction from user.
    Backend verifies payment and mints tokens.

    POST /api/v1/gold/buy/confirm
    Body: {
        "exchange_id": 123,
        "tx_signature": "signature_string..."
    }
    """
    serializer = BuyConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    exchange_id = serializer.validated_data['exchange_id']
    tx_signature = serializer.validated_data['tx_signature']

    try:
        # Get transaction record
        with db_transaction.atomic():
            gold_tx = GoldTransaction.objects.select_for_update().get(id=exchange_id)

            # Check status
            if gold_tx.status != 'pending':
                return Response(
                    {'error': f'Transaction is not pending (current status: {gold_tx.status})'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check expiration
            if gold_tx.is_expired:
                gold_tx.mark_failed('Quote expired')
                return Response(
                    {'error': 'Quote has expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update status to processing
            logger.info(f"About to save status=processing for tx {gold_tx.id}")
            gold_tx.status = 'processing'
            gold_tx.save()
            logger.info(f"Successfully saved status=processing")

        # Verify transaction (already submitted by wallet)
        try:
            service = GoldTokenService()

            logger.info(f"Verifying SOL payment transaction: {tx_signature}")

            # Wait for confirmation
            import time
            time.sleep(2)  # Wait 2 seconds for confirmation

            # Verify SOL payment was received
            payment_verified = service.verify_sol_payment(
                tx_signature,
                gold_tx.sol_amount
            )

            if not payment_verified:
                gold_tx.mark_failed('Failed to verify SOL payment on-chain')
                return Response(
                    {'error': 'Failed to verify payment'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Mint tokens to user
            user_pubkey = Pubkey.from_string(gold_tx.user_wallet)
            mint_tx_signature = service.mint_tokens_to_user(
                user_pubkey,
                gold_tx.token_amount
            )

            # Get user's ATA
            user_ata = service.get_or_create_associated_token_account(user_pubkey)

            # Update transaction record
            logger.info(f"Saving tx_signature: {tx_signature} (length: {len(tx_signature)})")
            logger.info(f"Saving user_ata: {str(user_ata)} (length: {len(str(user_ata))})")
            logger.info(f"Saving mint_tx_signature: {mint_tx_signature} (length: {len(str(mint_tx_signature))})")

            gold_tx.tx_signature = tx_signature
            gold_tx.user_token_account = str(user_ata)
            gold_tx.status = 'completed'
            gold_tx.completed_at = timezone.now()
            gold_tx.status_message = f'Minted {gold_tx.token_amount} sGOLD tokens'

            try:
                gold_tx.save()
            except Exception as save_error:
                logger.error(f"Failed to save transaction: {save_error}")
                logger.error(f"tx_signature: '{gold_tx.tx_signature}' (len={len(gold_tx.tx_signature)})")
                logger.error(f"user_token_account: '{gold_tx.user_token_account}' (len={len(gold_tx.user_token_account) if gold_tx.user_token_account else 0})")
                raise

            # Mark quote as used
            if gold_tx.quote_id:
                ExchangeQuote.objects.filter(quote_id=gold_tx.quote_id).update(used=True)

            return Response({
                'status': 'completed',
                'tx_signature': tx_signature,
                'mint_tx_signature': mint_tx_signature,
                'sgold_minted': float(gold_tx.token_amount),
                'user_ata': str(user_ata),
                'message': f'Successfully purchased {gold_tx.token_amount} sGOLD tokens'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error processing transaction: {e}", exc_info=True)
            gold_tx.mark_failed(f'Error processing transaction: {str(e)}')
            return Response(
                {'error': 'Failed to process transaction', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except GoldTransaction.DoesNotExist:
        return Response(
            {'error': 'Transaction not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error confirming buy: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to confirm transaction', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_balance(request, wallet_address):
    """
    Get user's sGOLD balance and transaction history.

    GET /api/v1/gold/balance/<wallet_address>
    """
    # Basic validation - check if it looks like a Solana address
    if not wallet_address or len(wallet_address) < 32 or len(wallet_address) > 44:
        return Response(
            {'error': 'Invalid Solana wallet address'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Check if system is initialized
        from django.conf import settings

        # Always try to get SOL balance from blockchain
        try:
            from solana.rpc.api import Client
            client = Client(settings.SOLANA_RPC_URL)
            user_pubkey = Pubkey.from_string(wallet_address)
            sol_balance_info = client.get_balance(user_pubkey)
            sol_balance = float(Decimal(sol_balance_info.value) / Decimal('1000000000'))
        except Exception as e:
            logger.warning(f"Could not get SOL balance: {e}")
            sol_balance = 0.0

        if not settings.SGOLD_MINT_ADDRESS:
            # Return SOL balance but no sGOLD - system not initialized
            return Response({
                'wallet_address': wallet_address,
                'sgold_balance': 0.0,
                'usd_value': 0.0,
                'sol_balance': sol_balance,
                'recent_transactions': [],
                'system_initialized': False,
            }, status=status.HTTP_200_OK)

        service = GoldTokenService()
        user_pubkey = Pubkey.from_string(wallet_address)

        # Get token balance from on-chain
        token_balance = service.get_token_balance(user_pubkey)

        # Get SOL balance
        sol_balance_info = service.client.get_balance(user_pubkey)
        sol_balance = Decimal(sol_balance_info.value) / Decimal('1000000000')

        # Get current gold price for USD valuation
        gold_price, _ = PriceOracle.get_prices()
        estimated_usd = token_balance * Decimal('10')  # Each token unit = $10

        # Get recent transactions
        recent_txs = GoldTransaction.objects.filter(
            user_wallet=wallet_address
        ).order_by('-created_at')[:10]

        response_data = {
            'wallet_address': wallet_address,
            'sgold_balance': float(token_balance),
            'usd_value': float(estimated_usd),
            'sol_balance': float(sol_balance),
            'recent_transactions': GoldTransactionSerializer(recent_txs, many=True).data,
            'system_initialized': True,
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error getting balance: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to get balance', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_price(request):
    """
    Get current gold and SOL prices.

    GET /api/v1/gold/price
    """
    try:
        gold_price, sol_price = PriceOracle.get_prices()

        # Check if system is initialized
        from django.conf import settings
        if not settings.SGOLD_MINT_ADDRESS:
            # Return prices without token calculations
            response_data = {
                'gold_price_usd': float(gold_price),
                'sol_price_usd': float(sol_price),
                'sgold_rate': 10.0,  # 1 sGOLD = $10
                'last_updated': timezone.now(),
                'system_initialized': False,
            }
            return Response(response_data, status=status.HTTP_200_OK)

        # System is initialized, calculate token values
        service = GoldTokenService()
        # Calculate how much SOL needed for 1 sGOLD ($10 worth)
        sgold_value_sol = service.calculate_sol_amount(
            Decimal('1'),
            gold_price,
            sol_price
        )

        response_data = {
            'gold_price_usd': float(gold_price),
            'sol_price_usd': float(sol_price),
            'sgold_value_sol': float(sgold_value_sol),
            'sgold_rate': 10.0,  # 1 sGOLD = $10
            'last_updated': timezone.now(),
            'system_initialized': True,
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error getting prices: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to get prices', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def sell_initiate(request):
    """
    Initiate a sell transaction.
    Creates transaction with burn instruction and SOL payout.

    POST /api/v1/gold/sell/initiate
    Body: {
        "wallet_address": "7xK...",
        "quote_id": "abc-123-..."
    }
    """
    serializer = SellInitiateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    wallet_address = serializer.validated_data['wallet_address']
    quote_id = serializer.validated_data['quote_id']

    # Validate wallet address
    if not validate_solana_address(wallet_address):
        return Response(
            {'error': 'Invalid Solana wallet address'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Get quote
        quote = ExchangeQuote.objects.get(quote_id=quote_id)

        # Validate quote
        if not quote.is_valid:
            return Response(
                {'error': 'Quote has expired or already been used'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify this is a sell quote
        if quote.action != 'sell':
            return Response(
                {'error': 'Quote is not for selling'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update quote with user wallet
        quote.user_wallet = wallet_address
        quote.save()

        # Create transaction record
        gold_tx = GoldTransaction.objects.create(
            user_wallet=wallet_address,
            transaction_type='sell',
            sol_amount=quote.sol_amount,
            token_amount=quote.token_amount,
            gold_price_usd=quote.gold_price_usd,
            sol_price_usd=quote.sol_price_usd,
            treasury_fee=Decimal('0'),  # No fees on sell
            dev_fee=Decimal('0'),
            profit_fee=Decimal('0'),
            transaction_fee=Decimal('0'),
            fees_collected=Decimal('0'),
            status='pending',
            quote_id=quote_id,
            quote_expires_at=quote.expires_at,
        )

        # Create sell transaction with burn + SOL transfer
        from solana.rpc.api import Client
        from solana.rpc.commitment import Confirmed
        from solders.transaction import Transaction as SolanaTransaction
        from solders.message import Message
        import base64

        service = GoldTokenService()
        user_pubkey = Pubkey.from_string(wallet_address)
        client = Client(settings.SOLANA_RPC_URL, commitment=Confirmed)

        # Verify user has sufficient SOLGOLD balance
        user_balance = service.get_token_balance(user_pubkey)
        if user_balance < quote.token_amount:
            gold_tx.mark_failed(f'Insufficient SOLGOLD balance: {user_balance} < {quote.token_amount}')
            return Response(
                {'error': f'Insufficient SOLGOLD balance. You have {user_balance} SOLGOLD but need {quote.token_amount}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build ONLY burn instruction for user to sign
        # (SOL payout will be sent by backend in a separate transaction after burn is verified)
        from spl.token.instructions import burn, BurnParams
        from spl.token.constants import TOKEN_PROGRAM_ID

        user_ata = service.get_or_create_associated_token_account(user_pubkey)
        token_base_units = int(quote.token_amount * Decimal('100'))

        burn_instruction = burn(BurnParams(
            program_id=TOKEN_PROGRAM_ID,
            account=user_ata,
            mint=service.mint_address,
            owner=user_pubkey,
            amount=token_base_units,
            signers=[user_pubkey]
        ))

        # Get recent blockhash
        recent_blockhash = client.get_latest_blockhash().value.blockhash

        # Build transaction for user to sign (burn only)
        message = Message.new_with_blockhash(
            [burn_instruction],
            user_pubkey,  # User pays fees and signs burn
            recent_blockhash
        )

        # Create unsigned transaction for user to sign
        transaction = SolanaTransaction.new_unsigned(message)

        # Serialize for user to sign
        tx_bytes = bytes(transaction)
        serialized_tx = base64.b64encode(tx_bytes).decode('utf-8')

        response_data = {
            'exchange_id': gold_tx.id,
            'serialized_transaction': serialized_tx,
            'total_sgold': float(quote.token_amount),
            'expected_sol': float(quote.sol_amount),
            'expires_at': quote.expires_at,
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except ExchangeQuote.DoesNotExist:
        return Response(
            {'error': 'Quote not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error initiating sell: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to initiate sell transaction', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def sell_confirm(request):
    """
    Confirm sell transaction with signed transaction from user.
    Backend verifies burn and SOL payout.

    POST /api/v1/gold/sell/confirm
    Body: {
        "exchange_id": 123,
        "tx_signature": "signature_string..."
    }
    """
    serializer = SellConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    exchange_id = serializer.validated_data['exchange_id']
    tx_signature = serializer.validated_data['tx_signature']

    try:
        # Get transaction record
        with db_transaction.atomic():
            gold_tx = GoldTransaction.objects.select_for_update().get(id=exchange_id)

            # Check status
            if gold_tx.status != 'pending':
                return Response(
                    {'error': f'Transaction is not pending (current status: {gold_tx.status})'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check expiration
            if gold_tx.is_expired:
                gold_tx.mark_failed('Quote expired')
                return Response(
                    {'error': 'Quote has expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update status to processing
            gold_tx.status = 'processing'
            gold_tx.save()

        # Verify transaction (burn + SOL payout)
        try:
            service = GoldTokenService()

            logger.info(f"Verifying sell transaction: {tx_signature}")

            # Wait for confirmation
            import time
            time.sleep(2)

            # Verify burn transaction was successful
            burn_verified = service.verify_burn_transaction(
                tx_signature,
                gold_tx.token_amount
            )

            if not burn_verified:
                gold_tx.mark_failed('Failed to verify token burn on-chain')
                return Response(
                    {'error': 'Failed to verify token burn'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Send SOL to user from liquidity wallet
            user_pubkey = Pubkey.from_string(gold_tx.user_wallet)
            logger.info(f"Sending {gold_tx.sol_amount} SOL to user {user_pubkey}")

            from solana.rpc.api import Client
            from solders.system_program import transfer, TransferParams
            from solders.message import Message

            client = Client(settings.SOLANA_RPC_URL)

            # Create SOL transfer from liquidity wallet to user
            transfer_instruction = transfer(TransferParams(
                from_pubkey=service.mint_authority.pubkey(),  # liquidity wallet
                to_pubkey=user_pubkey,
                lamports=int(gold_tx.sol_amount * Decimal('1000000000'))
            ))

            # Get recent blockhash
            recent_blockhash = client.get_latest_blockhash().value.blockhash

            # Build and sign transaction with liquidity wallet
            message = Message.new_with_blockhash(
                [transfer_instruction],
                service.mint_authority.pubkey(),  # liquidity wallet pays and signs
                recent_blockhash
            )

            # Sign and send transaction
            sol_transfer_tx = SolanaTransaction([service.mint_authority], message, recent_blockhash)
            tx_bytes = bytes(sol_transfer_tx)
            sol_transfer_result = client.send_raw_transaction(tx_bytes)
            sol_transfer_signature = str(sol_transfer_result.value)

            logger.info(f"SOL transfer completed: {sol_transfer_signature}")

            # Get user's ATA
            user_ata = service.get_or_create_associated_token_account(user_pubkey)

            # Update transaction record
            gold_tx.tx_signature = tx_signature
            gold_tx.user_token_account = str(user_ata)
            gold_tx.status = 'completed'
            gold_tx.completed_at = timezone.now()
            gold_tx.status_message = f'Sold {gold_tx.token_amount} SOLGOLD for {gold_tx.sol_amount} SOL (payout: {sol_transfer_signature})'

            try:
                gold_tx.save()
            except Exception as save_error:
                logger.error(f"Failed to save transaction: {save_error}")
                raise

            # Mark quote as used
            if gold_tx.quote_id:
                ExchangeQuote.objects.filter(quote_id=gold_tx.quote_id).update(used=True)

            return Response({
                'status': 'completed',
                'tx_signature': tx_signature,
                'sgold_burned': float(gold_tx.token_amount),
                'sol_received': float(gold_tx.sol_amount),
                'user_ata': str(user_ata),
                'message': f'Successfully sold {gold_tx.token_amount} SOLGOLD for {gold_tx.sol_amount} SOL'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error processing sell transaction: {e}", exc_info=True)
            gold_tx.mark_failed(f'Error processing transaction: {str(e)}')
            return Response(
                {'error': 'Failed to process transaction', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except GoldTransaction.DoesNotExist:
        return Response(
            {'error': 'Transaction not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error confirming sell: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to confirm transaction', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
