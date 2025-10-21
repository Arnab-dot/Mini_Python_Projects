from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import IndividualFriend, Creating_group, Preference_list
from .serializers import (
    RegisterSerializer, LoginSerializer, FriendGroupSerializer,
    CreatingGroupSerializer, PreferenceSerializer
)
from NLP_For_analysis.Logics_and_Code import predict_group_favorite


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'User registered successfully'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username,
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PreferenceListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        preferences = Preference_list.objects.all()
        serializer = PreferenceSerializer(preferences, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PreferenceCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PreferenceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Preference created successfully',
                    'preference': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreatingGroupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"sp_id": serializer.data.get("create_spid"), "message": "Group created successfully!"},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JoinGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        spid = request.data.get("create_spid")
        name = request.data.get("name")
        state = request.data.get("state")
        city = request.data.get("city")
        destinations = request.data.get("destinations", [])

        if not all([spid, name, state, city]):
            return Response({"error": "Group ID, name, state, and city are required"},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            group = Creating_group.objects.get(create_spid=spid)
        except Creating_group.DoesNotExist:
            return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        if IndividualFriend.objects.filter(username=name, friend_group=group).exists():
            return Response({"message": "Already a member of this group"}, status=status.HTTP_200_OK)

        try:
            friend = IndividualFriend.objects.create(
                username=name,
                state_residence=state,
                city=city,
                friend_group=group,
                destinations=destinations
            )

            return Response({
                "message": f"{name} joined group successfully",
                "group_spid": spid
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                "error": f"Failed to join group: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GroupMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, spid):
        try:
            group = Creating_group.objects.get(create_spid=spid)
        except Creating_group.DoesNotExist:
            return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        members = IndividualFriend.objects.filter(friend_group=group)
        serializer = FriendGroupSerializer(members, many=True)

        return Response({
            "group_spid": spid,
            "member_count": members.count(),
            "members": serializer.data
        }, status=status.HTTP_200_OK)


class GroupDecisionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, spid):
        try:
            group = Creating_group.objects.get(create_spid=spid)
        except Creating_group.DoesNotExist:
            return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        friends = IndividualFriend.objects.filter(friend_group=group)

        if not friends.exists():
            return Response({"error": "No users found in this group"}, status=status.HTTP_404_NOT_FOUND)

        group_fav, group_conf, user_preds = predict_group_favorite(group.create_spid)

        return Response({
            "group_favorite": group_fav,
            "group_confidence": group_conf,
            "user_predictions": user_preds,
        }, status=status.HTTP_200_OK)
