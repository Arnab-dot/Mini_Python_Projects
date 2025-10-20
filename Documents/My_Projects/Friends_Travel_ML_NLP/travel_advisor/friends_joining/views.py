from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import IndividualFriend, Creating_group, Preference_list
from .serializers import RegisterSerializer, FriendGroupSerializer
from rest_framework_simplejwt.tokens import RefreshToken
import uuid



class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            friend = serializer.save()
            return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        name = request.data.get("name")  # Group name
        if not name:
            return Response({"error": "Group name is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate a unique special ID for this group
        spid = request.data.get("create_spid")
        group = Creating_group.objects.create(create_spid=spid)

        return Response({
            "group_name": name,
            "sp_id": group.create_spid,
            "message": "Group created successfully"
        }, status=status.HTTP_201_CREATED)



class JoinGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        spid = request.data.get("create_spid")
        name = request.data.get("name")
        state = request.data.get("state")
        city = request.data.get("city")
        preference_id = request.data.get("preference_id")

        if not all([spid, name, state, city, preference_id]):
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get the group
        try:
            group = Creating_group.objects.get(create_spid=spid)
        except Creating_group.DoesNotExist:
            return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get the preference
        try:
            preference = Preference_list.objects.get(id=preference_id)
        except Preference_list.DoesNotExist:
            return Response({"error": "Invalid preference ID"}, status=status.HTTP_404_NOT_FOUND)

        # Check if the user is already in the group
        if IndividualFriend.objects.filter(name=name, groups=group).exists():
            return Response({"message": "Already a member of this group"}, status=status.HTTP_200_OK)

        # Add the user to the group
        friend = IndividualFriend.objects.create(
            name=name,
            state_residence=state,
            city=city,
            choices=preference,
            groups=group
        )

        return Response({
            "message": f"{name} joined group successfully",
            "group_spid": spid
        }, status=status.HTTP_201_CREATED)



class GroupMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, spid):
        # Get the group
        try:
            group = Creating_group.objects.get(create_spid=spid)
        except Creating_group.DoesNotExist:
            return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get all members
        members = IndividualFriend.objects.filter(groups=group)
        serializer = FriendGroupSerializer(members, many=True)

        return Response({
            "group_spid": spid,
            "member_count": members.count(),
            "members": serializer.data
        }, status=status.HTTP_200_OK)
