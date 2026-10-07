# ☕ CafeTab

> **Sign now. Settle at month end.**

A credit-tab management system built for cafes and restaurants in Ethiopia — where trusted regulars eat daily without paying each time, and settle their full balance once a month.

---

## 📖 The Problem

In many Ethiopian cafes and restaurants, regular customers — office workers, shop owners, and long-time patrons — eat lunch or drink coffee daily on a **running tab**. The owner trusts them to pay at the end of the month.

But tracking this on paper is messy:

- ❌ Notebooks get lost, torn, or written over
- ❌ Adding up hundreds of daily entries by hand leads to errors
- ❌ Customers argue about how much they owe
- ❌ Staff forget to record some meals
- ❌ No one knows who is overdue on payment
- ❌ Old notebooks pile up — impossible to search

**CafeTab replaces the notebook with a simple app.**

---

## 💡 How It Works

### The Flow in Real Life

1. **Manager** sets up the cafe once: adds the menu with prices, creates logins for staff, and registers trusted customers.
2. **Customer** orders their meal as usual.
3. **Staff** opens CafeTab on a tablet or phone, picks the customer's name, enters the items they ate, and asks the customer for their **password** to sign.
4. The system **adds it to that customer's running balance** — no money changes hands.
5. **Customer** can log in anytime on their own phone to see exactly what they've eaten and how much they owe.
6. When the customer is ready to pay (weekly, monthly, whenever), they hand over cash or send Telebirr to the manager.
7. **Manager** clicks **"Mark Paid"** — the balance resets to zero. Done.

---

## 👥 Who Uses It

### 👔 The Manager (cafe owner)

The person who runs the cafe. They have the **most access** and control.

**Manager can:**
- Add, edit, and delete menu items and prices
- Register new customers (name, phone, password)
- Register staff members (name, phone, password)
- Record meals — same as staff
- See every customer's running balance in one list
- **Mark a customer as paid** (resets their balance to zero)
- **Reset a forgotten password** for any staff or customer with one click
- Remove staff or customers

**Why this matters:** The manager controls who owes what. No staff member can wipe a balance, delete a customer, or change prices.

---

### 👨‍🍳 The Staff (cashier, waiter, counter worker)

The person at the counter who serves customers every day.

**Staff can:**
- Record a meal: pick a customer → enter items → take customer's password → save
- See the full list of customers and their current balances (read-only)

**Staff CANNOT:**
- Delete customers
- Mark anyone as paid
- Change the menu
- See or manage other staff

**Why this matters:** Staff can do their daily job quickly, but can't touch the money side. If a staff member quits tomorrow, no damage can be done.

---

### 🧑 The Customer (the person eating)

The trusted regular who eats on credit.

**Customer can:**
- Log in on their own phone with phone + password
- See **exactly what they ate** — every item, every date, every price
- See their **current total owed** in ETB
- Verify the cafe isn't overcharging them

**Customer CANNOT:**
- Change anything
- See other customers
- See the menu, staff, or reports

**Why this matters:** Customers feel safe. There's no dispute at month end — the record is right there on their phone.

---

## 🎯 Core Features

| Feature | Description |
|---------|-------------|
| **Three-role system** | Manager, Staff, and Customer all log in on the same app with different permissions |
| **Password-signed meals** | Each meal is confirmed by the customer typing their password — proving they received it |
| **Running balance** | Each customer's total owed is calculated live from every meal they've ever recorded |
| **Mark as paid** | Manager resets a customer's balance to zero with one click |
| **Password reset** | Manager can reset forgotten passwords for any staff or customer |
| **Menu management** | Add/remove items and set prices — all meals reference these prices |
| **Meal history** | Every meal is logged with date, time, item, quantity, and price |
| **Local time display** | Meals show in Ethiopian local time, not UTC |
| **Read-only transparency** | Customers see their own records — building trust |
| **No build tools** | Runs on any machine with Node.js — no React, no bundlers, no complexity |

---

## 🎨 The Experience

### First Launch
If the app has never been used before, it shows a **one-time setup screen** asking for the first Manager's name, phone, and password.

### The Landing Page
A clean, colorful screen with three buttons:
- **👔 Manager** — always available
- **👨‍🍳 Staff** — greyed out until the Manager has added at least one staff member
- **🧑 Customer** — greyed out until the Manager has added at least one customer

This prevents confusion — you can't log in as Staff if no staff exist yet.

### Login
Pick your role → enter phone + password → you land on the right dashboard for your role.

### Manager Dashboard
Four tabs: **Customers · Menu · Staff · Record Meal**

### Staff Dashboard
Two tabs: **Record Meal · Customers (read-only)**

### Customer Dashboard
One tab: **My Meals** — with a big colored total at the top and a full table of every meal.

---

## 🚀 How to Run It Locally

### Requirements
- [Node.js](https://nodejs.org) — LTS version
- Nothing else (database is built in)

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/cafetab.git
   cd cafetab