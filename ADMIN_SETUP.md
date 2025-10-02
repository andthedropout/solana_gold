# Admin Dashboard Setup

## Creating an Admin User

To access the admin dashboard at `/admin`, you need a Django superuser account.

### Create a superuser:

```bash
docker-compose exec web python manage.py createsuperuser
```

You'll be prompted for:
- Username
- Email (optional)
- Password (enter twice)

### Access the Dashboard:

1. **Django Admin** (built-in): http://localhost:8000/admin
   - Login with your superuser credentials
   - Manage users, view database records

2. **Exchange Admin Dashboard**: http://localhost:8000/admin
   - Shows all wallet balances (Mint Authority, Treasury, Dev Fund, Liquidity)
   - Real-time SOL balances in SOL and USD
   - Transaction statistics (volume, fees collected, tokens minted)
   - Recent transaction history
   - Copy wallet addresses easily
   - Current gold/SOL prices

## Features

### Wallet Overview
- **Mint Authority**: Can mint sGOLD tokens (currently ~0.498 SOL)
- **Treasury**: Receives 3% fee from all purchases
- **Dev Fund**: Receives 2% fee from all purchases  
- **Liquidity**: Receives 95% of SOL from purchases

### Statistics
- Total transactions (completed/pending/failed)
- Total SOL volume traded
- Total sGOLD tokens minted
- Total fees collected in SOL and USD

### Security
- Only accessible to Django staff/superusers (`IsAdminUser` permission)
- Uses Django's built-in authentication system
- API endpoint: `/api/v1/gold/admin/dashboard`

## Example Output

The dashboard shows:
- Network: devnet
- Token Mint: 8334irmGo8SDWthrktpyk8SEpUFZxkT7J5zjgErycpFZ
- Current prices: Gold (~$3,873), SOL (~$219)
- All wallet addresses with copy buttons
- Real-time balances updated on refresh
