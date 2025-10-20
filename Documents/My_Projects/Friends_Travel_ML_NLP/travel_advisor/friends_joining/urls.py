from django.urls import path
from .models import IndividualFriend
from .views import  CreateGroupView, RegisterView, JoinGroupView, GroupMembersView
from ..travel_advisor.urls import urlpatterns

urlpatterns=[
    path('register/', RegisterView.as_view(), name='register'),
    path('group/create/', CreateGroupView.as_view(), name='create-group'),
    path('group/join/', JoinGroupView.as_view(), name='join-group'),
    path('group/<str:spid>/members/', GroupMembersView.as_view(), name='group-members'),
]