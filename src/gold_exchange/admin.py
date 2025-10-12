from django.contrib import admin
from .models import SystemWallet, GoldTransaction, ExchangeQuote


@admin.register(SystemWallet)
class SystemWalletAdmin(admin.ModelAdmin):
    list_display = ['wallet_type', 'public_key_short', 'is_active', 'created_at']
    list_filter = ['wallet_type', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    search_fields = ['public_key']

    def public_key_short(self, obj):
        return f"{obj.public_key[:8]}...{obj.public_key[-8:]}"
    public_key_short.short_description = 'Public Key'


@admin.register(GoldTransaction)
class GoldTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'transaction_type',
        'user_wallet_short',
        'token_amount',
        'sol_amount',
        'status',
        'created_at',
    ]
    list_filter = ['transaction_type', 'status', 'created_at']
    readonly_fields = [
        'created_at',
        'updated_at',
        'completed_at',
        'tx_signature',
        'user_token_account',
    ]
    search_fields = ['user_wallet', 'tx_signature']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('User Information', {
            'fields': ('user_wallet', 'user_token_account')
        }),
        ('Transaction Details', {
            'fields': (
                'transaction_type',
                'sol_amount',
                'token_amount',
                'gold_price_usd',
                'sol_price_usd',
            )
        }),
        ('Fees', {
            'fields': (
                'treasury_fee',
                'profit_fee',
                'transaction_fee',
                'dev_fee',
                'fees_collected',
            )
        }),
        ('Status', {
            'fields': (
                'status',
                'status_message',
                'tx_signature',
            )
        }),
        ('Quote Information', {
            'fields': ('quote_id', 'quote_expires_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
    )

    def user_wallet_short(self, obj):
        return f"{obj.user_wallet[:8]}...{obj.user_wallet[-8:]}"
    user_wallet_short.short_description = 'User Wallet'


@admin.register(ExchangeQuote)
class ExchangeQuoteAdmin(admin.ModelAdmin):
    list_display = [
        'quote_id_short',
        'action',
        'sol_amount',
        'token_amount',
        'used',
        'is_expired_status',
        'created_at',
    ]
    list_filter = ['action', 'used', 'created_at']
    readonly_fields = ['created_at', 'quote_id']
    search_fields = ['quote_id', 'user_wallet']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Quote Information', {
            'fields': ('quote_id', 'user_wallet', 'action')
        }),
        ('Amounts', {
            'fields': ('sol_amount', 'token_amount')
        }),
        ('Prices', {
            'fields': ('gold_price_usd', 'sol_price_usd')
        }),
        ('Fee Breakdown', {
            'fields': (
                'treasury_fee',
                'profit_fee',
                'transaction_fee',
                'dev_fee',
            )
        }),
        ('Status', {
            'fields': ('used', 'created_at', 'expires_at')
        }),
    )

    def quote_id_short(self, obj):
        return f"{obj.quote_id[:8]}..."
    quote_id_short.short_description = 'Quote ID'

    def is_expired_status(self, obj):
        return obj.is_expired
    is_expired_status.boolean = True
    is_expired_status.short_description = 'Expired'
