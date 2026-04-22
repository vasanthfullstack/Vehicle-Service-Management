# Vehicle Service Management System (VSMS)

A full-stack web application for managing vehicle services, repairs, components, pricing, and revenue.

## Tech Stack

- **Backend:** Django 4.2 + Django REST Framework
- **Frontend:** React 18 + React Router
- **Database:** SQLite
- **Charts:** Recharts

## Features

1. **Component Registration & Pricing** — Register parts and repair services with pricing
2. **Vehicle Repair Tracking** — Add and manage vehicles requiring service
3. **Issue Reporting & Component Selection** — Report issues, choose new components or repair services
4. **Final Price Calculation & Payment** — Auto-calculated totals with payment simulation
5. **Revenue Graphs** — Daily, monthly, and yearly revenue visualization

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 16+

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data    # Load sample data
python manage.py runserver
```

Backend runs at: http://127.0.0.1:8000

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at: http://localhost:3000

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/components/` | GET, POST | List/create components |
| `/api/components/:id/` | GET, PUT, DELETE | Component detail |
| `/api/vehicles/` | GET, POST | List/create vehicles |
| `/api/vehicles/:id/` | GET, PUT, DELETE | Vehicle detail |
| `/api/service-records/` | GET, POST | List/create service records |
| `/api/service-records/:id/` | GET, PUT, DELETE | Service record detail (includes issues) |
| `/api/issues/` | GET, POST | List/create issues |
| `/api/issues/:id/` | GET, PUT, DELETE | Issue detail |
| `/api/payments/` | GET, POST | List/process payments |
| `/api/dashboard/` | GET | Dashboard statistics |
| `/api/revenue/?period=daily` | GET | Revenue data (daily/monthly/yearly) |

## Running Tests

```bash
cd backend
python manage.py test services
```
