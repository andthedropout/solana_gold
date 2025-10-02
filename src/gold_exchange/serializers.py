from rest_framework import serializers
from decimal import Decimal
from .models import GoldTransaction, ExchangeQuote


class QuoteRequestSerializer(serializers.Serializer):
    """Request serializer for getting a quote"""
    sol_amount = serializers.DecimalField(
        max_digits=20,
        decimal_places=9,
        min_value=Decimal('0.001'),
        required=True,
        help_text="Amount of SOL to exchange"
    )
    action = serializers.ChoiceField(
        choices=['buy', 'sell'],
        required=True,
        help_text="Action type: buy or sell"
    )


class QuoteResponseSerializer(serializers.Serializer):
    """Response serializer for quotes"""
    quote_id = serializers.CharField()
    sol_amount = serializers.DecimalField(max_digits=20, decimal_places=9)
    sgold_amount = serializers.DecimalField(max_digits=20, decimal_places=2)
    gold_price_usd = serializers.DecimalField(max_digits=10, decimal_places=2)
    sol_price_usd = serializers.DecimalField(max_digits=10, decimal_places=2)
    fees = serializers.DictField()
    net_sol_to_liquidity = serializers.DecimalField(max_digits=20, decimal_places=9)
    exchange_rate = serializers.CharField()
    expires_in = serializers.IntegerField()
    expires_at = serializers.DateTimeField()


class BuyInitiateSerializer(serializers.Serializer):
    """Initiate a buy transaction"""
    wallet_address = serializers.CharField(
        max_length=44,
        min_length=32,
        required=True,
        help_text="User's Solana wallet address"
    )
    quote_id = serializers.CharField(
        max_length=36,
        required=True,
        help_text="Quote ID from previous quote request"
    )


class BuyConfirmSerializer(serializers.Serializer):
    """Confirm a buy transaction with transaction signature"""
    exchange_id = serializers.IntegerField(
        required=True,
        help_text="Exchange transaction ID"
    )
    tx_signature = serializers.CharField(
        required=True,
        help_text="Transaction signature from wallet"
    )


class GoldTransactionSerializer(serializers.ModelSerializer):
    """Serializer for GoldTransaction model"""
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )

    class Meta:
        model = GoldTransaction
        fields = [
            'id',
            'user_wallet',
            'transaction_type',
            'transaction_type_display',
            'sol_amount',
            'token_amount',
            'gold_price_usd',
            'sol_price_usd',
            'fees_collected',
            'treasury_fee',
            'dev_fee',
            'tx_signature',
            'user_token_account',
            'status',
            'status_display',
            'status_message',
            'created_at',
            'updated_at',
            'completed_at',
        ]
        read_only_fields = fields


class BalanceResponseSerializer(serializers.Serializer):
    """Response serializer for balance queries"""
    wallet_address = serializers.CharField()
    sgold_balance = serializers.DecimalField(max_digits=20, decimal_places=2)
    estimated_usd_value = serializers.DecimalField(max_digits=20, decimal_places=2)
    sol_balance = serializers.DecimalField(max_digits=20, decimal_places=9)
    recent_transactions = GoldTransactionSerializer(many=True)


class PriceResponseSerializer(serializers.Serializer):
    """Response serializer for current prices"""
    gold_price_usd = serializers.DecimalField(max_digits=10, decimal_places=2)
    sol_price_usd = serializers.DecimalField(max_digits=10, decimal_places=2)
    sgold_value_sol = serializers.DecimalField(max_digits=20, decimal_places=9)
    last_updated = serializers.DateTimeField()
