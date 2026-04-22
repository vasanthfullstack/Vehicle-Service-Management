from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from .models import Component, Vehicle, ServiceRecord, Issue, Payment


class ComponentModelTest(TestCase):
    def setUp(self):
        self.component = Component.objects.create(
            name='Brake Pad', component_type='part', price=Decimal('45.00'), stock_quantity=10
        )

    def test_component_creation(self):
        self.assertEqual(self.component.name, 'Brake Pad')
        self.assertEqual(self.component.price, Decimal('45.00'))
        self.assertEqual(str(self.component), 'Brake Pad (New Part) - ₹45.00')


class VehicleModelTest(TestCase):
    def setUp(self):
        self.vehicle = Vehicle.objects.create(
            owner_name='John Doe', owner_phone='1234567890',
            vehicle_make='Toyota', vehicle_model='Camry',
            vehicle_year=2022, license_plate='ABC-1234'
        )

    def test_vehicle_creation(self):
        self.assertEqual(self.vehicle.owner_name, 'John Doe')
        self.assertEqual(str(self.vehicle), 'Toyota Camry (ABC-1234)')


class ServiceRecordModelTest(TestCase):
    def setUp(self):
        self.vehicle = Vehicle.objects.create(
            owner_name='Jane', owner_phone='9876543210',
            vehicle_make='Honda', vehicle_model='Civic',
            vehicle_year=2021, license_plate='XYZ-5678'
        )
        self.service = ServiceRecord.objects.create(
            vehicle=self.vehicle, description='Oil change and brake check'
        )
        self.component = Component.objects.create(
            name='Oil Filter', component_type='part', price=Decimal('15.00'), stock_quantity=20
        )

    def test_total_cost(self):
        Issue.objects.create(
            service_record=self.service, description='Replace oil filter',
            resolution_type='new_component', component=self.component,
            labor_charge=Decimal('25.00'), quantity=1
        )
        self.assertEqual(self.service.total_cost, 40.00)


class ComponentAPITest(APITestCase):
    def test_create_component(self):
        data = {'name': 'Spark Plug', 'component_type': 'part', 'price': '12.50', 'stock_quantity': 50}
        response = self.client.post('/api/components/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Component.objects.count(), 1)

    def test_list_components(self):
        Component.objects.create(name='Tire', component_type='part', price=Decimal('80.00'), stock_quantity=8)
        response = self.client.get('/api/components/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class PaymentAPITest(APITestCase):
    def setUp(self):
        self.vehicle = Vehicle.objects.create(
            owner_name='Test', owner_phone='1111111111',
            vehicle_make='Ford', vehicle_model='Focus',
            vehicle_year=2020, license_plate='TEST-001'
        )
        self.service = ServiceRecord.objects.create(
            vehicle=self.vehicle, description='Full service'
        )
        self.component = Component.objects.create(
            name='Air Filter', component_type='part', price=Decimal('20.00'), stock_quantity=5
        )
        Issue.objects.create(
            service_record=self.service, description='Replace air filter',
            resolution_type='new_component', component=self.component,
            labor_charge=Decimal('10.00'), quantity=1
        )

    def test_process_payment(self):
        data = {'service_record': self.service.id, 'payment_method': 'cash'}
        response = self.client.post('/api/payments/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.service.refresh_from_db()
        self.assertEqual(self.service.status, 'paid')
        self.assertEqual(float(response.data['amount']), 30.00)

    def test_duplicate_payment(self):
        self.client.post('/api/payments/', {'service_record': self.service.id, 'payment_method': 'cash'})
        response = self.client.post('/api/payments/', {'service_record': self.service.id, 'payment_method': 'card'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
