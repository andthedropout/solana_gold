from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal


class SystemWallet(models.Model):
    """
    Stores system wallet information for the gold exchange.
    Private keys are stored encrypted.
    """
    WALLET_TYPES = [
        ('mint_authority', 'Mint Authority'),
        ('treasury', 'Treasury'),
        ('dev_fund', 'Development Fund'),
        ('liquidity', 'Liquidity Pool'),
        ('profit', 'Profit Wallet'),
        ('transaction_fee', 'Transaction Fee Wallet'),
    ]

    wallet_type = models.CharField(
        max_length=20,
        choices=WALLET_TYPES,
        unique=True,
        help_text="Type of system wallet"
    )
    public_key = models.CharField(
        max_length=44,
        help_text="Solana public key (base58)"
    )
    encrypted_private_key = models.TextField(
        blank=True,
        null=True,
        help_text="Encrypted private key (only for wallets that need to sign)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "System Wallet"
        verbose_name_plural = "System Wallets"

    def __str__(self):
        return f"{self.get_wallet_type_display()} - {self.public_key[:8]}..."


class GoldTransaction(models.Model):
    """
    Records all gold token exchange transactions.
    """
    TRANSACTION_TYPES = [
        ('buy', 'Buy sGOLD'),
        ('sell', 'Sell sGOLD'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    # User information
    user_wallet = models.CharField(
        max_length=44,
        db_index=True,
        help_text="User's Solana wallet address"
    )

    # Transaction details
    transaction_type = models.CharField(
        max_length=4,
        choices=TRANSACTION_TYPES,
        help_text="Type of transaction (buy or sell)"
    )

    # Amounts
    sol_amount = models.DecimalField(
        max_digits=20,
        decimal_places=9,
        validators=[MinValueValidator(Decimal('0.000000001'))],
        help_text="Amount of SOL involved"
    )
    token_amount = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Amount of sGOLD tokens (100 = $10.00)"
    )

    # Price snapshot
    gold_price_usd = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Gold price in USD per troy ounce at time of transaction"
    )
    sol_price_usd = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="SOL price in USD at time of transaction"
    )

    # Fees
    fees_collected = models.DecimalField(
        max_digits=20,
        decimal_places=9,
        default=Decimal('0'),
        help_text="Total fees collected in SOL"
    )
    treasury_fee = models.DecimalField(
        max_digits=20,
        decimal_places=9,
        default=Decimal('0'),
        help_text="Fee sent to treasury"
    )
    dev_fee = models.DecimalField(
        max_digits=20,
        decimal_places=9,
        default=Decimal('0'),
        help_text="Fee sent to dev fund"
    )
    profit_fee = models.DecimalField(
        max_digits=20,
        decimal_places=9,
        default=Decimal('0'),
        help_text="Fee sent to profit wallet"
    )
    transaction_fee = models.DecimalField(
        max_digits=20,
        decimal_places=9,
        default=Decimal('0'),
        help_text="Transaction processing fee"
    )

    # Blockchain data
    tx_signature = models.CharField(
        max_length=88,
        blank=True,
        null=True,
        unique=True,
        db_index=True,
        help_text="Solana transaction signature"
    )
    user_token_account = models.CharField(
        max_length=88,
        blank=True,
        null=True,
        help_text="User's associated token account for sGOLD"
    )

    # Status tracking
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        help_text="Current status of the transaction"
    )
    status_message = models.TextField(
        blank=True,
        help_text="Additional status information or error messages"
    )

    # Quote management
    quote_id = models.CharField(
        max_length=36,
        blank=True,
        null=True,
        help_text="UUID of the quote used for this transaction"
    )
    quote_expires_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the quote expires"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the transaction was completed"
    )

    class Meta:
        verbose_name = "Gold Transaction"
        verbose_name_plural = "Gold Transactions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_wallet', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.user_wallet[:8]}... - {self.status}"

    def mark_completed(self, tx_signature):
        """Mark transaction as completed with signature"""
        self.status = 'completed'
        self.tx_signature = tx_signature
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'tx_signature', 'completed_at', 'updated_at'])

    def mark_failed(self, error_message):
        """Mark transaction as failed with error message"""
        self.status = 'failed'
        self.status_message = error_message
        self.save(update_fields=['status', 'status_message', 'updated_at'])

    @property
    def is_expired(self):
        """Check if quote has expired"""
        if not self.quote_expires_at:
            return False
        return timezone.now() > self.quote_expires_at

    @property
    def total_fees(self):
        """Calculate total fees"""
        return self.treasury_fee + self.dev_fee + self.profit_fee + self.transaction_fee


class ExchangeQuote(models.Model):
    """
    Temporary quotes for exchange rates.
    Expires after a short time to prevent price manipulation.
    """
    quote_id = models.CharField(max_length=36, unique=True, primary_key=True)
    user_wallet = models.CharField(max_length=44, db_index=True)

    # Quote details
    action = models.CharField(
        max_length=4,
        choices=[('buy', 'Buy'), ('sell', 'Sell')]
    )
    sol_amount = models.DecimalField(max_digits=20, decimal_places=9)
    token_amount = models.DecimalField(max_digits=20, decimal_places=2)

    # Prices at quote time
    gold_price_usd = models.DecimalField(max_digits=10, decimal_places=2)
    sol_price_usd = models.DecimalField(max_digits=10, decimal_places=2)

    # Fee breakdown
    treasury_fee = models.DecimalField(max_digits=20, decimal_places=9)
    dev_fee = models.DecimalField(max_digits=20, decimal_places=9)
    profit_fee = models.DecimalField(
        max_digits=20,
        decimal_places=9,
        default=Decimal('0'),
        help_text="Fee sent to profit wallet"
    )
    transaction_fee = models.DecimalField(
        max_digits=20,
        decimal_places=9,
        default=Decimal('0'),
        help_text="Transaction processing fee"
    )

    # Expiration
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)
    used = models.BooleanField(default=False, db_index=True)

    class Meta:
        verbose_name = "Exchange Quote"
        verbose_name_plural = "Exchange Quotes"
        ordering = ['-created_at']

    def __str__(self):
        return f"Quote {self.quote_id[:8]}... - {self.action}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.used and not self.is_expired
