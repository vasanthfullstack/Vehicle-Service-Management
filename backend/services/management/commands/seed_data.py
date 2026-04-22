import random
from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from services.models import Component, Vehicle, ServiceRecord, Issue, Payment


class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Components - Parts
        parts = [
            ('Brake Pad Set', 'High-performance ceramic brake pads', '45.00', 25),
            ('Oil Filter', 'Standard oil filter for most vehicles', '12.50', 50),
            ('Air Filter', 'Engine air filter', '18.00', 40),
            ('Spark Plug', 'Iridium spark plug', '8.50', 100),
            ('Battery', '12V car battery, 60Ah', '120.00', 15),
            ('Timing Belt', 'Reinforced timing belt', '35.00', 20),
            ('Alternator', 'Remanufactured alternator', '185.00', 8),
            ('Radiator Hose', 'Upper radiator hose', '22.00', 30),
            ('Windshield Wiper', 'All-season wiper blade pair', '24.00', 45),
            ('Headlight Bulb', 'LED headlight bulb H11', '32.00', 60),
        ]
        for name, desc, price, stock in parts:
            Component.objects.get_or_create(
                name=name, defaults={'description': desc, 'component_type': 'part', 'price': Decimal(price), 'stock_quantity': stock}
            )

        # Components - Repair Services
        services = [
            ('Engine Diagnostic', 'Full electronic engine diagnostic scan', '75.00'),
            ('Wheel Alignment', 'Four-wheel alignment service', '60.00'),
            ('AC Recharge', 'Air conditioning system recharge', '90.00'),
            ('Transmission Flush', 'Complete transmission fluid flush', '110.00'),
            ('Brake Inspection', 'Complete brake system inspection', '40.00'),
        ]
        for name, desc, price in services:
            Component.objects.get_or_create(
                name=name, defaults={'description': desc, 'component_type': 'repair_service', 'price': Decimal(price), 'stock_quantity': 0}
            )

        # Vehicles
        vehicles_data = [
            ('John Doe', '555-0101', 'john@email.com', 'Toyota', 'Camry', 2022, 'ABC-1234'),
            ('Jane Smith', '555-0102', 'jane@email.com', 'Honda', 'Civic', 2021, 'XYZ-5678'),
            ('Bob Wilson', '555-0103', 'bob@email.com', 'Ford', 'F-150', 2023, 'DEF-9012'),
            ('Alice Brown', '555-0104', 'alice@email.com', 'BMW', '3 Series', 2020, 'GHI-3456'),
            ('Charlie Davis', '555-0105', 'charlie@email.com', 'Tesla', 'Model 3', 2024, 'JKL-7890'),
            ('Diana Lee', '555-0106', 'diana@email.com', 'Hyundai', 'Tucson', 2022, 'MNO-2345'),
        ]
        vehicle_objs = []
        for owner, phone, email, make, model, year, plate in vehicles_data:
            v, _ = Vehicle.objects.get_or_create(
                license_plate=plate, defaults={'owner_name': owner, 'owner_phone': phone, 'owner_email': email, 'vehicle_make': make, 'vehicle_model': model, 'vehicle_year': year}
            )
            vehicle_objs.append(v)

        all_components = list(Component.objects.all())
        part_components = [c for c in all_components if c.component_type == 'part']
        service_components = [c for c in all_components if c.component_type == 'repair_service']

        # Service Records with issues and payments (spread across 30 days)
        service_descriptions = [
            'Regular maintenance and oil change',
            'Brake system overhaul',
            'Engine running rough, needs diagnostic',
            'AC not cooling properly',
            'Annual inspection and service',
            'Transmission issues, hard shifting',
            'Replace worn tires and alignment',
            'Battery replacement and electrical check',
            'Coolant leak repair',
            'Full vehicle inspection before road trip',
            'Windshield wiper replacement',
            'Headlight bulb replacement',
        ]

        now = timezone.now()
        for i in range(12):
            vehicle = random.choice(vehicle_objs)
            days_ago = random.randint(0, 30)
            created = now - timedelta(days=days_ago, hours=random.randint(0, 12))

            sr = ServiceRecord.objects.create(
                vehicle=vehicle,
                description=service_descriptions[i],
                status='paid' if i < 9 else random.choice(['pending', 'in_progress', 'completed']),
            )
            # Backdate
            ServiceRecord.objects.filter(id=sr.id).update(created_at=created)

            # Add 1-3 issues per service
            num_issues = random.randint(1, 3)
            for _ in range(num_issues):
                is_part = random.choice([True, False])
                comp = random.choice(part_components if is_part else service_components)
                Issue.objects.create(
                    service_record=sr,
                    description=f"{'Replace' if is_part else 'Perform'} {comp.name.lower()}",
                    resolution_type='new_component' if is_part else 'repair',
                    component=comp,
                    labor_charge=Decimal(str(random.choice([15, 20, 25, 30, 40, 50]))),
                    quantity=random.randint(1, 2) if is_part else 1,
                )

            # Create payment for paid services
            if sr.status == 'paid':
                sr_fresh = ServiceRecord.objects.prefetch_related('issues', 'issues__component').get(id=sr.id)
                payment = Payment.objects.create(
                    service_record=sr_fresh,
                    amount=Decimal(str(sr_fresh.total_cost)),
                    payment_method=random.choice(['cash', 'card', 'upi', 'bank_transfer']),
                    status='completed',
                )
                Payment.objects.filter(id=payment.id).update(payment_date=created + timedelta(hours=random.randint(1, 48)))

        self.stdout.write(self.style.SUCCESS(
            f'Done! Created {Component.objects.count()} components, '
            f'{Vehicle.objects.count()} vehicles, '
            f'{ServiceRecord.objects.count()} service records, '
            f'{Payment.objects.count()} payments.'
        ))
