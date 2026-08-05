from django.db import migrations, models


def sync_role_capabilities(apps, schema_editor):
    CustomUser = apps.get_model('accounts', 'CustomUser')
    for user in CustomUser.objects.all():
        role = user.role
        user.is_donor = role == 'DONOR'
        user.is_receiver = role == 'RECEIVER'
        user.save(update_fields=['is_donor', 'is_receiver'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='is_donor',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='customuser',
            name='is_receiver',
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(sync_role_capabilities, migrations.RunPython.noop),
    ]
