import os

from fabric.api import run, task, cd, hide, put, sudo
from fabric.colors import blue
from fabric.contrib.files import exists, upload_template
from fabric.contrib.project import rsync_project

CWD = os.path.dirname(__file__)

PROJECT_PATH = "/storage/webapps/remotempris"
PROJECT_NAME = "django_webmpris_project"
PRJ_CONFIGS = ('gunicorn.config.py', 'supervisord.conf')
NGINX_CONFIG = 'remotempris.nginx'
DJANGO_CONFIG = 'settings.py'

SECRET_KEY = ''

ENVS = {
    "PROJECT_PATH": PROJECT_PATH,
    "PROJECT_NAME": PROJECT_NAME,
    "bind": "127.0.0.1:8011",
    "NGINX_PORT": 8005,
    "STATIC_URL": "/static/",
    "STATIC_PATH": "{prj}/static/".format(prj=PROJECT_PATH),
    "SECRET_KEY": SECRET_KEY,
    "DEBUG": False,
    "ALLOWED_HOSTS": ['127.0.0.1']
}


@task
def nginx_ctl(command="reload"):
    print(blue(command.capitalize() + " nginx"))
    sudo("service nginx " + command)


@task
def supervisor_ctl(command="status"):
    print(blue("supervisorctl " + command))
    with cd(PROJECT_PATH):
        return run("env/bin/supervisorctl -c cfg/supervisord.conf " + command)


@task
def clean():
    if exists(os.path.join(PROJECT_PATH, "pids/supervisord.pid")):
        print(blue("Shutdown supevisor"))
        supervisor_ctl("shutdown")

    if exists("/etc/nginx/sites-available/remotempris2.nginx"):
        print(blue("Remove nginx config"))
        sudo("rm /etc/nginx/sites-enabled/remotempris2.nginx")
        sudo("rm /etc/nginx/sites-available/remotempris2.nginx")
        nginx_ctl("reload")

    if exists(PROJECT_PATH):
        print(blue("Remove project"))
        run("rm -fr " + PROJECT_PATH)


def upload_configs():
    print(blue("Upload configs"))
    for filename in PRJ_CONFIGS + (NGINX_CONFIG, DJANGO_CONFIG):
        upload_template("{filename}".format(filename=filename),
                        "{0}/cfg/".format(PROJECT_PATH), template_dir=CWD,
                        context=ENVS, use_jinja=True, mode=0755)

    print(blue("Upload nginx config"))
    upload_template(NGINX_CONFIG, "/etc/nginx/sites-available/",
                    template_dir=CWD, context=ENVS,
                    use_jinja=True, use_sudo=True, backup=False)
    if not exists("/etc/nginx/sites-enabled/{0}".format(NGINX_CONFIG)):
        sudo(
            "ln -s /etc/nginx/sites-available/{0} "
            "/etc/nginx/sites-enabled/{0}".format(NGINX_CONFIG))

    print(blue("Upload django settings"))
    upload_template(DJANGO_CONFIG,
                    "{prj}/src/{prj_name}/{prj_name}/".format(
                        prj=PROJECT_PATH, prj_name=PROJECT_NAME),
                    template_dir=CWD, context=ENVS,
                    use_jinja=True, use_sudo=True)


@task
def install():
    prj = PROJECT_PATH

    print(blue("Create project folders"))
    run("mkdir -p {0}/cfg {0}/env {0}/logs {0}/pids {0}/src".format(prj))
    print(blue("Setup virtualenv"))
    run("virtualenv -p python --system-site-packages {0}/env".format(prj))
    print(blue("Install system packages"))
    syspackages = "supervisor==3.0 gunicorn==18.0"
    with hide('stdout'):
        run("{0}/env/bin/pip install {1}".format(prj, syspackages))

    print(blue("Install requirements"))
    req_path = os.path.join(os.path.dirname(CWD), 'requirements')
    req_packages = open(req_path, 'r').read().replace('\n', ' ')
    with hide('stdout'):
        run("{0}/env/bin/pip install {1}".format(prj, req_packages))

    print(blue("Upload source"))
    src_local = os.path.join(os.path.dirname(CWD), PROJECT_NAME)
    src_remote = os.path.join(prj, "src")
    with cd(src_remote):
        put(src_local, ".")
    run("chmod 755 -R {src_remote}".format(src_remote=src_remote))
    print(blue("Create symlink for static"))
    run("ln -s {src}/{prj_name}/static {prj}/static".format(
        src=src_remote, prj=prj, prj_name=PROJECT_NAME))

    upload_configs()
    nginx_ctl("reload")

    print(blue("Start supervisord"))
    run("{0}/env/bin/supervisord -c {0}/cfg/supervisord.conf".format(prj))


@task
def update():
    prj = PROJECT_PATH
    print(blue("Sync source"))
    src_local = os.path.join(os.path.dirname(CWD), PROJECT_NAME)
    src_remote = os.path.join(prj, "src")
    rsync_project(local_dir=src_local,
                  remote_dir=src_remote,
                  exclude=["static/img/covers", "*.pyc"])

    upload_configs()
    nginx_ctl("reload")
    supervisor_ctl("reload")


@task
def reinstall():
    clean()
    install()
