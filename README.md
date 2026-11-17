# Burger House — Stock Management System

Next.js 14 + MongoDB. Admin on/off කරන modules ටික විතරක් sidebar එකේ පේනවා.

## Setup

### 1. MongoDB
Free විකල්ප 2ක්:
- **MongoDB Atlas** (cloud, නොමිලේ): https://cloud.mongodb.com → free M0 cluster
- **Local install**: https://www.mongodb.com/try/download/community

### 2. Project

```bash
cd burger-stock
npm install
```

### 3. .env file

```bash
cp .env.example .env
```

`.env` file එකේ 2 lines වෙනස් කරන්න:

```
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/burger_stock"
AUTH_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**AUTH_SECRET** random string එකක් හදන්න:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Browser (local): `http://localhost:3000`  
Live (Vercel): https://burgerhouse-stock-management.vercel.app/

### 5. Setup Wizard

පළමු visit එකේදී setup wizard එකක් එනවා:
1. කඩේ නම, ඔයාගේ නම, username, password දාන්න
2. ඕන modules ටික tick කරන්න
3. "System එක හදන්න" click කරන්න

### 6. Demo දත්ත (optional)

Items, recipes, suppliers ටිකක් ඉබේම දාන්නේනම්:
```bash
npm run seed
```
*(setup wizard ඉවර කරලා ඉවරවෙලා run කරන්න)*

## Features

| Module | ඕන dependency |
|--------|--------------|
| Items & Ingredients | — |
| Recipes | Items |
| Purchasing | Items |
| Stock Control | Items |
| Wastage | Items + Stock |
| Stocktake | Items + Stock |
| Beverages | Items |
| Costing | Items + Stock |
| Sales | Items + Recipes + Stock |
| Reports | Items |
| Users & Security | — |
| Branches | Items |

## Roles

| Role | කරන්න පුළුවන් |
|------|--------------|
| OWNER | ඔක්කොම |
| MANAGER | Adjustments + approvals |
| STOREKEEPER | GRN + items + transfers |
| CHEF | Wastage + sales |
| VIEWER | Read only |

## POS Integration

Settings page එකේ API key එකක් බලන්න. POS system එකෙන් sales POST කරන්න:

```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY_HERE" \
  -d '{"lines":[{"recipe":"RECIPE_ID","qty":1}]}'
```
