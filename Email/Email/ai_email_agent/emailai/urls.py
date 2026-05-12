from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.generate_email, name='generate_email'),
    path('send/', views.send_email, name='send_email'),
]
