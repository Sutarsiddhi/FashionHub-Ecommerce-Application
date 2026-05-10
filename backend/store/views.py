from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.conf import settings
from .serializers import RegisterSerializer, UserSerializer
from rest_framework import status
from .models import Product, Category, Cart, CartItem, Order, OrderItem
from .serializers import ProductSerializer, CategorySerializer, CartSerializer, CartItemSerializer
from django.db.models import Q
from django.db import transaction
from rest_framework.generics import ListAPIView
from decimal import Decimal

try:
    import razorpay
except ImportError:  # pragma: no cover - depends on local environment
    razorpay = None


def _validate_checkout_data(data):
    name = (data.get('name') or '').strip()
    address = (data.get('address') or '').strip()
    phone = (data.get('phone') or '').strip()

    if not name or not address or not phone:
        return None, Response({'error': 'Name, address, and phone are required'}, status=400)

    if not phone.isdigit() or len(phone) < 10:
        return None, Response({'error': 'Invalid phone number'}, status=400)

    return {
        'name': name,
        'address': address,
        'phone': phone,
    }, None


def _get_user_cart(user):
    cart, created = Cart.objects.get_or_create(user=user)
    if not cart.items.exists():
        return None, Response({'error': 'Cart is empty'}, status=400)
    return cart, None


def _calculate_cart_total(cart):
    return sum((item.product.price * item.quantity for item in cart.items.all()), Decimal('0.00'))


def _create_order_items_from_cart(order, cart):
    for item in cart.items.select_related('product').all():
        OrderItem.objects.create(
            order=order,
            product=item.product,
            quantity=item.quantity,
            price=item.product.price
        )


def _get_razorpay_client():
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')

    if not razorpay:
        return None, Response(
            {'error': 'Razorpay SDK is not installed. Run: pip install razorpay'},
            status=500
        )

    if not key_id or not key_secret:
        return None, Response(
            {'error': 'Razorpay keys are not configured on the backend'},
            status=500
        )

    client = razorpay.Client(auth=(key_id, key_secret))
    return client, None


@api_view(['GET'])
def get_products(request):
    category = request.GET.get("category")
    sub_category = request.GET.get("sub_category")
    search = request.GET.get("search")

    products = Product.objects.all()

    if category:
        products = products.filter(
            Q(category__name__iexact=category) |
            Q(category__name__istartswith=f"{category} ")
        )

    if sub_category:
        products = products.filter(category__name__icontains=sub_category)

    if search:
        products = products.filter(
            Q(name__icontains=search) |
            Q(description__icontains=search)
        )

    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def get_product(request, pk):
    try:
        product = Product.objects.get(id=pk)
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)


@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))
    size = request.data.get('size', 'M')

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    cart, created = Cart.objects.get_or_create(user=request.user)

    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        size=size
    )

    if not created:
        item.quantity += quantity
    else:
        item.quantity = quantity

    item.save()

    return Response({
        'message': 'Product added to cart',
        "cart": CartSerializer(cart).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_cart_quantity(request):
    item_id = request.data.get('item_id')
    quantity = request.data.get('quantity')

    if not item_id or quantity is None:
        return Response({'error': 'Item ID and quantity are required'}, status=400)

    try:
        item = CartItem.objects.get(id=item_id)

        if int(quantity) < 1:
            item.delete()
            return Response({'error': 'Quantity must be at least 1'}, status=400)

        item.quantity = quantity
        item.save()
        serializer = CartItemSerializer(item)
        return Response(serializer.data)

    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request):
    item_id = request.data.get('item_id')
    CartItem.objects.filter(id=item_id).delete()
    return Response({'message': 'Item removed from cart'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    try:
        data = request.data
        payment_method = data.get('payment_method', 'COD')
        checkout_data, error_response = _validate_checkout_data(data)
        if error_response:
            return error_response

        cart, error_response = _get_user_cart(request.user)
        if error_response:
            return error_response

        total = _calculate_cart_total(cart)

        order = Order.objects.create(
            user=request.user,
            total_amount=total,
            payment_method=payment_method,
            payment_status='SUCCESS' if payment_method == 'COD' else 'PENDING',
            **checkout_data,
        )

        _create_order_items_from_cart(order, cart)

        cart.items.all().delete()

        return Response({
            'message': 'Order created successfully',
            'order_id': order.id,
            'payment_status': order.payment_status,
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_razorpay_order(request):
    try:
        payment_method = request.data.get('payment_method', 'ONLINE')
        if payment_method != 'ONLINE':
            return Response({'error': 'Invalid payment method'}, status=400)

        checkout_data, error_response = _validate_checkout_data(request.data)
        if error_response:
            return error_response

        cart, error_response = _get_user_cart(request.user)
        if error_response:
            return error_response

        client, error_response = _get_razorpay_client()
        if error_response:
            return error_response

        total = _calculate_cart_total(cart)
        amount_in_paise = int(total * 100)

        razorpay_order = client.order.create({
            'amount': amount_in_paise,
            'currency': 'INR',
            'payment_capture': 1,
        })

        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                total_amount=total,
                payment_method='ONLINE',
                payment_status='PENDING',
                razorpay_order_id=razorpay_order['id'],
                **checkout_data,
            )
            _create_order_items_from_cart(order, cart)

        return Response({
            'message': 'Razorpay order created successfully',
            'order_id': order.id,
            'razorpay_order_id': razorpay_order['id'],
            'amount': amount_in_paise,
            'currency': razorpay_order.get('currency', 'INR'),
            'key': settings.RAZORPAY_KEY_ID,
            'name': checkout_data['name'],
            'email': request.user.email,
            'contact': checkout_data['phone'],
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_razorpay_payment(request):
    try:
        order_id = request.data.get('order_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({'error': 'Missing Razorpay payment details'}, status=400)

        client, error_response = _get_razorpay_client()
        if error_response:
            return error_response

        order = Order.objects.filter(
            id=order_id,
            user=request.user,
            payment_method='ONLINE'
        ).first()

        if not order:
            return Response({'error': 'Order not found'}, status=404)

        if order.payment_status == 'SUCCESS':
            return Response({
                'message': 'Payment already verified',
                'order_id': order.id,
            })

        if order.razorpay_order_id != razorpay_order_id:
            return Response({'error': 'Razorpay order mismatch'}, status=400)

        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature,
        })

        cart = Cart.objects.filter(user=request.user).first()

        with transaction.atomic():
            order.razorpay_payment_id = razorpay_payment_id
            order.razorpay_signature = razorpay_signature
            order.payment_status = 'SUCCESS'
            order.save(update_fields=[
                'razorpay_payment_id',
                'razorpay_signature',
                'payment_status',
            ])

            if cart:
                cart.items.all().delete()

        return Response({
            'message': 'Payment verified successfully',
            'order_id': order.id,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {"message": "User created successfully", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
