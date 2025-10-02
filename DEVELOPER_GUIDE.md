# Solana Gold Exchange - Developer Guide

> **Note to Developers**: This document should be kept up-to-date as the system evolves. When adding new features, updating architecture, or changing key workflows, please update the relevant sections below.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Transaction Flow](#transaction-flow)
6. [Key Concepts](#key-concepts)
7. [Development Setup](#development-setup)
8. [API Documentation](#api-documentation)
9. [Database Schema](#database-schema)
10. [Security Considerations](#security-considerations)
11. [Testing Strategy](#testing-strategy)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Future Roadmap](#future-roadmap)

---

## Project Overview

**Solana Gold Exchange** is a decentralized application (dApp) that enables users to:
- Exchange Solana (SOL) for gold-backed SPL tokens (sGOLD)
- Each sGOLD token unit represents $10 worth of physical gold
- Trade with transparent fee structures (3% treasury, 2% development fund)
- Maintain full custody of their tokens via Phantom wallet

### Key Features
- **Non-custodial**: Users sign transactions with their own wallets
- **Real-time pricing**: Live gold and SOL price feeds
- **SPL Token standard**: Fully compatible with Solana ecosystem
- **Fee routing**: Automatic distribution to treasury, dev fund, and liquidity pool
- **Transparent**: All transactions recorded on Solana blockchain

### Current Status (V1)
- ✅ Backend API infrastructure
- ✅ Django/PostgreSQL database
- ✅ SPL token service layer
- ✅ REST API endpoints
- 🚧 Frontend React components (in progress)
- 📋 Testing & audit (planned)
- 📋 Mainnet deployment (planned)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (Browser)                           │
│                    Phantom Wallet Extension                      │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 │ WebSocket / HTTP
                 │
┌────────────────▼─────────────────────────────────────────────────┐
│                    React Frontend (Vite)                          │
│  - GoldExchange.tsx (buy/sell UI)                               │
│  - GoldTokenBalance.tsx (balance display)                       │
│  - WalletContextProvider (Phantom integration)                  │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 │ REST API (HTTP/JSON)
                 │
┌────────────────▼─────────────────────────────────────────────────┐
│              Django Backend (Python 3.13)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  gold_exchange App                                       │   │
│  │  - views.py (API endpoints)                             │   │
│  │  - services.py (GoldTokenService)                       │   │
│  │  - models.py (GoldTransaction, SystemWallet, Quote)     │   │
│  │  - utils.py (PriceOracle)                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────┬──────────────────────────────────┬──────────────────────┘
        │                                  │
        │                                  │ PostgreSQL
        │                                  │
        │                                  ▼
        │                          ┌──────────────────┐
        │                          │   Database       │
        │                          │  - Transactions  │
        │                          │  - Wallets       │
        │                          │  - Quotes        │
        │                          └──────────────────┘
        │
        │ Solana RPC API
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│                  Solana Blockchain (Devnet)                     │
│                                                                  │
│  - SPL Token Program (sGOLD mint)                              │
│  - System wallets (treasury, dev fund, liquidity pool)        │
│  - User associated token accounts (ATAs)                       │
└────────────────────────────────────────────────────────────────┘
```

### Architecture Decision: Hybrid Approach (V1)

**Why not fully on-chain?**

We chose a **hybrid backend + blockchain** approach for V1:

**Advantages**:
- ✅ Faster development (no Anchor program deployment)
- ✅ Easier testing and debugging
- ✅ Centralized price oracle control (simpler for MVP)
- ✅ Flexible fee routing logic
- ✅ Easier to iterate and add features

**Trade-offs**:
- ⚠️ Backend has mint authority (centralized trust)
- ⚠️ Users must trust backend to mint correct amount
- ⚠️ Backend can become single point of failure

**Migration Path (V2)**:
- Move escrow logic to Anchor smart contract
- Use Pyth oracle for on-chain price feeds
- Transfer mint authority to program-derived address (PDA)
- Keep Django as indexer/API layer only

---

## Technology Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite 4.2** - Build tool
- **@solana/web3.js 1.98** - Solana SDK
- **@solana/spl-token 0.4.9** - SPL token operations
- **@coral-xyz/anchor 0.30.1** - Anchor framework (future)
- **Phantom Wallet Adapter** - Wallet integration
- **Framer Motion** - Animations
- **Tailwind CSS + shadcn/ui** - Styling

### Backend
- **Django 5.1.3** - Web framework
- **Django REST Framework 3.15** - API
- **PostgreSQL 17** - Database
- **Redis 7.4** - Caching
- **Celery 5.4** - Background tasks
- **Python Solana SDK 0.34.3** - Blockchain interaction
- **solders 0.21.0** - Rust-backed Solana primitives
- **Gunicorn 23** - WSGI server

### Blockchain
- **Solana Devnet** - Development blockchain
- **SPL Token Program** - Token standard
- **Metaplex (future)** - For cNFT implementation

### Infrastructure
- **Docker + Docker Compose** - Containerization
- **Nginx / Whitenoise** - Static file serving
- **GitHub Actions** - CI/CD (future)

---

## System Components

### 1. Django Apps

#### `gold_exchange` (Core Exchange Logic)
```
src/gold_exchange/
├── __init__.py
├── apps.py
├── models.py              # Database models
├── views.py               # REST API endpoints
├── serializers.py         # DRF serializers
├── services.py            # GoldTokenService (Solana logic)
├── utils.py               # PriceOracle, validators
├── urls.py                # URL routing
├── admin.py               # Django admin interface
└── management/
    └── commands/
        └── init_gold_token.py  # Token initialization
```

**Key Files**:
- `models.py`: GoldTransaction, SystemWallet, ExchangeQuote
- `services.py`: GoldTokenService class (minting, burning, fees)
- `views.py`: API endpoints (quote, buy, sell, balance)
- `utils.py`: PriceOracle for live gold/SOL prices

### 2. Frontend Components

```
assets/src/components/
├── WalletContextProvider.tsx    # Phantom wallet integration
├── WalletButton.tsx             # Connect wallet button
├── WalletInfo.tsx               # Display wallet info
├── GoldPrice.tsx                # Live gold price display
├── GoldExchange.tsx             # [TO BUILD] Buy/sell interface
├── GoldTokenBalance.tsx         # [TO BUILD] sGOLD balance
└── ...
```

### 3. Solana Program Components

**System Wallets** (stored in `SystemWallet` model):
- **Mint Authority**: Controls sGOLD token minting (backend keypair)
- **Treasury**: Receives 3% fees from transactions
- **Dev Fund**: Receives 2% fees from transactions
- **Liquidity Pool**: Holds SOL reserves for buy/sell operations

**SPL Token**:
- **Mint Address**: Unique identifier for sGOLD token
- **Decimals**: 2 (100 base units = 1.00 sGOLD = $10 gold)
- **Supply**: Unlimited (minted on-demand based on SOL deposits)

---

## Transaction Flow

### Buy sGOLD (Step-by-Step)

```
1. Frontend: User inputs 1.5 SOL
   ├─> POST /api/v1/gold/quote {"sol_amount": "1.5", "action": "buy"}
   └─> Backend calculates:
       ├─> Fetch gold price: $2023.45/oz
       ├─> Fetch SOL price: $20.00
       ├─> Calculate token amount: 1.5 SOL = $30 = ~148.50 sGOLD
       ├─> Deduct fees: 3% treasury ($0.90) + 2% dev ($0.60)
       └─> Return quote: {quote_id, expires in 30s}

2. Frontend: User reviews quote and clicks "Buy"
   ├─> POST /api/v1/gold/buy/initiate {wallet_address, quote_id}
   └─> Backend creates:
       ├─> GoldTransaction record (status: pending)
       ├─> Transaction instructions:
       │   ├─> Transfer 1.425 SOL → Liquidity Pool
       │   ├─> Transfer 0.045 SOL → Treasury
       │   └─> Transfer 0.030 SOL → Dev Fund
       └─> Return {exchange_id, transaction_details}

3. Frontend: Phantom wallet popup
   ├─> User reviews transaction (sees 3 transfers)
   ├─> User approves and signs
   └─> Transaction serialized to base64

4. Frontend: Submit signed transaction
   ├─> POST /api/v1/gold/buy/confirm {exchange_id, signed_transaction}
   └─> Backend processes:
       ├─> Update status: processing
       ├─> Submit transaction to Solana network
       ├─> Wait for confirmation (~2 seconds)
       ├─> Verify SOL received on-chain
       ├─> Mint 148.50 sGOLD to user's ATA
       ├─> Update status: completed
       └─> Return {tx_signature, sgold_minted}

5. Frontend: Display success
   └─> "Successfully purchased 148.50 sGOLD!"
       Transaction: https://explorer.solana.com/tx/{signature}?cluster=devnet
```

### Sell sGOLD (To Be Implemented)

Similar flow but in reverse:
1. User specifies sGOLD amount to sell
2. Backend calculates SOL to return (minus fees)
3. User signs burn transaction
4. Backend verifies burn, sends SOL from liquidity pool

---

## Key Concepts

### 1. SPL Tokens (Solana Program Library)

**What are SPL tokens?**
- Solana's equivalent to Ethereum's ERC-20
- Standard token format on Solana blockchain
- Ultra-fast (400ms block time) and cheap (~$0.00025 per transaction)

**sGOLD Token Structure**:
```
Mint Address: <generated on init>
Decimals: 2
Name: Solana Gold
Symbol: sGOLD
Supply: Unlimited (minted on demand)

Example balances:
- 10000 base units = 100.00 sGOLD = $1000 worth of gold
- 150 base units = 1.50 sGOLD = $15 worth of gold
```

### 2. Associated Token Accounts (ATAs)

**What is an ATA?**
- Every user needs an "associated token account" to hold SPL tokens
- Derived deterministically from: `derive_ata(user_wallet, mint_address)`
- Created automatically when user first receives tokens

**Why ATAs?**
- One ATA per user per token type
- Prevents duplicate accounts
- Consistent addresses across all transactions

### 3. Quote System & Expiration

**Why quotes expire?**
- Gold price volatility: Price can change in seconds
- Prevents price manipulation: User can't lock in price indefinitely
- Slippage protection: If price moves >1% during quote, transaction rejected

**Quote Lifecycle**:
```
1. Created → expires_at = now + 30 seconds
2. Used in transaction → used = true
3. Expired → is_valid = false
4. Cannot be reused (prevents replay attacks)
```

### 4. Fee Structure

**Buy Transaction Fees** (on SOL amount):
```
Total SOL: 1.5
├─> Treasury Fee: 0.045 SOL (3%)
├─> Dev Fund Fee: 0.030 SOL (2%)
└─> Liquidity Pool: 1.425 SOL (95%)

Tokens minted based on: 1.425 SOL worth of gold
```

**Sell Transaction Fees** (planned):
```
Burn: 100 sGOLD
├─> Calculate SOL value: ~1.01 SOL
├─> Treasury Fee: 0.030 SOL (3%)
├─> Burn Fee: 2% of tokens
└─> User receives: 0.98 SOL
```

### 5. Price Oracle

**Current Implementation**:
- Fetches live prices from CoinGecko API
- 60-second caching in Redis
- Multiple API fallbacks for reliability

**APIs Used**:
```python
Gold:
  - CoinGecko (PAX Gold proxy)
  - Metals.live API
  - Fallback: $2023.45

SOL:
  - CoinGecko Solana endpoint
  - Fallback: $20.00
```

**Future (V2)**: Integrate Pyth Network on-chain oracle

---

## Development Setup

### Prerequisites

- Docker Desktop
- Node.js 20.18+ (for local development)
- Python 3.13+ (for local development)
- Solana CLI (for token creation)
- Phantom Wallet browser extension

### Initial Setup

1. **Clone repository**:
   ```bash
   git clone <repo>
   cd solana_gold
   ```

2. **Configure environment**:
   ```bash
   # .env file already has defaults for devnet
   # No changes needed for local development
   ```

3. **Build and start services**:
   ```bash
   docker-compose build
   docker-compose up
   ```

4. **Run database migrations**:
   ```bash
   docker-compose exec web python manage.py migrate
   ```

5. **Initialize Solana token** (one-time setup):
   ```bash
   docker-compose exec web python manage.py init_gold_token

   # Follow prompts:
   # 1. Fund mint authority with devnet SOL (use faucet)
   # 2. Create SPL token with: spl-token create-token --decimals 2
   # 3. Copy mint address and wallets to .env
   ```

6. **Update .env with token details**:
   ```bash
   SGOLD_MINT_ADDRESS=<your_mint_address>
   MINT_AUTHORITY_KEYPAIR=<from_init_command>
   TREASURY_WALLET=<from_init_command>
   DEV_FUND_WALLET=<from_init_command>
   LIQUIDITY_WALLET=<from_init_command>
   ```

7. **Restart services**:
   ```bash
   docker-compose down
   docker-compose up
   ```

8. **Access application**:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000
   - Admin: http://localhost:8000/admin

### Development Workflow

**Backend Changes**:
```bash
# Django auto-reloads in dev mode
# Edit files in src/gold_exchange/
# Changes reflect immediately (no restart needed)
```

**Frontend Changes**:
```bash
# Vite HMR (Hot Module Replacement)
# Edit files in assets/src/
# Changes reflect immediately in browser
```

**Database Changes**:
```bash
# After modifying models.py
docker-compose exec web python manage.py makemigrations gold_exchange
docker-compose exec web python manage.py migrate
```

**View Logs**:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f worker
```

### Common Commands

```bash
# Django shell
docker-compose exec web python manage.py shell

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Check system health
docker-compose exec web python manage.py check

# Run tests (when implemented)
docker-compose exec web python manage.py test gold_exchange

# Reset database (careful!)
docker-compose down -v
docker-compose up
docker-compose exec web python manage.py migrate
```

---

## API Documentation

### Base URL
```
Development: http://localhost:8000/api/v1/gold/
Production: https://your-domain.com/api/v1/gold/
```

### Endpoints

#### 1. Get Quote
```http
POST /api/v1/gold/quote
Content-Type: application/json

Request:
{
  "sol_amount": "1.5",
  "action": "buy"
}

Response (200 OK):
{
  "quote_id": "abc-123-...",
  "sol_amount": "1.5",
  "sgold_amount": "148.50",
  "gold_price_usd": "2023.45",
  "sol_price_usd": "20.00",
  "fees": {
    "treasury": 0.045,
    "dev_fund": 0.030,
    "total_fee_sol": 0.075
  },
  "net_sol_to_liquidity": "1.425",
  "exchange_rate": "1 sGOLD unit = $10 worth of gold",
  "expires_in": 30,
  "expires_at": "2025-10-01T12:35:00Z"
}

Errors:
- 400: Invalid sol_amount or action
- 500: Failed to fetch prices
```

#### 2. Initiate Buy
```http
POST /api/v1/gold/buy/initiate
Content-Type: application/json

Request:
{
  "wallet_address": "7xK3H5...",
  "quote_id": "abc-123-..."
}

Response (200 OK):
{
  "exchange_id": 123,
  "transaction": {
    "instructions": [
      {
        "type": "transfer",
        "from": "7xK3H5...",
        "to": "LiquidityPool...",
        "amount_sol": 1.425,
        "description": "Transfer to liquidity pool"
      },
      {
        "type": "transfer",
        "from": "7xK3H5...",
        "to": "Treasury...",
        "amount_sol": 0.045,
        "description": "Treasury fee"
      },
      {
        "type": "transfer",
        "from": "7xK3H5...",
        "to": "DevFund...",
        "amount_sol": 0.030,
        "description": "Development fund fee"
      }
    ],
    "total_sol": 1.5,
    "expected_sgold": 148.50
  },
  "expires_at": "2025-10-01T12:35:00Z"
}

Errors:
- 400: Invalid wallet address
- 404: Quote not found
- 400: Quote expired or already used
```

#### 3. Confirm Buy
```http
POST /api/v1/gold/buy/confirm
Content-Type: application/json

Request:
{
  "exchange_id": 123,
  "signed_transaction": "base64_encoded_transaction..."
}

Response (200 OK):
{
  "status": "completed",
  "tx_signature": "5j2K3H...",
  "mint_tx_signature": "8mP9L...",
  "sgold_minted": 148.50,
  "user_ata": "9mP1Q...",
  "message": "Successfully purchased 148.50 sGOLD tokens"
}

Errors:
- 400: Transaction not pending
- 400: Quote expired
- 400: Failed to verify payment
- 500: Minting failed
```

#### 4. Get Balance
```http
GET /api/v1/gold/balance/{wallet_address}

Response (200 OK):
{
  "wallet_address": "7xK3H5...",
  "sgold_balance": 148.50,
  "estimated_usd_value": 1485.00,
  "sol_balance": 5.23,
  "recent_transactions": [
    {
      "id": 123,
      "transaction_type": "buy",
      "sol_amount": "1.5",
      "token_amount": "148.50",
      "status": "completed",
      "tx_signature": "5j2K3H...",
      "created_at": "2025-10-01T12:34:56Z"
    }
  ]
}

Errors:
- 400: Invalid wallet address
- 500: Failed to fetch balance
```

#### 5. Get Current Prices
```http
GET /api/v1/gold/price

Response (200 OK):
{
  "gold_price_usd": 2023.45,
  "sol_price_usd": 20.00,
  "sgold_value_sol": 1.01,
  "last_updated": "2025-10-01T12:34:56Z"
}

Errors:
- 500: Failed to fetch prices
```

---

## Database Schema

### Core Tables

#### `gold_exchange_systemwallet`
Stores system wallet information.

```sql
CREATE TABLE gold_exchange_systemwallet (
    id SERIAL PRIMARY KEY,
    wallet_type VARCHAR(20) UNIQUE NOT NULL,  -- mint_authority, treasury, dev_fund, liquidity
    public_key VARCHAR(44) NOT NULL,
    encrypted_private_key TEXT,  -- Only for mint_authority
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

**Example Data**:
```
wallet_type: mint_authority
public_key: 7xK3H5...
encrypted_private_key: [base58 encoded]
```

#### `gold_exchange_goldtransaction`
Records all buy/sell transactions.

```sql
CREATE TABLE gold_exchange_goldtransaction (
    id SERIAL PRIMARY KEY,
    user_wallet VARCHAR(44) NOT NULL,
    transaction_type VARCHAR(4) NOT NULL,  -- buy, sell
    sol_amount DECIMAL(20,9) NOT NULL,
    token_amount DECIMAL(20,2) NOT NULL,
    gold_price_usd DECIMAL(10,2) NOT NULL,
    sol_price_usd DECIMAL(10,2) NOT NULL,
    fees_collected DECIMAL(20,9) DEFAULT 0,
    treasury_fee DECIMAL(20,9) DEFAULT 0,
    dev_fee DECIMAL(20,9) DEFAULT 0,
    tx_signature VARCHAR(88) UNIQUE,
    user_token_account VARCHAR(44),
    status VARCHAR(10) NOT NULL,  -- pending, processing, completed, failed
    status_message TEXT,
    quote_id VARCHAR(36),
    quote_expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP
);

CREATE INDEX idx_user_wallet ON gold_exchange_goldtransaction(user_wallet, created_at DESC);
CREATE INDEX idx_status ON gold_exchange_goldtransaction(status, created_at DESC);
CREATE INDEX idx_tx_signature ON gold_exchange_goldtransaction(tx_signature);
```

**Status Flow**:
```
pending → processing → completed
                    ↘ failed
```

#### `gold_exchange_exchangequote`
Temporary quotes with expiration.

```sql
CREATE TABLE gold_exchange_exchangequote (
    quote_id VARCHAR(36) PRIMARY KEY,
    user_wallet VARCHAR(44) NOT NULL,
    action VARCHAR(4) NOT NULL,  -- buy, sell
    sol_amount DECIMAL(20,9) NOT NULL,
    token_amount DECIMAL(20,2) NOT NULL,
    gold_price_usd DECIMAL(10,2) NOT NULL,
    sol_price_usd DECIMAL(10,2) NOT NULL,
    treasury_fee DECIMAL(20,9) NOT NULL,
    dev_fee DECIMAL(20,9) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_expires_at ON gold_exchange_exchangequote(expires_at);
CREATE INDEX idx_used ON gold_exchange_exchangequote(used);
```

**Cleanup Job** (planned):
```python
# Delete expired quotes older than 1 hour
ExchangeQuote.objects.filter(
    expires_at__lt=timezone.now() - timedelta(hours=1)
).delete()
```

---

## Security Considerations

### Critical Security Measures

#### 1. Private Key Protection
- ⚠️ **NEVER commit private keys to git**
- ⚠️ **NEVER log private keys**
- ⚠️ Store mint authority keypair encrypted in database
- 🔒 Use environment variables for sensitive data
- 🔒 In production: Use AWS Secrets Manager or HashiCorp Vault

#### 2. Transaction Verification
```python
# Always verify SOL payment on-chain before minting
def verify_sol_payment(tx_signature):
    tx_info = client.get_transaction(tx_signature)
    if tx_info.meta.err is not None:
        raise ValueError("Transaction failed")
    # Verify transfers to correct wallets
    # Verify correct amounts
    return True
```

#### 3. Quote Expiration & Replay Protection
- Quotes expire after 30 seconds
- Used quotes cannot be reused
- Prevents price manipulation and replay attacks

#### 4. Input Validation
```python
# Validate all user inputs
- Wallet addresses (base58, 32 bytes)
- SOL amounts (positive, reasonable limits)
- Quote IDs (valid UUID)
```

#### 5. Rate Limiting (To Implement)
```python
# DRF throttling
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/hour',      # Anonymous users
        'user': '100/hour',     # Authenticated users
        'burst': '5/minute',    # Burst protection
    }
}
```

#### 6. CSRF Protection
- Django CSRF tokens for all POST requests
- Frontend must include CSRF token in headers

#### 7. Database Security
- Atomic transactions for minting operations
- Foreign key constraints
- Indexes for performance
- Regular backups

### Security Audit Checklist (Pre-Production)

- [ ] Private keys stored in secure vault (not .env)
- [ ] All inputs validated and sanitized
- [ ] Rate limiting enabled on all endpoints
- [ ] HTTPS enforced (no HTTP)
- [ ] CORS configured for production domain only
- [ ] SQL injection prevention (use ORM, not raw SQL)
- [ ] XSS prevention (React auto-escapes)
- [ ] Transaction verification logic audited
- [ ] Fee calculation logic audited
- [ ] Error messages don't leak sensitive info
- [ ] Logging configured (no private keys logged)
- [ ] Monitoring and alerts set up
- [ ] Incident response plan documented

---

## Testing Strategy

### Unit Tests (To Implement)

```python
# tests/test_services.py
class GoldTokenServiceTest(TestCase):
    def test_calculate_token_amount(self):
        service = GoldTokenService()
        gold_price = Decimal('2000')
        sol_price = Decimal('20')
        sol_amount = Decimal('1.0')

        token_amount = service.calculate_token_amount(
            sol_amount, gold_price, sol_price
        )

        # 1 SOL = $20, $20 / $2000/oz = 0.01 oz
        # 0.01 oz * $2000 / $10 per token = 2.0 tokens
        self.assertEqual(token_amount, Decimal('2.00'))

    def test_calculate_fees(self):
        service = GoldTokenService()
        sol_amount = Decimal('1.0')

        treasury, dev, net = service.calculate_fees(sol_amount, 'buy')

        self.assertEqual(treasury, Decimal('0.03'))  # 3%
        self.assertEqual(dev, Decimal('0.02'))       # 2%
        self.assertEqual(net, Decimal('0.95'))       # 95%
```

### Integration Tests (Devnet)

```bash
# Test full buy flow
1. Fund test wallet with devnet SOL
2. Call /api/v1/gold/quote
3. Call /api/v1/gold/buy/initiate
4. Sign transaction with test keypair
5. Call /api/v1/gold/buy/confirm
6. Verify sGOLD balance increased
7. Verify SOL transferred to system wallets
```

### Load Testing (Before Production)

```bash
# Use locust or k6 for load testing
# Target: 100 concurrent users
# Simulate realistic buy/sell patterns
# Monitor: Response time, error rate, database performance
```

### Manual Testing Checklist

- [ ] Connect Phantom wallet (devnet)
- [ ] Get quote with various SOL amounts
- [ ] Quote expires after 30 seconds
- [ ] Buy sGOLD (full flow)
- [ ] Verify transaction on Solana Explorer
- [ ] Check sGOLD balance appears correctly
- [ ] Verify SOL deducted from wallet
- [ ] Verify fees routed to correct wallets
- [ ] Test with insufficient balance
- [ ] Test with expired quote
- [ ] Test with used quote (should fail)
- [ ] Disconnect wallet mid-transaction
- [ ] Network error handling

---

## Deployment

### Environment Configuration

#### Development (.env)
```bash
DEBUG=true
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
# Test wallets, low security requirements
```

#### Production (.env.production)
```bash
DEBUG=false
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Use custom RPC (Alchemy, QuickNode) for reliability
# Private keys in Secrets Manager (not .env!)
ALLOWED_HOSTS=your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com
```

### Deployment Steps (Production)

1. **Pre-deployment Checklist**:
   - [ ] All tests passing
   - [ ] Security audit completed
   - [ ] Private keys in secure vault
   - [ ] Database backups configured
   - [ ] Monitoring/alerts set up
   - [ ] Rate limiting enabled
   - [ ] HTTPS configured

2. **Database Migration**:
   ```bash
   python manage.py migrate --check
   python manage.py migrate
   ```

3. **Collect Static Files**:
   ```bash
   python manage.py collectstatic --noinput
   ```

4. **Deploy Application**:
   ```bash
   # Railway, Heroku, or custom server
   git push production main
   ```

5. **Post-deployment Verification**:
   - [ ] Health check endpoint returns 200
   - [ ] Can connect Phantom wallet
   - [ ] Can get quote (small amount first!)
   - [ ] Test buy with small amount (0.01 SOL)
   - [ ] Monitor logs for errors
   - [ ] Check Solana Explorer for transactions

### Monitoring

**Metrics to Track**:
- Total sGOLD supply
- Total SOL in liquidity pool
- Fees collected (treasury / dev)
- Transaction volume (buy/sell)
- Average transaction size
- Failed transaction rate
- API response times
- Database query performance
- Price oracle uptime

**Alerts to Configure**:
- Mint authority balance low (<0.1 SOL)
- Failed transaction rate >5%
- API response time >2 seconds
- Price oracle failure (fallback prices in use)
- Unusual transaction patterns (potential exploit)

---

## Troubleshooting

### Common Issues

#### 1. `ModuleNotFoundError: No module named 'solders'`

**Cause**: Python Solana packages not installed in Docker container

**Fix**:
```bash
docker-compose down
docker-compose build
docker-compose up
```

#### 2. `Node version incompatible` (Error during build)

**Cause**: Dockerfile uses Node 20.6, but @solana packages require 20.18+

**Fix**: Update Dockerfile:
```dockerfile
FROM node:20.18.0-bookworm-slim AS assets
```

#### 3. Quote expired error

**Cause**: User took longer than 30 seconds from quote to confirm

**Fix**: Request new quote (quotes expire for security)

#### 4. "Insufficient balance" error

**Cause**: User wallet doesn't have enough SOL

**Fix**: Fund wallet from Solana faucet (devnet) or buy SOL (mainnet)

#### 5. "Failed to verify payment" error

**Cause**: SOL transaction failed on-chain or didn't reach system wallets

**Fix**: Check Solana Explorer for transaction details, verify wallet addresses correct

#### 6. Mint authority out of SOL

**Symptom**: Minting transactions fail

**Fix**: Fund mint authority wallet with SOL for transaction fees

#### 7. ATA creation failed

**Cause**: User doesn't have ATA yet, and creation failed

**Fix**: Ensure mint authority has sufficient SOL to pay for ATA rent (~0.002 SOL)

---

## Future Roadmap

### V1.1 (Current Sprint)
- [ ] Complete frontend React components
- [ ] End-to-end testing on devnet
- [ ] Basic monitoring dashboard

### V1.2 (Short-term)
- [ ] Sell sGOLD functionality
- [ ] Transaction history page
- [ ] Price charts and analytics
- [ ] Mobile responsive design

### V2.0 (Mid-term)
- [ ] Anchor smart contract (on-chain escrow)
- [ ] Pyth oracle integration (on-chain prices)
- [ ] Liquidity pool (AMM) for decentralized trading
- [ ] LP token rewards

### V3.0 (Long-term)
- [ ] Gold cNFT certificates for large holders
- [ ] Cross-chain bridge (Ethereum, BSC)
- [ ] Governance token ($SGOLD)
- [ ] DAO for fee distribution
- [ ] Physical gold redemption (via partners)

### Experimental Ideas
- [ ] Gold-backed NFT collectibles
- [ ] Gold lending/borrowing protocol
- [ ] Gold staking rewards
- [ ] Integration with DeFi protocols (Jupiter, Orca)

---

## Contributing

### Code Style

**Python**:
```bash
# Use Black formatter
black src/

# Use isort for imports
isort src/

# Run flake8 for linting
flake8 src/
```

**TypeScript/React**:
```bash
# Use ESLint
npm run lint

# Use Prettier
npm run format
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/add-sell-functionality

# Make changes, commit often
git add .
git commit -m "Add sell quote endpoint"

# Push and create PR
git push origin feature/add-sell-functionality
```

### Documentation Updates

**When to update this guide**:
- ✅ Adding new API endpoints
- ✅ Changing transaction flow
- ✅ Modifying fee structure
- ✅ Adding new system wallets
- ✅ Deploying to production
- ✅ Discovering security vulnerabilities
- ✅ Implementing V2/V3 features

**How to update**:
1. Edit `/DEVELOPER_GUIDE.md`
2. Keep examples up-to-date
3. Add migration notes for breaking changes
4. Update diagrams if architecture changes

---

## Resources

### Documentation
- [Solana Documentation](https://docs.solana.com/)
- [SPL Token Documentation](https://spl.solana.com/token)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Phantom Wallet Docs](https://docs.phantom.app/)

### Tools
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Solana Faucet](https://faucet.solana.com/)
- [SPL Token CLI](https://spl.solana.com/token#command-line-utility)

### Community
- [Solana Discord](https://discord.gg/solana)
- [Solana Stack Exchange](https://solana.stackexchange.com/)

---

## Changelog

### 2025-10-01 - Initial V1 Implementation
- ✅ Created Django gold_exchange app
- ✅ Implemented SPL token service layer
- ✅ Built REST API endpoints (quote, buy)
- ✅ Added price oracle with caching
- ✅ Set up Docker development environment
- ✅ Created comprehensive developer guide

### Future Updates
Track major changes here with date, version, and summary.

---

**Last Updated**: October 1, 2025
**Version**: 1.0.0
**Maintainers**: Add your name when contributing

---

> Remember: **Keep this documentation updated!** Future you (and other developers) will thank you. 🙏
