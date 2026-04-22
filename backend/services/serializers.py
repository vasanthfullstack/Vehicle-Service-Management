from rest_framework import serializers
from .models import Component, Vehicle, ServiceRecord, Issue, Payment


class ComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Component
        fields = '__all__'


class VehicleSerializer(serializers.ModelSerializer):
    service_count = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = '__all__'

    def get_service_count(self, obj):
        return obj.service_records.count()


class IssueSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True, default=None)
    component_price = serializers.DecimalField(
        source='component.price', max_digits=10, decimal_places=2, read_only=True, default=None
    )
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'service_record', 'description', 'resolution_type',
            'component', 'component_name', 'component_price',
            'labor_charge', 'quantity', 'total_cost', 'created_at'
        ]

    def get_total_cost(self, obj):
        return obj.total_cost


class PaymentSerializer(serializers.ModelSerializer):
    service_record_info = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = '__all__'

    def get_service_record_info(self, obj):
        sr = obj.service_record
        return {
            'id': sr.id,
            'vehicle': str(sr.vehicle),
            'description': sr.description,
        }


class ServiceRecordListSerializer(serializers.ModelSerializer):
    vehicle_info = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()
    issue_count = serializers.SerializerMethodField()
    is_paid = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRecord
        fields = [
            'id', 'vehicle', 'vehicle_info', 'description', 'status',
            'total_cost', 'issue_count', 'is_paid', 'created_at', 'updated_at'
        ]

    def get_vehicle_info(self, obj):
        return {
            'id': obj.vehicle.id,
            'owner_name': obj.vehicle.owner_name,
            'vehicle': f"{obj.vehicle.vehicle_make} {obj.vehicle.vehicle_model}",
            'license_plate': obj.vehicle.license_plate,
        }

    def get_total_cost(self, obj):
        return obj.total_cost

    def get_issue_count(self, obj):
        return obj.issues.count()

    def get_is_paid(self, obj):
        return hasattr(obj, 'payment') and obj.payment is not None


class ServiceRecordDetailSerializer(ServiceRecordListSerializer):
    issues = IssueSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta(ServiceRecordListSerializer.Meta):
        fields = ServiceRecordListSerializer.Meta.fields + ['issues', 'payment']
