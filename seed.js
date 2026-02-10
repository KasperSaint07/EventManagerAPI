// Seed script — заполняет базу тестовыми данными
// Запуск: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Event = require('./src/models/Event');
const Registration = require('./src/models/Registration');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventmanager';

// TEST USERS
const users = [
  { email: 'admin@eventmanager.kz', password: 'admin123', role: 'super_admin' },
  { email: 'organizer@eventmanager.kz', password: 'org123456', role: 'organizer' },
  { email: 'organizer2@eventmanager.kz', password: 'org123456', role: 'organizer' },
  { email: 'user@eventmanager.kz', password: 'user123456', role: 'user' },
  { email: 'testuser@mail.kz', password: 'test123456', role: 'user' }
];

// TEST EVENTS
const events = [
  {
    title: 'Концерт Димаша Кудайбергена',
    description: 'Грандиозный сольный концерт Димаша Кудайбергена в рамках мирового турне "Stranger". Уникальный голос, потрясающее шоу с использованием новейших технологий, живой оркестр и незабываемая атмосфера. Не упустите шанс увидеть одного из лучших вокалистов мира вживую!',
    dateTime: new Date('2026-03-15T19:00:00'),
    city: 'Алматы',
    address: 'Almaty Arena, пр. Аль-Фараби 44',
    capacity: 5000
  },
  {
    title: 'IT Conference TechConnect 2026',
    description: 'Крупнейшая IT-конференция Центральной Азии. Более 50 спикеров из Google, Microsoft, Kaspi и других ведущих компаний. Доклады по AI, Machine Learning, Cloud Computing и кибербезопасности. Networking-зона, хакатон и розыгрыш призов.',
    dateTime: new Date('2026-04-10T09:00:00'),
    city: 'Астана',
    address: 'EXPO, павильон C3',
    capacity: 2000
  },
  {
    title: 'Спектакль "Абай" — Премьера',
    description: 'Мировая премьера мюзикла «Абай» на сцене театра им. Ауэзова. Масштабная постановка о жизни великого поэта и мыслителя. Живая музыка, потрясающие декорации и костюмы. Спектакль на казахском языке с субтитрами.',
    dateTime: new Date('2026-03-22T18:30:00'),
    city: 'Алматы',
    address: 'ГАТОБ им. Абая, ул. Кабанбай батыра 110',
    capacity: 800
  },
  {
    title: 'Фестиваль уличной еды FoodFest',
    description: 'Гастрономический фестиваль с участием лучших ресторанов и стрит-фуд проектов города. Более 40 точек с едой со всего мира: корейская, итальянская, казахская, грузинская кухни. Мастер-классы от шеф-поваров, live-музыка и зона для детей.',
    dateTime: new Date('2026-05-01T12:00:00'),
    city: 'Алматы',
    address: 'Парк Первого Президента',
    capacity: 3000
  },
  {
    title: 'Мастер-класс по UI/UX дизайну',
    description: 'Интенсивный воркшоп от Senior UX Designer из Яндекса. Научитесь проектировать удобные интерфейсы, работать с Figma, проводить UX-исследования и создавать дизайн-системы. Каждый участник получит сертификат.',
    dateTime: new Date('2026-03-28T10:00:00'),
    city: 'Астана',
    address: 'SmArt.Point, ул. Сыганак 60',
    capacity: 50
  },
  {
    title: 'Концерт группы "Ninety One"',
    description: 'Долгожданный камбэк-концерт Q-Pop группы Ninety One! Новые хиты, фирменная хореография и мощная энергетика. Специальные гости — The Limba и Ирина Кайратовна. Fan-meet после концерта для VIP-билетов.',
    dateTime: new Date('2026-04-05T20:00:00'),
    city: 'Алматы',
    address: 'Дворец Республики, пл. Абая',
    capacity: 3500
  },
  {
    title: 'Startup Weekend Astana',
    description: 'Трёхдневный хакатон для начинающих предпринимателей. Собери команду, разработай MVP за 54 часа и презентуй проект перед инвесторами. Победители получат менторскую поддержку и $10,000 на развитие стартапа.',
    dateTime: new Date('2026-04-18T17:00:00'),
    city: 'Астана',
    address: 'Astana Hub, ул. Мангилик Ел 55/11',
    capacity: 200
  },
  {
    title: 'Выставка современного искусства "Кочевники"',
    description: 'Выставка работ 25 современных казахстанских художников. Инсталляции, цифровое искусство и живопись, исследующие тему номадизма в XXI веке. Кураторские экскурсии каждые два часа. Вход свободный.',
    dateTime: new Date('2026-03-20T11:00:00'),
    city: 'Алматы',
    address: 'Музей искусств им. Кастеева, ул. Сатпаева 22',
    capacity: 500
  },
  {
    title: 'Караоке-баттл "Golden Voice"',
    description: 'Самый масштабный караоке-конкурс в Казахстане! Покажи свой голос и выиграй главный приз — 1,000,000 тенге. Отборочные туры, финал с живым оркестром. Жюри — известные казахстанские музыканты. Регистрация участников до 1 апреля.',
    dateTime: new Date('2026-04-12T18:00:00'),
    city: 'Шымкент',
    address: 'КазМунайГаз Арена, ул. Тауке хана 45',
    capacity: 1500
  },
  {
    title: 'Марафон "Almaty Marathon 2026"',
    description: 'Международный городской марафон по живописным улицам Алматы. Дистанции: 5 км, 10 км, 21 км и полный марафон 42.2 км. Медали всем финишерам. Пейсмейкеры на каждой дистанции. Вода и фрукты на станциях.',
    dateTime: new Date('2026-04-20T07:00:00'),
    city: 'Алматы',
    address: 'Старт: площадь Республики',
    capacity: 10000
  },
  {
    title: 'Кинопоказ "Казахское кино: новая волна"',
    description: 'Специальный показ лучших казахстанских фильмов 2025-2026 годов. Q&A сессии с режиссёрами после каждого показа. В программе: «Жол», «Стальной характер» и «Последний кочевник». Попкорн и напитки включены.',
    dateTime: new Date('2026-03-25T16:00:00'),
    city: 'Астана',
    address: 'Kinopark 7, ТРЦ Mega Silk Way',
    capacity: 300
  },
  {
    title: 'Лекция "Искусственный интеллект и будущее"',
    description: 'Публичная лекция от профессора MIT о том, как AI изменит наш мир в ближайшие 10 лет. Темы: GPT и генеративный AI, автономные системы, AI в медицине, этика искусственного интеллекта. Синхронный перевод на казахский и русский.',
    dateTime: new Date('2026-04-08T14:00:00'),
    city: 'Астана',
    address: 'Назарбаев Университет, ауд. 301',
    capacity: 400
  },
  {
    title: 'Фестиваль электронной музыки "Nomad Beats"',
    description: 'Открытый фестиваль электронной музыки под звёздным небом. Три сцены, 20+ диджеев из Казахстана, России, Германии и Нидерландов. Фуд-корт, арт-зона и кемпинг. Хедлайнеры: Armin van Buuren, DJ Snake.',
    dateTime: new Date('2026-06-15T16:00:00'),
    city: 'Алматы',
    address: 'Медеу, горная площадка',
    capacity: 8000
  },
  {
    title: 'Детский научный фестиваль "ЭврикаFest"',
    description: 'Интерактивный научный фестиваль для детей 6-14 лет. Химические шоу, робототехника, программирование на Scratch, 3D-печать, опыты с жидким азотом. Каждый участник получит набор юного учёного.',
    dateTime: new Date('2026-05-10T10:00:00'),
    city: 'Караганда',
    address: 'Дворец культуры горняков, пр. Бухар-Жырау 47',
    capacity: 600
  },
  {
    title: 'Благотворительный гала-ужин "Жүрек"',
    description: 'Благотворительный вечер в поддержку детей с заболеваниями сердца. Аукцион произведений искусства, выступления артистов, изысканный ужин от шеф-повара. Все собранные средства будут направлены в фонд "Жүрек" на операции для детей.',
    dateTime: new Date('2026-04-25T19:00:00'),
    city: 'Алматы',
    address: 'The Ritz-Carlton, ул. Аль-Фараби 77/7',
    capacity: 250
  }
];

// SEED
async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected');

    // Clear DB
    await User.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});
    console.log('Database cleared');

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`+ ${user.email} (${user.role})`);
    }

    const organizer1 = createdUsers[1];
    const organizer2 = createdUsers[2];
    const regularUser = createdUsers[3];
    const testUser = createdUsers[4];

    // Create events
    const createdEvents = [];
    for (let i = 0; i < events.length; i++) {
      const event = await Event.create({
        ...events[i],
        createdBy: i % 2 === 0 ? organizer1._id : organizer2._id
      });
      createdEvents.push(event);
      console.log(`+ ${event.title} (${event.city})`);
    }

    // Create registrations
    const registrations = [
      { userId: regularUser._id, eventId: createdEvents[0]._id },
      { userId: regularUser._id, eventId: createdEvents[1]._id },
      { userId: regularUser._id, eventId: createdEvents[5]._id },
      { userId: testUser._id, eventId: createdEvents[0]._id },
      { userId: testUser._id, eventId: createdEvents[9]._id },
      { userId: testUser._id, eventId: createdEvents[12]._id },
    ];

    for (const regData of registrations) {
      await Registration.create(regData);
    }

    console.log(`\nDone! Users: ${createdUsers.length}, Events: ${createdEvents.length}, Registrations: ${registrations.length}`);
    console.log('\nTest accounts:');
    console.log('  Admin:     admin@eventmanager.kz     / admin123');
    console.log('  Organizer: organizer@eventmanager.kz / org123456');
    console.log('  User:      user@eventmanager.kz      / user123456');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();
