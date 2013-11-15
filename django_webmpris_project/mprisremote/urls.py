from django.conf.urls import patterns, url
from mprisremote import views

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^$', views.index, name='index'),
    url(r'^cover', views.cover, name='cover'),
)
