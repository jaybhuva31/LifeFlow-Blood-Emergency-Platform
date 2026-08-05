from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('requests', '0003_requestresponse_donation_status_donorfeedback'),
    ]

    operations = [
        migrations.AddField(
            model_name='emergencyrequest',
            name='emergency_level',
            field=models.CharField(
                choices=[('CRITICAL', 'Critical (Immediate)'), ('HIGH', 'High'), ('NORMAL', 'Normal')],
                default='CRITICAL',
                max_length=15,
            ),
        ),
        migrations.AddField(
            model_name='emergencyrequest',
            name='patient_name',
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name='emergencyrequest',
            name='remarks',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='emergencyrequest',
            name='required_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='emergencyrequest',
            name='required_time',
            field=models.TimeField(blank=True, null=True),
        ),
    ]
