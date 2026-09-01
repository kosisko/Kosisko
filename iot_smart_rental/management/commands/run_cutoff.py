from django.core.management.base import BaseCommand
from iot_smart_rental.cutoff_scheduler import run_daily_auto_cutoff_job

class Command(BaseCommand):
    help = 'Runs the daily auto-cutoff process for expired IoT subscriptions.'

    def handle(self, *args, **options):
        self.stdout.write("Starting Daily Auto-Cutoff Engine...")
        result = run_daily_auto_cutoff_job()
        self.stdout.write(self.style.SUCCESS(result))