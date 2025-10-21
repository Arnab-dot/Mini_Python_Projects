
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import IndividualFriend, Creating_group, Preference_list


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = IndividualFriend
        fields = ['username', 'password']

    def create(self, validated_data):
        user = IndividualFriend.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('User account is disabled.')
            else:
                raise serializers.ValidationError('Unable to login with provided credentials.')
        else:
            raise serializers.ValidationError('Must include "username" and "password".')

        return data


class PreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Preference_list
        fields = ['id', 'value', 'description', 'sentiment_score', 'normalized_score']
        read_only_fields = ['id', 'sentiment_score', 'normalized_score']


class FriendGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndividualFriend
        fields = ['username', 'state_residence', 'city', 'choices', 'friend_group']


class CreatingGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creating_group
        fields = ['create_spid']
