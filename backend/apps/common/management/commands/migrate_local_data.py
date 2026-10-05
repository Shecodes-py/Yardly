import hashlib
import json
import sqlite3
from datetime import datetime

from django.apps import apps
from django.conf import settings
from django.core import serializers
from django.core.management.base import BaseCommand, CommandError
from django.core.management.color import no_style
from django.core.serializers import sort_dependencies
from django.db import connections, transaction


class Command(BaseCommand):
    help = 'Copy a consistent local SQLite snapshot into a fresh PostgreSQL Yardly database.'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true')

    def handle(self, *args, **options):
        target = connections['default']
        if target.vendor != 'postgresql':
            raise CommandError('Target must be PostgreSQL.')
        source_path = settings.BASE_DIR / 'db.sqlite3'
        if not source_path.exists():
            raise CommandError('Local SQLite database is missing.')
        backups = settings.BASE_DIR / 'backups'
        backups.mkdir(exist_ok=True)
        snapshot = backups / f'local-{datetime.now():%Y%m%d-%H%M%S-%f}.sqlite3'
        with sqlite3.connect(f'file:{source_path.as_posix()}?mode=ro', uri=True) as source:
            with sqlite3.connect(snapshot) as backup:
                source.backup(backup)
        settings.DATABASES['local_snapshot'] = {
            **settings.DATABASES['default'], 'ENGINE': 'django.db.backends.sqlite3',
            'NAME': str(snapshot), 'OPTIONS': {}, 'HOST': '', 'PORT': '', 'USER': '', 'PASSWORD': '',
            'CONN_MAX_AGE': 0}
        selected = []
        for app in apps.get_app_configs():
            if app.name.startswith('apps.'):
                models = [model for model in app.get_models() if model._meta.model_name != 'passwordresetcode']
                selected.append((app, models))
        group = apps.get_model('auth', 'Group')
        selected.append((apps.get_app_config('auth'), [group]))
        models = sort_dependencies(selected)
        counts = {m._meta.label: m.objects.using('local_snapshot').count() for m in models}
        self.stdout.write('Source record counts: ' + json.dumps(counts, sort_keys=True))
        self.stdout.write('SQLite snapshot saved in backend/backups/.')
        if not options['apply']:
            self.stdout.write('Read-only preview complete. Use --apply to copy records.')
            return

        def dump(alias):
            objects = (obj for m in models for obj in m.objects.using(alias).order_by('pk'))
            return serializers.serialize('json', objects, use_natural_foreign_keys=True, use_natural_primary_keys=True)

        payload = dump('local_snapshot')

        def fingerprint(serialized):
            records = sorted(json.dumps(record, sort_keys=True) for record in json.loads(serialized))
            return hashlib.sha256('\n'.join(records).encode()).hexdigest()

        with transaction.atomic():
            # Prevent concurrent requests from inserting records while the fresh target is populated.
            tables = sorted({m._meta.db_table for m in models} | {
                field.remote_field.through._meta.db_table for m in models for field in m._meta.local_many_to_many})
            with target.cursor() as cursor:
                cursor.execute('LOCK TABLE ' + ', '.join(target.ops.quote_name(table) for table in tables) + ' IN SHARE ROW EXCLUSIVE MODE')
            for model in models:
                if model._meta.label == 'jobs.Category':
                    continue
                if model.objects.exists():
                    raise CommandError('Target contains application records. Copy aborted without changes.')
            category = apps.get_model('jobs', 'Category')
            if counts.get('jobs.Category', 0):
                category.objects.all().delete()
            deferred = []
            for obj in serializers.deserialize('json', payload, using='default', handle_forward_references=True):
                obj.save(using='default')
                if obj.deferred_fields:
                    deferred.append(obj)
            for obj in deferred:
                obj.save_deferred_fields(using='default')
            target.check_constraints()
            with target.cursor() as cursor:
                for sql in target.ops.sequence_reset_sql(no_style(), models):
                    cursor.execute(sql)
            if fingerprint(dump('default')) != fingerprint(payload):
                raise CommandError('Data verification failed. The entire import has been rolled back.')
        self.stdout.write(self.style.SUCCESS(f'Copied and verified {sum(counts.values())} records. PostgreSQL sequences reset.'))
