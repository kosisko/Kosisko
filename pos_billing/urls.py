from django.urls import path
from .views import pos_counter_view, create_sample_product

urlpatterns = [
    path('counter/', pos_counter_view, name='pos_counter'),
    path('counter/add-sample/', create_sample_product, name='add_sample_products'),
]