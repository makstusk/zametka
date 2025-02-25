from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


class Workspace(models.Model):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_workspaces')
    members = models.ManyToManyField(User, related_name='workspaces', blank=True)

    def __str__(self):
        return self.name


class Page(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='pages')
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


from django.db import models

class Block(models.Model):
    PAGE_BLOCK_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('list', 'List'),
        ('calendar', 'Calendar'),
        ('toggle', 'Toggle'),
        ('todo', 'ToDo'),
    ]
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='blocks')
    parent = models.ForeignKey('self', null=True, blank=True, related_name='children', on_delete=models.CASCADE)
    block_type = models.CharField(max_length=50, choices=PAGE_BLOCK_TYPES)
    order = models.PositiveIntegerField()

    def __str__(self):
        parent_str = f", parent={self.parent.id}" if self.parent else ""
        return f"{self.block_type} block in page {self.page.title}{parent_str}"



class TextBlock(models.Model):
    block = models.OneToOneField(Block, on_delete=models.CASCADE, related_name='text_block')
    content = models.TextField()

    def __str__(self):
        return f"TextBlock: {self.content[:30]}"


class ImageBlock(models.Model):
    block = models.OneToOneField(Block, on_delete=models.CASCADE, related_name='image_block')
    image = models.ImageField(upload_to='blocks/')

    def __str__(self):
        return f"ImageBlock: {self.image.url}"


class ListBlock(models.Model):
    block = models.OneToOneField(Block, on_delete=models.CASCADE, related_name='list_block')
    items = models.TextField()

    def get_items(self):
        return self.items.split(',')

    def __str__(self):
        return f"ListBlock: {self.items[:30]}"

class CalendarBlock(models.Model):
    block = models.OneToOneField(Block, on_delete=models.CASCADE, related_name='calendar_block')
    events = models.TextField()

    def __str__(self):
        return f"Calendar Block for Block ID: {self.block.id}"

class ToggleBlock(models.Model):
    block = models.OneToOneField(
        Block, on_delete=models.CASCADE, related_name='toggle_block'
    )
    collapsed = models.BooleanField(default=False)
    title = models.CharField(max_length=100, blank=True, default='')
    data = models.TextField(default='[]')

    def __str__(self):
        return f"ToggleBlock(title='{self.title}', collapsed={self.collapsed})"
class ToDoBlock(models.Model):
    block = models.OneToOneField(
        Block, on_delete=models.CASCADE, related_name='todo_block'
    )
    title = models.CharField(max_length=100, blank=True, default='')
    data = models.TextField(default='[]')  # JSON-строка: [{ text, done }, ...]

    def __str__(self):
        return f"ToDoBlock(title='{self.title}')"

# Database model
class Database(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='databases')
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class DatabaseRecord(models.Model):
    database = models.ForeignKey(Database, on_delete=models.CASCADE, related_name='records')
    data = models.JSONField()

    def __str__(self):
        return f"Record in {self.database.name}"
