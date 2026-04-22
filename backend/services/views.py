from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from django.utils import timezone
from datetime import timedelta

from .models import Component, Vehicle, ServiceRecord, Issue, Payment
from .serializers import (
    ComponentSerializer, VehicleSerializer,
    ServiceRecordListSerializer, ServiceRecordDetailSerializer,
    IssueSerializer, PaymentSerializer,
)


class ComponentViewSet(viewsets.ModelViewSet):
    queryset = Component.objects.all().order_by('-created_at')
    serializer_class = ComponentSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by('-created_at')
    serializer_class = VehicleSerializer


class ServiceRecordViewSet(viewsets.ModelViewSet):
    queryset = ServiceRecord.objects.select_related('vehicle').prefetch_related('issues', 'issues__component').all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ServiceRecordDetailSerializer
        return ServiceRecordListSerializer

    def get_serializer_context(self):
        return {'request': self.request}


class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.select_related('component').all()
    serializer_class = IssueSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        service_record_id = self.request.query_params.get('service_record')
        if service_record_id:
            qs = qs.filter(service_record_id=service_record_id)
        return qs


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('service_record', 'service_record__vehicle').all().order_by('-payment_date')
    serializer_class = PaymentSerializer

    def create(self, request, *args, **kwargs):
        service_record_id = request.data.get('service_record')
        payment_method = request.data.get('payment_method', 'cash')
        notes = request.data.get('notes', '')

        try:
            service_record = ServiceRecord.objects.prefetch_related('issues', 'issues__component').get(id=service_record_id)
        except ServiceRecord.DoesNotExist:
            return Response({'error': 'Service record not found.'}, status=status.HTTP_404_NOT_FOUND)

        if hasattr(service_record, 'payment'):
            return Response({'error': 'Payment already exists for this service record.'}, status=status.HTTP_400_BAD_REQUEST)

        total = service_record.total_cost
        if total <= 0:
            return Response({'error': 'No charges to pay. Add issues first.'}, status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.create(
            service_record=service_record,
            amount=total,
            payment_method=payment_method,
            status='completed',
            notes=notes,
        )

        service_record.status = 'paid'
        service_record.save()

        serializer = self.get_serializer(payment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def dashboard_stats(request):
    total_vehicles = Vehicle.objects.count()
    total_components = Component.objects.count()
    active_services = ServiceRecord.objects.filter(status__in=['pending', 'in_progress']).count()
    total_services = ServiceRecord.objects.count()
    total_revenue = Payment.objects.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0

    return Response({
        'total_vehicles': total_vehicles,
        'total_components': total_components,
        'active_services': active_services,
        'total_services': total_services,
        'total_revenue': float(total_revenue),
    })


@api_view(['GET'])
def revenue_data(request):
    period = request.query_params.get('period', 'daily')
    now = timezone.now()

    if period == 'daily':
        start_date = now - timedelta(days=30)
        data = (
            Payment.objects.filter(status='completed', payment_date__gte=start_date)
            .annotate(date=TruncDate('payment_date'))
            .values('date')
            .annotate(revenue=Sum('amount'))
            .order_by('date')
        )
        result = [{'date': item['date'].strftime('%b %d'), 'revenue': float(item['revenue'])} for item in data]

    elif period == 'monthly':
        start_date = now - timedelta(days=365)
        data = (
            Payment.objects.filter(status='completed', payment_date__gte=start_date)
            .annotate(date=TruncMonth('payment_date'))
            .values('date')
            .annotate(revenue=Sum('amount'))
            .order_by('date')
        )
        result = [{'date': item['date'].strftime('%b %Y'), 'revenue': float(item['revenue'])} for item in data]

    else:
        data = (
            Payment.objects.filter(status='completed')
            .annotate(date=TruncYear('payment_date'))
            .values('date')
            .annotate(revenue=Sum('amount'))
            .order_by('date')
        )
        result = [{'date': item['date'].strftime('%Y'), 'revenue': float(item['revenue'])} for item in data]

    return Response(result)
