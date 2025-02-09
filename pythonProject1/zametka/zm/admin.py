from django.contrib import admin
from .models import Profile, Workspace, Page, Block, Database, DatabaseRecord

admin.site.register(Profile)
admin.site.register(Workspace)
admin.site.register(Page)
admin.site.register(Block)
admin.site.register(Database)
admin.site.register(DatabaseRecord)
