
from django.urls import path
from .views import (
    CreateGroupView, RegisterView, LoginView, JoinGroupView,
    GroupMembersView, GroupDecisionView, PreferenceListView, PreferenceCreateView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),


    path('preferences/', PreferenceListView.as_view(), name='preferences-list'),
    path('preferences/create/', PreferenceCreateView.as_view(), name='preferences-create'),


    path('group/create/', CreateGroupView.as_view(), name='create-group'),
    path('group/join/', JoinGroupView.as_view(), name='join-group'),
    path('group/<str:spid>/members/', GroupMembersView.as_view(), name='group-members'),
    path('group/<str:spid>/recommendation/', GroupDecisionView.as_view(), name='group-recommendation'),

]
