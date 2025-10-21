# friends_joining/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import IndividualFriend, Preference_list, Creating_group

admin.site.register(IndividualFriend, UserAdmin)
admin.site.register(Preference_list)
admin.site.register(Creating_group)
