import os
import json
import logging
import uuid
import requests
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_page
# from django.contrib.auth.forms import UserCreationForm
from django.core.files.storage import FileSystemStorage
# from django.utils.translation import activate
from django.conf import settings
from .models import Calculation, Partner, BlogPost, ChatLog
from .forms import PartnerForm



logger = logging.getLogger(__name__)



# Конфигурация API
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
MEDIA_CHATBOT_FILES = 'media/chatbot/files'
MEDIA_CHATBOT_AUDIO = 'media/chatbot/audio'


def page_not_found(request, _exception):
    return render(request, '404.html', status=404)



# Утилиты
def get_client_ip(request):
    """Получение IP клиента с учетом прокси"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')


def save_uploaded_file(file, subfolder):
    """Сохранение загруженного файла с уникальным именем"""
    fs = FileSystemStorage(location=subfolder)
    filename = f"{uuid.uuid4().hex[:8]}_{file.name}"
    saved_name = fs.save(filename, file)
    return fs.url(saved_name)


@csrf_exempt
def save_calculation(request):
    """Сохранение расчетов"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            calculation = Calculation.objects.create(
                user=request.user if request.user.is_authenticated else None,
                data=data
            )
            return JsonResponse({'success': True, 'id': calculation.id})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'error': 'Требуется POST запрос'}, status=405)



# Представления
@csrf_exempt
def chatbot(request):
    """Обработчик чат-бота с поддержкой файлов и аудио"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Метод не разрешен'}, status=405)

    try:
        # Извлечение данных запроса
        user_message = request.POST.get('message', '')
        language = request.POST.get('language', 'ru')
        file = request.FILES.get('file')
        audio = request.FILES.get('audio')

        # Валидация языка
        if language not in dict(settings.LANGUAGES):
            language = 'ru'

        # Обработка медиафайлов
        file_url = save_uploaded_file(file, MEDIA_CHATBOT_FILES) if file else None
        audio_url = save_uploaded_file(audio, MEDIA_CHATBOT_AUDIO) if audio else None

        # Логирование в базу данных
        ChatLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            message=user_message[:500],  # Ограничение длины
            language=language,
            file_path=file_url,
            audio_path=audio_url,
            ip_address=get_client_ip(request)
        )

        # Формирование запроса к AI
        system_prompt = {
            'ru': "Вы - AI-ассистент строительной компании NovaHaus. Отвечайте профессионально.",
            'en': "You are an AI assistant for NovaHaus construction company.",
            'de': "Sie sind ein KI-Assistent für das Bauunternehmen NovaHaus."
        }.get(language, 'ru')

        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }

        # Отправка запроса к AI
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        bot_response = response.json()['choices'][0]['message']['content']

        return JsonResponse({
            'response': bot_response,
            'file_url': file_url,
            'audio_url': audio_url
        })

    except requests.exceptions.RequestException as e:
        logger.error(f"API Error: {str(e)}", exc_info=True)
        return JsonResponse({'error': 'Ошибка соединения с AI сервисом'}, status=502)
    except Exception as e:
        logger.error(f"Chatbot Error: {str(e)}", exc_info=True)
        return JsonResponse({'error': 'Внутренняя ошибка сервера'}, status=500)


@csrf_exempt
def get_ai_recommendations(request):
    """Генерация AI-рекомендаций для строительных проектов"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Требуется POST запрос'}, status=405)

    try:
        data = json.loads(request.body)
        required_fields = ['totalCost', 'materialCost', 'laborCost', 'workType', 'area']

        if not all(field in data for field in required_fields):
            return JsonResponse({'success': False, 'error': 'Неполные данные'}, status=400)

        recommendation = (
            f"Рекомендация для проекта '{data['workType']}':\n"
            f"- Площадь: {data['area']} м²\n"
            f"- Общий бюджет: €{data['totalCost']}\n"
            f"- Материалы: €{data['materialCost']}\n"
            f"- Работа: €{data['laborCost']}"
        )

        return JsonResponse({'success': True, 'recommendation': recommendation})

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Неверный JSON'}, status=400)
    except Exception as e:
        logger.error(f"Recommendation Error: {str(e)}")
        return JsonResponse({'success': False, 'error': 'Ошибка обработки'}, status=500)


def register_partner(request):
    """Регистрация нового партнера"""
    if request.method == 'POST':
        form = PartnerForm(request.POST)
        if form.is_valid():
            partner = form.save(commit=False)
            partner.referral_code = generate_unique_referral()
            partner.save()
            return redirect('partner_success')
    else:
        form = PartnerForm()

    return render(request, 'main/register_partner.html', {
        'form': form,
        'meta_title': 'Регистрация партнера'
    })


def generate_unique_referral():
    """Генерация уникального реферального кода"""
    code = uuid.uuid4().hex[:8].upper()
    while Partner.objects.filter(referral_code=code).exists():
        code = uuid.uuid4().hex[:8].upper()
    return code


@cache_page(60 * 15)
def blog(request):
    """Список статей блога с кешированием"""
    posts = BlogPost.objects.all().order_by('-published_date')
    return render(request, 'main/blog.html', {
        'blog_posts': posts,
        'meta_description': 'Статьи о ремонте и строительстве от NovaHaus'
    })
def home(request):
    return render(request, 'main/home.html')

def services(request):
    return render(request, 'main/services.html')

def portfolio(request):
    return render(request, 'main/portfolio.html')

def about(request):
    return render(request, 'main/about.html')

def reviews(request):
    return render(request, 'main/reviews.html')

def contact(request):
    return render(request, 'main/contact.html')

def calculator(request):
    return render(request, 'main/calculator.html')

def partner_success(request):
    return render(request, 'main/partner_success.html')

def blog_post_detail(request, post_id):
    post = BlogPost.objects.get(id=post_id)
    return render(request, 'main/blog_post_detail.html', {'post': post})

def view_3d_model(request):
    return render(request, 'main/3d_viewer.html')