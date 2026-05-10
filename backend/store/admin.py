from django.contrib import admin
from .models import Category, Product, UserPrifile, Order, OrderItem

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(UserPrifile)
admin.site.register(Order)
admin.site.register(OrderItem)

# Register your models here.
