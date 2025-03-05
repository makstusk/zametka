import json
import logging
from datetime import datetime
from django.utils import timezone
from django.utils.dateparse import parse_datetime
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

    def update(self, request, *args, **kwargs):
        workspace = self.get_object()
        if workspace.owner != request.user:
            return Response({'detail': 'Только владелец может изменять доступ к рабочему пространству.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

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
        # При GET-запросе можно выбирать либо верхнеуровневые блоки по странице,
        # либо дочерние блоки конкретного родителя.
        if self.request.method == 'GET':
            page_id = self.request.query_params.get('page')
            parent_id = self.request.query_params.get('parent')
            if parent_id:
                try:
                    parent_block = Block.objects.get(id=parent_id)
                except Block.DoesNotExist:
                    raise serializers.ValidationError("Родительский блок не найден.")
                return parent_block.children.all().order_by('order')
            elif page_id:
                return Block.objects.filter(page_id=page_id, parent__isnull=True).order_by('order')
            else:
                raise serializers.ValidationError("Необходимо указать параметр 'page' или 'parent'.")
        return Block.objects.all()

    def perform_create(self, serializer):
        data = self.request.data
        page_id = data.get('page')
        parent_id = data.get('parent')
        block_type = data.get('block_type')
        # Остальные поля для конкретных типов блоков
        content = data.get('content')
        image = self.request.FILES.get('image')
        items = data.get('items')
        events = data.get('events')
        collapsed_str = data.get('collapsed')
        toggle_title = data.get('title')
        toggle_data = data.get('data')
        todo_title = data.get('title')
        todo_data = data.get('data')

        if not block_type:
            raise serializers.ValidationError("Поле 'block_type' обязательно.")

        if parent_id:
            # Если указан родительский блок, получаем его
            try:
                parent_block = Block.objects.get(id=parent_id)
            except Block.DoesNotExist:
                raise serializers.ValidationError("Родительский блок не найден.")
            # Если передан page, проверяем согласованность
            if page_id and int(page_id) != parent_block.page_id:
                raise serializers.ValidationError("Родительский блок принадлежит другой странице.")
            page = parent_block.page
            last_order = Block.objects.filter(parent=parent_block).aggregate(models.Max('order'))['order__max'] or 0
            block = serializer.save(page=page, order=last_order + 1, block_type=block_type, parent=parent_block)
        else:
            if not page_id:
                raise serializers.ValidationError("Поле 'page' или 'parent' обязательно.")
            try:
                page = Page.objects.get(id=page_id)
            except Page.DoesNotExist:
                raise serializers.ValidationError("Страница с указанным ID не найдена.")
            last_order = Block.objects.filter(page=page, parent__isnull=True).aggregate(models.Max('order'))['order__max'] or 0
            block = serializer.save(page=page, order=last_order + 1, block_type=block_type)

        # Создаём связанные сущности для конкретных типов блоков
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
            ToggleBlock.objects.create(block=block, collapsed=collapsed_val, title=toggle_title, data=toggle_data)
        elif block_type == 'todo':
            if todo_title is None:
                todo_title = ""
            if todo_data is None:
                todo_data = "[]"
            ToDoBlock.objects.create(block=block, title=todo_title, data=todo_data)
        else:
            raise serializers.ValidationError(f"Неизвестный тип блока: {block_type}")

        return block

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

logger = logging.getLogger(__name__)

class UpcomingCalendarEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()  # Используем timezone.now() для получения timezone-aware даты
        upcoming_events = []
        calendar_blocks = CalendarBlock.objects.filter(block__page__workspace__members=request.user)
        for calendar_block in calendar_blocks:
            try:
                events = json.loads(calendar_block.events)
                logger.debug(f"CalendarBlock {calendar_block.id} events: {events}")
                for index, event in enumerate(events):
                    event_start_str = event.get('start')
                    event_end_str = event.get('end')
                    if not event_start_str or not event_end_str:
                        continue
                    event_start = parse_datetime(event_start_str)
                    event_end = parse_datetime(event_end_str)
                    # Если полученные даты offset-naive, можно сделать их timezone-aware:
                    if event_start is not None and event_start.tzinfo is None:
                        event_start = timezone.make_aware(event_start)
                    if event_end is not None and event_end.tzinfo is None:
                        event_end = timezone.make_aware(event_end)
                    # Фильтруем события, которые ещё не закончились
                    if event_end and event_end >= now:
                        event_id = event.get('id', f"{calendar_block.id}_{index}")
                        upcoming_events.append({
                            'id': event_id,
                            'title': event.get('title', 'Без названия'),
                            'start': event_start_str,
                            'end': event_end_str,
                        })
            except Exception as e:
                logger.error(f"Ошибка обработки CalendarBlock {calendar_block.id}: {e}")
                continue
        upcoming_events.sort(key=lambda event: parse_datetime(event['start']) or now)
        logger.debug(f"Returning upcoming events: {upcoming_events}")
        return Response(upcoming_events, status=status.HTTP_200_OK)