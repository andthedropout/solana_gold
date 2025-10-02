# Frontend Exchange Interface - Testing Guide

## ✅ What Was Built

### New Components Created
1. **GoldTokenBalance.tsx** - Displays user's sGOLD balance and USD value
2. **GoldExchange.tsx** - Main exchange interface for buying sGOLD
3. **API Service Layer** - Clean service for backend communication
4. **TypeScript Types** - Complete type definitions for API responses

### Updated Components
- **Homepage.tsx** - Integrated new exchange components (only visible when wallet connected)

---

## 🚀 How to Test

### 1. Check Your Browser Console

Once you reload localhost:5173, you should see:
- No TypeScript errors
- No import errors
- Components render properly

### 2. Visual Check (Before Wallet Connection)

You should see:
- ✅ "Solana Gold" header
- ✅ Gold price card
- ✅ "Connect Your Wallet" button
- ❌ **NO exchange interface yet** (only shows after connecting)

### 3. Connect Phantom Wallet

Click "Connect Phantom Wallet":
- Phantom popup should appear
- Approve the connection
- After connecting, you should see:
  - ✅ Wallet info (address, SOL balance)
  - ✅ **NEW: sGOLD Balance card**
  - ✅ **NEW: Exchange interface card**
  - ✅ Devnet SOL faucet link

### 4. Test Exchange Interface

**A. Quote Generation**:
1. Enter a SOL amount (e.g., "0.5")
2. Wait 500ms (debounce delay)
3. "Getting quote..." should appear
4. After 1-2 seconds, quote should display:
   - ✅ "You'll receive X sGOLD"
   - ✅ Exchange rate
   - ✅ Fee breakdown (3% treasury, 2% dev)
   - ✅ Current gold/SOL prices
   - ✅ Countdown timer (30 seconds)

**B. Quote Expiration**:
1. Wait for countdown to reach 0
2. Quote should disappear
3. Error: "Quote expired. Please try again."
4. Changing the SOL amount should fetch new quote

**C. Buy Transaction** (REQUIRES BACKEND SETUP):
1. Enter SOL amount
2. Wait for quote
3. Click "Buy X sGOLD for Y SOL" button
4. Status changes:
   - "Preparing transaction..."
   - "Waiting for signature..." (Phantom popup should appear)
   - "Confirming transaction..."
   - "Transaction successful!" (if all goes well)
5. Success message shows:
   - Amount of sGOLD purchased
   - Link to Solana Explorer
6. Balance card should update with new sGOLD balance

---

## 🐛 Expected Errors (Before Backend Setup)

### If Backend Not Running
**Error**: "Failed to get quote"
**Cause**: Backend API not accessible
**Fix**: Ensure `docker-compose up` is running and backend is healthy

### If Token Not Initialized
**Error**: "Failed to get balance" or errors in backend logs
**Cause**: Haven't run `init_gold_token` command yet
**Fix**: Run initialization (see next section)

### If Wallet Has No SOL
**Error**: Transaction will fail at Phantom signing
**Fix**: Get devnet SOL from faucet

---

## ⚙️ Backend Setup Required for Full Testing

### 1. Initialize Token (One-Time Setup)

```bash
# Run the initialization command
docker-compose exec web python manage.py init_gold_token

# Follow the prompts:
# 1. Fund mint authority wallet (use devnet faucet)
# 2. Create SPL token: spl-token create-token --decimals 2
# 3. Copy the output and update your .env file
```

### 2. Update Environment Variables

After running `init_gold_token`, update these in your `.env`:

```bash
SGOLD_MINT_ADDRESS=<your_mint_address>
MINT_AUTHORITY_KEYPAIR=<from_init_command>
TREASURY_WALLET=<from_init_command>
DEV_FUND_WALLET=<from_init_command>
LIQUIDITY_WALLET=<from_init_command>
```

Also update `assets/.env.local`:
```bash
VITE_SGOLD_MINT_ADDRESS=<your_mint_address>
```

### 3. Restart Services

```bash
docker-compose down
docker-compose up
```

### 4. Test API Endpoints Manually

```bash
# Test price endpoint
curl http://localhost:8000/api/v1/gold/price

# Test quote endpoint
curl -X POST http://localhost:8000/api/v1/gold/quote \
  -H "Content-Type: application/json" \
  -d '{"sol_amount": "1.0", "action": "buy"}'
```

---

## 🎯 Full End-to-End Test Checklist

- [ ] **Frontend loads without errors**
- [ ] **Gold price displays correctly**
- [ ] **Connect Phantom wallet successfully**
- [ ] **sGOLD Balance card appears (shows 0.00 initially)**
- [ ] **Exchange interface appears**
- [ ] **Enter SOL amount → Quote appears**
- [ ] **Quote shows correct calculations**
- [ ] **Countdown timer works (expires after 30s)**
- [ ] **Click "Buy sGOLD" button**
- [ ] **Phantom popup appears**
- [ ] **Approve transaction in Phantom**
- [ ] **Success message appears**
- [ ] **sGOLD balance updates**
- [ ] **SOL balance decreases**
- [ ] **Transaction link works (opens Solana Explorer)**
- [ ] **Can view transaction history in balance card**

---

## 🔧 Troubleshooting

### Components Not Showing After Connect

**Problem**: Exchange interface doesn't appear after connecting wallet

**Check**:
1. Open browser console - any errors?
2. Check network tab - are API calls failing?
3. Verify `connected` prop in WalletContextProvider

**Fix**: Check that `connected` state is properly set in WalletContextProvider

### Quote Not Loading

**Problem**: Stuck on "Getting quote..." forever

**Check**:
1. Backend logs: `docker-compose logs web`
2. Network tab: Is `/api/v1/gold/quote` returning 200?
3. CORS errors in console?

**Fix**:
- Ensure backend is running
- Check Django ALLOWED_HOSTS includes localhost
- Verify CORS settings

### Transaction Fails

**Problem**: Transaction fails at signing or confirmation

**Common Causes**:
1. **Insufficient SOL**: Get more from faucet
2. **Expired quote**: Quote expired while user was signing
3. **Backend error**: Check backend logs for details
4. **RPC node down**: Solana devnet having issues

**Fix**:
- Check wallet has sufficient SOL
- Try with smaller amount (0.1 SOL)
- Check Solana status: https://status.solana.com/

### Balance Doesn't Update

**Problem**: Purchased sGOLD but balance still shows 0.00

**Cause**:
- Transaction might still be confirming
- Balance refresh not triggered

**Fix**:
- Wait 5 seconds and click refresh button
- Check transaction on Solana Explorer (link in success message)
- Manually refresh page

---

## 📊 What the UI Should Look Like

```
┌────────────────────────────────────────┐
│        Solana Gold (Header)             │
│   Crypto meets precious metals          │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│     Live Gold Price                     │
│         $2,023.45                       │
│   per troy ounce                        │
│     +$15.30 (0.76%)                     │
│     [Refresh Price]                     │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│     Connect Your Wallet                 │
│  [Connect Phantom Wallet]               │
└────────────────────────────────────────┘

--- After Connecting Wallet ---

┌────────────────────────────────────────┐
│   Wallet Info                           │
│   Address: 7xK3...H5mP                  │
│   Balance: 5.2345 SOL                   │
│   Network: Devnet                       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 💰 sGOLD Balance              [Refresh] │
│                                         │
│            0.00                         │
│         sGOLD tokens                    │
│                                         │
│ Estimated Value: $0.00                  │
│ SOL Balance: 5.2345 SOL                 │
│                                         │
│ 1 sGOLD = $10 worth of gold            │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🔄 Exchange                             │
│                                         │
│ [Buy sGOLD] [Sell sGOLD (disabled)]    │
│                                         │
│ Amount (SOL)                            │
│ [ 0.5________________ ]                 │
│                                         │
│ ┌──────────────────────────────────┐  │
│ │ You'll receive: 9.88 sGOLD       │  │
│ │ Exchange rate: 1 SOL = 19.76 sGOLD│ │
│ │ Treasury Fee (3%): 0.015 SOL     │  │
│ │ Dev Fund (2%): 0.010 SOL         │  │
│ │ Total Fees: 0.025 SOL            │  │
│ │ Gold: $2,023.45/oz SOL: $20.00   │  │
│ │ ⏱ Expires in 28s                  │  │
│ └──────────────────────────────────┘  │
│                                         │
│ [Buy 9.88 sGOLD for 0.5 SOL]          │
│                                         │
│ ℹ️ Quotes expire after 30 seconds...   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Need devnet SOL?                        │
│ Visit https://faucet.solana.com/       │
└────────────────────────────────────────┘
```

---

## 🎉 Success Criteria

Your implementation is working correctly when:

1. ✅ All components render without errors
2. ✅ Wallet connection works smoothly
3. ✅ Balance card shows up-to-date information
4. ✅ Quotes generate automatically as you type
5. ✅ Countdown timer works correctly
6. ✅ Transaction flow completes successfully
7. ✅ Success message displays with Explorer link
8. ✅ Balance updates after purchase
9. ✅ Error messages display clearly
10. ✅ Responsive design works on mobile

---

## 📝 Next Steps After Testing

Once everything works:

1. **Test edge cases**:
   - Very large SOL amounts
   - Very small SOL amounts (0.001 SOL)
   - Rapid quote regeneration
   - Multiple transactions in sequence

2. **Performance testing**:
   - Check loading times
   - Monitor memory usage
   - Test with slow network

3. **User experience**:
   - Add animations for state transitions
   - Improve error messages
   - Add tooltips for fees
   - Mobile responsive testing

4. **Future enhancements** (V1.2):
   - Transaction history page
   - Price charts
   - Sell functionality
   - Advanced order types

---

**Happy Testing! 🚀**

If you encounter any issues not covered here, check:
- Browser console for errors
- `docker-compose logs web` for backend errors
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for architecture details
