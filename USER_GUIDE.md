# Burger House Stock — User Guide

A step-by-step guide to using the stock management system. Each section explains **what** a feature does, **who** can use it, and **how** to use it with practical examples.

---

## Table of contents

1. [Introduction](#1-introduction)
2. [First-time setup](#2-first-time-setup)
3. [Logging in](#3-logging-in)
4. [Language (English / Sinhala)](#4-language-english--sinhala)
5. [Dashboard (Home)](#5-dashboard-home)
6. [Items & Ingredients](#6-items--ingredients)
7. [Recipes](#7-recipes)
8. [Purchasing](#8-purchasing)
9. [Stock Control](#9-stock-control)
10. [Wastage](#10-wastage)
11. [Stocktake](#11-stocktake)
12. [Beverages](#12-beverages)
13. [Costing](#13-costing)
14. [Sales](#14-sales)
15. [Reports](#15-reports)
16. [Users & Security](#16-users--security)
17. [Branches & Locations](#17-branches--locations)
18. [Settings](#18-settings)
19. [User roles & permissions](#19-user-roles--permissions)
20. [Daily workflow example](#20-daily-workflow-example)
21. [POS API (external sales)](#21-pos-api-external-sales)

---

## 1. Introduction

**Burger House Stock** helps a burger shop (or similar kitchen) track:

- What you buy (items & ingredients)
- What you have on hand (stock)
- What goes into each dish (recipes)
- What you waste, sell, and spend (wastage, sales, costing)
- Who did what (users & audit log)

The left sidebar shows only the **features you turned on** in Settings. If you do not see a menu item, enable that module in **Settings → Features**.

**Typical flow:**

```
Items → Recipes → Purchasing (goods in) → Stock → Sales / Wastage → Reports
```

---

## 2. First-time setup

You only do this once when the system is new.

### Step 1 — Shop details

1. Open the app in your browser (e.g. `http://localhost:3000`).
2. You are taken to the **Setup** wizard automatically.
3. Fill in:
   - **Shop name** — e.g. `Burger House`
   - **Your name** — e.g. `Admin`
   - **Username** — e.g. `admin`
   - **Password** — at least 6 characters, e.g. `burger123`
4. Click **Next**.

### Step 2 — Choose features

1. Turn on the modules you need (you can change these later in Settings).
2. **Items** and **Users** are always on (required).
3. Recommended for a burger shop:
   - Items, Recipes, Purchasing, Stock, Wastage, Sales, Reports
4. Click **Set up system**.

The system creates:

- Your owner account
- A default location: **Main Store**
- Default categories: Meat, Buns & Bakery, Vegetables, Sauces, Dairy, Beverages, Packaging, etc.

### Optional — Sample data

If you want demo data (15 items, 4 recipes, 2 suppliers), an administrator can run from the project folder:

```bash
npm run seed
```

This adds items like Beef Patty, Sesame Burger Bun, Cheese Burger recipe, and suppliers Keells Super and Prima Bakery.

---

## 3. Logging in

1. Go to the login page.
2. Enter your **username** and **password**.
3. Click **Sign in**.

You stay logged in for 30 days. To log out, use the logout icon at the bottom of the sidebar.

**Example**

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `burger123`|

---

## 4. Language (English / Sinhala)

The app supports **English** and **සිංහල (Sinhala)**.

### On login / setup

- Use the **English | සිංහල** toggle at the top-right of the form.
- Your choice is remembered for next time.

### After logging in

- Use the same toggle at the **bottom of the sidebar** (above Settings).
- Change is instant — sidebar, page titles, and buttons update together.

### In Settings

- You can also set **Language** under Shop details and click **Save**.

Item names can have both English and Sinhala names; the app shows the right name based on your language.

---

## 5. Dashboard (Home)

**Menu:** Home (first item in sidebar)

**Purpose:** Quick overview of what needs attention today.

### What you see

| Card / section      | Meaning                                      |
|---------------------|----------------------------------------------|
| Out of stock        | Items at zero quantity                       |
| Running low         | Items at or below reorder level              |
| Expiring soon       | Batches nearing expiry                       |
| Total items         | Active items in the system                   |
| Order these now     | List of low/out items with reorder levels    |
| Expiring soon       | Batches with expiry dates coming up          |
| Stock value         | Total value of stock on hand                 |
| Wastage (30 days)   | Cost of waste in the last 30 days            |
| Food cost (30 days) | Ingredient cost as % of sales (if Sales on)  |
| Quick actions       | Shortcuts to enabled modules                 |

### Example

If beef patties drop below the reorder level, **Running low** shows `1` and **Order these now** lists:

> Beef Patty 120g — Min level 60 pcs — **45 pcs**

Click the card or list row to open **Stock Control** filtered to that state.

---

## 6. Items & Ingredients

**Menu:** Items & Ingredients

**Purpose:** Master list of everything you buy, store, and use — buns, patties, sauce, cups, drinks, packaging.

**Who can add/edit:** Owner, Manager, Storekeeper

### 6.1 Add a new item

1. Click **Add item**.
2. Fill in the form:

| Field              | Example              | Notes                                      |
|--------------------|----------------------|--------------------------------------------|
| Code               | `BUN-01`             | Short unique code                          |
| Name (English)     | `Sesame Burger Bun`  |                                            |
| Sinhala name       | `බර්ගර් බනිස්`        | Optional                                   |
| Category           | Buns & Bakery        |                                            |
| Type               | Raw ingredient       | Raw / Semi / Finished / Non-food           |
| Stock unit         | `pcs`                | pcs, g, kg, ml, L, etc.                    |
| Reorder level      | `80`                 | Alert when stock falls to this             |
| Default location   | Main Store           |                                            |
| Cost per unit      | `45`                 | Rs. per piece (updates when goods received)|
| Opening quantity   | `200`                | Only when creating — sets initial stock    |

3. Click **Save**.

**Example — Chicken breast (sold by weight)**

| Field        | Value   |
|--------------|---------|
| Code         | CHK-01  |
| Unit         | g       |
| Cost         | 1.65    | Rs. per gram |
| Yield %      | 82      | After trimming, 82% is usable |
| Track expiry | Yes     |

### 6.2 Beverage item

When adding a drink:

1. Tick **This is a beverage**.
2. Set **Container** (Bottle / Can / Keg / Draft).
3. Set **Size (ml)** and **Empty container deposit** if applicable.

The item will also appear on the **Beverages** page.

### 6.3 Search and filter

- Type in the search box to find by **name or code**.
- Use the category dropdown to filter by type (Meat, Dairy, etc.).

### 6.4 Edit an item

Click any row in the table to open the edit form. You can change name, reorder level, cost, etc.

**Note:** Stock quantity is changed by **Purchasing (GRN)**, **Sales**, **Wastage**, **Transfers**, and **Stocktake** — not usually by editing the item directly.

---

## 7. Recipes

**Menu:** Recipes

**Purpose:** Define what ingredients go into each dish. When you record a **sale**, the system deducts those ingredients from stock automatically.

**Requires:** Items module  
**Who can add/edit:** Owner, Manager, Storekeeper

### 7.1 Create a recipe

1. Click **Add recipe**.
2. Example — **Cheese Burger**:

| Field         | Value        |
|---------------|--------------|
| Name          | Cheese Burger|
| Type          | Menu item    |
| Selling price | 890          | Rs.          |
| Yield         | 1            | Portions per batch |

3. Under **Ingredients**, add each item and quantity:

| Ingredient        | Quantity |
|-------------------|----------|
| Sesame Burger Bun | 1 pcs    |
| Beef Patty 120g   | 1 pcs    |
| Cheddar Slice     | 1 pcs    |
| Lettuce           | 15 g     |
| Tomato            | 20 g     |
| Mayonnaise        | 12 ml    |
| Tomato Ketchup    | 10 ml    |
| Burger Box        | 1 pcs    |
| Napkin            | 2 pcs    |

4. Save. The card shows **Cost**, **Selling price**, and **Food cost %**.

### 7.2 Understanding the recipe card

- **Cost** — ingredient cost for one portion (from item costs).
- **Selling price** — what you charge the customer.
- **Food cost %** — cost ÷ price × 100.  
  - Green: under ~32%  
  - Amber: 32–40%  
  - Red: over 40% (consider raising price or reducing portion)

### 7.3 Sub-recipes

Use type **Sub-recipe** for items used inside other recipes (e.g. a house sauce batch that yields multiple portions).

---

## 8. Purchasing

**Menu:** Purchasing

**Purpose:** Manage suppliers, purchase orders, and **goods received (GRN)**. When you record goods received, **stock increases automatically**.

**Requires:** Items  
**Who can record GRN / PO:** Owner, Manager, Storekeeper

### Three tabs

| Tab            | Use for                          |
|----------------|----------------------------------|
| Received goods | GRN — stock came in              |
| Orders         | Purchase orders to suppliers     |
| Suppliers      | Supplier contact list            |

### 8.1 Add a supplier

1. Open **Suppliers** tab → **Add supplier**.
2. Example:

| Field           | Value          |
|-----------------|----------------|
| Name            | Keells Super   |
| Phone           | 011-2300000    |
| Payment terms   | 14 days        |

### 8.2 Record goods received (GRN) — most common

**Example:** Keells delivered beef patties and cheese.

1. Click **Goods arrived** (or **Record goods received**).
2. Fill in:
   - **From:** Keells Super
   - **Invoice number:** INV-2026-001
   - **Receive into:** Main Store
3. Add lines:

| Item            | Qty | Price (per unit) |
|-----------------|-----|------------------|
| Beef Patty 120g | 100 | 210              |
| Cheddar Slice   | 50  | 38               |

4. Optional: **Freight / other charges** — allocated across items.
5. Click **Add to stock**.

**Result:** Stock levels increase; item costs update; movement history records **Goods received**.

### 8.3 Create a purchase order

1. **Orders** tab → **Create order**.
2. Select supplier, needed-by date, location.
3. Add items and quantities.
4. Submit. Status can later be updated to Sent / Received.

---

## 9. Stock Control

**Menu:** Stock Control

**Purpose:** See current stock, filter by status, transfer between locations, and adjust quantities.

### 9.1 On-hand stock tab

- View all items with **quantity**, **min level**, **status** (In stock / Low / Out), and **value**.
- Filters: **All / Low / Out of stock**, and by **location**.
- Top banner shows **Total stock value**.

**Example:** Filter **Low** to see everything you should reorder.

### 9.2 Movements tab

History of every stock change: GRN, sales, wastage, transfers, adjustments, stocktake.

### 9.3 Transfer stock

**Who:** Owner, Manager, Storekeeper

**Example:** Move fries from Main Store to Kitchen.

1. Click **Transfer**.
2. Item: Frozen Fries  
3. From: Main Store → To: Kitchen  
4. Quantity: 5000 g  
5. Confirm.

### 9.4 Adjust quantity

**Who:** Owner, Manager only

Use when the count is wrong and you need a correction **with a reason**.

**Example:** Found 2 extra burger boxes after counting.

1. Click **Adjust quantity**.
2. Item: Burger Box  
3. Direction: **Increase**  
4. Quantity: 2 pcs  
5. Reason: `Miscounted during delivery check`  
6. Save.

---

## 10. Wastage

**Menu:** Wastage

**Purpose:** Record spoiled, burnt, dropped, or complimentary items so you know real food cost.

**Requires:** Items + Stock  
**Who can record:** Chef and above (Chef, Storekeeper, Manager, Owner)

### Record wastage

1. Click **Record wastage**.
2. Example:

| Field    | Value              |
|----------|--------------------|
| Item     | Sesame Burger Bun  |
| Location | Main Store         |
| Quantity | 2 pcs              |
| Reason   | Spoiled            |
| Notes    | Found mouldy       |

3. Save.

**Result:** Stock decreases; cost appears in **Total loss** and on the dashboard wastage summary.

### Wastage reasons

Expired, Spoiled, Cooking error, Customer return, Spillage, Staff meal, Complimentary, Other.

---

## 11. Stocktake

**Menu:** Stocktake

**Purpose:** Count stock by hand and compare with the system. Fix differences after approval.

**Requires:** Items + Stock  
**Who can count:** Chef and above  
**Who can approve:** Manager, Owner

### 11.1 Start a count

1. Click **Start new count**.
2. **Where to count:** Main Store  
3. **Category:** leave blank for all items, or pick e.g. Meat only  
4. Click **Create list**.

### 11.2 Enter counts

1. Open the stocktake from the list.
2. For each item, enter **Actual** count (leave blank to skip).
3. The system shows **System** vs **Actual** and **Difference**.
4. Click **Submit** when done.

### 11.3 Approve (Manager/Owner)

1. Review variances.
2. Click **Approve** — confirm that system stock will be adjusted to match your counts.

**Example:** System says 149 buns, you counted 147 → after approval, stock becomes 147.

---

## 12. Beverages

**Menu:** Beverages

**Purpose:** View drinks (bottles, cans, kegs) separately — on-hand quantity, value, and empty-bottle deposits.

**Requires:** Items (with **This is a beverage** ticked on the item)

No separate entry here — manage drinks on **Items**, then monitor them on this page.

**Example:** Coca-Cola 330ml Can — 96 pcs on hand, deposit value if applicable.

---

## 13. Costing

**Menu:** Costing

**Purpose:** Financial view — stock value, COGS, wastage loss, food cost %, theoretical vs actual usage, margin per menu item.

**Requires:** Items + Stock

### Key sections

| Section                    | What it tells you                                      |
|----------------------------|--------------------------------------------------------|
| Current stock value        | Total Rs. tied up in inventory                         |
| COGS (30 days)             | Cost of goods sold                                     |
| Wastage loss               | Money lost to waste                                    |
| Food cost %                | COGS as % of revenue                                   |
| Theoretical vs actual      | Recipe usage vs what actually left stock (variance)    |
| Margin by item             | Price, cost, margin, food cost % per recipe            |

**Example:** If theoretical usage is Rs. 50,000 but actual deductions were Rs. 55,000, the **gap** may indicate over-portioning, unrecorded waste, or theft.

Costing method (FIFO or Weighted average) is set in Settings and shown at the top of the page.

---

## 14. Sales

**Menu:** Sales

**Purpose:** Record customer sales. Each sale **deducts recipe ingredients** from stock.

**Requires:** Items + Recipes + Stock  
**Who can record:** Chef and above

### Record a sale manually

1. Click **Record sale**.
2. Tap recipes to add to cart — e.g.:
   - Cheese Burger × 2  
   - Regular Fries × 1  
   - Coca-Cola 330ml Can × 2  
3. Check **Total**.
4. Click **Save sale**.

**Result:** Sale appears in the list; stock of all recipe ingredients decreases.

### Summary cards

- **Sales** — total revenue  
- **Ingredient cost** — cost of ingredients used  
- **Food cost %** — cost ÷ sales  

---

## 15. Reports

**Menu:** Reports

**Purpose:** Download and analyse data over a date range.

**Requires:** Items (other reports need their modules enabled)

### Report types

| Report           | Shows                                      |
|------------------|--------------------------------------------|
| Stock valuation  | Item quantities and values now             |
| Consumption      | What was used in the period                |
| Slow-moving stock| Items with little movement (capital tied up)|
| Wastage          | Waste by item and reason                   |
| Menu item margin | Profit and food cost per recipe            |
| Purchases        | Spending by supplier                       |

### How to use

1. Pick a report type (tabs at top).
2. Set **From** and **To** dates.
3. View totals and table on screen.
4. Click **Download Excel** for a CSV file.

**Example:** Wastage report from 1 Sep to 30 Sep to see if spoiled items increased after a fridge problem.

---

## 16. Users & Security

**Menu:** Users & Security

**Purpose:** Add staff accounts and see who changed what.

**Who can manage users:** Owner only

### 16.1 Add a user

1. Click **Add user**.
2. Example — kitchen staff:

| Field    | Value        |
|----------|--------------|
| Name     | Kamal        |
| Username | kamal        |
| Password | (6+ chars)   |
| Role     | Chef         |

3. Save.

### 16.2 Activity log

**Activity log** tab shows audit entries: who performed actions and when (module changes, stock events, etc.).

### Roles summary

See [Section 19](#19-user-roles--permissions) for full permission matrix.

---

## 17. Branches & Locations

**Menu:** Branches & Locations

**Purpose:** Define where stock is kept — main store, freezer, kitchen, bar, or separate branches.

**Who can add/edit:** Owner, Manager

### Add a location

1. Click **Add location**.
2. Example:

| Field    | Value          |
|----------|----------------|
| Name     | Kitchen Freezer|
| Type     | Freezer        |
| Branch   | Main           |

Use locations when **transferring stock** or receiving goods into a specific place.

---

## 18. Settings

**Menu:** Settings (Owner only)

### Shop details

| Field              | Example        |
|--------------------|----------------|
| Shop name          | Burger House   |
| Currency           | LKR (shows Rs.)|
| Alert days ahead   | 7              | Days before expiry to warn |
| Language           | English / Sinhala |

Click **Save** at the bottom when you change anything.

### Features (modules)

Turn modules on or off. Disabled modules disappear from the menu but **data is not deleted** — turn them back on anytime.

**Rules:**

- **Items** and **Users** cannot be turned off.
- Some modules need others (e.g. **Recipes** needs **Items**).
- Turning off a module may auto-disable modules that depend on it.

### POS API key

If **Sales** is enabled, Settings shows an **API key**. External POS systems use this to send sales automatically (see [Section 21](#21-pos-api-external-sales)).

---

## 19. User roles & permissions

| Role        | Typical user   | Can do |
|-------------|----------------|--------|
| **Owner**   | Shop owner     | Everything including Settings, users, module toggles |
| **Manager** | Supervisor     | Approve stocktake, adjust stock, manage items/GRN, all Chef actions |
| **Storekeeper** | Store staff | Items, GRN, transfers, recipes — no stock adjustments or stocktake approval |
| **Chef**    | Kitchen        | Record wastage and sales, submit stocktake counts |
| **Viewer**  | Accountant     | View only — cannot change data |

### Quick reference

| Action              | Viewer | Chef | Storekeeper | Manager | Owner |
|---------------------|--------|------|-------------|---------|-------|
| View stock & reports| Yes    | Yes  | Yes         | Yes     | Yes   |
| Record wastage/sales| No     | Yes  | Yes         | Yes     | Yes   |
| GRN, items, transfer| No     | No   | Yes         | Yes     | Yes   |
| Stock adjustment    | No     | No   | No          | Yes     | Yes   |
| Approve stocktake   | No     | No   | No          | Yes     | Yes   |
| Settings & users    | No     | No   | No          | No      | Yes   |

---

## 20. Daily workflow example

A typical day at **Burger House**:

### Morning

1. **Dashboard** — check low stock and expiring items.
2. **Purchasing → Goods arrived** — record delivery from Keells (buns, patties, cheese).
3. **Stock Control** — confirm quantities look correct.

### During service

4. **Sales** — record each order (or POS sends sales via API).
5. **Wastage** — record burnt patties or dropped buns immediately.

### End of day

6. **Dashboard** — review food cost and wastage for the day.
7. **Reports → Wastage** — weekly review with manager.

### Weekly

8. **Stocktake** — count high-value items (meat, cheese, buns).
9. **Purchasing → Orders** — create PO for supplier based on low-stock list.
10. **Costing** — check margin and variance.

---

## 21. POS API (external sales)

If you use an external Point of Sale system, it can post sales to Burger House Stock so stock deducts automatically.

### Setup

1. Enable **Sales** in Settings → Features.
2. Copy the **POS API key** from Settings.
3. Give the key to your POS developer.

### Send a sale

**Endpoint:** `POST /api/sales`  
**Header:** `x-api-key: <your-api-key>`  
**Body (JSON):**

```json
{
  "location": "<location-id>",
  "lines": [
    { "recipe": "<cheese-burger-recipe-id>", "qty": 2 },
    { "recipe": "<fries-recipe-id>", "qty": 1 }
  ]
}
```

Recipe IDs come from your Recipes data. Each line deducts ingredients per the recipe.

**Without API key:** Logged-in users with Chef role or above can post sales from the Sales page in the browser.

---

## Quick troubleshooting

| Problem | What to check |
|---------|----------------|
| Module missing from menu | Settings → Features — turn it on and Save |
| Cannot log in | Username/password; ask Owner to reset |
| Stock did not increase after delivery | Record a **GRN** under Purchasing, not just a PO |
| Stock did not decrease after sale | Sale must use a **recipe**; recipe must have ingredients |
| Wrong language on page | Use sidebar **English \| සිංහල** toggle; refresh if needed |
| Food cost seems wrong | Update item costs via GRN; check recipes and wastage entries |

---

## Support checklist for new shops

1. Complete **Setup** and log in as Owner.  
2. Add **locations** (Branches) if you have more than one store area.  
3. Add all **items** with codes, units, and reorder levels.  
4. Create **recipes** for every menu item you sell.  
5. Add **suppliers** and record opening stock via **Goods arrived**.  
6. Add **users** with the right roles for each staff member.  
7. Run one test **sale** and confirm stock deducted correctly.  
8. Run one test **wastage** entry and confirm stock deducted.  

---

*Document version: 1.0 — Burger House Stock Management System*
