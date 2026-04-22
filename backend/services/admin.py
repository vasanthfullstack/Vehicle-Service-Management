from django.contrib import admin
from .models import Component, Vehicle, ServiceRecord, Issue, Payment


@admin.register(Component)
class ComponentAdmin(admin.ModelAdmin):
    list_display = ('name', 'component_type', 'price', 'stock_quantity', 'created_at')
    list_filter = ('component_type',)
    search_fields = ('name',)


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('license_plate', 'owner_name', 'vehicle_make', 'vehicle_model', 'vehicle_year')
    search_fields = ('license_plate', 'owner_name')


@admin.register(ServiceRecord)
class ServiceRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'vehicle', 'status', 'created_at')
    list_filter = ('status',)


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('id', 'service_record', 'resolution_type', 'component', 'quantity', 'labor_charge')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'service_record', 'amount', 'payment_method', 'status', 'payment_date')
    list_filter = ('status', 'payment_method')
