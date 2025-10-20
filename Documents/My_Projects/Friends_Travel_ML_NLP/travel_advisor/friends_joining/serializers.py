from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from travel_advisor.friends_joining.models import IndividualFriend, Preference_list


class FriendGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndividualFriend
        fields = ["create_spid", "name", "state", "city", "choices", "groups"]

    def validate(self, attrs):
        destination = attrs.get("choices")   # adjust field if different
        user = attrs.get("name")

        if Preference_list.objects.filter(value=destination, description=user).exists():
            raise ValidationError(
                "You cannot enter the same destination twice with the same name."
            )
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = IndividualFriend
        fields = ["name", "password"]

    def validate_name(self, value):
        if IndividualFriend.objects.filter(name=value).exists():
            raise ValidationError("User is already registered")
        return value

    def create(self, validated_data):
        friend = IndividualFriend(
            name=validated_data["name"],
        )

