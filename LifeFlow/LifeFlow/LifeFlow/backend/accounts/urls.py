from django.urls import path
from .views import (
    UserRegisterView,
    OtpVerificationView,
    ResendOtpView,
    UserLoginView,
    RoleSelectionView,
    ForgotPasswordView,
    ResetPasswordView,
    UserDetailView,
    AdminUserListView,
    AdminVerifyUserView,
    AdminDeleteUserView
)

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='auth_register'),
    path('verify-otp/', OtpVerificationView.as_view(), name='auth_verify_otp'),
    path('resend-otp/', ResendOtpView.as_view(), name='auth_resend_otp'),
    path('login/', UserLoginView.as_view(), name='auth_login'),
    path('select-role/', RoleSelectionView.as_view(), name='auth_select_role'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),
    path('profile/', UserDetailView.as_view(), name='auth_profile'),

    # Admin User Management Routes
    path('admin/users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<int:user_id>/verify/', AdminVerifyUserView.as_view(), name='admin_user_verify'),
    path('admin/users/<int:user_id>/delete/', AdminDeleteUserView.as_view(), name='admin_user_delete'),
]

