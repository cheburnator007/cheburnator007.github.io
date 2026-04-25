let articlesData = null; // Глобальная переменная для кэширования XML

const translations = {
    'ru': {
        siteTitle: 'Hi-Tech Сервис',
        navHome: 'Главная',
        navServices: 'Услуги',
        navStreams: 'Стримы',
        homeTitle: 'Наши Статьи',
        readMore: 'Читать далее',
        authorLabel: 'Автор',
        rssFeed: 'Подписаться на RSS ленту',
        servicesTitle: 'Наши Услуги',
        servicesSoonTitle: 'Раздел находится в разработке',
        servicesSoonText: 'Мы усердно работаем над подготовкой полного списка наших услуг. Следите за обновлениями!',
        streamsTitle: 'Прямые Трансляции',
        streamDescription: 'Подключайтесь к нашим прямым эфирам, где мы демонстрируем оборудование в действии, проводим мастер-классы и отвечаем на ваши вопросы.',
        footerRights: 'Все права защищены',
        adPlaceholder: 'Место для рекламы'
    },
    'en': {
        siteTitle: 'Hi-Tech Service',
        navHome: 'Home',
        navServices: 'Services',
        navStreams: 'Streams',
        homeTitle: 'Our Articles',
        readMore: 'Read more',
        authorLabel: 'By',
        rssFeed: 'Subscribe to RSS feed',
        servicesTitle: 'Our Services',
        servicesSoonTitle: 'Section Under Construction',
        servicesSoonText: 'We are working hard to prepare a full list of our services. Stay tuned for updates!',
        streamsTitle: 'Live Streams',
        streamDescription: 'Join our live broadcasts where we demonstrate equipment in action, conduct master classes, and answer your questions.',
        footerRights: 'All rights reserved',
        adPlaceholder: 'Ad Placeholder'
    },
    'he': {
        siteTitle: 'היי-טק שירות',
        navHome: 'ראשי',
        navServices: 'שירותים',
        navStreams: 'שידורים',
        homeTitle: 'המאמרים שלנו',
        readMore: 'קרא עוד',
        authorLabel: 'מאת',
        rssFeed: 'הירשם לעדכוני RSS',
        servicesTitle: 'השירותים שלנו',
        servicesSoonTitle: 'האזור בבנייה',
        servicesSoonText: 'אנו עובדים קשה להכנת רשימה מלאה של השירותים שלנו. הישארו מעודכנים!',
        streamsTitle: 'שידורים חיים',
        streamDescription: 'הצטרפו לשידורים החיים שלנו בהם אנו מדגימים ציוד בפעולה, מעבירים סדנאות ועונים על שאלותיכם.',
        footerRights: 'כל הזכויות שמורות',
        adPlaceholder: 'מקום לפרסומת'
    },
    'ar': {
        siteTitle: 'خدمة التكنولوجيا الفائقة',
        navHome: 'الرئيسية',
        navServices: 'الخدمات',
        navStreams: 'البث المباشر',
        homeTitle: 'مقالاتنا',
        readMore: 'اقرأ المزيد',
        authorLabel: 'بواسطة',
        rssFeed: 'اشترك في تغذية RSS',
        servicesTitle: 'خدماتنا',
        servicesSoonTitle: 'القسم قيد الإنشاء',
        servicesSoonText: 'نحن نعمل بجد لإعداد قائمة كاملة بخدماتنا. ترقبوا التحديثات!',
        streamsTitle: 'البث المباشر',
        streamDescription: 'انضم إلى بثنا المباشر حيث نعرض المعدات أثناء عملها ونجري فصولاً دراسية ونجيب على أسئلتكم.',
        footerRights: 'كل الحقوق محفوظة',
        adPlaceholder: 'مكان للإعلان'
    }
};

/**
 * Открывает модальное окно и загружает в него статью
 * @param {string} articleId - ID статьи для отображения
 */
function showArticleModal(articleId) {
    const langKey = document.documentElement.lang || 'ru';
    if (!articlesData) {
        console.error("Данные статей не загружены.");
        return;
    }

    const articleNode = articlesData.querySelector(`article[id="${articleId}"]`);
    if (!articleNode) {
        console.error(`Статья с ID "${articleId}" не найдена.`);
        return;
    }

    const title = articleNode.querySelector(`title > ${langKey}`)?.textContent || articleNode.querySelector('title > en').textContent;
    const content = articleNode.querySelector(`content > ${langKey}`)?.textContent || articleNode.querySelector('content > en').textContent;
    
    const modalContentContainer = document.getElementById("modal-article-content");
    modalContentContainer.innerHTML = `<h1>${title}</h1>${content}`;
    
    const modal = document.getElementById("article-modal");
    modal.style.display = "flex";
}

/**
 * Закрывает модальное окно
 */
function closeModal() {
    const modal = document.getElementById("article-modal");
    modal.style.display = "none";
}

async function fetchAndCacheArticles() {
    if (articlesData) return articlesData; // Возвращаем из кэша, если уже загружено
    try {
        // ИСПРАВЛЕНИЕ: Используем абсолютный путь и параметр для сброса кэша
        const response = await fetch(`/articles.xml?v=${new Date().getTime()}`); 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.text();
        const parser = new DOMParser();
        articlesData = parser.parseFromString(data, "application/xml");
        return articlesData;
    } catch (error) {
        console.error("Ошибка при первичной загрузке XML:", error);
        return null;
    }
}

async function renderArticleCards(langKey) {
  const articlesGrid = document.querySelector(".articles-grid");
  articlesGrid.innerHTML = '';

  const xml = await fetchAndCacheArticles();
  if (!xml) {
      articlesGrid.innerHTML = `<p>Не удалось загрузить статьи. Пожалуйста, попробуйте позже.</p>`;
      return;
  }

  const articles = xml.querySelectorAll("article");
  if (articles.length === 0) {
      articlesGrid.innerHTML = `<p>Статьи пока не добавлены.</p>`;
      return;
  }
  
  const currentTranslations = translations[langKey] || translations['en'];
  const readMoreText = currentTranslations.readMore;
  const authorLabel = currentTranslations.authorLabel;

  articles.forEach(article => {
    const id = article.getAttribute("id");
    const date = article.querySelector("date").textContent;
    const author = article.querySelector(`author > ${langKey}`)?.textContent || article.querySelector('author > en').textContent;
    const title = article.querySelector(`title > ${langKey}`)?.textContent || article.querySelector('title > en').textContent;
    const excerpt = article.querySelector(`excerpt > ${langKey}`)?.textContent || article.querySelector('excerpt > en').textContent;

    const articleCard = document.createElement('div');
    articleCard.className = 'article-card';
    articleCard.innerHTML = `
      <h3>${title}</h3>
      <p class="article-meta">${authorLabel}: ${author} | ${date}</p>
      <p>${excerpt}</p>
      <button class="read-more-btn" data-id="${id}">${readMoreText}</button>
    `;
    articlesGrid.appendChild(articleCard);
  });
  
  // Добавляем обработчики событий на новые кнопки
  document.querySelectorAll('.read-more-btn').forEach(button => {
      button.addEventListener('click', (e) => {
          const articleId = e.target.dataset.id;
          showArticleModal(articleId);
      });
  });
}

function getBrowserLanguage() {
    const browserLangs = navigator.languages || [navigator.language];
    let preferredLang = 'he';
    for (const lang of browserLangs) {
        const baseLang = lang.split('-')[0];
        if (translations[baseLang]) {
            preferredLang = baseLang;
            break;
        }
    }
    return preferredLang;
}

function setLanguage(langKey) {
    if (!translations[langKey]) {
        langKey = 'he';
    }
    const langData = translations[langKey];
    document.documentElement.lang = langKey;
    document.documentElement.dir = (langKey === 'he' || langKey === 'ar') ? 'rtl' : 'ltr';

    const siteTitleElement = document.querySelector('.site-title');
    if (langKey === 'he') {
        siteTitleElement.classList.add('site-title-he');
    } else {
        siteTitleElement.classList.remove('site-title-he');
    }

    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (langData[key]) {
            element.textContent = langData[key];
        }
    });

    document.querySelectorAll('.lang-button').forEach(button => {
        button.classList.toggle('active', button.dataset.lang === langKey);
    });

    renderArticleCards(langKey);
}

function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    const newPage = document.getElementById(pageId);
    if(newPage) {
      newPage.classList.add('active');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${pageId}`);
    });
     window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('year').textContent = new Date().getFullYear();

    // Modal close logic
    const modal = document.getElementById("article-modal");
    const closeBtn = document.querySelector(".modal-close-btn");
    closeBtn.onclick = closeModal;
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };

    // Navigation logic
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            window.location.hash = pageId;
            showPage(pageId);
        });
    });

    // Language switcher logic
    document.querySelectorAll('.lang-button').forEach(button => {
        button.addEventListener('click', () => {
            setLanguage(button.dataset.lang);
        });
    });
    
    // Initial setup
    const initialPage = window.location.hash ? window.location.hash.substring(1) : 'home';
    const initialLang = getBrowserLanguage();
    
    setLanguage(initialLang);
    showPage(initialPage);

    // Back/Forward button handling
    window.addEventListener('popstate', () => {
        const pageId = window.location.hash ? window.location.hash.substring(1) : 'home';
        showPage(pageId);
    });
});
