from django.template import RequestContext
from django.shortcuts import render_to_response, redirect
from django.conf import settings as prjsets
from urlparse import urlparse, urljoin
import os
import shutil
import mimetypes


def index(request):
    context = RequestContext(request)
    context_dict = {}
    return render_to_response('mprisremote/index.html', context_dict, context)


def cover(request):
    covers_folder = "img/covers/"
    filepath = urlparse(request.GET['path']).path
    filename = os.path.basename(filepath)
    static_path = os.path.join(
        os.path.join(prjsets.STATIC_PATH, covers_folder),
        filename)
    cover_type = mimetypes.guess_type(filepath)[0]
    if cover_type:
        cover_type = cover_type.split("/")[0]
    cover_url = urljoin(prjsets.STATIC_URL, covers_folder + filename)
    if cover_type in ("image", ) and os.path.exists(filepath):
        os.path.exists(static_path) or shutil.copyfile(filepath, static_path)
        return redirect(cover_url)
    return redirect('/static/img/player/cover_disc.jpg')
