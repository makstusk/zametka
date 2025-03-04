from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from zm.views import (
    WorkspaceViewSet,
    LogoutView,
    WorkspacePageList,
    PageViewSet,
    BlockViewSet,
    DatabaseViewSet,
    DatabaseRecordViewSet,
    ProfileViewSet,
    RegisterView,
    CurrentUserProfileView,
    UpcomingCalendarEventsView
)

# Initialize DefaultRouter
router = DefaultRouter()
router.register(r'workspaces', WorkspaceViewSet, basename='workspace')
router.register(r'pages', PageViewSet, basename='page')
router.register(r'blocks', BlockViewSet, basename='block')
router.register(r'databases', DatabaseViewSet, basename='database')
router.register(r'records', DatabaseRecordViewSet, basename='record')
router.register(r'profiles', ProfileViewSet, basename='profile')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/workspaces/<int:workspace_id>/pages/', WorkspacePageList.as_view(), name='workspace-pages'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/profile/', CurrentUserProfileView.as_view(), name='current_user_profile'),
    path('api/profile/upload-avatar/', ProfileViewSet.as_view({'post': 'upload_avatar'}), name='upload-avatar'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # Эндпоинт для получения токена
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Эндпоинт для обновления токена
    path('api/calendar-events/upcoming/', UpcomingCalendarEventsView.as_view(), name='upcoming-calendar-events'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)