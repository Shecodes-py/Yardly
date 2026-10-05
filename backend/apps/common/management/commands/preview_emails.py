from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string


class Command(BaseCommand):
    help = 'Render sample welcome and reset emails; optionally email the previews.'

    def add_arguments(self, parser):
        parser.add_argument('--to')

    def handle(self, *args, **options):
        output = Path(settings.BASE_DIR).parent / 'frontend' / 'public' / 'email-previews'
        output.mkdir(parents=True, exist_ok=True)
        previews = {
            'welcome': {
                'eyebrow': 'WELCOME TO YOUR NEIGHBOURHOOD', 'title': 'Welcome home, Peace.',
                'description': 'You’re joining Miracle Zone Estate. Your neighbourhood, a little closer.',
                'content': 'Complete your household details and wait for your estate team to approve your membership. Once approved, you can invite visitors, register deliveries, find local help and connect with neighbours.',
                'button_label': 'Get started', 'button_url': f'{settings.FRONTEND_URL}/dashboard',
                'footer': 'Visitors, deliveries and community life — all in one place.'},
            'password-reset': {
                'eyebrow': 'ACCOUNT SECURITY', 'title': 'Let’s get you back in.',
                'description': 'Enter this verification code on the Yardly password reset screen.',
                'code': '482916', 'content': 'This code expires in 10 minutes and can be used once. Never share it with anyone.',
                'footer': 'Didn’t request a password reset? Ignore this email. Your password stays unchanged.'}}
        for name, context in previews.items():
            html = render_to_string('common/email.html', context)
            (output / f'{name}.html').write_text(html, encoding='utf-8')
            if options['to']:
                message = EmailMultiAlternatives(f'Yardly preview: {name.replace("-", " ")}',
                    'This is a template preview. The sample verification code does not reset any account.\n\n'
                    + context['title'] + '\n' + context['description'] + '\n' + context['content'],
                    settings.DEFAULT_FROM_EMAIL, [options['to']])
                message.attach_alternative(html, 'text/html')
                self.stdout.write(f'{name}: {message.send()} message accepted')
            self.stdout.write(f'Preview: {name}.html')
