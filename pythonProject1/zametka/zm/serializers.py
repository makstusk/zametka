from rest_framework import serializers
import logging
from django.contrib.auth.models import User
from .models import Profile, Workspace, Page, Block,ToggleBlock, ToDoBlock, CalendarBlock, TextBlock, ImageBlock, ListBlock, Database, DatabaseRecord
logger = logging.getLogger(__name__)


# Profile Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Profile
        fields = ['user', 'avatar']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.avatar and hasattr(instance.avatar, 'url'):
            representation['avatar'] = request.build_absolute_uri(instance.avatar.url)
        else:
            representation['avatar'] = None
        return representation

class WorkspaceSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    members = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), required=False
    )

    class Meta:
        model = Workspace
        fields = ['id', 'name', 'owner', 'members']
        read_only_fields = ['owner', 'members']


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ['id', 'title', 'workspace', 'created_at', 'updated_at']
        read_only_fields = ['workspace']

    def to_representation(self, instance):
        print(f"Serializing Page: {instance}")
        return super().to_representation(instance)


class TextBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextBlock
        fields = ['id', 'block', 'content']


class ImageBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageBlock
        fields = ['id', 'block', 'image']


class ListBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListBlock
        fields = ['id', 'block', 'items']

class CalendarBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarBlock
        fields = ['id', 'block', 'events']



class ToggleBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToggleBlock
        fields = ['id', 'block', 'collapsed', 'title', 'data']

class ToDoBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToDoBlock
        fields = ['id', 'block', 'title', 'data']

class BlockSerializer(serializers.ModelSerializer):
    text_block = TextBlockSerializer(read_only=True)
    image_block = ImageBlockSerializer(read_only=True)
    list_block = ListBlockSerializer(read_only=True)
    calendar_block = CalendarBlockSerializer(read_only=True)
    toggle_block = ToggleBlockSerializer(read_only=True)
    todo_block = ToDoBlockSerializer(read_only=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = Block
        fields = [
            'id',
            'block_type',
            'page',
            'parent',
            'order',
            'text_block',
            'image_block',
            'list_block',
            'calendar_block',
            'toggle_block',
            'todo_block',
            'children',
        ]
        read_only_fields = [
            'order',
            'text_block',
            'image_block',
            'list_block',
            'calendar_block',
            'block_type',
            'page',
            'parent',
            'toggle_block',
            'todo_block',
            'children',
        ]
    def get_children(self, instance):
        children = instance.children.all().order_by('order')
        return BlockSerializer(children, many=True, context=self.context).data

    def update(self, instance, validated_data):

        block_type = instance.block_type
        instance = super().update(instance, validated_data)


        if block_type == 'text':
            text_block = instance.text_block
            content = self.initial_data.get('content')
            if content is not None:
                text_block.content = content
                text_block.save()

        elif block_type == 'list':
            list_block = instance.list_block
            items = self.initial_data.get('items')
            if items is not None:
                list_block.items = items
                list_block.save()


        elif block_type == 'image':
            image_block = instance.image_block
            image = self.initial_data.get('image')
            if image is not None:
                image_block.image = image
                image_block.save()


        elif block_type == 'calendar':
            calendar_block = instance.calendar_block
            events = self.initial_data.get('events')
            if events is not None:
                calendar_block.events = events
                calendar_block.save()

        elif block_type == 'toggle':

            toggle_block = instance.toggle_block

            collapsed_str = self.initial_data.get('collapsed')

            title = self.initial_data.get('title')

            data = self.initial_data.get('data')

            if collapsed_str is not None:
                toggle_block.collapsed = (collapsed_str.lower() == 'true')

            if title is not None:
                toggle_block.title = title

            if data is not None:
                toggle_block.data = data

            toggle_block.save()


        elif block_type == 'todo':

            todo_block = instance.todo_block

            title = self.initial_data.get('title')

            data = self.initial_data.get('data')

            if title is not None:
                todo_block.title = title

            if data is not None:
                todo_block.data = data

            todo_block.save()

        return instance

    def validate(self, attrs):

        logger.info("=== VALIDATE DATA ===")
        logger.info(f"Input Data: {attrs}")
        validated_data = super().validate(attrs)
        logger.info(f"Validated Data: {validated_data}")
        return validated_data

class DatabaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Database
        fields = ['id', 'workspace', 'name']

    def to_representation(self, instance):
        print(f"Serializing Database: {instance}")
        return super().to_representation(instance)


class DatabaseRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatabaseRecord
        fields = ['id', 'database', 'data']

    def to_representation(self, instance):
        print(f"Serializing DatabaseRecord: {instance}")
        return super().to_representation(instance)
