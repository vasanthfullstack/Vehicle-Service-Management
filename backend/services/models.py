from django.db import models


class Component(models.Model):
    COMPONENT_TYPES = [
        ('part', 'New Part'),
        ('repair_service', 'Repair Service'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_component_type_display()}) - ₹{self.price}"


class Vehicle(models.Model):
    owner_name = models.CharField(max_length=200)
    owner_phone = models.CharField(max_length=20)
    owner_email = models.EmailField(blank=True, default='')
    vehicle_make = models.CharField(max_length=100)
    vehicle_model = models.CharField(max_length=100)
    vehicle_year = models.IntegerField()
    license_plate = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vehicle_make} {self.vehicle_model} ({self.license_plate})"


class ServiceRecord(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('paid', 'Paid'),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='service_records')
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Service #{self.id} - {self.vehicle} ({self.status})"

    @property
    def total_cost(self):
        total = sum(issue.total_cost for issue in self.issues.all())
        return total


class Issue(models.Model):
    RESOLUTION_TYPES = [
        ('new_component', 'New Component'),
        ('repair', 'Repair'),
    ]

    service_record = models.ForeignKey(ServiceRecord, on_delete=models.CASCADE, related_name='issues')
    description = models.TextField()
    resolution_type = models.CharField(max_length=20, choices=RESOLUTION_TYPES)
    component = models.ForeignKey(Component, on_delete=models.SET_NULL, null=True, blank=True)
    labor_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Issue #{self.id} for Service #{self.service_record_id}"

    @property
    def total_cost(self):
        component_cost = (self.component.price * self.quantity) if self.component else 0
        return float(component_cost) + float(self.labor_charge)


class Payment(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Credit/Debit Card'),
        ('upi', 'UPI'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    service_record = models.OneToOneField(ServiceRecord, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default='')

    def __str__(self):
        return f"Payment #{self.id} - ₹{self.amount} ({self.status})"
