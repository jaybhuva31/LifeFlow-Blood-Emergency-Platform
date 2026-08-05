# Generated for the emergency donation status and feedback workflow.

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('requests', '0002_emergencyrequest_requestresponse'),
    ]

    operations = [
        migrations.AddField(
            model_name='requestresponse',
            name='donation_status',
            field=models.CharField(
                choices=[
                    ('SENT', 'Sent'),
                    ('ON_THE_WAY', 'On the way'),
                    ('ARRIVED', 'Arrived'),
                    ('COMPLETE', 'Complete'),
                ],
                default='SENT',
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name='DonorFeedback',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveSmallIntegerField()),
                ('comment', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('donor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='donor_feedback_received', to=settings.AUTH_USER_MODEL)),
                ('receiver', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='donor_feedback_given', to=settings.AUTH_USER_MODEL)),
                ('response', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='feedback', to='requests.requestresponse')),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
