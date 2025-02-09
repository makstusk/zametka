from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Profile, Workspace, Page, Block,ToggleBlock, ToDoBlock, TextBlock, ImageBlock, ListBlock, Database, DatabaseRecord, CalendarBlock
from rest_framework.permissions import AllowAny
from django.db import models
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.decorators import action
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    WorkspaceSerializer,
    PageSerializer,
    BlockSerializer,
    DatabaseSerializer,
    DatabaseRecordSerializer,
    ProfileSerializer
)

class WorkspaceViewSet(viewsets.ModelViewSet):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Workspace.objects.filter(members=user)

    def perform_create(self, serializer):
        workspace = serializer.save(owner=self.request.user)
        workspace.members.add(self.request.user)

class WorkspacePageList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):
        try:
            workspace = Workspace.objects.get(id=workspace_id, members=request.user)
        except Workspace.DoesNotExist:
            return Response({"error": "Рабочее пространство не найдено или недоступно"}, status=status.HTTP_404_NOT_FOUND)

        pages = Page.objects.filter(workspace=workspace)
        serializer = PageSerializer(pages, many=True)
        return Response(serializer.data)

    def post(self, request, workspace_id):
        try:
            workspace = Workspace.objects.get(id=workspace_id, members=request.user)
        except Workspace.DoesNotExist:
            return Response({"error": "Рабочее пространство не найдено или недоступно"}, status=status.HTTP_404_NOT_FOUND)

        serializer = PageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.kwargs.get('workspace_id', None)
        if workspace_id:
            return Page.objects.filter(workspace_id=workspace_id)
        return Page.objects.all()

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(id=self.kwargs['workspace_id'])
        serializer.save(workspace=workspace)

class BlockViewSet(viewsets.ModelViewSet):
    queryset = Block.objects.all()
    serializer_class = BlockSerializer

    def get_queryset(self):
        if self.request.method == 'GET':
            page_id = self.request.query_params.get('page')
            if not page_id:
                raise serializers.ValidationError("Параметр 'page' обязателен для получения блоков.")
            return Block.objects.filter(page_id=page_id).order_by('order')
        return Block.objects.all()

    def perform_create(self, serializer):
        page_id = self.request.data.get('page')
        block_type = self.request.data.get('block_type')
        content = self.request.data.get('content')
        image = self.request.FILES.get('image')
        items = self.request.data.get('items')
        events = self.request.data.get('events')
        collapsed_str = self.request.data.get('collapsed')
        toggle_title = self.request.data.get('title')
        toggle_data = self.request.data.get('data')
        todo_title = self.request.data.get('title')
        todo_data = self.request.data.get('data')

        if not page_id or not block_type:
            raise serializers.ValidationError("Поля 'page' и 'block_type' обязательны.")

        try:
            page = Page.objects.get(id=page_id)
        except Page.DoesNotExist:
            raise serializers.ValidationError("Страница с указанным ID не найдена.")

        last_order = Block.objects.filter(page=page).aggregate(models.Max('order'))['order__max'] or 0

        # Сохраняем основной блок
        block = serializer.save(page=page, order=last_order + 1, block_type=block_type)

        if block_type == 'text':
            if content is None:
                content = ""
            TextBlock.objects.create(block=block, content=content)

        elif block_type == 'image':
            ImageBlock.objects.create(block=block, image=image)

        elif block_type == 'list':
            if items is None:
                items = ""
            ListBlock.objects.create(block=block, items=items)

        elif block_type == 'calendar':
            if events is None:
                events = "[]"
            CalendarBlock.objects.create(block=block, events=events)


        elif block_type == 'toggle':

            collapsed_val = False

            if collapsed_str and collapsed_str.lower() == 'true':
                collapsed_val = True

            if toggle_title is None:
                toggle_title = ""

            if toggle_data is None:
                toggle_data = "[]"

            ToggleBlock.objects.create(

                block=block,

                collapsed=collapsed_val,

                title=toggle_title,

                data=toggle_data

            )


        elif block_type == 'todo':

            if todo_title is None:
                todo_title = ""

            if todo_data is None:
                todo_data = "[]"

            ToDoBlock.objects.create(

                block=block,

                title=todo_title,

                data=todo_data

            )

        else:
            raise serializers.ValidationError(f"Неизвестный тип блока: {block_type}")

        return block

    def perform_update(self, serializer):
        block = self.get_object()
        page_id = self.request.query_params.get('page')
        if not page_id or block.page_id != int(page_id):
            raise serializers.ValidationError("Блок не принадлежит указанной странице.")

        if block.block_type == 'text':
            content = self.request.data.get('content')
            if content is not None:
                block.text_block.content = content
                block.text_block.save()

        elif block.block_type == 'image':
            image = self.request.FILES.get('image')
            if image is not None:
                block.image_block.image = image or "Def_image.png"
                block.image_block.save()

        elif block.block_type == 'list':
            items = self.request.data.get('items')
            if items is not None:
                block.list_block.items = items
                block.list_block.save()

        elif block.block_type == 'calendar':
            events = self.request.data.get('events')
            if events is not None:
                block.calendar_block.events = events
                block.calendar_block.save()


        elif block.block_type == 'toggle':
            collapsed_str = self.request.data.get('collapsed')
            title = self.request.data.get('title')
            data = self.request.data.get('data')
            if collapsed_str is not None:
                block.toggle_block.collapsed = (collapsed_str.lower() == 'true')
            if title is not None:  # ← Новое

                block.toggle_block.title = title
            if data is not None:  # ← Новое

                block.toggle_block.data = data
                block.toggle_block.save()

        elif block.block_type == 'todo':
            data = self.request.data.get('data')
            if data is not None:
                block.todo_block.data = data
                block.todo_block.save()

        serializer.save()

    def perform_destroy(self, instance):
        if instance.block_type == 'image':
            if hasattr(instance, 'image_block') and instance.image_block.image:
                instance.image_block.image.delete(save=False)
                instance.image_block.delete()

        instance.delete()

class DatabaseViewSet(viewsets.ModelViewSet):
    queryset = Database.objects.all()
    serializer_class = DatabaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(workspace__members=self.request.user)

class DatabaseRecordViewSet(viewsets.ModelViewSet):
    queryset = DatabaseRecord.objects.all()
    serializer_class = DatabaseRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(database__workspace__members=self.request.user)

class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['post'], url_path='upload-avatar')
    def upload_avatar(self, request):
        profile = self.get_queryset().first()
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')

        if not username or not password:
            return Response({'error': 'Имя пользователя и пароль обязательны'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Имя пользователя уже занято'}, status=status.HTTP_400_BAD_REQUEST)


        user = User.objects.create_user(username=username, password=password, email=email)


        Profile.objects.create(user=user)

        return Response({'message': 'Пользователь и профиль успешно созданы'}, status=status.HTTP_201_CREATED)


class CurrentUserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print(f"Запрос от пользователя: {request.user}")
        profile = Profile.objects.filter(user=request.user).first()
        if profile:
            serializer = ProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)
        return Response({'error': 'Профиль не найден'}, status=404)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Вы успешно вышли из системы"}, status=204)
        except Exception as e:
            return Response({"error": str(e)}, status=400)