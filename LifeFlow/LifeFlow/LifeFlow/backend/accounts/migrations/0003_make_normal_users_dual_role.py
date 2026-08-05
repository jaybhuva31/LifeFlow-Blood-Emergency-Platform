from django.db import migrations, models


def make_normal_users_dual_role(apps, schema_editor):
    CustomUser = apps.get_model('accounts', 'CustomUser')
    CustomUser.objects.exclude(role='ADMIN').update(is_donor=True, is_receiver=True)
    CustomUser.objects.filter(role='ADMIN').update(is_donor=False, is_receiver=False)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_role_capabilities'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='is_donor',
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(make_normal_users_dual_role, migrations.RunPython.noop),
    ]
