# friends_joining/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class IndividualFriend(AbstractUser):

    state_residence = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)


    destinations = models.JSONField(default=list, blank=True, null=True)

    friend_group = models.ForeignKey(
        'Creating_group',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members'
    )

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='individualfriend_set',
        related_query_name='individualfriend',
    )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='individualfriend_set',
        related_query_name='individualfriend',
    )

    def __str__(self):
        return self.username


class Preference_list(models.Model):
    value = models.CharField(max_length=100)
    description = models.CharField(max_length=100)
    sentiment_score = models.FloatField(null=True, blank=True)
    normalized_score = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.value


class Creating_group(models.Model):
    create_spid = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.create_spid
